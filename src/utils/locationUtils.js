/**
 * @description 位置相关工具函数
 */
import { getCurrentLocationAPI } from '@/api/locationApi'
import { ElMessage } from 'element-plus'

/**
 * @description WGS84 转 GCJ02
 * @param {number} lng WGS84经度
 * @param {number} lat WGS84纬度
 * @returns {Object} GCJ02坐标
 */
const transformWGS84ToGCJ02 = (lng, lat) => {
  if (outOfChina(lng, lat)) {
    return { lng, lat }
  }
  
  let dlat = transformlat(lng - 105.0, lat - 35.0)
  let dlng = transformlng(lng - 105.0, lat - 35.0)
  
  const radlat = lat / 180.0 * Math.PI
  let magic = Math.sin(radlat)
  magic = 1 - 0.00669342162296594323 * magic * magic
  const sqrtmagic = Math.sqrt(magic)
  
  dlat = (dlat * 180.0) / ((6378245.0 * (1 - 0.00669342162296594323)) / (magic * sqrtmagic) * Math.PI)
  dlng = (dlng * 180.0) / (6378245.0 / sqrtmagic * Math.cos(radlat) * Math.PI)
  
  const mglat = lat + dlat
  const mglng = lng + dlng
  
  return {
    longitude: mglng.toFixed(6),
    latitude: mglat.toFixed(6)
  }
}

/**
 * @description 判断是否在中国境内
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @returns {boolean}
 */
const outOfChina = (lng, lat) => {
  return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55)
}

const transformlat = (lng, lat) => {
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 
            0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(lat / 12.0 * Math.PI) + 320 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0
  return ret
}

const transformlng = (lng, lat) => {
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 
            0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0
  return ret
}

/**
 * @description 获取当前位置坐标
 * @returns {Promise<{longitude: string, latitude: string}>} 经纬度信息
 */
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理位置'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 获取到的是 WGS84 坐标,需要转换为 GCJ02
        const wgs84Coords = {
          longitude: position.coords.longitude,
          latitude: position.coords.latitude
        }
        
        // 转换为高德坐标系(GCJ02)
        const gcj02Coords = transformWGS84ToGCJ02(
          wgs84Coords.longitude,
          wgs84Coords.latitude
        )
        
        resolve(gcj02Coords)
      },
      (error) => {
        let message = '获取位置失败'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = '用户拒绝了位置请求'
            break
          case error.POSITION_UNAVAILABLE:
            message = '位置信息不可用'
            break
          case error.TIMEOUT:
            message = '获取位置超时'
            break
        }
        reject(new Error(message))
      },
      {
        enableHighAccuracy: true, // 高精度
        timeout: 5000,
        maximumAge: 0 // 禁用缓存
      }
    )
  })
}

/**
 * @description 获取位置详细信息
 * @param {Object} coordinates 经纬度信息
 * @returns {Promise} 位置详细信息
 */
export const getLocationInfo = async (coordinates) => {
  try {
    const { code, data, message } = await getCurrentLocationAPI(coordinates)
    if (code === 0 && data) {
      return data
    }
    throw new Error(message || '获取位置信息失败')
  } catch (error) {
    ElMessage.error(error.message)
    throw error
  }
} 