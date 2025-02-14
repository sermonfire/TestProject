<template>
  <div class="weather-card glass-card">
    <div v-if="loading" class="loading-state">
      <el-icon class="icon-spin"><Loading /></el-icon>
      <span>获取天气信息中...</span>
    </div>
    
    <div v-else-if="error" class="error-state">
      <el-icon><Warning /></el-icon>
      <span>{{ error }}</span>
    </div>
    
    <template v-else>
      <!-- 实时天气 -->
      <div class="current-weather">
        <div class="weather-header">
          <h3>{{ weatherData.city }}实时天气</h3>
          <span class="report-time">{{ weatherData.reporttime }}</span>
        </div>
        
        <div class="weather-info">
          <div class="temperature">{{ weatherData.temperature }}°C</div>
          <div class="weather-desc">{{ weatherData.weather }}</div>
          <div class="weather-detail">
            <span>湿度: {{ weatherData.humidity }}%</span>
            <span>{{ weatherData.winddirection }} {{ weatherData.windpower }}</span>
          </div>
        </div>
      </div>
      
      <!-- 天气预报 -->
      <div v-if="forecast.length" class="weather-forecast">
        <h3>未来天气</h3>
        <div class="forecast-list">
          <div v-for="item in forecast" :key="item.date" class="forecast-item">
            <div class="date">{{ formatDate(item.date) }}</div>
            <div class="day-weather">
              <span>白天: {{ item.dayweather }}</span>
              <span>{{ item.daytemp }}°C</span>
            </div>
            <div class="night-weather">
              <span>夜间: {{ item.nightweather }}</span>
              <span>{{ item.nighttemp }}°C</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, Warning } from '@element-plus/icons-vue'
import { getCurrentWeatherAPI, getWeatherForecastAPI } from '@/api/weatherApi'
import dayjs from 'dayjs'

const props = defineProps({
  city: {
    type: String,
    required: true
  }
})

const loading = ref(true)
const error = ref('')
const weatherData = ref({})
const forecast = ref([])

/**
 * @description 格式化日期
 */
const formatDate = (date) => {
  return dayjs(date).format('MM/DD')
}

/**
 * @description 获取天气信息
 */
const fetchWeatherInfo = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // 获取实时天气
    const currentRes = await getCurrentWeatherAPI(props.city)
    if (currentRes.code === 0) {
      weatherData.value = currentRes.data
    }
    
    // 获取天气预报
    const forecastRes = await getWeatherForecastAPI(props.city)
    if (forecastRes.code === 0) {
      forecast.value = forecastRes.data
    }
  } catch (err) {
    console.error('获取天气信息失败:', err)
    error.value = '获取天气信息失败'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.city) {
    fetchWeatherInfo()
  }
})
</script>

<style scoped>
.weather-card {
  padding: 20px;
  margin: 15px 0;
}

.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
}

.icon-spin {
  animation: spin 1s linear infinite;
}

.weather-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.report-time {
  font-size: 0.9em;
  color: #666;
}

.weather-info {
  text-align: center;
  margin: 20px 0;
}

.temperature {
  font-size: 2.5em;
  font-weight: bold;
}

.weather-desc {
  font-size: 1.2em;
  margin: 10px 0;
}

.weather-detail {
  display: flex;
  justify-content: center;
  gap: 20px;
  color: #666;
}

.forecast-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.forecast-item {
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
}

.date {
  font-weight: bold;
  margin-bottom: 8px;
}

.day-weather,
.night-weather {
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style> 