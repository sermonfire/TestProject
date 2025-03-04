<template>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑日程' : '添加日程'" width="50%" destroy-on-close
        :append-to-body="true" :close-on-click-modal="true" class="schedule-form-dialog">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="schedule-form">
            <el-form-item label="日程类型" prop="scheduleType">
                <el-select v-model="form.scheduleType" placeholder="请选择日程类型">
                    <el-option v-for="(type, id) in SCHEDULE_TYPES" :key="id" :label="type.label" :value="Number(id)">
                        <el-icon>
                            <component :is="type.icon" />
                        </el-icon>
                        <span>{{ type.label }}</span>
                    </el-option>
                </el-select>
            </el-form-item>

            <!-- 当日程类型为景点游览时，展示这个表单项 -->
            <el-form-item label="前往目的地" v-if="form.scheduleType === 1" prop="destinationId">
                <el-input v-model="form.destinationName" placeholder="请选择目的地" readonly
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

            <el-form-item label="日程标题" prop="title">
                <el-input v-model="form.title" placeholder="请输入日程标题" />
            </el-form-item>

            <el-form-item label="时间范围" prop="timeRange">
                <el-time-picker v-model="form.timeRange" is-range range-separator="至" start-placeholder="开始时间"
                    end-placeholder="结束时间" format="HH:mm" value-format="HH:mm" />
            </el-form-item>

            <el-form-item label="地点" prop="location">
                <el-input v-model="form.location" placeholder="请输入地点">
                    <template #prefix>
                        <el-icon>
                            <Location />
                        </el-icon>
                    </template>
                </el-input>
            </el-form-item>

            <el-form-item label="预计花费" prop="estimatedCost">
                <el-input-number v-model="form.estimatedCost" :min="0" :max="999999" :precision="2" :step="10"
                    :controls="true" placeholder="请输入预计花费">
                    <template #prefix>¥</template>
                </el-input-number>
            </el-form-item>

            <el-form-item label="描述" prop="description">
                <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入日程描述" />
            </el-form-item>
        </el-form>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit">确定</el-button>
            </span>
        </template>
    </el-dialog>
    <!-- 目的地选择器组件 -->
    <DestinationSelector v-model="showDestinationSelector" @select="handleDestinationSelect" :append-to-body="true" />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Location, CircleClose } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import DestinationSelector from './DestinationSelector.vue'

const showDestinationSelector = ref(false)

/**
 * @typedef {Object} ScheduleType
 * @property {string} label - 类型标签
 * @property {string} type - 类型样式
 * @property {string} tagType - 标签样式
 * @property {string} icon - 图标名称
 * @property {string} [defaultStartTime] - 默认开始时间
 * @property {string} [defaultEndTime] - 默认结束时间
 */

/**
 * @type {Object.<number, ScheduleType>}
 */
const SCHEDULE_TYPES = {
    1: {
        label: '景点游览',
        type: 'primary',
        tagType: 'primary',
        icon: 'Location',
        defaultStartTime: '09:00',
        defaultEndTime: '11:00'
    },
    2: {
        label: '用餐',
        type: 'success',
        tagType: 'success',
        icon: 'Food',
        defaultStartTime: '12:00',
        defaultEndTime: '13:00'
    },
    3: {
        label: '交通',
        type: 'warning',
        tagType: 'warning',
        icon: 'Van',
        defaultStartTime: '08:00',
        defaultEndTime: '09:00'
    },
    4: {
        label: '住宿',
        type: 'info',
        tagType: 'info',
        icon: 'House',
        defaultStartTime: '20:00',
        defaultEndTime: '08:00'
    },
    5: {
        label: '其他',
        type: 'default',
        tagType: 'info',
        icon: 'More',
        defaultStartTime: '14:00',
        defaultEndTime: '16:00'
    }
}

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    schedule: {
        type: Object,
        default: () => null
    },
    date: {
        type: String,
        required: true
    },
    dayIndex: {
        type: Number,
        required: true
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue', 'submit'])

// 表单引用
const formRef = ref(null)

// 对话框可见性
const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// 是否为编辑模式
const isEdit = computed(() => !!props.schedule)

// 表单数据
const form = ref({
    scheduleType: 1,
    title: '',
    timeRange: null,
    location: '',
    estimatedCost: null,
    description: '',
    destinationId: null,  // 新增：目的地ID
    destinationName: ''   // 新增：目的地名称
})

/**
 * 根据日程类型获取默认时间范围
 * @param {number} type - 日程类型ID
 * @returns {[string, string]} 默认时间范围
 */
const getDefaultTimeRange = (type) => {
    const scheduleType = SCHEDULE_TYPES[type]
    return [scheduleType.defaultStartTime, scheduleType.defaultEndTime]
}

// 监听日程类型变化，自动设置默认时间范围
watch(() => form.value.scheduleType, (newType) => {
    if (!form.value.timeRange) {
        form.value.timeRange = getDefaultTimeRange(newType)
    }
})

/**
 * 处理目的地选择
 * @param {{ id: number, name: string }} destination - 选中的目的地
 */
const handleDestinationSelect = (destination) => {
    form.value.destinationId = destination.id
    form.value.destinationName = destination.name
    form.value.title = `游览${destination.name}`  // 自动填充标题
    form.value.location = destination.name        // 自动填充地点
    showDestinationSelector.value = false
}

/**
 * 显示目的地选择器
 */
const handleShowDestinationSelector = (event) => {
    if (!props.loading) {
        event.preventDefault()  // 阻止默认行为
        showDestinationSelector.value = true
    }
}

/**
 * 清除已选择的目的地
 */
const clearDestination = () => {
    form.value.destinationId = null
    form.value.destinationName = ''
    // 如果标题是自动生成的，也清除
    if (form.value.title.startsWith('游览')) {
        form.value.title = ''
    }
    // 如果地点是自动填充的，也清除
    if (form.value.location === form.value.destinationName) {
        form.value.location = ''
    }
}

// 监听日程类型变化，重置目的地相关字段
watch(() => form.value.scheduleType, (newType) => {
    if (newType !== 1) {
        form.value.destinationId = null
        form.value.destinationName = ''
    }
})

// 表单校验规则
const rules = {
    scheduleType: [
        { required: true, message: '请选择日程类型', trigger: 'submit' },
        { type: 'number', message: '日程类型必须为数字', trigger: 'submit' }
    ],
    title: [
        { required: true, message: '请输入日程标题', trigger: 'submit' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'submit' },
        { pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\s-]+$/, message: '标题只能包含中文、英文、数字、空格和连字符', trigger: 'submit' }
    ],
    timeRange: [
        { required: true, message: '请选择时间范围', trigger: 'submit' },
        {
            validator: (rule, value, callback) => {
                if (!value) {
                    callback()
                    return
                }
                const [start, end] = value
                if (start >= end && form.value.scheduleType !== 4) { // 住宿类型允许跨天
                    callback(new Error('结束时间必须大于开始时间'))
                    return
                }
                // 检查时间格式
                const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/
                if (!timePattern.test(start) || !timePattern.test(end)) {
                    callback(new Error('时间格式不正确'))
                    return
                }
                callback()
            },
            trigger: 'submit'
        }
    ],
    location: [
        { required: true, message: '请输入地点', trigger: 'submit' },
        { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'submit' }
    ],
    estimatedCost: [
        { required: true, message: '请输入预计花费', trigger: 'submit' },
        {
            validator: (rule, value, callback) => {
                if (value === null || value === undefined) {
                    callback(new Error('请输入预计花费'))
                    return
                }
                const cost = Number(value)
                if (isNaN(cost)) {
                    callback(new Error('预计花费必须为数字'))
                    return
                }
                if (cost < 0 || cost > 999999) {
                    callback(new Error('预计花费必须在 0-999999 之间'))
                    return
                }
                callback()
            },
            trigger: 'submit'
        }
    ],
    description: [
        { max: 500, message: '描述不能超过 500 个字符', trigger: 'submit' }
    ],
    destinationId: [
        {
            validator: (rule, value, callback) => {
                if (form.value.scheduleType === 1 && !value) {
                    callback(new Error('请选择目的地'))
                    return
                }
                callback()
            },
            trigger: 'submit'
        }
    ]
}

// 监听编辑数据变化
watch(
    () => props.schedule,
    (schedule) => {
        if (schedule) {
            form.value = {
                scheduleType: schedule.scheduleType,
                title: schedule.title,
                timeRange: [
                    dayjs(schedule.startTime).format('HH:mm'),
                    dayjs(schedule.endTime).format('HH:mm')
                ],
                location: schedule.location || '',
                estimatedCost: schedule.estimatedCost !== null ? Number(schedule.estimatedCost) : null,
                description: schedule.description || '',
                destinationId: schedule.destinationId,
                destinationName: schedule.destinationName || ''
            }
        } else {
            const defaultType = 1
            form.value = {
                scheduleType: defaultType,
                title: '',
                timeRange: getDefaultTimeRange(defaultType),
                location: '',
                estimatedCost: null,
                description: '',
                destinationId: null,
                destinationName: ''
            }
        }
    },
    { immediate: true }
)

/**
 * 格式化日期时间为ISO 8601格式
 * @param {string} date - 日期
 * @param {string} time - 时间
 * @returns {string} 格式化后的日期时间
 */
const formatDateTime = (date, time) => {
    return dayjs(`${date} ${time}`).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
    if (!formRef.value) return

    try {
        await formRef.value.validate()

        const [startTime, endTime] = form.value.timeRange
        const scheduleData = {
            ...form.value,
            startTime: formatDateTime(props.date, startTime),
            endTime: form.value.scheduleType === 4
                ? formatDateTime(dayjs(props.date).add(1, 'day').format('YYYY-MM-DD'), endTime)
                : formatDateTime(props.date, endTime),
            dayIndex: props.dayIndex,
            estimatedCost: form.value.estimatedCost !== null ? Number(form.value.estimatedCost.toFixed(2)) : 0
        }

        // 如果是编辑模式，保留原有ID
        if (isEdit.value) {
            scheduleData.id = props.schedule.id
        }

        // 删除timeRange字段
        delete scheduleData.timeRange

        // 如果描述为空，则设置为null
        if (!scheduleData.description) {
            scheduleData.description = null
        }

        await emit('submit', scheduleData)
        dialogVisible.value = false
        ElMessage.success({
            message: isEdit.value ? '日程已更新' : '日程已添加',
            type: 'success',
            duration: 2000
        })
    } catch (error) {
        console.error('表单验证失败:', error)
        if (error.estimatedCost) {
            ElMessage.error({
                message: error.estimatedCost[0].message || '预计花费验证失败',
                duration: 2000
            })
        } else {
            ElMessage.error({
                message: error.message || '请检查表单填写是否正确',
                duration: 2000
            })
        }
    }
}

// 监听loading状态，禁用/启用表单
watch(() => props.loading, (newValue) => {
    if (formRef.value) {
        formRef.value.disabled = newValue
    }
})
</script>

<style lang="scss" scoped>
:deep(.el-dialog) {
    margin: 0 !important;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-height: 90vh;
    border-radius: 8px;
    overflow: hidden;

    .el-dialog__header {
        padding: 20px 24px;
        margin: 0;
        border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .el-dialog__body {
        padding: 0;
        max-height: calc(90vh - 180px);
        overflow-y: auto;

        &::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        &::-webkit-scrollbar-thumb {
            border-radius: 3px;
            background-color: var(--el-border-color-darker);
        }

        &::-webkit-scrollbar-track {
            border-radius: 3px;
            background-color: var(--el-border-color-light);
        }
    }
}

.schedule-form {
    margin: 20px;

    :deep(.el-select) {
        width: 100%;
    }

    :deep(.el-time-picker) {
        width: 100%;
    }

    :deep(.el-input-number) {
        width: 180px;
    }

    .el-icon {
        margin-right: 8px;
        vertical-align: middle;
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    margin-top: 20px;
}
</style>
