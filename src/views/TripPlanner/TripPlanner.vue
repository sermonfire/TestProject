<template>
  <div class="trip-planner">
    <!-- 面包屑导航 -->
    <Breadcrumb />
    
    <div class="planner-header">
      <h2>行程规划</h2>
      <div class="actions">
        <el-button type="primary" @click="createNewTrip">
          <el-icon><Plus /></el-icon>新建行程
        </el-button>
      </div>
    </div>

    <div class="planner-content">
      <!-- 行程列表 -->
      <el-row v-loading="loading" :gutter="20">
        <el-col v-if="trips.length" :xs="24" :sm="12" :md="8" :lg="6" 
                v-for="trip in trips" :key="trip.id">
          <el-card class="trip-card" :body-style="{ padding: '0px' }">
            <div class="trip-status" :class="getStatusClass(trip.status)">
              {{ getStatusText(trip.status) }}
            </div>
            <div class="trip-info">
              <h3>{{ trip.name }}</h3>
              <p class="trip-date">{{ formatDateRange(trip.startDate, trip.endDate) }}</p>
              <p class="trip-desc">{{ trip.description || '暂无描述' }}</p>
              <p class="trip-budget" v-if="trip.totalBudget">
                预算: ¥{{ trip.totalBudget }}
              </p>
            </div>
            <div class="trip-actions">
              <el-button-group>
                <el-button type="primary" @click="editTrip(trip)" :icon="Edit">
                  编辑
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
      <el-empty v-if="!trips.length && !loading" description="暂无行程计划">
        <el-button type="primary" @click="createNewTrip">立即创建</el-button>
      </el-empty>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import TripForm from './components/TripForm.vue'
import { useTripStore } from '@/stores/tripStore'
import dayjs from 'dayjs'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb.vue'

const tripStore = useTripStore()
const trips = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentTrip = ref(null)

// 获取行程状态文本
const getStatusText = (status) => {
  const statusMap = {
    0: '规划中',
    1: '已完成',
    2: '已归档'
  }
  return statusMap[status] || '未知状态'
}

// 获取状态样式类
const getStatusClass = (status) => {
  const statusClassMap = {
    0: 'planning',
    1: 'completed',
    2: 'archived'
  }
  return statusClassMap[status] || ''
}

// 格式化日期范围
const formatDateRange = (start, end) => {
  return `${dayjs(start).format('YYYY-MM-DD')} 至 ${dayjs(end).format('YYYY-MM-DD')}`
}

// 创建新行程
const createNewTrip = () => {
  isEdit.value = false
  currentTrip.value = {
    name: '',
    startDate: '',
    endDate: '',
    description: '',
    totalBudget: 0,
    status: 0
  }
  dialogVisible.value = true
}

// 编辑行程
const editTrip = (trip) => {
  isEdit.value = true
  currentTrip.value = { ...trip }
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

// 加载行程列表
const loadTrips = async () => {
  loading.value = true
  try {
    trips.value = await tripStore.getTrips()
  } catch (error) {
    ElMessage.error('加载行程失败')
  } finally {
    loading.value = false
  }
}

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
    }

    .trip-info {
      padding: 20px;

      h3 {
        margin: 0 0 10px;
        font-size: 18px;
        color: #303133;
      }

      .trip-date {
        color: #909399;
        font-size: 14px;
        margin: 5px 0;
      }

      .trip-desc {
        color: #606266;
        font-size: 14px;
        margin: 10px 0;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }

      .trip-budget {
        color: #f56c6c;
        font-size: 14px;
        margin: 5px 0;
      }
    }

    .trip-actions {
      padding: 10px 20px;
      border-top: 1px solid #EBEEF5;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style> 