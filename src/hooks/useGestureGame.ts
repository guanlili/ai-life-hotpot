/**
 * 手势投料游戏状态 Hook（数据驱动版）
 *
 * 设计原则：
 *   - foods 是动态位置（被抓住时跟手走）
 *   - 光标是绝对位置（手部坐标）
 *   - 单个 useState 管 foods，grabbed 仅是该对象的标志位
 *   - 释放/投放逻辑都在这里；外部只关心"投进了谁"
 */

import { useCallback, useRef, useState } from "react";
import type { GestureState } from "./useHandGesture";

export interface GestureFood {
  id: string;
  name: string;
  food: string;
  kind: "meat" | "veg";
  x: number;
  y: number;
  originX: number;
  originY: number;
  grabbed: boolean;
}

export type GamePhase = "IDLE" | "GRABBED";

export interface DropResult {
  foodId: string;
  food: GestureFood;
  dropped: boolean;
}

export interface UseGestureGameOptions {
  initialFoods: GestureFood[];
  gameW: number;
  gameH: number;
  hotpotX: number;
  hotpotY: number;
  hotpotR: number;
  grabR?: number;
  onDropped?: (r: DropResult) => void;
}

export interface GestureGameAPI {
  foods: GestureFood[];
  cursor: { x: number; y: number };
  phase: GamePhase;
  grabbedId: string | null;
  moveCursor: (x: number, y: number) => void;
  feedGesture: (g: GestureState) => void;
  resetFood: (id: string) => void;
  resetAll: () => void;
}

export function useGestureGame(opts: UseGestureGameOptions): GestureGameAPI {
  const {
    initialFoods,
    gameW,
    gameH,
    hotpotX,
    hotpotY,
    hotpotR,
    grabR = 55,
    onDropped,
  } = opts;

  const [foods, setFoods] = useState<GestureFood[]>(initialFoods);
  const [cursor, setCursor] = useState({ x: gameW / 2, y: gameH / 2 });
  const [phase, setPhase] = useState<GamePhase>("IDLE");
  const lastGestureRef = useRef<GestureState>("none");
  const onDroppedRef = useRef(onDropped);
  onDroppedRef.current = onDropped;

  const grabbedId = foods.find((f) => f.grabbed)?.id ?? null;

  // 帧驱动：更新光标；GRABBED 时让被抓住的食物跟手
  const moveCursor = useCallback(
    (x: number, y: number) => {
      const cx = clamp(x, 20, gameW - 20);
      const cy = clamp(y, 20, gameH - 20);
      setCursor({ x: cx, y: cy });
      setFoods((prev) =>
        prev.map((f) => (f.grabbed ? { ...f, x: cx, y: cy } : f)),
      );
    },
    [gameW, gameH],
  );

  // 帧驱动：处理握拳→抓，张开→放
  const feedGesture = useCallback(
    (g: GestureState) => {
      const last = lastGestureRef.current;
      // IDLE + 握拳 → 尝试抓最近的食物
      if (phase === "IDLE" && g === "fist" && last !== "fist") {
        let bestId: string | null = null;
        let bestDist = Infinity;
        for (const f of foods) {
          if (f.grabbed) continue;
          const d = Math.hypot(cursor.x - f.x, cursor.y - f.y);
          if (d < grabR && d < bestDist) {
            bestId = f.id;
            bestDist = d;
          }
        }
        if (bestId) {
          setFoods((prev) =>
            prev.map((f) =>
              f.id === bestId ? { ...f, grabbed: true, x: cursor.x, y: cursor.y } : f,
            ),
          );
          setPhase("GRABBED");
        }
      }
      // GRABBED + 张开 → 投放或回归原位
      else if (phase === "GRABBED" && g === "open" && last === "fist") {
        const target = foods.find((f) => f.grabbed);
        if (!target) {
          setPhase("IDLE");
          lastGestureRef.current = g;
          return;
        }
        const distPot = Math.hypot(cursor.x - hotpotX, cursor.y - hotpotY);
        const dropped = distPot < hotpotR + 10;
        if (dropped) {
          const newPos = spawnOne(gameW, gameH, hotpotX, hotpotY, hotpotR);
          setFoods((prev) =>
            prev.map((f) =>
              f.id === target.id
                ? { ...f, grabbed: false, x: newPos.x, y: newPos.y, originX: newPos.x, originY: newPos.y }
                : f,
            ),
          );
          onDroppedRef.current?.({ foodId: target.id, food: target, dropped: true });
        } else {
          setFoods((prev) =>
            prev.map((f) =>
              f.id === target.id
                ? { ...f, grabbed: false, x: f.originX, y: f.originY }
                : f,
            ),
          );
          onDroppedRef.current?.({ foodId: target.id, food: target, dropped: false });
        }
        setPhase("IDLE");
      }
      lastGestureRef.current = g;
    },
    [phase, foods, cursor, grabR, gameW, gameH, hotpotX, hotpotY, hotpotR],
  );

  const resetFood = useCallback((id: string) => {
    setFoods((prev) =>
      prev.map((f) => (f.id === id ? { ...f, grabbed: false, x: f.originX, y: f.originY } : f)),
    );
  }, []);

  const resetAll = useCallback(() => {
    setFoods(initialFoods.map((f) => ({ ...f, grabbed: false })));
    setPhase("IDLE");
  }, [initialFoods]);

  return { foods, cursor, phase, grabbedId, moveCursor, feedGesture, resetFood, resetAll };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function spawnOne(
  gameW: number,
  gameH: number,
  hotpotX: number,
  hotpotY: number,
  hotpotR: number,
): { x: number; y: number } {
  const margin = 80;
  const safeR = hotpotR + 60;
  for (let i = 0; i < 60; i++) {
    const x = margin + Math.random() * (gameW * 0.5 - margin - 60);
    const y = margin + Math.random() * (gameH - margin * 2);
    if (Math.hypot(x - hotpotX, y - hotpotY) > safeR) return { x, y };
  }
  return { x: margin + 40, y: margin + 40 };
}
