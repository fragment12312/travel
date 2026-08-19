# 后端 LLM 调用优化方案（待实施）

> 状态：**未实施**，仅记录方案，供后续改善。
> 关联问题：`/api/travel/recommend` 非流式生成整份 JSON 行程，耗时过长，曾导致前端 60s 超时（`AxiosError: timeout of 60000ms exceeded`）。
> 相关文件：[src/services/travelService.js](../src/services/travelService.js)、[src/route/travel.js](../src/route/travel.js)、[src/utils/streamUtils.js](../src/utils/streamUtils.js)。

---

## 背景

当前 `recommend` 的调用链：

```
前端 Detail.vue  →  POST /api/travel/recommend
        ↓
travelService.recommend()  →  this.llm.invoke(messages)   // 非流式，一次性等完整结果
        ↓
SiliconFlow 大模型生成整份 JSON（最长 30 天行程，几千 token）
        ↓
解析 JSON → res.json(result)
```

三个核心问题：

1. **后端 LLM 调用没有超时**——模型一旦卡住/排队，后端会无限等待，前端只能自己超时。
2. **非流式**——`streaming: true` 配了却用 `invoke()`，白白放弃流式能力；整份结果一次性返回，前端没有任何中间反馈。
3. **JSON 解析靠正则硬抠**——`fullResponse.match(...)` 不稳定，模型输出稍有偏差就解析失败。

---

## 优化点一：给 LLM 调用加超时 + 重试

### 现状
[travelService.js:26-34](../src/services/travelService.js#L26-L34) 的 `ChatOpenAI` 没有传 `timeout`，LangChain 默认不设超时（openai SDK 默认 10 分钟），`maxRetries` 默认为 0。

### 方法
在 `new ChatOpenAI({...})` 里加 `timeout` 和 `maxRetries`：

```js
this.llm = new ChatOpenAI({
  apiKey: apikey,
  configuration: { baseURL: baseurl },
  model,
  temperature: 0.7,
  streaming: true,
  timeout: 120000,   // 120 秒兜底，超时抛错，后端能快速返回明确错误
  maxRetries: 1,     // 网络抖动时自动重试一次
});
```

> 说明：`@langchain/openai@1.5.5` 会把 `timeout` 透传给 openai SDK 的 `fetch` 请求（见 `dist/chat_models/base.js` 的 `_getClientOptions`），实测有效。

### 配合：捕获超时并返回友好错误
`recommend()` 外层已有 try/catch，超时会被 `catch (err)` 捕获并返回 `{ success: false, error: err.message }`。建议把超时错误翻译得更友好：

```js
} catch (err) {
  const msg = String(err?.message || '')
  return {
    success: false,
    error: msg.includes('timeout') || msg.includes('ETIMEDOUT')
      ? '模型响应超时，请减少天数或稍后重试'
      : err.message
  }
}
```

---

## 优化点二：使用 JSON 模式，加速并提高解析成功率

### 现状
靠正则从文本里抠 JSON（[travelService.js:50-53](../src/services/travelService.js#L50-L53)），模型输出一点偏差就解析失败。

### 方法
SiliconFlow / DeepSeek 均兼容 OpenAI 的 `response_format`。给模型强制 JSON 输出：

```js
this.llm = new ChatOpenAI({
  apiKey: apikey,
  configuration: { baseURL: baseurl },
  model,
  temperature: 0.2,   // JSON 模式建议调低温度，输出更稳定
  streaming: true,
  timeout: 120000,
  maxRetries: 1,
  modelKwargs: {
    response_format: { type: 'json_object' }   // 强制 JSON 输出
  },
});
```

> 注意：OpenAI 要求使用 `json_object` 时，prompt 里必须出现「json」字样——当前 prompt 已包含「JSON」多处，满足条件。

### 配合：把解析逻辑抽成独立方法，容错更好
```js
parseItinerary(text) {
  // 先尝试整段解析
  try { return JSON.parse(text) }
  catch {}
  // 再尝试剥离 ```json 代码块
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) {
    try { return JSON.parse(fence[1]) } catch {}
  }
  // 最后用正则抠第一个花括号块
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) {
    try { return JSON.parse(obj[0]) } catch {}
  }
  throw new Error('JSON 解析失败')
}
```

---

## 优化点三：把 `/recommend` 改成流式（SSE）

### 现状
`/chat` 已经是 SSE 流式（[travel.js:33-40](../src/route/travel.js#L33-L40)），但 `/recommend` 是非流式。

### 方法（推荐：后端累积后解析，前端逐字展示进度）
因为行程是 JSON，需要完整拿到才能解析，所以「流式」的收益在于**前端能实时看到生成进度、连接不断开**，而不是解析速度。

**后端改动**（参考现有 `/chat`）：

```js
// travel.js 里 /recommend 改为：
router.post('/recommend', async (req, res) => {
  const { city, days, budget } = req.body
  if (!city || !days || !budget) {
    return res.status(400).json({ success: false, message: '缺少必要参数：city、days、budget' })
  }

  const stream = createStreamResponse(res)   // 复用 streamUtils
  try {
    const result = await travelService.recommendStream(city, days, budget, (chunk) => {
      stream.send({ type: 'chunk', data: chunk })   // 把模型逐字输出推给前端
    })
    stream.send({ type: 'complete', data: result }) // 最终解析好的 JSON
  } catch (err) {
    stream.send({ type: 'error', data: { message: err.message } })
  } finally {
    stream.end()
  }
})
```

**travelService 增加 `recommendStream`**（复用 `llm.stream`，同 `chat`）：

```js
async recommendStream(city, days, budget, onChunk) {
  if (budget < 100 || days > 30 || days < 1) {
    throw new Error('预算不能低于100元，天数不能超过30天，且不能低于1天')
  }
  const messages = this.getTravelPrompt(city, days, budget)
  const stream = await this.llm.stream(messages)

  let full = ''
  for await (const chunk of stream) {
    const content = chunk.content || ''
    if (!content.trim()) continue
    full += content
    onChunk?.(content)
  }
  return this.parseItinerary(full)   // 复用优化点二的解析方法
}
```

### 关键：前端必须改用 fetch 读 SSE，不能再用 axios

**这点最重要，否则流式白改。** axios 的 `timeout` 是**整个请求的总时长**，不是「空闲多久没数据」。所以即使后端流式返回，只要总时长超过 timeout，axios 照样报超时。

前端需要用 `fetch` + `ReadableStream`（或原生 `EventSource`）读取 SSE，且**不设总超时**：

```js
const res = await fetch('http://127.0.0.1:3300/api/travel/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ city, days, budget }),
})

const reader = res.body.getReader()
const decoder = new TextDecoder()
let buffer = ''

while (true) {
  const { value, done } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })

  // 按 \n\n 切分 SSE 事件
  let idx
  while ((idx = buffer.indexOf('\n\n')) >= 0) {
    const raw = buffer.slice(0, idx)
    buffer = buffer.slice(idx + 2)
    for (const line of raw.split('\n')) {
      if (line.startsWith('data: ')) {
        const event = JSON.parse(line.slice(6))
        if (event.type === 'chunk') {
          // 追加到页面，实时显示生成进度
        } else if (event.type === 'complete') {
          // 渲染完整行程 event.data
        }
      }
    }
  }
}
```

> 流式本质解决的是「体验 + 连接不被中间层掐断」；若只是想让当前实现先跑通，优化点一（后端超时）+ 前端 timeout 调大（已做）已经够用。

---

## 优化点四（可选）：控制生成体量

当前 prompt 允许最多 30 天、每段详细描述，输出体量极大，是耗时的直接原因。可选手段：

- 限制天数上限（例如 ≤ 7 天），在 `recommend` 校验里改成 `days > 7`。
- prompt 里明确「简洁、每段描述 30 字以内」。
- 预算过小/天数过大时，直接返回提示而非硬生成。

---

## 实施顺序建议

| 顺序 | 改动 | 收益 | 成本 |
|---|---|---|---|
| 1 | 优化点一：加 `timeout` + `maxRetries` | 后端不再无限等待，快速失败 | 极低（改 2 行） |
| 2 | 优化点二：`response_format: json_object` | 输出更快更稳、解析成功率高 | 低 |
| 3 | 优化点三：流式 + 前端改 fetch | 彻底消除超时、实时反馈 | 中（前后端联动） |
| 4 | 优化点四：控制体量 | 治本，直接缩短耗时 | 低 |

> 建议至少先做 1+2，能明显改善现状；3 是最终解，需要前后端一起改。
