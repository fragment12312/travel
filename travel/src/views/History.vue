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
            <!-- TODO: 历史记录列表 -->
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const onBack = () => {
    router.back()
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
    padding: 16px;
}
</style>
