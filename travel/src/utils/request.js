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

//处理流式响应
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
  //获取响应体
    const reader = response.body.getReader()
  //创建一个解码器
    const decoder = new TextDecoder()

    while(true){
      const { done, value } = await reader.read()
      if(done) break
      const chunk = decoder.decode(value, { stream: true })
      //交给上层处理每个片段
      if (onChunk) onChunk(chunk)
    }
    if (onComplete) onComplete()

  } catch (error) {
    if (onError) onError(error.message)
  }
}