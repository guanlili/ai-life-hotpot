// 前端绘制的"实物感"食材图，按 food key 拼出不同造型。
// 锅边食材环、下锅飞入、手势抓取共用同一套视觉，保证一致。

import type { CSSProperties, ReactNode } from "react";

export function RealFoodVisual({ food, size = 82 }: { food: string; size?: number }) {
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
          boxShadow: "0 2px 4px rgba(90,40,35,.24), inset 0 1px 3px rgba(255,245,235,.32)",
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
