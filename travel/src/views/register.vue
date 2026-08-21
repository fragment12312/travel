<template>
    <div class="page-container">
        <div class="page-header">
            <van-nav-bar
                title="注册账号"
                left-arrow
                @click-left="onBack"
                left-text="返回"
            />
        </div>
        <div class="page-content">
            <van-form @submit="onSubmit">
                <!-- 头像上传 -->
                <div class="avatar-section">
                    <div class="avatar-label">选择头像</div>
                    <van-uploader
                        v-model="fileList"
                        :max-count="1"
                        :after-read="afterRead"
                        :before-delete="beforeDelete"
                        upload-text="点击上传"
                        accept="image/*"
                    />
                </div>

                <van-cell-group inset style="margin-top: 16px;">
                    <van-field
                        v-model="username"
                        name="username"
                        label="用户名"
                        placeholder="请输入用户名"
                        :rules="[{ required: true, message: '请填写用户名' }]"
                    />
                    <van-field
                        v-model="password"
                        type="password"
                        name="password"
                        label="密码"
                        placeholder="请输入密码（至少6位）"
                        :rules="[
                            { required: true, message: '请填写密码' },
                            { min: 6, message: '密码至少6位' }
                        ]"
                    />
                    <van-field
                        v-model="confirmPassword"
                        type="password"
                        name="confirmPassword"
                        label="确认密码"
                        placeholder="请再次输入密码"
                        :rules="[{ required: true, message: '请确认密码' }]"
                    />
                </van-cell-group>

                <!-- 错误提示 -->
                <div v-if="errorMessage" class="error-tip">
                    {{ errorMessage }}
                </div>

                <div style="margin: 16px;">
                    <van-button
                        size="large"
                        type="primary"
                        native-type="submit"
                        :loading="isSubmitting"
                    >
                        注册并登录
                    </van-button>
                    <div class="to-login">
                        已有账号？<span class="link" @click="goLogin">去登录</span>
                    </div>
                </div>
            </van-form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from '../utils/toast'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const avatar = ref('') // 保存头像 base64
const fileList = ref([])
const errorMessage = ref('')
const isSubmitting = ref(false)

const onBack = () => {
    router.back()
}

const goLogin = () => {
    router.push('/login')
}

// 上传完成后，获取 base64 作为头像保存
const afterRead = (file) => {
    // van-uploader 单图时 file 可能是对象也可能是数组
    const fileItem = Array.isArray(file) ? file[0] : file
    const content = fileItem?.content
    if (content) {
        avatar.value = content
    } else if (fileItem?.file instanceof File) {
        // 兜底：手动转 base64
        const reader = new FileReader()
        reader.onload = (e) => {
            avatar.value = e.target?.result
            // 回写 fileList 的 content，方便预览
            if (fileList.value && fileList.value[0]) {
                fileList.value[0].content = avatar.value
                fileList.value[0].url = avatar.value
            }
        }
        reader.readAsDataURL(fileItem.file)
    }
}

const beforeDelete = () => {
    avatar.value = ''
    return true
}

const onSubmit = () => {
    errorMessage.value = ''

    // 校验两次密码是否一致
    if (password.value !== confirmPassword.value) {
        errorMessage.value = '两次输入的密码不一致'
        return
    }

    isSubmitting.value = true
    try {
        const result = userStore.register({
            username: username.value,
            password: password.value,
            avatar: avatar.value
        })

        if (!result.success) {
            errorMessage.value = result.message
            return
        }

        showToast(result.message)
        // 注册成功，自动跳转首页
        router.replace('/')
    } finally {
        isSubmitting.value = false
    }
}
</script>

<style scoped>
.page-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.page-header {
    flex-shrink: 0;
}

.page-content {
    padding: 16px 0;
}

.avatar-section {
    padding: 16px;
}

.avatar-label {
    font-size: 14px;
    color: #646566;
    margin-bottom: 12px;
}

.error-tip {
    margin: 12px 16px 0;
    padding: 10px 12px;
    background: #fef0f0;
    color: #ee0a24;
    border-radius: 6px;
    font-size: 13px;
}

.to-login {
    text-align: center;
    margin-top: 16px;
    font-size: 14px;
    color: #646566;
}

.link {
    color: #1989fa;
    margin-left: 4px;
}
</style>
