<template>
  <div class="trip-planner">
    
    <div class="planner-header">
      <div class="header-left">
        <h2>行程规划</h2>
        <div v-if="currentOngoingTrip" class="ongoing-trip">
          <el-tag type="success">
            <el-icon><Timer /></el-icon>
            <span>当前进行: {{ currentOngoingTrip.name }}</span>
          </el-tag>
          <span class="trip-progress">
            第 {{ calculateCurrentDay(currentOngoingTrip) }}/{{ calculateTotalDays(currentOngoingTrip) }} 天
          </span>
        </div>
      </div>
     
      <div class="actions">
        <el-button type="primary" @click="createNewTrip">
          <el-icon><Plus /></el-icon>新建行程
        </el-button>
      </div>
    </div>

    <div class="planner-content">
      <!-- 行程列表 -->
      <el-row v-loading="loading" :gutter="20">
        <el-col v-if="trips?.length" :xs="24" :sm="12" :md="8" :lg="6" 
                v-for="trip in trips" :key="trip.id">
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
                <el-icon><Calendar /></el-icon>
                {{ formatDateRange(trip.startDate, trip.endDate) }}
                <span class="trip-duration">{{ calculateTotalDays(trip) }}天</span>
              </p>
              
              <!-- 添加进度指示器 -->
              <div v-if="trip.status === 2" class="trip-progress-bar">
                <div class="progress-info">
                  <span>行程进度</span>
                  <span>{{ calculateProgress(trip) }}%</span>
                </div>
                <el-progress 
                  :percentage="calculateProgress(trip)"
                  :status="getProgressStatus(trip)"
                  :stroke-width="8"
                />
              </div>

              <p class="trip-desc">{{ trip.description || '暂无描述' }}</p>
              
              <!-- 修改日程概览 -->
              <div class="schedule-overview" v-if="trip.schedules?.length">
                <div class="overview-header">
                  <el-icon><List /></el-icon>
                  <span>今日安排</span>
                  <el-tag size="small" type="info" class="schedule-count">
                    共 {{ getTodaySchedules(trip, false).length }} 项
                  </el-tag>
                </div>
                
                <!-- 添加时间轴视图 -->
                <el-timeline v-if="getTodaySchedules(trip, false).length">
                  <el-timeline-item
                    v-for="schedule in getTodaySchedules(trip, false)"
                    :key="schedule.id"
                    :type="getScheduleTypeTag(schedule.scheduleType)"
                    :timestamp="formatTime(schedule.startTime)"
                    size="small"
                    :hollow="true"
                  >
                    <div class="timeline-content">
                      <div class="schedule-header">
                        <el-tag 
                          size="small" 
                          :type="getScheduleTypeTag(schedule.scheduleType)"
                        >
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
                            <el-icon><Location /></el-icon>
                            {{ schedule.location }}
                          </p>
                        </template>
                        <template v-if="schedule.description">
                          <p class="description">{{ schedule.description }}</p>
                        </template>
                        <template v-if="schedule.estimatedCost">
                          <p class="cost">
                            <el-icon><Money /></el-icon>
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
                      <el-button 
                        type="primary" 
                        link 
                        @click="viewSchedule(trip)"
                      >
                        立即添加
                      </el-button>
                    </template>
                  </el-empty>
                </div>
              </div>

              <div class="trip-meta">
                <div class="meta-item" v-if="trip.totalBudget">
                  <el-icon><Money /></el-icon>
                  <span>预算: ¥{{ trip.totalBudget }}</span>
                  <small>¥{{ calculateDailyBudget(trip) }}/天</small>
                </div>
                <div class="meta-item" v-if="trip.schedules?.length">
                  <el-icon><Timer /></el-icon>
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
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新建/编辑行程对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑行程' : '新建行程'"
      width="50%"
      destroy-on-close>
      <trip-form
        v-if="dialogVisible"
        :trip="currentTrip"
        @submit="handleTripSubmit"
        @cancel="dialogVisible = false"
      />
    </el-dialog>

    <!-- 修改日程安排对话框 -->
    <el-dialog
      v-model="scheduleDialogVisible"
      :title="currentTrip?.name + ' - 日程安排'"
      width="90%"
      :fullscreen="true"
      destroy-on-close
    >
      <trip-schedule
        v-if="scheduleDialogVisible"
        :trip-id="currentTrip?.id"
        :trip-name="currentTrip?.name"
        :start-date="currentTrip?.startDate"
        :end-date="currentTrip?.endDate"
        @back="scheduleDialogVisible = false"
      />
    </el-dialog>

    <!-- 位置信息悬浮展示 -->
    <div 
      class="location-display-wrapper"
      @mouseenter="handleLocationEnter"
      @mouseleave="handleLocationLeave"
    >
      <el-button 
        class="location-trigger"
        circle
        :class="{ active: showLocation }"
      >
        <el-icon><Location /></el-icon>
      </el-button>
      
      <Transition name="fade-slide">
        <div 
          v-show="showLocation" 
          class="location-popup"
          @mouseenter="handlePopupEnter"
          @mouseleave="handlePopupLeave"
        >
          <CurrentLocation />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, ArrowDown, Calendar, Timer, Money, List, Location } from '@element-plus/icons-vue'
import TripForm from './components/TripForm.vue'
import { useTripStore } from '@/stores/tripStore'
import dayjs from 'dayjs'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb.vue'
import TripSchedule from './components/TripSchedule.vue'
import CurrentLocation from '@/components/LocationDisplay/CurrentLocation.vue'

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

// 查看日程安排
const viewSchedule = (trip) => {
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
      box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
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
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        overflow: hidden;
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
</style> 