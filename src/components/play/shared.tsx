import React, { type ReactNode } from "react";
import { itemById } from "@/data/hotpot";
import { useIsPortrait } from "@/hooks/use-mobile";
import { serif, type Step } from "./constants";
/* 选中徽标:朱红描边圈 + 右上角标(序号或 ✓)。需放在 position:relative 容器内。 */
export function SelectBadge({ label }: { label: ReactNode }) {
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
export function SideTag({
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

/* ============ 共用小件 ============ */
export function ScreenHead({ step, title, sub }: { step: string; title: string; sub?: string }) {
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

export function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center" }}>
      {children}
    </div>
  );
}

export function StepRail({ step }: { step: Step }) {
  const isPortrait = useIsPortrait();
  const steps: { key: Step; label: string }[] = [
    { key: "base", label: "锅底" },
    { key: "ingredients", label: "食材" },
    { key: "sauce", label: "蘸料" },
  ];
  const current = steps.findIndex((s) => s.key === step);
  return (
    <div
      className="lh-panel"
      style={
        isPortrait
          ? {
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              width: "calc(100% - 32px)",
              maxWidth: 420,
              margin: "16px auto 0",
              borderRadius: 8,
              padding: "10px 14px",
              color: "#5a4630",
              boxSizing: "border-box",
            }
          : {
              position: "absolute",
              left: 32,
              top: 30,
              width: 188,
              borderRadius: 8,
              padding: "14px 14px 12px",
              color: "#5a4630",
            }
      }
    >
      <div
        style={
          isPortrait
            ? {
                fontSize: 11,
                letterSpacing: ".12em",
                color: "#9a6b3a",
                flexShrink: 0,
                marginRight: 12,
              }
            : { fontSize: 11, letterSpacing: ".26em", color: "#9a6b3a" }
        }
      >
        当前火候
      </div>
      <div style={{ display: "flex", gap: 7, flex: 1, marginTop: isPortrait ? 0 : 11 }}>
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
                  marginTop: 4,
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

export function ObserverPanel({
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
  const isPortrait = useIsPortrait();
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
        ? `金币剩余 ${lifeLeft}，越早下锅的选择权重越高。`
        : step === "sauce"
          ? "蘸料是人生的点缀，想配几味配几味。"
          : "火锅正在沸腾，AI 正把选择顺序与犹豫时间合成报告。";
  return (
    <div
      className={dark ? "lh-panel-dark" : "lh-panel"}
      style={
        isPortrait
          ? {
              position: "relative",
              width: "calc(100% - 32px)",
              maxWidth: 420,
              margin: "12px auto 0",
              borderRadius: 8,
              padding: 12,
              color: dark ? "#f3e6c4" : "#3a2c1c",
              boxSizing: "border-box",
              animation: "lhFade .45s ease both",
            }
          : {
              position: "absolute",
              right: 28,
              top: step === "boiling" ? undefined : 28,
              bottom: step === "boiling" ? 118 : undefined,
              width: 252,
              borderRadius: 8,
              padding: 16,
              color: dark ? "#f3e6c4" : "#3a2c1c",
              animation: "lhFade .45s ease both",
            }
      }
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
      <div style={{ fontFamily: serif, fontSize: 13, lineHeight: 1.5, marginTop: 6 }}>
        {pickToast || copy}
      </div>
      {selected && (
        <div
          style={{
            marginTop: 6,
            fontSize: 10,
            color: dark ? "#caa05a" : "#8a6a44",
            lineHeight: 1.4,
          }}
        >
          最近入锅 · {selected}
        </div>
      )}
    </div>
  );
}
