# AI 人生火锅 · Life Hotpot

> 你以为自己在配火锅，其实你正在构建人生。

一个把"人生选择"隐喻成"配火锅"的互动 Web 体验：填昵称、拍张照，选锅底、下食材、调蘸料——AI 观察你的选择与气质，生成一份专属的「人生火锅报告」。

🌐 **在线体验**：<https://ai-life-hotpot.guanhongli1921.workers.dev>

面向「抖音 AI 创变者黑客松」的现场互动装置 / Web Demo。完整产品文档见 [`doc/PRD.md`](doc/PRD.md)。

---

## 玩法（核心流程）

1. **填昵称** — 仅用于报告归属，不影响故事生成。
2. **拍照** — `minimax-m3` 视觉模型识别你的整体气质 / 服饰风格 / 主色印象 / 现场状态（**流式**，4 个标签边识别边填）。
3. **择锅底** — 选一个或多个，映射人生底色（界面只显示锅底名，含义藏到报告才揭晓）。
4. **配食材** — 荤素自便，映射人生资源，换算进"100 金币人生分配"。
5. **调蘸料** — 想加几味加几味，映射行为风格。
6. **火锅沸腾** — `deepseek-v4-pro` 基于你的选择 + 气质写一段人生叙事（**写完才出现"查看报告"按钮**）。
7. **人生火锅报告** — 命运口味、金币分配、AI 人生故事 + 可扫码保存的分享卡片。

> **设计取向**：锅底 / 食材 / 蘸料都**不限数量、允许一个都不选**——「不选」也是一种选择。

报告地址（`/report/<编码>`）是公网可访问链接，AI 故事**烤在链接里**，别人扫码 / 点开**无需 key** 直接看。

---

## 界面预览

### 1. 首页与拍照
| 首页 (填昵称) | 拍照 (气质识别) |
| :---: | :---: |
| <img src="resources/前端截图/首页.png" width="360" alt="首页" /> | <img src="resources/前端截图/拍照页.png" width="360" alt="拍照页" /> |

### 2. 火锅配置流程
| 选择锅底 | 挑选食材 | 调制蘸料 |
| :---: | :---: | :---: |
| <img src="resources/前端截图/选择锅底.png" width="240" alt="选择锅底" /> | <img src="resources/前端截图/选食材.png" width="240" alt="选食材" /> | <img src="resources/前端截图/调蘸料.png" width="240" alt="调蘸料" /> |

### 3. 生成报告与命运故事
| 人生火锅报告 | 命运故事 (展开) |
| :---: | :---: |
| <img src="resources/前端截图/火锅报告.png" width="360" alt="火锅报告" /> | <img src="resources/前端截图/命运故事.png" width="360" alt="命运故事" /> |

---

## 技术栈

- **框架**：TanStack Start（SSR）+ React 19 + TanStack Router
- **构建**：Vite 8 + Nitro（`cloudflare-module` preset）→ 部署为 Cloudflare Workers + 静态资源
- **样式**：Tailwind CSS v4（宣纸朱红 / 太极鸳鸯锅视觉）
- **大模型**：经 tokendance 网关（OpenAI 兼容）—— `deepseek-v4-pro` 写人生故事、`minimax-m3` 识别照片特征
- **分享**：报告摘要 base64 编码进 URL + `qrcode` 生成二维码

---

## 本地调试（手把手）

### 1. 装 Node 22（重要）

项目的 `package-lock.json` 与 Cloudflare 构建环境一致，**请用 Node 22**（自带 npm 10）。推荐用 nvm：

```bash
nvm install 22
nvm use 22
node -v        # 应显示 v22.x
```

### 2. 装依赖

```bash
npm install
```

### 3. 配大模型 key（可选，推荐）

复制示例配置并填入你的 key：

```bash
cp .env.example .env
```

编辑 `.env`，填一行（key 去你的模型服务商后台获取）：

```
VITE_LLM_KEY=你的key
```

> 不填也能跑——故事回落确定性模板、拍照特征回落默认值，方便先看界面。

### 4. 启动开发服务器

```bash
npm run dev
# 打开 http://localhost:8080
```

### 常用脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发（热更新） |
| `npm run build` | 生产构建（产出 `dist/`） |
| `npm run preview` | Vite 本地预览构建产物 |
| `npm run preview:cf` | 用 wrangler 本地跑 Cloudflare 构建产物 |
| `npm run deploy` | 构建 + 部署到 Cloudflare（需先 `npx wrangler login`） |
| `npm run lint` / `format` | 代码检查 / 格式化 |

---

## 环境变量

| 变量 | 说明 | 在哪设 |
| --- | --- | --- |
| `VITE_LLM_KEY` | 大模型 API key（构建时烤进前端 bundle） | 本地 `.env`；线上 Cloudflare 构建变量 |

> ⚠️ `VITE_` 前缀的变量**会被打进公开的前端 bundle**，任何访问者都能在浏览器里看到 key。**仅用额度受限的一次性 demo key**，别用正式 key。`.env` 已被 `.gitignore` 排除，不会进仓库。

网关地址和模型名写死在 [`src/lib/llm.ts`](src/lib/llm.ts) 顶部（`BASE` / `LLM_MODEL_STORY` / `LLM_MODEL_VISION`），换服务商改这里即可。

---

## 部署到 Cloudflare（上线）

部署形态为 **Cloudflare Workers + 静态资源**。两种方式**选一种**（同名 Worker，别混用，会互相覆盖）。

### 方式 A：GitHub 连接自动部署（推荐，最省事）

1. 把代码 push 到 GitHub。
2. Cloudflare 控制台 → **Workers & Pages → Create → Workers → Connect to Git** → 选你的仓库。
3. 构建设置：
   - **Build command**：`npm run build`
   - **Deploy command**：`npx wrangler deploy`
   - **Branch**：`main`
4. **（关键）配线上 key**：进入该 Worker → **Settings → Variables and Secrets → Add**，Name 填 `VITE_LLM_KEY`、Value 填你的 key（选加密 Secret）。**不配的话线上 AI 不生效**（回落模板）。
5. Save and Deploy。之后每次 `git push origin main` 自动重新部署。

> Worker 名由根目录 [`wrangler.jsonc`](wrangler.jsonc) 的 `name` 决定（默认 `ai-life-hotpot`）。Nitro 构建时会自动生成 `dist/server/wrangler.json`（worker 入口 + 静态资源绑定 `env.ASSETS` + `nodejs_compat`），无需手动配 `main` / `assets`。

### 方式 B：本地命令行部署

```bash
npx wrangler login      # 一次性，弹浏览器授权 Cloudflare
npm run deploy          # = npm run build && wrangler deploy
```

### ⚠️ 上线常见坑：lockfile 不同步

Cloudflare 构建环境用 **node 22 / npm 10.9** 跑 `npm ci`（严格校验 lockfile）。若你本地是 node 24 / npm 11，提交的 `package-lock.json` 可能让 CF 报 `package.json 与 lockfile 不同步 / Missing ...`。**改了依赖后，用 node 22 重生 lockfile 再提交**：

```bash
nvm use 22
rm -rf node_modules package-lock.json && npm install
git add package-lock.json && git commit -m "chore: 重生 lockfile" && git push
```

---

## 排坑指南

| 现象 | 排查 |
| --- | --- |
| 本地 AI 没反应（故事 / 特征都是模板 / 默认） | `.env` 里 `VITE_LLM_KEY` 填了吗？**改完要重启** `npm run dev` |
| 线上 AI 没反应 | Cloudflare Worker 的 **Settings → Variables** 里加了 `VITE_LLM_KEY` 吗？加完要**重新触发一次部署** |
| 怎么确认 AI 真的在跑 | 走流程时打开浏览器 **DevTools → Network**，看到 `tokendance.space/.../chat/completions` 返回 200 就是生效 |
| 控制台报 **CORS** 跨域错 | 网关不允许浏览器直连 → 换允许跨域的渠道，或改走服务端 |
| 请求 **404 / model not found** | [`src/lib/llm.ts`](src/lib/llm.ts) 顶部模型名（`deepseek-v4-pro` / `minimax-m3`）与网关不一致 → 去后台核对后改名 |
| 请求 **401** | key 不对 / 过期 → 重新填 |
| CF 部署报 lockfile 不同步 | 见上一节，用 node 22 重生 lockfile |

> 任何 AI 调用失败都会**自动回落**到确定性模板故事 + 默认人物特征，现场不会白屏。

---

## 项目结构

```
src/
├─ routes/
│  ├─ index.tsx       # 首页（昵称输入）
│  ├─ capture.tsx     # 拍照 + minimax-m3 识别人物特征（流式填 4 标签）
│  ├─ play.tsx        # 配火锅主流程（锅底 → 食材 → 蘸料 → 沸腾）
│  └─ report.$id.tsx  # 人生火锅报告页（$id = base64 编码的选择摘要 + AI 故事）
├─ components/        # Stage、hotpot-art（鸳鸯锅 / 食材绘制）等
├─ lib/
│  ├─ llm.ts          # 大模型调用（tokendance 网关,流式 + 非流式 + 兜底）
│  ├─ scoring.ts      # 100 金币人生分配算法 + URL 编解码
│  ├─ mockReport.ts   # 确定性报告模板（AI 故事的兜底）
│  └─ session.ts      # 本地会话存储
├─ data/hotpot.ts     # 锅底 / 食材 / 蘸料数据 + 五维权重
└─ styles.css         # Tailwind v4 + 自定义主题
wrangler.jsonc        # Cloudflare Worker 配置（name / 兼容日期）
.env.example          # 环境变量示例
doc/PRD.md            # 产品需求文档
```

## 状态

- ✅ 完整闭环：昵称 → 拍照识别 → 锅底 / 食材 / 蘸料 → 沸腾 → AI 报告 → 扫码分享。
- ✅ 大模型接入：`deepseek-v4-pro` 写故事、`minimax-m3` 识别人物特征（流式），失败回落模板。
- ✅ Cloudflare Workers 部署 + GitHub `main` 自动部署。
- 🚧 隔空手势识别、照片长期档案等属于线下装置形态目标，Web Demo 当前以点击 / 触摸交互为主。
