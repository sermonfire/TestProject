<template>
    <div class="conversation-manager" :class="{ 'collapsed': isCollapsed, 'expanding': isExpanding }" @click.stop>
        <div class="conversation-header" @click="toggleCollapse">
            <div class="header-content">
                <span :class="['title', { 'hide': isCollapsed, 'fade-in': isExpanding }]">对话列表</span>
                <el-icon class="collapse-icon" :class="{ 'rotated': isCollapsed }">
                    <ArrowRight />
                </el-icon>
            </div>
        </div>
        <div class="conversation-list">
            <div v-for="item in items" :key="item.key" class="conversation-item" :class="{
                'active': activeKey === item.key,
                'disabled': item.disabled
            }" @click="handleItemClick(item)" :title="item.label">
                <div class="conversation-content">
                    <el-icon class="item-icon">
                        <ChatLineRound />
                    </el-icon>
                    <span :class="['label', { 'hide': isCollapsed, 'fade-in': isExpanding }]">{{ item.label }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ChatLineRound, ArrowRight } from '@element-plus/icons-vue'

/**
 * @typedef {Object} ConversationItem
 * @property {string} key - 对话的唯一标识
 * @property {string} label - 对话的显示名称
 * @property {boolean} [disabled] - 是否禁用
 */

const props = defineProps({
    /**
     * 对话列表数据
     * @type {ConversationItem[]}
     */
    items: {
        type: Array,
        required: true,
        default: () => []
    },
    /**
     * 当前激活的对话key
     * @type {string}
     */
    activeKey: {
        type: String,
        required: true
    },
    /**
     * 是否显示
     * @type {boolean}
     */
    visible: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits(['change', 'collapse-change'])

/**
 * 是否折叠
 * @type {import('vue').Ref<boolean>}
 */
const isCollapsed = ref(false)

/**
 * 是否正在展开
 * @type {import('vue').Ref<boolean>}
 */
const isExpanding = ref(false)

/**
 * 监听visible变化，当组件隐藏时自动展开
 */
watch(() => props.visible, (newVisible) => {
    if (newVisible) {
        isCollapsed.value = false
    }
})

/**
 * 切换折叠状态
 */
const toggleCollapse = () => {
    if (!isCollapsed.value) {
        isCollapsed.value = true
        isExpanding.value = false
    } else {
        isExpanding.value = true
        isCollapsed.value = false
        setTimeout(() => {
            isExpanding.value = false
        }, 300)
    }
    emit('collapse-change', isCollapsed.value)
}

/**
 * 处理对话项点击
 * @param {ConversationItem} item - 被点击的对话项
 */
const handleItemClick = (item) => {
    if (item.disabled || item.key === props.activeKey) return
    emit('change', item.key)
}
</script>

<style lang="scss" scoped>
.conversation-manager {
    min-height: 100%;
    width: 250px;
    /* 设置固定初始宽度 */
    background: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: var(--el-box-shadow-light);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    transform-origin: right center;
    will-change: width, transform;
    /* 优化性能 */

    &.collapsed {
        width: 48px;

        .conversation-list {
            padding: 8px 4px;
        }
    }

    &.expanding {
        /* 展开状态的特殊样式 */
        width: 250px;
    }
}

.conversation-header {
    padding: 12px 16px;
    background: var(--el-color-primary-light-9);
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid var(--el-border-color-light);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        background: var(--el-color-primary-light-8);
    }

    .header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.3s ease;
        position: relative;
        /* 添加相对定位 */
        height: 24px;
        /* 固定高度防止抖动 */
        padding-right: 24px;
        /* 为图标预留空间 */
    }

    .title {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-color-primary);
        transition: all 0.3s ease;
        opacity: 1;
        transform: translateX(0);
        white-space: nowrap;
        overflow: hidden;
        position: absolute;
        left: 0;
        top: 0;
        max-width: 100%;

        &.hide {
            opacity: 0;
            height: 0;
            overflow: hidden;
            pointer-events: none;
        }

        &.fade-in {
            animation: fadeIn 0.3s ease-in;
        }
    }

    .collapse-icon {
        font-size: 16px;
        color: var(--el-color-primary);
        transition: transform 0.3s ease;
        margin-left: 8px;
        flex-shrink: 0;
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);

        &.rotated {
            transform: translateY(-50%) rotate(180deg);
        }
    }
}

.collapsed .conversation-header {
    padding: 12px;
    text-align: center;

    .header-content {
        justify-content: center;
        padding-right: 0;
        /* 重置右侧内边距 */
    }

    .collapse-icon {
        margin: 0;
        position: static;
        transform: none;

        &.rotated {
            transform: rotate(180deg);
        }
    }
}

.conversation-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    overflow-y: auto;
    max-height: calc(100vh - 200px);

    &::-webkit-scrollbar {
        width: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: var(--el-border-color-lighter);
        border-radius: 2px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }
}

.conversation-item {
    padding: 12px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    user-select: none;
    position: relative;
    margin-bottom: 4px;
    /* 添加相对定位 */

    &:hover:not(.disabled) {
        background-color: var(--el-color-primary-light-9);
    }

    &.active {
        background-color: var(--el-color-primary-light-8);
        color: var(--el-color-primary);
        position: relative;

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background-color: var(--el-color-primary);
            border-radius: 0 2px 2px 0;
        }

        .item-icon {
            color: var(--el-color-primary);
        }
    }

    &.disabled {
        cursor: not-allowed;
        opacity: 0.6;
        color: var(--el-text-color-disabled);
    }

    .conversation-content {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 24px;
        position: relative;
        transition: all 0.3s ease;
        padding-right: 8px;
        /* 为内容预留空间 */

        .item-icon {
            font-size: 18px;
            color: var(--el-text-color-secondary);
            flex-shrink: 0;
            position: relative;
            z-index: 2;
            /* 确保图标始终在文本上方 */
            transition: all 0.3s ease;
        }

        .label {
            font-size: 14px;
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: all 0.3s ease;
            opacity: 1;
            transform: translateX(0);
            position: absolute;
            left: 26px;
            /* 图标宽度(18px) + 间距(8px) */
            right: 8px;
            /* 添加右侧边距 */

            &.hide {
                opacity: 0;
                height: 0;
                overflow: hidden;
                pointer-events: none;
                visibility: hidden;
                /* 完全隐藏，不占用空间 */
            }

            &.fade-in {
                animation: fadeIn 0.3s ease-in;
            }
        }
    }
}

.collapsed .conversation-item {
    padding: 12px 0;
    text-align: center;
    position: relative;
    margin-bottom: 8px;

    &.active {
        background-color: var(--el-color-primary-light-8);

        &::before {
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            border-radius: 0;
        }

        .item-icon {
            color: var(--el-color-primary);
            transform: translate(-50%, -50%) scale(1.1);
            /* 稍微放大图标 */
        }
    }

    .conversation-content {
        justify-content: center;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 24px;

        .item-icon {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            margin: 0;
            transition: all 0.3s ease;
            /* 确保过渡效果 */
        }
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}
</style>