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
import dayjs from 'dayjs'

export const useTripStore = defineStore('trip', () => {
  const trips = ref([])
  const loading = ref(false)

  // 获取行程列表
  const getTrips = async (params = { pageNum: 1, pageSize: 10 }) => {
    loading.value = true
    try {
      const res = await getTripsAPI(params)
      if (res.code === 0 && res.data) {
        // 处理日期格式
        const formattedList = res.data.list.map(trip => ({
          ...trip,
          startDate: dayjs(trip.startDate).format('YYYY-MM-DD'),
          endDate: dayjs(trip.endDate).format('YYYY-MM-DD'),
          createTime: trip.createTime,
          updateTime: trip.updateTime
        }))
        trips.value = formattedList
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

  // 更新行程状态
  const updateTripStatus = async (tripId, status) => {
    const res = await updateTripStatusAPI(tripId, status)
    if (res.code === 0) {
      const trip = trips.value.find(t => t.id === tripId)
      if (trip) {
        trip.status = status
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
    updateTripStatus
  }
}) 