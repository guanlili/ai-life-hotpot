import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import { Stage } from "@/components/Stage";
import { DIM_LABEL, itemById } from "@/data/hotpot";
import { decodeSummary } from "@/lib/scoring";
import { buildReport } from "@/lib/mockReport";

export const Route = createFileRoute("/report/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "我的人生火锅 · AI Life Hotpot" },
      {
        name: "description",
        content: `这是一份由 AI 解读的人生火锅报告 (${params.id.slice(0, 8)})。`,
      },
      { property: "og:title", content: "我的人生火锅报告" },
      { property: "og:description", content: "你以为自己在配火锅，其实你正在构建人生。" },
    ],
  }),
  component: Report,
  notFoundComponent: () => <ReportError />,
});

const serif = "'Noto Serif SC',serif";

function ReportError() {
  return (
    <Stage>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          color: "#5a4630",
        }}
      >
        <div>
          <h1 style={{ fontFamily: serif, fontSize: 30, fontWeight: 700, color: "#2c2418" }}>
            这锅没找到
          </h1>
          <p style={{ marginTop: 8, color: "#8a6a44" }}>链接可能不完整。</p>
          <Link
            to="/"
            style={{
              marginTop: 24,
              display: "inline-block",
              padding: "12px 30px",
              borderRadius: 6,
              background: "#b4382b",
              color: "#f4eddd",
              fontFamily: serif,
              fontWeight: 700,
              letterSpacing: ".1em",
              textDecoration: "none",
            }}
          >
            重 新 开 始
          </Link>
        </div>
      </div>
    </Stage>
  );
}

function Report() {
  const { id } = Route.useParams();
  const summary = useMemo(() => decodeSummary(id), [id]);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    QRCode.toDataURL(window.location.href, {
      width: 320,
      margin: 1,
      color: { dark: "#1c140c", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [id]);

  const report = useMemo(() => (summary ? buildReport(summary) : null), [summary]);
  if (!summary || !report) return <ReportError />;
  const chosenNames = [...summary.base, ...summary.ingredients, ...summary.condiments]
    .map((id) => itemById(id)?.name)
    .filter(Boolean)
    .slice(0, 9);

  const chipStyle: CSSProperties = {
    flex: 1,
    background: "rgba(180,56,43,.07)",
    border: "1px solid rgba(180,56,43,.25)",
    borderRadius: 6,
    padding: "9px 8px",
    textAlign: "center",
  };

  return (
    <Stage>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 54,
          animation: "lhFade .5s ease both",
        }}
      >
        {/* 左竖排 tagline */}
        <div
          style={{
            writingMode: "vertical-rl",
            fontFamily: serif,
            fontWeight: 600,
            fontSize: 19,
            letterSpacing: ".4em",
            color: "#9a3a2c",
            height: 560,
          }}
        >
          你 以 为 在 配 火 锅 · 其 实 在 构 建 人 生
        </div>

        {/* 报告卡 */}
        <div
          style={{
            width: 440,
            height: 668,
            background: "linear-gradient(180deg,#f7f0df,#efe5cd)",
            borderRadius: 8,
            boxShadow: "0 30px 70px rgba(60,40,20,.4)",
            border: "1px solid rgba(154,123,74,.4)",
            position: "relative",
            overflow: "hidden",
            padding: "30px 34px",
            color: "#2c2418",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "radial-gradient(rgba(120,95,60,.05) 1px,transparent 1.5px)",
              backgroundSize: "7px 7px",
              pointerEvents: "none",
            }}
          />
          {/* header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              position: "relative",
            }}
          >
            <div>
              <div
                style={{ fontFamily: serif, fontWeight: 900, fontSize: 23, letterSpacing: ".12em" }}
              >
                人生火锅报告
              </div>
              <div style={{ fontSize: 10, letterSpacing: ".4em", color: "#9a6b3a", marginTop: 3 }}>
                LIFE HOTPOT REPORT
              </div>
            </div>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 7,
                background: "#b4382b",
                color: "#f4eddd",
                fontFamily: serif,
                fontWeight: 700,
                fontSize: 13,
                lineHeight: 1.1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                boxShadow: "0 3px 8px rgba(150,40,30,.4)",
              }}
            >
              人生
              <br />
              之味
            </div>
          </div>
          <div
            style={{
              height: 1,
              margin: "16px 0",
              background: "linear-gradient(90deg,#b4382b,transparent)",
            }}
          />

          {/* 命运口味 */}
          <div
            style={{ fontSize: 11, letterSpacing: ".3em", color: "#9a6b3a", position: "relative" }}
          >
            命 运 口 味
          </div>
          <div
            style={{
              fontFamily: serif,
              fontWeight: 900,
              fontSize: 25,
              lineHeight: 1.35,
              marginTop: 6,
              color: "#7a2418",
              position: "relative",
            }}
          >
            {report.flavor}
          </div>

          {/* 三 chip */}
          <div style={{ display: "flex", gap: 8, marginTop: 18, position: "relative" }}>
            <div style={chipStyle}>
              <div style={{ fontSize: 9, color: "#9a6b3a", letterSpacing: ".2em" }}>人生锅底</div>
              <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 14, marginTop: 3 }}>
                {report.baseName}
              </div>
            </div>
            <div style={chipStyle}>
              <div style={{ fontSize: 9, color: "#9a6b3a", letterSpacing: ".2em" }}>核心食材</div>
              <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 14, marginTop: 3 }}>
                {report.coreIng}
              </div>
            </div>
            <div style={chipStyle}>
              <div style={{ fontSize: 9, color: "#9a6b3a", letterSpacing: ".2em" }}>灵魂蘸料</div>
              <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 14, marginTop: 3 }}>
                {report.soulSauce}
              </div>
            </div>
          </div>

          {/* 一百金币 */}
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".3em",
              color: "#9a6b3a",
              marginTop: 16,
              position: "relative",
            }}
          >
            一 百 金 币 · 人 生 分 配
          </div>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              flexDirection: "column",
              gap: 7,
              position: "relative",
            }}
          >
            {report.coins.map((c) => (
              <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, fontFamily: serif, fontSize: 13, color: "#3a2c1c" }}>
                  {c.name}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 13,
                    borderRadius: 7,
                    background: "#ddd0b3",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${c.val}%`,
                      height: "100%",
                      background: c.color,
                      borderRadius: 7,
                      transition: "width .6s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 30,
                    textAlign: "right",
                    fontFamily: serif,
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#2c2418",
                  }}
                >
                  {c.val}
                </div>
              </div>
            ))}
          </div>

          {/* 人生故事 */}
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".3em",
              color: "#9a6b3a",
              marginTop: 20,
              position: "relative",
            }}
          >
            人 生 故 事
          </div>
          <div
            style={{
              fontFamily: serif,
              fontSize: 12.4,
              lineHeight: 1.58,
              color: "#3a2c1c",
              marginTop: 6,
              position: "relative",
            }}
          >
            {report.story}
          </div>

          <div
            style={{
              position: "absolute",
              left: 34,
              right: 34,
              bottom: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 10,
              color: "#a98f63",
              borderTop: "1px solid rgba(154,123,74,.3)",
              paddingTop: 10,
            }}
          >
            <span>AI 人生火锅 · 抖音 AI 创变者黑客松</span>
            <span style={{ color: "#9a3a2c" }}>#你这一锅什么味</span>
          </div>
        </div>

        {/* 右:二维码 + 再涮一锅 */}
        <div style={{ textAlign: "center", width: 230 }}>
          <div
            className="lh-sweep"
            style={{
              background: "#f7f0df",
              border: "1px solid rgba(154,123,74,.4)",
              borderRadius: 10,
              padding: 20,
              boxShadow: "0 16px 40px rgba(60,40,20,.25)",
            }}
          >
            <div
              style={{
                width: 160,
                height: 160,
                margin: "0 auto",
                background: "#fff",
                borderRadius: 6,
                padding: 10,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06)",
              }}
            >
              {qr ? (
                <img src={qr} alt="二维码" style={{ width: "100%", height: "100%" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "#eee" }} />
              )}
            </div>
            <div
              style={{
                fontFamily: serif,
                fontWeight: 700,
                fontSize: 16,
                color: "#2c2418",
                marginTop: 14,
                letterSpacing: ".1em",
              }}
            >
              扫码保存你的报告
            </div>
            <div style={{ fontSize: 11, color: "#8a6a44", marginTop: 5, lineHeight: 1.6 }}>
              公网链接 · 可在手机查看
              <br />
              录屏分享到抖音
            </div>
          </div>
          <div
            style={{
              marginTop: 14,
              border: "1px solid rgba(154,123,74,.34)",
              borderRadius: 8,
              padding: "14px 16px",
              background: "rgba(247,240,223,.72)",
              boxShadow: "0 12px 30px rgba(60,40,20,.18)",
              textAlign: "left",
              color: "#3a2c1c",
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: ".24em", color: "#9a6b3a" }}>现场弹幕</div>
            <div style={{ fontFamily: serif, fontWeight: 800, fontSize: 16, color: "#7a2418", marginTop: 6 }}>
              {DIM_LABEL[report.top[0]]} × {DIM_LABEL[report.top[1]]}
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.6, color: "#8a6a44", marginTop: 8 }}>
              入锅记录 · {chosenNames.join(" / ")}
            </div>
          </div>
          <Link
            to="/"
            style={{
              marginTop: 16,
              display: "inline-block",
              border: "1.5px solid #b4382b",
              padding: "12px 34px",
              borderRadius: 6,
              background: "transparent",
              color: "#b4382b",
              fontFamily: serif,
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: ".16em",
              textDecoration: "none",
            }}
          >
            再 涮 一 锅
          </Link>
        </div>
      </div>
    </Stage>
  );
}
