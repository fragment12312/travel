<template>
  <div class="page-container">
    <div class="page-header">
      <van-nav-bar
        title="历史记录"
        left-arrow
        @click-left="onBack"
        left-text="返回"
      />
    </div>
    <div class="page-content">
      <!-- 曾经使用的对话与查询记录 -->
      <div class="history-section">
        <div class="section-header">
          <span class="section-title">曾经使用的对话与查询</span>
          <van-button
            v-if="history.length"
            size="mini"
            plain
            type="danger"
            @click="onClear"
          >
            清空
          </van-button>
        </div>

        <van-empty v-if="!history.length" description="暂无历史记录" />

        <van-cell-group v-else inset>
          <van-swipe-cell v-for="item in history" :key="item.id">
            <van-cell :title="item.title" :label="item.time" @click="onOpen(item)">
              <template #icon>
                <van-tag
                  :type="item.type === 'chat' ? 'primary' : 'success'"
                  plain
                  class="type-tag"
                >
                  {{ item.type === 'chat' ? '对话' : '查询' }}
                </van-tag>
              </template>
            </van-cell>
            <template #right>
              <van-button
                square
                type="danger"
                text="删除"
                class="delete-btn"
                @click="onDelete(item.id)"
              />
            </template>
          </van-swipe-cell>
        </van-cell-group>
      </div>

      <!-- 进度条：根据历史记录数量展示 -->
      <div class="progress-section">
        <div class="progress-label">
          已记录 {{ history.length }} / {{ MAX_HISTORY }} 条
        </div>
        <van-progress :percentage="percentage" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { showConfirmDialog } from "vant";
import { showToast } from "../utils/toast";
import { useHistoryStore } from "../stores/history";

const router = useRouter();
const historyStore = useHistoryStore();

const history = computed(() => historyStore.history);

// 进度条满值对应的记录条数
const MAX_HISTORY = 20;

// 进度百分比：根据当前历史记录条数计算，封顶 100%
const percentage = computed(() => {
  if (!history.value.length) return 0;
  return Math.min(100, Math.round((history.value.length / MAX_HISTORY) * 100));
});

const onBack = () => {
  router.back();
};

const onDelete = (id) => {
  historyStore.removeHistory(id);
};

const onClear = () => {
  showConfirmDialog({
    title: "清空历史",
    message: "确定要清空全部历史记录吗？"
  })
    .then(() => {
      historyStore.clearHistory();
      showToast("已清空");
    })
    .catch(() => {});
};

const onOpen = (item) => {
  if (item.type === "query" && item.city) {
    router.push({
      path: "/detail",
      query: {
        city: item.city,
        budget: item.budget,
        days: item.days
      }
    });
  } else {
    router.push({ path: "/chat" });
  }
};
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
  padding: 16px;
}

.history-section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}

.type-tag {
  margin-right: 8px;
}

.delete-btn {
  height: 100%;
}

.progress-section {
  padding: 4px 0;
}

.progress-label {
  font-size: 13px;
  color: #969799;
  margin-bottom: 8px;
}
</style>
