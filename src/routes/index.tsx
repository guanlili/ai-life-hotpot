import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";
import { Stage } from "@/components/Stage";
import { YuanyangPot } from "@/components/hotpot-art";
import { loadSession, saveSession } from "@/lib/session";
import { useIsPortrait } from "@/hooks/use-mobile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI 人生火锅 · Life Hotpot" },
      { name: "description", content: "你以为自己在配火锅，其实你正在构建人生。" },
      { property: "og:title", content: "AI 人生火锅" },
      { property: "og:description", content: "你以为自己在配火锅，其实你正在构建人生。" },
    ],
  }),
  component: Index,
});

const serif = "'Noto Serif SC',serif";

const cta: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 14,
  border: "none",
  cursor: "pointer",
  padding: "16px 54px",
  borderRadius: 6,
  background: "#b4382b",
  color: "#f4eddd",
  fontFamily: serif,
  fontWeight: 700,
  fontSize: 22,
  letterSpacing: ".2em",
  boxShadow: "0 12px 28px rgba(150,40,30,.4)",
  textDecoration: "none",
};

// 朱红印章:按字数自适应排版(竖排/方阵),避免硬编码四字导致错位
function Seal({ text, style }: { text: string; style?: CSSProperties }) {
  const chars = [...text];
  return (
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 8,
        background: "#b4382b",
        color: "#f7ece2",
        fontFamily: serif,
        fontWeight: 900,
        fontSize: chars.length <= 2 ? 26 : chars.length === 3 ? 21 : 21,
        lineHeight: 1.05,
        display: "grid",
        gridTemplateColumns: chars.length <= 2 ? "1fr" : "1fr 1fr",
        placeItems: "center",
        boxShadow: "0 4px 10px rgba(150,40,30,.35), inset 0 0 0 2px rgba(247,236,226,.35)",
        transform: "rotate(-6deg)",
        ...style,
      }}
    >
      {chars.map((ch, i) => (
        <span key={i}>{ch}</span>
      ))}
    </div>
  );
}

// 四角内框装饰
function CornerMarks() {
  const base: CSSProperties = { position: "absolute", width: 30, height: 30, pointerEvents: "none" };
  const c = "rgba(154,107,58,.45)";
  return (
    <>
      <div style={{ ...base, top: 30, left: 30, borderTop: `2px solid ${c}`, borderLeft: `2px solid ${c}` }} />
      <div style={{ ...base, top: 30, right: 30, borderTop: `2px solid ${c}`, borderRight: `2px solid ${c}` }} />
      <div style={{ ...base, bottom: 30, left: 30, borderBottom: `2px solid ${c}`, borderLeft: `2px solid ${c}` }} />
      <div style={{ ...base, bottom: 30, right: 30, borderBottom: `2px solid ${c}`, borderRight: `2px solid ${c}` }} />
    </>
  );
}

function Steam() {
  return (
    <div style={{ position: "absolute", left: "50%", top: -12, transform: "translateX(-50%)", display: "flex", gap: 12, pointerEvents: "none" }}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            display: "block",
            width: 11,
            height: 36,
            borderRadius: 8,
            background: "rgba(255,255,255,.5)",
            filter: "blur(6px)",
            animation: `lhSteam ${2.6 + i * 0.3}s ease-out ${i * 0.4}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function RitualTrack() {
  const steps = [
    ["拍照", "读取气质"],
    ["择锅", "决定底色"],
    ["下菜", "分配金币"],
    ["沸腾", "生成报告"],
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: 330,
        top: 432,
        width: 620,
        height: 54,
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        alignItems: "start",
        animation: "lhFade .8s ease .15s both",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          top: 13,
          height: 1,
          background: "linear-gradient(90deg,transparent,rgba(154,107,58,.45),transparent)",
        }}
      />
      {steps.map(([name, desc], i) => (
        <div
          key={name}
          style={{
            position: "relative",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              margin: "0 auto",
              background: i === 0 ? "#b4382b" : "rgba(244,237,221,.74)",
              border: "1px solid rgba(154,107,58,.42)",
              boxShadow: i === 0 ? "0 0 0 7px rgba(180,56,43,.08)" : "0 6px 14px rgba(90,70,40,.1)",
              display: "grid",
              placeItems: "center",
              color: i === 0 ? "#f4eddd" : "#9a6b3a",
              fontFamily: serif,
              fontWeight: 900,
              fontSize: 12,
            }}
          >
            {i + 1}
          </div>
          <div
            style={{
              fontFamily: serif,
              fontWeight: 800,
              fontSize: 14,
              color: "#2c2418",
              letterSpacing: ".1em",
              marginTop: 5,
            }}
          >
            {name}
          </div>
          <div style={{ marginTop: 4, fontSize: 10, color: "#8a6a44", letterSpacing: ".12em" }}>
            {desc}
          </div>
        </div>
      ))}
    </div>
  );
}

function RitualTrackMobile() {
  const steps = [
    ["拍照", "读取气质"],
    ["择锅", "决定底色"],
    ["下菜", "分配金币"],
    ["沸腾", "生成报告"],
  ];
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 320,
        margin: "24px auto 12px",
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        alignItems: "start",
        position: "relative",
        animation: "lhFade .8s ease .15s both",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 30,
          right: 30,
          top: 13,
          height: 1,
          background: "linear-gradient(90deg,transparent,rgba(154,107,58,.45),transparent)",
        }}
      />
      {steps.map(([name, desc], i) => (
        <div
          key={name}
          style={{
            position: "relative",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              margin: "0 auto",
              background: i === 0 ? "#b4382b" : "rgba(244,237,221,.74)",
              border: "1px solid rgba(154,107,58,.42)",
              boxShadow: i === 0 ? "0 0 0 5px rgba(180,56,43,.08)" : "0 4px 10px rgba(90,70,40,.06)",
              display: "grid",
              placeItems: "center",
              color: i === 0 ? "#f4eddd" : "#9a6b3a",
              fontFamily: serif,
              fontWeight: 900,
              fontSize: 11,
            }}
          >
            {i + 1}
          </div>
          <div
            style={{
              fontFamily: serif,
              fontWeight: 800,
              fontSize: 13,
              color: "#2c2418",
              letterSpacing: ".05em",
              marginTop: 6,
            }}
          >
            {name}
          </div>
          <div style={{ marginTop: 2, fontSize: 9, color: "#8a6a44", transform: "scale(0.95)" }}>
            {desc}
          </div>
        </div>
      ))}
    </div>
  );
}

function Index() {
  const [nickname, setNickname] = useState(() => loadSession().nickname ?? "");
  const isPortrait = useIsPortrait();

  if (isPortrait) {
    return (
      <Stage>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100%",
            padding: "24px 20px 40px",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 11, letterSpacing: ".3em", color: "#9a6b3a" }}>A I  ·  L I F E  H O T P O T</div>
              <div style={{ fontFamily: serif, fontWeight: 900, fontSize: 32, letterSpacing: ".1em", color: "#2c2418", marginTop: 6 }}>
                人生火锅
              </div>
            </div>
            <Seal text="人生之味" style={{ transform: "rotate(-6deg) scale(0.85)", transformOrigin: "top right" }} />
          </div>

          {/* Yuanyang Pot (Centered) */}
          <div style={{
            position: "relative",
            width: 180,
            height: 180,
            margin: "20px auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Steam />
            <div
              style={{
                position: "absolute",
                inset: -20,
                borderRadius: "50%",
                border: "1px solid rgba(180,56,43,.18)",
                animation: "lhRingPulse 2.8s ease-in-out infinite",
              }}
            />
            <YuanyangPot left="#b4382b" right="#e9d9b2" />
          </div>

          {/* Ritual Track Mobile */}
          <RitualTrackMobile />

          {/* Footer Form & CTA */}
          <div style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            marginTop: 20,
          }}>
            <label
              style={{
                display: "inline-flex",
                alignItems: "stretch",
                borderRadius: 7,
                overflow: "hidden",
                border: "1.5px solid rgba(180,56,43,.55)",
                boxShadow: "0 6px 16px rgba(150,40,30,.16)",
                width: "100%",
                maxWidth: 280,
              }}
            >
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  background: "#b4382b",
                  color: "#f4eddd",
                  fontFamily: serif,
                  fontWeight: 800,
                  fontSize: 15,
                  letterSpacing: ".18em",
                  padding: "0 14px",
                }}
              >
                署名
              </span>
              <input
                value={nickname}
                onChange={(e) => {
                  const v = e.target.value;
                  setNickname(v);
                  saveSession({ ...loadSession(), nickname: v.trim() ? v.trim() : undefined });
                }}
                placeholder="怎么称呼你？（可不填）"
                maxLength={12}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  border: "none",
                  background: "rgba(255,252,248,.72)",
                  color: "#2c2418",
                  fontFamily: serif,
                  fontSize: 15,
                  letterSpacing: ".08em",
                  textAlign: "center",
                  outline: "none",
                }}
              />
            </label>

            <Link to="/capture" className="lh-sweep" style={{ ...cta, marginTop: 10, width: "100%", maxWidth: 280, textAlign: "center", justifyContent: "center", padding: "14px 0", fontSize: 18 }}>
              开始 · 煮一锅人生 <span style={{ fontSize: 16 }}>→</span>
            </Link>

            <div
              style={{
                fontFamily: serif,
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: ".08em",
                color: "#5a4630",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              你以为自己在配火锅，<span style={{ color: "#b4382b" }}>其实正在构建人生。</span>
            </div>
          </div>
        </div>
      </Stage>
    );
  }

  return (
    <Stage>
      <CornerMarks />

      {/* 右上印章 */}
      <Seal text="人生之味" style={{ position: "absolute", top: 64, right: 84 }} />

      {/* 顶部标题簇 */}
      <div style={{ position: "absolute", top: 74, left: 0, right: 0, textAlign: "center", animation: "lhFade .6s ease both" }}>
        <div style={{ fontSize: 13, letterSpacing: ".55em", color: "#9a6b3a" }}>A I 　·　 L I F E　H O T P O T</div>
        <div style={{ fontFamily: serif, fontWeight: 900, fontSize: 64, letterSpacing: ".16em", color: "#2c2418", marginTop: 12 }}>
          人 生 火 锅
        </div>
        <div style={{ width: 96, height: 2, margin: "16px auto 0", background: "linear-gradient(90deg,transparent,#b4382b,transparent)" }} />
      </div>

      {/* 锅后淡暖光晕(取代字符水印,只做焦点,不压字) */}
      <div
        style={{
          position: "absolute",
          left: 640,
          top: 296,
          transform: "translate(-50%,-50%)",
          width: 340,
          height: 340,
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 29.6%, rgba(95,143,122,.12), rgba(180,56,43,.05) 52%, rgba(180,56,43,0) 72%)",
          pointerEvents: "none",
        }}
      />

      {/* 居中鸳鸯锅 */}
      <div style={{ position: "absolute", left: 640, top: 296, transform: "translate(-50%,-50%)", width: 188, height: 188 }}>
        <Steam />
        <div
          style={{
            position: "absolute",
            inset: -30,
            borderRadius: "50%",
            border: "1px solid rgba(180,56,43,.18)",
            animation: "lhRingPulse 2.8s ease-in-out infinite",
          }}
        />
        <YuanyangPot left="#b4382b" right="#e9d9b2" />
      </div>

      <RitualTrack />

      {/* 底部竖排:四步流程 → 署名(称呼) → 开始 → 标语,逐层递进不重叠 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 506,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* 署名红签:仅展示用,不进入人生故事生成。呼应招牌红条 */}
        <label
          style={{
            display: "inline-flex",
            alignItems: "stretch",
            borderRadius: 7,
            overflow: "hidden",
            border: "1.5px solid rgba(180,56,43,.55)",
            boxShadow: "0 6px 16px rgba(150,40,30,.16)",
            animation: "lhFade .8s ease .2s both",
          }}
        >
          <span
            style={{
              display: "grid",
              placeItems: "center",
              background: "#b4382b",
              color: "#f4eddd",
              fontFamily: serif,
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: ".18em",
              padding: "0 16px",
              writingMode: "horizontal-tb",
            }}
          >
            署名
          </span>
          <input
            value={nickname}
            onChange={(e) => {
              const v = e.target.value;
              setNickname(v);
              saveSession({ ...loadSession(), nickname: v.trim() ? v.trim() : undefined });
            }}
            placeholder="怎么称呼你？（可不填）"
            maxLength={12}
            style={{
              width: 220,
              padding: "12px 18px",
              border: "none",
              background: "rgba(255,252,248,.72)",
              color: "#2c2418",
              fontFamily: serif,
              fontSize: 16,
              letterSpacing: ".08em",
              textAlign: "center",
              outline: "none",
            }}
          />
        </label>

        <Link to="/capture" className="lh-sweep" style={{ ...cta, marginTop: 20 }}>
          开 始 · 煮 一 锅 人 生 <span style={{ fontSize: 18 }}>→</span>
        </Link>

        <div
          style={{
            marginTop: 16,
            fontFamily: serif,
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: ".08em",
            color: "#5a4630",
          }}
        >
          你以为自己在配火锅，<span style={{ color: "#b4382b" }}>其实正在构建人生。</span>
        </div>
      </div>
    </Stage>
  );
}
