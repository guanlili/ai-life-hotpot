import { useMemo, useRef, useState } from "react";
import { INGREDIENTS } from "@/data/hotpot";
import { useIsPortrait, useWindowSize } from "@/hooks/use-mobile";
import { C, serif, btnPrimary } from "./constants";
import { SelectBadge, SideTag } from "./shared";
import { CenterPot, RealFoodVisual } from "./visuals";
export function IngStep({
  ings,
  meatPicked,
  vegPicked,
  baseImage,
  baseColor,
  secs,
  lifeLeft,
  onToggle,
  onNext,
  gestureEnabled,
  onToggleGesture,
}: {
  ings: string[];
  meatPicked: number;
  vegPicked: number;
  baseImage?: string;
  baseColor?: string;
  secs: number;
  lifeLeft: number;
  onToggle: (id: string) => void;
  onNext: () => void;
  gestureEnabled?: boolean;
  onToggleGesture?: () => void;
}) {
  const isPortrait = useIsPortrait();
  const { width: winWidth } = useWindowSize();
  const ring = useMemo(
    () =>
      INGREDIENTS.map((it, i) => {
        const a = -Math.PI / 2 + (i + 0.5) * ((2 * Math.PI) / INGREDIENTS.length);
        return { it, x: C.cx + 440 * Math.cos(a), y: C.cy + 200 * Math.sin(a) };
      }),
    [],
  );
  const mm = Math.floor(secs / 60);
  const ss = String(secs % 60).padStart(2, "0");
  const timesUp = secs <= 0;

  // 下锅飞入:仅"新增"食材时,从食材位置划弧飞向锅心。
  const [flyers, setFlyers] = useState<{ key: number; food: string; x: number; y: number }[]>([]);
  const flyKey = useRef(0);
  const handlePick = (it: (typeof INGREDIENTS)[number], x: number, y: number) => {
    if (!ings.includes(it.id)) {
      const key = flyKey.current++;
      setFlyers((f) => [...f, { key, food: it.food, x, y }]);
      window.setTimeout(() => setFlyers((f) => f.filter((p) => p.key !== key)), 700);
    }
    onToggle(it.id);
  };

  if (isPortrait) {
    const potY = gestureEnabled ? 260 : 120;
    const cx = winWidth / 2;
    const cy = 260;
    const rx = Math.min(135, winWidth / 2 - 35);
    const ry = 115;
    const portraitRing = INGREDIENTS.map((it, i) => {
      const a = -Math.PI / 2 + (i + 0.5) * ((2 * Math.PI) / INGREDIENTS.length);
      return {
        it,
        x: cx + rx * Math.cos(a),
        y: cy + ry * Math.sin(a),
      };
    });

    return (
      <div
        style={
          gestureEnabled
            ? {
                position: "absolute",
                left: 0,
                right: 0,
                top: 76,
                bottom: 0,
                width: "100%",
                height: "calc(100% - 76px)",
                overflow: "hidden",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }
            : {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                padding: "0 16px 130px",
                boxSizing: "border-box",
                position: "relative",
              }
        }
      >
        <div style={{ textAlign: "center", marginTop: 20, marginBottom: 15 }}>
          <div style={{ fontSize: 12, letterSpacing: ".3em", color: "#9a6b3a" }}>第二步</div>
          <div
            style={{
              fontFamily: serif,
              fontWeight: 700,
              fontSize: 24,
              color: "#2c2418",
              marginTop: 4,
            }}
          >
            配食材 · 涮一锅人生
          </div>
          <div
            style={{
              fontFamily: serif,
              fontWeight: 700,
              fontSize: 18,
              color: timesUp ? "#b4382b" : "#7a3228",
              marginTop: 6,
            }}
          >
            {timesUp ? "时间到 · 随时开涮" : `一分 · ${mm}:${ss}`}
          </div>
          <div style={{ fontSize: 11, color: "#8a6a44", marginTop: 4 }}>
            荤 {meatPicked} · 素 {vegPicked} · 多少不限，可不选
          </div>
          {onToggleGesture && (
            <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
              <button
                onClick={onToggleGesture}
                style={{
                  background: gestureEnabled ? "#b4382b" : "rgba(247,240,223,.7)",
                  border: "1.5px solid",
                  borderColor: gestureEnabled ? "#b4382b" : "rgba(154,123,74,.4)",
                  borderRadius: 8,
                  padding: "6px 14px",
                  color: gestureEnabled ? "#f4eddd" : "#5a4630",
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all .2s ease",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: gestureEnabled ? "#ffd46a" : "#a98f63",
                  }}
                />
                手势模式 {gestureEnabled ? "ON" : "OFF"}
              </button>
            </div>
          )}
        </div>

        {gestureEnabled ? (
          <>
            <CenterPot
              size={220}
              baseImage={baseImage}
              baseColor={baseColor}
              bits={ings}
              yOffset={260}
            />
            {portraitRing.map(({ it, x, y }) => {
              const sel = ings.includes(it.id);
              return (
                <div
                  key={it.id}
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    transform: "translate(-50%,-50%)",
                    width: 76,
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: 68,
                      height: 50,
                      margin: "0 auto",
                      borderRadius: "50%",
                      background: "radial-gradient(circle at 50% 34%,#f6efe0,#d6c6a0 78%)",
                      border: "1.5px solid rgba(90,68,42,.4)",
                      boxShadow:
                        "0 6px 12px rgba(90,70,40,.15), inset 0 1px 3px rgba(255,255,255,.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0.15,
                      }}
                    >
                      <RealFoodVisual food={it.food} size={36} />
                    </div>
                    {sel && <SelectBadge label="✓" />}
                  </div>
                  <div
                    style={{
                      marginTop: 2,
                      fontFamily: serif,
                      fontWeight: 700,
                      fontSize: 10,
                      color: "#2c2418",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {it.name}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            {/* Center Pot Container */}
            <div style={{ height: 240, position: "relative", width: "100%" }}>
              <CenterPot
                size={220}
                baseImage={baseImage}
                baseColor={baseColor}
                bits={ings}
                yOffset={potY}
              />
            </div>

            {/* Ingredients Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "14px 10px",
                width: "100%",
                maxWidth: 420,
                marginTop: 20,
              }}
            >
              {INGREDIENTS.map((it) => {
                const sel = ings.includes(it.id);
                return (
                  <div
                    key={it.id}
                    className="lh-clickable animate-lhFade"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const stageEl = document.querySelector(".stage-board");
                      let clickX = rect.left + rect.width / 2;
                      let clickY = rect.top + rect.height / 2;
                      if (stageEl) {
                        const sRect = stageEl.getBoundingClientRect();
                        clickX = clickX - sRect.left;
                        clickY = clickY - sRect.top;
                      }
                      handlePick(it, clickX, clickY);
                    }}
                    style={{
                      cursor: "pointer",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: 76,
                        height: 56,
                        borderRadius: "50%",
                        background: "radial-gradient(circle at 50% 34%,#f6efe0,#d6c6a0 78%)",
                        border: "1.5px solid rgba(90,68,42,.4)",
                        boxShadow: "0 8px 16px rgba(90,70,40,.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <RealFoodVisual food={it.food} size={44} />
                      {sel && <SelectBadge label="✓" />}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontFamily: serif,
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#2c2418",
                      }}
                    >
                      {it.name}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: it.kind === "meat" ? "#9a3a2c" : "#4f6a2e",
                      }}
                    >
                      −{it.cost}金
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Particles flying inside this viewport container */}
            {flyers.map((p) => {
              const targetX = typeof window !== "undefined" ? window.innerWidth / 2 : 180;
              return (
                <div
                  key={p.key}
                  style={{
                    position: "absolute",
                    left: p.x,
                    top: p.y,
                    width: 48,
                    height: 48,
                    pointerEvents: "none",
                    zIndex: 25,
                    filter: "drop-shadow(0 4px 6px rgba(80,50,25,.3))",
                    animation: "lhFly .7s cubic-bezier(.5,0,.7,1) forwards",
                    ["--dx" as string]: `${targetX - p.x}px`,
                    ["--dy" as string]: `${180 + potY - p.y}px`, // 180 is title offset
                  }}
                >
                  <RealFoodVisual food={p.food} size={48} />
                </div>
              );
            })}
          </>
        )}

        {/* Gold stats & actions */}
        <div
          style={{
            position: gestureEnabled ? "absolute" : "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "12px 20px 24px",
            background: "linear-gradient(180deg, transparent, #f4eddd 25%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            zIndex: 10,
          }}
        >
          {/* Life Left Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifySelf: "stretch",
              width: "100%",
              maxWidth: 300,
              gap: 10,
            }}
          >
            <span style={{ fontSize: 12, color: "#9a6b3a", whiteSpace: "nowrap" }}>
              剩余人生金币
            </span>
            <div
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: "#cdbf9f",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${lifeLeft}%`,
                  height: "100%",
                  background: "#b4382b",
                  transition: "width .3s ease",
                }}
              />
            </div>
            <span style={{ fontSize: 13, fontFamily: serif, fontWeight: 700, color: "#2c2418" }}>
              {lifeLeft}/100
            </span>
          </div>
          <button onClick={onNext} style={{ ...btnPrimary, width: "100%", maxWidth: 300 }}>
            下一步 · 调蘸料
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 26,
          left: 0,
          right: 0,
          textAlign: "center",
          animation: "lhFade .5s ease both",
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: ".5em", color: "#9a6b3a" }}>第二步</div>
        <div
          style={{
            fontFamily: serif,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: ".14em",
            color: "#2c2418",
            marginTop: 2,
          }}
        >
          配 食 材 · 涮 一 锅 人 生
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 92,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: serif,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: ".12em",
            color: timesUp ? "#b4382b" : "#7a3228",
            animation: timesUp ? "lhPulse 1.4s ease-in-out infinite" : undefined,
          }}
        >
          {timesUp ? "时间到 · 随时开涮" : `一分 · ${mm}:${ss}`}
        </div>
        <div style={{ fontSize: 12, color: "#8a6a44", marginTop: 3, letterSpacing: ".1em" }}>
          荤 {meatPicked} · 素 {vegPicked} · 多少不限，可不选
        </div>
      </div>

      <CenterPot size={340} baseImage={baseImage} baseColor={baseColor} bits={ings} />

      {/* 荤(右) / 素(左) 分区提示 */}
      <SideTag char="荤" sub="MEAT" x={904} count={meatPicked} tone="#9a3a2c" />
      <SideTag char="素" sub="VEG" x={376} count={vegPicked} tone="#4f6a2e" />

      {ring.map(({ it, x, y }) => {
        const sel = ings.includes(it.id);
        return (
          <div
            key={it.id}
            className="lh-clickable"
            role="button"
            tabIndex={0}
            aria-pressed={sel}
            onClick={() => handlePick(it, x, y)}
            onKeyDown={(e) => e.key === "Enter" && handlePick(it, x, y)}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%,-50%)",
              width: 132,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                width: 110,
                height: 78,
                margin: "0 auto",
                borderRadius: "50%",
                background: "radial-gradient(circle at 50% 34%,#f6efe0,#d6c6a0 78%)",
                border: "1.5px solid rgba(90,68,42,.4)",
                boxShadow: "0 12px 22px rgba(90,70,40,.24), inset 0 2px 6px rgba(255,255,255,.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 58,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  filter: "drop-shadow(0 3px 3px rgba(80,50,25,.18))",
                }}
              >
                <RealFoodVisual food={it.food} size={66} />
              </div>
              {sel && <SelectBadge label="✓" />}
            </div>
            <div
              style={{
                marginTop: 3,
                fontFamily: serif,
                fontWeight: 700,
                fontSize: 14,
                color: "#2c2418",
                letterSpacing: ".06em",
              }}
            >
              {it.name}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: it.kind === "meat" ? "#9a3a2c" : "#4f6a2e",
                letterSpacing: ".04em",
              }}
            >
              {it.kind === "meat" ? "荤" : "素"} · −{it.cost}金币
            </div>
          </div>
        );
      })}

      {/* 下锅飞入的食材 */}
      {flyers.map((p) => (
        <div
          key={p.key}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: 64,
            height: 64,
            pointerEvents: "none",
            zIndex: 5,
            filter: "drop-shadow(0 6px 8px rgba(80,50,25,.3))",
            animation: "lhFly .7s cubic-bezier(.5,0,.7,1) forwards",
            ["--dx" as string]: `${640 - p.x}px`,
            ["--dy" as string]: `${400 - p.y}px`,
          }}
        >
          <RealFoodVisual food={p.food} size={64} />
        </div>
      ))}

      {/* 隔空手势开关 */}
      {onToggleGesture && (
        <button
          onClick={onToggleGesture}
          aria-pressed={gestureEnabled}
          style={{
            position: "absolute",
            left: 34,
            top: 122,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: serif,
            fontSize: 13,
            letterSpacing: ".06em",
            color: gestureEnabled ? "#f4eddd" : "#5a4630",
            background: gestureEnabled ? "#b4382b" : "rgba(247,240,223,.7)",
            border: gestureEnabled ? "1.5px solid #b4382b" : "1.5px solid rgba(154,123,74,.4)",
            boxShadow: gestureEnabled ? "0 6px 16px rgba(150,40,30,.28)" : "none",
            transition: "all .2s ease",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: gestureEnabled ? "#ffd46a" : "#a98f63",
            }}
          />
          隔空手势 {gestureEnabled ? "ON" : "OFF"}
        </button>
      )}

      {/* 金币 */}
      <div style={{ position: "absolute", left: 34, bottom: 30 }}>
        <div style={{ fontSize: 11, letterSpacing: ".3em", color: "#9a6b3a" }}>金币</div>
        <div
          style={{
            fontFamily: serif,
            fontWeight: 900,
            fontSize: 38,
            color: "#2c2418",
            lineHeight: 1,
          }}
        >
          {lifeLeft}
          <span style={{ fontSize: 15, color: "#9a6b3a" }}> /100</span>
        </div>
        <div
          style={{
            width: 170,
            height: 6,
            marginTop: 7,
            borderRadius: 3,
            background: "#cdbf9f",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${lifeLeft}%`,
              height: "100%",
              background: "#b4382b",
              transition: "width .4s ease",
            }}
          />
        </div>
      </div>

      {/* 手势模式切换按钮 */}
      <div style={{ position: "absolute", left: 34, top: 80 }}>
        <button
          onClick={() => onToggleGesture?.()}
          style={{
            background: gestureEnabled ? "#b4382b" : "rgba(247,240,223,.7)",
            border: "1.5px solid",
            borderColor: gestureEnabled ? "#b4382b" : "rgba(154,123,74,.4)",
            borderRadius: 8,
            padding: "8px 16px",
            color: gestureEnabled ? "#f4eddd" : "#5a4630",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all .2s ease",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: gestureEnabled ? "#ffd46a" : "#a98f63",
            }}
          />
          手势模式 {gestureEnabled ? "ON" : "OFF"}
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          left: 640,
          bottom: 6,
          transform: "translateX(-50%)",
          textAlign: "center",
        }}
      >
        <button
          onClick={onNext}
          style={{
            ...btnPrimary,
            padding: "10px 38px",
            fontSize: 16,
            boxShadow: "0 8px 18px rgba(150,40,30,.26)",
            animation: timesUp ? "lhRingPulse 1.6s ease-in-out infinite" : undefined,
          }}
        >
          {timesUp ? "时 间 到 · 开 始 涮" : "开 始 涮 人 生"}
        </button>
      </div>
    </>
  );
}
