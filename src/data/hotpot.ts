export type Dim = "wealth" | "love" | "freedom" | "family" | "dream";
export const DIMS: Dim[] = ["wealth", "love", "freedom", "family", "dream"];
export const DIM_LABEL: Record<Dim, string> = {
  wealth: "财富",
  love: "爱情",
  freedom: "自由",
  family: "家庭",
  dream: "梦想",
};

export type Weights = Partial<Record<Dim, number>>;

export interface Base {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  tone: string; // 人生基调
  color: string; // hex for visual
  weights: Weights;
}

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  kind: "meat" | "veg";
  desc: string;
  weights: Weights;
}

export interface Condiment {
  id: string;
  name: string;
  emoji: string;
  style: string; // 行为风格
  weights: Weights;
}

export const BASES: Base[] = [
  { id: "mala", name: "麻辣红汤", emoji: "🌶️", tagline: "把日子过成节日", tone: "热烈", color: "#c8201f",
    weights: { dream: 3, freedom: 2, love: 2, wealth: 1 } },
  { id: "tomato", name: "番茄锅", emoji: "🍅", tagline: "酸甜里也藏着温柔", tone: "治愈", color: "#e25c3a",
    weights: { love: 3, family: 3, dream: 1 } },
  { id: "qing", name: "清汤白汤", emoji: "🍲", tagline: "清醒地活，慢慢地热", tone: "清醒", color: "#f1e3c0",
    weights: { freedom: 3, family: 2, wealth: 1, dream: 1 } },
  { id: "mush", name: "菌菇养生", emoji: "🍄", tagline: "把根扎得深一点", tone: "稳定", color: "#a47551",
    weights: { family: 3, wealth: 2, love: 2 } },
  { id: "coco", name: "椰子鸡", emoji: "🥥", tagline: "温柔不是软弱", tone: "温和", color: "#f5e6c8",
    weights: { family: 2, love: 3, freedom: 2 } },
  { id: "suan", name: "酸菜鱼锅", emoji: "🐟", tagline: "我偏要走不一样的路", tone: "冒险", color: "#d4a23a",
    weights: { freedom: 3, dream: 3, wealth: 1 } },
];

export const INGREDIENTS: Ingredient[] = [
  // 荤 (need 3 of 5)
  { id: "beef", name: "肥牛", emoji: "🥩", kind: "meat", desc: "厚重的投入", weights: { wealth: 3, family: 1 } },
  { id: "lamb", name: "羊肉卷", emoji: "🍖", kind: "meat", desc: "敢闯敢拼", weights: { dream: 3, freedom: 1 } },
  { id: "shrimp", name: "大虾", emoji: "🦐", kind: "meat", desc: "对生活有期待", weights: { love: 2, wealth: 2 } },
  { id: "fishball", name: "手打鱼丸", emoji: "🐠", kind: "meat", desc: "把心思都熬进去", weights: { family: 3, love: 1 } },
  { id: "duck", name: "鸭血", emoji: "🩸", kind: "meat", desc: "有人情味也有锋利", weights: { freedom: 2, dream: 2 } },
  // 素 (need 2 of 3)
  { id: "tofu", name: "豆腐", emoji: "🧈", kind: "veg", desc: "在变化里保持柔软", weights: { family: 2, love: 2 } },
  { id: "lotus", name: "藕片", emoji: "🪷", kind: "veg", desc: "藕断丝连的牵挂", weights: { love: 3, family: 1 } },
  { id: "mushroom", name: "金针菇", emoji: "🌾", kind: "veg", desc: "细长却很扎实", weights: { freedom: 2, dream: 2 } },
];

export const CONDIMENTS: Condiment[] = [
  { id: "sesame", name: "麻酱", emoji: "🥣", style: "稳重", weights: { family: 2, wealth: 1 } },
  { id: "garlic", name: "蒜泥", emoji: "🧄", style: "直接", weights: { freedom: 2, dream: 1 } },
  { id: "chili", name: "小米辣", emoji: "🔥", style: "强势", weights: { dream: 2, wealth: 1 } },
  { id: "vinegar", name: "香醋", emoji: "🍶", style: "敏锐", weights: { freedom: 1, love: 2 } },
  { id: "scallion", name: "葱花香菜", emoji: "🌿", style: "浪漫", weights: { love: 2, family: 1 } },
  { id: "oil", name: "蚝油芝麻", emoji: "🫙", style: "随性", weights: { freedom: 2, family: 1 } },
];

export const ALL_ITEMS = [...BASES, ...INGREDIENTS, ...CONDIMENTS];
export const itemById = (id: string) => ALL_ITEMS.find((i) => i.id === id);