// 人生火锅报告生成,叙事模板对齐 LifeHotpot.dc.html 的 buildReport()。
// 注:目前为确定性模板;PRD 要求接入真实 AI,此处为占位实现,接口已抽好便于替换。

import {
  BASES,
  CONDIMENTS,
  DIM_COLOR,
  DIM_LABEL,
  DIMS,
  INGREDIENTS,
  type Base,
  type Condiment,
  type Dim,
  type Ingredient,
} from "@/data/hotpot";
import { computeCoins, topDims, type CoinDistribution, type SelectionSummary } from "./scoring";

export interface CoinBar {
  key: Dim;
  name: string;
  color: string;
  val: number;
}

export interface LifeReport {
  flavor: string; // 命运口味
  baseName: string; // 人生锅底
  coreIng: string; // 核心食材
  soulSauce: string; // 灵魂蘸料
  coins: CoinBar[]; // 一百金币 · 5 条
  story: string; // 人生故事
  top: Dim[]; // 前两个维度
  baseTone: string;
  condimentStyles: string[];
}

const ADJ: Record<Dim, string> = {
  wealth: "务实",
  love: "深情",
  freedom: "自由",
  family: "恋家",
  dream: "理想",
};

const DIMLINE: Record<Dim, string> = {
  wealth: "你信靠自己一手挣来的踏实。",
  love: "你总愿意为在乎的人慢下来。",
  freedom: "你最怕的，是被别人定义。",
  family: "你心里始终有个想守住的地方。",
  dream: "你心里那团火，一直没熄。",
};

export function buildReport(summary: SelectionSummary): LifeReport {
  // 鸳鸯锅:base 为数组,最多两个锅底
  const chosenBases = (Array.isArray(summary.base) ? summary.base : [])
    .map((id) => BASES.find((b) => b.id === id))
    .filter((b): b is Base => !!b);
  const b0 = chosenBases[0] ?? BASES[0];
  const b1 = chosenBases[1];
  const ings = summary.ingredients
    .map((id) => INGREDIENTS.find((i) => i.id === id))
    .filter((x): x is Ingredient => !!x);
  const conds = summary.condiments
    .map((id) => CONDIMENTS.find((c) => c.id === id))
    .filter((x): x is Condiment => !!x);

  const coins: CoinDistribution = computeCoins(summary);
  const top = topDims(coins, 2);
  const t1 = top[0];
  const t2 = top[1];

  const meats = ings.filter((i) => i.kind === "meat");
  const vegs = ings.filter((i) => i.kind === "veg");
  // 核心食材:cost 最高的荤,否则首个素
  const coreMeat = meats.slice().sort((a, b) => b.cost - a.cost)[0];

  const toneText = b1 ? `${b0.tone} · ${b1.tone}` : b0.tone;
  const flavor = `${toneText}底色之下 · ${ADJ[t1]}又${ADJ[t2]}的人`;
  const styleWord = conds[0] ? conds[0].style : "随性";
  const baseText = b1
    ? `你给人生配了一锅鸳鸯:${b0.name}作底,${b1.name}相和——${b0.tagline},${b1.tagline}。`
    : `你给人生选了「${b0.name}」作底——${b0.tagline}。`;

  const story =
    baseText +
    `荤里你挑了${meats.map((m) => m.name).join("、") || "几样顺手的"},` +
    `素里配上${vegs.map((v) => v.name).join("、") || "一点清淡"},` +
    `蘸料偏${conds.map((s) => s.style).join("、") || "清淡"},做事带着${styleWord}的手感。` +
    `若把人生折成一百枚金币,你会把最多的押在「${DIM_LABEL[t1]}」上,` +
    `其次留给「${DIM_LABEL[t2]}」。${DIMLINE[t1]}` +
    `这一锅火候正好,像一份被你亲手熬出来的人生味道。`;

  return {
    flavor,
    baseName: b1 ? `${b0.name} · ${b1.name}` : b0.name,
    baseTone: toneText,
    coreIng: coreMeat ? coreMeat.name : vegs[0] ? vegs[0].name : "—",
    soulSauce: conds[0] ? conds[0].name : "原味",
    coins: DIMS.map((d) => ({ key: d, name: DIM_LABEL[d], color: DIM_COLOR[d], val: coins[d] })),
    story,
    top,
    condimentStyles: conds.map((c) => c.style),
  };
}
