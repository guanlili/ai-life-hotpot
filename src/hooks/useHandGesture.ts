/**
 * 手势检测 Hook（只负责检测，不含游戏逻辑）
 *
 * 来源参考 /home/samsong/Desktop/maybe/mediapipe/learn/scripts/hotpot_demo.py：
 *   - 4 根非拇指指尖 y < PIP y - 0.02 → 指伸直
 *   - |thumb_tip.x - index_mcp.x| > 0.08 → 拇伸直
 *   - n_open >= 4 → "open"，n_open <= 1 → "fist"，否则 "trans"
 *
 * 帧驱动：调用方在动画帧里把 video 喂进来，hook 会自动起检测循环。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

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

  // 初始化 detector
  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
        const det = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
        if (mounted) {
          detectorRef.current = det;
          setReady(true);
        }
      } catch (e) {
        if (mounted) {
          setError("无法初始化手势检测，请刷新页面重试");
          console.error("[gesture] init failed", e);
        }
      }
    })();
    return () => {
      mounted = false;
      setReady(false);
      const det = detectorRef.current;
      detectorRef.current = null;
      if (det) det.close();
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
          const raw = detectRaw(lm);
          const g = filterRef.current.push(raw);
          onSampleRef.current?.({
            gesture: g,
            x: 1 - lm[0].x,
            y: lm[0].y,
            detected: true,
          });
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

  const requestCamera = useCallback(async (): Promise<boolean> => {
    if (!video) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      await video.play();
      return true;
    } catch (e) {
      console.error("[gesture] camera failed", e);
      return false;
    }
  }, [video]);

  return { ready, error, requestCamera };
}

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
