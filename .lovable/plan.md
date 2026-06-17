## AI人生火锅 — MVP Web Demo Plan

目标：在浏览器里跑通完整体验闭环——开场拍照 → 选锅底 → 三荤两素食材 → 选配料 → 火锅沸腾 → 生成「人生火锅报告」→ 报告页 + 二维码。AI 全部 mock，鼠标/触控交互，后续再叠加 Cloud + AI Gateway 与手势识别。

## 体验流程（路由）

```
/                      落地 + Start 按钮（核心隐喻文案）
/capture               摄像头拍照（getUserMedia），保存 dataURL 到 sessionStorage
/play                  火锅桌面主舞台（含三个阶段 + 沸腾动画）
  step=base            选 1 个锅底（6 选 1）
  step=ingredients     选 3 荤 + 2 素（8 选 5，分荤素）
  step=condiments      选 1–2 个配料（6 选）
  step=boiling         沸腾动画 + AI 观察文案（“我们已经观察你三分钟…”）
/report/:id            人生火锅报告（含二维码指向自身 URL）
```

## 数据与状态

- `sessionStorage` 保存：photo dataURL、选择记录（含 itemId、order、dwellMs、hesitateMs）。
- 报告 ID = base64 编码的选择摘要，写入 URL，保证二维码扫开后可在任意设备复现报告（mock 阶段无后端）。
- 之后接入 Cloud 时，将摘要写入 `reports` 表，URL 改为短 ID。

## 数据建模（前端常量）

`src/data/hotpot.ts`：

- `bases`：6 个锅底（麻辣、番茄、清汤、菌菇、椰子鸡、酸菜鱼），各带 `{wealth, love, freedom, family, dream}` 权重与「人生基调」描述。
- `ingredients`：8 个，标注 `kind: 'meat' | 'veg'`，附维度权重。
- `condiments`：6 个，附「行为风格」标签与维度修正。
- 配色/emoji/SVG 图标先用 emoji + Tailwind 渐变占位，后续替换为绘制资产。

## 100 金币分配模型（mock 实现）

`src/lib/scoring.ts`：

1. 累加所选项目的维度权重。
2. 按选择顺序加 `1 / (order + 1)` 优先级权重；犹豫时间 > 4s 的项目权重 ×0.85（“拉扯”）。
3. 归一化到总和 100，四舍五入后修正余数。
4. 输出 `{wealth, love, freedom, family, dream}` 与 top 维度。

## Mock AI 报告生成

`src/lib/mockReport.ts`：根据锅底 + top 维度 + 配料标签，从模板池拼装：

- 人生锅底（一句话价值观）
- 核心食材（资源描述）
- 灵魂蘸料（行为风格）
- 金币分配（数字 + 进度条）
- 命运口味（一句话总结）
- 人生故事（120–180 字短文，模板 + 槽位填空）
- 分享卡片（可截图区域）

接口形状与未来真实 AI 一致，后续替换为 `createServerFn` + Lovable AI Gateway 时只换实现。

## 关键组件

- `HotpotStage`：中央 SVG 火锅（空锅 → 加汤 → 食材掉落 → 沸腾气泡），用 CSS/Motion 动画。
- `ChoiceTray`：当前阶段可选项，鼠标 hover 高亮、点击「抓取」、再点锅内「释放」。同时支持拖拽。
- `Stepper`：阶段进度（锅底 / 食材 / 配料 / 沸腾）。
- `ObserverHUD`：右上角“AI 正在观察…”，随选择推送提示。
- `CaptureView`：getUserMedia + canvas 抓帧；权限失败时给跳过按钮。
- `ReportCard`：长卡片，含 QR（`qrcode` 包）和「保存图片」按钮（`html-to-image`）。

## 路由结构（TanStack Start）

```
src/routes/__root.tsx        全局背景、字体、Outlet
src/routes/index.tsx         首页
src/routes/capture.tsx       拍照
src/routes/play.tsx          主舞台（内部状态机控制阶段）
src/routes/report.$id.tsx    报告页 + QR
```

每个路由各自 head() 元数据（标题/描述/og）。

## 视觉方向（默认，可后续生成 design directions）

- 中式火锅夜市气质：暖红 #C8201F 主色、米黄 #F5E6C8 背景、深棕 #2A1810 文本，金色高光 #E8B547。
- 字体：标题用 Noto Serif SC（@fontsource），正文 Noto Sans SC。
- 大量手绘式 SVG + 颗粒纹理，避免“通用 AI 紫渐变”。

## 暂不实现（后续阶段）

- MediaPipe Hands 手势识别。
- Lovable Cloud + AI Gateway 接入真实模型生成报告与读图。
- 报告持久化与短链。
- 离线兜底（mock 已天然离线）。

## 验收

1. 桌面与手机浏览器都能完整走完五步并拿到报告。
2. 报告 URL 在新设备打开能复现同一份内容。
3. QR 码扫描可在手机打开报告页。
4. 选择过程有明显的视觉反馈（火锅状态变化 + AI 观察文案）。
