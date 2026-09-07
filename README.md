## 项目概述

智能旅游助手：一个 AI 驱动的行程规划 + 旅游问答应用。用户在首页输入「目的地 / 预算 / 天数」，后端调用大模型生成每日行程 JSON，前端渲染；同时提供流式 AI 对话功能。

仓库根目录下是**两个相互独立的应用**（非 npm workspace，各自有 `package.json` 与 `node_modules`）：

- `travel/` —— 前端（Vue 3 + Vite），移动端单页应用
- `travel-II/` —— 后端（Express + LangChain），调用大模型的服务

两者通过 HTTP 通信，前端硬编码后端地址为 `http://127.0.0.1:3300`。

## 常用命令

前端（在 `travel/` 下运行）：

```bash
npm run dev      # 启动开发服务器（Vite，默认 http://localhost:5173）
npm run build    # 生产构建（产物输出到 travel/dist/）
npm run preview  # 预览构建产物
```

后端（在 `travel-II/` 下运行）：

```bash
npm run dev      # nodemon 热重载启动（监听 src 下的 js/json）
npm start        # node src/index.js 直接启动
```

- 前端没有配置任何 lint / test 脚本；后端 `npm test` 只是占位（`echo ... exit 1`），无实际测试。
- 本地开发需**同时启动前后端**：先起后端（`travel-II`），再起前端（`travel`），否则所有请求会 `ERR_NETWORK`。
- 后端端口由 `.env` 的 `PORT` 决定（默认 3300）。

## 环境变量（travel-II/.env）

`.env` 已被 gitignore，需自行准备。模型提供方由 `MODEL_PROVIDER` 切换（`SILICONFLOW` 或 `DEEPSEEK`），对应读取各自的一组 key：

```ini
PORT=3300
MODEL_PROVIDER=SILICONFLOW          # 或 DEEPSEEK
SILICONFLOW_API_KEY=...
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=...
DEEPSEEK_API_KEY=...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
```

## 架构

### 后端（travel-II/）

分层结构：`src/index.js`（Express 入口）→ `src/route/travel.js`（路由）→ `src/services/travelService.js`（业务/LLM）→ `src/utils/streamUtils.js`（SSE 工具）。

- **LLM 调用统一走 LangChain 的 `ChatOpenAI`**（`travelService.js`），用 `streaming: true`。`initLLM()` 按 `MODEL_PROVIDER` 组装 apiKey/baseURL/model，兼容 SiliconFlow 与 DeepSeek。
- 两个核心接口：
  - `POST /api/travel/recommend` —— **非流式**，`llm.invoke()` 一次性生成整份行程 JSON，再用正则从文本里抠出 JSON 解析。入参 `{ city, days, budget }`，校验：预算 ≥100、天数 1–30。
  - `POST /api/travel/chat` —— **SSE 流式**，`llm.stream()` 逐块回调 `stream.send({type:'chunk', data})`，最后发 `{type:'complete', data:{reply}}`。
- **SSE 协议**：`streamUtils.createStreamResponse(res)` 设置 `text/event-stream` 头后，返回 `{ send, end, error }`，每次 `send` 写出 `data: {JSON}\n\n`。
- 行程 JSON 结构在 `getTravelPrompt()` 的提示词里定义（`dailyItinerary[]`、`budgetBreakdown`、`tips`、`warnings` 等），前端渲染强依赖该结构。

### 前端（travel/）

技术栈：Vue 3（`<script setup>`）+ Vite + Pinia + Vue Router + Vant 4 + axios。`unplugin-vue-components` 配 `VantResolver` 自动按需引入 Vant 组件（无需手动 import）。

- **入口与全局**：`src/main.js` 注册 Vant / Pinia / Router，并全局引入 `src/styles/common.css`（含 `.card`、`.page-container`、自定义 toast 样式等通用类）。
- **路由**（`src/router/index.js`）：全部懒加载。`/` 首页、`/chat` 对话、`/detail` 行程详情（靠 query 传参 `city/budget/days`）、`/profile`（子路由 favorites/history/settings）、`/auth`（login/register）。旧路径 `/login`、`/register` 重定向到 `/auth/*`。
- **状态管理**：`src/stores/` 下 4 个 Pinia store，**均用 `watch(..., {deep:true})` 持久化到 localStorage**：
  - `user.js` —— 注册/登录/登出**纯前端实现**（无后端鉴权），用户数据存 localStorage（`travel_user_list` / `travel_current_user`）。
  - `history.js` —— 历史记录（`addHistory`/`removeHistory`/`clearHistory`），记录类型 `type: 'chat' | 'query'`。
  - `favorites.js`、`settings.js` —— **占位 store**，只有 `TODO` 空方法，尚未实现。
- **请求层**（`src/utils/request.js`）：
  - `post`/`get` 封装 axios，`baseURL` 指向后端，`timeout` 已放宽到 180s（LLM 生成整份行程较慢）。
  - `fetchStream(url, data, onChunk, onComplete, onError)` —— 用原生 `fetch` + `ReadableStream` + `TextDecoder` 手动解析 SSE（按 `\n\n` 切分、`parseSSE` 解析 `data:` 行）。**流式请求必须走这里，不能用 axios**（axios 的 timeout 是总时长，流式会超时）。
- **页面数据流**：
  - 首页 `Home.vue` 填表 → 写历史 → `router.push('/detail?city=...&budget=...&days=...')`。
  - `Detail.vue` 读 query 参数 → `post('recommend', ...)` → 渲染每日行程/预算/小贴士；报错用 `friendlyError()` 翻译成可读文案。
  - `Chat.vue` 走 `fetchStream('chat', ...)`，`onChunk` 逐段拼到 AI 气泡；底部有常见问题快捷提问。
- **自定义 toast**：`src/utils/toast.js` 的 `showToast` 替代 Vant 的 `showToast`（样式在 `common.css` 的 `.custom-toast`）。
