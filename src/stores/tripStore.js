import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  createTripAPI,
  updateTripAPI,
  deleteTripAPI,
  getTripsAPI,
  getTripDetailAPI,
  updateTripStatusAPI
} from '@/api/tripApi'
import { getScheduleListAPI } from '@/api/scheduleApi'
import dayjs from 'dayjs'

export const useTripStore = defineStore('trip', () => {
  const trips = ref([])
  const loading = ref(false)
  const todaySchedulesMap = ref(new Map())

  // 获取今日日程并缓存
  const fetchTodaySchedules = async (tripId) => {
    try {
      // 如果缓存中已有数据且未过期，直接返回
      if (todaySchedulesMap.value.has(tripId)) {
        const cached = todaySchedulesMap.value.get(tripId)
        // 如果缓存时间不超过5分钟，直接返回缓存数据
        if (cached.timestamp && (Date.now() - cached.timestamp) < 300000) {
          return cached.data
        }
      }

      const res = await getScheduleListAPI(tripId)
      if (res.code === 0) {
        const schedules = res.data || []
        // 将结果缓存，并添加时间戳
        todaySchedulesMap.value.set(tripId, {
          data: schedules,
          timestamp: Date.now()
        })
        return schedules
      }
      // 如果获取失败，也缓存空数组，避免重复请求
      todaySchedulesMap.value.set(tripId, {
        data: [],
        timestamp: Date.now()
      })
      return []
    } catch (error) {
      console.error('获取日程列表失败:', error)
      // 发生错误时也缓存空数组
      todaySchedulesMap.value.set(tripId, {
        data: [],
        timestamp: Date.now()
      })
      return []
    }
  }

  // 获取今日日程
  const getTodaySchedules = (tripId) => {
    // 如果缓存中没有数据，先尝试获取
    if (!todaySchedulesMap.value.has(tripId)) {
      fetchTodaySchedules(tripId)
      return []
    }
    const cached = todaySchedulesMap.value.get(tripId)
    return cached.data || []
  }

  // 清除指定行程的缓存
  const clearTripScheduleCache = (tripId) => {
    todaySchedulesMap.value.delete(tripId)
  }

  // 清除所有缓存
  const clearAllScheduleCache = () => {
    todaySchedulesMap.value.clear()
  }

  // 获取行程列表
  const getTrips = async (params = { pageNum: 1, pageSize: 10 }) => {
    loading.value = true
    try {
      const res = await getTripsAPI(params)
      if (res.code === 0 && res.data) {
        const formattedList = res.data.list.map(trip => ({
          ...trip,
          startDate: dayjs(trip.startDate).format('YYYY-MM-DD'),
          endDate: dayjs(trip.endDate).format('YYYY-MM-DD'),
          createTime: trip.createTime,
          updateTime: trip.updateTime
        }))
        trips.value = formattedList

        // 获取进行中行程的今日日程
        formattedList.forEach(trip => {
          if (trip.status === 2) { // 只获取进行中的行程日程
            fetchTodaySchedules(trip.id)
          }
        })

        return {
          list: formattedList,
          pagination: {
            total: res.data.total,
            pageNum: res.data.pageNum,
            pageSize: res.data.pageSize,
            pages: res.data.pages
          }
        }
      }
      return { list: [], pagination: { total: 0, pageNum: 1, pageSize: 10, pages: 1 } }
    } finally {
      loading.value = false
    }
  }

  // 创建行程
  const createTrip = async (tripData) => {
    const res = await createTripAPI({
      name: tripData.name,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      description: tripData.description,
      totalBudget: tripData.totalBudget
    })
    
    if (res.code === 0 && res.data) {
      trips.value.unshift(res.data)
      return res.data
    }
    throw new Error(res.message || '创建失败')
  }

  // 更新行程
  const updateTrip = async (tripData) => {
    const res = await updateTripAPI({
      id: tripData.id,
      name: tripData.name,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      description: tripData.description,
      totalBudget: tripData.totalBudget
    })
    
    if (res.code === 0) {
      const index = trips.value.findIndex(t => t.id === tripData.id)
      if (index !== -1) {
        trips.value[index] = { ...trips.value[index], ...tripData }
      }
      return true
    }
    throw new Error(res.message || '更新失败')
  }

  // 删除行程
  const deleteTrip = async (tripId) => {
    const res = await deleteTripAPI(tripId)
    if (res.code === 0) {
      trips.value = trips.value.filter(t => t.id !== tripId)
      return true
    }
    throw new Error(res.message || '删除失败')
  }

  // 获取行程详情
  const getTripDetail = async (tripId) => {
    const res = await getTripDetailAPI(tripId)
    if (res.code === 0 && res.data) {
      return res.data
    }
    throw new Error(res.message || '获取详情失败')
  }

  // 更新行程状态时需要重新获取日程
  const updateTripStatus = async (tripId, status) => {
    const res = await updateTripStatusAPI(tripId, status)
    if (res.code === 0) {
      const trip = trips.value.find(t => t.id === tripId)
      if (trip) {
        trip.status = status
        // 如果更新为进行中状态，重新获取日程
        if (status === 2) {
          await fetchTodaySchedules(tripId)
        } else {
          // 如果不是进行中状态，清除缓存
          clearTripScheduleCache(tripId)
        }
      }
      return true
    }
    throw new Error(res.message || '更新状态失败')
  }

  return {
    trips,
    loading,
    getTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    getTripDetail,
    updateTripStatus,
    getTodaySchedules,
    fetchTodaySchedules,
    clearTripScheduleCache,
    clearAllScheduleCache
  }
}) 