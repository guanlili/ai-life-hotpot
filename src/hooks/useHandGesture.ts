/**
 * 手势检测 Hook（只负责检测，不含游戏逻辑）。
 *
 * 判定规则：
 *   - 4 根非拇指指尖 y < 对应 PIP y - 0.02 → 该指伸直
 *   - |thumb_tip.x - index_mcp.x| > 0.08 → 拇指伸直
 *   - n_open >= 4 → "open"，n_open <= 1 → "fist"，否则 "trans"
 *   - 再过一个 5 帧多数投票滤波，避免抖动
 *
 * 帧驱动：调用方传入 <video>，hook 在 rAF 里持续检测并回调 onSample。
 * 资源（wasm + 模型）走固定版本 CDN；失败时 onError，调用方回落到鼠标点击。
 */

import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// 固定版本，避免 @latest 不可复现。如需现场离线，把 wasm 目录与模型放进 public/ 并改这两个常量即可。
const MP_VERSION = "0.10.35";
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export type GestureState = "open" | "fist" | "trans" | "none";

export interface HandSample {
  gesture: GestureState;
  /** 归一化 0..1 坐标，已镜像为"用户视角" */
  x: number;
  y: number;
  detected: boolean;
}

interface UseHandGestureOpts {
  video: HTMLVideoElement | null;
  enabled: boolean;
  onSample?: (s: HandSample) => void;
}

export function useHandGesture({ video, enabled, onSample }: UseHandGestureOpts) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detectorRef = useRef<HandLandmarker | null>(null);
  const filterRef = useRef(new GestureFilter());
  const rafRef = useRef(0);
  const onSampleRef = useRef(onSample);
  onSampleRef.current = onSample;

  // 初始化 detector（GPU 失败回退 CPU）
  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
        const create = (delegate: "GPU" | "CPU") =>
          HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate },
            runningMode: "VIDEO",
            numHands: 1,
          });
        let det: HandLandmarker;
        try {
          det = await create("GPU");
        } catch {
          det = await create("CPU");
        }
        if (mounted) {
          detectorRef.current = det;
          setReady(true);
        } else {
          det.close();
        }
      } catch (e) {
        if (mounted) {
          setError("无法初始化手势检测，请检查网络或刷新重试");
          console.error("[gesture] init failed", e);
        }
      }
    })();
    return () => {
      mounted = false;
      setReady(false);
      const det = detectorRef.current;
      detectorRef.current = null;
      det?.close();
    };
  }, [enabled]);

  // 帧驱动检测
  useEffect(() => {
    if (!enabled || !ready || !video) return;

    const detect = () => {
      const det = detectorRef.current;
      if (!det) return;
      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }
      try {
        const r = det.detectForVideo(video, performance.now());
        if (r.landmarks && r.landmarks.length > 0) {
          const lm = r.landmarks[0];
          const g = filterRef.current.push(detectRaw(lm));
          onSampleRef.current?.({ gesture: g, x: 1 - lm[0].x, y: lm[0].y, detected: true });
        } else {
          onSampleRef.current?.({ gesture: "none", x: 0, y: 0, detected: false });
        }
      } catch (e) {
        console.error("[gesture] detect error", e);
      }
      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, ready, video]);

  return { ready, error };
}

/** 5 帧多数投票，open/fist 需至少出现 3 次才认定，否则沿用最近原始值。 */
class GestureFilter {
  private buf: GestureState[] = [];
  private readonly size = 5;

  push(g: GestureState): GestureState {
    this.buf.push(g);
    if (this.buf.length > this.size) this.buf.shift();
    const cnt: Record<string, number> = {};
    for (const x of this.buf) cnt[x] = (cnt[x] ?? 0) + 1;
    for (const k of ["open", "fist"] as const) {
      if ((cnt[k] ?? 0) >= 3) return k;
    }
    return this.buf[this.buf.length - 1] ?? "none";
  }
}

function detectRaw(lm: { x: number; y: number }[]): GestureState {
  const TIPS = [8, 12, 16, 20];
  const PIPS = [6, 10, 14, 18];
  const fingersUp = TIPS.filter((t, i) => lm[t].y < lm[PIPS[i]].y - 0.02).length;
  const thumbUp = Math.abs(lm[4].x - lm[5].x) > 0.08 ? 1 : 0;
  const n = fingersUp + thumbUp;
  if (n >= 4) return "open";
  if (n <= 1) return "fist";
  return "trans";
}
