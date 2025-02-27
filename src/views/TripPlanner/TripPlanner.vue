<template>
    <div class="trip-planner">

        <div class="planner-header">
            <div class="title-section">
                <h2>行程规划</h2>
                <el-button type="primary" @click="createNewTrip" class="create-btn">
                    <el-icon>
                        <Plus />
                    </el-icon>新建行程
                </el-button>
            </div>
            <div class="header-container">
                <div class="planner-left">
                    <div v-if="currentOngoingTrip" class="ongoing-trip" :class="{ 'is-collapsed': isCollapsed }">
                        <div class="collapse-trigger" @click="toggleCollapse">
                            <el-icon :class="{ 'is-collapsed': isCollapsed }">
                                <ArrowDown />
                            </el-icon>
                        </div>

                        <div class="ongoing-content">
                            <div class="trip-header">
                                <el-tag type="success" effect="plain" class="trip-tag">
                                    <el-icon>
                                        <Timer />
                                    </el-icon>
                                    <span>当前进行中</span>
                                </el-tag>
                                <div class="trip-info-wrapper">
                                    <div class="trip-title">{{ currentOngoingTrip.name }}</div>
                                    <div class="trip-progress">
                                        第 {{ calculateCurrentDay(currentOngoingTrip) }}/{{
                                        calculateTotalDays(currentOngoingTrip) }} 天
                                    </div>
                                </div>
                            </div>

                            <div class="trip-details">
                                <!-- 进度指示器 -->
                                <div class="trip-progress-bar">
                                    <div class="progress-info">
                                        <div class="progress-stats">
                                            <div class="progress-circle"
                                                :style="{ '--progress': `${calculateProgress(currentOngoingTrip)}%` }">
                                                <span class="progress-value">{{ calculateProgress(currentOngoingTrip)
                                                    }}%</span>
                                            </div>
                                            <div class="progress-details">
                                                <div class="detail-item">
                                                    <span class="label">已进行</span>
                                                    <span class="value">{{ calculateCurrentDay(currentOngoingTrip) }}
                                                        天</span>
                                                </div>
                                                <div class="detail-item">
                                                    <span class="label">总天数</span>
                                                    <span class="value">{{ calculateTotalDays(currentOngoingTrip) }}
                                                        天</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 日程概览 -->
                                <div class="schedule-overview">
                                    <div class="overview-container">
                                        <div class="overview-header">
                                            <div class="overview-left">
                                                <el-icon class="overview-icon">
                                                    <List />
                                                </el-icon>
                                                <span>今日安排</span>
                                                <el-tag size="small" type="info" class="schedule-count">
                                                    共 {{ getTodaySchedulesCount(currentOngoingTrip.id) }} 项
                                                </el-tag>
                                            </div>
                                            <div class="overview-right">
                                                <el-button type="primary" link @click="viewSchedule(currentOngoingTrip)"
                                                    v-if="getTodaySchedulesCount(currentOngoingTrip.id) > 0">
                                                    查看全部
                                                </el-button>
                                            </div>
                                        </div>

                                        <el-timeline class="schedule-timeline"
                                            v-if="getTodaySchedulesCount(currentOngoingTrip.id) > 0">
                                            <el-timeline-item
                                                v-for="schedule in getTodaySchedules(currentOngoingTrip.id)"
                                                :key="schedule.id" :type="getScheduleTypeTag(schedule.scheduleType)"
                                                :timestamp="formatTime(schedule.startTime)" size="normal"
                                                :hollow="true">
                                                <div class="timeline-content">
                                                    <div class="schedule-header">
                                                        <el-tag size="small"
                                                            :type="getScheduleTypeTag(schedule.scheduleType)">
                                                            {{ getScheduleTypeText(schedule.scheduleType) }}
                                                        </el-tag>
                                                        <span class="duration">
                                                            {{ calculateDuration(schedule.startTime, schedule.endTime)
                                                            }}
                                                        </span>
                                                    </div>
                                                    <div class="schedule-body">
                                                        <h4 v-if="schedule.title">{{ schedule.title }}</h4>
                                                        <p v-if="schedule.estimatedCost" class="cost">
                                                            <el-icon>
                                                                <Money />
                                                            </el-icon>
                                                            预计费用：¥{{ schedule.estimatedCost }}
                                                        </p>
                                                    </div>
                                                </div>
                                            </el-timeline-item>
                                        </el-timeline>

                                        <div v-else class="no-schedule">
                                            <el-empty :image-size="60">
                                                <template #description>
                                                    <p>今日暂无安排</p>
                                                    <el-button type="primary" link
                                                        @click="viewSchedule(currentOngoingTrip)">
                                                        立即添加
                                                    </el-button>
                                                </template>
                                            </el-empty>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="planner-content">
            <!-- 行程列表 -->
            <el-row v-loading="loading" :gutter="20">
                <el-col v-if="trips?.length" :xs="24" :sm="12" :md="8" :lg="6" v-for="trip in trips" :key="trip.id">
                    <el-card class="trip-card" :body-style="{ padding: '0px' }">
                        <div class="trip-status" :class="getStatusClass(trip.status)">
                            <el-dropdown @command="(command) => handleStatusChange(trip, command)">
                                <span class="status-text">
                                    {{ getStatusText(trip.status) }}
                                    <el-icon class="el-icon--right"><arrow-down /></el-icon>
                                </span>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item v-for="option in getStatusOptions(trip.status)"
                                            :key="option.command" :command="option.command" :disabled="option.disabled">
                                            {{ option.label }}
                                            <el-tooltip
                                                v-if="option.command === 2 && option.disabled && trip.status !== 2"
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
                        <div class="card-info">
                            <h3 class="card-title">{{ trip.name }}</h3>
                            <p class="card-date">
                                <el-icon>
                                    <Calendar />
                                </el-icon>
                                {{ formatDateRange(trip.startDate, trip.endDate) }}
                                <span class="duration-text">{{ calculateTotalDays(trip) }}天</span>
                            </p>

                            <p class="card-description">{{ trip.description || '暂无描述' }}</p>

                            <div class="card-meta">
                                <div class="meta-detail" v-if="trip.totalBudget">
                                    <el-icon>
                                        <Money />
                                    </el-icon>
                                    <span>行程预算: ¥{{ trip.totalBudget }}</span>
                                    <small>¥{{ calculateDailyBudget(trip) }}/天</small>
                                </div>
                                <div class="meta-detail" v-if="trip.schedules?.length">
                                    <el-icon>
                                        <Timer />
                                    </el-icon>
                                    <span>{{ trip.schedules.length }}个日程安排</span>
                                </div>
                            </div>

                            <div class="trip-times">
                                <p class="time-item">创建时间: {{ formatDateTime(trip.createTime) }}</p>
                                <p class="time-item">更新时间: {{ formatDateTime(trip.updateTime) }}</p>
                            </div>
                        </div>
                        <div class="trip-actions">
                            <el-button-group>
                                <el-button type="primary" @click="editTrip(trip)" :icon="Edit">
                                    编辑
                                </el-button>
                                <el-button type="success" @click="viewSchedule(trip)" :icon="Calendar">
                                    日程安排
                                </el-button>
                                <el-button type="danger" @click="deleteTrip(trip)" :icon="Delete">
                                    删除
                                </el-button>
                            </el-button-group>
                        </div>
                    </el-card>
                </el-col>
            </el-row>

            <!-- 空状态 -->
            <el-empty v-if="!trips?.length && !loading" description="暂无行程计划">
                <el-button type="primary" @click="createNewTrip">立即创建</el-button>
            </el-empty>

            <!-- 添加分页组件 -->
            <div class="pagination-container" v-if="total > 0">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 30, 50]" :total="total" layout="total, sizes, prev, pager, next, jumper"
                    @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </div>

        <!-- 新建/编辑行程对话框 -->
        <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑行程' : '新建行程'" width="50%" destroy-on-close>
            <TripForm v-if="dialogVisible" :trip="currentTrip" @submit="handleTripSubmit"
                @cancel="dialogVisible = false" />
        </el-dialog>

        <!-- 日程安排对话框 -->
        <Transition name="dialog-fade">
            <div v-if="scheduleDialogVisible" class="schedule-dialog-container">
                <div class="schedule-dialog-mask" @click="scheduleDialogVisible = false"></div>
                <div class="schedule-dialog-wrapper">
                    <div class="schedule-dialog">
                        <div class="schedule-dialog-header">
                            <h3>{{ currentTrip?.name }} - 日程安排</h3>
                            <el-button class="close-btn" circle @click="scheduleDialogVisible = false">
                                <el-icon>
                                    <Close />
                                </el-icon>
                            </el-button>
                        </div>

                        <div class="schedule-dialog-body">
                            <div class="schedule-content">
                                <!-- 左侧日程列表 -->
                                <div class="schedule-list">
                                    <trip-schedule :trip-id="currentTrip?.id" :trip-name="currentTrip?.name"
                                        :start-date="currentTrip?.startDate" :end-date="currentTrip?.endDate"
                                        @back="scheduleDialogVisible = false" @select-schedule="handleScheduleSelect" />
                                </div>

                                <!-- 右侧路线规划 -->
                                <div class="route-planning" :class="{ 'is-expanded': isRouteExpanded }">
                                    <div class="route-toggle" @click="toggleRoute">
                                        <el-icon :class="{ 'is-expanded': isRouteExpanded }">
                                            <ArrowLeft />
                                        </el-icon>
                                    </div>
                                    <div class="route-content">
                                        <div class="route-header">
                                            <div class="header-title">
                                                <h4>普通路线规划</h4>
                                                <span class="subtitle">{{ selectedSchedules.length }} 个景点已选择</span>
                                            </div>
                                            <div class="transport-options">
                                                <el-radio-group v-model="routeType" size="small">
                                                    <el-radio-button :value="0">
                                                        <el-icon>
                                                            <Van />
                                                        </el-icon>驾车
                                                    </el-radio-button>
                                                    <el-radio-button :value="1">
                                                        <el-icon>
                                                            <Connection />
                                                        </el-icon>公交
                                                    </el-radio-button>
                                                    <el-radio-button :value="2">
                                                        <el-icon>
                                                            <Position />
                                                        </el-icon>步行
                                                    </el-radio-button>
                                                    <el-radio-button :value="3">
                                                        <el-icon>
                                                            <Bicycle />
                                                        </el-icon>骑行
                                                    </el-radio-button>
                                                </el-radio-group>
                                            </div>
                                        </div>

                                        <div class="route-body" v-loading="routeLoading">
                                            <template v-if="routeData">
                                                <!-- 路线概览卡片 -->
                                                <div class="route-overview">
                                                    <div class="route-locations">
                                                        <div class="location-wrapper">
                                                            <div class="location-item start">
                                                                <div class="location-label">起点</div>
                                                                <div class="location-name">{{
                                                                    routeData.startLocation.name }}</div>
                                                                <div class="location-address">{{
                                                                    routeData.startLocation.address }}</div>
                                                            </div>
                                                            <div class="location-divider">
                                                                <el-icon>
                                                                    <ArrowRight />
                                                                </el-icon>
                                                            </div>
                                                            <div class="location-item end">
                                                                <div class="location-label">终点</div>
                                                                <div class="location-name">{{ routeData.endLocation.name
                                                                    }}</div>
                                                                <div class="location-address">{{
                                                                    routeData.endLocation.address }}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- 路线统计信息 -->
                                                    <div class="route-summary">
                                                        <div class="summary-grid">
                                                            <div class="summary-item">
                                                                <el-icon>
                                                                    <Timer />
                                                                </el-icon>
                                                                <span>预计时间: {{ formatDuration(routeData.duration)
                                                                    }}</span>
                                                            </div>
                                                            <div class="summary-item">
                                                                <el-icon>
                                                                    <Location />
                                                                </el-icon>
                                                                <span>总距离: {{ formatDistance(routeData.distance)
                                                                    }}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- 驾车、步行、骑行路线 -->
                                                <template v-if="routeType !== 1">
                                                    <div class="route-steps">
                                                        <el-timeline>
                                                            <el-timeline-item v-for="(step, index) in routeData.steps"
                                                                :key="index" :type="getRouteStepType(step)"
                                                                size="normal">
                                                                <div class="route-step">
                                                                    <div class="step-instruction">{{ step.instruction }}
                                                                    </div>
                                                                    <div class="step-detail">
                                                                        <span>{{ step.road }}</span>
                                                                        <span class="step-distance">{{
                                                                            formatDistance(step.distance) }}</span>
                                                                    </div>
                                                                </div>
                                                            </el-timeline-item>
                                                        </el-timeline>
                                                    </div>
                                                </template>

                                                <!-- 公交路线 -->
                                                <template v-else>
                                                    <div class="transit-routes">
                                                        <div v-for="(transit, index) in routeData.transits" :key="index"
                                                            class="transit-route">
                                                            <div class="transit-summary">
                                                                <span class="transit-cost">费用: ¥{{ transit.cost
                                                                    }}</span>
                                                                <span class="transit-duration">{{
                                                                    formatDuration(transit.duration) }}</span>
                                                                <span class="walking-distance">步行: {{
                                                                    formatDistance(transit.walking_distance) }}</span>
                                                            </div>

                                                            <el-timeline>
                                                                <el-timeline-item
                                                                    v-for="(segment, sIndex) in transit.segments"
                                                                    :key="sIndex" :type="getTransitType(segment)"
                                                                    size="normal">
                                                                    <template v-if="segment.bus">
                                                                        <div v-for="line in segment.bus.buslines"
                                                                            :key="line.name" class="bus-line">
                                                                            <div class="line-name">{{ line.name }}</div>
                                                                            <div class="line-stops">
                                                                                {{ line.departure_stop }} → {{
                                                                                line.arrival_stop }}
                                                                                <span class="via-stops">(途经{{
                                                                                    line.via_num }}站)</span>
                                                                            </div>
                                                                        </div>
                                                                    </template>
                                                                </el-timeline-item>
                                                            </el-timeline>
                                                        </div>
                                                    </div>
                                                </template>
                                            </template>

                                            <el-empty v-else-if="!routeLoading" description="请选择两个以上日程查看路线规划" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- 位置信息悬浮展示 -->
        <div class="location-display-wrapper" @mouseenter="handleLocationEnter" @mouseleave="handleLocationLeave">
            <el-button class="location-trigger" circle :class="{ active: showLocation }">
                <el-icon>
                    <Location />
                </el-icon>
            </el-button>

            <Transition name="fade-slide">
                <div v-show="showLocation" class="location-popup" @mouseenter="handlePopupEnter"
                    @mouseleave="handlePopupLeave">
                    <CurrentLocation />
                </div>
            </Transition>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, ArrowDown, Calendar, Timer, Money, List, Location, Close, ArrowRight, ArrowLeft, Search, Van, Connection, Position, Bicycle, InfoFilled } from '@element-plus/icons-vue'
import TripForm from './components/TripForm.vue'
import { useTripStore } from '@/stores/tripStore'
import dayjs from 'dayjs'
import TripSchedule from './components/TripSchedule.vue'
import CurrentLocation from '@/components/LocationDisplay/CurrentLocation.vue'
import { getRouteAPI, batchGeocodeAPI } from '@/api/locationApi'

const tripStore = useTripStore()
const trips = ref([])

// 添加格式化时间的方法
const formatTime = (time) => {
    if (!time) return ''
    // 如果时间包含日期，只取时间部分
    const timeStr = time.includes('T') ? time.split('T')[1] : time
    // 如果时间包含秒，只取时分
    return timeStr.substring(0, 5)
}

/**
 * @description 获取今日日程安排
 * @param {string} tripId 行程ID
 * @returns {Array} 今日日程安排列表
 */
const getTodaySchedules = (tripId) => {
    const schedules = tripStore.getTodaySchedules(tripId)
    if (!Array.isArray(schedules)) return []

    // 获取当前行程
    const trip = trips.value.find(t => t.id === tripId)
    if (!trip) return []

    // 计算当前是第几天
    const startDate = dayjs(trip.startDate)
    const today = dayjs()
    const currentDayIndex = today.diff(startDate, 'day') + 1

    // 过滤出当天的日程安排并按时间排序
    return schedules.filter(schedule => {
        const scheduleDayIndex = parseInt(schedule.dayIndex)
        return !isNaN(scheduleDayIndex) && scheduleDayIndex === currentDayIndex
    }).sort((a, b) => dayjs(a.startTime).diff(dayjs(b.startTime)))
}

/**
 * @description 获取今日日程数量
 * @param {string} tripId 行程ID
 * @returns {number} 今日日程数量
 */
const getTodaySchedulesCount = (tripId) => {
    return getTodaySchedules(tripId).length
}

const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentTrip = ref(null)

// 添加分页相关的响应式数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 在 script setup 中添加
const selectedSchedules = ref([])
const routeType = ref(0)
const routeLoading = ref(false)
const routeData = ref(null)

// 控制路线规划抽屉的展开状态
const isRouteExpanded = ref(false)

// 获取行程状态文本
const getStatusText = (status) => {
    const statusMap = {
        0: '规划中',
        1: '已完成',
        2: '进行中'
    }
    return statusMap[status] || '未知状态'
}

// 获取状态样式类
const getStatusClass = (status) => {
    const statusClassMap = {
        0: 'planning',
        1: 'completed',
        2: 'progress'
    }
    return statusClassMap[status] || ''
}

// 格式化日期范围
const formatDateRange = (start, end) => {
    return `${dayjs(start).format('YYYY-MM-DD')} 至 ${dayjs(end).format('YYYY-MM-DD')}`
}

// 格式化日期时间
const formatDateTime = (datetime) => {
    return dayjs(datetime).format('YYYY-MM-DD HH:mm:ss')
}

// 创建新行程
const createNewTrip = () => {
    isEdit.value = false
    currentTrip.value = {
        name: '',
        startDate: '',
        endDate: '',
        description: '',
        totalBudget: 0
    }
    dialogVisible.value = true
}

// 编辑行程
const editTrip = (trip) => {
    isEdit.value = true
    currentTrip.value = {
        id: trip.id,
        name: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        description: trip.description,
        totalBudget: trip.totalBudget
    }
    dialogVisible.value = true
}

// 删除行程
const deleteTrip = async (trip) => {
    try {
        await ElMessageBox.confirm('确定要删除该行程吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })
        await tripStore.deleteTrip(trip.id)
        ElMessage.success('删除成功')
        loadTrips()
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败')
        }
    }
}

// 处理行程表单提交
const handleTripSubmit = async (tripData) => {
    try {
        if (isEdit.value) {
            await tripStore.updateTrip(tripData)
            ElMessage.success('更新成功')
        } else {
            await tripStore.createTrip(tripData)
            ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadTrips()
    } catch (error) {
        ElMessage.error(error.message || '操作失败')
    }
}

// 处理状态变更
const handleStatusChange = async (trip, status) => {
    try {
        // 如果要将行程设置为进行中状态
        if (status === 2) {
            // 检查是否已有其他行程在进行中
            const hasOngoingTrip = trips.value.some(t =>
                t.id !== trip.id && t.status === 2
            )

            if (hasOngoingTrip) {
                ElMessageBox.confirm(
                    '当前已有其他行程正在进行中，是否结束其他行程并开始当前行程？',
                    '提示',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning'
                    }
                ).then(async () => {
                    // 先将其他进行中的行程设置为已完成
                    const ongoingTrip = trips.value.find(t => t.status === 2)
                    if (ongoingTrip) {
                        await tripStore.updateTripStatus(ongoingTrip.id, 1)
                    }
                    // 然后设置当前行程为进行中
                    await tripStore.updateTripStatus(trip.id, status)
                    ElMessage.success('状态更新成功')
                    await loadTrips()
                }).catch(() => {
                    // 用户取消操作
                })
                return
            }
        }

        // 如果是将进行中的行程改为其他状态，直接执行
        await tripStore.updateTripStatus(trip.id, status)
        ElMessage.success('状态更新成功')
        await loadTrips()
    } catch (error) {
        ElMessage.error('状态更新失败')
    }
}

// 状态下拉菜单选项
const getStatusOptions = (currentStatus) => {
    const options = [
        { command: 0, label: '规划中', disabled: false },
        { command: 1, label: '已完成', disabled: false },
        { command: 2, label: '进行中', disabled: false }
    ]

    // 如果当前不是进行中状态，且已有其他行程在进行中，则禁用"进行中"选项
    if (currentStatus !== 2 && trips.value.some(t => t.status === 2)) {
        options.find(opt => opt.command === 2).disabled = true
    }

    // 禁用当前状态的选项
    options.find(opt => opt.command === currentStatus).disabled = true

    return options
}

// 加载行程列表的方法
const loadTrips = async () => {
    loading.value = true
    try {
        const result = await tripStore.getTrips({
            pageNum: currentPage.value,
            pageSize: pageSize.value
        })
        trips.value = result.list
        total.value = result.pagination.total
    } catch (error) {
        ElMessage.error('加载行程失败')
    } finally {
        loading.value = false
    }
}

// 处理分页变化
const handleSizeChange = (val) => {
    pageSize.value = val
    currentPage.value = 1 // 重置到第一页
    loadTrips()
}

const handleCurrentChange = (val) => {
    currentPage.value = val
    loadTrips()
}

// 添加日程安排对话框的响应式数据
const scheduleDialogVisible = ref(false)

// 清理路线规划数据
const clearRouteData = () => {
    selectedSchedules.value = []
    routeData.value = null
    routeType.value = 0
}

// 监听对话框关闭
watch(scheduleDialogVisible, (newVal) => {
    if (!newVal) {
        clearRouteData()
    }
})

// 查看日程方法
const viewSchedule = (trip) => {
    clearRouteData() // 清理之前的路线数据
    currentTrip.value = trip
    scheduleDialogVisible.value = true
}

// 计算当前进行的行程
const currentOngoingTrip = computed(() => {
    if (!trips.value?.length) return null
    return trips.value.find(trip => {
        const now = dayjs()
        return (
            trip.status === 2 && // 进行中状态
            now.isAfter(dayjs(trip.startDate)) &&
            now.isBefore(dayjs(trip.endDate))
        )
    })
})

// 计算当前是第几天
const calculateCurrentDay = (trip) => {
    if (!trip) return 0
    const now = dayjs()
    return now.diff(dayjs(trip.startDate), 'day') + 1
}

// 计算总天数
const calculateTotalDays = (trip) => {
    if (!trip) return 0
    return dayjs(trip.endDate).diff(trip.startDate, 'day') + 1
}

// 添加新的计算方法
const calculateProgress = (trip) => {
    if (!trip) return 0
    const now = dayjs()
    const start = dayjs(trip.startDate)
    const end = dayjs(trip.endDate)
    const total = end.diff(start, 'day')
    const passed = now.diff(start, 'day')
    return Math.floor((passed / total) * 100)
}

const calculateDailyBudget = (trip) => {
    if (!trip?.totalBudget) return 0
    const days = calculateTotalDays(trip)
    return (trip.totalBudget / days).toFixed(2)
}


// 计算时长的方法
const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return ''

    const start = startTime.includes('T') ? startTime.split('T')[1] : startTime
    const end = endTime.includes('T') ? endTime.split('T')[1] : endTime

    const startMoment = dayjs(`1970-01-01 ${start}`)
    const endMoment = dayjs(`1970-01-01 ${end}`)

    const minutes = endMoment.diff(startMoment, 'minute')
    if (minutes < 0) return '时间无效'

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours === 0) {
        return `${remainingMinutes}分钟`
    } else if (remainingMinutes === 0) {
        return `${hours}小时`
    } else {
        return `${hours}小时${remainingMinutes}分钟`
    }
}

const getScheduleTypeTag = (type) => {
    const typeMap = {
        1: 'success',
        2: 'warning',
        3: 'info',
        4: 'primary'
    }
    return typeMap[type] || ''
}

const getScheduleTypeText = (type) => {
    const typeMap = {
        1: '景点',
        2: '用餐',
        3: '休息',
        4: '交通'
    }
    return typeMap[type] || '其他'
}

const showLocation = ref(false)
let hideTimer = null
let isOverButton = ref(false)
let isOverPopup = ref(false)

/**
 * @description 处理按钮的鼠标进入
 */
const handleLocationEnter = () => {
    isOverButton.value = true
    showLocation.value = true
    if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
    }
}

/**
 * @description 处理按钮的鼠标离开
 */
const handleLocationLeave = () => {
    isOverButton.value = false
    // 如果鼠标不在弹出框上,则开始隐藏计时
    if (!isOverPopup.value) {
        startHideTimer()
    }
}

/**
 * @description 处理弹出框的鼠标进入
 */
const handlePopupEnter = () => {
    isOverPopup.value = true
    if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
    }
}

/**
 * @description 处理弹出框的鼠标离开
 */
const handlePopupLeave = () => {
    isOverPopup.value = false
    // 如果鼠标不在按钮上,则开始隐藏计时
    if (!isOverButton.value) {
        startHideTimer()
    }
}

/**
 * @description 开始隐藏计时器
 */
const startHideTimer = () => {
    if (hideTimer) {
        clearTimeout(hideTimer)
    }
    hideTimer = setTimeout(() => {
        showLocation.value = false
    }, 300)
}

// 清理定时器
onBeforeUnmount(() => {
    if (hideTimer) {
        clearTimeout(hideTimer)
    }
})

onMounted(async () => {
    await loadTrips()
    // 获取所有进行中行程的日程数据
    trips.value.forEach(trip => {
        if (trip.status === 2) {
            tripStore.fetchTodaySchedules(trip.id)
        }
    })
})

/**
 * @description 处理日程选择
 * @param {Array} schedules 选中的日程
 */
const handleScheduleSelect = async (schedules) => {
    selectedSchedules.value = schedules
    if (schedules.length > 1) {
        await loadRouteData()
    } else {
        routeData.value = null
    }
}

/**
 * @description 获取相邻的两个景点游览目的地
 * @param {Array} schedules 日程列表
 * @returns {Array} 相邻的两个景点
 */
const getAdjacentDestinations = (schedules) => {
    // 过滤出景点类型的日程
    const destinations = schedules.filter(schedule => {
        return (schedule.type === 'destination' || schedule.scheduleType === 1) && schedule.location
    })

    if (destinations.length < 2) return null

    // 获取相邻的两个景点
    const pairs = []
    for (let i = 0; i < destinations.length - 1; i++) {
        pairs.push([destinations[i], destinations[i + 1]])
    }

    return pairs
}

/**
 * @description 加载路线规划数据
 */
const loadRouteData = async () => {
    if (selectedSchedules.value.length < 2) return

    routeLoading.value = true
    try {
        // 获取相邻的两个景点
        const destinationPairs = getAdjacentDestinations(selectedSchedules.value)
        if (!destinationPairs) {
            ElMessage.warning('请至少选择两个景点游览日程')
            return
        }

        // 获取当前选中的相邻景点对
        const currentPair = destinationPairs[0]

        // 获取两个景点的地址
        const addresses = [
            currentPair[0].title,  // 第一个景点的地址
            currentPair[1].title   // 第二个景点的地址
        ]

        // 批量获取经纬度
        const coordinates = await batchGeocodeAPI(addresses)

        // 验证经纬度是否有效
        if (!coordinates[0]?.data?.longitude || !coordinates[0]?.data?.latitude ||
            !coordinates[1]?.data?.longitude || !coordinates[1]?.data?.latitude) {
            throw new Error('无法获取景点位置信息，请确保景点地址正确')
        }

        // 调用路线规划接口
        const [start, end] = coordinates
        // 计算两点之间的直线距离（单位：千米）
        const distance = calculateDistance(
            start.data.latitude, start.data.longitude,
            end.data.latitude, end.data.longitude
        )

        // 根据不同交通方式检查距离限制
        if (routeType.value === 1 && distance > 50) { // 公交限制50km
            throw new Error('公交路线规划距离不能超过50公里，请选择其他出行方式')
        } else if (routeType.value === 2 && distance > 5) { // 步行限制5km
            throw new Error('步行路线规划距离不能超过5公里，请选择其他出行方式')
        }

        const routeResult = await getRouteAPI({
            startLon: start.data.longitude,
            startLat: start.data.latitude,
            endLon: end.data.longitude,
            endLat: end.data.latitude,
            type: routeType.value
        })

        if (routeResult.code === 0) {
            routeData.value = routeResult.data
            // 添加起点和终点信息到路线数据中
            routeData.value.startLocation = {
                name: currentPair[0].title || currentPair[0].name,  // 使用 title 或 name 作为景点名称
                address: currentPair[0].location
            }
            routeData.value.endLocation = {
                name: currentPair[1].title || currentPair[1].name,
                address: currentPair[1].location
            }
        } else {
            throw new Error(routeResult.message || '获取路线规划失败')
        }
    } catch (error) {
        console.error('路线规划错误:', error)
        throw error
    } finally {
        routeLoading.value = false
    }
}

/**
 * @description 计算两点之间的直线距离
 * @param {number} lat1 第一个点的纬度
 * @param {number} lon1 第一个点的经度
 * @param {number} lat2 第二个点的纬度
 * @param {number} lon2 第二个点的经度
 * @returns {number} 距离（千米）
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // 地球半径（千米）
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

// 更新路线规划展示部分
const renderRouteLocations = computed(() => {
    if (!routeData.value) return null
    return {
        start: routeData.value.startLocation,
        end: routeData.value.endLocation
    }
})

/**
 * @description 格式化持续时间
 * @param {number} seconds 秒数
 */
const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
        return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
}

/**
 * @description 格式化距离
 * @param {number} meters 米数
 */
const formatDistance = (meters) => {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)}公里`
    }
    return `${meters}米`
}

/**
 * @description 获取路线步骤类型
 */
const getRouteStepType = (step) => {
    // 根据实际情况返回不同的类型
    return 'primary'
}

/**
 * @description 获取公交路线类型
 */
const getTransitType = (segment) => {
    if (segment.bus) return 'success'
    return 'info'
}

// 监听路线类型变化
watch(routeType, async () => {
    if (selectedSchedules.value.length > 1) {
        try {
            // 根据不同交通方式显示提示
            if (routeType.value === 1) {
                ElMessage.warning('公交路线规划限制距离50公里以内')
            } else if (routeType.value === 2) {
                ElMessage.warning('步行路线规划限制距离5公里以内')
            } else if (routeType.value === 3) {
                ElMessage.warning('骑行路线规划可能不支持部分区域，如遇到错误请尝试其他出行方式')
            }
            await loadRouteData()
        } catch (error) {
            // 如果路线规划失败，自动切换回驾车方式
            if (routeType.value !== 0) {
                ElMessage.error(`${error.message}，已自动切换为驾车方式`)
                routeType.value = 0
                await loadRouteData()
            } else {
                ElMessage.error(error.message || '路线规划失败')
            }
        }
    }
})

// 添加新的计算方法
const toggleRoute = () => {
    isRouteExpanded.value = !isRouteExpanded.value
}

// 监听选中日程变化的逻辑
watch(() => selectedSchedules.value.length, (newLength) => {
    if (newLength === 0) {
        // 清理路线规划结果
        routeData.value = null
    }
})

// 监听器
watch(() => Array.from(tripStore.todaySchedulesMap), () => {
    if (currentTrip.value?.id) {
        getTodaySchedules(currentTrip.value.id)
    }
}, { deep: true })

// 添加折叠状态控制
const isCollapsed = ref(false)

const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
}
</script>

<style lang="scss" scoped>
.trip-planner {
    padding: 20px;
    user-select: none;

    .planner-header {
        margin-bottom: 20px;
        padding: 16px 24px;
        background: var(--el-bg-color);
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

        .title-section {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 16px;

            h2 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }

            .create-btn {
                padding: 8px 16px;
                font-weight: 500;
            }
        }

        .header-container {
            display: flex;
            flex-direction: row;
            align-items: flex-start;
            gap: 24px;

            .planner-left {
                flex-direction: row;
                min-width: 0;

                .ongoing-trip {
                    position: relative;
                    margin-bottom: 20px;
                    background: var(--el-bg-color);
                    border-radius: 12px;
                    border: 1px solid var(--el-border-color-light);
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
                    transition: all 0.3s ease;

                    .collapse-trigger {
                        position: absolute;
                        top: 0;
                        right: 20px;
                        width: 32px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        background: var(--el-fill-color-light);
                        border-radius: 0 0 16px 16px;
                        transition: all 0.3s ease;

                        &:hover {
                            background: var(--el-fill-color-darker);
                        }

                        .el-icon {
                            font-size: 16px;
                            color: var(--el-text-color-secondary);
                            transition: transform 0.3s ease;

                            &.is-collapsed {
                                transform: rotate(-180deg);
                            }
                        }
                    }

                    .ongoing-content {
                        padding: 20px;
                        transition: padding 0.4s cubic-bezier(0.4, 0, 0.2, 1);

                        .trip-header {
                            display: flex;
                            align-items: center;
                            gap: 16px;
                            margin-bottom: 20px;
                            transition: margin 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                        }

                        .trip-details {
                            display: flex;
                            gap: 16px;
                            height: 170px;
                            opacity: 1;
                            overflow: hidden;
                            transform-origin: top;
                            transform: scaleY(1);
                            margin-top: 0;
                            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                        }
                    }

                    &.is-collapsed {
                        .trip-details {
                            height: 0;
                            opacity: 0;
                            transform: scaleY(0);
                            margin-top: -20px;
                        }

                        .trip-header {
                            margin-bottom: 20px;
                        }

                        .ongoing-content {
                            padding: 16px 20px;
                        }
                    }

                    // 头部区域
                    .trip-header {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        margin-bottom: 20px;

                        .trip-tag {
                            padding: 6px 12px;
                            border-radius: 16px;
                            display: inline-flex;
                            align-items: center;
                            gap: 4px;
                            font-size: 13px;
                            font-weight: 500;
                            background: var(--el-color-success-light-9);
                            border: 1px solid var(--el-color-success-light-5);
                            color: var(--el-color-success);
                            white-space: nowrap;

                            .el-icon {
                                font-size: 14px;
                            }
                        }

                        .trip-info-wrapper {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;

                            .trip-title {
                                font-size: 16px;
                                font-weight: 600;
                                color: var(--el-text-color-primary);
                                display: -webkit-box;
                                -webkit-line-clamp: 1;
                                line-clamp: 1;
                                -webkit-box-orient: vertical;
                                overflow: hidden;
                            }

                            .trip-progress {
                                display: inline-flex;
                                align-items: center;
                                padding: 4px 8px;
                                background: var(--el-fill-color-light);
                                border-radius: 4px;
                                color: var(--el-text-color-regular);
                                font-size: 13px;
                                margin-left: 10px;

                                &::before {
                                    content: '';
                                    display: inline-block;
                                    width: 4px;
                                    height: 4px;
                                    border-radius: 50%;
                                    background: var(--el-color-success);
                                    margin-right: 6px;
                                }
                            }
                        }
                    }

                    .trip-details {
                        display: flex;
                        gap: 16px;

                        .trip-progress-bar {
                            min-width: 0;
                            padding: 20px;
                            background: var(--el-fill-color-light);
                            border-radius: 12px;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                            transition: all 0.3s ease;

                            &:hover {
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                                transform: translateY(-2px);
                            }

                            .progress-info {
                                .progress-stats {
                                    display: flex;
                                    align-items: center;
                                    gap: 32px;

                                    .progress-circle {
                                        width: 120px;
                                        height: 120px;
                                        border-radius: 50%;
                                        background: conic-gradient(var(--el-color-success) calc(var(--progress) * 1%),
                                                var(--el-fill-color) 0deg);
                                        position: relative;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        flex-shrink: 0;
                                        padding: 6px;
                                        box-shadow: 0 4px 12px rgba(var(--el-color-success-rgb), 0.2);
                                        animation: progress-appear 0.6s cubic-bezier(0.4, 0, 0.2, 1);

                                        &::before {
                                            content: '';
                                            position: absolute;
                                            inset: 6px;
                                            background: var(--el-bg-color);
                                            border-radius: 50%;
                                            box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.05);
                                        }

                                        .progress-value {
                                            position: relative;
                                            font-size: 28px;
                                            font-weight: 600;
                                            color: var(--el-color-success);
                                            display: flex;
                                            align-items: baseline;
                                        }
                                    }

                                    .progress-details {
                                        flex: 1;
                                        display: grid;
                                        grid-template-columns: repeat(2, 1fr);
                                        gap: 16px;

                                        .detail-item {
                                            padding: 20px;
                                            background: var(--el-bg-color);
                                            border-radius: 10px;
                                            text-align: center;
                                            transition: all 0.3s ease;
                                            border: 1px solid var(--el-border-color-light);

                                            &:hover {
                                                transform: translateY(-2px);
                                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                                                border-color: var(--el-color-success-light-5);
                                            }

                                            .label {
                                                display: block;
                                                font-size: 14px;
                                                color: var(--el-text-color-secondary);
                                                margin-bottom: 8px;
                                            }

                                            .value {
                                                display: block;
                                                font-size: 24px;
                                                font-weight: 600;
                                                color: var(--el-text-color-primary);
                                                background: linear-gradient(45deg, var(--el-color-success), var(--el-color-primary));
                                                -webkit-background-clip: text;
                                                background-clip: text;
                                                color: transparent;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        .schedule-overview {
                            width: 300px;
                            display: flex;
                            flex-direction: column;

                            .overview-container {
                                height: 100%;
                                display: flex;
                                flex-direction: column;
                                gap: 5px;

                                .overview-header {
                                    padding: 0px 5px;
                                    background: var(--el-bg-color);
                                    border-bottom: 1px solid var(--el-border-color-light);
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;

                                    .overview-left {
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;

                                        .overview-icon {
                                            font-size: 16px;
                                            color: var(--el-text-color-regular);
                                        }

                                        .schedule-count {
                                            margin-left: 8px;
                                        }
                                    }

                                    .overview-right {
                                        .overview-button {
                                            padding: 4px 0;
                                        }
                                    }
                                }

                                .schedule-timeline {
                                    flex: 1;
                                    padding: 20px;
                                    overflow-y: auto;
                                    overflow-x: hidden;

                                    &::-webkit-scrollbar {
                                        width: 6px;
                                    }

                                    &::-webkit-scrollbar-thumb {
                                        background: var(--el-border-color-lighter);
                                        border-radius: 3px;
                                    }

                                    &::-webkit-scrollbar-track {
                                        background: transparent;
                                    }
                                }

                                .no-schedule {
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    height: 85%;
                                    font-size: 14px;
                                    color: var(--el-text-color-secondary);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

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

            &.archived {
                background-color: #f5f5f5;
                color: #999;
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

        .card-info {
            padding: 20px;

            .card-title {
                margin: 0 0 10px;
                font-size: 18px;
                color: #303133;
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
                color: #606266;
                font-size: 14px;
                margin: 10px 0;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
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
                border-top: 1px dashed #ebeef5;

                .time-item {
                    color: #909399;
                    font-size: 12px;
                    margin: 3px 0;
                }
            }
        }

        .trip-actions {
            padding: 10px 20px;
            border-top: 1px solid #EBEEF5;
            display: flex;
            justify-content: flex-end;
        }
    }

    .pagination-container {
        margin-top: 20px;
        display: flex;
        justify-content: center;
    }

    .location-display-wrapper {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 100;
        display: flex;
        align-items: flex-end;

        .location-trigger {
            width: 48px;
            height: 48px;
            background: var(--el-color-primary);
            color: white;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

            &:hover,
            &.active {
                transform: scale(1.1);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
            }

            .el-icon {
                font-size: 20px;
            }
        }

        .location-popup {
            position: absolute;
            right: calc(100% + 16px);
            bottom: 0;
            width: 360px;
        }
    }
}

// 动画相关样式
.dialog-fade-enter-active,
.dialog-fade-leave-active {
    transition: all 0.3s ease-out;

    .schedule-dialog-wrapper {
        transition: all 0.3s ease-out;
    }

    .schedule-dialog-mask {
        transition: all 0.3s ease-out;
    }
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
    opacity: 0;

    .schedule-dialog-wrapper {
        transform: scale(0.95) translateY(20px);
    }

    .schedule-dialog-mask {
        opacity: 0;
    }
}

.dialog-fade-enter-to,
.dialog-fade-leave-from {
    opacity: 1;

    .schedule-dialog-wrapper {
        transform: scale(1) translateY(0);
    }

    .schedule-dialog-mask {
        opacity: 1;
    }
}

@keyframes progress-appear {
    from {
        opacity: 0;
        transform: scale(0.8);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

// 添加日程安排对话框的样式
.schedule-dialog-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;

    .schedule-dialog-mask {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
    }

    .schedule-dialog-wrapper {
        position: relative;
        width: 50vw;
        height: 80vh;
        background: var(--el-bg-color);
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        overflow: hidden;

        .schedule-dialog {
            height: 100%;
            display: flex;
            flex-direction: column;

            .schedule-dialog-header {
                padding: 16px 24px;
                border-bottom: 1px solid var(--el-border-color-light);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: var(--el-bg-color);

                h3 {
                    margin: 0;
                    font-size: 18px;
                    color: var(--el-text-color-primary);
                }

                .close-btn {
                    font-size: 18px;
                    color: var(--el-text-color-secondary);
                    transition: all 0.3s ease;

                    &:hover {
                        color: var(--el-text-color-primary);
                        transform: rotate(90deg);
                    }
                }
            }

            .schedule-dialog-body {
                flex: 1;
                overflow: hidden;
                display: flex;

                .schedule-content {
                    flex: 1;
                    display: flex;
                    height: 100%;

                    .schedule-list {
                        flex: 1;
                        min-width: 0;
                        height: 100%;
                        border-right: 1px solid var(--el-border-color-light);
                    }

                    .route-planning {
                        width: 360px;
                        background: var(--el-bg-color);
                        border-left: 1px solid var(--el-border-color-light);
                        transform: translateX(100%);
                        transition: transform 0.3s ease;
                        position: absolute;
                        right: 0;
                        top: 0;
                        bottom: 0;

                        &.is-expanded {
                            transform: translateX(0);
                        }

                        .route-toggle {
                            position: absolute;
                            left: -20px;
                            top: 50%;
                            transform: translateY(-50%);
                            width: 20px;
                            height: 60px;
                            background: var(--el-color-primary);
                            border-radius: 4px 0 0 4px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            color: white;

                            .el-icon {
                                transition: transform 0.3s ease;

                                &.is-expanded {
                                    transform: rotate(180deg);
                                }
                            }
                        }

                        .route-content {
                            height: 100%;
                            overflow: hidden;
                            display: flex;
                            flex-direction: column;

                            .route-header {
                                padding: 16px;
                                border-bottom: 1px solid var(--el-border-color-light);

                                .header-title {
                                    margin-bottom: 12px;

                                    h4 {
                                        margin: 0 0 4px;
                                        font-size: 16px;
                                        font-weight: 500;
                                    }

                                    .subtitle {
                                        font-size: 13px;
                                        color: var(--el-text-color-secondary);
                                    }
                                }
                            }

                            .route-body {
                                flex: 1;
                                overflow: auto;
                                padding: 16px;
                            }
                        }
                    }
                }
            }
        }
    }
}
</style>