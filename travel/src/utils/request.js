import axios from 'axios'

const request = axios.create({
  baseURL: 'http://127.0.0.1:3300/api/travel',
  // LLM 生成整份行程 JSON 耗时较长，60s 容易超时，这里放宽到 3 分钟
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json'
  }
})

//拦截器
request.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)



//相应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    return Promise.reject(error)
  }
)

export function post(url, data) {
  return request.post(url, data)
}

export function get(url, params) {
  return request.get(url, { params })
}

//从单个 SSE 事件块中解析出 data 字段（后端返回的是 data: {JSON}\n\n）
function parseSSE(event) {
  const lines = event.split('\n')
  const dataLines = lines
    .filter(line => line.startsWith('data:'))
    .map(line => line.slice(5).trim())

  if (dataLines.length === 0) return null

  const raw = dataLines.join('\n')
  try {
    return JSON.parse(raw)
  } catch (e) {
    // 非 JSON 内容原样返回
    return raw
  }
}

//处理流式响应（SSE）
export async function fetchStream(url, data, onChunk, onComplete, onError) {
  //创建一个控制器
  const controller = new AbortController()

  try {
    const response = await fetch(`http://127.0.0.1:3300/api/travel/${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    //获取响应体
    const reader = response.body.getReader()
    //创建一个解码器
    const decoder = new TextDecoder()

    let buffer = ''

    while(true){
      const { done, value } = await reader.read()
      if(done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE 事件之间以 \n\n 分隔，最后一段可能不完整，留在 buffer 里
      const events = buffer.split('\n\n')
      buffer = events.pop()

      for (const event of events) {
        const data = parseSSE(event)
        if (data !== null && onChunk) onChunk(data)
      }
    }

    // 处理末尾残留的事件
    if (buffer.trim()) {
      const data = parseSSE(buffer)
      if (data !== null && onChunk) onChunk(data)
    }

    if (onComplete) onComplete()

  } catch (error) {
    if (onError) onError(error.message)
  }
}