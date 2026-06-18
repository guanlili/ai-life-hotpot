// 数据对齐 LifeHotpot.dc.html 高保真原型。
// 维度顺序固定:wealth 财富 / love 爱情 / freedom 自由 / family 家庭 / dream 梦想。

export type Dim = "wealth" | "love" | "freedom" | "family" | "dream";
export const DIMS: Dim[] = ["wealth", "love", "freedom", "family", "dream"];
export const DIM_LABEL: Record<Dim, string> = {
  wealth: "财富",
  love: "爱情",
  freedom: "自由",
  family: "家庭",
  dream: "梦想",
};
export const DIM_COLOR: Record<Dim, string> = {
  wealth: "#b4382b",
  love: "#c2683a",
  freedom: "#5f8f7a",
  family: "#b58a3a",
  dream: "#7a5a9a",
};

export type Weights = Partial<Record<Dim, number>>;
// 紧凑写法:数组按 DIMS 顺序 → Weights。
const W = (arr: number[]): Weights => ({
  wealth: arr[0],
  love: arr[1],
  freedom: arr[2],
  family: arr[3],
  dream: arr[4],
});

export interface Base {
  id: string;
  name: string;
  tone: string; // 人生基调
  tagline: string; // 一句话
  color: string; // 锅底颜色(锅 tint)
  weights: Weights;
}

export interface Ingredient {
  id: string;
  name: string;
  food: string; // FoodGlyph 的 key
  kind: "meat" | "veg";
  cost: number; // 金币消耗
  tint: string; // 落锅小圆点颜色
  weights: Weights;
}

export interface Condiment {
  id: string;
  name: string;
  style: string; // 风味特征
  color: string; // 酱心颜色
  weights: Weights;
}

export const BASES: Base[] = [
  {
    id: "hot",
    name: "麻辣红汤",
    tone: "热烈",
    tagline: "敢爱敢恨，活得浓烈",
    color: "#b4382b",
    weights: W([2, 3, 1, 1, 3]),
  },
  {
    id: "steady",
    name: "醇厚番茄",
    tone: "稳定",
    tagline: "把日子过得安稳踏实",
    color: "#d4663a",
    weights: W([3, 2, 0, 4, 1]),
  },
  {
    id: "clear",
    name: "菌菇清汤",
    tone: "清醒",
    tagline: "看得透，活得明白",
    color: "#c8a86a",
    weights: W([2, 1, 3, 1, 3]),
  },
  {
    id: "venture",
    name: "藤椒青花椒",
    tone: "冒险",
    tagline: "偏要去试没走过的路",
    color: "#6f8f4a",
    weights: W([2, 1, 4, 0, 3]),
  },
  {
    id: "heal",
    name: "猪骨养生",
    tone: "治愈",
    tagline: "先把自己好好照顾",
    color: "#cf9a6a",
    weights: W([1, 3, 1, 4, 1]),
  },
  {
    id: "free",
    name: "清水自在",
    tone: "自由",
    tagline: "不被定义，自有节奏",
    color: "#7fa6b0",
    weights: W([1, 1, 5, 1, 2]),
  },
];

export const INGREDIENTS: Ingredient[] = [
  // 荤(选 3)
  {
    id: "beef",
    name: "牛肉",
    food: "beef",
    kind: "meat",
    cost: 10,
    tint: "#c47480",
    weights: W([4, 1, 1, 1, 3]),
  },
  {
    id: "lamb",
    name: "羊肉",
    food: "lamb",
    kind: "meat",
    cost: 8,
    tint: "#d49aa0",
    weights: W([3, 2, 1, 2, 2]),
  },
  {
    id: "shrimp",
    name: "虾滑",
    food: "shrimp",
    kind: "meat",
    cost: 9,
    tint: "#ec7a3c",
    weights: W([2, 4, 1, 2, 1]),
  },
  {
    id: "fish",
    name: "鱼片",
    food: "fish",
    kind: "meat",
    cost: 7,
    tint: "#e3b3b7",
    weights: W([2, 3, 2, 2, 1]),
  },
  {
    id: "spam",
    name: "午餐肉",
    food: "spam",
    kind: "meat",
    cost: 5,
    tint: "#e7a7a0",
    weights: W([3, 1, 2, 1, 1]),
  },
  {
    id: "beefball",
    name: "牛肉丸",
    food: "beefball",
    kind: "meat",
    cost: 6,
    tint: "#a9805c",
    weights: W([3, 1, 1, 3, 1]),
  },
  // 素(选 2)
  {
    id: "greens",
    name: "青菜",
    food: "greens",
    kind: "veg",
    cost: 2,
    tint: "#4f8a3a",
    weights: W([1, 2, 2, 3, 1]),
  },
  {
    id: "tofu",
    name: "豆腐",
    food: "tofu",
    kind: "veg",
    cost: 3,
    tint: "#eee3c6",
    weights: W([1, 2, 2, 3, 1]),
  },
  {
    id: "corn",
    name: "玉米",
    food: "corn",
    kind: "veg",
    cost: 3,
    tint: "#f0c23a",
    weights: W([1, 1, 2, 2, 3]),
  },
  {
    id: "enoki",
    name: "金针菇",
    food: "enoki",
    kind: "veg",
    cost: 2,
    tint: "#e9d9b8",
    weights: W([1, 1, 3, 1, 2]),
  },
  {
    id: "fungus",
    name: "木耳",
    food: "fungus",
    kind: "veg",
    cost: 2,
    tint: "#3a2418",
    weights: W([2, 1, 2, 2, 1]),
  },
  {
    id: "noodle",
    name: "面条",
    food: "noodle",
    kind: "veg",
    cost: 4,
    tint: "#e9d9a8",
    weights: W([1, 2, 1, 3, 2]),
  },
];

export const CONDIMENTS: Condiment[] = [
  { id: "garlic", name: "蒜蓉", style: "辛香", color: "#ece3c8", weights: W([1, 0, 0, 1, 0]) },
  { id: "cilantro", name: "香菜", style: "清香", color: "#4f8a3a", weights: W([0, 1, 1, 0, 1]) },
  { id: "chili", name: "小米辣", style: "辛辣", color: "#c23a1c", weights: W([1, 0, 1, 0, 1]) },
  { id: "scallion", name: "葱花", style: "清爽", color: "#6fae3a", weights: W([0, 1, 1, 0, 0]) },
  { id: "sesame", name: "芝麻", style: "醇香", color: "#d8c89a", weights: W([0, 1, 0, 1, 0]) },
  { id: "peanut", name: "花生碎", style: "浓郁", color: "#cda06a", weights: W([1, 0, 0, 1, 0]) },
  { id: "oyster", name: "蚝油", style: "鲜美", color: "#6a4a2a", weights: W([1, 0, 0, 1, 1]) },
  { id: "vinegar", name: "醋", style: "酸爽", color: "#5a3018", weights: W([0, 0, 1, 1, 1]) },
  { id: "sesameoil", name: "香油", style: "香浓", color: "#d9a73a", weights: W([0, 2, 0, 1, 0]) },
  { id: "chilioil", name: "辣椒油", style: "油辣", color: "#b4321c", weights: W([1, 1, 0, 0, 1]) },
];

export const ALL_ITEMS = [...BASES, ...INGREDIENTS, ...CONDIMENTS];
export const itemById = (id: string) => ALL_ITEMS.find((i) => i.id === id);
