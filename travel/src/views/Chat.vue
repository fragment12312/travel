
<template>
  <div class="page-container chat-page">
    <div class="chat-header">
      <van-nav-bar
        title="AI旅游助手"
        left-arrow
        fixed
        @click-left="OnBack"
        left-text="返回"
      />
    </div>
    <div class="chat-container">
      <div v-if="messages.length === 0" class="chat-empty">
        <van-empty 
          description="开始和 AI 助手对话吧！"
        />
        <div class="quick-questions">
          <div class="quick-title">常见问题</div>
          <van-tag @click="handleClick(q)" v-for="q in quickQuestions" size="large" :key="q" mark class="quick-tag">
            {{ q }}
          </van-tag>
        </div>
      </div>
    </div>
    <div class="chat-input-area">
      <van-field
        v-model="inputMessage"
        placeholder="请输入问题"
        @keyup.enter="sendMessage"
      >
        <template #button>
          <van-button type="primary" size="small" @click="sendMessage" :disabled="!inputMessage.trim()">
            发送
          </van-button>
        </template>
      </van-field>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchStream } from '../utils/request'

const router = useRouter()

const quickQuestions = ref([
  '北京有哪些必去的景点？',
  '上海美食推荐',
  '成都三日游攻略',
  '如何选择旅行保险？'
])

const OnBack = () => {
  router.back()
}

const handleClick = (q) => {
  messages.value.push({
    role: 'user',
    content: q
  })
}

const inputMessage = ref('')

const sendMessage = () => {
  if (!inputMessage.value.trim()) return
  fetchStream(
    'chat',
    { message: inputMessage.value },
    (chunk) => {
      console.log('收到片段：', chunk)
    },
    () => {
      inputMessage.value = ''
    },
    (err) => {
      console.error('请求失败：', err)
    }
  )
}

const messages = ref([])
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-bottom: 50px;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 60px;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 60vh;
}

.quick-questions {
  margin-top: 32px;
  text-align: center;
}

.quick-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
}

.quick-tag {
  margin: 8px;
  cursor: pointer;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: #999;
  font-size: 14px;
}

.chat-input-area {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  background: #fff;
  padding: 8px 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  max-width: 750px;
  margin: 0 auto;
}

.chat-input-area :deep(.van-field) {
  background: #f7f8fa;
  /* height: 100px; */
  border-radius: 20px;
  padding: 8px 16px;
}
</style>