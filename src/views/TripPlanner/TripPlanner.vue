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
            <TripForm v-if="dialogVisible" :trip="formTrip" @submit="handleTripSubmit"
                @cancel="dialogVisible = false" />
        </el-dialog>

        <!-- 日程安排对话框 -->
        <TripScheduleDialog v-model="scheduleDialogVisible" :trip="selectedTrip" :schedules="selectedTripSchedules"
            :loading="loading" @add="handleAddSchedule" @edit="handleEditSchedule" @delete="handleDeleteSchedule"
            @deleteAll="handleDeleteAllSchedule" />

        <!-- 位置信息悬浮展示 -->
        <LocationDisplay />
    </div>
</template>

<script setup>
import { ref, onMounted, computed, } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import TripForm from './components/TripForm.vue'
import { useTripStore } from '@/stores/tripStore'
import TripCard from './components/TripCard.vue'
import LocationDisplay from './components/LocationDisplay.vue'
import TripScheduleDialog from './components/TripScheduleDialog.vue'

const tripStore = useTripStore()
const trips = ref([])

const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formTrip = ref(null)

/**
 * @description 当前选中的行程基本信息（用于日程管理）
 * @type {Ref<{
 *   id: number,
 *   name: string,
 *   startDate: string,
 *   endDate: string,
 *   description: string,
 *   totalBudget: number
 * }>}
 */
const selectedTrip = ref(null)

/**
 * @description 当前选中行程的所有日程安排列表
 * @type {Ref<Array<{
 *   id: number,
 *   dayIndex: number,
 *   title: string,
 *   description: string,
 *   startTime: string,
 *   endTime: string,
 *   location: string,
 *   estimatedCost: number,
 *   scheduleType: number
 * }>>}
 */
const selectedTripSchedules = ref([])

// 添加分页相关的响应式数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const scheduleDialogVisible = ref(false)

// 创建新行程
const createNewTrip = () => {
    isEdit.value = false
    formTrip.value = {
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
    formTrip.value = {
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
const handleStatusChange = async (trip, newStatus) => {
    try {
        // 更新目标行程状态
        await tripStore.updateTripStatus(trip.id, newStatus)
        ElMessage.success('状态更新成功')
        await loadTrips()
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('状态更新失败')
        }
    }
}

// 加载行程列表
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

// 计算当前进行中的行程
const currentOngoingTrip = computed(() => {
    if (!trips.value?.length) return null
    return trips.value.find(trip => trip.status === 1) || null
})

// 查看日程
const viewSchedule = async (trip) => {
    try {
        loading.value = true
        // 获取指定行程的所有日程安排
        const result = await tripStore.getTripSchedules(trip.id)
        // 设置当前选中的行程
        selectedTrip.value = trip
        // 设置当前选中的行程的所有日程数据
        selectedTripSchedules.value = result
        // 最后显示日程安排对话框
        scheduleDialogVisible.value = true
    } catch (error) {
        console.error('查看日程失败:', error)
        ElMessage.error('查看日程失败')
    } finally {
        loading.value = false
    }
}

// 添加日程
const handleAddSchedule = async (data) => {
    try {
        loading.value = true
        // 创建日程
        await tripStore.createSchedule(selectedTrip.value.id, data)
        ElMessage.success('添加日程成功')
        // 重新加载日程数据
        const result = await tripStore.getTripSchedules(selectedTrip.value.id, true)
        selectedTripSchedules.value = result
    } catch (error) {
        console.error('添加日程失败:', error)
        ElMessage.error(error.message || '添加日程失败')
    } finally {
        loading.value = false
    }
}

// 编辑日程
const handleEditSchedule = async (schedule) => {
    try {
        loading.value = true
        // 更新日程
        await tripStore.updateSchedule(selectedTrip.value.id, schedule.id, schedule)
        ElMessage.success('更新日程成功')
        // 重新加载日程数据
        const result = await tripStore.getTripSchedules(selectedTrip.value.id, true)
        selectedTripSchedules.value = result
    } catch (error) {
        console.error('更新日程失败:', error)
        ElMessage.error(error.message || '更新日程失败')
    } finally {
        loading.value = false
    }
}

// 删除日程
const handleDeleteSchedule = async (schedule) => {
    try {
        loading.value = true
        // 删除日程
        await tripStore.deleteSchedule(selectedTrip.value.id, schedule.id)
        ElMessage.success('删除日程成功')
        // 重新加载日程数据
        const result = await tripStore.getTripSchedules(selectedTrip.value.id, true)
        selectedTripSchedules.value = result
    } catch (error) {
        console.error('删除日程失败:', error)
        ElMessage.error(error.message || '删除日程失败')
    } finally {
        loading.value = false
    }
}

// 删除所有日程
const handleDeleteAllSchedule = async () => {
    try {
        loading.value = true
        // 删除所有日程
        await tripStore.deleteAllSchedules(selectedTrip.value.id)
        ElMessage.success('删除所有日程成功')
        // 重新加载日程数据
        const result = await tripStore.getTripSchedules(selectedTrip.value.id, true)
        selectedTripSchedules.value = result
    } catch (error) {
        console.error('删除所有日程失败:', error)
        ElMessage.error(error.message || '删除所有日程失败')
    } finally {
        loading.value = false
    }
}


onMounted(async () => {
    try {
        await loadTrips() // 加载行程列表
        // 确保trips加载完成后再获取日程数据
        if (trips.value?.length) {
            const promises = trips.value
                .filter(trip => trip.status === 1)//只获取进行中行程的日程数据
                .map(trip => tripStore.getTripSchedules(trip.id))
            await Promise.all(promises) // 并行获取所有进行中行程的日程数据
        }
    } catch (error) {
        console.error('初始化数据失败:', error)
        ElMessage.error('初始化数据失败')
    }
})
</script>

<style lang="scss" scoped>
.trip-planner {
    padding: 20px;
    user-select: none;
    height: 100vh;
    background-color: #fff;
    position: relative;

    :deep(.el-dialog) {
        margin: 0vh auto !important;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .planner-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
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
        margin-bottom: 80px;
    }
}
</style>