/**
 * @description 位置信息存储
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLocationStore = defineStore('location', () => {
  // 状态
  const coordinates = ref({ longitude: '', latitude: '' })
  const locationInfo = ref(null)
  const lastUpdateTime = ref(0)

  // 存储键名
  const STORAGE_KEY = {
    COORDINATES: 'location_coordinates',
    INFO: 'location_info',
    UPDATE_TIME: 'location_update_time'
  }

  /**
   * @description 设置坐标
   */
  const setCoordinates = (coords) => {
    coordinates.value = coords
  }

  /**
   * @description 设置位置信息
   */
  const setLocationInfo = (info) => {
    locationInfo.value = info
  }

  /**
   * @description 设置更新时间
   */
  const setUpdateTime = (time) => {
    lastUpdateTime.value = time
  }

  /**
   * @description 保存位置信息到本地存储
   */
  const saveLocation = () => {
    try {
      localStorage.setItem(STORAGE_KEY.COORDINATES, JSON.stringify(coordinates.value))
      localStorage.setItem(STORAGE_KEY.INFO, JSON.stringify(locationInfo.value))
      localStorage.setItem(STORAGE_KEY.UPDATE_TIME, lastUpdateTime.value.toString())
    } catch (error) {
      console.error('保存位置信息失败:', error)
    }
  }

  /**
   * @description 从本地存储恢复位置信息
   */
  const restoreLocation = () => {
    try {
      const savedCoords = localStorage.getItem(STORAGE_KEY.COORDINATES)
      const savedInfo = localStorage.getItem(STORAGE_KEY.INFO)
      const savedTime = localStorage.getItem(STORAGE_KEY.UPDATE_TIME)

      if (savedCoords) coordinates.value = JSON.parse(savedCoords)
      if (savedInfo) locationInfo.value = JSON.parse(savedInfo)
      if (savedTime) lastUpdateTime.value = Number(savedTime)
    } catch (error) {
      console.error('恢复位置信息失败:', error)
    }
  }

  /**
   * @description 清除位置信息
   */
  const clearLocation = () => {
    coordinates.value = { longitude: '', latitude: '' }
    locationInfo.value = null
    lastUpdateTime.value = 0
    
    try {
      localStorage.removeItem(STORAGE_KEY.COORDINATES)
      localStorage.removeItem(STORAGE_KEY.INFO)
      localStorage.removeItem(STORAGE_KEY.UPDATE_TIME)
    } catch (error) {
      console.error('清除位置信息失败:', error)
    }
  }

  return {
    coordinates,
    locationInfo,
    lastUpdateTime,
    setCoordinates,
    setLocationInfo,
    setUpdateTime,
    saveLocation,
    restoreLocation,
    clearLocation
  }
}) 