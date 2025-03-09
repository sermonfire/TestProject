<template>
    <div class="home-container">
        <!-- 内容包装器 -->
        <div class="content-wrapper">
            <!-- 轮播图区域 -->
            <div class="swiper-wrapper" :class="{ 'hidden': isFocus }">
                <Swiper></Swiper>
            </div>

            <!-- 主要对话区域 -->
            <AIChatBox :isFocus="isFocus" @focus-change="handleFocusChange" />
        </div>
    </div>
</template>

<script setup>
import Swiper from '@/components/Swiper/Swiper.vue';
import AIChatBox from '@/components/AIChatBox/AIChatBox.vue';
import { ref, watch } from 'vue';

/**
 * 聊天框是否聚焦
 * @type {import('vue').Ref<boolean>}
 */
const isFocus = ref(false);

/**
 * 处理聊天框聚焦状态变化
 * @param {boolean} focusState - 聚焦状态
 */
const handleFocusChange = (focusState) => {
    isFocus.value = focusState;
    console.log('聊天框聚焦状态变更为:', isFocus.value);
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
    flex: 1;
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
    background-color: #f5f7fa;
    min-height: calc(100vh - 96px);

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