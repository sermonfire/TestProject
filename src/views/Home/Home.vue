<template>
    <div class="home-container">
        <!-- 内容包装器 -->
        <div class="content-wrapper">
            <!-- 轮播图区域 -->
            <div class="swiper-wrapper" :class="{ 'hidden': hasActiveChat }">
                <Swiper></Swiper>
            </div>

            <!-- 主要对话区域 -->
            <div class="chat-container" :class="{ 'full-height': hasActiveChat }">
                <div class="chat-header">
                    <button class="clear-button" @click="showClearConfirm" v-if="hasUserMessages">
                        <i class="el-icon-delete"></i>
                        清除对话
                    </button>
                </div>

                <div class="chat-messages" ref="messagesContainer" @scroll="onScroll">
                    <div class="message-list">
                        <div v-for="(message, index) in reversedMessages" :key="index"
                            :class="['message', message.type, { 'fade-in': message.isNew }]" :id="`message-${index}`">
                            <div class="message-content">
                                <img v-if="message.type === 'assistant' || message.type === 'system'" class="avatar"
                                    :src="LOGO_AVATAR" alt="Assistant" />
                                <img v-else class="avatar" :src="userAvatar" alt="User" />
                                <div class="message-bubble">
                                    <p class="message-text">{{ message.content }}</p>
                                </div>
                            </div>
                            <div v-if="message.type === 'assistant'" class="message-actions">
                                <button class="action-button" @click="regenerateResponse">
                                    <i class="el-icon-refresh"></i>
                                    重新生成
                                </button>
                                <button class="action-button" @click="copyMessage(message.content)">
                                    <i class="el-icon-document-copy"></i>
                                    复制
                                </button>
                            </div>
                        </div>

                        <!-- 加载动画 -->
                        <div v-if="isLoading" class="loading-message fade-in">
                            <div class="loading-dots">
                                <div class="dot"></div>
                                <div class="dot"></div>
                                <div class="dot"></div>
                            </div>
                        </div>

                        <!-- 加载更多提示 -->
                        <div v-if="hasMoreMessages" class="load-more">
                            <span>加载更多消息...</span>
                        </div>
                    </div>
                </div>

                <!-- 输入区域 -->
                <div class="chat-input-container">
                    <textarea v-model="inputText" class="chat-input" :placeholder="placeholder" :disabled="isLoading"
                        @keydown.enter.prevent="handleEnterPress" @input="adjustTextareaHeight" @focus="handleFocus"
                        @blur="handleBlur" :style="{ height: textareaHeight + 'px' }" ref="textareaRef"></textarea>
                    <div class="button-container">
                        <button class="send-button" :disabled="!inputText.trim() || isLoading"
                            @click="sendMessageWithRetry" :class="{ 'button-loading': isLoading }">
                            <i
                                :class="[isLoading ? 'el-icon-loading' : 'el-icon-s-promotion', { 'icon-spin': isLoading }]"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 确认弹窗 -->
        <el-dialog v-model="showClearDialog" title="确认清除" width="30%">
            <span>确定要清除所有对话记录吗？此操作不可恢复。</span>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="closeClearConfirm">取消</el-button>
                    <el-button type="primary" @click="clearMessages">确定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { useUserStore } from '@/stores/userstore';
import { ElMessage } from 'element-plus';
import Swiper from '@/components/Swiper/Swiper.vue';
import { sendChatMessage } from '@/api/deepseek';

const userStore = useUserStore();
const LOGO_AVATAR = '/static/logo/favicon.ico';
const DEFAULT_AVATAR_LOGIN = '/static/default_avatar/avatar(login).png';

const inputText = ref('');
const isLoading = ref(false);
const messages = ref([]);
const messagesContainer = ref(null);
const placeholder = ref('描述你想要的旅行体验,例如:"我想去一个安静的海边小镇度假,预算5000左右..."');
const textareaRef = ref(null);
const textareaHeight = ref(40);
const hasMoreMessages = ref(false);
const isAutoScrollEnabled = ref(true);
const showClearDialog = ref(false);
const retryCount = ref(0);
const MAX_RETRIES = 3;

const hasActiveChat = computed(() => {
    return messages.value.length > 1 || (messages.value.length === 1 && !messages.value[0].isSystemMessage);
});

const reversedMessages = computed(() => {
    return [...messages.value].reverse();
});

const hasUserMessages = computed(() => {
    return messages.value.some(msg => msg.type === 'user' || msg.type === 'assistant');
});

const userAvatar = computed(() => {
    return userStore.userInfo?.userPic || DEFAULT_AVATAR_LOGIN;
});

let scrollTimer = null;
const onScroll = (e) => {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
        const element = e.target;
        isAutoScrollEnabled.value = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
    }, 200);
};

const sendMessage = async () => {
    const message = inputText.value.trim();
    if (!message) return;

    try {
        const userMessage = {
            type: 'user',
            content: message,
            isNew: true
        };

        messages.value.unshift(userMessage);
        inputText.value = '';
        adjustTextareaHeight();

        isLoading.value = true;
        await scrollToTop();

        const messageHistory = messages.value
            .slice(0, 10)
            .reverse()
            .map(msg => ({
                role: msg.type === 'user' ? 'user' : 'assistant',
                content: msg.content
            }));

        const response = await sendChatMessage(messageHistory);

        if (!response?.choices?.[0]?.message?.content) {
            throw new Error('无效的回复内容');
        }

        const assistantMessage = {
            type: 'assistant',
            content: response.choices[0].message.content,
            isNew: true
        };

        messages.value.unshift(assistantMessage);

    } catch (error) {
        console.error('发送消息失败:', error);
        const errorMessage = error.message || '发送失败，请重试';
        ElMessage.error(errorMessage);
        if (messages.value.length > 0) {
            messages.value.shift();
        }
    } finally {
        isLoading.value = false;
        await scrollToTop();
    }
};

const sendMessageWithRetry = async () => {
    while (retryCount.value < MAX_RETRIES) {
        try {
            await sendMessage();
            retryCount.value = 0;
            return;
        } catch (error) {
            retryCount.value++;
            if (retryCount.value >= MAX_RETRIES) {
                ElMessage.error('多次请求失败，请检查网络连接或稍后重试');
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount.value));
        }
    }
};

const regenerateResponse = async () => {
    if (isLoading.value) return;

    try {
        isLoading.value = true;

        const lastUserMessage = messages.value.find(msg => msg.type === 'user');
        if (!lastUserMessage) return;

        const messageHistory = [
            {
                role: 'user',
                content: lastUserMessage.content
            }
        ];

        const response = await sendChatMessage(messageHistory);

        const newResponse = {
            type: 'assistant',
            content: response.choices[0].message.content,
            isNew: true
        };

        const assistantIndex = messages.value.findIndex(msg => msg.type === 'assistant');
        if (assistantIndex !== -1) {
            messages.value.splice(assistantIndex, 1, newResponse);
        } else {
            messages.value.unshift(newResponse);
        }

    } catch (error) {
        console.error('Regenerate Error:', error);
        ElMessage.error('重新生成失败，请重试');
    } finally {
        isLoading.value = false;
        await scrollToTop();
    }
};

const copyMessage = (content) => {
    navigator.clipboard.writeText(content)
        .then(() => {
            ElMessage.success('复制成功');
        })
        .catch(() => {
            ElMessage.error('复制失败，请手动复制');
        });
};

const adjustTextareaHeight = () => {
    if (!textareaRef.value) return;

    const minHeight = 40;
    const maxHeight = 120;
    const lineHeight = 20;

    const lines = Math.ceil(inputText.value.length / 30);
    const newHeight = Math.min(Math.max(minHeight, lines * lineHeight + 20), maxHeight);
    textareaHeight.value = newHeight;
};

const handleEnterPress = (e) => {
    if (!e.shiftKey) {
        e.preventDefault();
        sendMessageWithRetry();
    }
};

const handleFocus = () => {
    setTimeout(scrollToTop, 300);
};

const handleBlur = () => {
    // 处理输入框失焦事件
};

const scrollToTop = async () => {
    if (!isAutoScrollEnabled.value) return;
    await nextTick();
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = 0;
    }
};

const showClearConfirm = () => {
    showClearDialog.value = true;
};

const closeClearConfirm = () => {
    showClearDialog.value = false;
};

const clearMessages = () => {
    messages.value = [];
    closeClearConfirm();

    ElMessage.success('对话已清除');

    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = 0;
    }
    isLoading.value = false;
    hasMoreMessages.value = false;

    try {
        localStorage.removeItem('chatMessages');
    } catch (e) {
        console.error('清除本地存储失败:', e);
    }
};

watch(messages, () => {
    nextTick(() => {
        const hasNewMessage = messages.value.some(msg => msg.isNew);
        if (hasNewMessage && messages.value.length > 1) {
            scrollToTop();
            messages.value.forEach(msg => {
                if (msg.isNew) {
                    msg.isNew = false;
                }
            });
        }
    });
}, { deep: true });

onMounted(() => {
    if (messages.value.length === 0) {
        messages.value.unshift({
            type: 'system',
            content: '👋 你好！我是你的专业旅行助手。我可以帮你：\n' +
                '• 推荐适合的旅行目的地\n' +
                '• 制定详细的行程计划\n' +
                '• 提供交通住宿建议\n' +
                '• 推荐当地特色美食\n' +
                '• 分享实用旅行贴士\n\n' +
                '请告诉我你的旅行偏好，比如预算、时间、喜好等，我会为你量身定制完美的旅行计划！',
            isNew: true,
            isSystemMessage: true
        });
    }
    scrollToTop();
    adjustTextareaHeight();

    // 尝试从本地存储恢复聊天记录
    try {
        const savedMessages = localStorage.getItem('chatMessages');
        if (savedMessages) {
            messages.value = JSON.parse(savedMessages);
        }
    } catch (e) {
        console.error('恢复聊天记录失败:', e);
    }
});

// 自动保存聊天记录
watch(messages, (newMessages) => {
    try {
        localStorage.setItem('chatMessages', JSON.stringify(newMessages));
    } catch (e) {
        console.error('保存聊天记录失败:', e);
    }
}, { deep: true });
</script>

<style lang="scss" scoped>
.home-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f5f7fa;
}

.content-wrapper {
    flex: 1;
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
    background-color: #f5f7fa;
    min-height: calc(100vh - 60px);

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

.chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    position: relative;
    padding: 20px;
    margin-bottom: 80px;
    background-color: transparent;
    z-index: 2;
    transition: all 0.3s ease-in-out;

    &.full-height {
        min-height: calc(100vh - 60px);
    }
}

.chat-header {
    padding: 10px;
    display: flex;
    justify-content: flex-end;

    .clear-button {
        display: flex;
        align-items: center;
        padding: 6px 12px;
        font-size: 14px;
        color: #666;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
            background-color: #e5e5e5;
            color: #333;
        }

        i {
            margin-right: 4px;
            font-size: 16px;
        }
    }
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    margin-bottom: 0;
    height: calc(100vh - 200px);
    scroll-behavior: smooth;
    background-color: transparent;
}

.message-list {
    display: flex;
    flex-direction: column-reverse;
    gap: 16px;
    min-height: 100%;
    background-color: transparent;
}

.message {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 80%;

    &.user {
        align-self: flex-end;

        .message-content {
            flex-direction: row-reverse;
        }

        .message-bubble {
            background: linear-gradient(135deg, #007AFF, #00C6FF);
            color: white;
            border-radius: 20px 20px 4px 20px;
            margin-left: 12px;
        }
    }

    &.assistant .message-bubble {
        background-color: white;
        border-radius: 20px 20px 20px 4px;
        margin-right: 12px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    &.system {
        align-self: center;
        background-color: rgba(240, 244, 249, 0.8);
        padding: 12px 20px;
        border-radius: 12px;
        max-width: 90%;

        .message-text {
            color: #4a5568;
            font-size: 14px;
        }
    }
}

.message-content {
    display: flex;
    align-items: flex-start;
    gap: 8px;
}

.avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
}

.message-bubble {
    padding: 12px 16px;
    font-size: 15px;
    line-height: 1.6;

    .message-text {
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
    }
}

.message-actions {
    display: flex;
    gap: 8px;
    padding-left: 44px;

    .action-button {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        font-size: 12px;
        color: #666;
        background-color: rgba(240, 244, 249, 0.8);
        border: none;
        border-radius: 16px;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
            background-color: rgba(226, 232, 240, 0.9);
        }

        i {
            font-size: 14px;
        }
    }
}

.loading-message {
    align-self: flex-start;
    padding-left: 44px;
}

.loading-dots {
    display: flex;
    gap: 4px;
    padding: 8px;

    .dot {
        width: 8px;
        height: 8px;
        background: linear-gradient(135deg, #007AFF, #00C6FF);
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out;

        &:nth-child(1) {
            animation-delay: -0.32s;
        }

        &:nth-child(2) {
            animation-delay: -0.16s;
        }
    }
}

.chat-input-container {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 760px;
    background: white;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    padding: 16px;
    z-index: 100;
    display: flex;
    gap: 12px;
    align-items: center;
}

.chat-input {
    flex: 1;
    min-height: 40px;
    max-height: 120px;
    padding: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.5;
    resize: none;
    transition: all 0.2s ease-in-out;
    font-family: inherit;

    &:focus {
        outline: none;
        border-color: #1a73e8;
        box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
    }
}

.send-button {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #1a73e8;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    padding: 0;
    margin: 0;
    color: white;

    &:hover:not(:disabled) {
        background-color: #1557b0;
        transform: scale(1.05);
    }

    &:disabled {
        background-color: #a0aec0;
        cursor: not-allowed;
    }

    i {
        font-size: 20px;
    }
}

.button-loading {
    opacity: 0.8;
    transform: scale(0.95);
}

.fade-in {
    animation: fadeIn 0.3s ease-in-out;
}

.icon-spin {
    animation: spin 1s linear infinite;
}

.load-more {
    text-align: center;
    padding: 10px 0;
    color: #666;
    font-size: 14px;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes bounce {

    0%,
    80%,
    100% {
        transform: scale(0);
    }

    40% {
        transform: scale(1);
    }
}

@keyframes gradientAnimation {
    0% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0% 50%;
    }
}

// 响应式适配
@media screen and (max-width: 768px) {
    .chat-container {
        padding: 10px;
    }

    .message {
        max-width: 90%;
    }

    .chat-input-container {
        padding: 10px;
    }
}
</style>