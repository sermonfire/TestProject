<template>
  <div class="trip-schedule">
    <!-- 添加顶部导航栏 -->
    <div class="schedule-header">
      <div class="header-left">
        <el-page-header @back="$emit('back')" :title="tripName">
          <template #content>
            <span class="schedule-title">日程安排</span>
          </template>
        </el-page-header>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button type="primary" @click="handleBatchAdd">
            <el-icon><Plus /></el-icon>批量添加
          </el-button>
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>导出日程
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="schedule-content">
      <!-- 左侧日期导航 -->
      <div class="date-nav">
        <el-scrollbar>
          <div 
            v-for="day in totalDays" 
            :key="day"
            class="date-item"
            :class="{ active: currentDay === day }"
            @click="currentDay = day"
          >
            <span class="day-number">Day {{ day }}</span>
            <span class="day-date">{{ formatDate(getDateByIndex(day)) }}</span>
          </div>
        </el-scrollbar>
      </div>

      <!-- 右侧日程详情 -->
      <div class="schedule-detail">
        <el-scrollbar>
          <div class="day-schedule">
            <div class="day-header">
              <div class="header-info">
                <h3>第 {{ currentDay }} 天</h3>
                <span class="date-info">{{ formatDate(getDateByIndex(currentDay)) }}</span>
              </div>
              <div class="header-actions">
                <el-button type="primary" @click="handleAddSchedule(currentDay)">
                  <el-icon><Plus /></el-icon>添加安排
                </el-button>
              </div>
            </div>

            <div v-if="schedulesByDay[currentDay]?.length" class="schedule-list">
              <div 
                v-for="(schedule, index) in schedulesByDay[currentDay]" 
                :key="schedule.id"
                class="schedule-item"
              >
                <!-- 时间线 -->
                <div class="time-line">
                  <div class="time">{{ formatTime(schedule.startTime) }}</div>
                  <div class="line" :class="getScheduleTypeClass(schedule.scheduleType)"></div>
                  <div class="time">{{ formatTime(schedule.endTime) }}</div>
                </div>

                <!-- 日程卡片 -->
                <el-card 
                  shadow="hover" 
                  :class="['schedule-card', getScheduleTypeClass(schedule.scheduleType)]"
                >
                  <div class="card-header">
                    <div class="title-area">
                      <el-tag 
                        :type="getScheduleTypeTag(schedule.scheduleType)"
                        size="small"
                        class="type-tag"
                      >
                        {{ getScheduleTypeText(schedule.scheduleType) }}
                      </el-tag>
                      <h4>{{ schedule.title }}</h4>
                    </div>
                    <div class="duration">
                      {{ calculateDuration(schedule.startTime, schedule.endTime) }}
                    </div>
                  </div>

                  <div class="card-content">
                    <template v-if="schedule.location">
                      <div class="info-item">
                        <el-icon><Location /></el-icon>
                        <span>{{ schedule.location }}</span>
                      </div>
                    </template>
                    
                    <template v-if="schedule.description">
                      <div class="info-item description">
                        <el-icon><Document /></el-icon>
                        <span>{{ schedule.description }}</span>
                      </div>
                    </template>

                    <template v-if="schedule.estimatedCost">
                      <div class="info-item">
                        <el-icon><Money /></el-icon>
                        <span>预计费用: ¥{{ schedule.estimatedCost }}</span>
                      </div>
                    </template>
                  </div>

                  <div class="card-actions">
                    <el-button-group>
                      <el-button 
                        type="primary" 
                        link 
                        @click="handleEditSchedule(schedule)"
                      >
                        <el-icon><Edit /></el-icon>编辑
                      </el-button>
                      <el-button 
                        type="danger" 
                        link 
                        @click="handleDeleteSchedule(schedule)"
                      >
                        <el-icon><Delete /></el-icon>删除
                      </el-button>
                    </el-button-group>
                  </div>
                </el-card>
              </div>
            </div>
            <el-empty v-else description="暂无安排" />
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
        <el-form-item label="安排类型" prop="scheduleType">
          <el-select v-model="scheduleForm.scheduleType">
            <el-option label="景点游览" :value="1" />
            <el-option label="用餐" :value="2" />
            <el-option label="休息" :value="3" />
            <el-option label="交通" :value="4" />
          </el-select>
        </el-form-item>

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
        <el-button type="primary" @click="submitScheduleForm">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Location, Plus, Download, Document, 
  Money, Edit, Delete 
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { 
  getScheduleListAPI,
  createScheduleAPI,
  updateScheduleAPI,
  deleteScheduleAPI,
  getDaySchedulesAPI
} from '@/api/scheduleApi'

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
  timeRange: [],
  title: '',
  location: '',
  description: '',
  estimatedCost: 0
})

const scheduleRules = {
  scheduleType: [{ required: true, message: '请选择安排类型', trigger: 'change' }],
  timeRange: [{ required: true, message: '请选择时间', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

// 添加日程
const handleAddSchedule = (dayIndex) => {
  isEdit.value = false
  currentDay.value = dayIndex
  scheduleForm.value = {
    scheduleType: 1,
    timeRange: [],
    title: '',
    location: '',
    description: '',
    estimatedCost: 0
  }
  dialogVisible.value = true
}

// 编辑日程
const handleEditSchedule = (schedule) => {
  isEdit.value = true
  currentDay.value = schedule.dayIndex
  
  // 提取时间部分
  const startTime = schedule.startTime.includes('T') 
    ? schedule.startTime.split('T')[1].substring(0, 5)
    : schedule.startTime
  const endTime = schedule.endTime.includes('T')
    ? schedule.endTime.split('T')[1].substring(0, 5)
    : schedule.endTime
  
  scheduleForm.value = {
    id: schedule.id,
    scheduleType: schedule.scheduleType,
    timeRange: [startTime, endTime],
    title: schedule.title,
    location: schedule.location,
    description: schedule.description,
    estimatedCost: schedule.estimatedCost
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
    
    // 获取当天的日期
    const currentDate = getDateByIndex(currentDay.value)
    
    const scheduleData = {
      dayIndex: currentDay.value,
      scheduleType: scheduleForm.value.scheduleType,
      // 组合日期和时间
      startTime: `${currentDate}T${scheduleForm.value.timeRange[0]}:00`,
      endTime: `${currentDate}T${scheduleForm.value.timeRange[1]}:00`,
      title: scheduleForm.value.title,
      location: scheduleForm.value.location,
      description: scheduleForm.value.description,
      estimatedCost: scheduleForm.value.estimatedCost
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

onMounted(() => {
  loadSchedules()
})
</script>

<style lang="scss" scoped>
.trip-schedule {
  height: calc(100vh - 84px); // 减去顶部导航栏的高度
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);

  .schedule-header {
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--el-border-color-light);
    background-color: #fff;

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

    .date-nav {
      width: 200px;
      border-right: 1px solid var(--el-border-color-light);
      background-color: #fff;

      .date-item {
        padding: 16px;
        cursor: pointer;
        border-bottom: 1px solid var(--el-border-color-lighter);
        transition: all 0.3s;

        &:hover {
          background-color: var(--el-fill-color-light);
        }

        &.active {
          background-color: var(--el-color-primary-light-9);
          border-right: 2px solid var(--el-color-primary);
        }

        .day-number {
          display: block;
          font-weight: 500;
          color: var(--el-text-color-primary);
        }

        .day-date {
          display: block;
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-top: 4px;
        }
      }
    }

    .schedule-detail {
      flex: 1;
      background-color: #fff;
      
      .day-schedule {
        padding: 20px;

        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--el-border-color-light);

          .header-info {
            h3 {
              margin: 0;
              font-size: 20px;
              color: var(--el-text-color-primary);
            }

            .date-info {
              font-size: 14px;
              color: var(--el-text-color-secondary);
              margin-top: 4px;
            }
          }
        }

        .schedule-list {
          padding: 0 12px;

          .schedule-item {
            display: flex;
            margin-bottom: 20px;

            .time-line {
              width: 100px;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding-right: 20px;

              .time {
                font-size: 14px;
                color: var(--el-text-color-secondary);
                padding: 4px 0;
              }

              .line {
                flex: 1;
                width: 2px;
                background-color: var(--el-border-color);
                margin: 4px 0;

                &.type-sight { background-color: var(--el-color-success); }
                &.type-meal { background-color: var(--el-color-warning); }
                &.type-rest { background-color: var(--el-color-info); }
                &.type-transport { background-color: var(--el-color-primary); }
              }
            }

            .schedule-card {
              flex: 1;
              border-radius: 8px;
              transition: all 0.3s ease;

              &.type-sight { border-left: 4px solid var(--el-color-success); }
              &.type-meal { border-left: 4px solid var(--el-color-warning); }
              &.type-rest { border-left: 4px solid var(--el-color-info); }
              &.type-transport { border-left: 4px solid var(--el-color-primary); }

              .card-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 12px;

                .title-area {
                  display: flex;
                  align-items: center;
                  gap: 8px;

                  h4 {
                    margin: 0;
                    font-size: 16px;
                    color: var(--el-text-color-primary);
                  }

                  .type-tag {
                    font-size: 12px;
                  }
                }

                .duration {
                  font-size: 12px;
                  color: var(--el-text-color-secondary);
                  background-color: var(--el-fill-color-light);
                  padding: 2px 8px;
                  border-radius: 4px;
                }
              }

              .card-content {
                .info-item {
                  display: flex;
                  align-items: flex-start;
                  gap: 8px;
                  margin-bottom: 8px;
                  color: var(--el-text-color-regular);
                  font-size: 14px;

                  .el-icon {
                    margin-top: 3px;
                    color: var(--el-text-color-secondary);
                  }

                  &.description {
                    white-space: pre-wrap;
                  }
                }
              }

              .card-actions {
                display: flex;
                justify-content: flex-end;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid var(--el-border-color-lighter);

                .el-button {
                  padding: 4px 8px;
                  
                  .el-icon {
                    margin-right: 4px;
                  }
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