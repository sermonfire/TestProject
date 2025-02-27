<template>
    <div class="share-popover-wrapper" @mouseenter="handleShareHover" @mouseleave="handleShareLeave"
        ref="shareButtonRef">
        <div class="share-trigger" :class="{ active: isHoveringShare }">
            <slot name="trigger">
                <el-button circle class="share-icon-btn">
                    <el-icon>
                        <Share />
                    </el-icon>
                </el-button>
            </slot>
        </div>

        <div class="share-popup" :class="{ 'is-visible': isHoveringShare }" ref="sharePopupRef"
            @mouseenter="handlePopupMouseEnter" @mouseleave="handlePopupMouseLeave">
            <ShareCard :title="title" :share-url="shareUrl" @share-success="handleShareSuccess" />
        </div>
    </div>
</template>

<script setup>
import { ref, onUnmounted, watch } from 'vue';
import { Share } from '@element-plus/icons-vue';
import ShareCard from './ShareCard.vue';

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    shareUrl: {
        type: String,
        required: true
    },
    /**
     * 外部控制悬浮状态
     */
    isHovered: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['share-success']);

const isHoveringShare = ref(false);
const isMouseInShareArea = ref(false);
const shareButtonRef = ref(null);
const sharePopupRef = ref(null);

let hideTimer = null;
let showTimer = null;

const clearTimers = () => {
    if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }
    if (showTimer) {
        clearTimeout(showTimer);
        showTimer = null;
    }
};

// 监听外部悬浮状态
watch(() => props.isHovered, (newVal) => {
    if (newVal) {
        handleShareHover();
    } else {
        handleShareLeave();
    }
});

const handleShareHover = () => {
    isMouseInShareArea.value = true;
    clearTimers();
    showTimer = setTimeout(() => {
        isHoveringShare.value = true;
    }, 100);
};

const handleShareLeave = () => {
    isMouseInShareArea.value = false;
    clearTimers();
    hideTimer = setTimeout(() => {
        if (!isMouseInShareArea.value) {
            isHoveringShare.value = false;
        }
    }, 200);
};

const handlePopupMouseEnter = () => {
    isMouseInShareArea.value = true;
    clearTimers();
};

const handlePopupMouseLeave = () => {
    isMouseInShareArea.value = false;
    handleShareLeave();
};

const handleShareSuccess = (shareData, platform) => {
    emit('share-success', shareData, platform);
};

onUnmounted(() => {
    clearTimers();
});
</script>

<style lang="scss" scoped>
.share-popover-wrapper {
    position: relative;
    display: inline-block;

    .share-trigger {
        display: inline-block;
        transition: transform 0.3s ease;

        &.active {
            transform: scale(1.3);
        }
    }

    .share-icon-btn {
        padding: 8px;
        font-size: 16px;
        color: var(--el-color-primary);
        transition: all 0.3s ease;

        &:hover {
            background-color: var(--el-color-primary-light-9);
        }
    }

    .share-popup {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        z-index: 10;
        min-width: 240px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        width: 300px;
        padding: 10px 0;

        &.is-visible {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
            pointer-events: auto;
        }

        &::after {
            content: '';
            position: absolute;
            top: -8px;
            left: 0;
            right: 0;
            height: 8px;
            background: transparent;
        }

        &::before {
            content: '';
            position: absolute;
            top: -4px;
            right: 12px;
            width: 8px;
            height: 8px;
            background: white;
            transform: rotate(45deg);
            box-shadow: -2px -2px 5px rgba(0, 0, 0, 0.05);
        }
    }
}
</style>