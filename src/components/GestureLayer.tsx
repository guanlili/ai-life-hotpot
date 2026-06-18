/**
 * 手势展示层（纯展示 + 调度，不持有游戏状态）。
 *
 * 职责：开一路摄像头 → 喂给 useHandGesture 检测 → 把每帧样本回调出去；
 * 渲染虚拟光标、被抓取的食材（跟手）、可折叠的摄像头预览、首次引导。
 * 抓取/投放的业务状态由父层（useGesturePickup）持有，这里只画。
 */

import { useEffect, useRef, useState } from "react";
import { useHandGesture, type GestureState, type HandSample } from "@/hooks/useHandGesture";
import { RealFoodVisual } from "@/components/food-visual";

const CAM_W = 240;
const CAM_H = 180;
const CURSOR = 42;

interface GestureLayerProps {
  enabled: boolean;
  cursor: { x: number; y: number };
  gesture: GestureState;
  /** 当前被抓住的食材（跟随光标渲染）；未抓取为 null */
  grabbed: { food: string; name: string } | null;
  onSample: (s: HandSample) => void;
  onError?: (msg: string) => void;
  showGuide: boolean;
  onCloseGuide: () => void;
}

export function GestureLayer({
  enabled,
  cursor,
  gesture,
  grabbed,
  onSample,
  onError,
  showGuide,
  onCloseGuide,
}: GestureLayerProps) {
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // 单一摄像头：本层独占，组件卸载即释放
  useEffect(() => {
    if (!enabled || !videoEl) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        videoEl.srcObject = stream;
        videoEl.muted = true;
        videoEl.playsInline = true;
        await videoEl.play();
        setCamReady(true);
      } catch (e) {
        console.error("[gesture] camera failed", e);
        setCamError("无法访问摄像头");
        onError?.("无法访问摄像头");
      }
    })();
    return () => {
      cancelled = true;
      setCamReady(false);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [enabled, videoEl, onError]);

  const { ready: modelReady, error: modelError } = useHandGesture({
    video: videoEl,
    enabled: enabled && camReady,
    onSample,
  });

  useEffect(() => {
    if (modelError) onError?.(modelError);
  }, [modelError, onError]);

  if (!enabled) return null;

  const loading = !camError && !modelError && !modelReady;

  return (
    <>
      {/* 离屏 video：供检测与预览取帧 */}
      <video
        ref={setVideoEl}
        style={{ position: "fixed", left: -9999, top: -9999, width: 2, height: 2, opacity: 0 }}
        muted
        playsInline
      />

      {/* 被抓住的食材：跟随光标 */}
      {grabbed && (
        <div
          style={{
            position: "absolute",
            left: cursor.x,
            top: cursor.y,
            width: 76,
            height: 76,
            transform: "translate(-50%,-50%) scale(.9)",
            pointerEvents: "none",
            zIndex: 95,
            filter: "drop-shadow(0 0 10px rgba(255,200,80,.85))",
          }}
        >
          <RealFoodVisual food={grabbed.food} size={76} />
          <div
            style={{
              position: "absolute",
              top: -20,
              left: "50%",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
              fontSize: 12,
              fontWeight: 700,
              color: "#ffce5a",
              textShadow: "0 1px 3px rgba(0,0,0,.6)",
            }}
          >
            拿着 {grabbed.name}
          </div>
        </div>
      )}

      {/* 虚拟光标 */}
      <div
        style={{
          position: "absolute",
          left: cursor.x - CURSOR / 2,
          top: cursor.y - CURSOR / 2,
          width: CURSOR,
          height: CURSOR,
          borderRadius: "50%",
          border: `3px solid ${gestureColor(gesture)}`,
          boxShadow: `0 0 14px ${gestureColor(gesture)}88`,
          pointerEvents: "none",
          zIndex: 96,
          transition: "border-color .15s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "32%",
            borderRadius: "50%",
            background: gestureColor(gesture),
            opacity: 0.6,
          }}
        />
      </div>

      {/* 摄像头预览（可折叠） */}
      <div style={{ position: "absolute", right: 20, bottom: 20, zIndex: 150 }}>
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            title="展开摄像头预览"
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              border: `2px solid ${gestureColor(gesture)}`,
              background: "rgba(0,0,0,.72)",
              color: gestureColor(gesture),
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            📷
          </button>
        ) : (
          <div
            style={{
              background: "rgba(0,0,0,.72)",
              borderRadius: 12,
              padding: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,.4)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
              <button
                onClick={() => setCollapsed(true)}
                title="折叠"
                style={{
                  background: "rgba(255,255,255,.1)",
                  border: "none",
                  color: "#bbb",
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
            {camError ? (
              <div
                style={{
                  width: CAM_W,
                  height: CAM_H,
                  display: "grid",
                  placeItems: "center",
                  background: "#1a1a1a",
                  borderRadius: 8,
                  color: "#ff7676",
                  fontSize: 13,
                  textAlign: "center",
                  padding: 12,
                }}
              >
                {camError}
              </div>
            ) : (
              <PreviewCanvas video={videoEl} ready={camReady} />
            )}
            <div
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "space-between",
                color: "#bbb",
                fontSize: 12,
              }}
            >
              <span>手势模式{loading ? "（加载中…）" : ""}</span>
              <span style={{ color: gestureColor(gesture) }}>{gestureLabel(gesture)}</span>
            </div>
          </div>
        )}
      </div>

      {/* 首次引导 */}
      {showGuide && (
        <div
          onClick={onCloseGuide}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            display: "grid",
            placeItems: "center",
            zIndex: 200,
            cursor: "pointer",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#f7f0df",
              borderRadius: 16,
              padding: "30px 40px",
              maxWidth: 460,
              textAlign: "center",
              color: "#2c2418",
              cursor: "default",
            }}
          >
            <h2 style={{ marginTop: 0, fontFamily: "'Noto Serif SC',serif" }}>隔空投料玩法</h2>
            <p>👋 伸出手：光标跟随你的手腕</p>
            <p>✊ 握拳：抓起光标处的食材</p>
            <p>🖐️ 张开：在锅上松手即下锅，锅外则放回</p>
            <button
              onClick={onCloseGuide}
              style={{
                marginTop: 14,
                padding: "10px 30px",
                background: "#b4382b",
                color: "#f4eddd",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                letterSpacing: ".1em",
                cursor: "pointer",
              }}
            >
              开始
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function PreviewCanvas({ video, ready }: { video: HTMLVideoElement | null; ready: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ready || !video) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CAM_W;
    canvas.height = CAM_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const draw = () => {
      if (video.readyState >= 2) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -CAM_W, 0, CAM_W, CAM_H);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ready, video]);
  return (
    <div
      style={{
        width: CAM_W,
        height: CAM_H,
        background: "#1a1a1a",
        borderRadius: 8,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <canvas ref={canvasRef} style={{ width: CAM_W, height: CAM_H, display: "block" }} />
      {!ready && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "#888",
            fontSize: 12,
          }}
        >
          启动摄像头中…
        </div>
      )}
    </div>
  );
}

function gestureColor(g: GestureState): string {
  if (g === "open") return "#3ddc6b";
  if (g === "fist") return "#ff8c2e";
  if (g === "trans") return "#ffba3a";
  return "#9a8763";
}

function gestureLabel(g: GestureState): string {
  if (g === "open") return "🖐 张开";
  if (g === "fist") return "✊ 握拳";
  if (g === "trans") return "过渡";
  return "✋ 请出手";
}
