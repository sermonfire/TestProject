<template>
    <div class="chat-container" :class="{ 'full-height': hasActiveChat }">
        <div class="chat-header">
            <button class="clear-button" @click="showClearConfirm" v-if="hasUserMessages">
                <i class="el-icon-delete"></i>
                清除对话
            </button>
        </div>

        <div class="chat-messages" ref="messagesContainer" @scroll="onScroll">
            <div class="message-list">
                <div v-for="(message, index) in visibleMessages" :key="index"
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
                <button class="send-button" :disabled="!inputText.trim() || isLoading" @click="sendMessageWithRetry"
                    :class="{ 'button-loading': isLoading }">
                    <span class="send-icon" v-if="!isLoading">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M3 20.5L21 12L3 3.5L3 8.5L17 12L3 15.5L3 20.5z"/>
                        </svg>
                    </span>
                    <i v-else class="el-icon-loading"></i>
                </button>
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
import { ref, onMounted, nextTick, watch, computed, onBeforeUnmount } from 'vue';
import { useUserStore } from '@/stores/userstore';
import { ElMessage } from 'element-plus';
import { sendChatMessage } from '@/api/deepseek';
import logoAvatar from '@/assets/logo/favicon.ico';

const props = defineProps({
    initialMessages: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['update:messages', 'clear-messages']);

const userStore = useUserStore();
const LOGO_AVATAR = ref(logoAvatar);
const DEFAULT_AVATAR_LOGIN = '/static/default_avatar/avatar(login).png';

const inputText = ref('');
const isLoading = ref(false);
const messages = ref(props.initialMessages);
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

const visibleMessages = computed(() => {
    return reversedMessages.value.slice(0, 20);
});

let scrollThrottleTimer = null;
const onScroll = (e) => {
    if (scrollThrottleTimer) return;
    
    scrollThrottleTimer = setTimeout(() => {
        const element = e.target;
        isAutoScrollEnabled.value = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
        scrollThrottleTimer = null;
    }, 100);
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
        emit('update:messages', messages.value);
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

        const aiContent = response?.data?.choices?.[0]?.message?.content;
        if (!aiContent) {
            console.error('【Chat】无效的响应数据结构：', response);
            throw new Error('无效的回复内容');
        }

        const assistantMessage = {
            type: 'assistant',
            content: aiContent,
            isNew: true
        };

        messages.value.unshift(assistantMessage);
        emit('update:messages', messages.value);

    } catch (error) {
        console.error('【Chat】发送消息失败：', error);
        const errorMessage = error.message || '发送失败，请重试';
        ElMessage.error(errorMessage);
        if (messages.value.length > 0) {
            messages.value.shift();
            emit('update:messages', messages.value);
        }
    } finally {
        isLoading.value = false;
        await scrollToTop();
    }
};

const sendMessageWithRetry = async () => {
    if (isLoading.value) return;
    
    const message = inputText.value.trim();
    if (!message) return;
    
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
        try {
            await sendMessage();
            return;
        } catch (error) {
            retryCount++;
            console.error(`【Chat】第 ${retryCount} 次重试失败：`, error);
            
            // 如果不是超时错误，直接抛出
            if (!error.message?.includes('timeout') && !error.message?.includes('network error')) {
                ElMessage.error(error.message || '发送失败，请重试');
                break;
            }
            
            // 如果是最后一次重试
            if (retryCount === maxRetries) {
                console.log('【Chat】达到最大重试次数');
                ElMessage.error('网络连接不稳定，请稍后重试');
                break;
            }
            
            // 等待一段时间后重试
            const delay = 1000 * retryCount;
            console.log(`【Chat】等待 ${delay}ms 后重试`);
            await new Promise(resolve => setTimeout(resolve, delay));
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
            emit('update:messages', messages.value);
        } else {
            messages.value.unshift(newResponse);
            emit('update:messages', messages.value);
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

let resizeDebounceTimer = null;
const adjustTextareaHeight = () => {
    if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
    
    resizeDebounceTimer = setTimeout(() => {
        if (!textareaRef.value) return;
        
        const minHeight = 40;
        const maxHeight = 120;
        const lineHeight = 20;
        
        const lines = Math.ceil(inputText.value.length / 30);
        textareaHeight.value = Math.min(Math.max(minHeight, lines * lineHeight + 20), maxHeight);
    }, 100);
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
        if (animationFrame.value) cancelAnimationFrame(animationFrame.value);
        
        animationFrame.value = requestAnimationFrame(() => {
            messagesContainer.value.scrollTop = 0;
        });
    }
};

const showClearConfirm = () => {
    showClearDialog.value = true;
};

const closeClearConfirm = () => {
    showClearDialog.value = false;
};

const clearMessages = () => {
    messages.value = [{
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
    }];
    emit('clear-messages');
    closeClearConfirm();

    ElMessage.success('对话已清除');

    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = 0;
    }
    isLoading.value = false;
    hasMoreMessages.value = false;
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
        const welcomeMessage = {
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
        };
        messages.value.unshift(welcomeMessage);
        emit('update:messages', messages.value);
    }
    scrollToTop();
    adjustTextareaHeight();
});

const animationFrame = ref(null);
const messageTransition = computed(() => ({
    transform: `translateY(${isLoading.value ? '10px' : '0'})`,
    opacity: isLoading.value ? 0 : 1,
    transition: 'transform 0.3s ease, opacity 0.3s ease'
}));

onBeforeUnmount(() => {
    if (scrollThrottleTimer) clearTimeout(scrollThrottleTimer);
    if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
    if (animationFrame.value) cancelAnimationFrame(animationFrame.value);
});
</script>

<style lang="scss" scoped>
.chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    position: relative;
    padding: 20px;
    background-color: transparent;
    z-index: 2;
    transition: all 0.3s ease-in-out;

    &.full-height {
        min-height: calc(100vh - 96px);
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
    height: calc(100vh - 280px);
    min-height: 300px;
    max-height: calc(100vh - 280px);
    scroll-behavior: smooth;
    background-color: transparent;
    border-radius: 8px;
    position: relative;
    transform: translateZ(0);
    will-change: scroll-position;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
        
        &:hover {
            background: rgba(0, 0, 0, 0.3);
        }
    }
}

.message-list {
    display: flex;
    flex-direction: column-reverse;
    gap: 16px;
    min-height: min-content;
    background-color: transparent;
    padding-right: 10px;
}

.message {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 80%;
    will-change: transform, opacity;
    backface-visibility: hidden;
    transform: translateZ(0);

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

    &.assistant .message-bubble,
    &.system .message-bubble {
        background-color: white;
        border-radius: 20px 20px 20px 4px;
        margin-right: 12px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    &.system {
        align-self: flex-start;
        max-width: 90%;

        .message-content {
            display: flex;
            align-items: flex-start;
        }

        .message-text {
            color: #4a5568;
            font-size: 14px;
        }
    }

    &.fade-in {
        animation: fadeIn 0.3s ease-out forwards;
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
    width: 100%;
    margin-top: 6px;
    max-width: 760px;
    background: white;
    border-radius: 12px;
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

    &::-webkit-scrollbar {
        width: 0;
        display: none;
    }
    
    -ms-overflow-style: none;  /* IE 和 Edge */
    scrollbar-width: none;  /* Firefox */

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
    background: linear-gradient(135deg, #007AFF, #00C6FF);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
    margin: 0;
    color: white;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
    position: relative;
    overflow: hidden;

    .send-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        transform: rotate(-25deg) translateX(1px) translateY(-1px);
        transition: all 0.3s ease;

        svg {
            width: 100%;
            height: 100%;
        }
    }

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);

        .send-icon {
            transform: rotate(-25deg) translateX(2px) translateY(-1px);
        }
    }

    &:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0, 122, 255, 0.2);
    }

    &:disabled {
        background: linear-gradient(135deg, #a0aec0, #cbd5e0);
        cursor: not-allowed;
        box-shadow: none;
        opacity: 0.7;
    }

    i {
        font-size: 20px;
        position: relative;
        z-index: 1;
        transition: transform 0.3s ease;
    }
}

.button-loading {
    opacity: 0.8;
    
    i {
        animation: pulse 1.5s ease-in-out infinite;
        font-size: 20px;
    }
}

.fade-in {
    animation: fadeIn 0.3s ease-out forwards;
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

@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(0.95);
    }
    100% {
        transform: scale(1);
    }
}

@media screen and (max-width: 768px) {
    .chat-messages {
        height: calc(100vh - 240px);
        max-height: calc(100vh - 240px);
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