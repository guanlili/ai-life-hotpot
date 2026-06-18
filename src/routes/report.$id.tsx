import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import QRCode from "qrcode";
import { Stage } from "@/components/Stage";
import { DIM_LABEL, itemById } from "@/data/hotpot";
import { decodeSummary, encodeSummary } from "@/lib/scoring";
import { buildReport } from "@/lib/mockReport";
import { generateStory } from "@/lib/llm";
import { useIsPortrait } from "@/hooks/use-mobile";

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

function parseItalic(content: string): ReactNode[] {
  const italicRegex = /(\*.*?\*|_.*?_)/g;
  const parts = content.split(italicRegex);
  return parts.map((part, i) => {
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return <em key={i} style={{ fontStyle: "italic" }}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function parseInlineElements(content: string): ReactNode[] {
  const boldRegex = /(\*\*.*?\*\*|__.*?__)/g;
  const parts = content.split(boldRegex);
  return parts.flatMap((part, i) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={i} style={{ fontWeight: 700, color: "#1c140c" }}>{parseItalic(part.slice(2, -2))}</strong>;
    }
    return parseItalic(part);
  });
}

function RichText({ text, style }: { text: string; style?: CSSProperties }) {
  if (!text) return null;

  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let listItems: ReactNode[] = [];

  const flushList = (key: string | number) => {
    if (listItems.length > 0) {
      blocks.push(
        <ul
          key={`list-${key}`}
          style={{
            margin: "6px 0",
            paddingLeft: "16px",
            listStyleType: "disc",
          }}
        >
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(index);
      blocks.push(<div key={`br-${index}`} style={{ height: "8px" }} />);
      return;
    }

    // Headers
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      flushList(index);
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      const displayContent = content.replace(/^【\s*/, "").replace(/\s*】$/, "");
      const fontSize = level === 1 ? 17 : level === 2 ? 15 : level === 3 ? 13.5 : 12.5;
      blocks.push(
        <div
          key={`h-${index}`}
          style={{
            fontFamily: serif,
            fontWeight: 800,
            fontSize,
            color: "#7a2418",
            marginTop: "16px",
            marginBottom: "8px",
            letterSpacing: "0.02em",
          }}
        >
          {parseInlineElements(displayContent)}
        </div>
      );
      return;
    }

    // Lists
    const listMatch = trimmed.match(/^([*\-•])\s+(.*)$/);
    if (listMatch) {
      const content = listMatch[2];
      listItems.push(
        <li
          key={`li-${index}`}
          style={{
            marginBottom: "4px",
            lineHeight: 1.6,
          }}
        >
          {parseInlineElements(content)}
        </li>
      );
      return;
    }

    flushList(index);

    const isNodeHeader = trimmed.startsWith("【命运节点") || trimmed.startsWith("【AI观察员评价】") || (trimmed.startsWith("【") && trimmed.endsWith("】")) || (trimmed.includes("岁") && (trimmed.includes("·") || trimmed.includes("：") || trimmed.includes(":")));

    if (isNodeHeader) {
      blocks.push(
        <div
          key={`node-${index}`}
          style={{
            fontFamily: serif,
            fontWeight: 700,
            fontSize: 13,
            color: "#7a2418",
            marginTop: "14px",
            marginBottom: "6px",
            letterSpacing: "0.02em",
          }}
        >
          {parseInlineElements(trimmed.replace(/^【\s*/, "").replace(/\s*】$/, ""))}
        </div>
      );
    } else {
      blocks.push(
        <p
          key={`p-${index}`}
          style={{
            margin: "0 0 8px 0",
            lineHeight: 1.65,
          }}
        >
          {parseInlineElements(trimmed)}
        </p>
      );
    }
  });

  flushList("end");

  return <div style={{ fontSize: "inherit", color: "inherit", ...style }}>{blocks}</div>;
}

function Report() {
  const { id } = Route.useParams();
  const isPortrait = useIsPortrait();

  const summary = useMemo(() => decodeSummary(id), [id]);
  const report = useMemo(() => (summary ? buildReport(summary) : null), [summary]);

  const [qr, setQr] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [story, setStory] = useState<string>("");
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState(false);

  const [shareImage, setShareImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const parsed = useMemo(() => parseStory(story), [story]);

  const handleSaveImage = async () => {
    const shareNode = document.getElementById("share-card-template");
    if (!shareNode) return;
    setGenerating(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(shareNode, {
        cacheBust: true,
        pixelRatio: 2,
      });
      if (isPortrait) {
        // Mobile screen: show full-screen overlay for long press saving
        setShareImage(dataUrl);
      } else {
        // PC/Desktop: trigger direct download as a file
        const link = document.createElement("a");
        link.download = `我的人生火锅报告_${summary.nickname || "分享"}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Failed to generate image", err);
      alert("生成图片失败，请重试");
    } finally {
      setGenerating(false);
    }
  };

  // isCancelled:由调用方(如 effect 清理)提供,用于在组件重渲染/卸载后丢弃过期结果,避免竞态覆盖。
  // 重试按钮等外部调用可不传,直接写入。
  const fetchStory = async (isCancelled?: () => boolean) => {
    if (!summary) return;
    setStoryLoading(true);
    setStoryError(false);
    try {
      const s = await generateStory(summary, "");
      if (isCancelled?.()) return;
      if (s) {
        setStory(s);
      } else {
        setStoryError(true);
      }
    } catch {
      if (isCancelled?.()) return;
      setStoryError(true);
    } finally {
      if (!isCancelled?.()) setStoryLoading(false);
    }
  };

  useEffect(() => {
    if (!summary) return;
    if (summary.story) {
      setStory(summary.story);
      setStoryError(false);
      return;
    }
    // 先回落本地静态模板故事，免去用户等待；再在后台异步推演并替换
    if (report) {
      setStory(report.story);
    }
    // summary/report 变化(如换 id)时丢弃上一次在途结果,防止两次 LLM 调用竞态覆盖
    let cancelled = false;
    fetchStory(() => cancelled);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, report]);

  useEffect(() => {
    if (typeof window === "undefined" || !summary) return;
    // 二维码走精简链接(剔除 AI 故事)，避免 URL 过长导致模块过密、手机扫不出。
    // 扫码者进入报告页后，选择/金币分布一致，故事会回落模板或后台重新生成。
    const liteId = encodeSummary({ ...summary, story: undefined });
    const shareUrl = window.location.origin + window.location.pathname.replace(/[^/]+$/, liteId);
    QRCode.toDataURL(shareUrl, {
      width: 320,
      margin: 1,
      color: { dark: "#1c140c", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [id, summary]);

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
        style={isPortrait ? {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "16px 10px",
          boxSizing: "border-box",
          animation: "lhFade .5s ease both",
        } : {
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
        <div style={{
          perspective: 1000,
          width: isPortrait ? "calc(100vw - 32px)" : 460,
          maxWidth: 460,
          height: isPortrait ? "calc(100vh - 48px)" : 668,
          maxHeight: 668,
          position: "relative",
        }}>
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
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                padding: isPortrait ? "20px 20px 48px 20px" : "30px 34px 56px 34px",
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
                    style={{ fontFamily: serif, fontWeight: 900, fontSize: isPortrait ? 20 : 23, letterSpacing: ".12em" }}
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
                  fontSize: isPortrait ? 21 : 25,
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
                  <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 13, marginTop: 3 }}>
                    {report.baseName}
                  </div>
                </div>
                <div style={chipStyle}>
                  <div style={{ fontSize: 9, color: "#9a6b3a", letterSpacing: ".2em" }}>核心食材</div>
                  <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 13, marginTop: 3 }}>
                    {report.coreIng}
                  </div>
                </div>
                <div style={chipStyle}>
                  <div style={{ fontSize: 9, color: "#9a6b3a", letterSpacing: ".2em" }}>灵魂蘸料</div>
                  <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 13, marginTop: 3 }}>
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
                    fontSize: isPortrait ? 18 : 21,
                    lineHeight: 1.3,
                    color: "#7a2418",
                    position: "relative",
                    marginTop: 10,
                  }}
                >
                  {parsed.title}
                </div>
              )}
              {parsed.slogan && (
                <div
                  style={{
                    fontFamily: serif,
                    fontSize: isPortrait ? 12 : 13,
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
                    <RichText text={parsed.observer} />
                  </div>
                </div>
              )}

              {/* 切换到背面的按钮 & 保存图片按钮 */}
              <div style={{ display: "flex", gap: 10, alignSelf: "center", marginTop: 18 }}>
                <div
                  onClick={() => setIsFlipped(true)}
                  style={{
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
                    userSelect: "none",
                    fontWeight: 700,
                    letterSpacing: ".06em",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(180,56,43,.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(180,56,43,.04)")}
                >
                  <span>命运故事</span>
                  <span style={{ fontSize: 10 }}>➔</span>
                </div>
                <div
                  onClick={handleSaveImage}
                  style={{
                    fontSize: 11,
                    color: "#9a6b3a",
                    border: "1px solid rgba(154,123,74,.4)",
                    background: "rgba(154,123,74,.04)",
                    borderRadius: 20,
                    padding: "5px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    userSelect: "none",
                    fontWeight: 700,
                    letterSpacing: ".06em",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(154,123,74,.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(154,123,74,.04)")}
                >
                  <span>保存报告到本地</span>
                  <span style={{ fontSize: 11 }}>📷</span>
                </div>
              </div>

              {/* 底部版权 */}
              <div
                style={{
                  position: isPortrait ? "relative" : "absolute",
                  left: isPortrait ? 0 : 34,
                  right: isPortrait ? 0 : 34,
                  bottom: isPortrait ? 0 : 18,
                  marginTop: isPortrait ? 20 : 0,
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
              {/* 内部卡片容器 */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(180deg,#f7f0df,#efe5cd)",
                  borderRadius: 8,
                  boxShadow: "0 30px 70px rgba(60,40,20,.4)",
                  border: "1px solid rgba(154,123,74,.4)",
                  overflow: "hidden",
                  padding: isPortrait ? "20px 20px 48px 20px" : "30px 34px 56px 34px",
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
                      style={{ fontFamily: serif, fontWeight: 900, fontSize: isPortrait ? 20 : 23, letterSpacing: ".12em" }}
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
                  <RichText text={parsed.narrative || story} />
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
                      display: isPortrait ? "none" : "block",
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
                      {isPortrait ? "您可以复制链接分享此报告" : "扫码在手机端保存报告"}
                    </div>
                    <div style={{ fontSize: 11, color: "#8a6a44", marginTop: 2, lineHeight: 1.4 }}>
                      {isPortrait ? "永久链接 · 多端可看" : "公网链接 · 手机可看"}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
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
                      <div
                        onClick={handleSaveImage}
                        style={{
                          border: "1.5px solid #e2a855",
                          padding: "5px 12px",
                          borderRadius: 6,
                          background: "rgba(226,168,85,.08)",
                          color: "#7a5a2a",
                          fontFamily: serif,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                          userSelect: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span>保存到本地</span>
                        <span style={{ fontSize: 11 }}>📷</span>
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
                    position: isPortrait ? "relative" : "absolute",
                    left: isPortrait ? 0 : 34,
                    right: isPortrait ? 0 : 34,
                    bottom: isPortrait ? 0 : 18,
                    marginTop: isPortrait ? 20 : 0,
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

      {/* Off-screen Share Card Template */}
      <div
        id="share-card-template"
        style={{
          position: "fixed",
          left: -9999,
          top: -9999,
          width: 460,
          background: "linear-gradient(180deg,#f7f0df,#efe5cd)",
          padding: "36px 36px 40px 36px",
          color: "#2c2418",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Noto Sans SC',system-ui,sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* Paper texture overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(120,95,60,.05) 1px,transparent 1.5px)",
            backgroundSize: "7px 7px",
            pointerEvents: "none",
          }}
        />

        {/* Header */}
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
              style={{ fontFamily: serif, fontWeight: 900, fontSize: 24, letterSpacing: ".12em" }}
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

        {/* Destiny Flavor */}
        <div style={{ fontSize: 11, letterSpacing: ".3em", color: "#9a6b3a", position: "relative" }}>
          命 运 口 味
        </div>
        <div
          style={{
            fontFamily: serif,
            fontWeight: 900,
            fontSize: 26,
            lineHeight: 1.35,
            marginTop: 6,
            color: "#7a2418",
            position: "relative",
          }}
        >
          {report.flavor}
        </div>

        {/* Three chips */}
        <div style={{ display: "flex", gap: 8, marginTop: 18, position: "relative" }}>
          <div style={chipStyle}>
            <div style={{ fontSize: 9, color: "#9a6b3a", letterSpacing: ".2em" }}>人生锅底</div>
            <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 13, marginTop: 3 }}>
              {report.baseName}
            </div>
          </div>
          <div style={chipStyle}>
            <div style={{ fontSize: 9, color: "#9a6b3a", letterSpacing: ".2em" }}>核心食材</div>
            <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 13, marginTop: 3 }}>
              {report.coreIng}
            </div>
          </div>
          <div style={chipStyle}>
            <div style={{ fontSize: 9, color: "#9a6b3a", letterSpacing: ".2em" }}>灵魂蘸料</div>
            <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 13, marginTop: 3 }}>
              {report.soulSauce}
            </div>
          </div>
        </div>

        {/* 100 coins chart */}
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".3em",
            color: "#9a6b3a",
            marginTop: 18,
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

        {/* Slogan */}
        {parsed.title && (
          <div
            style={{
              fontFamily: serif,
              fontWeight: 900,
              fontSize: 22,
              lineHeight: 1.3,
              color: "#7a2418",
              position: "relative",
              marginTop: 20,
            }}
          >
            {parsed.title}
          </div>
        )}
        {parsed.slogan && (
          <div
            style={{
              fontFamily: serif,
              fontSize: 14,
              lineHeight: 1.5,
              color: "#5a4630",
              marginTop: 8,
              position: "relative",
            }}
          >
            {parsed.slogan}
          </div>
        )}

        <div
          style={{
            height: 1,
            borderTop: "1.5px dashed rgba(154,123,74,.3)",
            margin: "20px 0 16px 0",
            position: "relative",
          }}
        />

        {/* Narrative Story */}
        <div style={{ fontSize: 11, letterSpacing: ".3em", color: "#9a6b3a", position: "relative", marginBottom: 8 }}>
          命 运 故 事
        </div>
        <div
          style={{
            fontFamily: serif,
            fontSize: 13,
            lineHeight: 1.65,
            color: "#3a2c1c",
            position: "relative",
            marginBottom: 20,
          }}
        >
          <RichText text={parsed.narrative || story} />
        </div>

        {/* AI observer comment */}
        {parsed.observer && (
          <div
            style={{
              position: "relative",
              background: "rgba(154,123,74,.05)",
              border: "1px solid rgba(154,123,74,.18)",
              borderRadius: 8,
              padding: "14px 18px",
              boxShadow: "0 4px 12px rgba(60,40,20,.02)",
              marginBottom: 24,
            }}
          >
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
              }}
            >
              A I  观  察  员  评  价
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
              <RichText text={parsed.observer} />
            </div>
          </div>
        )}

        {/* Footer (QR code + branding) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            paddingTop: 16,
            borderTop: "1px solid rgba(154,123,74,.25)",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              background: "#fff",
              borderRadius: 6,
              padding: 4,
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
              扫码煮一锅自己的人生火锅
            </div>
            <div style={{ fontSize: 10, color: "#8a6a44", marginTop: 2, lineHeight: 1.4 }}>
              AI 人生火锅 · #你这一锅什么味
            </div>
          </div>
        </div>
      </div>

      {/* Share Image Preview Overlay */}
      {shareImage && (
        <div
          onClick={() => setShareImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div
            onClick={() => setShareImage(null)}
            style={{
              position: "absolute",
              right: 20,
              top: 20,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              cursor: "pointer",
              zIndex: 10,
            }}
          >
            ✕
          </div>
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              height: "calc(100vh - 120px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={shareImage}
              alt="分享卡片"
              style={{
                maxWidth: "100%",
                maxHeight: "calc(100% - 40px)",
                borderRadius: 12,
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                border: "2px solid rgba(255,255,255,0.1)",
                display: "block",
              }}
            />
            <div
              style={{
                marginTop: 15,
                color: "#ffd46a",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: ".08em",
                textAlign: "center",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              👆 长按图片保存到手机相册
            </div>
            <div
              style={{
                marginTop: 4,
                color: "rgba(255,255,255,0.5)",
                fontSize: 10,
                textAlign: "center",
              }}
            >
              分享给朋友，测测他们的人生口味
            </div>
          </div>
        </div>
      )}

      {/* Image Generating Spinner Overlay */}
      {generating && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            color: "#fff",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid rgba(255,255,255,0.2)",
              borderTopColor: "#ffd46a",
              borderRadius: "50%",
              animation: "lhSpin .8s linear infinite",
              marginBottom: 16,
            }}
          />
          <div style={{ fontSize: 14, fontFamily: serif, color: "#f4eddd", letterSpacing: ".1em" }}>
            正在精心烘焙人生报告图片...
          </div>
        </div>
      )}
    </Stage>
  );
}
