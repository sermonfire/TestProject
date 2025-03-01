<template>
    <el-card class="trip-card" :body-style="{ padding: '0px' }">
        <!-- 简化状态标签 -->
        <div class="trip-status">
            <el-dropdown trigger="click" @command="handleStatusChange">
                <span class="status-text" :class="currentStatus.class">
                    <el-icon>
                        <component :is="currentStatus.icon" />
                    </el-icon>
                    {{ currentStatus.text }}
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item v-for="status in availableStatuses" :key="status.value"
                            :command="status.value" :disabled="isStatusDisabled(status.value)">
                            {{ status.text }}
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>

        <div class="card-info">
            <!-- 基本信息 -->
            <div class="basic-info">
                <h3 class="card-title">{{ trip.name }}</h3>
                <p class="card-date">
                    <el-icon>
                        <Calendar />
                    </el-icon>
                    {{ formattedDateRange }}
                    <span class="duration-text">{{ totalDays }}天</span>
                </p>
                <p class="card-description">{{ trip.description || '暂无描述' }}</p>
            </div>

            <!-- 元数据信息 -->
            <div class="card-meta">
                <div class="meta-detail" v-if="trip.totalBudget">
                    <el-icon>
                        <Money />
                    </el-icon>
                    <span>行程预算: ¥{{ trip.totalBudget }}</span>
                    <small>¥{{ dailyBudget }}/天</small>
                </div>
                <div class="meta-detail" v-if="trip.schedules?.length">
                    <el-icon>
                        <Timer />
                    </el-icon>
                    <span>{{ trip.schedules.length }}个日程安排</span>
                </div>
            </div>

            <!-- 时间信息 -->
            <div class="trip-times">
                <p class="time-item">创建时间: {{ formattedCreateTime }}</p>
                <p class="time-item">更新时间: {{ formattedUpdateTime }}</p>
            </div>
        </div>

        <!-- 操作按钮 -->
        <div class="trip-actions">
            <el-button-group>
                <el-button type="primary" @click="$emit('edit', trip)" :icon="Edit">编辑</el-button>
                <el-button type="success" @click="$emit('view-schedule', trip)" :icon="Calendar">日程安排</el-button>
                <el-button type="danger" @click="$emit('delete', trip)" :icon="Delete">删除</el-button>
            </el-button-group>
        </div>
    </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { Edit, Delete, Calendar, Timer, Money, VideoPlay, CircleCheck } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

// 状态配置
const TRIP_STATUS = {
    PLANNING: { value: 0, text: '计划中', class: 'planning', icon: Calendar },
    ONGOING: { value: 1, text: '进行中', class: 'ongoing', icon: VideoPlay },
    COMPLETED: { value: 2, text: '已完成', class: 'completed', icon: CircleCheck }
}

const props = defineProps({
    trip: {
        type: Object,
        required: true
    },
    hasOngoingTrip: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['status-change', 'edit', 'view-schedule', 'delete'])

// 状态相关的计算属性
const currentStatus = computed(() => {
    return Object.values(TRIP_STATUS).find(status => status.value === props.trip.status) || TRIP_STATUS.PLANNING
})

// 状态转换规则
const STATUS_TRANSITIONS = {
    [TRIP_STATUS.PLANNING.value]: [TRIP_STATUS.ONGOING, TRIP_STATUS.COMPLETED],
    [TRIP_STATUS.ONGOING.value]: [TRIP_STATUS.COMPLETED],
    [TRIP_STATUS.COMPLETED.value]: [TRIP_STATUS.PLANNING]
}

// 可用状态选项
const availableStatuses = computed(() => {
    // 获取当前状态
    const currentStatus = TRIP_STATUS[Object.keys(TRIP_STATUS).find(key =>
        TRIP_STATUS[key].value === props.trip.status
    )]
    // 获取下一个状态
    const nextStatuses = STATUS_TRANSITIONS[props.trip.status] || []

    return [currentStatus, ...nextStatuses]
})

// 状态禁用逻辑
const isStatusDisabled = (statusValue) => {
    // 当前状态不能选择自己
    if (statusValue === props.trip.status) return true

    // 如果要切换到进行中状态，且已有进行中的行程，则禁用
    if (statusValue === TRIP_STATUS.ONGOING.value && props.hasOngoingTrip) return true

    return false
}

// 状态变更处理
const handleStatusChange = (newStatus) => {
    if (newStatus !== props.trip.status) {
        emit('status-change', props.trip, newStatus)
    }
}

// 计算属性
const formattedDateRange = computed(() => {
    return `${dayjs(props.trip.startDate).format('YYYY-MM-DD')} 至 ${dayjs(props.trip.endDate).format('YYYY-MM-DD')}`
})

const totalDays = computed(() => {
    return dayjs(props.trip.endDate).diff(props.trip.startDate, 'day') + 1
})

const dailyBudget = computed(() => {
    if (!props.trip?.totalBudget) return 0
    return (props.trip.totalBudget / totalDays.value).toFixed(2)
})

const formattedCreateTime = computed(() => {
    return dayjs(props.trip.createTime).format('YYYY-MM-DD HH:mm:ss')
})

const formattedUpdateTime = computed(() => {
    return dayjs(props.trip.updateTime).format('YYYY-MM-DD HH:mm:ss')
})
</script>

<style lang="scss" scoped>
.trip-card {
    margin-bottom: 20px;
    position: relative;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
    }

    .trip-status {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 1;

        .status-text {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s;

            &.planning {
                background-color: var(--el-color-primary-light-9);
                color: var(--el-color-primary);
            }

            &.ongoing {
                background-color: var(--el-color-success-light-9);
                color: var(--el-color-success);
            }

            &.completed {
                background-color: var(--el-color-info-light-9);
                color: var(--el-color-info);
            }

            &:hover {
                opacity: 0.8;
            }
        }
    }

    .card-info {
        padding: 20px;

        .basic-info {
            .card-title {
                margin: 0 0 10px;
                font-size: 18px;
                color: var(--el-text-color-primary);
            }

            .card-date {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--el-text-color-regular);

                .duration-text {
                    color: var(--el-text-color-secondary);
                    font-size: 12px;
                }
            }

            .card-description {
                color: var(--el-text-color-regular);
                font-size: 14px;
                margin: 10px 0;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
        }

        .card-meta {
            display: flex;
            gap: 16px;
            margin: 12px 0;

            .meta-detail {
                display: flex;
                align-items: center;
                gap: 4px;
                color: var(--el-text-color-regular);
                font-size: 14px;
            }
        }

        .trip-times {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed var(--el-border-color-lighter);

            .time-item {
                color: var(--el-text-color-secondary);
                font-size: 12px;
                margin: 3px 0;
            }
        }
    }

    .trip-actions {
        padding: 10px 20px;
        border-top: 1px solid var(--el-border-color-light);
        display: flex;
        justify-content: flex-end;
    }
}
</style>