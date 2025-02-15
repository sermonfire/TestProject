<template>
  <div class="location-display" :class="{ loading: isLoading }">
    <div class="location-card glass-effect">
      <!-- 标题栏 -->
      <div class="card-header">
        <el-icon><Location /></el-icon>
        <span class="title">当前位置</span>
        <el-button 
          class="refresh-btn"
          :loading="isLoading"
          circle
          @click="refreshLocation(true)"
        >
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>定位中...</span>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <el-icon><Warning /></el-icon>
        <span>{{ error }}</span>
        <el-button type="primary" size="small" @click="refreshLocation">
          重试
        </el-button>
      </div>

      <!-- 位置信息 -->
      <template v-else-if="locationStore.locationInfo">
        <div class="location-info">
          <div class="address">
            <p class="main-address">{{ locationStore.locationInfo.formatted_address }}</p>
            <p class="sub-address">
              {{ locationStore.locationInfo.province }} 
              {{ locationStore.locationInfo.city }} 
              {{ locationStore.locationInfo.district }}
            </p>
          </div>
          
          <!-- 周边信息 -->
          <div v-if="locationStore.locationInfo.pois?.length" class="nearby-places">
            <div class="section-title">
              <el-icon><Place /></el-icon>
              <span>周边地点</span>
            </div>
            <div class="places-list">
              <div 
                v-for="poi in locationStore.locationInfo.pois.slice(0, 3)" 
                :key="poi.id" 
                class="place-item"
              >
                <span class="place-name">{{ poi.name }}</span>
                <span class="place-distance">{{ formatDistance(poi.distance) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 无数据状态 -->
      <div v-else class="empty-state">
        <el-icon><LocationInformation /></el-icon>
        <span>暂无位置信息</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { 
  Location, 
  Refresh, 
  Loading, 
  Warning,
  Place,
  LocationInformation 
} from '@element-plus/icons-vue'
import { useLocationStore } from '@/stores/locationStore'
import { getCurrentPosition, getLocationInfo } from '@/utils/locationUtils'

const locationStore = useLocationStore()
const isLoading = ref(false)
const error = ref('')

// 添加位置更新时间间隔常量(5分钟)
const LOCATION_UPDATE_INTERVAL = 5 * 60 * 1000

/**
 * @description 检查是否需要更新位置
 * @param {Object} oldCoords 旧坐标
 * @param {Object} newCoords 新坐标
 * @param {boolean} forceUpdate 是否强制更新
 * @returns {boolean} 是否需要更新
 */
const shouldUpdateLocation = (oldCoords, newCoords, forceUpdate = false) => {
  // 如果强制更新,直接返回true
  if (forceUpdate) return true
  
  // 如果没有旧坐标,需要更新
  if (!oldCoords.longitude || !oldCoords.latitude) return true
  
  // 检查更新时间是否超过间隔
  const lastUpdateTime = locationStore.lastUpdateTime
  if (Date.now() - lastUpdateTime > LOCATION_UPDATE_INTERVAL) return true
  
  // 检查坐标是否发生显著变化(超过0.0001度,约10米)
  const longitudeDiff = Math.abs(oldCoords.longitude - newCoords.longitude)
  const latitudeDiff = Math.abs(oldCoords.latitude - newCoords.latitude)
  return longitudeDiff > 0.0001 || latitudeDiff > 0.0001
}

/**
 * @description 格式化距离
 * @param {string|number} distance 距离(米)
 * @returns {string} 格式化后的距离
 */
const formatDistance = (distance) => {
  const dist = Number(distance)
  if (dist >= 1000) {
    return `${(dist / 1000).toFixed(1)}km`
  }
  return `${dist}m`
}

/**
 * @description 刷新位置信息
 * @param {boolean} forceUpdate 是否强制更新
 */
const refreshLocation = async (forceUpdate = false) => {
  isLoading.value = true
  error.value = ''
  
  try {
    // 1. 获取新坐标
    const newCoords = await getCurrentPosition()
    
    // 2. 检查是否需要更新位置信息
    if (shouldUpdateLocation(locationStore.coordinates, newCoords, forceUpdate)) {
      // 更新坐标
      locationStore.setCoordinates(newCoords)
      
      // 获取并更新详细位置信息
      const locationInfo = await getLocationInfo(newCoords)
      locationStore.setLocationInfo(locationInfo)
      
      // 更新时间戳
      locationStore.setUpdateTime(Date.now())
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时获取位置
onMounted(() => {
  // 恢复已保存的位置信息
  locationStore.restoreLocation()
  
  // 如果没有位置信息或已过期,则获取新的位置
  if (!locationStore.coordinates.longitude || 
      !locationStore.coordinates.latitude ||
      Date.now() - locationStore.lastUpdateTime > LOCATION_UPDATE_INTERVAL) {
    refreshLocation()
  }
})

// 组件卸载前保存位置信息
onBeforeUnmount(() => {
  locationStore.saveLocation()
})
</script>

<style lang="scss" scoped>
.location-display {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;

  .location-card {
    padding: 16px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12);
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    
    .el-icon {
      font-size: 20px;
      color: var(--el-color-primary);
      margin-right: 8px;
    }

    .title {
      font-size: 16px;
      font-weight: 600;
      flex: 1;
    }

    .refresh-btn {
      padding: 8px;
    }
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: var(--el-text-color-secondary);
    
    .el-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
  }

  .error-state {
    color: var(--el-color-danger);
    
    .el-button {
      margin-top: 12px;
    }
  }

  .location-info {
    .address {
      margin-bottom: 16px;

      .main-address {
        font-size: 15px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin-bottom: 4px;
      }

      .sub-address {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }

    .nearby-places {
      .section-title {
        display: flex;
        align-items: center;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 12px;
        
        .el-icon {
          margin-right: 6px;
          color: var(--el-color-success);
        }
      }

      .places-list {
        .place-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 13px;
          border-bottom: 1px dashed var(--el-border-color-lighter);

          &:last-child {
            border-bottom: none;
          }

          .place-name {
            color: var(--el-text-color-primary);
            flex: 1;
            margin-right: 12px;
          }

          .place-distance {
            color: var(--el-text-color-secondary);
            font-size: 12px;
          }
        }
      }
    }
  }
}

// 毛玻璃效果
.glass-effect {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}
</style> 