// play 页面共享的常量、类型、样式与辅助函数。
// 由 ./shared、./visuals、各 Step 组件及 play.tsx 入口引用。
import type { CSSProperties } from "react";
import { BASES } from "@/data/hotpot";

export type Step = "base" | "ingredients" | "sauce" | "boiling";

export const serif = "'Noto Serif SC',serif";
export const BOIL_LINES = ["我们已经观察你三分钟。", "你以为自己在配火锅。", "其实，你正在构建人生。"];
export const TIMER_SECONDS = 60;
export const C = { cx: 640, cy: 412 };
export const GAME_W = 1280;
export const GAME_H = 720;
export const HOTPOT_R = 95;

export const btnPrimary: CSSProperties = {
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

export const baseById = (id: string) => BASES.find((b) => b.id === id);
