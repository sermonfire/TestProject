import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  createTripAPI,
  updateTripAPI,
  deleteTripAPI,
  getTripsAPI
} from '@/api/tripApi'

export const useTripStore = defineStore('trip', () => {
  const trips = ref([])
  const loading = ref(false)

  // 获取行程列表
  const getTrips = async () => {
    loading.value = true
    try {
      const res = await getTripsAPI()
      trips.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  // 创建行程
  const createTrip = async (tripData) => {
    const res = await createTripAPI(tripData)
    trips.value.unshift(res.data)
    return res.data
  }

  // 更新行程
  const updateTrip = async (tripData) => {
    const res = await updateTripAPI(tripData)
    const index = trips.value.findIndex(t => t.id === tripData.id)
    if (index !== -1) {
      trips.value[index] = res.data
    }
    return res.data
  }

  // 删除行程
  const deleteTrip = async (tripId) => {
    await deleteTripAPI(tripId)
    trips.value = trips.value.filter(t => t.id !== tripId)
  }

  return {
    trips,
    loading,
    getTrips,
    createTrip,
    updateTrip,
    deleteTrip
  }
}) 