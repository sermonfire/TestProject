<template>
    <el-card class="trip-card" :body-style="{ padding: '0px' }">
        <!-- 状态标签 -->
        <TripStatus :status="trip.status" :has-ongoing-trip="hasOngoingTrip" @status-change="handleStatusChange" />

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
import { Edit, Delete, Calendar, Timer, Money } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import TripStatus from './TripStatus.vue'

/**
 * @typedef {Object} Trip
 * @property {number} id - 行程ID
 * @property {string} name - 行程名称
 * @property {string} description - 行程描述
 * @property {string} startDate - 开始日期
 * @property {string} endDate - 结束日期
 * @property {number} totalBudget - 总预算
 * @property {Array} schedules - 日程安排
 * @property {string} createTime - 创建时间
 * @property {string} updateTime - 更新时间
 * @property {number} status - 行程状态
 */

const props = defineProps({
    /** @type {Trip} */
    trip: {
        type: Object,
        required: true
    },
    /** @type {boolean} - 是否有进行中的行程 */
    hasOngoingTrip: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['status-change', 'edit', 'view-schedule', 'delete'])

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

// 方法
const handleStatusChange = (status) => {
    emit('status-change', props.trip, status)
}
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