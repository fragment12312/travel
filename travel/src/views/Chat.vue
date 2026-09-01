
<template>
  <div class="page-container chat-page">
    <div class="chat-header">
      <van-nav-bar
        title="AI旅游助手"
        left-arrow
        @click-left="OnBack"
        left-text="返回"
      />
    </div>
    <div class="chat-container" ref="chatContainer">
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
      <div v-else class="message-list">
        <ChatBubble v-for="msg in messages" :key="msg.id" :message="msg" />
        <div class="streaming-indicator" v-if="streaming">
          <van-loading type="spinner" size="20px" />
          <span>正在思考中...</span>
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
import { ref,onMounted,nextTick } from 'vue'
import { useRouter,useRoute } from 'vue-router'
import { fetchStream } from '../utils/request'
import { showToast } from '../utils/toast'
import { useHistoryStore } from '../stores/history'
import ChatBubble from '../components/ChatBubble.vue'


const router = useRouter()
const route = useRoute()

const historyStore = useHistoryStore()

const chatContainer = ref(null)
const messages = ref([])
const inputMessage = ref('')
const streaming = ref(false)

//置底方法
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}


const quickQuestions = ref([
  '北京有哪些必去的景点？',
  '上海美食推荐',
  '成都三日游攻略',
  '如何选择旅行保险？'
])

const OnBack = () => {
  router.back()
}

//添加用户消息
const addUserMessage = (content) => {
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content,
    timestamp: new Date().toLocaleString()
  })
  // 记录到历史记录
  historyStore.addHistory({
    type: 'chat',
    title: content
  })
}

//点击快捷问题
const handleClick = (q) => {
  addUserMessage(q)
  fetchAIResponse(q)
}

const sendMessage = () => {
  const msg = inputMessage.value.trim()
  if (!msg) return
  addUserMessage(msg)
  inputMessage.value = ''
  fetchAIResponse(msg)
}

//请求 AI 回复（流式）
const fetchAIResponse = (userMsg) => {
  // 先放一条空的 AI 消息占位，后面流式填充 content
  messages.value.push({
    id: Date.now() + 1,
    role: 'ai',
    content: '',
    timestamp: new Date().toLocaleString()
  })

  const aiMsg = messages.value[messages.value.length - 1]
  streaming.value = true

  fetchStream(
    'chat',
    { message: userMsg },
    // onChunk：每个 SSE 事件（已在 request.js 里解析成对象）
    (event) => {
      if (event && event.type === 'chunk') {
        aiMsg.content += event.data || ''
      }
      if (event && event.type === 'complete' && !aiMsg.content && event.data && event.data.reply) {
        aiMsg.content = event.data.reply
      }
      scrollToBottom()
    },
    // onComplete：流正常结束
    () => {
      if (!aiMsg.content) {
        aiMsg.content = '（暂无回复）'
      }
      streaming.value = false
      scrollToBottom()
    },
    // onError
    (errMsg) => {
      aiMsg.content = `发生了错误：${errMsg}`
      showToast(`发生了错误：${errMsg}`)
      streaming.value = false
      scrollToBottom()
    }
  )
}


onMounted(() => {
  if (route.query.scene === 'detail' && route.query.city) {
    const question = `我想了解${route.query.city}的旅游信息`
    inputMessage.value = question
    addUserMessage(question)
    fetchAIResponse(question)
  }
  scrollToBottom()
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-bottom: 0px !important;
}

.chat-header {
  flex-shrink: 0;
}

.chat-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  /* 底部留白：给底部的 tabbar(50px) + 固定在它上面的输入区(~50px) 让位 */
  padding-bottom: 120px;
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