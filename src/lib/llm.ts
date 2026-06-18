// 大模型调用:走 tokendance 网关(OpenAI 兼容)。
// ⚠️ API key 仅来自用户本机输入(localStorage),绝不写进代码/构建产物/bundle。
// 所有调用失败、超时或无 key 时返回空字符串,由调用方回落到确定性模板。

import { DIM_LABEL, itemById } from "@/data/hotpot";
import { buildReport } from "./mockReport";
import type { SelectionSummary } from "./scoring";

const BASE = "https://tokendance.space/gateway/v1";

export const LLM_MODEL_STORY = "deepseek-v4-pro";
export const LLM_MODEL_VISION = "minimax-m3";

/**
 * 读取内置在前端配置(VITE_LLM_KEY)里的 key。
 * 通过 .env 的 VITE_LLM_KEY 在构建时烤进产物。
 * ⚠️ 因此 key 会出现在公开 bundle 中,仅适合额度受限的一次性 demo key。
 */
function getLLMKey(): string {
  const k = import.meta.env.VITE_LLM_KEY;
  return typeof k === "string" ? k.trim() : "";
}

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
type Message = {
  role: "system" | "user" | "assistant";
  content: string | Array<TextPart | ImagePart>;
};

async function chat(
  messages: Message[],
  model: string,
  opts: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {},
): Promise<string> {
  const key = getLLMKey();
  if (!key) return "";
  const { temperature = 0.8, maxTokens = 500, timeoutMs = 25000 } = opts;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
      signal: ctrl.signal,
    });
    if (!res.ok) return "";
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" ? text.trim() : "";
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 流式调用(SSE)。每收到一段 delta 就回调 onDelta(当前累计全文),用于"边思考边显示"。
 * 不支持流式 / 出错时自动回落到非流式 chat()。
 */
async function chatStream(
  messages: Message[],
  model: string,
  onDelta: (full: string) => void,
  opts: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {},
): Promise<string> {
  const key = getLLMKey();
  if (!key) return "";
  const { temperature = 0.8, maxTokens = 500, timeoutMs = 45000 } = opts;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let full = "";
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, stream: true }),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) return chat(messages, model, opts); // 回落非流式
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta) {
            full += delta;
            onDelta(full);
          }
        } catch {
          /* 忽略解析失败的块 */
        }
      }
    }
    return full.trim() || chat(messages, model, opts);
  } catch {
    return full || chat(messages, model, opts);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 生成人生故事(deepseek-v4-pro)。基于选择摘要 + 可选的人物特征。
 * 成功返回故事正文,失败/无 key 返回 ""(调用方回落模板)。
 */
export async function generateStory(summary: SelectionSummary, photoFeatures?: string): Promise<string> {
  const rep = buildReport(summary);
  const coinsLine = rep.coins.map((c) => `${c.name} ${c.val}`).join("、");
  const pickOrder = summary.picks
    .map((p) => itemById(p.id)?.name)
    .filter(Boolean)
    .slice(0, 6)
    .join(" → ");

  const system =
    "你是「AI人生火锅」里负责写人生叙事的 AI。用中文写一段有文学感、命运感、贴合用户的人生故事,语气温暖、克制、留白;不要说教,不要出现'测试/心理/选择代表/维度/金币'等破梗字眼。控制在 120-180 字。";
  const user = `请基于以下人生画像,写一段专属人生故事:

命运口味:${rep.flavor}
人生锅底:${rep.baseName};核心食材:${rep.coreIng};灵魂蘸料:${rep.soulSauce}
人生资源分配(共100):${coinsLine}
最看重的:${rep.top.map((d) => DIM_LABEL[d]).join(" 与 ")}
${photoFeatures ? `\n开场观察到的气质:${photoFeatures}` : ""}
${pickOrder ? `\n选择的先后:${pickOrder}` : ""}

直接输出故事正文,不要标题,不要任何解释或前后缀。`;

  return chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    LLM_MODEL_STORY,
    { temperature: 0.95, maxTokens: 500 },
  );
}

/**
 * 识别人物特征(minimax-m3 视觉),流式输出。photoDataUrl 形如 data:image/jpeg;base64,...。
 * 每收到一段内容就回调 onDelta(当前累计全文),用于"边识别边填标签"。
 * 返回最终全文(四行结构化);失败/无 key 返回 ""。
 */
export async function recognizePhoto(
  photoDataUrl: string,
  onDelta?: (full: string) => void,
): Promise<string> {
  const prompt =
    "仔细观察这张照片里人物的可见、非敏感印象。严格只输出四行,每行格式为'标签：内容',标签依次为:整体气质、服饰风格、主色印象、现场状态;每项内容不超过10个字。不要推断身份、年龄、性别、职业、财富等,不要输出任何额外说明或前后缀。";
  return chatStream(
    [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: photoDataUrl } },
        ],
      },
    ],
    LLM_MODEL_VISION,
    onDelta ?? (() => {}),
    { temperature: 0.4, maxTokens: 220, timeoutMs: 45000 },
  );
}

/** 把识别全文解析成 {整体气质, 服饰风格, 主色印象, 现场状态}。 */
export function parsePhotoFeatures(text: string): Record<string, string> {
  const labels = ["整体气质", "服饰风格", "主色印象", "现场状态"];
  const map: Record<string, string> = {};
  for (const label of labels) {
    const m = text.match(new RegExp(label + "[：:]\\s*([^\\n\\r]+)"));
    if (m) map[label] = m[1].trim();
  }
  return map;
}
