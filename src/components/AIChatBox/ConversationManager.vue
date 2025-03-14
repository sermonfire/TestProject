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

        <!-- 新建对话按钮 -->
        <div class="new-conversation" v-if="!isCollapsed">
            <el-button type="primary" @click="createNewConversation">
                <el-icon>
                    <Plus />
                </el-icon>
                新建对话
            </el-button>
        </div>
        <div v-else class="new-conversation-icon" @click="createNewConversation">
            <el-icon>
                <Plus />
            </el-icon>
        </div>

        <!-- 对话列表 -->
        <div class="conversation-list">
            <div v-for="conversation in conversations" :key="conversation.conversationId" class="conversation-item"
                :class="{
                    'active': activeKey === conversation.conversationId,
                    'disabled': conversation.disabled
                }" @click="handleItemClick(conversation)" :title="conversation.title">
                <div class="conversation-content">
                    <el-icon class="item-icon">
                        <ChatLineRound />
                    </el-icon>
                    <span :class="['label', { 'hide': isCollapsed, 'fade-in': isExpanding }]">
                        {{ conversation.title || '新对话' }}
                    </span>
                    <!-- 删除按钮 -->
                    <el-icon v-if="!isCollapsed && activeKey === conversation.conversationId" class="delete-icon"
                        @click.stop="deleteConversation(conversation)">
                        <Delete />
                    </el-icon>
                </div>
            </div>
        </div>

        <!-- 无数据提示 -->
        <el-empty v-if="conversations.length === 0" :description="isCollapsed ? '' : '暂无对话'" :image-size="40" />
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ChatLineRound, ArrowRight, Plus, Delete } from '@element-plus/icons-vue'
import { getChatHistory } from '@/api/AIchatAPI'
import { ElMessage, ElMessageBox } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'

/**
 * @typedef {Object} Conversation
 * @property {string} conversationId - 对话ID
 * @property {string} title - 对话标题
 * @property {string} [content] - 最后一条消息内容
 * @property {Date} createTime - 创建时间
 * @property {boolean} [disabled] - 是否禁用
 */

const props = defineProps({
    /**
     * 当前激活的对话ID
     */
    activeKey: {
        type: String,
        required: true
    },
    /**
     * 是否显示
     */
    visible: {
        type: Boolean,
        default: true
    }
})

const isAcceptedHistory = ref(false)

const emit = defineEmits(['change', 'collapse-change', 'create', 'conversationHistoryList', 'chat-state-change', 'acceptedHistory'])

// 对话列表数据
const conversations = ref([])
// 折叠状态
const isCollapsed = ref(false)
// 展开状态
const isExpanding = ref(false)

/**
 * 解析对话内容
 * @param {string} contentStr - JSON字符串格式的对话内容
 * @returns {string} 返回处理后的对话标题
 */
const parseContent = (contentStr) => {
    try {
        const messages = JSON.parse(contentStr)
        // 找到第一条用户消息作为标题
        const userMessage = messages.find(msg => msg.role === 'user')
        if (userMessage) {
            // 截取用户消息的前20个字符作为标题
            return userMessage.content.length > 20
                ? userMessage.content.slice(0, 20) + '...'
                : userMessage.content
        }
        return '新对话'
    } catch (error) {
        console.warn('解析对话内容失败:', error)
        return '新对话'
    }
}

/**
 * 获取对话历史
 */
const fetchConversations = async () => {
    try {
        const response = await getChatHistory()

        if (response.code === 0 && Array.isArray(response.data)) {
            isAcceptedHistory.value = true
            emit('acceptedHistory', isAcceptedHistory.value)
            conversations.value = response.data.map(item => ({
                conversationId: item.conversationId,
                title: parseContent(item.content),
                content: item.content,
                createTime: new Date(item.createTime),
                messageId: item.messageId,
                model: item.model,
                userId: item.userId,
                disabled: false
            })).sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
            emit('conversationHistoryList', conversations.value)
            if (conversations.value.length > 0) {
                emit('change', conversations.value[0].conversationId)
                if (conversations.value[0].content) {
                    emit('chat-state-change', true)
                }
            }
        } else {
            conversations.value = []
            if (response.code !== 0) {
                ElMessage.error(response.message || '获取对话历史失败')
            }
        }
    } catch (error) {
        ElMessage.error('获取对话历史失败')
        console.error('获取对话历史失败:', error)
        conversations.value = []
    }
}

/**
 * 创建新对话
 */
const createNewConversation = () => {
    const newConversation = {
        conversationId: uuidv4(),
        title: '新对话',
        createTime: new Date(),
        disabled: false
    }
    conversations.value.unshift(newConversation)
    emit('create', newConversation.conversationId)
    emit('change', newConversation.conversationId)
}

/**
 * 删除对话
 */
const deleteConversation = async (conversation) => {
    try {
        await ElMessageBox.confirm('确定要删除这个对话吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })

        const index = conversations.value.findIndex(item => item.conversationId === conversation.conversationId)
        if (index > -1) {
            conversations.value.splice(index, 1)
            // 如果删除的是当前对话，则切换到第一个对话
            if (conversation.conversationId === props.activeKey && conversations.value.length > 0) {
                emit('change', conversations.value[0].conversationId)
            }
        }
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除对话失败')
            console.error('删除对话失败:', error)
        }
    }
}

/**
 * 处理对话项点击
 */
const handleItemClick = (conversation) => {
    if (conversation.disabled || conversation.conversationId === props.activeKey) return
    emit('change', conversation.conversationId)

    // 新增：如果有历史内容则触发聊天状态
    if (conversation.content) {
        emit('chat-state-change', true)
    }
}

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

// 监听visible变化
watch(() => props.visible, (newVisible) => {
    if (newVisible) {
        isCollapsed.value = false
    }
})

// 组件挂载时获取对话历史
onMounted(() => {
    fetchConversations()
})
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

/* 添加新样式 */
.new-conversation {
    padding: 12px;
    border-bottom: 1px solid var(--el-border-color-light);

    .el-button {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
}

.new-conversation-icon {
    display: flex;
    justify-content: center;
    padding: 12px 0;
    cursor: pointer;
    color: var(--el-color-primary);
    border-bottom: 1px solid var(--el-border-color-light);

    &:hover {
        background-color: var(--el-color-primary-light-9);
    }
}

.delete-icon {
    position: absolute;
    right: 8px;
    color: var(--el-color-danger);
    font-size: 16px;
    opacity: 0;
    transition: opacity 0.3s ease;
    cursor: pointer;

    &:hover {
        transform: scale(1.1);
    }
}

.conversation-item:hover .delete-icon {
    opacity: 1;
}

.el-empty {
    padding: 20px;
    color: var(--el-text-color-secondary);
}
</style>