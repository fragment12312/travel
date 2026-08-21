<template>
    <div>
        <van-nav-bar
        title="AI旅游助手"
        left-arrow
        @click-left="OnBack"
        left-text="返回"
      />
    </div>
    <div class="page-content">
        <van-form @submit="onSubmit">
            <van-cell-group inset>
                <van-field v-model="username" name="username" label="用户名" placeholder="用户名"
                    :rules="[{ required: true, message: '请填写用户名' }]" />
                <van-field v-model="password" type="password" name="password" label="密码" placeholder="密码"
                    :rules="[{ required: true, message: '请填写密码' }]" />
            </van-cell-group>

            <!-- 登录失败：表单下方提示 -->
            <div v-if="errorMessage" class="error-tip">
                {{ errorMessage }}
            </div>

            <div style="margin: 16px;">
                <van-button size="large" type="primary" native-type="submit" :loading="isLoggingIn">
                    登录
                </van-button>
                <br><br>
                <van-button size="large" type="default" @click="goRegister">注册</van-button>
            </div>
        </van-form>

    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from '../utils/toast'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoggingIn = ref(false)


const OnBack = () => {
  router.back()
}

const goRegister = () => {
  router.push('/register')
}

const onSubmit = () => {
  errorMessage.value = ''
  isLoggingIn.value = true
  try {
    const result = userStore.login({
      username: username.value,
      password: password.value
    })

    if (!result.success) {
      // 用户名或密码错误：在表单下方提示
      errorMessage.value = result.message
      return
    }

    showToast(result.message)
    // 登录成功，跳转首页
    router.replace('/')
  } finally {
    isLoggingIn.value = false
  }
}
</script>

<style scoped>
.page-content {
    padding: 16px;
    margin: 0 auto;
}

.error-tip {
    margin: 12px 16px 0;
    padding: 10px 12px;
    background: #fef0f0;
    color: #ee0a24;
    border-radius: 6px;
    font-size: 13px;
}
</style>
