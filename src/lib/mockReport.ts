import { BASES, CONDIMENTS, DIM_LABEL, INGREDIENTS, type Dim } from "@/data/hotpot";
import { computeCoins, topDims, type CoinDistribution, type SelectionSummary } from "./scoring";

export interface LifeReport {
  baseName: string;
  baseTone: string;
  baseTagline: string;
  ingredientNames: string[];
  condimentStyles: string[];
  coins: CoinDistribution;
  top: Dim[];
  flavor: string; // 命运口味 (one line)
  story: string; // 人生故事
  values: string; // 人生锅底解读
  resources: string; // 核心食材解读
  behavior: string; // 灵魂蘸料解读
}

const DIM_NARR: Record<Dim, { strong: string; weak: string; verb: string }> = {
  wealth: {
    strong: "你愿意为自己想要的生活买单",
    weak: "你对金钱有点漫不经心",
    verb: "搭建",
  },
  love: {
    strong: "你把爱当成日常的盐",
    weak: "你把爱情藏在很深的地方",
    verb: "靠近",
  },
  freedom: {
    strong: "你比谁都怕被框住",
    weak: "你愿意为重要的人停下来",
    verb: "出走",
  },
  family: {
    strong: "你心里始终有一盏给家人留的灯",
    weak: "你正在重新定义“家”这件事",
    verb: "守护",
  },
  dream: {
    strong: "你心里那点疯狂从没真正熄灭",
    weak: "你把梦想小心地藏在抽屉里",
    verb: "追",
  },
};

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const FLAVORS = [
  "外面热闹，里面清醒",
  "辣得理直气壮，甜得毫无防备",
  "看起来随性，其实算得很清楚",
  "在烟火气里偷偷做梦",
  "温柔得很坚定",
  "把日子煮成自己的口味",
];

export function buildReport(summary: SelectionSummary): LifeReport {
  const base = BASES.find((b) => b.id === summary.base) ?? BASES[0];
  const ings = summary.ingredients
    .map((id) => INGREDIENTS.find((i) => i.id === id))
    .filter((x): x is NonNullable<typeof x> => !!x);
  const conds = summary.condiments
    .map((id) => CONDIMENTS.find((c) => c.id === id))
    .filter((x): x is NonNullable<typeof x> => !!x);
  const coins = computeCoins(summary);
  const top = topDims(coins, 2);
  const seed = hash(summary.base + summary.ingredients.join(",") + summary.condiments.join(","));

  const flavor = pick(FLAVORS, seed);
  const t0 = top[0];
  const t1 = top[1];
  const story =
    `你挑了一锅${base.name}，${base.tagline}。` +
    `你最舍得放下去的，是${ings.slice(0, 2).map((i) => i.name).join("和")}——` +
    `${DIM_NARR[t0].strong}，所以你正在用力${DIM_NARR[t0].verb}属于自己的${DIM_LABEL[t0]}。` +
    `蘸料里那一勺${conds[0]?.name ?? "麻酱"}出卖了你：` +
    `${conds.map((c) => c.style).join("又")}，是你处理世界的方式。` +
    `如果给你 100 枚金币，你会把 ${coins[t0]} 枚押给${DIM_LABEL[t0]}，` +
    `${coins[t1]} 枚留给${DIM_LABEL[t1]}，剩下的零钱撒在生活的边角料里。` +
    `${DIM_NARR[t1].strong}——这就是为什么你这锅，味道这么像你。`;

  return {
    baseName: base.name,
    baseTone: base.tone,
    baseTagline: base.tagline,
    ingredientNames: ings.map((i) => i.name),
    condimentStyles: conds.map((c) => c.style),
    coins,
    top,
    flavor,
    story,
    values: `${base.tone}是你做人的底色。${base.tagline}。`,
    resources: `你愿意把人生的资源更多投在${DIM_LABEL[t0]}和${DIM_LABEL[t1]}上。`,
    behavior: conds.length
      ? `你处理事情的方式是「${conds.map((c) => c.style).join("·")}」。`
      : "你处理事情有自己的节奏。",
  };
}