<template>
    <div v-if="modelValue" class="custom-dialog-overlay" @click.self="handleClose">
        <div class="custom-dialog" :class="{ 'is-fullscreen': isFullscreen }">
            <!-- 自定义对话框头部 -->
            <div class="custom-dialog-header">
                <h2 class="dialog-title">{{ dialogTitle }}</h2>
                <div class="dialog-actions">
                    <el-button class="fullscreen-btn" circle @click="toggleFullscreen">
                        <el-icon>
                            <component :is="fullscreenIcon" />
                        </el-icon>
                    </el-button>
                    <el-button class="close-btn" circle @click="handleClose">
                        <el-icon>
                            <Close />
                        </el-icon>
                    </el-button>
                </div>
            </div>

            <!-- 对话框内容区域 -->
            <div class="custom-dialog-body">
                <div class="schedule-container" v-loading="loading">
                    <!-- 左侧日期导航 -->
                    <div class="date-nav">
                        <div v-for="day in totalDays" :key="day" class="date-item"
                            :class="{ active: currentDay === day }" @click="handleDayChange(day)">
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
                            <el-button type="primary" @click="handleAddSchedule" class="add-schedule-button">
                                <el-icon>
                                    <Plus />
                                </el-icon>添加日程
                            </el-button>
                        </div>

                        <div class="schedule-selfcustom">
                            <div class="schedule-selfcustom-left">
                                <!-- 时间轴展示日程 -->
                                <el-timeline v-if="currentDaySchedules.length">
                                    <el-timeline-item v-for="schedule in currentDaySchedules" :key="schedule.id"
                                        :timestamp="formatTime(schedule.startTime) + ' - ' + formatTime(schedule.endTime)"
                                        :type="getScheduleType(schedule.scheduleType).type">
                                        <el-card class="schedule-card"
                                            :class="{ 'is-overnight': isOvernightSchedule(schedule) }">
                                            <template #header>
                                                <div class="schedule-card-header">
                                                    <el-tag :type="getScheduleType(schedule.scheduleType).tagType">
                                                        <el-icon>
                                                            <component
                                                                :is="getScheduleType(schedule.scheduleType).icon" />
                                                        </el-icon>
                                                        {{ getScheduleType(schedule.scheduleType).label }}
                                                    </el-tag>
                                                    <h4>{{ schedule.title }}</h4>
                                                    <div class="schedule-actions">
                                                        <el-button-group>
                                                            <el-tooltip content="编辑日程" placement="top">
                                                                <el-button type="primary" link
                                                                    @click="handleEditSchedule(schedule)">
                                                                    <el-icon>
                                                                        <Edit />
                                                                    </el-icon>
                                                                </el-button>
                                                            </el-tooltip>
                                                            <el-tooltip content="删除日程" placement="top">
                                                                <el-button type="danger" link
                                                                    @click="handleDeleteSchedule(schedule)">
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
                                                <div class="description" v-if="schedule.description">{{
                                                    schedule.description
                                                    }}
                                                </div>
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
                            <div class="schedule-selfcustom-right">
                                <!-- TODO: 右侧内容 -->
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>

        <!-- 日程表单对话框 -->
        <TripScheduleForm v-model="scheduleFormVisible" :schedule="currentSchedule" :date="getDayDate(currentDay)"
            :day-index="currentDay" :loading="loading" @submit="handleScheduleSubmit"
            @update:loading="handleLoadingChange" />
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, Location, Money, Plus, Close, FullScreen, Remove } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import TripScheduleForm from './TripScheduleForm.vue'

// 扩展 dayjs 以支持时区处理
dayjs.extend(utc)
dayjs.extend(timezone)

// 设置默认时区为本地时区
const localTimezone = dayjs.tz.guess()

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
 * @param {string} time - 时间字符串 (格式: HH:mm:ss)
 * @returns {string} 格式化后的时间 (格式: HH:mm)
 */
const formatTime = (time) => {
    if (!time) return ''
    // 直接处理 HH:mm:ss 格式
    return time.substring(0, 5) // 只取 HH:mm 部分
}

/**
 * 获取当前日的日程安排,并按时间排序
 */
const currentDaySchedules = computed(() => {
    return props.schedules
        .filter(schedule => schedule.dayIndex === currentDay.value)
        .sort((a, b) => {
            // 直接比较时间字符串
            return a.startTime.localeCompare(b.startTime)
        })
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
    // 根据是否有 id 判断是编辑还是新增
    const isEdit = !!scheduleData.id
    emit(isEdit ? 'edit' : 'add', scheduleData)
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
 * 判断是否为跨天日程
 */
const isOvernightSchedule = (schedule) => {
    if (!schedule || schedule.scheduleType !== 4) return false

    const startHour = parseInt(schedule.startTime.split(':')[0])
    const endHour = parseInt(schedule.endTime.split(':')[0])

    // 如果结束时间小于开始时间，说明跨天
    return endHour < startHour
}

/**
 * 处理loading状态变化
 * @param {boolean} value - loading状态
 */
const handleLoadingChange = (value) => {
    emit('update:loading', value)
}

// 添加全屏状态控制
const isFullscreen = ref(false)

// 切换全屏状态
const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
}

// 处理关闭
const handleClose = () => {
    emit('update:modelValue', false)
}

// 修改图标组件名称
const fullscreenIcon = computed(() => isFullscreen.value ? Remove : FullScreen)
</script>

<style lang="scss" scoped>
.custom-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: fade-in 0.3s ease-out;
}

.custom-dialog {
    width: 80%;
    height: 90vh;
    background: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    position: relative;
    animation: dialog-zoom-in 0.3s ease-out;

    &.is-fullscreen {
        width: 100%;
        height: 100vh;
        border-radius: 0;
    }
}

.custom-dialog-header {
    padding: 16px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    display: flex;
    align-items: center;
    justify-content: space-between;

    .dialog-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
    }

    .dialog-actions {
        display: flex;
        gap: 8px;

        .fullscreen-btn,
        .close-btn {
            padding: 8px;
            font-size: 18px;
            color: var(--el-text-color-secondary);
            transition: all 0.3s ease;

            &:hover {
                color: var(--el-text-color-primary);
                transform: scale(1.1);
            }
        }

        .close-btn:hover {
            color: var(--el-color-danger);
        }
    }
}

.custom-dialog-body {
    flex: 1;
    overflow: hidden;
    position: relative;
}

.schedule-container {
    height: 100%;
    display: flex;
    background: var(--el-bg-color-page);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.05);

    .date-nav {
        width: 240px;
        background: var(--el-bg-color);
        border-right: 1px solid var(--el-border-color-lighter);
        padding: 16px 0;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--el-border-color) transparent;

        .date-item {
            padding: 12px 16px;
            margin: 0 8px 8px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            background: var(--el-bg-color);
            border: 1px solid var(--el-border-color-light);

            &.active {
                background: var(--el-color-primary-light-9);
                border-color: var(--el-color-primary-light-7);
                box-shadow: 0 2px 8px var(--el-color-primary-light-8);
            }

            .day-number {
                font-size: 15px;
                font-weight: 500;
                color: var(--el-text-color-primary);
            }

            .day-date {
                font-size: 13px;
                color: var(--el-text-color-secondary);
                margin-top: 4px;
            }
        }
    }

    .schedule-content {
        flex: 1 1 0;
        padding: 0 24px;
        position: relative;
        overflow-y: auto;
        background: var(--el-bg-color-page);
        z-index: 0;

        .schedule-header {
            position: sticky;
            top: 0;
            z-index: 2;
            background: var(--el-bg-color-page);
            margin-bottom: -1px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 0px;
            padding: 10px 0px 10px 0px;

            h3 {
                font-size: 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 5px 0px;

                .total-cost {
                    font-size: 15px;
                    padding: 0 12px;
                    border-radius: 20px;
                    background: var(--el-color-primary-light-9);
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
            }
        }

        .schedule-selfcustom {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            width: 100%;

            .schedule-selfcustom-left {
                flex: 1;
                height: 100%;
            }

            .schedule-selfcustom-right {
                flex: 1;
                height: 100%;
            }
        }

        .schedule-card {
            margin: 0 0 16px;
            border: 1px solid var(--el-border-color-light);
            border-radius: 8px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;

            &:hover {
                transform: translateY(-3px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);

                .schedule-card-header .schedule-actions {
                    opacity: 1;
                }
            }

            &.is-overnight {
                border-left: 4px solid var(--el-color-info);
                background: linear-gradient(to right, var(--el-color-info-light-9) 0%, transparent 10%);
            }

            :deep(.el-card__header) {
                padding: 12px 16px;
                border-bottom: 1px solid var(--el-border-color-lighter);
                background-color: var(--el-bg-color-page);
            }

            .schedule-card-header {
                display: flex;
                align-items: center;
                gap: 12px;
                position: relative;

                .el-tag {
                    flex-shrink: 0;
                    height: 28px;
                    padding: 0 12px;
                    font-size: 13px;
                    border-radius: 6px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;

                    .el-icon {
                        font-size: 16px;
                    }
                }

                h4 {
                    flex: 1;
                    font-size: 15px;
                    line-height: 1.4;
                    margin: 0;
                    color: var(--el-text-color-primary);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .schedule-actions {
                    position: absolute;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    opacity: 0;
                    transition: all 0.3s ease;
                    background: linear-gradient(to left, var(--el-bg-color-page) 70%, transparent);
                    padding-left: 20px;

                    .el-button {
                        padding: 4px 8px;

                        &:hover {
                            transform: scale(1.1);
                        }

                        .el-icon {
                            font-size: 16px;
                        }
                    }
                }
            }

            .schedule-card-content {
                padding: 16px;
                background-color: var(--el-bg-color);

                .location,
                .estimated-cost {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 8px 0;
                    font-size: 13px;
                    color: var(--el-text-color-regular);

                    .el-icon {
                        font-size: 16px;
                        color: var(--el-text-color-secondary);
                    }
                }

                .description {
                    margin: 12px 0;
                    padding: 8px 12px;
                    font-size: 13px;
                    line-height: 1.6;
                    color: var(--el-text-color-secondary);
                    background-color: var(--el-fill-color-lighter);
                    border-radius: 4px;
                    position: relative;

                    &::before {
                        content: '"';
                        position: absolute;
                        left: 6px;
                        top: 4px;
                        color: var(--el-text-color-placeholder);
                        font-size: 16px;
                    }

                    &::after {
                        content: '"';
                        position: absolute;
                        right: 6px;
                        bottom: 4px;
                        color: var(--el-text-color-placeholder);
                        font-size: 16px;
                    }
                }

                .estimated-cost {
                    color: #f39d64;
                    font-weight: 500;
                }
            }
        }
    }
}

// 优化时间轴样式
:deep(.el-timeline) {
    padding-left: 16px;
    margin-top: 20px;

    .el-timeline-item {
        padding-bottom: 24px;

        &__tail {
            border-left: 2px solid var(--el-border-color-lighter);
        }

        &__node {
            width: 16px;
            height: 16px;
            left: -2px;
            border-width: 2px;
            transition: all 0.3s ease;
        }

        &:hover {
            .el-timeline-item__node {
                transform: scale(1.2);
            }
        }

        &__timestamp {
            font-size: 13px;
            color: var(--el-text-color-secondary);
            margin-bottom: 8px;
            padding: 0 12px;
            height: 24px;
            line-height: 24px;
            background-color: var(--el-fill-color-lighter);
            border-radius: 12px;
            display: inline-block;
        }

        &__content {
            padding-left: 20px;
        }
    }
}

// 响应式优化
@media screen and (max-width: 768px) {
    .custom-dialog {
        width: 100%;
        height: 100vh;
        border-radius: 0;
    }

    .schedule-container {
        flex-direction: column;

        .date-nav {
            width: 100%;
            height: auto;
            max-height: 120px;
            overflow-x: auto;
            display: flex;
            padding: 8px;

            .date-item {
                flex: 0 0 auto;
                width: 120px;
                margin: 0 4px;
            }
        }

        .schedule-content {
            .schedule-card {
                .schedule-card-header {
                    flex-wrap: wrap;

                    .el-tag {
                        height: 24px;
                        padding: 0 8px;
                    }

                    h4 {
                        width: 100%;
                        margin-top: 8px;
                    }

                    .schedule-actions {
                        position: static;
                        transform: none;
                        opacity: 1;
                        background: none;
                        padding: 0;
                        margin-top: 8px;
                        width: 100%;
                        display: flex;
                        justify-content: flex-end;
                    }
                }
            }
        }
    }
}

// 添加动画
@keyframes fade-in {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes dialog-zoom-in {
    from {
        opacity: 0;
        transform: scale(0.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>