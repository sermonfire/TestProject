<template>
    <div class="trip-status" :class="getStatusClass(status)">
        <el-dropdown @command="handleStatusChange">
            <span class="status-text">
                {{ getStatusText(status) }}
                <el-icon class="el-icon--right">
                    <ArrowDown />
                </el-icon>
            </span>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item v-for="option in statusOptions" :key="option.command" :command="option.command"
                        :disabled="option.disabled">
                        {{ option.label }}
                        <el-tooltip v-if="option.command === 2 && option.disabled && status !== 2"
                            content="当前已有其他行程正在进行中" placement="right">
                            <el-icon class="status-info">
                                <InfoFilled />
                            </el-icon>
                        </el-tooltip>
                    </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowDown, InfoFilled } from '@element-plus/icons-vue'

/**
 * @typedef {Object} StatusOption
 * @property {number} command - 状态命令值
 * @property {string} label - 状态显示文本
 * @property {boolean} disabled - 是否禁用
 */

const props = defineProps({
    /** @type {number} 当前状态 */
    status: {
        type: Number,
        required: true,
        validator: (value) => [0, 1, 2].includes(value)
    },
    /** @type {boolean} 是否有进行中的行程 */
    hasOngoingTrip: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['status-change'])

/**
 * 获取状态文本
 * @param {number} status 状态值
 * @returns {string} 状态文本
 */
const getStatusText = (status) => {
    const statusMap = {
        0: '规划中',
        1: '已完成',
        2: '进行中'
    }
    return statusMap[status] || '未知状态'
}

/**
 * 获取状态样式类
 * @param {number} status 状态值
 * @returns {string} 样式类名
 */
const getStatusClass = (status) => {
    const statusClassMap = {
        0: 'planning',
        1: 'completed',
        2: 'progress'
    }
    return statusClassMap[status] || ''
}

/**
 * 状态选项列表
 * @type {Array<StatusOption>}
 */
const statusOptions = computed(() => {
    const options = [
        { command: 0, label: '规划中', disabled: false },
        { command: 1, label: '已完成', disabled: false },
        { command: 2, label: '进行中', disabled: false }
    ]

    if (props.status !== 2 && props.hasOngoingTrip) {
        options.find(opt => opt.command === 2).disabled = true
    }

    options.find(opt => opt.command === props.status).disabled = true

    return options
})

/**
 * 处理状态变更
 * @param {number} status 新状态值
 */
const handleStatusChange = (status) => {
    emit('status-change', status)
}
</script>

<style lang="scss" scoped>
.trip-status {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;

    &.planning {
        background-color: #e6f7ff;
        color: #1890ff;
    }

    &.completed {
        background-color: #f6ffed;
        color: #52c41a;
    }

    &.progress {
        background-color: #fff7e6;
        color: #fa8c16;
    }

    .status-text {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    :deep(.el-dropdown-menu__item) {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .status-info {
            margin-left: 8px;
            font-size: 14px;
            color: var(--el-color-info);
        }
    }
}
</style>