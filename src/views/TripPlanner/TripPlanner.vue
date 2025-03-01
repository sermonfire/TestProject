<template>
    <div class="trip-planner">
        <div class="planner-header">
            <div class="planner-header-left">
                <h2>行程规划</h2>
            </div>
            <div class="planner-header-right">
                <el-button type="primary" @click="createNewTrip">新建行程</el-button>
            </div>
        </div>
        <div class="planner-content">
            <!-- 行程列表 -->
            <el-row v-loading="loading" :gutter="20">
                <el-col v-if="trips?.length" :xs="24" :sm="12" :md="8" :lg="6" v-for="trip in trips" :key="trip.id">
                    <TripCard :trip="trip" :has-ongoing-trip="!!currentOngoingTrip" @status-change="handleStatusChange"
                        @edit="editTrip" @view-schedule="viewSchedule" @delete="deleteTrip" />
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

        <!-- 位置信息悬浮展示 -->
        <LocationDisplay />
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import TripForm from './components/TripForm.vue'
import { useTripStore } from '@/stores/tripStore'
import dayjs from 'dayjs'
import TripCard from './components/TripCard.vue'
import LocationDisplay from './components/LocationDisplay.vue'

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
const scheduleDialogVisible = ref(false)

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
        if (status === 2 && currentOngoingTrip.value) {
            await ElMessageBox.confirm(
                '当前已有其他行程正在进行中，是否结束其他行程并开始当前行程？',
                '提示',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )
            await tripStore.updateTripStatus(currentOngoingTrip.value.id, 1)
        }
        await tripStore.updateTripStatus(trip.id, status)
        ElMessage.success('状态更新成功')
        await loadTrips()
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('状态更新失败')
        }
    }
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

// 计算当前进行的行程
const currentOngoingTrip = computed(() => {
    if (!trips.value?.length) return null
    const now = dayjs()
    return trips.value.find(trip =>
        trip.status === 2 && // 进行中状态
        now.isAfter(dayjs(trip.startDate)) &&
        now.isBefore(dayjs(trip.endDate))
    ) || null
})


// 查看日程方法
const viewSchedule = async (trip) => {
    try {
        currentTrip.value = trip
        scheduleDialogVisible.value = true
        // 确保在打开对话框时重新获取日程数据
        if (trip?.id) {
            await tripStore.fetchTodaySchedules(trip.id)
        }
    } catch (error) {
        console.error('查看日程失败:', error)
        ElMessage.error('查看日程失败')
    }
}

// 替换为新的 watch，只关注数据刷新
watch(() => Array.from(tripStore.todaySchedulesMap), () => {
    if (currentTrip.value?.id) {
        tripStore.fetchTodaySchedules(currentTrip.value.id)
    }
}, { deep: true })

onMounted(async () => {
    await loadTrips()
    // 获取所有进行中行程的日程数据
    trips.value.forEach(trip => {
        if (trip.status === 2) {
            tripStore.fetchTodaySchedules(trip.id)
        }
    })
})
</script>

<style lang="scss" scoped>
.trip-planner {
    padding: 20px;
    user-select: none;

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
}
</style>