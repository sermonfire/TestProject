<template>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="80%" class="schedule-dialog" destroy-on-close>
        <div class="schedule-container" v-loading="loading">
            <!-- 左侧日期导航 -->
            <div class="date-nav">
                <div v-for="day in totalDays" :key="day" class="date-item" :class="{ active: currentDay === day }"
                    @click="handleDayChange(day)">
                    <span class="day-number">第{{ day }}天</span>
                    <span class="day-date">{{ formatDate(getDayDate(day)) }}</span>
                </div>
            </div>

            <!-- 右侧日程内容 -->
            <div class="schedule-content">
                <div class="schedule-header">
                    <h3>
                        第{{ currentDay }}天日程安排
                        <span class="total-cost" v-if="currentDayTotalCost > 0">
                            <el-icon>
                                <Money />
                            </el-icon>
                            总花费: ¥{{ currentDayTotalCost }}
                        </span>
                    </h3>
                    <el-button type="primary" @click="handleAddSchedule">
                        <el-icon>
                            <Plus />
                        </el-icon>添加日程
                    </el-button>
                </div>

                <!-- 时间轴展示日程 -->
                <el-timeline v-if="currentDaySchedules.length">
                    <el-timeline-item v-for="schedule in currentDaySchedules" :key="schedule.id"
                        :timestamp="formatTime(schedule.startTime) + ' - ' + formatTime(schedule.endTime)"
                        :type="getScheduleType(schedule.scheduleType).type">
                        <el-card class="schedule-card" :class="{ 'is-overnight': isOvernightSchedule(schedule) }">
                            <template #header>
                                <div class="schedule-card-header">
                                    <el-tag :type="getScheduleType(schedule.scheduleType).tagType">
                                        <el-icon>
                                            <component :is="getScheduleType(schedule.scheduleType).icon" />
                                        </el-icon>
                                        {{ getScheduleType(schedule.scheduleType).label }}
                                    </el-tag>
                                    <h4>{{ schedule.title }}</h4>
                                    <div class="schedule-actions">
                                        <el-button-group>
                                            <el-tooltip content="编辑日程" placement="top">
                                                <el-button type="primary" link @click="handleEditSchedule(schedule)">
                                                    <el-icon>
                                                        <Edit />
                                                    </el-icon>
                                                </el-button>
                                            </el-tooltip>
                                            <el-tooltip content="删除日程" placement="top">
                                                <el-button type="danger" link @click="handleDeleteSchedule(schedule)">
                                                    <el-icon>
                                                        <Delete />
                                                    </el-icon>
                                                </el-button>
                                            </el-tooltip>
                                        </el-button-group>
                                    </div>
                                </div>
                            </template>
                            <div class="schedule-card-content">
                                <div class="location" v-if="schedule.location">
                                    <el-icon>
                                        <Location />
                                    </el-icon>
                                    {{ schedule.location }}
                                </div>
                                <div class="description" v-if="schedule.description">{{ schedule.description }}</div>
                                <div class="estimated-cost" v-if="schedule.estimatedCost">
                                    <el-icon>
                                        <Money />
                                    </el-icon>
                                    预计花费: ¥{{ schedule.estimatedCost }}
                                </div>
                            </div>
                        </el-card>
                    </el-timeline-item>
                </el-timeline>

                <!-- 空状态 -->
                <el-empty v-else description="暂无日程安排">
                    <el-button type="primary" @click="handleAddSchedule">
                        立即添加
                    </el-button>
                </el-empty>
            </div>
        </div>

        <!-- 日程表单对话框 -->
        <TripScheduleForm v-model="scheduleFormVisible" :schedule="currentSchedule" :date="getDayDate(currentDay)"
            :day-index="currentDay" :loading="loading" @submit="handleScheduleSubmit"
            @update:loading="handleLoadingChange" />
    </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, Location, Money, Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import TripScheduleForm from './TripScheduleForm.vue'

/**
 * @typedef {Object} Trip
 * @property {number} id - 行程ID
 * @property {string} name - 行程名称
 * @property {string} startDate - 开始日期
 * @property {string} endDate - 结束日期
 * @property {string} [description] - 行程描述
 * @property {number} [totalBudget] - 总预算
 */

/**
 * @typedef {Object} Schedule
 * @property {number} id - 日程ID
 * @property {number} dayIndex - 第几天
 * @property {string} title - 日程标题
 * @property {string} startTime - 开始时间
 * @property {string} endTime - 结束时间
 * @property {string} [location] - 地点
 * @property {string} [description] - 描述
 * @property {number} [estimatedCost] - 预计花费
 * @property {number} scheduleType - 日程类型
 */

/**
 * @type {Object.<number, { label: string, type: string, tagType: string, icon: string }>}
 */
const SCHEDULE_TYPES = {
    1: {
        label: '景点游览',
        type: 'primary',
        tagType: 'primary',
        icon: 'Location'
    },
    2: {
        label: '用餐',
        type: 'success',
        tagType: 'success',
        icon: 'Food'
    },
    3: {
        label: '交通',
        type: 'warning',
        tagType: 'warning',
        icon: 'Van'
    },
    4: {
        label: '住宿',
        type: 'info',
        tagType: 'info',
        icon: 'House'
    },
    5: {
        label: '其他',
        type: 'default',
        tagType: 'info',
        icon: 'More'
    }
}

const props = defineProps({
    /** @type {boolean} */
    modelValue: {
        type: Boolean,
        required: true
    },
    /** @type {Trip} */
    trip: {
        type: Object,
        default: () => ({
            name: '',
            startDate: '',
            endDate: ''
        })
    },
    /** @type {Schedule[]} */
    schedules: {
        type: Array,
        default: () => []
    },
    /** @type {boolean} */
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue', 'add', 'edit', 'delete'])

// 对话框可见性
const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// 当前选中的天数
const currentDay = ref(1)

/**
 * 计算总天数
 * @returns {number} 行程总天数
 */
const totalDays = computed(() => {
    if (!props.trip?.startDate || !props.trip?.endDate) return 0
    return dayjs(props.trip.endDate).diff(props.trip.startDate, 'day') + 1
})

/**
 * 获取指定天数的日期
 * @param {number} day - 第几天
 * @returns {string} 格式化后的日期
 */
const getDayDate = (day) => {
    return dayjs(props.trip.startDate).add(day - 1, 'day').format('YYYY-MM-DD')// 获取指定天数的日期
}

/**
 * 格式化日期
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的日期
 */
const formatDate = (date) => {
    return dayjs(date).format('MM-DD')
}

/**
 * 格式化时间
 * @param {string} time - 时间字符串
 * @returns {string} 格式化后的时间
 */
const formatTime = (time) => {
    return dayjs(time).format('HH:mm')
}

/**
 * 获取当前日的日程安排
 * @returns {Schedule[]} 当前天的日程安排
 */
const currentDaySchedules = computed(() => {
    return props.schedules
        .filter(schedule => schedule.dayIndex === currentDay.value)//过滤出当前天的日程
        .sort((a, b) => dayjs(a.startTime).diff(dayjs(b.startTime)))//按照开始时间排序
})

/**
 * 获取日程类型信息
 * @param {number} type - 日程类型ID
 * @returns {Object} 日程类型配置信息
 */
const getScheduleType = (type) => {
    return SCHEDULE_TYPES[type] || SCHEDULE_TYPES[5]
}

/**
 * 切换日期
 * @param {number} day - 目标天数
 */
const handleDayChange = (day) => {
    currentDay.value = day
}

// 日程表单对话框
const scheduleFormVisible = ref(false)
const currentSchedule = ref(null)

/**
 * 打开添加日程对话框
 */
const handleAddSchedule = () => {
    currentSchedule.value = null
    scheduleFormVisible.value = true
}

/**
 * 编辑日程
 * @param {Schedule} schedule - 日程数据
 */
const handleEditSchedule = (schedule) => {
    currentSchedule.value = schedule
    scheduleFormVisible.value = true
}

/**
 * 处理日程表单提交
 * @param {Schedule} scheduleData - 日程数据
 */
const handleScheduleSubmit = (scheduleData) => {
    emit(scheduleData.id ? 'edit' : 'add', scheduleData)
}

/**
 * 删除日程
 * @param {Schedule} schedule - 日程数据
 */
const handleDeleteSchedule = async (schedule) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除"${schedule.title}"吗？此操作不可恢复。`,
            '删除确认',
            {
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                type: 'warning',
                draggable: true
            }
        )
        emit('delete', schedule)
        ElMessage.success({
            message: '日程已删除',
            type: 'success',
            duration: 2000
        })
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error({
                message: '删除失败，请重试',
                duration: 2000
            })
        }
    }
}

// 对话框标题
const dialogTitle = computed(() => {
    return props.trip?.name ? `${props.trip.name} 的日程安排` : '日程安排'
})

// 计算当天总花费
const currentDayTotalCost = computed(() => {
    return currentDaySchedules.value.reduce((total, schedule) => {
        return total + (schedule.estimatedCost || 0)
    }, 0)
})

/**
 * 判断是否为跨天日程（主要是住宿类型）
 * @param {Schedule} schedule - 日程数据
 * @returns {boolean} 是否跨天
 */
const isOvernightSchedule = (schedule) => {
    return schedule.scheduleType === 4 &&
        dayjs(schedule.endTime).format('YYYY-MM-DD') !== dayjs(schedule.startTime).format('YYYY-MM-DD')
}

/**
 * 处理loading状态变化
 * @param {boolean} value - loading状态
 */
const handleLoadingChange = (value) => {
    emit('update:loading', value)
}
</script>

<style lang="scss" scoped>
.schedule-dialog {
    :deep(.el-dialog) {
        margin: 0 !important;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 1200px !important; // 固定宽度
        height: 800px; // 固定高度
        max-width: 90vw; // 响应式最大宽度
        max-height: 90vh; // 响应式最大高度
        display: flex;
        flex-direction: column;
        border-radius: 8px;
        overflow: hidden;

        .el-dialog__header {
            padding: 20px 24px;
            margin: 0;
            border-bottom: 1px solid var(--el-border-color-lighter);
            background-color: var(--el-bg-color);
        }

        .el-dialog__body {
            flex: 1;
            overflow: hidden;
            padding: 0;
            display: flex;
            flex-direction: column;
        }
    }
}

.schedule-container {
    height: 80vh;
    display: flex;
    background-color: var(--el-bg-color);

    // 左侧日期导航样式
    .date-nav {
        width: 180px;
        border-right: 1px solid var(--el-border-color-light);
        overflow-y: auto;
        background-color: var(--el-bg-color-page);

        &::-webkit-scrollbar {
            width: 6px;
        }

        &::-webkit-scrollbar-thumb {
            border-radius: 3px;
            background-color: var(--el-border-color-darker);
        }

        &::-webkit-scrollbar-track {
            border-radius: 3px;
            background-color: var(--el-border-color-light);
        }

        .date-item {
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid var(--el-border-color-lighter);
            transition: all 0.3s ease;

            &:hover {
                background-color: var(--el-color-primary-light-9);
            }

            &.active {
                background-color: var(--el-color-primary-light-8);
                color: var(--el-color-primary);
            }

            .day-number {
                display: block;
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 4px;
            }

            .day-date {
                display: block;
                font-size: 14px;
                color: var(--el-text-color-secondary);
            }
        }
    }

    // 右侧日程内容样式
    .schedule-content {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 24px;

        &::-webkit-scrollbar {
            width: 6px;
        }

        &::-webkit-scrollbar-thumb {
            border-radius: 3px;
            background-color: var(--el-border-color-darker);
        }

        &::-webkit-scrollbar-track {
            border-radius: 3px;
            background-color: var(--el-border-color-light);
        }

        .schedule-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--el-border-color-lighter);
            position: sticky;
            top: 0;
            background-color: var(--el-bg-color);
            z-index: 1;

            h3 {
                margin: 0;
                color: var(--el-text-color-primary);
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 18px;

                .total-cost {
                    font-size: 14px;
                    color: var(--el-text-color-secondary);
                    font-weight: normal;
                    background-color: var(--el-color-primary-light-9);
                    padding: 4px 8px;
                    border-radius: 4px;
                }
            }
        }

        .schedule-card {
            margin: 8px 0;
            box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .05);
            border-radius: 8px;
            transition: all 0.3s ease;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px 0 rgba(0, 0, 0, .1);
            }

            &.is-overnight {
                border-left: 3px solid var(--el-color-info);
            }

            .schedule-card-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;

                h4 {
                    margin: 0;
                    flex: 1;
                    font-size: 16px;
                }

                .schedule-actions {
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
            }

            &:hover {
                .schedule-card-header .schedule-actions {
                    opacity: 1;
                }
            }

            .schedule-card-content {
                padding: 0 16px 16px;

                .location,
                .estimated-cost {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--el-text-color-secondary);
                    margin-top: 12px;
                    font-size: 14px;
                }

                .description {
                    margin: 16px 0;
                    color: var(--el-text-color-regular);
                    font-size: 14px;
                    line-height: 1.6;
                    white-space: pre-wrap;
                }
            }
        }
    }
}

// 时间轴节点样式
:deep(.el-timeline-item__node) {
    &.el-timeline-item__node--primary {
        background-color: var(--el-color-primary);
    }

    &.el-timeline-item__node--success {
        background-color: var(--el-color-success);
    }

    &.el-timeline-item__node--warning {
        background-color: var(--el-color-warning);
    }

    &.el-timeline-item__node--info {
        background-color: var(--el-color-info);
    }
}

// 响应式布局
@media screen and (max-width: 768px) {
    .schedule-dialog {
        :deep(.el-dialog) {
            width: 100% !important;
            height: 100vh;
            max-width: 100vw;
            max-height: 100vh;
            border-radius: 0;
        }
    }

    .schedule-container {
        flex-direction: column;

        .date-nav {
            width: 100%;
            height: auto;
            max-height: 160px;
            border-right: none;
            border-bottom: 1px solid var(--el-border-color-light);
        }

        .schedule-content {
            padding: 16px;
        }
    }
}
</style>