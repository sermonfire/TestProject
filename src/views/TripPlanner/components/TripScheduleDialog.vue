<template>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="80%" class="schedule-dialog" destroy-on-close>
        <div class="schedule-container">
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
                    <h3>第{{ currentDay }}天日程安排</h3>
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
                        <el-card class="schedule-card">
                            <template #header>
                                <div class="schedule-card-header">
                                    <el-tag :type="getScheduleType(schedule.scheduleType).tagType">
                                        {{ getScheduleType(schedule.scheduleType).label }}
                                    </el-tag>
                                    <h4>{{ schedule.title }}</h4>
                                    <div class="schedule-actions">
                                        <el-button-group>
                                            <el-button type="primary" link @click="handleEditSchedule(schedule)">
                                                <el-icon>
                                                    <Edit />
                                                </el-icon>
                                            </el-button>
                                            <el-button type="danger" link @click="handleDeleteSchedule(schedule)">
                                                <el-icon>
                                                    <Delete />
                                                </el-icon>
                                            </el-button>
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
                                <div class="description">{{ schedule.description }}</div>
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
    </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, Location, Money, Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    trip: {
        type: Object,
        default: () => ({
            name: '',
            startDate: '',
            endDate: ''
        })
    },
    schedules: {
        type: Array,
        default: () => []
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

// 计算总天数
const totalDays = computed(() => {
    if (!props.trip?.startDate || !props.trip?.endDate) return 0
    return dayjs(props.trip.endDate).diff(props.trip.startDate, 'day') + 1
})

// 获取指定天数的日期
const getDayDate = (day) => {
    return dayjs(props.trip.startDate).add(day - 1, 'day').format('YYYY-MM-DD')
}

// 格式化日期
const formatDate = (date) => {
    return dayjs(date).format('MM-DD')
}

// 格式化时间
const formatTime = (time) => {
    return dayjs(time).format('HH:mm')
}

// 获取当前日的日程安排
const currentDaySchedules = computed(() => {
    return props.schedules.filter(schedule => schedule.dayIndex === currentDay.value)
        .sort((a, b) => dayjs(a.startTime).diff(dayjs(b.startTime)))
})

// 日程类型配置
const SCHEDULE_TYPES = {
    1: { label: '景点游览', type: 'primary', tagType: '' },
    2: { label: '用餐', type: 'success', tagType: 'success' },
    3: { label: '交通', type: 'warning', tagType: 'warning' },
    4: { label: '住宿', type: 'info', tagType: 'info' },
    5: { label: '其他', type: 'default', tagType: 'default' }
}

// 获取日程类型信息
const getScheduleType = (type) => {
    return SCHEDULE_TYPES[type] || SCHEDULE_TYPES[5]
}

// 切换日期
const handleDayChange = (day) => {
    currentDay.value = day
}

// 添加日程
const handleAddSchedule = () => {
    emit('add', {
        dayIndex: currentDay.value,
        date: getDayDate(currentDay.value)
    })
}

// 编辑日程
const handleEditSchedule = (schedule) => {
    emit('edit', schedule)
}

// 删除日程
const handleDeleteSchedule = async (schedule) => {
    try {
        await ElMessageBox.confirm('确定要删除该日程吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })
        emit('delete', schedule)
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败')
        }
    }
}

// 对话框标题
const dialogTitle = computed(() => {
    return props.trip?.name ? `${props.trip.name} 的日程安排` : '日程安排'
})
</script>

<style lang="scss" scoped>
.schedule-dialog {
    :deep(.el-dialog__body) {
        padding: 0;
    }
}

.schedule-container {
    display: flex;
    height: 70vh;
    background-color: var(--el-bg-color);

    .date-nav {
        width: 200px;
        border-right: 1px solid var(--el-border-color-light);
        overflow-y: auto;
        background-color: var(--el-bg-color-page);

        .date-item {
            padding: 16px;
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

    .schedule-content {
        flex: 1;
        padding: 20px;
        overflow-y: auto;

        .schedule-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;

            h3 {
                margin: 0;
                color: var(--el-text-color-primary);
            }
        }

        .schedule-card {
            .schedule-card-header {
                display: flex;
                align-items: center;
                gap: 12px;

                h4 {
                    margin: 0;
                    flex: 1;
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
                padding-top: 12px;

                .location,
                .estimated-cost {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--el-text-color-secondary);
                    margin-top: 8px;
                    font-size: 14px;
                }

                .description {
                    margin: 12px 0;
                    color: var(--el-text-color-regular);
                    font-size: 14px;
                    line-height: 1.6;
                }
            }
        }
    }
}

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
</style>