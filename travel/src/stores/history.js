import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'travel_history'

// 从 localStorage 读取持久化数据
function loadHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

export const useHistoryStore = defineStore('history', () => {
  // 历史记录列表：{ id, type: 'chat' | 'query', title, time, ...额外字段 }
  const history = ref(loadHistory())

  // 持久化到 localStorage
  watch(history, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  // 新增一条历史记录
  function addHistory(record) {
    const item = {
      ...record,
      id: Date.now(),
      time: new Date().toLocaleString()
    }
    history.value.unshift(item)
    return item
  }

  // 删除单条历史
  function removeHistory(id) {
    history.value = history.value.filter((item) => item.id !== id)
  }

  // 清空历史
  function clearHistory() {
    history.value = []
  }

  return {
    history,
    addHistory,
    removeHistory,
    clearHistory
  }
})
