import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Stage } from "@/components/Stage";
import { Silhouette } from "@/components/hotpot-art";
import { loadSession, saveSession } from "@/lib/session";
import { recognizePhoto, parsePhotoFeatures } from "@/lib/llm";
import { useIsPortrait } from "@/hooks/use-mobile";

export const Route = createFileRoute("/capture")({
  head: () => ({
    meta: [
      { title: "拍一张 · AI 人生火锅" },
      { name: "description", content: "开场拍照，AI 会从你身上读取气质与状态。" },
    ],
  }),
  component: Capture,
});

const serif = "'Noto Serif SC',serif";

const FEATURES = [
  { k: "整体气质", v: "从容" },
  { k: "服饰风格", v: "简约利落" },
  { k: "主色印象", v: "暖灰调" },
  { k: "现场状态", v: "好奇而专注" },
];

// 摄像头错误按 DOMException 名称映射成中文 + 引导,取代裸露的英文技术信息
function describeCameraError(e: unknown): string {
  const name = (e as { name?: string })?.name ?? "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "摄像头未授权。请在浏览器地址栏允许摄像头权限后重试。";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "没有找到可用的摄像头。";
  if (name === "NotReadableError") return "摄像头被其他程序占用，请关闭后重试。";
  return "无法打开摄像头，可直接跳过这一步。";
}

const btn: CSSProperties = {
  border: "none",
  cursor: "pointer",
  padding: "14px 50px",
  borderRadius: 6,
  background: "#b4382b",
  color: "#f4eddd",
  fontFamily: serif,
  fontWeight: 700,
  fontSize: 20,
  letterSpacing: ".2em",
  boxShadow: "0 10px 24px rgba(150,40,30,.4)",
};
const btnGhost: CSSProperties = {
  ...btn,
  background: "transparent",
  color: "#9a6b3a",
  boxShadow: "none",
  border: "1.5px solid rgba(154,107,58,.5)",
};

function Bracket({ pos, isPortrait }: { pos: "tl" | "tr" | "bl" | "br"; isPortrait?: boolean }) {
  const base: CSSProperties = { position: "absolute", width: isPortrait ? 20 : 30, height: isPortrait ? 20 : 30 };
  const offset = isPortrait ? 24 : 40;
  const map: Record<string, CSSProperties> = {
    tl: { left: offset, top: offset, borderLeft: "2px solid #d9c79a", borderTop: "2px solid #d9c79a" },
    tr: { right: offset, top: offset, borderRight: "2px solid #d9c79a", borderTop: "2px solid #d9c79a" },
    bl: {
      left: offset,
      bottom: offset,
      borderLeft: "2px solid #d9c79a",
      borderBottom: "2px solid #d9c79a",
    },
    br: {
      right: offset,
      bottom: offset,
      borderRight: "2px solid #d9c79a",
      borderBottom: "2px solid #d9c79a",
    },
  };
  return <div style={{ ...base, ...map[pos] }} />;
}


function Capture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  // 标记本组件是否已卸载(导航离开等):卸载后不再 setState,避免 React 警告。
  // 注意:识别结果仍会写回 session(见 snap 的 .then),不丢失拍照成果。
  const abortedRef = useRef(false);
  const navigate = useNavigate();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [captured, setCaptured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);
  const [reading, setReading] = useState(false);
  const [features, setFeatures] = useState<{ k: string; v: string }[]>(
    FEATURES.map((f) => ({ ...f })),
  );

  useEffect(() => {
    if (!requested) return; // 进页不立即请求，等用户点「允许摄像头」
    let active = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch((e) => setError(describeCameraError(e)));
    return () => {
      active = false;
    };
  }, [requested]);

  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  useEffect(() => () => {
    abortedRef.current = true;
  }, []);

  const snap = () => {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL("image/jpeg", 0.7);
    setPhoto(dataUrl);
    setCaptured(true);
    setFeatures(FEATURES.map((f) => ({ k: f.k, v: "" })));
    // 用 minimax-m3 流式识别人物特征,边出边填 4 个标签;无 key/失败回落默认
    setReading(true);
    recognizePhoto(dataUrl, (full) => {
      if (abortedRef.current) return;
      const p = parsePhotoFeatures(full);
      setFeatures(FEATURES.map((f) => ({ k: f.k, v: p[f.k] || "" })));
    })
      .then((finalText) => {
        const p = parsePhotoFeatures(finalText);
        const feats = FEATURES.map((f) => ({ k: f.k, v: p[f.k] || f.v }));
        if (!abortedRef.current) setFeatures(feats);
        const txt = feats.map((f) => `${f.k}:${f.v}`).join(" ");
        saveSession({ ...loadSession(), photoFeatures: txt || undefined });
      })
      .finally(() => {
        if (!abortedRef.current) setReading(false);
      });
  };

  const next = () => {
    saveSession({ ...loadSession(), photo: photo ?? undefined });
    navigate({ to: "/play" });
  };
  const skip = () => {
    saveSession({ ...loadSession(), photo: undefined });
    navigate({ to: "/play" });
  };

  const isPortrait = useIsPortrait();

  const renderContent = () => {
    const frameSize = isPortrait ? 260 : 360;
    
    return (
      <div style={isPortrait ? {
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        padding: "24px 20px 80px",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
        position: "relative",
      } : undefined}>
        {/* 标题 */}
        <div
          style={isPortrait ? {
            textAlign: "center",
            marginTop: 10,
            animation: "lhFade .5s ease both",
          } : {
            position: "absolute",
            top: 50,
            left: 0,
            right: 0,
            textAlign: "center",
            animation: "lhFade .5s ease both",
          }}
        >
          <div
            style={{
              fontFamily: serif,
              fontWeight: 900,
              fontSize: isPortrait ? 30 : 44,
              letterSpacing: ".1em",
              color: "#2c2418",
            }}
          >
            AI 人生火锅
          </div>
          <div style={{ fontSize: isPortrait ? 11 : 13, letterSpacing: ".5em", color: "#9a6b3a", marginTop: 6 }}>
            你 的 人 生 · 由 你 来 涮
          </div>
          <div
            style={{
              width: 70,
              height: 2,
              margin: "12px auto 0",
              background: "linear-gradient(90deg,transparent,#b4382b,transparent)",
            }}
          />
        </div>

        {/* 取景框 */}
        <div
          style={isPortrait ? {
            position: "relative",
            width: frameSize,
            height: frameSize,
            borderRadius: "50%",
            background: "radial-gradient(circle at 50% 38%,#2a2218,#171009)",
            boxShadow:
              "0 16px 40px rgba(0,0,0,.4), inset 0 0 0 8px rgba(154,123,74,.4), inset 0 0 30px rgba(0,0,0,.6)",
            overflow: "hidden",
            margin: "24px auto",
          } : {
            position: "absolute",
            left: 640,
            top: 360,
            transform: "translate(-50%,-50%)",
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "radial-gradient(circle at 50% 38%,#2a2218,#171009)",
            boxShadow:
              "0 24px 60px rgba(0,0,0,.4), inset 0 0 0 10px rgba(154,123,74,.4), inset 0 0 40px rgba(0,0,0,.6)",
            overflow: "hidden",
          }}
        >
          {/* 真实摄像头 / 照片 */}
          {photo ? (
            <img
              src={photo}
              alt="snap"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : error ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                padding: isPortrait ? 20 : 40,
                textAlign: "center",
                color: "#d9c79a",
                fontSize: 13,
              }}
            >
              {error}
              <div style={{ marginTop: 8, opacity: 0.7 }}>可直接跳过这一步</div>
            </div>
          ) : !requested ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: isPortrait ? 20 : 36,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: serif,
                  fontSize: isPortrait ? 16 : 19,
                  color: "#f3e6c4",
                  letterSpacing: ".1em",
                }}
              >
                AI 将读取你的气质特征
              </div>
              <div style={{ fontSize: isPortrait ? 10 : 12, lineHeight: 1.6, color: "#d9c79a", maxWidth: 220 }}>
                仅用于本次体验的人物特征参考，不做身份识别，不长期保存。
              </div>
              <button onClick={() => setRequested(true)} style={{ ...btn, padding: isPortrait ? "10px 30px" : "14px 50px", fontSize: isPortrait ? 16 : 20 }}>
                允许摄像头
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                muted
                playsInline
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                }}
              />
              {!stream && (
                <div style={{ position: "absolute", inset: 0 }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: -20,
                      transform: "translateX(-50%)",
                      width: isPortrait ? 160 : 200,
                      height: isPortrait ? 200 : 240,
                    }}
                  >
                    <Silhouette />
                  </div>
                </div>
              )}
            </>
          )}
          <Bracket pos="tl" isPortrait={isPortrait} />
          <Bracket pos="tr" isPortrait={isPortrait} />
          <Bracket pos="bl" isPortrait={isPortrait} />
          <Bracket pos="br" isPortrait={isPortrait} />
          {captured && (
            <div
              style={{
                position: "absolute",
                left: "8%",
                right: "8%",
                height: 2,
                background: "linear-gradient(90deg,transparent,#74e0c8,transparent)",
                boxShadow: "0 0 14px #74e0c8",
                animation: "lhScanY 1.6s ease-in-out infinite",
              }}
            />
          )}
        </div>

        {/* 拍照前 / 读取特征 */}
        {!captured ? (
          <div
            style={isPortrait ? {
              width: "100%",
              textAlign: "center",
              animation: "lhFade .5s ease both",
              marginTop: 10,
            } : {
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 96,
              textAlign: "center",
              animation: "lhFade .5s ease both",
            }}
          >
            <div style={{ fontFamily: serif, fontSize: isPortrait ? 15 : 18, color: "#5a4630", marginBottom: 16 }}>
              请站在镜头前 · 我们先为你留一张影
            </div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button onClick={skip} style={isPortrait ? { ...btnGhost, padding: "10px 30px", fontSize: 16 } : btnGhost}>
                跳 过
              </button>
              <button
                onClick={snap}
                disabled={!stream}
                style={isPortrait ? {
                  ...btn,
                  padding: "10px 30px",
                  fontSize: 16,
                  opacity: stream ? 1 : 0.5,
                  cursor: stream ? "pointer" : "allowed",
                } : {
                  ...btn,
                  opacity: stream ? 1 : 0.5,
                  cursor: stream ? "pointer" : "not-allowed",
                }}
              >
                拍 照
              </button>
            </div>
          </div>
        ) : (
          <div
            style={isPortrait ? {
              width: "100%",
              textAlign: "center",
              animation: "lhFade .5s ease both",
              marginTop: 10,
            } : {
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 70,
              textAlign: "center",
              animation: "lhFade .5s ease both",
            }}
          >
            <div
              style={{
                fontFamily: serif,
                fontSize: isPortrait ? 15 : 17,
                letterSpacing: ".2em",
                color: "#9a3a2c",
                marginBottom: 12,
                ...(reading ? { animation: "lhPulse 1.4s ease-in-out infinite" } : {}),
              }}
            >
              {reading ? "AI 正在观察你…" : "AI 看到的你"}
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                flexWrap: "wrap",
                maxWidth: isPortrait ? 340 : 700,
                margin: "0 auto 16px",
              }}
            >
              {features.map((f) => (
                <div
                  key={f.k}
                  style={{
                    padding: isPortrait ? "6px 12px" : "8px 18px",
                    border: "1px solid rgba(154,123,74,.5)",
                    borderRadius: 30,
                    background: "rgba(255,255,255,.4)",
                    fontSize: isPortrait ? 11 : 13,
                    color: "#5a4630",
                    letterSpacing: ".05em",
                    animation: reading ? "lhPulse 1.4s ease-in-out infinite" : "lhFade .5s ease both",
                    opacity: reading || !f.v ? 0.8 : 1,
                  }}
                >
                  <span style={{ color: "#9a6b3a" }}>{f.k}</span> · {f.v || "…"}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button
                onClick={() => {
                  setPhoto(null);
                  setCaptured(false);
                  setFeatures(FEATURES.map((f) => ({ ...f })));
                  setReading(false);
                }}
                style={isPortrait ? { ...btnGhost, padding: "10px 30px", fontSize: 16 } : btnGhost}
              >
                重 拍
              </button>
              <button onClick={next} style={isPortrait ? { ...btn, padding: "10px 30px", fontSize: 16 } : btn}>
                下一步 →
              </button>
            </div>
          </div>
        )}

        <div
          style={isPortrait ? {
            textAlign: "center",
            fontSize: 10,
            color: "#9a8763",
            letterSpacing: ".04em",
            marginTop: 20,
            padding: "0 10px",
          } : {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 22,
            textAlign: "center",
            fontSize: 11,
            color: "#9a8763",
            letterSpacing: ".04em",
          }}
        >
          照片仅用于本次体验的人物特征参考 · 不做身份识别 · 不做长期保存
        </div>
      </div>
    );
  };

  return <Stage>{renderContent()}</Stage>;
}
