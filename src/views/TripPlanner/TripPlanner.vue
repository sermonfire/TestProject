<template>
  <div class="trip-planner">
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
      <div class="trip-list" v-if="trips.length">
        <el-card v-for="trip in trips" 
                 :key="trip.id" 
                 class="trip-card"
                 :body-style="{ padding: '0px' }">
          <div class="trip-info">
            <h3>{{ trip.name }}</h3>
            <p class="trip-date">{{ formatDateRange(trip.startDate, trip.endDate) }}</p>
            <p class="trip-desc">{{ trip.description }}</p>
          </div>
          <div class="trip-actions">
            <el-button-group>
              <el-button type="primary" @click="editTrip(trip)">编辑</el-button>
              <el-button type="danger" @click="deleteTrip(trip)">删除</el-button>
            </el-button-group>
          </div>
        </el-card>
      </div>
      
      <!-- 空状态 -->
      <el-empty v-else description="暂无行程计划" />
    </div>

    <!-- 新建/编辑行程对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑行程' : '新建行程'"
      width="50%">
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
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import TripForm from './components/TripForm.vue'
import { useTripStore } from '@/stores/tripStore'
import dayjs from 'dayjs'

const tripStore = useTripStore()
const trips = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentTrip = ref(null)

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
    destinations: []
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
    await loadTrips()
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
    await loadTrips()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 加载行程列表
const loadTrips = async () => {
  try {
    trips.value = await tripStore.getTrips()
  } catch (error) {
    ElMessage.error('加载行程失败')
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

  .trip-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .trip-card {
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
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