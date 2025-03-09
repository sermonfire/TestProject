<script setup>
import { Welcome, Sender } from 'ant-design-x-vue';
import { Flex, Space, Typography, Spin, message, theme } from 'ant-design-vue';
import { h, ref, watch, onMounted, onUnmounted, computed } from 'vue';
import ConversationManager from './ConversationManager.vue';

const messageText = ref('');
const loading = ref(false);
const senderRef = ref(null);
const activeConversationKey = ref('conversation1');

/**
 * 聊天框组件
 * @component AIChatBox
 * @note 关于Typography组件的警告：
 * 这个警告是由于ant-design-x-vue包内部使用了Typography组件并启用了ellipsis属性，
 * 但没有使用content属性而是使用了子元素。这是第三方库的内部实现问题，不会影响功能。
 */
const props = defineProps({
    /**
     * 是否聚焦
     * @type {Boolean}
     * @default false
     */
    isFocus: {
        type: Boolean,
        default: false
    },
    /**
     * 是否处于对话状态
     * @type {Boolean}
     * @default false
     */
    isChat: {
        type: Boolean,
        default: false
    }
});

/**
 * 定义事件
 */
const emit = defineEmits(['focus-change', 'chat-state-change']);

// 监听loading状态变化
watch(loading, () => {
    if (loading.value) {
        messageText.value = '';
        emit('chat-state-change', true);

        const timer = setTimeout(() => {
            loading.value = false;
            message.success('消息发送成功!');
            clearTimeout(timer);
        }, 2000);
    }
});

/**
 * 处理提交消息
 */
const handleSubmit = () => {
    loading.value = true;
    message.info('发送消息!');
};

/**
 * 处理取消发送
 */
const handleCancel = () => {
    loading.value = false;
    message.error('取消发送!');
};

/**
 * 处理聊天框聚焦
 */
const handleFocus = () => {
    emit('focus-change', true);
};

/**
 * 处理点击外部区域
 * @param {MouseEvent} event - 鼠标事件
 */
const handleClickOutside = (event) => {
    const senderElement = senderRef.value?.$el || senderRef.value;
    const isClickInSender = senderElement && senderElement.contains(event.target);
    const isClickInConversationManager = event.target.closest('.conversation-manager');

    if (!isClickInSender && !isClickInConversationManager && props.isFocus) {
        emit('focus-change', false);
    }
};

/**
 * 重置对话状态
 */
const resetChat = () => {
    emit('chat-state-change', false);
};

/**
 * 处理对话管理器折叠状态变化
 * @param {boolean} isCollapsed - 是否折叠
 */
const handleCollapseChange = (isCollapsed) => {
    // 可以在这里添加其他处理逻辑
    console.log('对话管理器折叠状态:', isCollapsed);
};

// 组件挂载时添加点击事件监听
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

// 组件卸载时移除点击事件监听
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

/**
 * 对话列表数据
 * @type {Array}
 */
const conversationItems = ref([
    {
        key: 'conversation1',
        label: '旅游规划对话',
    },
    {
        key: 'conversation2',
        label: '景点推荐对话',
    },
    {
        key: 'conversation3',
        label: '美食探索对话',
    },
    {
        key: 'conversation4',
        label: '历史遗迹探索',
    }
]);

/**
 * 处理对话切换
 * @param {String} key - 对话的key
 */
const handleConversationChange = (key) => {
    activeConversationKey.value = key;
    // 这里可以根据不同的对话加载不同的内容
    message.info(`切换到对话: ${key}`);
};

/**
 * 是否显示对话管理组件
 * @type {Boolean}
 */
const showConversations = computed(() => {
    return !props.isChat && props.isFocus;
});

</script>

<template>
    <div>
        <Flex justify="center" align="center" vertical class="chat-box" :class="{ 'chat-active': isChat }">
            <!-- 对话管理组件 -->
            <ConversationManager v-if="showConversations" :items="conversationItems" :active-key="activeConversationKey"
                :visible="showConversations" @change="handleConversationChange" @collapse-change="handleCollapseChange"
                class="conversation-manager" />

            <Welcome v-if="!isChat" variant="borderless"
                icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
                title="你好,我是你的旅游助手" description="我可以帮助你规划你的旅游路线，并提供相关的旅游信息。" />

            <div v-else class="chat-message-display">
                <!-- 对话内容显示区域 -->
                <div class="message-container">
                    <div class="conversation-title">{{conversationItems.find(item => item.key ===
                        activeConversationKey)?.label}}</div>
                </div>
                <div class="chat-controls">
                    <a @click="resetChat">重新开始对话</a>
                </div>
            </div>

            <Sender :class="{ 'sender-ref': isChat }" ref="senderRef" submitType="shiftEnter" :loading="loading"
                v-model:value="messageText" @submit="handleSubmit" @cancel="handleCancel" @click="handleFocus"
                style="width: 50%;margin-top: 20px;" :actions="(_, info) => {
                    const { SendButton, LoadingButton, ClearButton } = info.components;

                    return h(Space, { size: 'small' }, () => [
                        h(Typography.Text, {
                            type: 'secondary',
                            ellipsis: false,
                            content: 'Shift + Enter 发送'
                        }),
                        h(ClearButton),
                        loading
                            ? h(LoadingButton, { type: 'default', icon: h(Spin, { size: 'small' }), disabled: true })
                            : h(SendButton, { type: 'primary', disabled: false })
                    ]);
                }" />
        </Flex>
    </div>
</template>

<style scoped>
.chat-box {
    margin: 0 auto;
    transition: all 0.3s ease-in-out;
    min-height: 25vh;
}

.conversation-manager {
    position: absolute;
    top: 0px;
    right: 0px;
    z-index: 10;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(8px);
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chat-active {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: calc(100vh - 150px);
}

.chat-message-display {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px;
    overflow-y: auto;
    max-width: 900px;
    margin: 0 auto;
}

.message-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 20px;
    width: 100%;
}

.chat-controls {
    text-align: center;
}

.chat-controls a {
    color: #1890ff;
    cursor: pointer;
}

.chat-controls a:hover {
    text-decoration: underline;
}

.sender-ref {
    position: sticky;
    bottom: 20px;
    margin-top: 20px;
    width: 100% !important;
    max-width: 800px;
    z-index: 10;
}

.conversation-title {
    font-size: 18px;
    font-weight: bold;
    color: #1890ff;
    margin-bottom: 10px;
    width: 100%;
    text-align: center;
}

/* 覆盖ant-design-x-vue包中Typography组件的ellipsis样式 */
:deep(.ant-typography) {
    &.ant-typography-ellipsis-single-line {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}
</style>
