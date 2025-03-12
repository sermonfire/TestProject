<template>
    <div class="home-container">
        <!-- 内容包装器 -->
        <div class="content-wrapper" :class="{ 'chat-mode': isChat }">
            <!-- 轮播图区域 -->
            <div class="swiper-wrapper" :class="{ 'hidden': isInChat }">
                <Swiper></Swiper>
            </div>

            <!-- 主要对话区域 -->
            <AIChatBox :isFocus="isFocus" :isChat="isChat" @focus-change="handleFocusChange"
                @chat-state-change="handleChatStateChange" />
        </div>
    </div>
</template>

<script setup>
import Swiper from '@/components/Swiper/Swiper.vue';
import AIChatBox from '@/components/AIChatBox/AIChatBox.vue';
import { ref, computed } from 'vue';

/**
 * 聊天框是否聚焦
 * @type {import('vue').Ref<boolean>}
 */
const isFocus = ref(false);

/**
 * 是否处于对话状态
 * @type {import('vue').Ref<boolean>}
 */
const isChat = ref(false);

/**
 * 计算属性：是否应该隐藏轮播图
 * 当处于对话状态或聊天框聚焦时隐藏轮播图
 */
const isInChat = computed(() => {
    return isChat.value || isFocus.value;
});

/**
 * 处理聊天框聚焦状态变化
 * @param {boolean} focusState - 聚焦状态
 */
const handleFocusChange = (focusState) => {
    isFocus.value = focusState;
};

/**
 * 处理对话状态变化
 * @param {boolean} chatState - 对话状态
 */
const handleChatStateChange = (chatState) => {
    isChat.value = chatState;
    if (!chatState && isFocus.value) {
        isFocus.value = true;
    }
};
</script>

<style lang="scss" scoped>
.home-container {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #f5f7fa;
}

.content-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-self: center;
    flex: 1;
    margin: 0;
    width: 100%;
    background-color: #f5f7fa;
    min-height: calc(100vh - 96px);
    transition: all 0.3s ease-in-out;
    position: relative;

    @media screen and (max-width: 1400px) {
        max-width: 1000px;
    }

    @media screen and (max-width: 1200px) {
        max-width: 800px;
    }

    &.chat-mode {
        padding-bottom: 20px;
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