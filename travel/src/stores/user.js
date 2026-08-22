import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

// 默认头像，用于未上传头像时
const DEFAULT_AVATAR = 'https://fastly.jsdelivr.net/npm/@vant/assets/leaf.jpeg'

const STORAGE_KEY_USERS = 'travel_user_list'
const STORAGE_KEY_CURRENT = 'travel_current_user'

// 从 localStorage 读取持久化数据
function loadUsers() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_USERS)
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

function loadCurrentUser() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_CURRENT)
    return data ? JSON.parse(data) : null
  } catch (e) {
    return null
  }
}

export const useUserStore = defineStore('user', () => {
  // 用户列表：{ username, password, avatar }
  const users = ref(loadUsers())
  // 当前登录用户：{ username, avatar }
  const currentUser = ref(loadCurrentUser())

  // 持久化：监听变化保存到 localStorage
  watch(users, (val) => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(val))
  }, { deep: true })

  watch(currentUser, (val) => {
    if (val) {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(val))
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT)
    }
  }, { deep: true })

  // 是否已登录
  const isLoggedIn = computed(() => !!currentUser.value)

  // 当前用户显示名称（未登录时显示「游客」）
  const displayName = computed(() => currentUser.value?.username || '游客')
  const displayAvatar = computed(() => currentUser.value?.avatar || DEFAULT_AVATAR)

  /**
   * 注册新用户
   * @param {Object} payload { username, password, avatar }
   * @returns {{ success: boolean, message: string }}
   */
  function register(payload) {
    const { username, password, avatar } = payload || {}

    if (!username || !username.trim()) {
      return { success: false, message: '用户名不能为空' }
    }
    if (!password || !password.trim()) {
      return { success: false, message: '密码不能为空' }
    }
    if (password.length < 6) {
      return { success: false, message: '密码至少6位' }
    }

    // 检查用户名是否已存在
    const exists = users.value.some((u) => u.username === username.trim())
    if (exists) {
      return { success: false, message: '用户名已被注册' }
    }

    const newUser = {
      username: username.trim(),
      password: password,
      avatar: avatar || DEFAULT_AVATAR
    }
    users.value.push(newUser)

    // 注册成功：自动登录
    currentUser.value = {
      username: newUser.username,
      avatar: newUser.avatar
    }

    return { success: true, message: '注册成功' }
  }

  /**
   * 登录
   * @param {Object} payload { username, password }
   * @returns {{ success: boolean, message: string }}
   */
  function login(payload) {
    const { username, password } = payload || {}

    // 先判断有没有用户数据
    if (!users.value || users.value.length === 0) {
      return { success: false, message: '用户名或密码错误' }
    }

    const found = users.value.find(
      (u) => u.username === username && u.password === password
    )

    if (!found) {
      return { success: false, message: '用户名或密码错误' }
    }

    currentUser.value = {
      username: found.username,
      avatar: found.avatar
    }
    return { success: true, message: '登录成功' }
  }

  /**
   * 退出登录
   */
  function logout() {
    currentUser.value = null
  }

  return {
    users,
    currentUser,
    isLoggedIn,
    displayName,
    displayAvatar,
    register,
    login,
    logout
  }
})
