<template>
  <div class="trip-planner">
    
    <div class="planner-header">
      <div class="header-left">
        <h2>行程规划</h2>
        <div v-if="currentOngoingTrip" class="ongoing-trip">
          <el-tag type="success">
            <el-icon>
              <Timer />
            </el-icon>
            <span>当前进行: {{ currentOngoingTrip.name }}</span>
          </el-tag>
          <span class="trip-progress">
            第 {{ calculateCurrentDay(currentOngoingTrip) }}/{{ calculateTotalDays(currentOngoingTrip) }} 天
          </span>
        </div>
      </div>
     
      <div class="actions">
        <el-button type="primary" @click="createNewTrip">
          <el-icon>
            <Plus />
          </el-icon>新建行程
        </el-button>
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
                    <el-dropdown-item :command="0" :disabled="trip.status === 0">规划中</el-dropdown-item>
                    <el-dropdown-item :command="1" :disabled="trip.status === 1">已完成</el-dropdown-item>
                    <el-dropdown-item :command="2" :disabled="trip.status === 2">进行中</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="trip-info">
              <h3>{{ trip.name }}</h3>
              <p class="trip-date">
                <el-icon>
                  <Calendar />
                </el-icon>
                {{ formatDateRange(trip.startDate, trip.endDate) }}
                <span class="trip-duration">{{ calculateTotalDays(trip) }}天</span>
              </p>
              
              <!-- 添加进度指示器 -->
              <div v-if="trip.status === 2" class="trip-progress-bar">
                <div class="progress-info">
                  <span>行程进度</span>
                  <span>{{ calculateProgress(trip) }}%</span>
                </div>
                <el-progress :percentage="calculateProgress(trip)" :status="getProgressStatus(trip)"
                  :stroke-width="8" />
              </div>

              <p class="trip-desc">{{ trip.description || '暂无描述' }}</p>
              
              <!-- 修改日程概览 -->
              <div class="schedule-overview" v-if="trip.schedules?.length">
                <div class="overview-header">
                  <el-icon>
                    <List />
                  </el-icon>
                  <span>今日安排</span>
                  <el-tag size="small" type="info" class="schedule-count">
                    共 {{ getTodaySchedules(trip, false).length }} 项
                  </el-tag>
                </div>
                
                <!-- 添加时间轴视图 -->
                <el-timeline v-if="getTodaySchedules(trip, false).length">
                  <el-timeline-item v-for="schedule in getTodaySchedules(trip, false)" :key="schedule.id"
                    :type="getScheduleTypeTag(schedule.scheduleType)" :timestamp="formatTime(schedule.startTime)"
                    size="small" :hollow="true">
                    <div class="timeline-content">
                      <div class="schedule-header">
                        <el-tag size="small" :type="getScheduleTypeTag(schedule.scheduleType)">
                          {{ getScheduleTypeText(schedule.scheduleType) }}
                        </el-tag>
                        <span class="duration">
                          {{ calculateDuration(schedule.startTime, schedule.endTime) }}
                        </span>
                      </div>
                      
                      <div class="schedule-body">
                        <h4>{{ schedule.title }}</h4>
                        <template v-if="schedule.location">
                          <p class="location">
                            <el-icon>
                              <Location />
                            </el-icon>
                            {{ schedule.location }}
                          </p>
                        </template>
                        <template v-if="schedule.description">
                          <p class="description">{{ schedule.description }}</p>
                        </template>
                        <template v-if="schedule.estimatedCost">
                          <p class="cost">
                            <el-icon>
                              <Money />
                            </el-icon>
                            预计费用: ¥{{ schedule.estimatedCost }}
                          </p>
                        </template>
                      </div>
                    </div>
                  </el-timeline-item>
                </el-timeline>
                
                <div v-else class="no-schedule">
                  <el-empty :image-size="60" description="今日暂无安排">
                    <template #description>
                      <p>今日暂无安排</p>
                      <el-button type="primary" link @click="viewSchedule(trip)">
                        立即添加
                      </el-button>
                    </template>
                  </el-empty>
                </div>
              </div>

              <div class="trip-meta">
                <div class="meta-item" v-if="trip.totalBudget">
                  <el-icon>
                    <Money />
                  </el-icon>
                  <span>预算: ¥{{ trip.totalBudget }}</span>
                  <small>¥{{ calculateDailyBudget(trip) }}/天</small>
                </div>
                <div class="meta-item" v-if="trip.schedules?.length">
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
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 30, 50]"
          :total="total" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>

    <!-- 新建/编辑行程对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑行程' : '新建行程'" width="50%" destroy-on-close>
      <trip-form v-if="dialogVisible" :trip="currentTrip" @submit="handleTripSubmit" @cancel="dialogVisible = false" />
    </el-dialog>

    <!-- 修改日程安排对话框 -->
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
                  <div class="route-header">
                    <h4>路线规划</h4>
                    <el-radio-group v-model="routeType" size="small">
                      <el-radio-button :value="0">驾车</el-radio-button>
                      <el-radio-button :value="1">公交</el-radio-button>
                      <el-radio-button :value="2">步行</el-radio-button>
                      <el-radio-button :value="3">骑行</el-radio-button>
                    </el-radio-group>
                  </div>

                  <div class="route-content" v-loading="routeLoading">
                    <template v-if="routeData">
                      <div class="route-locations">
                        <div class="location-item start">
                          <div class="location-label">起点</div>
                          <div class="location-name">{{ routeData.startLocation.name }}</div>
                          <div class="location-address">{{ routeData.startLocation.address }}</div>
                        </div>
                        <div class="location-divider">
                          <el-icon>
                            <ArrowRight />
                          </el-icon>
                        </div>
                        <div class="location-item end">
                          <div class="location-label">终点</div>
                          <div class="location-name">{{ routeData.endLocation.name }}</div>
                          <div class="location-address">{{ routeData.endLocation.address }}</div>
                        </div>
                      </div>

                      <div class="route-summary">
                        <div class="summary-item">
                          <el-icon>
                            <Timer />
                          </el-icon>
                          <span>预计时间: {{ formatDuration(routeData.duration) }}</span>
                        </div>
                        <div class="summary-item">
                          <el-icon>
                            <Location />
                          </el-icon>
                          <span>总距离: {{ formatDistance(routeData.distance) }}</span>
                        </div>
                      </div>

                      <!-- 驾车、步行、骑行路线 -->
                      <template v-if="routeType !== 1">
                        <el-timeline>
                          <el-timeline-item v-for="(step, index) in routeData.steps" :key="index"
                            :type="getRouteStepType(step)" size="normal">
                            <div class="route-step">
                              <div class="step-instruction">{{ step.instruction }}</div>
                              <div class="step-detail">
                                <span>{{ step.road }}</span>
                                <span class="step-distance">{{ formatDistance(step.distance) }}</span>
                              </div>
                            </div>
                          </el-timeline-item>
                        </el-timeline>
                      </template>

                      <!-- 公交路线 -->
                      <template v-else>
                        <div class="transit-routes">
                          <div v-for="(transit, index) in routeData.transits" :key="index" class="transit-route">
                            <div class="transit-summary">
                              <span class="transit-cost">费用: ¥{{ transit.cost }}</span>
                              <span class="transit-duration">
                                {{ formatDuration(transit.duration) }}
                              </span>
                              <span class="walking-distance">
                                步行: {{ formatDistance(transit.walking_distance) }}
                              </span>
                            </div>

                            <el-timeline>
                              <el-timeline-item v-for="(segment, sIndex) in transit.segments" :key="sIndex"
                                :type="getTransitType(segment)" size="normal">
                                <template v-if="segment.bus">
                                  <div v-for="line in segment.bus.buslines" :key="line.name" class="bus-line">
                                    <div class="line-name">{{ line.name }}</div>
                                    <div class="line-stops">
                                      {{ line.departure_stop }} → {{ line.arrival_stop }}
                                      <span class="via-stops">
                                        (途经{{ line.via_num }}站)
                                      </span>
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
    </Transition>

    <!-- 位置信息悬浮展示 -->
    <div class="location-display-wrapper" @mouseenter="handleLocationEnter" @mouseleave="handleLocationLeave">
      <el-button class="location-trigger" circle :class="{ active: showLocation }">
        <el-icon>
          <Location />
        </el-icon>
      </el-button>
      
      <Transition name="fade-slide">
        <div v-show="showLocation" class="location-popup" @mouseenter="handlePopupEnter" @mouseleave="handlePopupLeave">
          <CurrentLocation />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, ArrowDown, Calendar, Timer, Money, List, Location, Close, ArrowRight, ArrowLeft } from '@element-plus/icons-vue'
import TripForm from './components/TripForm.vue'
import { useTripStore } from '@/stores/tripStore'
import dayjs from 'dayjs'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb.vue'
import TripSchedule from './components/TripSchedule.vue'
import CurrentLocation from '@/components/LocationDisplay/CurrentLocation.vue'
import { getRouteAPI, geocodeAPI, batchGeocodeAPI } from '@/api/locationApi'

const tripStore = useTripStore()
const trips = ref([])
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
    await tripStore.updateTripStatus(trip.id, status)
    ElMessage.success('状态更新成功')
    await loadTrips()
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

// 修改加载行程列表的方法
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

// 修改查看日程方法
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

const getProgressStatus = (trip) => {
  const progress = calculateProgress(trip)
  if (progress < 30) return 'warning'
  if (progress < 70) return ''
  return 'success'
}

const calculateDailyBudget = (trip) => {
  if (!trip?.totalBudget) return 0
  const days = calculateTotalDays(trip)
  return (trip.totalBudget / days).toFixed(2)
}

// 修改获取今日日程的方法，添加是否限制数量的参数
const getTodaySchedules = (trip, limit = true) => {
  if (!trip?.schedules?.length) return []
  const today = dayjs().format('YYYY-MM-DD')
  const schedules = trip.schedules
    .filter(schedule => schedule.startTime.startsWith(today))
    .sort((a, b) => dayjs(a.startTime).diff(dayjs(b.startTime)))
  
  return limit ? schedules.slice(0, 3) : schedules
}

// 添加计算时长的方法
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

onMounted(() => {
  loadTrips()
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
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
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

// 监听选中日程变化，自动展开抽屉
watch(() => selectedSchedules.value.length, (newLength) => {
  if (newLength > 1) {
    isRouteExpanded.value = true
  }
})
</script>

<style lang="scss" scoped>
.trip-planner {
  padding: 20px;

  .planner-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .ongoing-trip {
        display: flex;
        align-items: center;
        gap: 8px;

        .el-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
        }

        .trip-progress {
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    h2 {
      margin: 0;
      font-size: 24px;
      color: #303133;
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
    }

    .trip-info {
      padding: 20px;

      h3 {
        margin: 0 0 10px;
        font-size: 18px;
        color: #303133;
      }

      .trip-date {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--el-text-color-regular);
        
        .trip-duration {
          color: var(--el-text-color-secondary);
          font-size: 12px;
        }
      }

      .trip-progress-bar {
        margin: 12px 0;
        
        .progress-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }

      .trip-desc {
        color: #606266;
        font-size: 14px;
        margin: 10px 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .trip-meta {
        display: flex;
        gap: 16px;
        margin: 12px 0;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--el-text-color-regular);
          font-size: 14px;

          small {
            color: var(--el-text-color-secondary);
            font-size: 12px;
          }
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

      .schedule-overview {
        margin: 16px 0;
        padding: 12px;
        background-color: var(--el-fill-color-light);
        border-radius: 8px;

        .overview-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          color: var(--el-text-color-primary);
          font-weight: 500;

          .schedule-count {
            margin-left: auto;
            font-size: 12px;
          }
        }

        :deep(.el-timeline) {
          padding: 0;
          margin: 0;

          .el-timeline-item {
            padding-bottom: 16px;

            &:last-child {
              padding-bottom: 0;
            }

            .el-timeline-item__node {
              background-color: var(--el-color-primary-light-8);
              border-color: var(--el-color-primary);
            }

            .el-timeline-item__timestamp {
              font-size: 12px;
              color: var(--el-text-color-secondary);
              margin-bottom: 4px;
            }

            .timeline-content {
              background-color: var(--el-bg-color);
              border-radius: 4px;
              padding: 8px;

              .schedule-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;

                .duration {
                  font-size: 12px;
                  color: var(--el-text-color-secondary);
                }
              }

              .schedule-body {
                h4 {
                  margin: 0 0 8px;
                  font-size: 14px;
                  color: var(--el-text-color-primary);
                }

                p {
                  margin: 4px 0;
                  font-size: 13px;
                  display: flex;
                  align-items: center;
                  gap: 4px;

                  .el-icon {
                    font-size: 14px;
                    color: var(--el-text-color-secondary);
                  }

                  &.location {
                    color: var(--el-text-color-regular);
                  }

                  &.description {
                    color: var(--el-text-color-secondary);
                    font-size: 12px;
                  }

                  &.cost {
                    color: var(--el-color-danger);
                  }
                }
              }
            }
          }
        }

        .no-schedule {
          padding: 20px 0;
          
          :deep(.el-empty) {
            padding: 0;

            .el-empty__description {
              p {
                margin: 8px 0;
                color: var(--el-text-color-secondary);
              }
            }
          }
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

// 过渡动画
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}

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
        overflow-y: auto;
        padding: 20px;
      }
    }
  }
}

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

.schedule-dialog-body {
  .schedule-content {
    display: flex;
    height: 100%;

    .schedule-list {
      flex: 1;
      min-width: 0;
      padding-right: 20px;
      border-right: 1px solid var(--el-border-color-light);
    }

    .route-planning {
      position: absolute;
      right: -360px;
      top: 0;
      bottom: 0;
      width: 360px;
      margin-left: 20px;
      display: flex;
      flex-direction: column;
      background: var(--el-bg-color);
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
      z-index: 10;
      
      &.is-expanded {
        transform: translateX(-360px);
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

      .route-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h4 {
          margin: 0;
          font-size: 16px;
          color: var(--el-text-color-primary);
        }
      }

      .route-content {
        flex: 1;
        overflow-y: auto;

        .route-locations {
          margin-bottom: 16px;
          padding: 12px;
          background: var(--el-bg-color);
          border-radius: 4px;
          border: 1px solid var(--el-border-color-light);

          display: flex;
          align-items: center;
          gap: 12px;

          .location-item {
            flex: 1;
            min-width: 0;

            .location-label {
              font-size: 12px;
              color: var(--el-text-color-secondary);
              margin-bottom: 4px;
            }

            .location-name {
              font-weight: 500;
              color: var(--el-text-color-primary);
              margin-bottom: 4px;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }

            .location-address {
              font-size: 12px;
              color: var(--el-text-color-regular);
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }

            &.start {
              .location-label {
                color: var(--el-color-success);
              }
            }

            &.end {
              .location-label {
                color: var(--el-color-danger);
              }
            }
          }

          .location-divider {
            color: var(--el-text-color-secondary);
            display: flex;
            align-items: center;

            .el-icon {
              font-size: 20px;
            }
          }
        }

        .route-summary {
          margin-bottom: 16px;
          padding: 12px;
          background: var(--el-fill-color-light);
          border-radius: 4px;

          .summary-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--el-text-color-regular);

            &:not(:last-child) {
              margin-bottom: 8px;
            }

            .el-icon {
              font-size: 16px;
              color: var(--el-color-primary);
            }
          }
        }

        .route-step {
          .step-instruction {
            color: var(--el-text-color-primary);
            margin-bottom: 4px;
          }

          .step-detail {
            display: flex;
            justify-content: space-between;
            color: var(--el-text-color-secondary);
            font-size: 13px;
          }
        }

        .transit-routes {
          .transit-route {
            &:not(:last-child) {
              margin-bottom: 24px;
              padding-bottom: 24px;
              border-bottom: 1px dashed var(--el-border-color);
            }

            .transit-summary {
              margin-bottom: 16px;
              display: flex;
              gap: 16px;
              color: var(--el-text-color-regular);
              font-size: 13px;

              .transit-cost {
                color: var(--el-color-danger);
              }
            }

            .bus-line {
              .line-name {
                font-weight: 500;
                color: var(--el-text-color-primary);
                margin-bottom: 4px;
              }

              .line-stops {
                font-size: 13px;
                color: var(--el-text-color-regular);

                .via-stops {
                  color: var(--el-text-color-secondary);
                  margin-left: 8px;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style> 