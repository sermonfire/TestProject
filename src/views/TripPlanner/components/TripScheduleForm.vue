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

            <el-form-item label="日程标题" prop="title">
                <el-input v-model="form.title" placeholder="请输入日程标题" />
            </el-form-item>

            <el-form-item label="时间范围" prop="timeRange">
                <div class="time-range-wrapper">
                    <!-- 快捷时间选择 -->
                    <div class="time-quick-select" v-if="DEFAULT_TIME_RANGES[form.scheduleType]?.variants">
                        <el-radio-group v-model="selectedTimeVariant" @change="handleTimeVariantChange">
                            <el-radio-button v-for="(variant, index) in DEFAULT_TIME_RANGES[form.scheduleType].variants"
                                :key="index" :value="index">
                                {{ variant.label }}
                            </el-radio-button>
                        </el-radio-group>
                    </div>

                    <!-- 时间选择器 -->
                    <el-time-picker v-model="form.timeRange" is-range range-separator="至" start-placeholder="开始时间"
                        end-placeholder="结束时间" format="HH:mm" value-format="HH:mm" :disabled="loading" />
                </div>
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
    <Teleport to="body">
        <DestinationSelector v-model="showDestinationSelector" @select="handleDestinationSelect" />
    </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Location, CircleClose } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import DestinationSelector from './DestinationSelector.vue'

// 扩展 dayjs 以支持时区处理
dayjs.extend(utc)
dayjs.extend(timezone)

// 设置默认时区为本地时区
const localTimezone = dayjs.tz.guess()

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

// 1. 首先定义默认时间范围配置
const DEFAULT_TIME_RANGES = {
    1: { // 景点游览
        variants: [
            { value: ['09:00', '11:00'], label: '上午' },
            { value: ['14:00', '16:00'], label: '下午' },
            { value: null, label: '其他时间' }
        ]
    },
    2: { // 用餐
        variants: [
            { value: ['07:30', '08:30'], label: '早餐' },
            { value: ['12:00', '13:00'], label: '午餐' },
            { value: ['18:00', '19:00'], label: '晚餐' },
            { value: null, label: '其他时间' }
        ]
    },
    3: { // 交通
        variants: [
            { value: ['08:00', '09:00'], label: '上午出发' },
            { value: ['14:00', '15:00'], label: '下午出发' },
            { value: ['20:00', '21:00'], label: '晚上出发' },
            { value: null, label: '其他时间' }
        ]
    },
    4: { // 住宿
        variants: [
            { value: ['20:00', '08:00'], label: '标准住宿' },
            { value: ['22:00', '09:00'], label: '晚休' },
            { value: null, label: '其他时间' }
        ]
    },
    5: { // 其他
        variants: [
            { value: ['10:00', '11:00'], label: '上午' },
            { value: ['14:00', '15:00'], label: '下午' },
            { value: ['19:00', '20:00'], label: '晚上' },
            { value: null, label: '其他时间' }
        ]
    }
}

// 2. 定义获取推荐时间范围的函数
const getRecommendedTimeRange = (type) => {
    const variants = DEFAULT_TIME_RANGES[type]?.variants
    if (!variants?.length) return ['09:00', '10:00']

    const currentHour = dayjs().hour()

    if (type === 2) { // 用餐时间智能推荐
        if (currentHour < 10) return variants[0].value // 早餐
        if (currentHour < 15) return variants[1].value // 午餐
        return variants[2].value // 晚餐
    }

    if (type === 1) { // 景点游览时间智能推荐
        if (currentHour < 12) return variants[0].value // 上午
        return variants[1].value // 下午
    }

    return variants[0].value || ['09:00', '10:00']
}

// 3. 然后再定义初始化表单数据的函数
const initFormData = (type = 1) => ({
    scheduleType: type,
    title: '',
    timeRange: getRecommendedTimeRange(type),
    location: '',
    estimatedCost: null,
    description: '',
    destinationId: null,
    destinationName: ''
})

// 4. 最后再初始化表单数据
const form = ref(initFormData())

// 修改时间选择处理函数
const handleTimeVariantChange = (index) => {
    const variants = DEFAULT_TIME_RANGES[form.value.scheduleType]?.variants
    if (!variants || !variants[index]) return

    // 如果选择了"其他时间"，保持当前时间不变
    if (!variants[index].value) {
        return
    }

    // 设置选中的预设时间
    form.value.timeRange = variants[index].value
}

// 监听时间范围变化
watch(() => form.value.timeRange, (newTimeRange, oldTimeRange) => {
    if (!newTimeRange || !oldTimeRange) return

    // 检查是否是手动修改时间
    const isManualChange = JSON.stringify(newTimeRange) !== JSON.stringify(oldTimeRange)
    if (isManualChange) {
        const variants = DEFAULT_TIME_RANGES[form.value.scheduleType]?.variants
        if (!variants) return

        // 检查当前时间是否匹配任何预设选项
        const matchedVariantIndex = variants.findIndex(variant =>
            variant.value &&
            variant.value[0] === newTimeRange[0] &&
            variant.value[1] === newTimeRange[1]
        )

        // 如果没有匹配的预设选项，选中"其他时间"
        selectedTimeVariant.value = matchedVariantIndex === -1 ?
            variants.length - 1 : matchedVariantIndex
    }
}, { deep: true })

// 添加相关响应式变量和方法
const selectedTimeVariant = ref(null)

// 监听日程类型变化
watch(() => form.value.scheduleType, (newType) => {
    // 只在没有选择时间或创建新日程时设置默认时间
    if (!isEdit.value || !form.value.timeRange || !form.value.timeRange[0]) {
        const recommendedRange = getRecommendedTimeRange(newType)
        form.value.timeRange = recommendedRange
        selectedTimeVariant.value = 0 // 默认选中第一个时间选项
    }

    // 切换类型时清空目的地信息（仅当不是景点类型时）
    if (newType !== 1) {
        form.value.destinationId = null
        form.value.destinationName = ''
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
                if (!value || !Array.isArray(value)) {
                    callback(new Error('请选择时间范围'))
                    return
                }
                const [start, end] = value
                if (!start || !end) {
                    callback(new Error('请选择完整的时间范围'))
                    return
                }

                if (start >= end && form.value.scheduleType !== 4) {
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

// 监听对话框可见性变化
watch(dialogVisible, (visible) => {
    if (!visible) {
        // 关闭对话框时重置表单
        form.value = initFormData()
        selectedTimeVariant.value = null
        if (formRef.value) {
            formRef.value.resetFields()
        }
    }
})

// 监听编辑数据变化
watch(
    () => props.schedule,
    (schedule) => {
        if (schedule && dialogVisible.value) {  // 只在对话框打开时处理编辑数据
            form.value = {
                scheduleType: schedule.scheduleType,
                title: schedule.title,
                timeRange: [
                    schedule.startTime.substring(0, 5),
                    schedule.endTime.substring(0, 5)
                ],
                location: schedule.location || '',
                estimatedCost: schedule.estimatedCost !== null ? Number(schedule.estimatedCost) : null,
                description: schedule.description || '',
                destinationId: schedule.destinationId,
                destinationName: schedule.destinationName || ''
            }

            // 检查是否匹配预设时间
            const variants = DEFAULT_TIME_RANGES[schedule.scheduleType]?.variants
            if (variants) {
                const matchedVariantIndex = variants.findIndex(variant =>
                    variant.value &&
                    variant.value[0] === form.value.timeRange[0] &&
                    variant.value[1] === form.value.timeRange[1]
                )
                selectedTimeVariant.value = matchedVariantIndex === -1 ?
                    variants.length - 1 : matchedVariantIndex
            }
        } else if (!schedule && dialogVisible.value) {  // 新建日程时使用默认值
            form.value = initFormData()
            selectedTimeVariant.value = 0  // 默认选中第一个时间选项
        }
    },
    { immediate: true }
)

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
            // 如果是编辑模式，保留原有ID
            id: props.schedule?.id,
            // 直接使用 HH:mm:00 格式
            startTime: `${startTime}:00`,
            endTime: `${endTime}:00`,
            dayIndex: props.dayIndex,
            estimatedCost: form.value.estimatedCost !== null ?
                Number(form.value.estimatedCost.toFixed(2)) : 0
        }

        // 删除 timeRange 字段
        delete scheduleData.timeRange

        await emit('submit', scheduleData)
        dialogVisible.value = false
        ElMessage.success({
            message: isEdit.value ? '日程已更新' : '日程已添加',
            type: 'success',
            duration: 2000
        })
    } catch (error) {
        console.error('表单验证失败:', error)
        ElMessage.error(error.message || '请检查表单填写是否正确')
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

.time-range-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .time-quick-select {
        margin-bottom: 4px;

        :deep(.el-radio-group) {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        :deep(.el-radio-button__inner) {
            padding: 8px 16px;
            font-size: 14px;
            border-radius: 4px;
            height: auto;
            line-height: 1.5;
        }

        :deep(.el-radio-button:first-child .el-radio-button__inner) {
            border-radius: 4px;
        }

        :deep(.el-radio-button:last-child .el-radio-button__inner) {
            border-radius: 4px;
        }
    }

    :deep(.el-time-picker) {
        width: 100%;
    }
}
</style>
