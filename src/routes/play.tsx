import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BASES, CONDIMENTS, INGREDIENTS, itemById } from "@/data/hotpot";
import { HotpotStage } from "@/components/HotpotStage";
import { encodeSummary, type Pick, type SelectionSummary } from "@/lib/scoring";
import { loadSession, saveSession } from "@/lib/session";

type Step = "base" | "ingredients" | "condiments" | "boiling";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "煮一锅 · AI 人生火锅" },
      { name: "description", content: "选锅底，下食材，加蘸料。AI 正在观察你。" },
    ],
  }),
  component: Play,
});

const OBSERVER_LINES = [
  "我们已经观察你三分钟。",
  "你以为自己在配火锅。",
  "其实你正在构建人生。",
  "你犹豫的那一瞬间，AI 看到了。",
  "每一次选择，都在出卖你的优先级。",
];

function Play() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("base");
  const [base, setBase] = useState<string | null>(null);
  const [ings, setIngs] = useState<string[]>([]);
  const [conds, setConds] = useState<string[]>([]);
  const picksRef = useRef<Pick[]>([]);
  const stepStartRef = useRef<number>(Date.now());
  const [hud, setHud] = useState(OBSERVER_LINES[0]);
  const orderRef = useRef(0);

  useEffect(() => { stepStartRef.current = Date.now(); }, [step]);

  useEffect(() => {
    const id = setInterval(() => {
      setHud(OBSERVER_LINES[Math.floor(Math.random() * OBSERVER_LINES.length)]);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const recordPick = (id: string) => {
    const now = Date.now();
    picksRef.current.push({
      id,
      order: orderRef.current++,
      hesitateMs: now - stepStartRef.current,
    });
    stepStartRef.current = now;
  };

  const chooseBase = (id: string) => {
    setBase(id);
    recordPick(id);
    setTimeout(() => setStep("ingredients"), 450);
  };

  const meatPicked = ings.filter((id) => INGREDIENTS.find((i) => i.id === id)?.kind === "meat").length;
  const vegPicked = ings.filter((id) => INGREDIENTS.find((i) => i.id === id)?.kind === "veg").length;

  const toggleIng = (id: string) => {
    if (ings.includes(id)) {
      setIngs(ings.filter((x) => x !== id));
      return;
    }
    const it = INGREDIENTS.find((i) => i.id === id)!;
    if (it.kind === "meat" && meatPicked >= 3) return;
    if (it.kind === "veg" && vegPicked >= 2) return;
    recordPick(id);
    setIngs([...ings, id]);
  };

  const toggleCond = (id: string) => {
    if (conds.includes(id)) {
      setConds(conds.filter((x) => x !== id));
      return;
    }
    if (conds.length >= 2) return;
    recordPick(id);
    setConds([...conds, id]);
  };

  const ingsReady = meatPicked === 3 && vegPicked === 2;

  const goBoil = () => {
    setStep("boiling");
    const summary: SelectionSummary = {
      base: base!,
      ingredients: ings,
      condiments: conds,
      picks: picksRef.current,
    };
    const local = loadSession();
    saveSession({ ...local, ...summary });
    const id = encodeSummary(summary);
    setTimeout(() => navigate({ to: "/report/$id", params: { id } }), 4200);
  };

  const dropped = useMemo(() => [...ings, ...conds], [ings, conds]);

  return (
    <div className="bg-noise min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* LEFT: pot + hud */}
        <div className="relative">
          <Stepper step={step} />
          <div className="mt-4">
            <HotpotStage baseId={base ?? undefined} dropped={dropped} boiling={step === "boiling" || dropped.length > 3} />
          </div>
          <div className="mt-6 rounded-xl border border-amber-200/30 bg-black/30 p-4 text-amber-100/80 backdrop-blur">
            <p className="text-xs tracking-[0.3em] text-amber-200/60">AI 正在观察</p>
            <p key={hud} className="mt-1 text-base">{hud}</p>
          </div>
        </div>

        {/* RIGHT: choices */}
        <div>
          {step === "base" && (
            <Section title="第一步 · 选个锅底" subtitle="锅底是你的人生底色。">
              <Grid>
                {BASES.map((b) => (
                  <Tile key={b.id} emoji={b.emoji} title={b.name} sub={b.tone}
                    selected={base === b.id} onClick={() => chooseBase(b.id)} accent={b.color} />
                ))}
              </Grid>
            </Section>
          )}

          {step === "ingredients" && (
            <Section
              title="第二步 · 三荤两素"
              subtitle={`荤 ${meatPicked}/3  ·  素 ${vegPicked}/2`}
              action={
                <button
                  disabled={!ingsReady}
                  onClick={() => setStep("condiments")}
                  className="rounded-full bg-primary px-6 py-2 font-bold text-primary-foreground disabled:opacity-40"
                >下一步 →</button>
              }
            >
              <div className="mb-3 text-xs tracking-widest text-amber-200/60">荤菜（选 3）</div>
              <Grid>
                {INGREDIENTS.filter((i) => i.kind === "meat").map((i) => (
                  <Tile key={i.id} emoji={i.emoji} title={i.name} sub={i.desc}
                    selected={ings.includes(i.id)}
                    disabled={!ings.includes(i.id) && meatPicked >= 3}
                    onClick={() => toggleIng(i.id)} />
                ))}
              </Grid>
              <div className="mb-3 mt-6 text-xs tracking-widest text-amber-200/60">素菜（选 2）</div>
              <Grid>
                {INGREDIENTS.filter((i) => i.kind === "veg").map((i) => (
                  <Tile key={i.id} emoji={i.emoji} title={i.name} sub={i.desc}
                    selected={ings.includes(i.id)}
                    disabled={!ings.includes(i.id) && vegPicked >= 2}
                    onClick={() => toggleIng(i.id)} />
                ))}
              </Grid>
            </Section>
          )}

          {step === "condiments" && (
            <Section
              title="第三步 · 灵魂蘸料"
              subtitle={`选 1–2 种（${conds.length}/2）`}
              action={
                <button
                  disabled={conds.length < 1}
                  onClick={goBoil}
                  className="rounded-full bg-primary px-6 py-2 font-bold text-primary-foreground disabled:opacity-40"
                >开火 ↻</button>
              }
            >
              <Grid>
                {CONDIMENTS.map((c) => (
                  <Tile key={c.id} emoji={c.emoji} title={c.name} sub={c.style}
                    selected={conds.includes(c.id)}
                    disabled={!conds.includes(c.id) && conds.length >= 2}
                    onClick={() => toggleCond(c.id)} />
                ))}
              </Grid>
            </Section>
          )}

          {step === "boiling" && (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
              <p className="text-xs tracking-[0.4em] text-amber-200/70">BOILING</p>
              <h2 className="mt-3 text-3xl font-bold text-amber-100">火锅正在沸腾…</h2>
              <p className="mt-4 max-w-sm text-amber-100/70">
                AI 在把你刚才的每一次选择、每一次犹豫、每一次果断，
                熬成你专属的那一锅人生。
              </p>
              <div className="mt-8 flex gap-2">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-2 w-2 animate-pulse rounded-full bg-amber-200" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "base", label: "锅底" },
    { id: "ingredients", label: "食材" },
    { id: "condiments", label: "蘸料" },
    { id: "boiling", label: "沸腾" },
  ];
  const idx = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center gap-2 text-xs">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <span
            className={`grid h-7 w-7 place-items-center rounded-full border ${
              i <= idx ? "border-secondary bg-secondary text-secondary-foreground" : "border-amber-200/30 text-amber-200/50"
            }`}
          >{i + 1}</span>
          <span className={i <= idx ? "text-amber-100" : "text-amber-100/40"}>{s.label}</span>
          {i < steps.length - 1 && <span className="w-6 border-t border-amber-200/30" />}
        </div>
      ))}
    </div>
  );
}

function Section({
  title, subtitle, action, children,
}: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-200/20 bg-black/30 p-5 backdrop-blur">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-amber-100">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-amber-100/60">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>;
}

function Tile({
  emoji, title, sub, selected, disabled, onClick, accent,
}: {
  emoji: string; title: string; sub?: string;
  selected?: boolean; disabled?: boolean; onClick: () => void; accent?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition ${
        selected
          ? "border-secondary bg-secondary/15 shadow-[0_0_30px_-8px] shadow-secondary"
          : "border-amber-200/20 bg-black/30 hover:border-amber-200/60 hover:bg-black/50"
      } ${disabled ? "opacity-30" : ""}`}
      style={selected && accent ? { boxShadow: `0 0 30px -8px ${accent}` } : undefined}
    >
      <span className="text-4xl">{emoji}</span>
      <span className="text-sm font-semibold text-amber-100">{title}</span>
      {sub && <span className="text-xs text-amber-100/60">{sub}</span>}
      {selected && (
        <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">✓</span>
      )}
    </button>
  );
}