import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { INGREDIENTS, itemById } from "@/data/hotpot";
import { Stage } from "@/components/Stage";
import { GestureGameLayer } from "@/components/GestureGameLayer";
import { useGestureGame, type GestureFood } from "@/hooks/useGestureGame";
import type { GestureState } from "@/hooks/useHandGesture";
import { encodeSummary, type Pick, type SelectionSummary } from "@/lib/scoring";
import { loadSession, saveSession } from "@/lib/session";
import { generateStory } from "@/lib/llm";
import { useIsPortrait, useWindowSize } from "@/hooks/use-mobile";
import {
  type Step,
  TIMER_SECONDS,
  GAME_W,
  GAME_H,
  HOTPOT_R,
  BOIL_LINES,
  C,
  baseById,
} from "@/components/play/constants";
import { StepRail, ObserverPanel } from "@/components/play/shared";
import { BaseStep } from "@/components/play/BaseStep";
import { IngStep } from "@/components/play/IngStep";
import { SauceStep } from "@/components/play/SauceStep";
import { BoilStep } from "@/components/play/BoilStep";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "煮一锅 · AI 人生火锅" },
      { name: "description", content: "选锅底，下食材，加蘸料。AI 正在观察你。" },
    ],
  }),
  component: Play,
});

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
  const [story, setStory] = useState<string>("");
  const [storyLoading, setStoryLoading] = useState(false);

  const isPortrait = useIsPortrait();
  const { width: winWidth, height: winHeight } = useWindowSize();

  // Gesture game state
  const [gestureEnabled, setGestureEnabled] = useState(false);
  const [showGestureGuide, setShowGestureGuide] = useState(true);
  const [currentGesture, setCurrentGesture] = useState<GestureState>("none");

  // 初始食材（环形排布，避开锅）
  const initialFoods = useMemo<GestureFood[]>(() => {
    if (isPortrait) {
      const cx = winWidth / 2;
      const cy = 336;
      const rx = Math.min(135, winWidth / 2 - 35);
      const ry = 115;
      return INGREDIENTS.map((it, i) => {
        const a = -Math.PI / 2 + (i + 0.5) * ((2 * Math.PI) / INGREDIENTS.length);
        const fx = cx + rx * Math.cos(a);
        const fy = cy + ry * Math.sin(a);
        return {
          id: it.id,
          name: it.name,
          food: it.food,
          kind: it.kind,
          x: fx,
          y: fy,
          originX: fx,
          originY: fy,
          grabbed: false,
        };
      });
    } else {
      return INGREDIENTS.map((it, i) => {
        const a = -Math.PI / 2 + (i + 0.5) * ((2 * Math.PI) / INGREDIENTS.length);
        return {
          id: it.id,
          name: it.name,
          food: it.food,
          kind: it.kind,
          x: C.cx + 440 * Math.cos(a),
          y: C.cy + 200 * Math.sin(a),
          originX: C.cx + 440 * Math.cos(a),
          originY: C.cy + 200 * Math.sin(a),
          grabbed: false,
        };
      });
    }
  }, [isPortrait, winWidth, winHeight]);

  const {
    foods: gestureFoods,
    cursor: gestureCursor,
    grabbedId,
    moveCursor,
    feedGesture,
    resetAll,
  } = useGestureGame({
    initialFoods,
    gameW: isPortrait ? winWidth : GAME_W,
    gameH: isPortrait ? winHeight : GAME_H,
    hotpotX: isPortrait ? winWidth / 2 : C.cx,
    hotpotY: isPortrait ? 336 : C.cy,
    hotpotR: isPortrait ? 70 : HOTPOT_R,
    grabR: isPortrait ? 35 : 55,
    onDropped: ({ foodId, dropped }) => {
      if (dropped) {
        recordPick(foodId);
        setIngs((prev) => (prev.includes(foodId) ? prev : [...prev, foodId]));
      }
    },
  });

  useEffect(() => {
    resetAll();
  }, [isPortrait, gestureEnabled, resetAll]);

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

  // 进入沸腾时用大模型生成人生故事(后台进行，沸腾动画与推演等待共同遮盖；无 key/失败则留空)。
  // 沸腾为最后一步,进入时 bases/ings/conds 已是最终快照,故依赖仅 [step]——
  // 否则沸腾期间这些数组若发生引用变化会重复发起 LLM 调用。active 标志兜底防止过期写入。
  useEffect(() => {
    if (step !== "boiling") return;
    const sess = loadSession();
    const summary: SelectionSummary = {
      base: bases,
      ingredients: ings,
      condiments: conds,
      picks: picksRef.current,
    };
    let active = true;
    setStoryLoading(true);
    generateStory(summary, sess.photoFeatures)
      .then((s) => {
        if (active && s) setStory(s);
      })
      .finally(() => {
        if (active) setStoryLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setBases([]);
      return;
    }
    recordPick(id);
    setBases([id]);
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

  const selectedBase = bases[0] ? baseById(bases[0]) : undefined;
  const baseImage = selectedBase?.image;
  const baseColor = selectedBase?.color;

  const goReport = () => {
    const sess = loadSession();
    const summary: SelectionSummary = {
      base: bases,
      ingredients: ings,
      condiments: conds,
      picks: picksRef.current,
      nickname: sess.nickname,
      story: story || undefined,
    };
    saveSession({ ...sess, ...summary });
    navigate({ to: "/report/$id", params: { id: encodeSummary(summary) } });
  };

  return (
    <Stage dark={step === "boiling"} disableScroll={isPortrait && gestureEnabled && step === "ingredients"}>
      {step !== "boiling" && <StepRail step={step} />}
      {step === "base" && (
        <BaseStep
          bases={bases}
          baseImage={baseImage}
          baseColor={baseColor}
          onPick={toggleBase}
          onNext={() => setStep("ingredients")}
        />
      )}
      {step === "ingredients" && (
        <>
          <IngStep
             ings={ings}
             meatPicked={meatPicked}
             vegPicked={vegPicked}
             baseImage={baseImage}
             baseColor={baseColor}
             secs={secs}
             lifeLeft={lifeLeft}
             onToggle={toggleIng}
             onNext={() => setStep("sauce")}
             gestureEnabled={gestureEnabled}
             onToggleGesture={() => setGestureEnabled(!gestureEnabled)}
          />
          <GestureGameLayer
            enabled={gestureEnabled && step === "ingredients"}
            foods={gestureFoods}
            grabbedId={grabbedId}
            gesture={currentGesture}
            cursor={gestureCursor}
            onHandSample={({ x, y, detected, gesture }) => {
              setCurrentGesture(gesture);
              feedGesture(gesture);
              if (detected) {
                moveCursor(
                  x * (isPortrait ? winWidth : GAME_W),
                  y * (isPortrait ? winHeight : GAME_H),
                );
              }
            }}
            showGuide={showGestureGuide}
            onCloseGuide={() => setShowGestureGuide(false)}
          />
        </>
      )}
      {step === "sauce" && (
        <SauceStep conds={conds} onToggle={toggleCond} onConfirm={() => setStep("boiling")} />
      )}
      {step === "boiling" && (
        <BoilStep
          boilStep={boilStep}
          boilReady={boilReady}
          storyLoading={storyLoading}
          baseImage={baseImage}
          baseColor={baseColor}
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

