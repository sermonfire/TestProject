<template>
    <div class="conversation-manager" :class="{ 'collapsed': isCollapsed }" @click.stop>
        <div class="conversation-header" @click="toggleCollapse">
            <div class="header-content">
                <span class="title" :class="{ 'hidden': isCollapsed }">对话列表</span>
                <el-icon class="collapse-icon">
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
                    <el-icon>
                        <ChatLineRound />
                    </el-icon>
                    <span class="label" :class="{ 'hidden': isCollapsed }">{{ item.label }}</span>
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
    isCollapsed.value = !isCollapsed.value
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
    background: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: var(--el-box-shadow-light);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    transform-origin: right center;

    &.collapsed {
        width: 48px;

        .conversation-header {
            padding: 12px;

            .header-content {
                justify-content: center;
            }

            .collapse-icon {
                transform: rotate(180deg);
                margin: 0;
            }
        }

        .conversation-item {
            padding: 12px;

            .conversation-content {
                justify-content: center;
            }
        }
    }
}

.conversation-header {
    padding: 12px 16px;
    background: var(--el-color-primary-light-9);
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid var(--el-border-color-light);

    &:hover {
        background: var(--el-color-primary-light-8);
    }

    .header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.3s ease;
    }

    .title {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-color-primary);
        transition: all 0.3s ease;
        opacity: 1;
        transform: translateX(0);

        &.hidden {
            opacity: 0;
            transform: translateX(-10px);
            position: absolute;
        }
    }

    .collapse-icon {
        font-size: 16px;
        color: var(--el-color-primary);
        transition: all 0.3s ease;
        margin-left: 8px;
        flex-shrink: 0;
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

    &:hover:not(.disabled) {
        background-color: var(--el-color-primary-light-9);
    }

    &.active {
        background-color: var(--el-color-primary-light-8);
        color: var(--el-color-primary);

        .el-icon {
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

        .el-icon {
            font-size: 18px;
            color: var(--el-text-color-secondary);
            flex-shrink: 0;
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

            &.hidden {
                opacity: 0;
                transform: translateX(-10px);
                position: absolute;
            }
        }
    }
}
</style>