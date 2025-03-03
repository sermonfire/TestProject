<template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="trip-form">

        <el-form-item label="行程名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入行程名称" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="行程日期" prop="dateRange">
            <el-date-picker v-model="form.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
                end-placeholder="结束日期" :disabled-date="disabledDate" value-format="YYYY-MM-DD"
                :shortcuts="dateShortcuts" @change="handleDateChange" style="width: 100%" />
            <div class="form-tip" v-if="form.dateRange?.length === 2">
                <el-icon>
                    <InfoFilled />
                </el-icon>
                <span>行程共 {{ calculateDays(form.dateRange) }} 天</span>
            </div>
        </el-form-item>

        <el-form-item label="行程描述" prop="description">
            <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入行程描述" maxlength="500"
                show-word-limit />
        </el-form-item>

        <el-form-item label="总预算" prop="totalBudget">
            <el-input-number v-model="form.totalBudget" :min="0" :precision="2" :step="100" placeholder="请输入预算金额"
                style="width: 200px" />
            <div class="form-tip" v-if="form.totalBudget && form.dateRange?.length === 2">
                <el-icon>
                    <InfoFilled />
                </el-icon>
                <span>平均每天预算 ¥{{ calculateDailyBudget(form.totalBudget, form.dateRange) }}</span>
            </div>
        </el-form-item>

        <el-form-item>
            <div class="form-actions">
                <el-button @click="$emit('cancel')">取消</el-button>
                <el-button type="primary" @click="submitForm" :loading="submitting">
                    {{ submitting ? '提交中...' : '确定' }}
                </el-button>
            </div>
        </el-form-item>
    </el-form>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { searchDestinationsAPI } from '@/api/tripApi'

// 扩展 dayjs 以支持时区处理
dayjs.extend(utc)
dayjs.extend(timezone)

const props = defineProps({
    trip: {
        type: Object,
        default: () => ({})
    }
})

const emit = defineEmits(['submit', 'cancel'])

const formRef = ref(null)
const loading = ref(false)
const destinationOptions = ref([])

// 表单数据
const form = reactive({
    name: props.trip.name || '',
    dateRange: props.trip.startDate && props.trip.endDate
        ? [props.trip.startDate, props.trip.endDate]
        : [],
    description: props.trip.description || '',
    destinations: props.trip.destinations || [],
    totalBudget: props.trip.totalBudget || 0
})

// 表单验证规则
const rules = {
    name: [
        { required: true, message: '请输入行程名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    dateRange: [
        { type: 'array', required: true, message: '请选择行程日期', trigger: 'change' }
    ],
    description: [
        { max: 500, message: '描述不能超过500个字符', trigger: 'blur' }
    ],
    destinations: [],
    totalBudget: [
        { type: 'number', min: 0, message: '预算不能小于0', trigger: 'change' }
    ]
}

// 禁用日期
const disabledDate = (time) => {
    // 只允许选择今天及以后的日期
    return time.getTime() < Date.now() - 8.64e7 // 8.64e7 是一天的毫秒数
}

// 日期快捷选项
const dateShortcuts = [
    {
        text: '下周',
        value: () => {
            const start = new Date()
            const end = new Date()
            start.setTime(start.getTime() + 3600 * 1000 * 24 * 7)  // 7天后
            end.setTime(end.getTime() + 3600 * 1000 * 24 * 14)    // 14天后
            return [start, end]
        },
    },
    {
        text: '下个月',
        value: () => {
            const start = new Date()
            const end = new Date()
            start.setTime(start.getTime() + 3600 * 1000 * 24 * 30)  // 30天后
            end.setTime(end.getTime() + 3600 * 1000 * 24 * 37)     // 37天后
            return [start, end]
        },
    },
    {
        text: '三个月后',
        value: () => {
            const start = new Date()
            const end = new Date()
            start.setTime(start.getTime() + 3600 * 1000 * 24 * 90)  // 90天后
            end.setTime(end.getTime() + 3600 * 1000 * 24 * 97)     // 97天后
            return [start, end]
        },
    },
]

// 处理日期变化
const handleDateChange = (val) => {
    if (val) {
        // 确保日期范围有效
        if (dayjs(val[0]).isAfter(val[1])) {
            ElMessage.warning('开始日期不能晚于结束日期')
            form.dateRange = []
            return
        }

        // 检查日期范围是否超过一年
        const diffDays = dayjs(val[1]).diff(dayjs(val[0]), 'day')
        if (diffDays > 365) {
            ElMessage.warning('行程时间不能超过一年')
            form.dateRange = []
            return
        }
    }
}

// 格式化日期时间
const formatDateTime = (datetime) => {
    if (!datetime) return ''
    return dayjs(datetime).format('YYYY-MM-DD')
}

// 搜索目的地
const searchDestinations = async (query) => {
    if (query) {
        loading.value = true
        try {
            const res = await searchDestinationsAPI(query)
            if (res.code === 0 && res.data) {
                destinationOptions.value = res.data.map(item => ({
                    value: item.id,
                    label: item.destination?.name
                }))
            }
        } catch (error) {
            ElMessage.error('搜索目的地失败')
        } finally {
            loading.value = false
        }
    } else {
        destinationOptions.value = []
    }
}

// 添加计算天数的方法
const calculateDays = (dateRange) => {
    if (!dateRange || dateRange.length !== 2) return 0
    return dayjs(dateRange[1]).diff(dateRange[0], 'day') + 1
}

// 计算每日预算
const calculateDailyBudget = (total, dateRange) => {
    if (!total || !dateRange || dateRange.length !== 2) return 0
    const days = calculateDays(dateRange)
    return (total / days).toFixed(2)
}

// 添加提交状态
const submitting = ref(false)

// 修改提交方法
const submitForm = async () => {
    if (!formRef.value) return

    try {
        await formRef.value.validate()
        submitting.value = true

        const tripData = {
            id: props.trip.id,
            name: form.name.trim(),
            startDate: form.dateRange[0],
            endDate: form.dateRange[1],
            description: form.description.trim(),
            totalBudget: Number(form.totalBudget),
            destinations: form.destinations
        }

        emit('submit', tripData)
    } catch (error) {
        console.error('表单验证失败:', error)
    } finally {
        submitting.value = false
    }
}

// 监听 trip 属性变化
watch(() => props.trip, (newTrip) => {
    form.name = newTrip.name || ''
    // 处理日期范围
    form.dateRange = newTrip.startDate && newTrip.endDate
        ? [
            formatDateTime(newTrip.startDate),
            formatDateTime(newTrip.endDate)
        ]
        : []
    form.description = newTrip.description || ''
    form.destinations = newTrip.destinations || []
    form.totalBudget = newTrip.totalBudget || 0
}, { deep: true })

// 初始化目的地选项
onMounted(async () => {
    if (form.destinations.length) {
        try {
            // TODO: 调用获取目的地详情API
            const res = await getDestinationsDetailAPI(form.destinations)
            destinationOptions.value = res.data.map(item => ({
                value: item.id,
                label: item.name
            }))
        } catch (error) {
            ElMessage.error('加载目的地信息失败')
        }
    }
})
</script>

<style lang="scss" scoped>
.trip-form {
    padding: 24px;
    background: #fff;
    border-radius: 12px;

    .form-tip,
    .destination-option {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }

    :deep(.el-form-item) {
        margin-bottom: 24px;

        .el-form-item__label {
            font-weight: 500;
        }

        .el-input__wrapper,
        .el-textarea__inner {
            &:hover {
                box-shadow: 0 0 0 1px var(--el-color-primary) inset;
            }
        }

        .el-input__count {
            background: transparent;
        }
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
    }
}

@media screen and (max-width: 768px) {
    .trip-form {
        padding: 16px;

        .form-actions {
            flex-direction: column;
            gap: 8px;

            .el-button {
                width: 100%;
            }
        }
    }
}
</style>