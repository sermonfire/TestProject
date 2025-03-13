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

        const timer = setTimeout(() => {
            loading.value = false;
            message.success('消息发送成功!');
            clearTimeout(timer);
        }, 2000);
    }
});


const newMessage = ref('');
/**
 * 处理提交消息
 */
const handleSubmit = async () => {
    loading.value = true;
    newMessage.value = messageText.value;
    messageText.value = '';

    //将用户消息添加到当前对话中用于渲染
    conversationItems

    // 发送消息
    const res = await sendStreamChat({
        content: newMessage.value,
        conversationId: activeConversationKey.value
    });


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
        if (props.isChat) {
            emit('chat-state-change', false);
        }
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
        avatar: { icon: h(UserOutlined) },
        placement: 'end',
        color: '#fff',
        backgroundColor: '#fde3cf',
    },
    assistant: {
        avatar: { icon: h(RobotOutlined) },
        placement: 'start',
        color: '#f56a00',
        backgroundColor: '#87d068',
    }
};

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
                        style="display: flex;flex-direction: column;justify-content: space-around;gap: 20px;margin-top: 15vh;">
                        <Bubble v-for="(msg, index) in currentMessages" :key="index" :content="msg.content"
                            :placement="roleConfig[msg.role]?.placement || 'start'"
                            :avatar="roleConfig[msg.role]?.avatar" :header="msg.role === 'assistant' ? '旅游助手' : '你'">
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

                        <!-- 这里用于展示新的对话消息 -->

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
    overflow-y: auto;
    max-width: 55vw;
    padding: 20px 40px;
    background-color: #fff;
    border-radius: 10px;
}

.chat-input {
    width: 100%;
    max-width: 55vw;
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
    max-width: 800px;
    z-index: 10;
}

.conversation-title {
    position: absolute;
    top: 25px;
    left: 0;
    font-size: 20px;
    font-weight: bold;
    color: #3b3b3b;
    margin-bottom: 10px;
    width: 100%;
    text-align: center;
}
</style>
