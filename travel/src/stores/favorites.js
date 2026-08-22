import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'travel_favorites'

// 从 localStorage 读取持久化数据
function loadFavorites() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

export const useFavoritesStore = defineStore('favorites', () => {
  // TODO: 收藏列表（结构待定：景点 / 行程 / 两者）
  const favorites = ref(loadFavorites())

  // 持久化到 localStorage
  watch(favorites, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  // TODO: 添加收藏
  function addFavorite(item) {}

  // TODO: 取消收藏
  function removeFavorite(id) {}

  // TODO: 判断是否已收藏
  function isFavorite(id) {}

  // TODO: 清空收藏
  function clearFavorites() {}

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearFavorites
  }
})
