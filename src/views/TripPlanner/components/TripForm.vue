<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    class="trip-form">
    
    <el-form-item label="行程名称" prop="name">
      <el-input v-model="form.name" placeholder="请输入行程名称" />
    </el-form-item>

    <el-form-item label="行程日期" prop="dateRange">
      <el-date-picker
        v-model="form.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :disabled-date="disabledDate"
        value-format="YYYY-MM-DD"
      />
    </el-form-item>

    <el-form-item label="行程描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="4"
        placeholder="请输入行程描述"
      />
    </el-form-item>

    <el-form-item label="总预算" prop="totalBudget">
      <el-input-number 
        v-model="form.totalBudget" 
        :min="0" 
        :precision="2" 
        :step="100"
        placeholder="请输入预算金额"
      />
    </el-form-item>

    <el-form-item label="目的地" prop="destinations">
      <el-select
        v-model="form.destinations"
        multiple
        filterable
        remote
        reserve-keyword
        placeholder="请输入关键词搜索目的地"
        :remote-method="searchDestinations"
        :loading="loading">
        <el-option
          v-for="item in destinationOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value">
        </el-option>
      </el-select>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm">确定</el-button>
      <el-button @click="$emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { searchDestinationsAPI } from '@/api/tripApi'

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
  return time.getTime() < Date.now() - 8.64e7 // 不能选择今天之前的日期
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
          label: item.name
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

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    const tripData = {
      id: props.trip.id,
      name: form.name,
      startDate: form.dateRange[0],
      endDate: form.dateRange[1],
      description: form.description,
      totalBudget: Number(form.totalBudget)
    }
    
    emit('submit', tripData)
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 监听trip属性变化
watch(() => props.trip, (newTrip) => {
  form.name = newTrip.name
  form.dateRange = newTrip.startDate && newTrip.endDate 
    ? [newTrip.startDate, newTrip.endDate] 
    : []
  form.description = newTrip.description
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
  padding: 20px;

  :deep(.el-date-editor) {
    width: 100%;
  }

  :deep(.el-select) {
    width: 100%;
  }
}
</style> 