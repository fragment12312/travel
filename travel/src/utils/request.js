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
