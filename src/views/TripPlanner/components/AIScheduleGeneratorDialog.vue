<template>
    <div v-if="visible" class="custom-dialog-overlay" @click.self="handleClose">
        <div class="custom-dialog">
            <!-- 标题栏 -->
            <div class="custom-dialog-header">
                <h2 class="custom-dialog-title">AI行程规划</h2>
                <el-button class="close-btn" @click="handleClose" type="default" text>
                    <el-icon>
                        <Close />
                    </el-icon>
                </el-button>
            </div>

            <div class="ai-generator-content">
                <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="ai-generator-form">
                    <!-- 行程信息展示区域 -->
                    <div class="trip-info-section">
                        <h3>行程基本信息</h3>
                        <div class="trip-info-content">
                            <div class="info-item">
                                <span class="label">行程名称:</span>
                                <span class="value">{{ tripInfo.name }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">行程时间:</span>
                                <span class="value">{{ formatDate(tripInfo.startDate) }} 至
                                    {{ formatDate(tripInfo.endDate) }}</span>
                            </div>
                            <div class="info-item" v-if="tripInfo.description">
                                <span class="label">行程描述:</span>
                                <span class="value">{{ tripInfo.description }}</span>
                            </div>
                            <div class="info-item" v-if="tripInfo.totalBudget">
                                <span class="label">总预算:</span>
                                <span class="value">¥{{ tripInfo.totalBudget }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 目的地选择 -->
                    <el-form-item label="目的地" prop="destinationId">
                        <el-input v-model="form.destinationName" placeholder="请选择收藏目的地" readonly
                            @click="handleShowDestinationSelector">
                            <template #prefix>
                                <el-icon>
                                    <Location />
                                </el-icon>
                            </template>
                            <template #suffix v-if="form.destinationId">
                                <el-icon class="clear-icon" @click.stop="clearDestination">
                                    <CircleClose />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>

                    <!-- 日程类型 -->
                    <el-form-item label="日程类型" prop="scheduleType">
                        <el-select v-model="form.scheduleType" placeholder="请选择日程类型">
                            <el-option v-for="(type, id) in SCHEDULE_TYPES" :key="id" :label="type.label"
                                :value="Number(id)">
                                <el-icon>
                                    <component :is="type.icon" />
                                </el-icon>
                                <span>{{ type.label }}</span>
                            </el-option>
                        </el-select>
                    </el-form-item>

                    <!-- 备注信息 -->
                    <el-form-item label="备注" prop="remark">
                        <el-input v-model="form.remark" type="textarea" :rows="3"
                            placeholder="请输入额外需求或偏好，例如：希望包含当地特色美食、避免人多的景点等" />
                    </el-form-item>

                    <!-- 是否直接添加到日程 -->
                    <el-form-item>
                        <el-switch v-model="form.addToSchedule" active-text="生成后直接添加到日程" inactive-text="仅生成预览" />
                    </el-form-item>
                </el-form>
            </div>

            <!-- 底部按钮 -->
            <div class="custom-dialog-footer">
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="loading">
                    <el-icon v-if="!loading">
                        <Star />
                    </el-icon>
                    {{ loading ? '生成中...' : '开始生成' }}
                </el-button>
            </div>
        </div>
    </div>

    <!-- 目的地选择器组件 -->
    <Teleport to="body">
        <DestinationSelector v-model="showDestinationSelector" @select="handleDestinationSelect" />
    </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Location, CircleClose, Close, Star } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import DestinationSelector from './DestinationSelector.vue'
import { getAItripGenerateAPI } from '@/api/AIchatAPI'

/**
 * @typedef {Object} ScheduleType
 * @property {string} label - 类型标签
 * @property {string} type - 类型样式
 * @property {string} tagType - 标签样式
 * @property {string} icon - 图标名称
 */

/**
 * @type {Object.<number, ScheduleType>}
 */
const SCHEDULE_TYPES = {
    1: {
        label: '景点游览',
        type: 'primary',
        tagType: 'primary',
        icon: 'Location'
    },
    2: {
        label: '用餐',
        type: 'success',
        tagType: 'success',
        icon: 'Food'
    },
    3: {
        label: '交通',
        type: 'warning',
        tagType: 'warning',
        icon: 'Van'
    },
    4: {
        label: '住宿',
        type: 'info',
        tagType: 'info',
        icon: 'House'
    },
    5: {
        label: '其他',
        type: 'default',
        tagType: 'info',
        icon: 'More'
    }
}

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    tripInfo: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['update:modelValue', 'update:loading', 'generated'])

// 表单引用
const formRef = ref(null)

// 对话框可见性
const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// 加载状态
const loading = ref(false)

// 目的地选择器状态
const showDestinationSelector = ref(false)

// 格式化日期
const formatDate = (date) => {
    return dayjs(date).format('YYYY-MM-DD')
}

// 初始化表单数据
const form = ref({
    tripId: props.tripInfo?.id,
    tripName: props.tripInfo?.name,
    tripDescription: props.tripInfo?.description || '',
    tripStartDate: props.tripInfo?.startDate,
    tripEndDate: props.tripInfo?.endDate,
    tripBudget: props.tripInfo?.totalBudget || 0,
    destinationId: null,
    destinationName: '',
    scheduleType: 1, // 默认为景点游览
    remark: '',
    addToSchedule: true // 默认生成后直接添加到日程
})

// 表单校验规则
const rules = {
    destinationId: [
        { required: true, message: '请选择目的地', trigger: 'submit' }
    ],
    scheduleType: [
        { required: true, message: '请选择日程类型', trigger: 'submit' }
    ]
}

/**
 * 处理目的地选择
 * @param {{ id: number, name: string }} destination - 选中的目的地
 */
const handleDestinationSelect = (destination) => {
    form.value.destinationId = destination.id
    form.value.destinationName = destination.name
    showDestinationSelector.value = false
}

/**
 * 显示目的地选择器
 */
const handleShowDestinationSelector = () => {
    if (!loading.value) {
        showDestinationSelector.value = true
    }
}

/**
 * 清除已选择的目的地
 */
const clearDestination = () => {
    form.value.destinationId = null
    form.value.destinationName = ''
}

/**
 * 处理关闭对话框
 */
const handleClose = () => {
    if (loading.value) {
        ElMessage.warning('正在生成中，请稍候...')
        return
    }
    emit('update:modelValue', false)
}

/**
 * 处理表单提交
 */
const handleSubmit = async () => {
    if (loading.value) return

    try {
        await formRef.value.validate()

        loading.value = true
        emit('update:loading', true)

        // 准备请求数据
        const requestData = {
            tripId: form.value.tripId,
            tripName: form.value.tripName,
            tripDescription: form.value.tripDescription,
            tripStartDate: form.value.tripStartDate,
            tripEndDate: form.value.tripEndDate,
            tripDestination: form.value.destinationName,
            tripDestinationId: form.value.destinationId,
            scheduleType: form.value.scheduleType,
            tripBudget: form.value.tripBudget,
            remark: form.value.remark
        }

        // 调用AI生成接口
        const response = await getAItripGenerateAPI(requestData)

        if (response.code === 0 && response.data && response.data.schedules) {
            ElMessage.success('行程生成成功')

            emit('generated', {
                schedules: response.data.schedules,
                addToSchedule: form.value.addToSchedule
            })

            emit('update:modelValue', false)
        } else {
            ElMessage.error(response.message || '生成失败，请重试')
        }
    } catch (error) {
        console.error('生成行程失败:', error)
        ElMessage.error('表单验证失败或生成过程中出错')
    } finally {
        loading.value = false
        emit('update:loading', false)
    }
}
</script>

<style lang="scss" scoped>
.custom-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2999;
}

.custom-dialog {
    width: 60%;
    max-width: 800px;
    background: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    animation: dialog-fade-in 0.3s ease-out;
}

.custom-dialog-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    display: flex;
    align-items: center;
    justify-content: space-between;

    .custom-dialog-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
    }

    .close-btn {
        padding: 8px;
        font-size: 20px;
        color: var(--el-text-color-secondary);
        transition: all 0.3s ease;

        &:hover {
            color: var(--el-text-color-primary);
            transform: rotate(90deg);
        }
    }
}

.ai-generator-content {
    padding: 24px;
    overflow-y: auto;
    flex: 1;

    .trip-info-section {
        margin-bottom: 24px;
        background-color: var(--el-fill-color-light);
        border-radius: 8px;
        padding: 16px;

        h3 {
            margin-top: 0;
            margin-bottom: 16px;
            font-size: 16px;
            font-weight: 600;
            color: var(--el-text-color-primary);
        }

        .trip-info-content {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 12px;

            .info-item {
                display: flex;
                align-items: baseline;

                .label {
                    font-weight: 500;
                    color: var(--el-text-color-secondary);
                    margin-right: 8px;
                    flex-shrink: 0;
                }

                .value {
                    color: var(--el-text-color-primary);
                    word-break: break-word;
                }
            }
        }
    }

    .ai-generator-form {
        .el-form-item {
            margin-bottom: 20px;
        }

        .clear-icon {
            color: var(--el-text-color-secondary);
            cursor: pointer;
            transition: color 0.3s;

            &:hover {
                color: var(--el-color-danger);
            }
        }
    }
}

.custom-dialog-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-bg-color);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    flex-shrink: 0; // 防止底部按钮被压缩
}

@keyframes dialog-fade-in {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
