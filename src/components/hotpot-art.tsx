// 手绘 SVG 素材,机械移植自 LifeHotpot.dc.html 的 FOOD{} 与 POT。
// 所有 svg 用 viewBox + 100% 宽高,由父容器控制实际尺寸。

import type { CSSProperties } from "react";

const svgStyle: CSSProperties = { width: "100%", height: "100%", display: "block" };

export function FoodGlyph({ name }: { name: string }) {
  const common = { style: svgStyle } as const;
  switch (name) {
    case "beef":
      return (
        <svg viewBox="0 0 60 60" {...common}>
          <ellipse cx="22" cy="24" rx="14" ry="9.5" fill="#e7a0a6" />
          <ellipse cx="22" cy="24" rx="6.5" ry="4" fill="#bd6b76" />
          <ellipse cx="40" cy="22" rx="14" ry="9.5" fill="#edabb0" />
          <ellipse cx="40" cy="22" rx="6.5" ry="4" fill="#c47480" />
          <ellipse cx="31" cy="38" rx="14" ry="9.5" fill="#e7a0a6" />
          <ellipse cx="31" cy="38" rx="6.5" ry="4" fill="#bd6b76" />
          <path d="M9 25h26M18 39h26" stroke="#fff" strokeWidth="1.3" opacity=".55" fill="none" />
        </svg>
      );
    case "lamb":
      return (
        <svg viewBox="0 0 60 60" {...common}>
          <ellipse cx="20" cy="24" rx="8.5" ry="12" fill="#eab7bb" />
          <ellipse cx="20" cy="24" rx="3.4" ry="6" fill="#cf8f96" />
          <ellipse cx="33" cy="21" rx="8.5" ry="12" fill="#f0c2c5" />
          <ellipse cx="33" cy="21" rx="3.4" ry="6" fill="#d49aa0" />
          <ellipse cx="28" cy="37" rx="8.5" ry="12" fill="#eab7bb" />
          <ellipse cx="28" cy="37" rx="3.4" ry="6" fill="#cf8f96" />
          <path
            d="M15 13c1 8 0 14 0 20M41 11c-1 8 0 14 0 20"
            stroke="#fff"
            strokeWidth="1.3"
            opacity=".6"
            fill="none"
          />
        </svg>
      );
    case "shrimp":
      return (
        <svg viewBox="0 0 60 60" {...common}>
          <path
            d="M18 40 C12 27 24 15 37 18 C48 20 47 33 38 35"
            fill="none"
            stroke="#ec7a3c"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M18 40 C12 27 24 15 37 18 C48 20 47 33 38 35"
            fill="none"
            stroke="#f7a766"
            strokeWidth="3"
            strokeLinecap="round"
            opacity=".7"
          />
          <path
            d="M37 18 l7 -5 M37 18 l9 0"
            stroke="#ec7a3c"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="37" cy="19" r="1.8" fill="#3a2218" />
        </svg>
      );
    case "fish":
      return (
        <svg viewBox="0 0 60 60" {...common}>
          <g fill="#f3d9da" stroke="#e1b3b7" strokeWidth="1">
            <ellipse cx="24" cy="26" rx="16" ry="6.5" transform="rotate(-13 24 26)" />
            <ellipse cx="34" cy="35" rx="16" ry="6.5" transform="rotate(-13 34 35)" />
          </g>
        </svg>
      );
    case "spam":
      return (
        <svg viewBox="0 0 60 60" {...common}>
          <rect x="14" y="22" width="30" height="20" rx="4" fill="#e7a7a0" />
          <rect
            x="14"
            y="22"
            width="30"
            height="20"
            rx="4"
            fill="none"
            stroke="#cf8078"
            strokeWidth="1"
          />
          <rect x="18" y="16" width="30" height="18" rx="4" fill="#eeb4ad" />
          <g fill="#cf8078">
            <circle cx="24" cy="24" r="1.3" />
            <circle cx="34" cy="22" r="1.1" />
            <circle cx="40" cy="27" r="1.2" />
            <circle cx="28" cy="29" r="1" />
          </g>
        </svg>
      );
    case "beefball":
      return (
        <svg viewBox="0 0 60 60" {...common}>
          <circle cx="22" cy="26" r="11" fill="#a9805c" />
          <circle cx="18" cy="22" r="3.5" fill="#c69e79" opacity=".7" />
          <circle cx="38" cy="24" r="11" fill="#b58963" />
          <circle cx="34" cy="20" r="3.5" fill="#cba684" opacity=".7" />
          <circle cx="30" cy="40" r="11" fill="#a9805c" />
          <circle cx="26" cy="36" r="3.5" fill="#c69e79" opacity=".7" />
        </svg>
      );
    case "greens":
      return (
        <svg viewBox="0 0 58 58" {...common}>
          <path d="M29 50 C18 41 14 25 21 12 C28 23 28 37 29 50Z" fill="#4f8a3a" />
          <path d="M29 50 C40 41 44 25 37 12 C30 23 30 37 29 50Z" fill="#62a747" />
          <path d="M29 50 C27 32 28 19 29 12" stroke="#2f5e22" strokeWidth="1.6" fill="none" />
        </svg>
      );
    case "tofu":
      return (
        <svg viewBox="0 0 60 60" {...common}>
          <rect
            x="14"
            y="24"
            width="18"
            height="16"
            rx="2"
            fill="#f3ecd6"
            stroke="#dcd2b4"
            strokeWidth="1"
          />
          <rect
            x="30"
            y="20"
            width="18"
            height="16"
            rx="2"
            fill="#f7f1de"
            stroke="#dcd2b4"
            strokeWidth="1"
          />
          <rect
            x="22"
            y="34"
            width="18"
            height="14"
            rx="2"
            fill="#efe7cf"
            stroke="#dcd2b4"
            strokeWidth="1"
          />
        </svg>
      );
    case "corn":
      return (
        <svg viewBox="0 0 56 56" {...common}>
          <rect x="19" y="11" width="18" height="34" rx="9" fill="#f0c23a" />
          <g stroke="#d99a1e" strokeWidth="1.3" fill="none">
            <path d="M19 17h18M19 22h18M19 27h18M19 32h18M19 37h18M19 42h18" />
            <path d="M23 13v32M28 11v34M33 13v32" />
          </g>
          <path d="M19 15 q-8 -5 -4 16" fill="#7fae3f" />
        </svg>
      );
    case "enoki":
      return (
        <svg viewBox="0 0 60 60" {...common}>
          <g stroke="#f0e6cf" strokeWidth="2" strokeLinecap="round">
            <path d="M22 46v-26M27 47v-30M32 46v-28M37 47v-26M42 46v-24" />
          </g>
          <g fill="#e9d9b8">
            <circle cx="22" cy="18" r="2.4" />
            <circle cx="27" cy="15" r="2.4" />
            <circle cx="32" cy="16" r="2.4" />
            <circle cx="37" cy="19" r="2.4" />
            <circle cx="42" cy="20" r="2.4" />
          </g>
        </svg>
      );
    case "fungus":
      return (
        <svg viewBox="0 0 60 60" {...common}>
          <g fill="#3a2418">
            <path
              d="M16 30c-2-8 8-12 12-6 4-6 12 0 9 7 5 1 4 9-2 9-1 5-9 5-11 0-6 2-10-4-8-10z"
              opacity=".92"
            />
            <path d="M34 36c0-5 7-7 9-2 3-3 8 1 6 5 3 2 0 7-4 6-2 3-8 1-7-3z" opacity=".8" />
          </g>
        </svg>
      );
    case "noodle":
      return (
        <svg viewBox="0 0 60 60" {...common}>
          <g fill="none" stroke="#e9d9a8" strokeWidth="2.2" strokeLinecap="round">
            <path d="M16 24c8-6 22-6 28 2M14 30c10-5 24-3 30 4M16 36c8-4 22-3 28 3M18 42c8-3 18-2 24 2" />
          </g>
        </svg>
      );
    default:
      return null;
  }
}

// 太极鸳鸯锅:阴阳鱼各填一种锅底颜色(left=左鱼/head在上,right=右鱼/head在下),
// 含鱼眼、S 形分界、金色锅沿、把手。不传颜色时保持未选择前的清水锅。
export function YuanyangPot({ left, right }: { left?: string; right?: string }) {
  const a = left ?? "#dbe9e3";
  const b = right ?? "#eef4e8";
  return (
    <svg viewBox="0 0 200 200" style={svgStyle}>
      <defs>
        <radialGradient id="lhRim" cx="50%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#d4b574" />
          <stop offset="100%" stopColor="#866331" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="110" rx="96" ry="90" fill="#5a4530" opacity=".25" />
      <circle cx="100" cy="100" r="96" fill="url(#lhRim)" />
      <circle cx="100" cy="100" r="86" fill="#6a543a" />
      {/* 太极汤面:整圆先填右鱼色 b,左半圆填左鱼色 a,再用两个 r42 小圆切出阴阳鱼 */}
      <circle cx="100" cy="100" r="84" fill={b} />
      <path d="M100 16 A84 84 0 0 0 100 184 Z" fill={a} />
      <circle cx="100" cy="58" r="42" fill={a} />
      <circle cx="100" cy="142" r="42" fill={b} />
      {/* 鱼眼(对比色) */}
      <circle cx="100" cy="58" r="14" fill={b} />
      <circle cx="100" cy="142" r="14" fill={a} />
      {/* S 形分界 + 外圈描边 */}
      <path
        d="M100 16 A42 42 0 0 1 100 100 A42 42 0 0 0 100 184"
        fill="none"
        stroke="rgba(0,0,0,.18)"
        strokeWidth="1.5"
      />
      <circle cx="100" cy="100" r="84" fill="none" stroke="#9a7b4a" strokeWidth="2" opacity=".55" />
      {/* 顶部高光 */}
      <ellipse cx="100" cy="40" rx="50" ry="14" fill="#fff" opacity=".12" />
      {/* 把手 */}
      <g stroke="#7a5c34" strokeWidth="3" fill="none" opacity=".8">
        <path d="M8 100 q-6 0 -6 -10" />
        <path d="M192 100 q6 0 6 -10" />
      </g>
    </svg>
  );
}

// 摄像头取景用的人物剪影。
export function Silhouette() {
  return (
    <svg
      viewBox="0 0 200 220"
      style={{ width: "100%", height: "100%", display: "block", opacity: 0.5 }}
    >
      <circle cx="100" cy="78" r="44" fill="#cdbb92" />
      <path d="M30 220 C30 150 60 132 100 132 C140 132 170 150 170 220Z" fill="#cdbb92" />
    </svg>
  );
}
