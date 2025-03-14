<script setup>
import { Welcome, Sender, Bubble } from 'ant-design-x-vue';
import { Flex, Space, Typography, Spin, message, theme, Button } from 'ant-design-vue';
import { h, ref, watch, onMounted, onUnmounted, computed } from 'vue';
import ConversationManager from './ConversationManager.vue';
import {
    CopyOutlined,
    SyncOutlined,
    UserOutlined,
    RobotOutlined,
} from '@ant-design/icons-vue';
import { sendStreamChat } from '@/api/AIchatAPI';
defineOptions({ name: 'AXBubbleHeaderAndFooterSetup' });

const { token } = theme.useToken();


const messageText = ref('');
const loading = ref(false);
const senderRef = ref(null);
const activeConversationKey = ref('');
/**
 * 对话列表数据
 * @type {Array}
 */
const conversationItems = ref([]);

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
    }
});


const newMessage = ref('');
// 添加一个临时存储AI回复的ref
const tempAssistantMessage = ref('');

// 构建AI助手的初始回复消息
const assistantMessage = {
    role: 'assistant',
    content: ''
};
const new_response = ref({});
/**
 * 处理提交消息
 */
const handleSubmit = async () => {
    if (!messageText.value.trim()) return;

    loading.value = true;
    newMessage.value = messageText.value;
    messageText.value = '';
    let content = '';

    // 构建用户消息对象
    const userMessage = {
        role: 'user',
        content: newMessage.value
    };

    // 找到当前对话
    const currentConversation = conversationItems.value.find(
        item => item.key === activeConversationKey.value
    );

    if (currentConversation) {
        try {
            // 更新当前对话的内容
            let currentContent = [];
            if (currentConversation.content) {
                currentContent = JSON.parse(currentConversation.content);
            }
            // 立即添加用户消息并更新对话内容
            currentContent.push(userMessage);
            currentConversation.content = JSON.stringify(currentContent);

            // 添加助手消息占位
            currentContent.push(assistantMessage);

            // 发送消息
            const response = await sendStreamChat({
                content: newMessage.value,
                conversationId: activeConversationKey.value
            });

            // 使用响应数据
            if (response) {
                tempAssistantMessage.value = ''; // 清空临时消息，准备接收流式响应
                // 按行分割数据
                const lines = response.split('\n');

                // 遍历每一行
                lines.forEach(line => {
                    // 检查是否以 "data:" 开头
                    if (line.startsWith('data:')) {
                        // 去掉 "data:" 前缀
                        const data = line.slice(5).trim();

                        // 忽略连接成功和保活消息
                        if (data === '连接成功...' || data === 'keep-alive') {
                            return;
                        }

                        // 处理实际的消息数据
                        if (data.startsWith('data:')) {
                            try {
                                const jsonStr = data.slice(5).trim();
                                const jsonData = JSON.parse(jsonStr);

                                // 提取 content 字段
                                if (jsonData.choices && jsonData.choices[0].delta.content) {
                                    content += jsonData.choices[0].delta.content;

                                    // 实时更新对话内容
                                    assistantMessage.content = content;//实时更新助手消息内容
                                    loading.value = false;

                                }
                            } catch (error) {
                                // 忽略解析错误，继续处理下一行
                                console.debug('Skipping non-JSON line:', data);
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            message.error('发送消息失败，请重试');
            tempAssistantMessage.value = ''; // 发生错误时清空临时消息
            loading.value = false;
        }
    }
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
    const isClickInMessageDisplay = event.target.closest('.chat-message-display');

    if (!isClickInSender && !isClickInConversationManager && !isClickInMessageDisplay && props.isFocus) {
        emit('focus-change', false);
        if (props.isChat) {
            emit('chat-state-change', false);
        }
        assistantMessage.content = '';
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

};

/**
 * 处理新建对话
 * @param {String} conversationId - 新建对话的ID
 */
const handleConversationCreate = (conversationId) => {
    activeConversationKey.value = conversationId;
    messageText.value = '';
    emit('chat-state-change', true);
    message.success('新建对话成功！');
};



/**
 * 处理对话切换
 * @param {String} key - 对话的key
 */
const handleConversationChange = (key) => {
    activeConversationKey.value = key;
    // 这里可以根据不同的对话加载不同的内容
    const currentConversation = conversationItems.value.find(item => item.key === key);
    message.info(`切换到对话: ${currentConversation?.label || '未知对话'}`);
};

/**
 * 处理对话历史列表
 * @param {Array} conversationHistoryList - 对话历史列表
 */
const handleConversationHistoryList = (conversationHistoryList) => {
    if (Array.isArray(conversationHistoryList)) {
        conversationItems.value = conversationHistoryList.map(item => ({
            key: item.conversationId,
            label: item.title || '新对话',
            content: item.content,
            createTime: item.createTime,
            messageId: item.messageId,
        }));
    }
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
 * 是否显示对话管理组件
 * @type {Boolean}
 */
const showConversations = computed(() => {
    return !props.isChat && props.isFocus;
});

// 在script部分添加计算属性
const hasHistoryMessages = computed(() => {
    const currentConversation = conversationItems.value.find(
        item => item.key === activeConversationKey.value
    );
    return currentConversation?.content?.length > 0;
});

const currentMessages = computed(() => {
    const currentConversation = conversationItems.value.find(
        item => item.key === activeConversationKey.value
    );
    if (!currentConversation?.content) return [];

    try {
        //去掉content中的system消息
        const content = JSON.parse(currentConversation.content);
        return content.filter(item => item.role !== 'system');
    } catch (error) {
        console.error('消息解析失败:', error);
        return [];
    }
});

// 角色映射配置
const roleConfig = {
    user: {
        avatar: UserOutlined,
        placement: 'end',
        color: '#fff',
        backgroundColor: '#87d068',
    },
    assistant: {
        avatar: RobotOutlined,
        placement: 'start',
        color: '#f56a00',
        backgroundColor: '#fde3cf',
    }
};

const isShow = computed(() => {
    return loading.value || assistantMessage.content !== '';
});

</script>

<template>
    <div>
        <Flex justify="center" align="center" vertical class="chat-box">
            <!-- 对话管理组件 -->
            <ConversationManager v-if="showConversations" :items="conversationItems" :active-key="activeConversationKey"
                :visible="showConversations" @change="handleConversationChange" @collapse-change="handleCollapseChange"
                @create="handleConversationCreate" @conversationHistoryList="handleConversationHistoryList"
                class="conversation-manager" />

            <Welcome v-if="(!hasHistoryMessages || !props.isFocus) && !props.isChat" variant="borderless"
                icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
                title="你好,我是你的旅游助手" description="我可以帮助你规划你的旅游路线，并提供相关的旅游信息。" style="margin-bottom:20px ;" />

            <div v-else-if="props.isFocus" class="chat-message-display">
                <div class="message-container">
                    <div class="conversation-title">
                        {{conversationItems.find(item => item.key === activeConversationKey)?.label}}
                    </div>

                    <!-- 动态消息展示 -->
                    <div class="message-list"
                        style="display: flex;flex-direction: column;justify-content: space-around;gap: 10px;">
                        <!-- 加载状态显示 -->
                        <Bubble v-if="isShow" :loading="loading" :content="assistantMessage.content" placement="start"
                            :avatar="{ icon: h(roleConfig['assistant'].avatar), style: roleConfig['assistant'] }"
                            :typing="{ step: 2, interval: 50, suffix: '💗' }" header="旅游助手">
                        </Bubble>

                        <Bubble v-for="(msg, index) in currentMessages.slice().reverse()" :key="index"
                            :content="msg.content" :placement="roleConfig[msg.role].placement || 'start'"
                            :avatar="{ icon: h(roleConfig[msg.role].avatar), style: roleConfig[msg.role] }"
                            :header="msg.role === 'assistant' ? '旅游助手' : '你'">
                            <template #footer v-if="msg.role === 'assistant'">
                                <Space :size="token.paddingXXS">
                                    <Button type="text" size="small">
                                        <template #icon>
                                            <CopyOutlined />
                                        </template>
                                    </Button>
                                    <Button type="text" size="small">
                                        <template #icon>
                                            <SyncOutlined />
                                        </template>
                                    </Button>
                                </Space>
                            </template>
                            <template #footer v-if="msg.role === 'user'">
                                <Space :size="token.paddingXXS">
                                    <Button type="text" size="small">
                                        <template #icon>
                                            <CopyOutlined />
                                        </template>
                                    </Button>
                                </Space>
                            </template>
                        </Bubble>
                    </div>
                </div>

                <div class="chat-controls">
                    <a @click="resetChat">重新开始对话</a>
                </div>
            </div>

            <div class="chat-input">
                <Sender :class="{ 'sender-ref': props.isChat }" ref="senderRef" submitType="shiftEnter"
                    :loading="loading" v-model:value="messageText" @submit="handleSubmit" @cancel="handleCancel"
                    @click="handleFocus" style="width: 100%;margin-bottom: 40px; margin-top: 40px;" :actions="(_, info) => {
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
            </div>
        </Flex>
    </div>
</template>

<style scoped>
.chat-box {
    margin: 0 auto;
    transition: all 0.3s ease-in-out;
    min-height: 25vh;
    max-width: 70vw;
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

.chat-message-display {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow-y: scroll;
    max-width: 55vw;
    max-height: 70vh;
    padding: 0 20px 40px 20px;
    background-color: #fff;
    border-radius: 10px;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

/* 为Webkit浏览器添加自定义滚动条样式 */
.chat-message-display::-webkit-scrollbar {
    width: 6px;
}

.chat-message-display::-webkit-scrollbar-track {
    background: transparent;
}

.chat-message-display::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
}

.chat-message-display::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.3);
}

.chat-input {
    display: flex;
    justify-content: center;
    width: 100%;
    max-width: 60vw;
    padding: 20px 40px;
    background-color: #fff;
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
    margin-bottom: 20px;
    width: 100% !important;
    max-width: 60vw;
    z-index: 10;
}

.conversation-title {
    position: sticky;
    width: 100%;
    top: 0px;
    font-size: 20px;
    font-weight: bold;
    color: #3b3b3b;
    margin-bottom: 10px;
    text-align: center;
    z-index: 100;
    background-color: rgba(255, 255, 255, 1);
}

.loading-message {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    color: var(--el-text-color-secondary);
}
</style>
