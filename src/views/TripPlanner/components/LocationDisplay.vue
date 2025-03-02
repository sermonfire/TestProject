<template>
    <div class="location-display-wrapper" @mouseenter="handleLocationEnter" @mouseleave="handleLocationLeave">
        <el-button class="location-trigger" circle :class="{ active: showLocation }" :icon="Location" />

        <Transition name="location-fade">
            <div v-show="showLocation" class="location-popup" @mouseenter="handlePopupEnter"
                @mouseleave="handlePopupLeave">
                <div class="location-popup-content">
                    <CurrentLocation />
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { Location } from '@element-plus/icons-vue'
import CurrentLocation from '@/components/LocationDisplay/CurrentLocation.vue'

const showLocation = ref(false)
let hideTimer = null
let isOverButton = ref(false)
let isOverPopup = ref(false)

const handleLocationEnter = () => {
    isOverButton.value = true
    showLocation.value = true
    clearHideTimer()
}

const handleLocationLeave = () => {
    isOverButton.value = false
    if (!isOverPopup.value) {
        startHideTimer()
    }
}

const handlePopupEnter = () => {
    isOverPopup.value = true
    clearHideTimer()
}

const handlePopupLeave = () => {
    isOverPopup.value = false
    if (!isOverButton.value) {
        startHideTimer()
    }
}

const startHideTimer = () => {
    clearHideTimer()
    hideTimer = setTimeout(() => {
        showLocation.value = false
    }, 300)
}

const clearHideTimer = () => {
    if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
    }
}

onBeforeUnmount(() => {
    clearHideTimer()
})
</script>

<style lang="scss" scoped>
.location-display-wrapper {
    position: fixed;
    right: 60px;
    bottom: 28px;
    z-index: 2000;
    display: flex;
    align-items: flex-end;

    .location-trigger {
        width: 48px;
        height: 48px;
        background: var(--el-color-primary);
        color: white;
        font-size: 20px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: none;

        &:hover,
        &.active {
            transform: scale(1.1);
            background: var(--el-color-primary-dark-2);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        :deep(.el-icon) {
            font-size: 20px;
        }
    }

    .location-popup {
        position: absolute;
        right: calc(100% + 16px);
        bottom: 0;
        width: 320px;
        background: var(--el-bg-color);
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        overflow: hidden;

        .location-popup-content {
            padding: 16px;
        }
    }
}

// 优化过渡动画
.location-fade-enter-active,
.location-fade-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.location-fade-enter-from,
.location-fade-leave-to {
    opacity: 0;
    transform: translateX(20px);
}

.location-fade-enter-to,
.location-fade-leave-from {
    opacity: 1;
    transform: translateX(0);
}
</style>