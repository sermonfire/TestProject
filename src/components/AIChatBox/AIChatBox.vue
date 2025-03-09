<script setup>
import { Welcome, Sender } from 'ant-design-x-vue';
import { Flex, Space, Typography, Spin, message } from 'ant-design-vue';
import { h, ref, watch, onMounted, onUnmounted } from 'vue';

const messageText = ref('');
const loading = ref(false);
const senderRef = ref(null);

/**
 * 聊天框组件
 * @component AIChatBox
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

    if (senderElement && !senderElement.contains(event.target) && props.isFocus) {
        emit('focus-change', false);
    }
};

/**
 * 重置对话状态
 */
const resetChat = () => {
    emit('chat-state-change', false);
};

// 组件挂载时添加点击事件监听
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

// 组件卸载时移除点击事件监听
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
    <div>
        <Flex justify="center" align="center" vertical class="chat-box">
            <Welcome v-if="!isChat" variant="borderless"
                icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
                title="你好,我是你的旅游助手" description="我可以帮助你规划你的旅游路线，并提供相关的旅游信息。" />

            <div v-else class="chat-message-display">
                <!-- 对话内容显示区域 -->
                <div class="chat-controls">
                    <a @click="resetChat">重新开始对话</a>
                </div>
            </div>

            <Sender class="sender-ref" ref="senderRef" submitType="shiftEnter" :loading="loading"
                v-model:value="messageText" @submit="handleSubmit" @cancel="handleCancel" @click="handleFocus"
                style="width: 50%;margin-top: 20px;" :actions="(_, info) => {
                    const { SendButton, LoadingButton, ClearButton } = info.components;

                    return h(Space, { size: 'small' }, () => [
                        h(Typography.Text, { type: 'secondary' }, () => 'Shift + Enter 发送'),
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
}

.chat-message-display {
    width: 100%;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.chat-controls {
    margin-top: 20px;
    text-align: center;
}

.chat-controls a {
    color: #1890ff;
    cursor: pointer;
}

.chat-controls a:hover {
    text-decoration: underline;
}
</style>
