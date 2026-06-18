import { DIMS, type Dim, type Weights, itemById } from "@/data/hotpot";

export interface Pick {
  id: string;
  order: number; // 0-based selection order across the whole game
  hesitateMs: number;
}

export interface SelectionSummary {
  base: string[]; // 两个锅底 id(鸳鸯各一)
  ingredients: string[];
  condiments: string[];
  picks: Pick[];
  photo?: string; // optional photo dataURL (kept in sessionStorage only)
  nickname?: string; // 用户昵称;仅展示用,不参与报告/金币生成
  story?: string; // AI 生成的人生故事;生成后烤进分享链接,空则报告页回落模板
  photoFeatures?: string; // 拍照识别的人物特征;仅 session 用,不进分享链接
}

export interface CoinDistribution {
  wealth: number;
  love: number;
  freedom: number;
  family: number;
  dream: number;
}

export function computeCoins(summary: SelectionSummary): CoinDistribution {
  const acc: Record<Dim, number> = {
    wealth: 0,
    love: 0,
    freedom: 0,
    family: 0,
    dream: 0,
  };
  for (const pick of summary.picks) {
    const item = itemById(pick.id);
    if (!item) continue;
    const priority = 1 + 1 / (pick.order + 1); // earlier picks weigh more
    const hesitation = pick.hesitateMs > 4000 ? 0.85 : 1;
    const mult = priority * hesitation;
    for (const dim of DIMS) {
      const w = (item.weights as Weights)[dim] ?? 0;
      acc[dim] += w * mult;
    }
  }
  const total = DIMS.reduce((s, d) => s + acc[d], 0) || 1;
  // normalize to 100
  const raw: Record<Dim, number> = { wealth: 0, love: 0, freedom: 0, family: 0, dream: 0 };
  for (const d of DIMS) raw[d] = (acc[d] / total) * 100;
  // round and fix rounding error
  const rounded: Record<Dim, number> = { wealth: 0, love: 0, freedom: 0, family: 0, dream: 0 };
  for (const d of DIMS) rounded[d] = Math.round(raw[d]);
  let drift = 100 - DIMS.reduce((s, d) => s + rounded[d], 0);
  // distribute drift to the dimensions with largest fractional part
  const fracs = DIMS.map((d) => ({ d, frac: raw[d] - Math.floor(raw[d]) })).sort(
    (a, b) => b.frac - a.frac,
  );
  let i = 0;
  while (drift !== 0) {
    const d = fracs[i % fracs.length].d;
    rounded[d] += drift > 0 ? 1 : -1;
    drift += drift > 0 ? -1 : 1;
    i++;
  }
  return rounded;
}

export function topDims(coins: CoinDistribution, n = 2): Dim[] {
  return [...DIMS].sort((a, b) => coins[b] - coins[a]).slice(0, n);
}

// URL-safe encode/decode(报告可分享的核心)
export function encodeSummary(s: SelectionSummary): string {
  // strip photo from URL payload (keep it local only)
  const lite = {
    b: s.base,
    i: s.ingredients,
    c: s.condiments,
    p: s.picks,
    n: s.nickname,
    s: s.story,
  };
  const json = JSON.stringify(lite);
  if (typeof window === "undefined") {
    return Buffer.from(json, "utf8").toString("base64url");
  }
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeSummary(id: string): SelectionSummary | null {
  try {
    const b64 = id.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof window === "undefined"
        ? Buffer.from(b64, "base64").toString("utf8")
        : decodeURIComponent(escape(atob(b64)));
    const lite = JSON.parse(json);
    // base 为数组(鸳鸯两个锅底);兼容历史单值格式
    const base: string[] = Array.isArray(lite.b) ? lite.b : lite.b ? [lite.b] : [];
    return {
      base,
      ingredients: lite.i ?? [],
      condiments: lite.c ?? [],
      picks: lite.p ?? [],
      nickname: typeof lite.n === "string" ? lite.n : undefined,
      story: typeof lite.s === "string" ? lite.s : undefined,
    };
  } catch {
    return null;
  }
}
