import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import { Stage } from "@/components/Stage";
import { DIM_LABEL, itemById } from "@/data/hotpot";
import { decodeSummary } from "@/lib/scoring";
import { buildReport } from "@/lib/mockReport";
import { generateStory } from "@/lib/llm";

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

/**
 * 把 AI 命运叙事拆成 标题《》/ 一句命运总结 / AI观察员 / 正文(节点+结尾)。
 * 解析失败(或回落到确定性模板时)对应字段为 null,正文兜底为原文。
 */
function parseStory(raw: string): {
  title: string | null;
  slogan: string | null;
  observer: string | null;
  narrative: string;
} {
  const full = (raw ?? "").trim();
  if (!full) return { title: null, slogan: null, observer: null, narrative: "" };
  // 观察员:【AI观察员评价】 或 "AI观察员评价：" 之后的内容
  const obsRe = /【\s*AI\s*观察员评价\s*】|AI\s*观察员评价\s*[：:]/;
  const obsIdx = full.search(obsRe);
  let observer: string | null = null;
  let body = full;
  if (obsIdx >= 0) {
    observer = full.slice(obsIdx).replace(obsRe, "").replace(/^[\s：:]*/, "").trim();
    body = full.slice(0, obsIdx).trim();
  }
  // 标题:第一个《...》
  const titleMatch = full.match(/《[^》\n]{2,28}》/);
  const title = titleMatch ? titleMatch[0] : null;
  // slogan:一对引号包住的短句(6~48 字)
  const sloganMatch = body.match(/["“''「『][^"”''」』\n]{6,48}。?["”''」』]/);
  const slogan = sloganMatch ? sloganMatch[0] : null;
  // 正文去掉明显的结构标签行
  const narrative = body
    .replace(/^[ \t]*你的命运火锅[ \t]*\r?\n?/m, "")
    .replace(/^[ \t]*标题[ \t]*[：:][ \t]*\r?\n?/m, "")
    .replace(/^[ \t]*一句命运总结[^\n]*\r?\n?/m, "")
    .trim();
  return { title, slogan, observer, narrative: narrative || body };
}

function Report() {
  const { id } = Route.useParams();
  const summary = useMemo(() => decodeSummary(id), [id]);
  const [qr, setQr] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [story, setStory] = useState<string>("");
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState(false);

  const fetchStory = async () => {
    if (!summary) return;
    setStoryLoading(true);
    setStoryError(false);
    try {
      const s = await generateStory(summary, "");
      if (s) {
        setStory(s);
      } else {
        setStoryError(true);
      }
    } catch {
      setStoryError(true);
    } finally {
      setStoryLoading(false);
    }
  };

  useEffect(() => {
    if (summary) {
      if (summary.story) {
        setStory(summary.story);
        setStoryError(false);
      } else {
        // 先回落本地静态模板故事，免去用户等待；再在后台异步推演并替换
        if (report) {
          setStory(report.story);
        }
        fetchStory();
      }
    }
  }, [summary, report]);

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
  const parsed = useMemo(() => parseStory(story), [story]);

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
        {/* 3D 翻面人生火锅报告卡 */}
        <div style={{ perspective: 1000, width: 460, height: 668, position: "relative" }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              transformStyle: "preserve-3d",
              transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front Side (报告正页) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                background: "linear-gradient(180deg,#f7f0df,#efe5cd)",
                borderRadius: 8,
                boxShadow: "0 30px 70px rgba(60,40,20,.4)",
                border: "1px solid rgba(154,123,74,.4)",
                overflow: "hidden",
                padding: "30px 34px 56px 34px",
                color: "#2c2418",
                display: "flex",
                flexDirection: "column",
                zIndex: isFlipped ? 1 : 2,
                pointerEvents: isFlipped ? "none" : "auto",
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
                  {summary.nickname && (
                    <div style={{ fontSize: 12, color: "#9a6b3a", letterSpacing: ".1em", marginBottom: 5 }}>
                      致 「{summary.nickname}」
                    </div>
                  )}
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

              {/* 弹性空白，完美均分正页元素空间 */}
              <div style={{ flex: "1 1 auto", minHeight: 12 }} />

              {/* 命运点题:锅名 + 一句命运总结 */}
              {parsed.title && (
                <div
                  style={{
                    fontFamily: serif,
                    fontWeight: 900,
                    fontSize: 21,
                    lineHeight: 1.3,
                    color: "#7a2418",
                    position: "relative",
                  }}
                >
                  {parsed.title}
                </div>
              )}
              {parsed.slogan && (
                <div
                  style={{
                    fontFamily: serif,
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: "#5a4630",
                    marginTop: 8,
                    position: "relative",
                  }}
                >
                  {parsed.slogan}
                </div>
              )}

              {/* 虚线分割线 */}
              {parsed.observer && (
                <div
                  style={{
                    height: 1,
                    borderTop: "1.5px dashed rgba(154,123,74,.3)",
                    margin: "18px 0 14px 0",
                  }}
                />
              )}

              {/* AI观察员评价 */}
              {parsed.observer && (
                <div
                  style={{
                    position: "relative",
                    background: "rgba(154,123,74,.05)",
                    border: "1px solid rgba(154,123,74,.18)",
                    borderRadius: 8,
                    padding: "14px 18px",
                    boxShadow: "0 4px 12px rgba(60,40,20,.02)",
                  }}
                >
                  {/* 大引号装饰 */}
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: -8,
                      fontFamily: serif,
                      fontSize: 36,
                      color: "#9a6b3a",
                      opacity: 0.18,
                      lineHeight: 1,
                    }}
                  >
                    “
                  </span>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: ".24em",
                      color: "#9a6b3a",
                      marginBottom: 6,
                      fontWeight: 600,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>A I  观  察  员  评  价</span>
                    {storyLoading && (
                      <span
                        style={{
                          fontSize: 9,
                          color: "#caa05a",
                          animation: "lhPulse 1.5s infinite",
                          fontWeight: "normal",
                        }}
                      >
                        ✨ AI正在精修命运哲理...
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: serif,
                      fontSize: 12.4,
                      lineHeight: 1.65,
                      color: "#3a2c1c",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {parsed.observer}
                  </div>
                </div>
              )}

              {/* 切换到背面的按钮 */}
              <div
                onClick={() => setIsFlipped(true)}
                style={{
                  alignSelf: "center",
                  fontSize: 11,
                  color: "#b4382b",
                  border: "1px solid rgba(180,56,43,.4)",
                  background: "rgba(180,56,43,.04)",
                  borderRadius: 20,
                  padding: "5px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 18,
                  userSelect: "none",
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(180,56,43,.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(180,56,43,.04)")}
              >
                <span>阅读详细命运故事</span>
                <span style={{ fontSize: 10 }}>➔</span>
              </div>

              {/* 底部版权 */}
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

            {/* Back Side (报告背面 - 详细的命运故事) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                zIndex: isFlipped ? 2 : 1,
                pointerEvents: isFlipped ? "auto" : "none",
              }}
            >
              {/* 内部卡片容器：避免在直接应用 rotateY 3D 变换的元素上应用 overflow 与 padding，从而解决 Mac 触摸板/滚轮的滚动判定 bug */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(180deg,#f7f0df,#efe5cd)",
                  borderRadius: 8,
                  boxShadow: "0 30px 70px rgba(60,40,20,.4)",
                  border: "1px solid rgba(154,123,74,.4)",
                  overflow: "hidden",
                  padding: "30px 34px 56px 34px",
                  color: "#2c2418",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
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
                    {summary.nickname && (
                      <div style={{ fontSize: 12, color: "#9a6b3a", letterSpacing: ".1em", marginBottom: 5 }}>
                        致 「{summary.nickname}」
                      </div>
                    )}
                    <div
                      style={{ fontFamily: serif, fontWeight: 900, fontSize: 23, letterSpacing: ".12em" }}
                    >
                      命 运 故 事
                    </div>
                    <div style={{ fontSize: 10, letterSpacing: ".4em", color: "#9a6b3a", marginTop: 3 }}>
                      NARRATIVE STORY
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
                    故事
                    <br />
                    详情
                  </div>
                </div>
                <div
                  style={{
                    height: 1,
                    margin: "16px 0",
                    background: "linear-gradient(90deg,#b4382b,transparent)",
                  }}
                />

                <div
                  style={{
                    fontFamily: serif,
                    fontWeight: 900,
                    fontSize: 18,
                    color: "#7a2418",
                    lineHeight: 1.25,
                  }}
                >
                  {parsed.title ?? report.flavor}
                </div>
                <div style={{ fontSize: 11, color: "#8a6a44", marginTop: 4, lineHeight: 1.5 }}>
                  命运主轴 · {DIM_LABEL[report.top[0]]} × {DIM_LABEL[report.top[1]]}
                  <br />
                  入锅 · {chosenNames.join(" / ")}
                </div>

                {/* 完整故事：可滚动 */}
                <div
                  style={{
                    flex: "1 1 0%",
                    minHeight: 0,
                    marginTop: 10,
                    paddingRight: 6,
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch",
                    fontFamily: serif,
                    fontSize: 12.5,
                    lineHeight: 1.65,
                    color: "#3a2c1c",
                    whiteSpace: "pre-line",
                  }}
                >
                  {storyLoading && (
                    <div
                      style={{
                        padding: "6px 10px",
                        background: "rgba(202,160,90,.06)",
                        border: "1px dashed rgba(202,160,90,.25)",
                        borderRadius: 6,
                        fontSize: 11,
                        color: "#9a6b3a",
                        marginBottom: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        animation: "lhPulse 1.5s infinite",
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          border: "1.5px solid rgba(202,160,90,.3)",
                          borderTopColor: "#caa05a",
                          borderRadius: "50%",
                          animation: "lhSpin .8s linear infinite",
                          display: "inline-block",
                        }}
                      />
                      <span>大模型正在为您深度推演故事细节，稍后将自动无缝升级...</span>
                    </div>
                  )}
                  {parsed.narrative || story}
                </div>

                {/* 底部: 扫码保存 + 按钮 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px solid rgba(154,123,74,.25)",
                  }}
                >
                  <div
                    style={{
                      width: 76,
                      height: 76,
                      background: "#fff",
                      borderRadius: 6,
                      padding: 5,
                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06)",
                      flexShrink: 0,
                    }}
                  >
                    {qr ? (
                      <img src={qr} alt="二维码" style={{ width: "100%", height: "100%" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#eee" }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 13, color: "#2c2418" }}>
                      扫码在手机端保存报告
                    </div>
                    <div style={{ fontSize: 11, color: "#8a6a44", marginTop: 2, lineHeight: 1.4 }}>
                      公网链接 · 手机可看
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <div
                        onClick={() => setIsFlipped(false)}
                        style={{
                          border: "1.5px solid #9a6b3a",
                          padding: "5px 12px",
                          borderRadius: 6,
                          background: "transparent",
                          color: "#9a6b3a",
                          fontFamily: serif,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        返回正页
                      </div>
                      <Link
                        to="/"
                        style={{
                          border: "1.5px solid #b4382b",
                          padding: "5px 12px",
                          borderRadius: 6,
                          background: "#b4382b",
                          color: "#f4eddd",
                          fontFamily: serif,
                          fontWeight: 700,
                          fontSize: 12,
                          letterSpacing: ".1em",
                          textDecoration: "none",
                        }}
                      >
                        再涮一锅
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 底部版权 */}
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
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}
