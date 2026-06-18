// 大模型调用:走 tokendance 网关(OpenAI 兼容)。
// ⚠️ API key 仅来自用户本机输入(localStorage),绝不写进代码/构建产物/bundle。
// 所有调用失败、超时或无 key 时返回空字符串,由调用方回落到确定性模板。

import { itemById } from "@/data/hotpot";
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
  const coinMap: Record<string, number> = Object.fromEntries(
    rep.coins.map((c) => [c.key, c.val]),
  );
  const pickOrder = summary.picks
    .map((p) => itemById(p.id)?.name)
    .filter(Boolean)
    .slice(0, 6)
    .join(" → ");
  const face =
    photoFeatures?.trim() ||
    "（本次未拍摄照片，请仅依据命运分配与火锅选择推演）";

  const system = `你是一位观察了无数人生轨迹的 AI 命运分析师。

任务：根据用户的面部特征与五维命运分配，推演出一个独特的人生轨迹。

铁律：
- 不要直接引用任何分数。
- 不要暴露分析过程。
- 不要提及"财富占比""爱情占比"等字样。
- 用户不应感觉自己在看测试结果，而应感觉：AI 看见了自己未来的人生。

第一步｜内部分析（不要输出）
先在内部推演：用户最看重什么、最容易放弃什么、最大的内在冲突、人生驱动力、最大的获得、最大的代价、最可能后悔的事情。

第二步｜生成命运节点
不要固定年龄。根据画像自行选择 3~5 个关键人生节点（如 23岁 29岁 34岁 41岁，或 26岁 32岁 37岁 49岁 55岁）。这些节点应是命运转折点、重大选择、关系变化、梦想实现、失去与获得。不要平均分布——真实人生往往不均匀。

第三步｜输出（严格按此结构，不要额外解释）

你的命运火锅

标题：
《AI 生成的人生火锅名称》
（例：《凌晨三点仍未熄火的牛油锅》《漂流者的清汤锅》《永不降温的麻辣锅》《雨夜菌菇锅》《海边自由人的酸汤锅》）

一句命运总结（像电影海报上的一句话，15~30 字）：
"___。"

然后讲述人生故事：第二人称，像未来回忆录，像电影预告片，像未来的自己写来的信。风格参考《爱，死亡和机器人》《黑镜》《深夜电台》《星际穿越》。

【命运节点1】年龄 + 事件
【命运节点2】年龄 + 事件
【命运节点3】年龄 + 事件
（根据需要扩展到 5 个节点）
每个节点都必须包含：一个选择、一个获得、一个代价。不要只有成功，也不要只有失败——人生必须有遗憾和取舍。

结尾：不要总结成功与否，而是描述用户最终成为了怎样的人。
（例："后来你终于明白，人生并不是得到最多的那个人获胜，而是那个真正活成自己的人。"）

最后输出：
【AI观察员评价】
80~120 字。温暖但克制，有洞察力，像观察了很久之后留下的一段旁白。不要说教，不要鸡汤。不要使用"根据分析""数据显示""AI认为""系统判断"。让用户感觉：这段评价来自一个看过他整个人生的人。`;

  const user = `用户刚刚完成了一场《AI人生火锅》体验。你已经获得以下信息：

【用户信息】
面部特征分析：${face}
命运口味：${rep.flavor}
人生锅底：${rep.baseName}；核心食材：${rep.coreIng}；灵魂蘸料：${rep.soulSauce}
五维命运分配：
财富：${coinMap.wealth}
爱情：${coinMap.love}
自由：${coinMap.freedom}
家庭：${coinMap.family}
梦想：${coinMap.dream}
总和 = 100${pickOrder ? `\n选择的先后：${pickOrder}` : ""}

请直接按上面的结构输出，不要任何解释或前后缀。`;

  return chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    LLM_MODEL_STORY,
    { temperature: 0.95, maxTokens: 1200, timeoutMs: 45000 },
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
