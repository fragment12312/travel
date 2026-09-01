<template>
  <div class="page-container">
    <div class="page-header">
      <van-nav-bar title="智能旅游助手" />
    </div>
    <div class="page-content">
      <van-notice-bar style="margin-bottom: 16px;" :scrollable="false" left-icon="info-o" text="景点介绍与行程规划系统" />
      <div class="card search-card">
        <div class="section-title">
          规划你的旅程
        </div>
        <van-field
        @click="showCityPicker = true"
        is-link readonly v-model="formData.city"
        label="目的地" placeholder="请选择城市" 
        style="margin-bottom: 12px;background: #f7f8fa;border-radius: 8px;"
        />
        <van-field
          v-model="formData.budget"
          type="number"
          label="预算（元）"
          placeholder="请输入预算金额"
          :border="false"
          style="margin-bottom: 12px;background: #f7f8fa;border-radius: 8px;"
        />
        <van-field
          v-model="formData.days"
          type="digit"
          label="天数"
          placeholder="请输入天数"
          :border="false"
          style="margin-bottom: 12px;background: #f7f8fa;border-radius: 8px;"
        />
        <van-button
        type="primary"
        round size="large"
        :loading="isLoading"
        style="margin-top: 12px;"
        @click="handleSubmit">
        开始规划
      </van-button>
      </div>
      <div class="card quick-actions">
        <div class="section-title">
          快捷入口
          <van-grid :gutter="12" :column-num="2">
            <van-grid-item @click="goPage('/chat')" icon="chat-o" text="AI对话" />
            <van-grid-item @click="goPage('/profile')" icon="user-o" text="我的" />
          </van-grid>
        </div>
      </div>
      <div class="card popular-destinations">
        <div class="section-title">
          热门目的地
        </div>
        <van-grid :gutter="8" :column-num="4">
            <van-grid-item @click="selectedCity(city)" v-for="(city,index) in popularCities" :key="index" :text="city">
                <div class="city-tag" :class="{active: formData.city === city}">
                  {{ city }}
                </div>
            </van-grid-item>
          </van-grid>
      </div>
    </div>
    <van-popup
    v-model:show="showCityPicker"
    round
    position="bottom"
    >
      <van-picker
        title="选择目的地"
        :columns = "cityColumns"
        @confirm="handleCityConfirm"
        @cancel="showCityPicker = false"
      />
    </van-popup>
  </div>
  
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { PickerConfirmEventParams } from 'vant'
import {useRouter} from 'vue-router';
import { showToast } from '../utils/toast'
import { useHistoryStore } from '../stores/history'

const router = useRouter()
const historyStore = useHistoryStore()

const formData = reactive({
  city: '',
  budget: '',
  days: ''
})

const showCityPicker = ref(false)

const allCities = 
[
  '北京', '上海', '广州', '深圳', '成都', '杭州', '西安', '重庆',
  '南京', '武汉', '苏州', '长沙', '天津', '郑州', '济南', '青岛',
  '大连', '沈阳', '哈尔滨', '长春', '福州', '厦门', '南昌', '合肥',
  '昆明', '贵阳', '南宁', '桂林', '海口', '三亚', '丽江', '大理',
  '西安', '兰州', '乌鲁木齐', '拉萨', '呼和浩特', '太原', '石家庄'
]

const popularCities = ['北京', '上海', '广州', '深圳', '成都', '杭州', '西安', '重庆'] // 取前8个城市作为热门目的地

const cityColumns = allCities.map(city => ({ text: city, value: city }))

const handleCityConfirm = ({ selectedOptions }: PickerConfirmEventParams) => {
  if (selectedOptions[0]?.value != null) {
    formData.city = String(selectedOptions[0].value)
  }
  showCityPicker.value = false
}

const isLoading = ref(false)

const handleSubmit = () => {
  
  // 判断目的地
  if(!formData.city){
    showToast('请选择目的地')
    return
  }
  // 判断预算金额
  if(!formData.budget || formData.budget < 100){
    showToast('预算不能低于100元')
    return
  }
  // 判断天数
  if(!formData.days || formData.days < 1 || formData.days > 30){
    showToast('天数必须在1-30天之间')
    return
  }

  isLoading.value = true

  // 记录到历史记录
  historyStore.addHistory({
    type: 'query',
    title: `${formData.city} · ${formData.days}天 · ${formData.budget}元`,
    city: formData.city,
    budget: formData.budget,
    days: formData.days
  })

  // 提交表单
  router.push({
    path: '/detail',
    query: {
      city: formData.city,
      budget: formData.budget,
      days: formData.days
    }
  })
}

const goPage = (path: string) => {
  router.push(path)
}

const selectedCity = (city: string) => {
  formData.city = city
  showCityPicker.value = false
}

</script>

<style scoped>
  .search-card {
    margin-bottom: 16px;
  }
  .city-tag{
    padding: 8px 12px;
    border-radius: 16px;
    font-size: 14px;
    color:#666;
    background: #f7f8fa;
    transition: all 0.3s;
  }
  .city-tag.active{
    background: #1989fa;
    color: #fff;
  }
</style>