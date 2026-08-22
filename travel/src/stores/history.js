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
  // TODO: 历史记录列表（结构待定：行程参数 + 结果 / 时间戳 + 目的地）
  const history = ref(loadHistory())

  // 持久化到 localStorage
  watch(history, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  // TODO: 新增一条历史记录
  function addHistory(record) {}

  // TODO: 删除单条历史
  function removeHistory(id) {}

  // TODO: 清空历史
  function clearHistory() {}

  return {
    history,
    addHistory,
    removeHistory,
    clearHistory
  }
})
