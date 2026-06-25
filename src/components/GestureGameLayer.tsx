/**
 * 手势游戏层（纯展示 + 调度）
 *
 * 职责：
 *   - 摄像头预览（含骨架绘制）
 *   - 虚拟光标
 *   - 食材渲染（位置由 foods prop 决定）
 *
 * 不持有游戏状态——所有 foods/cursor/phase 都从外部传入，
 * 这样 play.tsx 可以把食材位置和 ings 业务逻辑放在一起管理。
 */

import { useEffect, useRef, useState } from "react";
import { useHandGesture, type GestureState } from "@/hooks/useHandGesture";
import type { GestureFood } from "@/hooks/useGestureGame";
import { FoodGlyph } from "@/components/hotpot-art";
import { useIsPortrait } from "@/hooks/use-mobile";

interface GestureGameLayerProps {
  enabled: boolean;
  /** 食材列表（位置动态） */
  foods: GestureFood[];
  /** 抓取中的食材 id（用于高亮） */
  grabbedId: string | null;
  /** 当前手势（用于光标颜色） */
  gesture: GestureState;
  /** 当前光标（游戏画布坐标） */
  cursor: { x: number; y: number };
  /** 帧驱动回调：每帧手部位置（归一化）+ 手势 */
  onHandSample: (s: { x: number; y: number; detected: boolean; gesture: GestureState }) => void;
  /** 显示引导 */
  showGuide: boolean;
  onCloseGuide: () => void;
}

const GAME_W = 1280;
const GAME_H = 720;
const CURSOR_SIZE = 40;

export function GestureGameLayer({
  enabled,
  foods,
  grabbedId,
  gesture,
  cursor,
  onHandSample,
  showGuide,
  onCloseGuide,
}: GestureGameLayerProps) {
  const isPortrait = useIsPortrait();
  const camW = isPortrait ? 120 : 320;
  const camH = isPortrait ? 90 : 240;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  // 摄像头
  useEffect(() => {
    if (!enabled || !videoRef.current) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (cancelled || !videoRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        await videoRef.current.play();
        setCamReady(true);
      } catch (e) {
        console.error("[layer] camera failed", e);
        setCamError("无法访问摄像头");
      }
    })();
    return () => {
      cancelled = true;
      setCamReady(false);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [enabled]);

  const { ready: modelReady } = useHandGesture({
    video: videoRef.current,
    enabled: enabled && camReady,
    onSample: (s) => {
      onHandSample({ x: s.x, y: s.y, detected: s.detected, gesture: s.gesture });
    },
  });

  useEffect(() => {
    if (modelReady) setLoadingModel(false);
  }, [modelReady]);

  // 视频帧 → canvas（每帧重画，保证预览始终可见）
  useEffect(() => {
    if (!enabled || !camReady) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (canvas.width !== camW) canvas.width = camW;
    if (canvas.height !== camH) canvas.height = camH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const draw = () => {
      if (video.readyState >= 2) {
        ctx.clearRect(0, 0, camW, camH);
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -camW, 0, camW, camH);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [enabled, camReady, camW, camH]);

  if (!enabled) return null;

  return (
    <>
      {/* 食物：被抓取的画在光标上 */}
      {foods.map((f) => (
        <div
          key={f.id}
          style={{
            position: "absolute",
            left: f.x - 30,
            top: f.y - 30,
            width: 60,
            height: 60,
            pointerEvents: "none",
            transform: f.grabbed ? "scale(0.85)" : "scale(1)",
            transition: f.grabbed ? "none" : "transform 0.2s ease",
            zIndex: 80,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              filter: f.grabbed ? "drop-shadow(0 0 8px rgba(255,200,0,0.8))" : "none",
            }}
          >
            <FoodGlyph name={f.food} />
          </div>
          {f.grabbed && (
            <div
              style={{
                position: "absolute",
                top: -22,
                left: "50%",
                transform: "translateX(-50%)",
                color: "#ffc800",
                fontSize: 11,
                fontWeight: "bold",
                textShadow: "0 1px 2px #000",
                whiteSpace: "nowrap",
              }}
            >
              拿着 {f.name}
            </div>
          )}
        </div>
      ))}

      {/* 视频/canvas 元素始终挂载，保证 MediaPipe 视频引用不丢 */}
      <video
        ref={videoRef}
        style={{
          position: "fixed",
          left: -9999,
          top: -9999,
          width: 640,
          height: 480,
          opacity: 0,
          pointerEvents: "none",
        }}
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          left: -9999,
          top: -9999,
          opacity: 0,
          pointerEvents: "none",
        }}
        width={camW}
        height={camH}
      />

      {/* 摄像头预览面板 — 可折叠 */}
      <div
        style={{
          position: "absolute",
          right: isPortrait ? 16 : 20,
          bottom: isPortrait ? 130 : 20,
          zIndex: 150,
        }}
      >
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            title="展开摄像头预览"
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              border: `2px solid ${gestureColor(gesture)}`,
              background: "rgba(0,0,0,0.75)",
              color: gestureColor(gesture),
              fontSize: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 12px ${gestureColor(gesture)}40`,
            }}
          >
            📷
          </button>
        ) : (
          <div
            style={{
              background: "rgba(0, 0, 0, 0.75)",
              borderRadius: 12,
              padding: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
              <button
                onClick={() => setCollapsed(true)}
                title="折叠"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "#aaa",
                  cursor: "pointer",
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  fontSize: 14,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>
            {camError ? (
              <div
                style={{
                  width: camW,
                  height: camH,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#1a1a1a",
                  borderRadius: 8,
                  color: "#ff6666",
                  padding: 16,
                  textAlign: "center",
                }}
              >
                {camError}
              </div>
            ) : (
              <PreviewCanvas video={videoRef.current} ready={camReady} width={camW} height={camH} />
            )}
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#aaa",
                fontSize: 12,
              }}
            >
              <span>手势模式 {loadingModel ? "（加载模型中...）" : ""}</span>
              <span style={{ color: gestureColor(gesture) }}>{gestureLabel(gesture)}</span>
            </div>
          </div>
        )}
      </div>

      {/* 虚拟光标（始终显示） */}
      <div
        style={{
          position: "absolute",
          left: cursor.x - CURSOR_SIZE / 2,
          top: cursor.y - CURSOR_SIZE / 2,
          width: CURSOR_SIZE,
          height: CURSOR_SIZE,
          borderRadius: "50%",
          border: `3px solid ${gestureColor(gesture)}`,
          boxShadow: `0 0 12px ${gestureColor(gesture)}80`,
          pointerEvents: "none",
          zIndex: 90,
          transition: "border-color 0.15s",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "30%",
            background: gestureColor(gesture),
            borderRadius: "50%",
            opacity: 0.6,
          }}
        />
      </div>

      {/* 引导弹窗 */}
      {showGuide && (
        <div
          onClick={onCloseGuide}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "32px 40px",
              maxWidth: 480,
              textAlign: "center",
              color: "#333",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>手势投料玩法</h2>
            <p>
              👋 <b>伸出手</b>：摄像头识别后，光标跟随手腕
            </p>
            <p>
              ✊ <b>握拳</b>：抓取光标处的食材（食材会跟手）
            </p>
            <p>
              🖐️ <b>张开</b>：在锅里→投放成功；不在锅里→回归原位
            </p>
            <button
              onClick={onCloseGuide}
              style={{
                marginTop: 16,
                padding: "10px 28px",
                background: "#b4382b",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
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

function gestureColor(g: GestureState): string {
  if (g === "open") return "#00ff00";
  if (g === "fist") return "#ff8800";
  if (g === "trans") return "#ffaa00";
  return "#888";
}

function gestureLabel(g: GestureState): string {
  if (g === "open") return "🖐 张开";
  if (g === "fist") return "✊ 握拳";
  if (g === "trans") return "过渡";
  return "✋ 请出手";
}

/** 独立可见 canvas，从离屏 video 拷贝帧 */
function PreviewCanvas({
  video,
  ready,
  width,
  height,
}: {
  video: HTMLVideoElement | null;
  ready: boolean;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ready || !video || !canvasRef.current) return;
    const canvas = canvasRef.current;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const draw = () => {
      if (video.readyState >= 2) {
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -width, 0, width, height);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ready, video, width, height]);
  return (
    <div
      style={{
        width,
        height,
        background: "#1a1a1a",
        borderRadius: 8,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasRef} style={{ width, height, borderRadius: 8, display: "block" }} />
      {!ready && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
