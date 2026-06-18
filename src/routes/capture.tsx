import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Stage } from "@/components/Stage";
import { Silhouette } from "@/components/hotpot-art";
import { loadSession, saveSession } from "@/lib/session";
import { recognizePhoto, parsePhotoFeatures } from "@/lib/llm";

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

function Bracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base: CSSProperties = { position: "absolute", width: 30, height: 30 };
  const map: Record<string, CSSProperties> = {
    tl: { left: 40, top: 40, borderLeft: "2px solid #d9c79a", borderTop: "2px solid #d9c79a" },
    tr: { right: 40, top: 40, borderRight: "2px solid #d9c79a", borderTop: "2px solid #d9c79a" },
    bl: {
      left: 40,
      bottom: 40,
      borderLeft: "2px solid #d9c79a",
      borderBottom: "2px solid #d9c79a",
    },
    br: {
      right: 40,
      bottom: 40,
      borderRight: "2px solid #d9c79a",
      borderBottom: "2px solid #d9c79a",
    },
  };
  return <div style={{ ...base, ...map[pos] }} />;
}

function Capture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [captured, setCaptured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [features, setFeatures] = useState<{ k: string; v: string }[]>(
    FEATURES.map((f) => ({ ...f })),
  );

  useEffect(() => {
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
      .catch((e) => setError(e?.message ?? "无法打开摄像头"));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

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
      const p = parsePhotoFeatures(full);
      setFeatures(FEATURES.map((f) => ({ k: f.k, v: p[f.k] || "" })));
    })
      .then((finalText) => {
        const p = parsePhotoFeatures(finalText);
        const feats = FEATURES.map((f) => ({ k: f.k, v: p[f.k] || f.v }));
        setFeatures(feats);
        const txt = feats.map((f) => `${f.k}:${f.v}`).join(" ");
        saveSession({ ...loadSession(), photoFeatures: txt || undefined });
      })
      .finally(() => setReading(false));
  };

  const next = () => {
    saveSession({ ...loadSession(), photo: photo ?? undefined });
    navigate({ to: "/play" });
  };
  const skip = () => {
    saveSession({ ...loadSession(), photo: undefined });
    navigate({ to: "/play" });
  };

  return (
    <Stage>
      {/* 标题 */}
      <div
        style={{
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
            fontSize: 44,
            letterSpacing: ".1em",
            color: "#2c2418",
          }}
        >
          AI 人生火锅
        </div>
        <div style={{ fontSize: 13, letterSpacing: ".5em", color: "#9a6b3a", marginTop: 8 }}>
          你 的 人 生 · 由 你 来 涮
        </div>
        <div
          style={{
            width: 90,
            height: 2,
            margin: "16px auto 0",
            background: "linear-gradient(90deg,transparent,#b4382b,transparent)",
          }}
        />
      </div>

      {/* 取景框 */}
      <div
        style={{
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
              padding: 40,
              textAlign: "center",
              color: "#d9c79a",
              fontSize: 13,
            }}
          >
            {error}
            <div style={{ marginTop: 8, opacity: 0.7 }}>可直接跳过这一步</div>
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
                    width: 200,
                    height: 240,
                  }}
                >
                  <Silhouette />
                </div>
              </div>
            )}
          </>
        )}
        <Bracket pos="tl" />
        <Bracket pos="tr" />
        <Bracket pos="bl" />
        <Bracket pos="br" />
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
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 96,
            textAlign: "center",
            animation: "lhFade .5s ease both",
          }}
        >
          <div style={{ fontFamily: serif, fontSize: 18, color: "#5a4630", marginBottom: 22 }}>
            请站在镜头前 · 我们先为你留一张影
          </div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button onClick={skip} style={btnGhost}>
              跳 过
            </button>
            <button
              onClick={snap}
              disabled={!stream}
              style={{
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
          style={{
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
              fontSize: 17,
              letterSpacing: ".2em",
              color: "#9a3a2c",
              marginBottom: 16,
              ...(reading ? { animation: "lhPulse 1.4s ease-in-out infinite" } : {}),
            }}
          >
            {reading ? "AI 正在观察你…" : "AI 看到的你"}
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              maxWidth: 700,
              margin: "0 auto 22px",
            }}
          >
            {features.map((f) => (
              <div
                key={f.k}
                style={{
                  padding: "8px 18px",
                  border: "1px solid rgba(154,123,74,.5)",
                  borderRadius: 30,
                  background: "rgba(255,255,255,.4)",
                  fontSize: 13,
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
              style={btnGhost}
            >
              重 拍
            </button>
            <button onClick={next} style={btn}>
              下 一 步 →
            </button>
          </div>
        </div>
      )}

      <div
        style={{
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
    </Stage>
  );
}
