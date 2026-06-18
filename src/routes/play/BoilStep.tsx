import { useEffect, useState } from "react";
import { YuanyangPot } from "@/components/hotpot-art";
import { useIsPortrait } from "@/hooks/use-mobile";
import { BOIL_LINES, serif, btnPrimary } from "./constants";
/* ============ 沸腾 ============ */
export function BoilStep({
  boilStep,
  boilReady,
  storyLoading,
  baseImage,
  baseColor,
  onReport,
}: {
  boilStep: number;
  boilReady: boolean;
  storyLoading: boolean;
  baseImage?: string;
  baseColor?: string;
  onReport: () => void;
}) {
  const isPortrait = useIsPortrait();
  const [tipIndex, setTipIndex] = useState(0);

  const tips = [
    "正在融合锅底与食材风味...",
    "正在计算 100 金币人生分配...",
    "正在结合火锅推演人生哲理...",
    "AI 观察员正在为您撰写命运判词...",
    "正在整合你的命运故事轨迹..."
  ];

  useEffect(() => {
    if (!storyLoading) return;
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [storyLoading]);

  if (isPortrait) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100%",
        padding: "24px 20px 40px",
        boxSizing: "border-box",
        position: "relative",
        justifyContent: "space-between",
      }}>
        {/* Heat glow */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 200,
            transform: "translate(-50%,-50%)",
            width: 280,
            height: 180,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at 50% 62%,rgba(255,115,32,.28),rgba(180,56,43,.1) 44%,transparent 72%)",
            filter: "blur(12px)",
            animation: "lhHeatGlow 1.8s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        {/* Big Pot (260px size) */}
        <div
          style={{
            position: "relative",
            width: 260,
            height: 260,
            margin: "30px auto",
          }}
        >
          {/* Flames */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 2,
              transform: "translateX(-50%)",
              width: 150,
              height: 60,
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: `${18 + i * 17}%`,
                  bottom: 0,
                  width: 30 - (i % 2) * 5,
                  height: 48 + (i % 3) * 8,
                  borderRadius: "46% 46% 52% 52%",
                  background:
                    i % 2
                      ? "radial-gradient(ellipse at 50% 78%,#ffd46a 0%,#f47a25 42%,rgba(180,56,43,.15) 76%,transparent 100%)"
                      : "radial-gradient(ellipse at 50% 78%,#fff1a6 0%,#ff9b2f 38%,rgba(180,56,43,.18) 78%,transparent 100%)",
                  filter: "blur(1px)",
                  transformOrigin: "50% 100%",
                  animation: `lhFlame ${0.95 + i * 0.08}s ease-in-out ${i * 0.12}s infinite`,
                  opacity: 0.9,
                }}
              />
            ))}
          </div>

          {baseImage ? (
            <div style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              overflow: "hidden",
              border: "3px solid #9a7b4a",
              boxShadow: "0 0 0 4px rgba(90,70,40,.2), inset 0 0 20px rgba(0,0,0,.15)",
            }}>
              <img src={baseImage} alt="锅底" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ) : (
            <YuanyangPot />
          )}

          <div
            style={{
              position: "absolute",
              inset: 22,
              borderRadius: "50%",
              boxShadow: "inset 0 0 24px rgba(255,232,160,.22), 0 0 30px rgba(255,100,34,.22)",
              animation: "lhBrothBoil 1.25s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />

          {/* Bubbles */}
          {[
            { l: "34%", b: "30%", s: 10 },
            { l: "48%", b: "26%", s: 12 },
            { l: "60%", b: "30%", s: 8 },
            { l: "42%", b: "34%", s: 7 },
            { l: "53%", b: "38%", s: 6 },
          ].map((b, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: b.l,
                bottom: b.b,
                width: b.s,
                height: b.s,
                borderRadius: "50%",
                background: "rgba(255,246,218,.72)",
                boxShadow: "0 0 8px rgba(255,235,180,.28)",
                animation: `lhBub ${2.0 + i * 0.2}s ease-in ${i * 0.3}s infinite`,
              }}
            />
          ))}

          {/* Steam */}
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: `${25 + i * 15}%`,
                top: `${-4 + (i % 2) * 4}%`,
                width: 70 + i * 12,
                height: 50,
                background:
                  "radial-gradient(ellipse at 50% 100%,rgba(255,250,235,.6),transparent 70%)",
                filter: "blur(6px)",
                animation: `lhSteam ${2.4 + i * 0.35}s ease-in-out ${i * 0.35}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Observation text */}
        <div style={{ width: "100%", textAlign: "center", margin: "20px 0" }}>
          {BOIL_LINES.map((t, i) => (
            <div
              key={i}
              style={{
                fontFamily: serif,
                fontWeight: 600,
                fontSize: 19,
                letterSpacing: ".1em",
                color: "#f3e6c4",
                opacity: i < boilStep ? 1 : 0,
                transform: `translateY(${i < boilStep ? 0 : 10}px)`,
                transition: "all .8s ease",
                margin: "5px 0",
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Button Action */}
        <div style={{ width: "100%", textAlign: "center", marginBottom: 20 }}>
          {!boilReady ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                color: "#caa05a",
                fontSize: 13,
                letterSpacing: ".15em",
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  border: "2px solid rgba(202,160,90,.3)",
                  borderTopColor: "#caa05a",
                  borderRadius: "50%",
                  animation: "lhSpin .8s linear infinite",
                  display: "inline-block",
                }}
              />
              开火沸腾中 · AI 正在整合你的选择…
            </div>
          ) : storyLoading ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                color: "#caa05a",
                fontSize: 13,
                letterSpacing: ".15em",
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  border: "2px solid rgba(202,160,90,.3)",
                  borderTopColor: "#caa05a",
                  borderRadius: "50%",
                  animation: "lhSpin .8s linear infinite",
                  display: "inline-block",
                }}
              />
              <span
                key={tipIndex}
                style={{
                  animation: "lhFade 0.5s ease both",
                  display: "inline-block",
                }}
              >
                {tips[tipIndex]}
              </span>
            </div>
          ) : (
            <button
              onClick={onReport}
              style={{
                ...btnPrimary,
                border: "1.5px solid #caa05a",
                fontSize: 16,
                letterSpacing: ".12em",
                boxShadow: "0 0 20px rgba(202,160,90,.3)",
                animation: "lhFade .6s ease both",
                width: "100%",
                maxWidth: 280,
              }}
            >
              查看人生火锅报告
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 640,
          top: 404,
          transform: "translate(-50%,-50%)",
          width: 470,
          height: 250,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at 50% 62%,rgba(255,115,32,.28),rgba(180,56,43,.1) 44%,transparent 72%)",
          filter: "blur(14px)",
          animation: "lhHeatGlow 1.8s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      {/* 大锅 */}
      <div
        style={{
          position: "absolute",
          left: 640,
          top: 330,
          transform: "translate(-50%,-50%)",
          width: 400,
          height: 400,
        }}
      >
        {/* 炉火 */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 2,
            transform: "translateX(-50%)",
            width: 220,
            height: 86,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: `${18 + i * 17}%`,
                bottom: 0,
                width: 46 - (i % 2) * 8,
                height: 70 + (i % 3) * 10,
                borderRadius: "46% 46% 52% 52%",
                background:
                  i % 2
                    ? "radial-gradient(ellipse at 50% 78%,#ffd46a 0%,#f47a25 42%,rgba(180,56,43,.15) 76%,transparent 100%)"
                    : "radial-gradient(ellipse at 50% 78%,#fff1a6 0%,#ff9b2f 38%,rgba(180,56,43,.18) 78%,transparent 100%)",
                filter: "blur(1px)",
                transformOrigin: "50% 100%",
                animation: `lhFlame ${0.95 + i * 0.08}s ease-in-out ${i * 0.12}s infinite`,
                opacity: 0.9,
              }}
            />
          ))}
        </div>
        {baseImage ? (
          <div style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            overflow: "hidden",
            border: "4px solid #9a7b4a",
            boxShadow: "0 0 0 6px rgba(90,70,40,.2), inset 0 0 30px rgba(0,0,0,.15)",
          }}>
            <img src={baseImage} alt="锅底" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        ) : (
          <YuanyangPot />
        )}
        <div
          style={{
            position: "absolute",
            inset: 34,
            borderRadius: "50%",
            boxShadow: "inset 0 0 36px rgba(255,232,160,.22), 0 0 42px rgba(255,100,34,.22)",
            animation: "lhBrothBoil 1.25s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        {/* 气泡 */}
        {[
          { l: "34%", b: "30%", s: 14, d: "0s", dur: "2.2s" },
          { l: "48%", b: "26%", s: 18, d: ".4s", dur: "2.6s" },
          { l: "60%", b: "30%", s: 12, d: ".8s", dur: "2s" },
          { l: "42%", b: "34%", s: 10, d: "1.1s", dur: "2.4s" },
          { l: "53%", b: "38%", s: 9, d: ".2s", dur: "1.7s" },
          { l: "66%", b: "38%", s: 11, d: ".65s", dur: "1.9s" },
          { l: "29%", b: "42%", s: 8, d: ".9s", dur: "1.6s" },
          { l: "55%", b: "50%", s: 7, d: "1.2s", dur: "1.5s" },
        ].map((b, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: b.l,
              bottom: b.b,
              width: b.s,
              height: b.s,
              borderRadius: "50%",
              background: "rgba(255,246,218,.72)",
              boxShadow: "0 0 10px rgba(255,235,180,.28)",
              animation: `lhBub ${b.dur} ease-in ${b.d} infinite`,
            }}
          />
        ))}
        {/* 蒸汽 */}
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${32 + i * 12}%`,
              top: `${-2 + (i % 2) * 5}%`,
              width: 105 + i * 18,
              height: 72,
              background:
                "radial-gradient(ellipse at 50% 100%,rgba(255,250,235,.6),transparent 70%)",
              filter: "blur(8px)",
              animation: `lhSteam ${2.4 + i * 0.35}s ease-in-out ${i * 0.35}s infinite`,
            }}
          />
        ))}
      </div>

      {/* AI 观察文案 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center" }}>
        {BOIL_LINES.map((t, i) => (
          <div
            key={i}
            style={{
              fontFamily: serif,
              fontWeight: 600,
              fontSize: 27,
              letterSpacing: ".14em",
              color: "#f3e6c4",
              opacity: i < boilStep ? 1 : 0,
              transform: `translateY(${i < boilStep ? 0 : 14}px)`,
              transition: "all .8s ease",
              margin: "7px 0",
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {/* 状态 / 按钮 */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, textAlign: "center" }}>
        {!boilReady ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              color: "#caa05a",
              fontSize: 14,
              letterSpacing: ".2em",
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                border: "2px solid rgba(202,160,90,.3)",
                borderTopColor: "#caa05a",
                borderRadius: "50%",
                animation: "lhSpin .8s linear infinite",
                display: "inline-block",
              }}
            />
            开火沸腾中 · AI 正在整合你的选择…
          </div>
        ) : storyLoading ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              color: "#caa05a",
              fontSize: 14,
              letterSpacing: ".2em",
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                border: "2px solid rgba(202,160,90,.3)",
                borderTopColor: "#caa05a",
                borderRadius: "50%",
                animation: "lhSpin .8s linear infinite",
                display: "inline-block",
              }}
            />
            <span
              key={tipIndex}
              style={{
                animation: "lhFade 0.5s ease both",
                display: "inline-block",
              }}
            >
              {tips[tipIndex]}
            </span>
          </div>
        ) : (
          <button
            onClick={onReport}
            style={{
              ...btnPrimary,
              border: "1.5px solid #caa05a",
              fontSize: 19,
              letterSpacing: ".18em",
              boxShadow: "0 0 26px rgba(202,160,90,.3)",
              animation: "lhFade .6s ease both",
            }}
          >
            查 看 人 生 火 锅 报 告
          </button>
        )}
      </div>
    </>
  );
}

