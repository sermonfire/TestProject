<template>
  <div class="trip-schedule">
    <!-- 主要内容区域 -->
    <div class="schedule-content">
      <!-- 左侧天数导航 -->
      <div class="day-navigator">
        <el-scrollbar>
          <div class="day-list">
            <div
              v-for="day in totalDays"
              :key="day"
              class="day-item"
              :class="{ active: currentDay === day }"
              @click="currentDay = day"
            >
              <span class="day-number">第 {{ day }} 天</span>
              <span class="day-date">{{ formatDate(getDateByIndex(day)) }}</span>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 右侧日程详情 -->
      <div class="schedule-detail">
        <el-scrollbar>
          <div class="day-schedule">
            <!-- 日程头部 -->
            <div class="day-header">
              <div class="header-info">
                <h3>第 {{ currentDay }} 天</h3>
                <span class="date-info">{{ formatDate(getDateByIndex(currentDay)) }}</span>
              </div>
              <div class="header-actions">
                <el-button-group>
                  <el-button type="primary" @click="handleAddSchedule(currentDay)">
                    <el-icon><Plus /></el-icon>添加日程
                  </el-button>
                  <el-button type="success" @click="optimizeRoute(currentDay)">
                    <el-icon><Refresh /></el-icon>优化路线
                  </el-button>
                </el-button-group>
              </div>
            </div>

            <!-- 统一的时间轴 -->
            <div class="schedule-timeline">
              <el-timeline v-if="mergedSchedules.length">
                <el-timeline-item
                  v-for="item in mergedSchedules"
                  :key="item.id"
                  :type="getItemTypeTag(item)"
                  :timestamp="formatTime(item.startTime)"
                  size="large"
                >
                  <el-card 
                    class="schedule-card"
                    :class="getItemClass(item)"
                    v-draggable="getItemDragOptions(item)"
                  >
                    <template #header>
                      <div class="card-header">
                        <div class="schedule-type">
                          <el-tag :type="getItemTypeTag(item)" size="small">
                            {{ getItemTypeText(item) }}
                          </el-tag>
                        </div>
                        <div class="schedule-time">
                          {{ formatTime(item.startTime) }} - {{ formatTime(item.endTime) }}
                          <span class="duration">{{ calculateDuration(item.startTime, item.endTime) }}</span>
                        </div>
                      </div>
                    </template>

                    <div class="schedule-info">
                      <h4 class="schedule-title">{{ item.title || item.name }}</h4>
                      
                      <div class="info-items">
                        <!-- 景点特有信息 -->
                        <template v-if="item.type === 'destination'">
                          <div class="transport-info" v-if="item.transportType">
                            <el-tag size="small" :type="getTransportTypeTag(item.transportType)">
                              {{ getTransportTypeText(item.transportType) }}
                            </el-tag>
                            <span class="transport-time">预计{{ item.transportTime }}分钟</span>
                            <span v-if="item.transportCost" class="transport-cost">
                              ¥{{ item.transportCost }}
                            </span>
                          </div>
                          <div class="info-item" v-if="item.notes">
                            <el-icon><Document /></el-icon>
                            <span>{{ item.notes }}</span>
                          </div>
                        </template>

                        <!-- 普通日程信息 -->
                        <template v-else>
                          <div v-if="item.location" class="info-item">
                            <el-icon><Location /></el-icon>
                            <span>{{ item.location }}</span>
                          </div>
                          <div v-if="item.description" class="info-item description">
                            <el-icon><Document /></el-icon>
                            <span>{{ item.description }}</span>
                          </div>
                          <div v-if="item.estimatedCost" class="info-item">
                            <el-icon><Money /></el-icon>
                            <span>预计费用: ¥{{ item.estimatedCost }}</span>
                          </div>
                        </template>
                      </div>

                      <div class="schedule-actions">
                        <el-button-group>
                          <el-button 
                            type="primary" 
                            link 
                            @click="item.type === 'destination' ? handleEditDestination(item) : handleEditSchedule(item)"
                          >
                            <el-icon><Edit /></el-icon>
                          </el-button>
                          <el-button 
                            type="danger" 
                            link 
                            @click="item.type === 'destination' ? handleRemoveDestination(item) : handleDeleteSchedule(item)"
                          >
                            <el-icon><Delete /></el-icon>
                          </el-button>
                        </el-button-group>
                      </div>
                    </div>
                  </el-card>
                </el-timeline-item>
              </el-timeline>

              <!-- 空状态 -->
              <el-empty 
                v-else 
                description="暂无日程安排" 
                :image-size="120"
              >
                <el-button type="primary" @click="handleAddSchedule(currentDay)">
                  添加日程
                </el-button>
              </el-empty>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </div>

    <!-- 日程编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑日程' : '添加日程'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="scheduleFormRef"
        :model="scheduleForm"
        :rules="scheduleRules"
        label-width="100px"
      >
        <el-form-item label="日程类型" prop="scheduleType">
          <el-select v-model="scheduleForm.scheduleType" @change="handleTypeChange">
            <el-option label="景点游览" :value="1" />
            <el-option label="用餐" :value="2" />
            <el-option label="休息" :value="3" />
            <el-option label="交通" :value="4" />
          </el-select>
        </el-form-item>

        <!-- 当选择景点游览时显示景点选择 -->
        <template v-if="scheduleForm.scheduleType === 1">
          <el-form-item label="选择景点" prop="destinationId">
            <el-select
              v-model="scheduleForm.destinationId"
              filterable
              remote
              reserve-keyword
              placeholder="请输入景点名称搜索"
              :remote-method="searchDestinations"
              :loading="searchLoading"
              clearable
              @change="handleDestinationChange"
              :default-first-option="true"
            >
              <el-option
                v-for="item in destinationOptions"
                :key="item.destinationId"
                :label="item.destination.name"
                :value="item.destinationId"
              >
                <div class="destination-option">
                  <span class="destination-name">{{ item.destination.name }}</span>
                  <span class="destination-rating" v-if="item.destination.rating">
                    {{ item.destination.rating.toFixed(1) }}分
                  </span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <!-- 景点相关的交通信息 -->
          <el-form-item label="交通方式" prop="transportType">
            <el-select v-model="scheduleForm.transportType">
              <el-option label="步行" :value="1" />
              <el-option label="公交" :value="2" />
              <el-option label="地铁" :value="3" />
              <el-option label="出租" :value="4" />
              <el-option label="自驾" :value="5" />
            </el-select>
          </el-form-item>

          <el-form-item label="交通时间" prop="transportTime">
            <el-input-number 
              v-model="scheduleForm.transportTime" 
              :min="0"
              :step="5"
            />
            <span class="unit">分钟</span>
          </el-form-item>

          <el-form-item label="交通费用" prop="transportCost">
            <el-input-number 
              v-model="scheduleForm.transportCost"
              :min="0"
              :precision="2"
              :step="5"
            />
            <span class="unit">元</span>
          </el-form-item>
        </template>

        <!-- 其他表单项保持不变 -->
        <el-form-item label="时间" prop="timeRange">
          <el-time-picker
            v-model="scheduleForm.timeRange"
            is-range
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="HH:mm"
            value-format="HH:mm"
          />
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input v-model="scheduleForm.title" />
        </el-form-item>

        <el-form-item label="地点" prop="location">
          <el-input v-model="scheduleForm.location" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="scheduleForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>

        <el-form-item label="预计费用" prop="estimatedCost">
          <el-input-number
            v-model="scheduleForm.estimatedCost"
            :min="0"
            :precision="2"
            :step="10"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitScheduleForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 目的地编辑对话框 -->
    <el-dialog
      v-model="destinationDialogVisible"
      :title="isEdit ? '编辑目的地' : '添加目的地'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="destinationFormRef"
        :model="destinationForm"
        :rules="destinationRules"
        label-width="100px"
      >
        <el-form-item label="时间" prop="timeRange">
          <el-time-picker
            v-model="destinationForm.timeRange"
            is-range
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="HH:mm"
            value-format="HH:mm"
          />
        </el-form-item>

        <el-form-item label="交通方式" prop="transportType">
          <el-select v-model="destinationForm.transportType">
            <el-option label="步行" :value="1" />
            <el-option label="公交" :value="2" />
            <el-option label="地铁" :value="3" />
            <el-option label="出租" :value="4" />
            <el-option label="自驾" :value="5" />
          </el-select>
        </el-form-item>

        <el-form-item label="预计时间" prop="transportTime">
          <el-input-number
            v-model="destinationForm.transportTime"
            :min="0"
            :precision="0"
            :step="1"
          />
        </el-form-item>

        <el-form-item label="预计费用" prop="transportCost">
          <el-input-number
            v-model="destinationForm.transportCost"
            :min="0"
            :precision="2"
            :step="10"
          />
        </el-form-item>

        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="destinationForm.notes"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="destinationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDestinationForm">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Location, Plus, Download, Document, 
  Money, Edit, Delete, Refresh,
  Star
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { 
  getScheduleListAPI,
  createScheduleAPI,
  updateScheduleAPI,
  deleteScheduleAPI,
  getDaySchedulesAPI
} from '@/api/scheduleApi'
import { 
  getDayDestinationsAPI,
  addDestinationAPI,
  updateVisitOrderAPI,
  deleteDestinationAPI,
  getRecommendRouteAPI,
  searchDestinationsAPI
} from '@/api/destinationApi'
import { vDraggable } from '@/directives/draggable'

const props = defineProps({
  tripId: {
    type: [String, Number],
    required: true
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  tripName: {
    type: String,
    default: '未命名行程'
  }
})

// 计算总天数
const totalDays = computed(() => {
  return dayjs(props.endDate).diff(props.startDate, 'day') + 1
})

// 根据天数索引获取具体日期
const getDateByIndex = (dayIndex) => {
  return dayjs(props.startDate).add(dayIndex - 1, 'day').format('YYYY-MM-DD')
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('MM月DD日')
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  // 处理包含T的ISO格式时间
  if (time.includes('T')) {
    return time.split('T')[1].substring(0, 5)
  }
  // 处理普通时间格式
  return dayjs(time, 'HH:mm').format('HH:mm')
}

// 日程类型相关
const getScheduleTypeText = (type) => {
  const typeMap = {
    1: '景点游览',
    2: '用餐',
    3: '休息',
    4: '交通'
  }
  return typeMap[type] || '未知类型'
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

// 日程数据
const schedulesByDay = ref({})

// 加载日程数据
const loadSchedules = async () => {
  try {
    const { code, data, message } = await getScheduleListAPI(props.tripId)
    if (code === 0) {
      // 按天数索引重组数据
      const schedules = {}
      if (data && data.length > 0) {
        data.forEach(schedule => {
          if (!schedules[schedule.dayIndex]) {
            schedules[schedule.dayIndex] = []
          }
          schedules[schedule.dayIndex].push(schedule)
        })
        // 对每天的日程按时间排序
        Object.keys(schedules).forEach(day => {
          schedules[day].sort((a, b) => {
            return dayjs(`1970-01-01T${a.startTime}`).diff(dayjs(`1970-01-01T${b.startTime}`))
          })
        })
      }
      schedulesByDay.value = schedules
    } else {
      ElMessage.warning(message || '暂无日程数据')
    }
  } catch (error) {
    console.error('加载日程数据异常:', error)
    ElMessage.warning('暂无日程数据')
  }
}

// 日程表单相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentDay = ref(1)
const scheduleFormRef = ref(null)

const scheduleForm = ref({
  scheduleType: 1,
  destinationId: null,
  transportType: 1,
  transportTime: 30,
  transportCost: 0,
  timeRange: [],
  title: '',
  location: '',
  description: '',
  estimatedCost: 0
})

const scheduleRules = {
  scheduleType: [
    { required: true, message: '请选择日程类型', trigger: 'change' }
  ],
  destinationId: [
    { 
      required: true, 
      message: '请选择景点', 
      trigger: 'change',
      // 仅当类型为景点游览时验证
      validator: (rule, value, callback) => {
        if (scheduleForm.value.scheduleType === 1 && !value) {
          callback(new Error('请选择景点'))
        } else {
          callback()
        }
      }
    }
  ],
  timeRange: [
    { required: true, message: '请选择时间', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' }
  ]
}

// 添加日程
const handleAddSchedule = (dayIndex) => {
  isEdit.value = false
  currentDay.value = dayIndex
  scheduleForm.value = {
    scheduleType: 1,
    destinationId: null,
    transportType: 1,
    transportTime: 30,
    transportCost: 0,
    timeRange: [],
    title: '',
    location: '',
    description: '',
    estimatedCost: 0
  }
  dialogVisible.value = true
}

// 编辑日程
const handleEditSchedule = async (schedule) => {
  isEdit.value = true
  const startTime = formatTime(schedule.startTime)
  const endTime = formatTime(schedule.endTime)
  
  // 如果是景点类型，先获取景点详情并等待结果
  if (schedule.scheduleType === 1 && schedule.destinationId) {
    try {
      searchLoading.value = true
      const { code, data } = await searchDestinationsAPI(schedule.title)
      if (code === 0 && data) {
        destinationOptions.value = data
      }
    } catch (error) {
      console.error('获取景点详情失败:', error)
    } finally {
      searchLoading.value = false
    }
  }

  // 等待搜索结果后再设置表单数据
  scheduleForm.value = {
    id: schedule.id,
    scheduleType: schedule.scheduleType,
    destinationId: schedule.destinationId || null,
    transportType: schedule.transportType || 1,
    transportTime: schedule.transportTime || 30,
    transportCost: schedule.transportCost || 0,
    timeRange: [startTime, endTime],
    title: schedule.title,
    location: schedule.location,
    description: schedule.description,
    estimatedCost: schedule.estimatedCost || 0
  }

  dialogVisible.value = true
}

// 删除日程
const handleDeleteSchedule = async (schedule) => {
  try {
    await ElMessageBox.confirm('确定要删除该日程安排吗？', '提示', {
      type: 'warning'
    })
    const { code, message } = await deleteScheduleAPI(props.tripId, schedule.id)
    if (code === 0) {
      ElMessage.success('删除成功')
      loadSchedules()
    } else {
      throw new Error(message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 提交日程表单
const submitScheduleForm = async () => {
  if (!scheduleFormRef.value) return
  
  try {
    await scheduleFormRef.value.validate()
    
    const currentDate = getDateByIndex(currentDay.value)
    
    const scheduleData = {
      dayIndex: currentDay.value,
      scheduleType: scheduleForm.value.scheduleType,
      startTime: `${currentDate}T${scheduleForm.value.timeRange[0]}:00`,
      endTime: `${currentDate}T${scheduleForm.value.timeRange[1]}:00`,
      title: scheduleForm.value.title,
      location: scheduleForm.value.location,
      description: scheduleForm.value.description,
      estimatedCost: scheduleForm.value.estimatedCost
    }

    // 如果是景点类型,添加景点相关信息
    if (scheduleForm.value.scheduleType === 1) {
      scheduleData.destinationId = scheduleForm.value.destinationId
      scheduleData.transportType = scheduleForm.value.transportType
      scheduleData.transportTime = scheduleForm.value.transportTime
      scheduleData.transportCost = scheduleForm.value.transportCost
    }

    let result
    if (isEdit.value) {
      result = await updateScheduleAPI(props.tripId, scheduleForm.value.id, scheduleData)
    } else {
      result = await createScheduleAPI(props.tripId, scheduleData)
    }

    if (result.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
      loadSchedules()
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    ElMessage.error(error.message || (isEdit.value ? '更新失败' : '添加失败'))
  }
}

// 添加新的响应式数据
const tripName = computed(() => props.tripName || '未命名行程')

// 添加新的方法
const handleBatchAdd = () => {
  // TODO: 实现批量添加功能
}

const handleExport = () => {
  // TODO: 实现导出功能
}

// 添加计算时长的方法
const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return ''
  
  // 提取时间部分
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

// 获取日程类型的样式类
const getScheduleTypeClass = (type) => {
  const typeMap = {
    1: 'type-sight',
    2: 'type-meal',
    3: 'type-rest',
    4: 'type-transport'
  }
  return typeMap[type] || ''
}

// 目的地相关数据和方法
const dayDestinations = ref({})
const dragging = ref(false)

// 加载目的地数据
const loadDayDestinations = async (dayIndex) => {
  try {
    const { code, data } = await getDayDestinationsAPI(props.tripId, dayIndex)
    if (code === 0) {
      dayDestinations.value[dayIndex] = data
    }
  } catch (error) {
    console.error('加载目的地数据失败:', error)
  }
}

// 处理拖拽排序
const handleDrag = async ({ dragged, target }) => {
  if (!dragged || !target) return
  
  try {
    await updateVisitOrderAPI(props.tripId, dragged.id, target.visitOrder)
    await loadDayDestinations(currentDay.value)
    ElMessage.success('更新游览顺序成功')
  } catch (error) {
    ElMessage.error('更新游览顺序失败')
  }
}

// 优化路线
const handleOptimizeRoute = async (dayIndex) => {
  try {
    const { code, data } = await getRecommendRouteAPI(props.tripId, dayIndex)
    if (code === 0) {
      dayDestinations.value[dayIndex] = data
      ElMessage.success('路线优化成功')
    }
  } catch (error) {
    ElMessage.error('路线优化失败')
  }
}

// 监听当前天数变化
watch(currentDay, (newDay) => {
  loadDayDestinations(newDay)
})

onMounted(() => {
  loadSchedules()
  loadDayDestinations(currentDay.value)
})

// 添加交通方式相关的工具方法
const getTransportTypeText = (type) => {
  const typeMap = {
    1: '步行',
    2: '公交',
    3: '地铁',
    4: '出租',
    5: '自驾'
  }
  return typeMap[type] || '未知'
}

const getTransportTypeTag = (type) => {
  const typeMap = {
    1: 'info',     // 步行
    2: 'warning',  // 公交
    3: 'primary',  // 地铁
    4: 'success',  // 出租
    5: 'danger'    // 自驾
  }
  return typeMap[type] || ''
}

const getTransportTypeIcon = (type) => {
  const typeMap = {
    1: 'Walk',      // 步行图标
    2: 'Bus',       // 公交图标
    3: 'Train',     // 地铁图标
    4: 'Car',       // 出租图标
    5: 'Van'        // 自驾图标
  }
  return typeMap[type] || 'More'
}

// 添加目的地相关方法
const handleAddDestination = async (dayIndex) => {
  try {
    // 获取当天的日期
    const currentDate = getDateByIndex(dayIndex)
    
    const destinationData = {
      destinationId: null, // 需要从目的地选择对话框获取
      dayIndex: dayIndex,
      visitOrder: dayDestinations.value[dayIndex]?.length + 1 || 1,
      // 修改时间格式为ISO格式
      startTime: `${currentDate}T09:00:00`,
      endTime: `${currentDate}T11:00:00`,
      transportType: 1,
      transportTime: 30,
      transportCost: 0,
      notes: ''
    }
    
    // TODO: 打开目的地选择对话框
    // const selectedDestination = await openDestinationDialog()
    // destinationData.destinationId = selectedDestination.id
    
    const { code, message } = await addDestinationAPI(props.tripId, destinationData)
    if (code === 0) {
      ElMessage.success('添加目的地成功')
      await loadDayDestinations(dayIndex)
    } else {
      throw new Error(message)
    }
  } catch (error) {
    ElMessage.error(error.message || '添加目的地失败')
  }
}

// 添加目的地编辑对话框
const destinationDialogVisible = ref(false)
const destinationForm = ref({
  destinationId: null,
  visitOrder: 1,
  timeRange: [],
  transportType: 1,
  transportTime: 30,
  transportCost: 0,
  notes: ''
})

// 目的地表单验证规则
const destinationRules = {
  timeRange: [{ required: true, message: '请选择时间', trigger: 'change' }],
  transportType: [{ required: true, message: '请选择交通方式', trigger: 'change' }],
  transportTime: [{ required: true, message: '请输入交通时间', trigger: 'blur' }]
}

// 提交目的地表单
const submitDestinationForm = async () => {
  if (!destinationFormRef.value) return
  
  try {
    await destinationFormRef.value.validate()
    
    // 获取当天的日期
    const currentDate = getDateByIndex(currentDay.value)
    
    const destinationData = {
      ...destinationForm.value,
      dayIndex: currentDay.value,
      // 修改时间格式为ISO格式
      startTime: `${currentDate}T${destinationForm.value.timeRange[0]}:00`,
      endTime: `${currentDate}T${destinationForm.value.timeRange[1]}:00`
    }
    delete destinationData.timeRange

    let result
    if (isEdit.value) {
      result = await updateDestinationAPI(props.tripId, destinationForm.value.id, destinationData)
    } else {
      result = await addDestinationAPI(props.tripId, destinationData)
    }

    if (result.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
      destinationDialogVisible.value = false
      await loadDayDestinations(currentDay.value)
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    ElMessage.error(error.message || (isEdit.value ? '更新失败' : '添加失败'))
  }
}

const handleEditDestination = async (destination) => {
  // TODO: 实现编辑目的地功能
}

const handleRemoveDestination = async (destination) => {
  try {
    await ElMessageBox.confirm('确定要删除该景点吗？', '提示', {
      type: 'warning'
    })
    
    const { code, message } = await deleteDestinationAPI(props.tripId, destination.id)
    if (code === 0) {
      ElMessage.success('删除成功')
      await loadDayDestinations(currentDay.value)
    } else {
      throw new Error(message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 添加日程拖拽相关方法
const handleDragSchedule = async ({ dragged, target }) => {
  if (!dragged || !target) return
  
  try {
    // 获取当前日期
    const currentDate = getDateByIndex(currentDay.value)
    
    // 准备更新数据
    const updateData = {
      dayIndex: currentDay.value,
      // 使用目标位置的时间
      startTime: `${currentDate}T${formatTime(target.startTime)}:00`,
      endTime: `${currentDate}T${formatTime(target.endTime)}:00`
    }

    // 调用更新接口
    const { code, message } = await updateScheduleAPI(props.tripId, dragged.id, updateData)
    if (code === 0) {
      ElMessage.success('更新日程顺序成功')
      await loadSchedules()
    } else {
      throw new Error(message)
    }
  } catch (error) {
    ElMessage.error(error.message || '更新日程顺序失败')
  }
}

// 修改日程卡片的拖拽指令参数
const getScheduleDragOptions = (schedule) => ({
  onDrag: handleDragSchedule,
  data: {
    id: schedule.id,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    dayIndex: currentDay.value
  }
})

// 景点搜索相关
const searchLoading = ref(false)
const destinationOptions = ref([])
const searchTimeout = ref(null)

// 优化搜索景点方法
const searchDestinations = async (query) => {
  // 移除最小长度限制，允许任意长度搜索
  if (!query) {
    destinationOptions.value = []
    return
  }
  
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = setTimeout(async () => {
    searchLoading.value = true
    try {
      const { code, data } = await searchDestinationsAPI(query)
      if (code === 0 && data) {
        destinationOptions.value = data
      }
    } catch (error) {
      console.error('搜索景点失败:', error)
      ElMessage.error('搜索景点失败')
    } finally {
      searchLoading.value = false
    }
  }, 200) // 减少延迟时间，提高响应速度
}

// 处理景点选择变化
const handleDestinationChange = (destinationId) => {
  if (!destinationId) {
    // 清空相关字段
    scheduleForm.value.title = ''
    scheduleForm.value.location = ''
    scheduleForm.value.description = ''
    scheduleForm.value.estimatedCost = 0
    return
  }

  const selectedDest = destinationOptions.value.find(
    item => item.destinationId === destinationId
  )
  if (selectedDest) {
    // 更新表单数据，保持原有字段
    scheduleForm.value = {
      ...scheduleForm.value,
      title: selectedDest.destination.name,
      location: selectedDest.destination.description,
      description: selectedDest.content,
      estimatedCost: selectedDest.destination.averageBudget || 0
    }
  }
}

// 处理类型变化
const handleTypeChange = (type) => {
  if (type !== 1) {
    scheduleForm.value.destinationId = null
    scheduleForm.value.transportType = null
    scheduleForm.value.transportTime = null
    scheduleForm.value.transportCost = null
  }
}

// 添加合并日程和景点的计算属性
const mergedSchedules = computed(() => {
  const schedules = (schedulesByDay.value[currentDay.value] || []).map(item => ({
    ...item,
    type: 'schedule'
  }))
  
  const destinations = (dayDestinations.value[currentDay.value] || []).map(item => ({
    ...item,
    type: 'destination'
  }))
  
  return [...schedules, ...destinations].sort((a, b) => {
    return dayjs(`1970-01-01T${formatTime(a.startTime)}`).diff(dayjs(`1970-01-01T${formatTime(b.startTime)}`))
  })
})

// 统一的类型处理方法
const getItemTypeTag = (item) => {
  if (item.type === 'destination') {
    return getTransportTypeTag(item.transportType)
  }
  return getScheduleTypeTag(item.scheduleType)
}

const getItemTypeText = (item) => {
  if (item.type === 'destination') {
    return '景点游览'
  }
  return getScheduleTypeText(item.scheduleType)
}

const getItemClass = (item) => {
  return {
    'destination-card': item.type === 'destination',
    [getScheduleTypeClass(item.scheduleType)]: item.type === 'schedule'
  }
}

const getItemDragOptions = (item) => {
  if (item.type === 'destination') {
    return {
      onDrag: handleDragDestination,
      data: { id: item.id, visitOrder: item.visitOrder, type: 'destination' }
    }
  }
  return getScheduleDragOptions(item)
}
</script>

<style lang="scss" scoped>
.trip-schedule {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);

  .schedule-header {
    padding: 16px 24px;
    border-bottom: 1px solid var(--el-border-color-light);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--el-bg-color);
    z-index: 1;

    .schedule-title {
      font-size: 18px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }

  .schedule-content {
    flex: 1;
    display: flex;
    overflow: hidden;

    .day-navigator {
      width: 200px;
      border-right: 1px solid var(--el-border-color-light);
      background-color: var(--el-bg-color-page);

      .day-list {
        padding: 16px 0;

        .day-item {
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          gap: 4px;

          &:hover {
            background-color: var(--el-fill-color-light);
          }

          &.active {
            background-color: var(--el-color-primary-light-9);
            color: var(--el-color-primary);
            font-weight: 500;
          }

          .day-number {
            font-size: 16px;
          }

          .day-date {
            font-size: 13px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }

    .schedule-detail {
      flex: 1;
      overflow: hidden;
      background-color: var(--el-bg-color-page);

      .day-schedule {
        padding: 24px;

        .day-header {
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;

          .header-info {
            h3 {
              margin: 0;
              font-size: 20px;
              color: var(--el-text-color-primary);
            }

            .date-info {
              margin-top: 4px;
              font-size: 14px;
              color: var(--el-text-color-secondary);
            }
          }
        }

        .schedule-timeline {
          .schedule-card {
            margin-bottom: 16px;
            transition: all 0.3s;
            cursor: move;

            &:hover {
              transform: translateY(-2px);
              box-shadow: var(--el-box-shadow-light);
            }

            &.destination-card {
              border-left: 4px solid var(--el-color-success);
            }

            &.type-meal {
              border-left: 4px solid var(--el-color-warning);
            }

            &.type-rest {
              border-left: 4px solid var(--el-color-info);
            }

            &.type-transport {
              border-left: 4px solid var(--el-color-primary);
            }
          }
        }
      }
    }
  }
}

// 响应式布局
@media screen and (max-width: 768px) {
  .trip-schedule {
    .schedule-content {
      flex-direction: column;

      .day-navigator {
        width: 100%;
        height: auto;
        border-right: none;
        border-bottom: 1px solid var(--el-border-color-light);

        .day-list {
          display: flex;
          padding: 8px;
          overflow-x: auto;

          .day-item {
            padding: 8px 16px;
            flex-shrink: 0;
          }
        }
      }
    }
  }
}

.destination-option {
  padding: 8px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .destination-name {
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  .destination-rating {
    font-size: 13px;
    color: #ff9900;
  }
}

.unit {
  margin-left: 8px;
  color: var(--el-text-color-regular);
}
</style> 