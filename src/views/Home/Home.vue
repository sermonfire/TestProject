<template>
    <div class="home-container">
        <!-- 内容包装器 -->
        <div class="content-wrapper">
            <!-- 轮播图区域 -->
            <div class="swiper-wrapper" :class="{ 'hidden': hasActiveChat }">
                <Swiper></Swiper>
            </div>

            <!-- 主要对话区域 -->
            <AIChatBox 
                :initialMessages="messages"
                @update:messages="updateMessages"
                @clear-messages="clearMessages"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Swiper from '@/components/Swiper/Swiper.vue';
import AIChatBox from '@/components/AIChatBox/AIChatBox.vue';

// 消息列表
const messages = ref([]);

// 是否有活跃对话
const hasActiveChat = computed(() => {
    return messages.value.length > 1 || (messages.value.length === 1 && !messages.value[0].isSystemMessage);
});

// 更新消息
const updateMessages = (newMessages) => {
    messages.value = newMessages;
    try {
        localStorage.setItem('chatMessages', JSON.stringify(newMessages));
    } catch (e) {
        console.error('保存聊天记录失败:', e);
    }
};

// 清除消息
const clearMessages = () => {
    messages.value = [];
    try {
        localStorage.removeItem('chatMessages');
    } catch (e) {
        console.error('清除本地存储失败:', e);
    }
};

// 组件挂载时尝试恢复聊天记录
onMounted(() => {
    try {
        const savedMessages = localStorage.getItem('chatMessages');
        if (savedMessages) {
            messages.value = JSON.parse(savedMessages);
        }
    } catch (e) {
        console.error('恢复聊天记录失败:', e);
    }
});
</script>

<style lang="scss" scoped>
.home-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f5f7fa;
}

.content-wrapper {
    flex: 1;
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
    background-color: #f5f7fa;
    min-height: calc(100vh - 60px);

    @media screen and (max-width: 1400px) {
        max-width: 1000px;
    }

    @media screen and (max-width: 1200px) {
        max-width: 800px;
    }
}

.swiper-wrapper {
    position: relative;
    overflow: visible !important;
    height: 400px;
    flex-shrink: 0;
    transition: all 0.3s ease-in-out;

    &.hidden {
        height: 0;
        opacity: 0;
        margin: 0;
        padding: 0;
        overflow: hidden !important;
    }
}
</style>