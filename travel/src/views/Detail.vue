<template>
  <div class="page-container">
    <div class="page-header">
      <van-nav-bar fixed left-text="返回" left-arrow @click-left="onBack" :title="fromData.city + '行程规划'" />
    </div>
    <div class="page-content">
      <div v-if="isLoading" class="loading-container" style="margin-top: 100px;">
        <van-loading size="48px" type="spinner">正在生成旅游规划...</van-loading>
      </div>
      <div v-else-if="errorMsg">
        <van-empty :description="errorMsg">
          <van-button type="primary" @click="fetchTripData">重试</van-button>
        </van-empty>
      </div>
      <template v-else-if="tripData && tripData.success != false">
        <div class="card overview-card">
          <div class="trip-header">
            <h2>{{ tripData.city }} · {{ tripData.days }}天行程</h2>
            <div class="trip-budget">预算：{{ tripData.totalBudget }}元</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { post } from '../utils/request.js'

const router = useRouter()
const route = useRoute()

const isLoading = ref(true)

const errorMsg = ref('')

const fromData = reactive({
  city: '',
  budget: null,
  days: null
})

const tripData = ref({})


const onBack = () => {
  router.back()
}

// 把底层报错翻译成用户能看懂的话
const friendlyError = (err) => {
  const msg = err?.message || ''
  if (msg.includes('timeout')) return '生成耗时过长已超时，请减少天数或稍后重试'
  if (err?.code === 'ERR_NETWORK') return '无法连接后端服务，请确认服务已启动'
  return msg || '请求失败，请重试'
}

const fetchTripData = async () => {
  isLoading.value = true
  errorMsg.value = ''

  try {
    const res = await post('recommend', {
      city: fromData.city,
      budget: Number(fromData.budget),
      days: Number(fromData.days)
    })
    console.log(res)
    if (res && res.success != false) {
      tripData.value = res
    } else {
      errorMsg.value = res.error || '生成失败，请稍后重试'
    }
  } catch (err) {
    errorMsg.value = friendlyError(err)
    console.error('请求失败：', errorMsg.value)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fromData.city = route.query.city || ''
  fromData.budget = route.query.budget ?? null
  fromData.days = route.query.days ?? null

  if (fromData.city && fromData.budget && fromData.days) {
    fetchTripData()
  } else {
    errorMsg.value = '缺少参数，请返回重新选择'
    isLoading.value = false
  }
})
</script>

<style scoped>
  .page-header{
    height: 46px;
  }
  .overview-card {
    margin-bottom: 16px;
  }

  .trip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .trip-header h2 {
    font-size: 20px;
    color: #323233;
    margin: 0;
  }

  .trip-budget {
    font-size: 16px;
    color: #ee0a24;
    font-weight: 600;
  }

  .trip-collapse {
    margin-bottom: 16px;
  }

  .day-schedule {
    padding: 8px 0;
  }

  .schedule-section {
    margin-bottom: 16px;
  }

  .schedule-section:last-child {
    margin-bottom: 0;
  }

  .section-label {
    font-size: 14px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-block;
    margin-bottom: 8px;
  }

  .section-label.morning {
    background: #fff7e6;
    color: #fa8c16;
  }

  .section-label.afternoon {
    background: #e6f7ff;
    color: #1890ff;
  }

  .section-label.evening {
    background: #f6ffed;
    color: #52c41a;
  }

  .budget-card,
  .tips-card,
  .warnings-card {
    margin-bottom: 16px;
  }

  .tips-list,
  .warnings-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .tips-list li,
  .warnings-list li {
    padding: 8px 0;
    color: #666;
    font-size: 14px;
    border-bottom: 1px solid #f5f5f5;
  }

  .tips-list li:last-child,
  .warnings-list li:last-child {
    border-bottom: none;
  }

  .detail-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 16px;
    background: #fff;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
    max-width: 750px;
    margin: 0 auto;
  }

  .error-card {
    text-align: center;
    padding: 40px 16px;
  }
</style>
