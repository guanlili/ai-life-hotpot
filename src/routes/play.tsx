import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BASES, CONDIMENTS, INGREDIENTS, itemById } from "@/data/hotpot";
import { Stage } from "@/components/Stage";
import { YuanyangPot } from "@/components/hotpot-art";
import { encodeSummary, type Pick, type SelectionSummary } from "@/lib/scoring";
import { loadSession, saveSession } from "@/lib/session";

type Step = "base" | "ingredients" | "sauce" | "boiling";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "煮一锅 · AI 人生火锅" },
      { name: "description", content: "选锅底，下食材，加蘸料。AI 正在观察你。" },
    ],
  }),
  component: Play,
});

const serif = "'Noto Serif SC',serif";
const BOIL_LINES = ["我们已经观察你三分钟。", "你以为自己在配火锅。", "其实，你正在构建人生。"];
const TIMER_SECONDS = 120;
const C = { cx: 640, cy: 412 };

const btnPrimary: CSSProperties = {
  border: "none",
  cursor: "pointer",
  padding: "13px 46px",
  borderRadius: 6,
  background: "#b4382b",
  color: "#f4eddd",
  fontFamily: serif,
  fontWeight: 700,
  fontSize: 18,
  letterSpacing: ".18em",
  boxShadow: "0 8px 20px rgba(150,40,30,.3)",
};

const baseById = (id: string) => BASES.find((b) => b.id === id);

/* 选中徽标:朱红描边圈 + 右上角标(序号或 ✓)。需放在 position:relative 容器内。 */
function SelectBadge({ label }: { label: ReactNode }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: -5,
          borderRadius: "50%",
          border: "2.5px solid #b4382b",
          boxShadow: "0 0 0 4px rgba(180,56,43,.14)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -6,
          top: -6,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#b4382b",
          color: "#f4eddd",
          fontSize: 13,
          fontWeight: 700,
          lineHeight: "24px",
          textAlign: "center",
        }}
      >
        {label}
      </div>
    </>
  );
}

/* 荤/素 分区标识:落在锅与食材弧之间的空隙,作为分组提示(不拦截点击)。 */
function SideTag({
  char,
  sub,
  x,
  count,
  tone,
}: {
  char: string;
  sub: string;
  x: number;
  count: number;
  tone: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 400,
        transform: "translate(-50%,-50%)",
        textAlign: "center",
        pointerEvents: "none",
        animation: "lhFade .6s ease both",
      }}
    >
      <div
        style={{
          fontFamily: serif,
          fontWeight: 900,
          fontSize: 56,
          lineHeight: 1,
          color: tone,
          opacity: 0.16,
        }}
      >
        {char}
      </div>
      <div
        style={{ marginTop: 6, fontSize: 11, letterSpacing: ".24em", color: tone, opacity: 0.75 }}
      >
        {sub} · {count}
      </div>
    </div>
  );
}

function Play() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("base");
  // 锅底:不限数量,可不选;前两个依次进左鱼/右鱼上色
  const [bases, setBases] = useState<string[]>([]);
  const [ings, setIngs] = useState<string[]>([]);
  const [conds, setConds] = useState<string[]>([]);
  const [secs, setSecs] = useState(TIMER_SECONDS);
  const [boilStep, setBoilStep] = useState(0);
  const [pickToast, setPickToast] = useState("张开手悬停，握拳抓取，放进锅里松开。");
  const picksRef = useRef<Pick[]>([]);
  const stepStartRef = useRef(Date.now());
  const orderRef = useRef(0);

  useEffect(() => {
    stepStartRef.current = Date.now();
  }, [step]);

  useEffect(() => {
    if (!pickToast) return;
    const id = window.setTimeout(() => setPickToast(""), 2200);
    return () => window.clearTimeout(id);
  }, [pickToast]);

  // 食材倒计时
  useEffect(() => {
    if (step !== "ingredients") return;
    setSecs(TIMER_SECONDS);
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [step]);

  // 沸腾逐行显现
  useEffect(() => {
    if (step !== "boiling") return;
    setBoilStep(0);
    const id = setInterval(() => setBoilStep((s) => s + 1), 1500);
    return () => clearInterval(id);
  }, [step]);

  const recordPick = (id: string) => {
    const now = Date.now();
    const item = itemById(id);
    picksRef.current.push({
      id,
      order: orderRef.current++,
      hesitateMs: now - stepStartRef.current,
    });
    stepStartRef.current = now;
    if (item) {
      setPickToast(`${item.name} 已入锅 · AI 记下了你的第 ${orderRef.current} 次选择`);
    }
  };

  const toggleBase = (id: string) => {
    if (bases.includes(id)) {
      setBases(bases.filter((x) => x !== id));
      return;
    }
    recordPick(id);
    setBases([...bases, id]);
  };
  const meatPicked = ings.filter(
    (id) => INGREDIENTS.find((i) => i.id === id)?.kind === "meat",
  ).length;
  const vegPicked = ings.length - meatPicked;

  const toggleIng = (id: string) => {
    if (ings.includes(id)) {
      setIngs(ings.filter((x) => x !== id));
      return;
    }
    recordPick(id);
    setIngs([...ings, id]);
  };
  const toggleCond = (id: string) => {
    if (conds.includes(id)) {
      setConds(conds.filter((x) => x !== id));
      return;
    }
    recordPick(id);
    setConds([...conds, id]);
  };

  const boilReady = boilStep >= BOIL_LINES.length + 1;
  const usedLife = ings.reduce((s, id) => s + (INGREDIENTS.find((i) => i.id === id)?.cost ?? 0), 0);
  const lifeLeft = Math.max(0, 100 - usedLife);

  const leftColor = bases[0] ? baseById(bases[0])?.color : undefined;
  const rightColor = bases[1] ? baseById(bases[1])?.color : undefined;

  const goReport = () => {
    const summary: SelectionSummary = {
      base: bases,
      ingredients: ings,
      condiments: conds,
      picks: picksRef.current,
    };
    saveSession({ ...loadSession(), ...summary });
    navigate({ to: "/report/$id", params: { id: encodeSummary(summary) } });
  };

  return (
    <Stage dark={step === "boiling"}>
      {step !== "boiling" && <StepRail step={step} />}
      {step === "base" && (
        <BaseStep
          bases={bases}
          leftColor={leftColor}
          rightColor={rightColor}
          onPick={toggleBase}
          onNext={() => setStep("ingredients")}
        />
      )}
      {step === "ingredients" && (
        <IngStep
          ings={ings}
          meatPicked={meatPicked}
          vegPicked={vegPicked}
          leftColor={leftColor}
          rightColor={rightColor}
          secs={secs}
          lifeLeft={lifeLeft}
          onToggle={toggleIng}
          onNext={() => setStep("sauce")}
        />
      )}
      {step === "sauce" && (
        <SauceStep conds={conds} onToggle={toggleCond} onConfirm={() => setStep("boiling")} />
      )}
      {step === "boiling" && (
        <BoilStep
          boilStep={boilStep}
          boilReady={boilReady}
          leftColor={leftColor}
          rightColor={rightColor}
          onReport={goReport}
        />
      )}
      <ObserverPanel
        step={step}
        bases={bases}
        ings={ings}
        conds={conds}
        pickToast={pickToast}
        lifeLeft={lifeLeft}
      />
    </Stage>
  );
}

/* ============ 锅底(选两个 → 太极双鱼) ============ */
function BaseStep({
  bases,
  leftColor,
  rightColor,
  onPick,
  onNext,
}: {
  bases: string[];
  leftColor?: string;
  rightColor?: string;
  onPick: (id: string) => void;
  onNext: () => void;
}) {
  return (
    <>
      <ScreenHead
        step="第一步"
        title="择 锅 底 · 阴 阳 成 锅"
        sub={`已选 ${bases.length} 个 · 多少不限，可不选`}
      />
      <CenterPot size={340} left={leftColor} right={rightColor} />
      {BASES.map((b, i) => {
        const idx = bases.indexOf(b.id);
        const sel = idx >= 0;
        const leftSide = i < 3;
        return (
          <div
            key={b.id}
            className="lh-card"
            role="button"
            tabIndex={0}
            aria-pressed={sel}
            onClick={() => onPick(b.id)}
            onKeyDown={(e) => e.key === "Enter" && onPick(b.id)}
            style={{
              position: "absolute",
              left: leftSide ? 78 : "auto",
              right: leftSide ? "auto" : 78,
              top: 198 + (i % 3) * 122,
              width: 292,
              minHeight: 94,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 14px",
              borderRadius: 8,
              background: sel
                ? "linear-gradient(180deg,rgba(247,240,223,.92),rgba(236,225,201,.88))"
                : "rgba(247,240,223,.56)",
              border: sel ? "1.5px solid rgba(180,56,43,.72)" : "1px solid rgba(154,123,74,.28)",
              boxShadow: sel
                ? "0 14px 30px rgba(120,70,40,.18), inset 0 0 0 1px rgba(255,255,255,.35)"
                : "0 10px 22px rgba(90,70,40,.1), inset 0 1px 0 rgba(255,255,255,.38)",
              transition: "transform .22s ease, box-shadow .22s ease, border-color .22s ease",
            }}
          >
            <div
              style={{
                flex: "none",
                width: 66,
                height: 66,
                borderRadius: "50%",
                background: "radial-gradient(circle at 50% 34%,#f6efe0,#d6c6a0 78%)",
                border: "1.5px solid rgba(90,68,42,.4)",
                boxShadow: "0 8px 18px rgba(90,70,40,.2), inset 0 2px 6px rgba(255,255,255,.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: b.color,
                  boxShadow:
                    "inset 0 -6px 12px rgba(0,0,0,.25), inset 0 4px 8px rgba(255,255,255,.25)",
                }}
              />
              {sel && <SelectBadge label={idx + 1} />}
            </div>
            <div style={{ minWidth: 0, flex: 1, textAlign: leftSide ? "left" : "right" }}>
              {/* 只露锅底名字，藏起含义(tone/tagline),让选择更凭直觉 */}
              <div
                style={{
                  fontFamily: serif,
                  fontWeight: 800,
                  fontSize: 22,
                  lineHeight: 1.15,
                  color: "#2c2418",
                  letterSpacing: ".08em",
                }}
              >
                {b.name}
              </div>
            </div>
          </div>
        );
      })}
      <BottomBar>
        <button onClick={onNext} style={btnPrimary}>
          下 一 步 · 配 食 材
        </button>
      </BottomBar>
    </>
  );
}

/* ============ 食材 ============ */
function RealFoodVisual({ food, size = 82 }: { food: string; size?: number }) {
  const piece = (key: string, style: CSSProperties) => (
    <span key={key} style={{ position: "absolute", ...style }} />
  );
  const items: ReactNode[] = [];

  if (food === "beef" || food === "lamb") {
    const meatColors =
      food === "beef" ? ["#d35f64", "#f0b2b5", "#a9444e"] : ["#d98d95", "#f4c4c7", "#ba6670"];
    for (let i = 0; i < 5; i++) {
      items.push(
        piece(`roll${i}`, {
          left: 12 + (i % 3) * 20,
          top: 16 + Math.floor(i / 3) * 22,
          width: 32,
          height: 20,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at 38% 44%,${meatColors[1]} 0 22%,${meatColors[0]} 24% 58%,${meatColors[2]} 60% 100%)`,
          boxShadow: "0 2px 4px rgba(90,40,35,.24), inset 0 1px 3px rgba(255,255,255,.32)",
          transform: `rotate(${-18 + i * 14}deg)`,
        }),
      );
    }
    items.push(
      piece("marble", {
        left: 18,
        top: 30,
        width: 48,
        height: 18,
        borderRadius: "50%",
        background:
          "repeating-linear-gradient(120deg,transparent 0 8px,rgba(255,245,235,.55) 9px 11px,transparent 12px 18px)",
        opacity: 0.7,
      }),
    );
  } else if (food === "shrimp") {
    items.push(
      piece("paste", {
        left: 16,
        top: 18,
        width: 54,
        height: 46,
        borderRadius: "44% 56% 48% 52%",
        background: "radial-gradient(circle at 38% 30%,#fff4ee,#f7b08e 50%,#ec7a3c)",
        boxShadow: "0 5px 9px rgba(150,70,35,.26), inset 0 5px 8px rgba(255,255,255,.42)",
        transform: "rotate(-14deg)",
      }),
    );
    for (let i = 0; i < 5; i++) {
      items.push(
        piece(`shrimp-line${i}`, {
          left: 22 + i * 8,
          top: 28 + (i % 2) * 8,
          width: 14,
          height: 3,
          borderRadius: 4,
          background: "rgba(200,72,36,.45)",
          transform: `rotate(${20 - i * 8}deg)`,
        }),
      );
    }
  } else if (food === "fish") {
    for (let i = 0; i < 5; i++) {
      items.push(
        piece(`fish${i}`, {
          left: 12 + (i % 3) * 19,
          top: 16 + Math.floor(i / 3) * 21,
          width: 39,
          height: 15,
          borderRadius: "50% 48% 46% 52%",
          background: "linear-gradient(100deg,#fff7f5,#f3d5d8 60%,#dbadb4)",
          border: "1px solid rgba(190,130,135,.32)",
          boxShadow: "0 2px 4px rgba(90,40,35,.16)",
          transform: `rotate(${-18 + i * 13}deg)`,
        }),
      );
    }
  } else if (food === "spam") {
    for (let i = 0; i < 4; i++) {
      items.push(
        piece(`spam${i}`, {
          left: 18 + (i % 2) * 24,
          top: 14 + Math.floor(i / 2) * 23,
          width: 28,
          height: 20,
          borderRadius: 4,
          background: "linear-gradient(145deg,#f0aaa2,#d87670)",
          border: "1px solid rgba(160,70,65,.25)",
          boxShadow: "0 3px 5px rgba(120,50,45,.18), inset 0 2px 4px rgba(255,255,255,.26)",
          transform: `rotate(${-8 + i * 6}deg)`,
        }),
      );
    }
    for (let i = 0; i < 10; i++) {
      items.push(
        piece(`spam-dot${i}`, {
          left: 22 + ((i * 11) % 44),
          top: 19 + ((i * 17) % 38),
          width: 3,
          height: 3,
          borderRadius: "50%",
          background: "rgba(145,58,58,.38)",
        }),
      );
    }
  } else if (food === "beefball") {
    for (let i = 0; i < 4; i++) {
      items.push(
        piece(`ball${i}`, {
          left: 18 + (i % 2) * 28,
          top: 16 + Math.floor(i / 2) * 25,
          width: 25,
          height: 25,
          borderRadius: "50%",
          background: "radial-gradient(circle at 34% 28%,#d3ad86,#9f704c 68%,#6d442e)",
          boxShadow: "0 3px 6px rgba(80,45,25,.28), inset -4px -5px 8px rgba(0,0,0,.16)",
        }),
      );
    }
  } else if (food === "greens") {
    for (let i = 0; i < 6; i++) {
      items.push(
        piece(`leaf${i}`, {
          left: 16 + (i % 3) * 15,
          top: 14 + Math.floor(i / 3) * 24,
          width: 18,
          height: 39,
          borderRadius: "70% 30% 70% 30%",
          background: `linear-gradient(135deg,${i % 2 ? "#75b957" : "#4b983d"},#276a28)`,
          boxShadow: "inset 2px 1px 2px rgba(255,255,255,.18), 0 2px 3px rgba(30,70,25,.18)",
          transform: `rotate(${-38 + i * 16}deg)`,
        }),
      );
    }
  } else if (food === "tofu") {
    for (let i = 0; i < 5; i++) {
      items.push(
        piece(`tofu${i}`, {
          left: 13 + (i % 3) * 20,
          top: 15 + Math.floor(i / 3) * 23,
          width: 22,
          height: 19,
          borderRadius: 3,
          background: "linear-gradient(145deg,#fff8df,#eadfbd)",
          border: "1px solid rgba(180,160,110,.28)",
          boxShadow: "0 3px 5px rgba(120,100,70,.16), inset 0 2px 3px rgba(255,255,255,.52)",
          transform: `rotate(${-8 + i * 7}deg)`,
        }),
      );
    }
  } else if (food === "corn") {
    items.push(
      piece("corn", {
        left: 31,
        top: 9,
        width: 24,
        height: 62,
        borderRadius: 16,
        background:
          "repeating-linear-gradient(90deg,rgba(190,132,22,.3) 0 2px,transparent 2px 7px), repeating-linear-gradient(0deg,#f3ce47 0 7px,#e5a932 8px 10px)",
        boxShadow: "0 4px 7px rgba(120,80,25,.22), inset 4px 0 6px rgba(255,255,255,.28)",
        transform: "rotate(18deg)",
      }),
    );
    items.push(
      piece("corn-leaf", {
        left: 19,
        top: 36,
        width: 22,
        height: 34,
        borderRadius: "80% 10% 80% 10%",
        background: "#6f9e37",
        transform: "rotate(-28deg)",
      }),
    );
  } else if (food === "enoki") {
    for (let i = 0; i < 18; i++) {
      items.push(
        piece(`enoki${i}`, {
          left: 20 + (i % 6) * 8,
          top: 14 + Math.floor(i / 6) * 8,
          width: 3,
          height: 43,
          borderRadius: 3,
          background: "#f1e3bd",
          transform: `rotate(${-16 + (i % 6) * 6}deg)`,
        }),
      );
      items.push(
        piece(`cap${i}`, {
          left: 18 + (i % 6) * 8,
          top: 10 + Math.floor(i / 6) * 8,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#e0c996",
        }),
      );
    }
  } else if (food === "fungus") {
    for (let i = 0; i < 7; i++) {
      items.push(
        piece(`fungus${i}`, {
          left: 14 + ((i * 15) % 48),
          top: 14 + ((i * 19) % 42),
          width: 26,
          height: 21,
          borderRadius: "52% 48% 58% 42%",
          background: "radial-gradient(circle at 35% 28%,#5a3826,#27160f 70%)",
          boxShadow: "0 2px 4px rgba(20,10,5,.28), inset 2px 2px 4px rgba(255,255,255,.08)",
          transform: `rotate(${i * 29}deg)`,
        }),
      );
    }
  } else {
    for (let i = 0; i < 7; i++) {
      items.push(
        piece(`noodle${i}`, {
          left: 14,
          top: 20 + i * 6,
          width: 58,
          height: 14,
          borderRadius: "50%",
          borderTop: "3px solid #ead59b",
          transform: `rotate(${-12 + i * 5}deg)`,
        }),
      );
    }
  }

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        overflow: "hidden",
        borderRadius: "50%",
        background: "radial-gradient(circle at 50% 45%,rgba(255,255,255,.16),transparent 70%)",
      }}
    >
      {items}
    </div>
  );
}

function IngStep({
  ings,
  meatPicked,
  vegPicked,
  leftColor,
  rightColor,
  secs,
  lifeLeft,
  onToggle,
  onNext,
}: {
  ings: string[];
  meatPicked: number;
  vegPicked: number;
  leftColor?: string;
  rightColor?: string;
  secs: number;
  lifeLeft: number;
  onToggle: (id: string) => void;
  onNext: () => void;
}) {
  const ring = INGREDIENTS.map((it, i) => {
    const a = -Math.PI / 2 + (i + 0.5) * ((2 * Math.PI) / 12);
    return { it, x: C.cx + 440 * Math.cos(a), y: C.cy + 200 * Math.sin(a) };
  });
  const mm = Math.floor(secs / 60);
  const ss = String(secs % 60).padStart(2, "0");

  // 下锅飞入:仅"新增"食材时,从食材位置划弧飞向锅心(640,400)。
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
            color: "#7a3228",
          }}
        >
          两分 · {mm}:{ss}
        </div>
        <div style={{ fontSize: 12, color: "#8a6a44", marginTop: 3, letterSpacing: ".1em" }}>
          荤 {meatPicked} · 素 {vegPicked} · 多少不限，可不选
        </div>
      </div>

      <CenterPot size={340} left={leftColor} right={rightColor} bits={ings} />

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
              {it.kind === "meat" ? "荤" : "素"} · −{it.cost}人生值
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

      {/* 人生值 */}
      <div style={{ position: "absolute", left: 34, bottom: 30 }}>
        <div style={{ fontSize: 11, letterSpacing: ".3em", color: "#9a6b3a" }}>人生值</div>
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
          }}
        >
          开 始 涮 人 生
        </button>
      </div>
    </>
  );
}

/* ============ 蘸料 ============ */
function CondimentVisual({ id, large = false }: { id: string; large?: boolean }) {
  const scale = large ? 1.28 : 1;
  const dot = (key: string, style: CSSProperties) => (
    <span key={key} style={{ position: "absolute", ...style }} />
  );
  const bits: ReactNode[] = [];

  if (id === "garlic") {
    for (let i = 0; i < 18; i++) {
      bits.push(
        dot(`g${i}`, {
          left: 18 + ((i * 17) % 44),
          top: 18 + ((i * 23) % 44),
          width: 7 * scale,
          height: 6 * scale,
          borderRadius: "45%",
          background: i % 3 ? "#f1ead2" : "#d8cda9",
          boxShadow: "inset -1px -1px 1px rgba(130,110,70,.28)",
          transform: `rotate(${i * 31}deg)`,
        }),
      );
    }
  } else if (id === "cilantro" || id === "scallion") {
    const colors =
      id === "cilantro" ? ["#287a38", "#3f9a4a", "#76b85b"] : ["#4a9a44", "#91c96a", "#e3efd0"];
    for (let i = 0; i < 20; i++) {
      bits.push(
        dot(`${id}${i}`, {
          left: 15 + ((i * 19) % 50),
          top: 17 + ((i * 29) % 46),
          width: (id === "scallion" ? 12 : 11) * scale,
          height: (id === "scallion" ? 4 : 6) * scale,
          borderRadius: id === "scallion" ? 8 : "65% 35% 65% 35%",
          background: colors[i % colors.length],
          transform: `rotate(${(i * 37) % 180}deg)`,
          boxShadow: "0 1px 1px rgba(0,0,0,.18)",
        }),
      );
    }
  } else if (id === "chili" || id === "chilioil") {
    for (let i = 0; i < 13; i++) {
      bits.push(
        dot(`c${i}`, {
          left: 16 + ((i * 21) % 48),
          top: 15 + ((i * 27) % 50),
          width: 13 * scale,
          height: 8 * scale,
          borderRadius: "50%",
          background: i % 2 ? "#d83b21" : "#a92016",
          border: "1px solid rgba(255,185,120,.42)",
          transform: `rotate(${i * 29}deg)`,
          boxShadow: "inset 0 0 0 2px rgba(90,20,10,.18)",
        }),
      );
    }
    if (id === "chilioil") {
      bits.unshift(
        dot("oil", {
          inset: 10,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 40% 34%,rgba(255,155,64,.86),rgba(180,45,24,.9) 64%,rgba(120,24,16,.92))",
          filter: "saturate(1.1)",
        }),
      );
    }
  } else if (id === "sesame" || id === "peanut") {
    for (let i = 0; i < (id === "sesame" ? 28 : 18); i++) {
      bits.push(
        dot(`${id}${i}`, {
          left: 15 + ((i * 13) % 52),
          top: 16 + ((i * 23) % 48),
          width: (id === "sesame" ? 4 : 9) * scale,
          height: (id === "sesame" ? 7 : 7) * scale,
          borderRadius: id === "sesame" ? "50%" : "40%",
          background:
            id === "sesame" ? (i % 3 ? "#ead9a6" : "#fff1c8") : i % 2 ? "#c48748" : "#e0b477",
          transform: `rotate(${i * 41}deg)`,
          boxShadow: "0 1px 1px rgba(0,0,0,.2)",
        }),
      );
    }
  } else {
    const sauceMap: Record<string, string> = {
      oyster: "radial-gradient(circle at 38% 30%,#8a6239,#4d2d18 66%,#2b170d)",
      vinegar: "radial-gradient(circle at 40% 32%,#7b3a1b,#3f1f12 72%,#1d0d08)",
      sesameoil: "radial-gradient(circle at 38% 30%,#ffd068,#d89b23 64%,#9b6416)",
    };
    bits.push(
      dot(id, {
        inset: 9,
        borderRadius: "50%",
        background: sauceMap[id],
        boxShadow: "inset 0 5px 12px rgba(255,255,255,.18), inset 0 -8px 16px rgba(0,0,0,.24)",
      }),
    );
    bits.push(
      dot(`${id}-shine`, {
        left: 24,
        top: 18,
        width: 26,
        height: 10,
        borderRadius: "50%",
        background: "rgba(255,255,255,.22)",
        filter: "blur(2px)",
        transform: "rotate(-12deg)",
      }),
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "50%" }}>
      {bits}
    </div>
  );
}

function SauceStep({
  conds,
  onToggle,
  onConfirm,
}: {
  conds: string[];
  onToggle: (id: string) => void;
  onConfirm: () => void;
}) {
  const oilColors = conds
    .map((id) => CONDIMENTS.find((c) => c.id === id)?.color)
    .filter(Boolean)
    .slice(0, 4) as string[];
  const mixedBits = conds.flatMap((id, i) => {
    const s = CONDIMENTS.find((c) => c.id === id);
    if (!s) return [];
    const count = ["sesame", "cilantro", "scallion"].includes(id) ? 9 : 6;
    return Array.from({ length: count }, (_, j) => {
      const a = i * 1.55 + j * 1.08;
      const r = 20 + ((j * 13 + i * 7) % 58);
      const isLeaf = id === "cilantro" || id === "scallion";
      const isRing = id === "chili" || id === "chilioil";
      return {
        id,
        color: s.color,
        size: isLeaf ? 11 : isRing ? 12 : id === "sesame" ? 5 : 8,
        x: 115 + r * Math.cos(a),
        y: 115 + r * Math.sin(a),
        rot: (i * 47 + j * 31) % 180,
        leaf: isLeaf,
        ring: isRing,
      };
    });
  });
  return (
    <>
      <ScreenHead
        step="第三步"
        title="调 蘸 料 · 定 行 为 风 格"
        sub={`挑出你顺手的味道 · 已选 ${conds.length} 味 · 多少不限，可不选`}
      />

      {/* 蘸料网格 */}
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 188,
          width: 700,
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: "22px 18px",
        }}
      >
        {CONDIMENTS.map((s) => {
          const sel = conds.includes(s.id);
          return (
            <div
              key={s.id}
              className="lh-card"
              role="button"
              tabIndex={0}
              aria-pressed={sel}
              onClick={() => onToggle(s.id)}
              onKeyDown={(e) => e.key === "Enter" && onToggle(s.id)}
              style={{ cursor: "pointer", textAlign: "center", outline: "none" }}
            >
              <div
                style={{
                  position: "relative",
                  width: 104,
                  height: 104,
                  margin: "0 auto",
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 50% 30%,#f4ecd9,#bd9f67 78%)",
                  boxShadow:
                    "0 12px 22px rgba(90,70,40,.24), inset 0 5px 10px rgba(255,255,255,.52), inset 0 -8px 18px rgba(95,70,35,.26)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle at 50% 34%,rgba(255,255,255,.2),rgba(40,25,12,.12) 72%), radial-gradient(circle at 50% 50%,#3a2416,#191009)",
                    boxShadow:
                      "inset 0 4px 8px rgba(255,255,255,.08), inset 0 -8px 12px rgba(0,0,0,.34)",
                    overflow: "hidden",
                  }}
                >
                  <CondimentVisual id={s.id} />
                </div>
                {sel && <SelectBadge label="✓" />}
              </div>
              <div
                style={{
                  marginTop: 7,
                  fontFamily: serif,
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#2c2418",
                }}
              >
                {s.name}
              </div>
              <div style={{ fontSize: 11, color: "#9a3a2c" }}>{s.style}</div>
            </div>
          );
        })}
      </div>

      {/* 味碟 */}
      <div style={{ position: "absolute", right: 96, top: 210, textAlign: "center" }}>
        <div
          style={{
            fontFamily: serif,
            fontSize: 15,
            color: "#5a4630",
            letterSpacing: ".2em",
            marginBottom: 16,
          }}
        >
          你 的 味 碟
        </div>
        <div
          style={{
            position: "relative",
            width: 230,
            height: 230,
            borderRadius: "50%",
            background: "radial-gradient(circle at 50% 36%,#f6efe0,#cdbb92 80%)",
            boxShadow:
              "0 18px 36px rgba(90,70,40,.3), inset 0 4px 10px rgba(255,255,255,.5), inset 0 -10px 22px rgba(120,95,55,.3)",
            margin: "0 auto",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "52%",
              transform: "translate(-50%,-50%)",
              width: 150,
              height: 150,
              borderRadius: "50%",
              background: oilColors.length
                ? `radial-gradient(circle at 40% 34%,rgba(255,255,255,.16),transparent 24%), conic-gradient(from 20deg, ${oilColors.join(", ")}, ${oilColors[0]}), radial-gradient(circle,#7a3a20,#25140c)`
                : "rgba(120,95,55,.12)",
              boxShadow: oilColors.length
                ? "inset 0 8px 16px rgba(255,255,255,.12), inset 0 -14px 24px rgba(0,0,0,.28)"
                : undefined,
              overflow: "hidden",
            }}
          >
            {oilColors.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  left: 34,
                  top: 26,
                  width: 56,
                  height: 18,
                  borderRadius: "50%",
                  background: "rgba(255,244,190,.28)",
                  filter: "blur(4px)",
                  transform: "rotate(-13deg)",
                }}
              />
            )}
          </div>
          {mixedBits.map((d, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: d.x,
                top: d.y,
                width: d.size,
                height: d.leaf ? 5 : d.ring ? 8 : d.size,
                borderRadius: d.leaf ? 8 : d.ring ? "50%" : "50%",
                background: d.color,
                border: d.ring ? "1px solid rgba(255,210,140,.42)" : undefined,
                boxShadow: "0 1px 3px rgba(0,0,0,.28)",
                transform: `rotate(${d.rot}deg)`,
                animation: "lhDrop .5s ease both",
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#a98f63", marginTop: 14, minHeight: 16 }}>
          {conds.length
            ? CONDIMENTS.filter((c) => conds.includes(c.id))
                .map((c) => c.style)
                .join(" · ")
            : "不蘸也是一味"}
        </div>
      </div>

      <BottomBar>
        <button onClick={onConfirm} style={btnPrimary}>
          选 好 了
        </button>
      </BottomBar>
    </>
  );
}

/* ============ 沸腾 ============ */
function BoilStep({
  boilStep,
  boilReady,
  leftColor,
  rightColor,
  onReport,
}: {
  boilStep: number;
  boilReady: boolean;
  leftColor?: string;
  rightColor?: string;
  onReport: () => void;
}) {
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
        <YuanyangPot left={leftColor} right={rightColor} />
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

/* ============ 共用小件 ============ */
function ScreenHead({ step, title, sub }: { step: string; title: string; sub?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        left: 0,
        right: 0,
        textAlign: "center",
        animation: "lhFade .5s ease both",
      }}
    >
      <div style={{ fontSize: 13, letterSpacing: ".5em", color: "#9a6b3a" }}>{step}</div>
      <div
        style={{
          fontFamily: serif,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: ".16em",
          color: "#2c2418",
          marginTop: 4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          width: 90,
          height: 2,
          margin: "14px auto 0",
          background: "linear-gradient(90deg,transparent,#b4382b,transparent)",
        }}
      />
      {sub && (
        <div style={{ fontSize: 13, color: "#8a6a44", marginTop: 10, letterSpacing: ".08em" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center" }}>
      {children}
    </div>
  );
}

function StepRail({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "base", label: "锅底" },
    { key: "ingredients", label: "食材" },
    { key: "sauce", label: "蘸料" },
  ];
  const current = steps.findIndex((s) => s.key === step);
  return (
    <div
      className="lh-panel"
      style={{
        position: "absolute",
        left: 32,
        top: 30,
        width: 188,
        borderRadius: 8,
        padding: "14px 14px 12px",
        color: "#5a4630",
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: ".26em", color: "#9a6b3a" }}>当前火候</div>
      <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
        {steps.map((s, i) => {
          const active = i <= current;
          return (
            <div key={s.key} style={{ flex: 1 }}>
              <div
                style={{
                  height: 5,
                  borderRadius: 3,
                  background: active ? "#b4382b" : "rgba(154,123,74,.25)",
                  transition: "background .28s ease",
                }}
              />
              <div
                style={{
                  marginTop: 6,
                  fontSize: 10,
                  color: active ? "#7a2418" : "#a98f63",
                  textAlign: "center",
                }}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ObserverPanel({
  step,
  bases,
  ings,
  conds,
  pickToast,
  lifeLeft,
}: {
  step: Step;
  bases: string[];
  ings: string[];
  conds: string[];
  pickToast: string;
  lifeLeft: number;
}) {
  const dark = step === "boiling";
  const selected = [...bases, ...ings, ...conds]
    .map((id) => itemById(id)?.name)
    .filter(Boolean)
    .slice(-4)
    .join(" · ");
  const copy =
    step === "base"
      ? "先选一口顺眼的锅。"
      : step === "ingredients"
        ? `人生值剩余 ${lifeLeft}，越早下锅的选择权重越高。`
        : step === "sauce"
          ? "蘸料会改变处理事情的方式，想加几味加几味。"
          : "火锅正在沸腾，AI 正把选择顺序与犹豫时间合成报告。";
  return (
    <div
      className={dark ? "lh-panel-dark" : "lh-panel"}
      style={{
        position: "absolute",
        right: 28,
        top: step === "boiling" ? undefined : 28,
        bottom: step === "boiling" ? 118 : undefined,
        width: 252,
        borderRadius: 8,
        padding: 16,
        color: dark ? "#f3e6c4" : "#3a2c1c",
        animation: "lhFade .45s ease both",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: dark ? "#caa05a" : "#b4382b",
            boxShadow: `0 0 0 6px ${dark ? "rgba(202,160,90,.12)" : "rgba(180,56,43,.12)"}`,
            animation: "lhRingPulse 1.6s ease-in-out infinite",
          }}
        />
        <div style={{ fontSize: 11, letterSpacing: ".24em", color: dark ? "#caa05a" : "#9a6b3a" }}>
          AI 观察中
        </div>
      </div>
      <div style={{ fontFamily: serif, fontSize: 15, lineHeight: 1.55, marginTop: 10 }}>
        {pickToast || copy}
      </div>
      {selected && (
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: dark ? "#caa05a" : "#8a6a44",
            lineHeight: 1.5,
          }}
        >
          最近入锅 · {selected}
        </div>
      )}
    </div>
  );
}

function potIngredientStyle(food: string, tint: string, i: number): CSSProperties {
  const base: CSSProperties = {
    position: "absolute",
    boxShadow: "0 2px 4px rgba(0,0,0,.28)",
    animation: "lhDrop .6s ease both",
  };
  if (["beef", "lamb", "fish"].includes(food)) {
    return {
      ...base,
      width: 28,
      height: 13,
      borderRadius: "50%",
      background:
        food === "fish"
          ? "linear-gradient(100deg,#fff7f5,#e9c1c6)"
          : `radial-gradient(ellipse at 40% 40%,#f4c0c3,${tint} 62%,#9a3a44)`,
      transform: `translate(-50%,-50%) rotate(${-18 + i * 17}deg)`,
    };
  }
  if (food === "shrimp") {
    return {
      ...base,
      width: 25,
      height: 15,
      borderRadius: "52% 48% 52% 48%",
      background: "linear-gradient(120deg,#fff0e5,#f28a4a)",
      transform: `translate(-50%,-50%) rotate(${i * 23}deg)`,
    };
  }
  if (food === "spam" || food === "tofu") {
    return {
      ...base,
      width: 20,
      height: 16,
      borderRadius: 3,
      background: food === "tofu" ? "linear-gradient(145deg,#fff8df,#eadfbd)" : "#e7a7a0",
      transform: `translate(-50%,-50%) rotate(${-8 + i * 11}deg)`,
    };
  }
  if (food === "beefball") {
    return {
      ...base,
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: "radial-gradient(circle at 35% 28%,#d3ad86,#8f5f40)",
      transform: "translate(-50%,-50%)",
    };
  }
  if (["greens", "enoki", "noodle"].includes(food)) {
    return {
      ...base,
      width: food === "greens" ? 13 : 25,
      height: food === "greens" ? 24 : 5,
      borderRadius: food === "greens" ? "70% 30% 70% 30%" : 8,
      background: food === "greens" ? "linear-gradient(135deg,#75b957,#276a28)" : "#ead59b",
      transform: `translate(-50%,-50%) rotate(${-30 + i * 18}deg)`,
    };
  }
  return {
    ...base,
    width: food === "corn" ? 14 : 18,
    height: food === "corn" ? 22 : 14,
    borderRadius: food === "corn" ? 8 : "52% 48% 58% 42%",
    background: food === "corn" ? "#f0c23a" : tint,
    transform: `translate(-50%,-50%) rotate(${i * 19}deg)`,
  };
}

function CenterPot({
  size,
  left,
  right,
  bits,
}: {
  size: number;
  left?: string;
  right?: string;
  bits?: string[];
}) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: C.cx,
          top: 400,
          transform: "translate(-50%,-50%)",
          width: size,
          height: size,
        }}
      >
        <YuanyangPot left={left} right={right} />
        {bits && bits.length > 0 && (
          <>
            {bits.map((id, i) => {
              const it = INGREDIENTS.find((x) => x.id === id);
              if (!it) return null;
              const a = i * 1.3;
              const r = 40 + (i % 3) * 14;
              return (
                <span
                  key={id}
                  style={{
                    ...potIngredientStyle(it.food, it.tint, i),
                    position: "absolute",
                    left: `calc(50% + ${r * Math.cos(a)}px)`,
                    top: `calc(48% + ${r * Math.sin(a)}px)`,
                  }}
                />
              );
            })}
          </>
        )}
      </div>
      {/* 蒸汽 */}
      <div
        style={{
          position: "absolute",
          left: 640,
          top: 235,
          transform: "translateX(-50%)",
          width: 120,
          height: 46,
          background: "radial-gradient(ellipse at 50% 100%,rgba(255,255,255,.6),transparent 70%)",
          filter: "blur(5px)",
          animation: "lhSteam 3.4s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
    </>
  );
}
