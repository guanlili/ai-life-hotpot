/**
 * 手势抓取状态机（与具体渲染解耦）。
 *
 * 流程：伸手→光标跟手腕；握拳(边沿)→抓住光标最近的食材盘；张开→在锅内则投放(onDrop)，否则放弃。
 * 释放只看 phase===GRABBED && 当前为 "open"，不依赖"上一帧恰好是 fist"，
 * 避免握拳→张开中间经过 "trans" 导致投不下去。
 *
 * 只暴露 cursor / grabbedId / gesture 给视图；抓取的是哪盘食材由调用方按 id 自行高亮。
 */

import { useCallback, useRef, useState } from "react";
import type { GestureState, HandSample } from "./useHandGesture";

export interface PickupPlate {
  id: string;
  x: number;
  y: number;
}

interface UseGesturePickupOpts {
  /** 食材盘位置（游戏画布坐标，与渲染一致） */
  plates: PickupPlate[];
  gameW: number;
  gameH: number;
  potX: number;
  potY: number;
  /** 投放命中半径 */
  potR: number;
  /** 抓取吸附半径 */
  grabR?: number;
  onDrop: (id: string) => void;
}

export function useGesturePickup({
  plates,
  gameW,
  gameH,
  potX,
  potY,
  potR,
  grabR = 90,
  onDrop,
}: UseGesturePickupOpts) {
  const [cursor, setCursor] = useState({ x: potX, y: potY });
  const [grabbedId, setGrabbedId] = useState<string | null>(null);
  const [gesture, setGesture] = useState<GestureState>("none");

  const cursorRef = useRef(cursor);
  const grabbedRef = useRef<string | null>(null);
  // 用 ref 持有最新输入，让 onSample 保持稳定身份（不随每帧 cursor 变化重建）
  const platesRef = useRef(plates);
  platesRef.current = plates;
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  const onSample = useCallback(
    (s: HandSample) => {
      setGesture(s.gesture);

      if (s.detected) {
        const c = {
          x: clamp(s.x * gameW, 20, gameW - 20),
          y: clamp(s.y * gameH, 20, gameH - 20),
        };
        cursorRef.current = c;
        setCursor(c);
      }

      const c = cursorRef.current;
      // 抓取：空手 + 握拳，吸附最近且在半径内的食材盘
      if (!grabbedRef.current && s.gesture === "fist") {
        let best: string | null = null;
        let bestD = grabR;
        for (const p of platesRef.current) {
          const d = Math.hypot(c.x - p.x, c.y - p.y);
          if (d < bestD) {
            best = p.id;
            bestD = d;
          }
        }
        if (best) {
          grabbedRef.current = best;
          setGrabbedId(best);
        }
      }
      // 释放：已抓 + 张开 → 锅内投放，否则放弃
      else if (grabbedRef.current && s.gesture === "open") {
        const id = grabbedRef.current;
        if (Math.hypot(c.x - potX, c.y - potY) < potR) onDropRef.current(id);
        grabbedRef.current = null;
        setGrabbedId(null);
      }
    },
    [gameW, gameH, potX, potY, potR, grabR],
  );

  return { cursor, grabbedId, gesture, onSample };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
