import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'travel_settings'

// 默认设置（待补充）
const DEFAULT_SETTINGS = {
  // TODO: 默认预算
  defaultBudget: null,
  // TODO: 默认天数
  defaultDays: null,
  // TODO: 是否流式输出
  streamOutput: true,
  // TODO: 主题色等其他偏好
}

// 从 localStorage 读取持久化数据
function loadSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS }
  } catch (e) {
    return { ...DEFAULT_SETTINGS }
  }
}

export const useSettingsStore = defineStore('settings', () => {
  // 用户偏好设置
  const settings = ref(loadSettings())

  // 持久化到 localStorage
  watch(settings, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  // TODO: 更新单个配置项
  function updateSetting(key, value) {}

  // TODO: 重置为默认设置
  function resetSettings() {}

  return {
    settings,
    updateSetting,
    resetSettings
  }
})
