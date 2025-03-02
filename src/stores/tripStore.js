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
import {
    getScheduleListAPI,
    createScheduleAPI,
    updateScheduleAPI,
    deleteScheduleAPI,
    getDaySchedulesAPI
} from '@/api/scheduleApi'
import dayjs from 'dayjs'

export const useTripStore = defineStore('trip', () => {
    const trips = ref([])
    const loading = ref(false)
    const todaySchedulesMap = ref(new Map())

    /**
     * @description 获取指定行程的所有日程数据
     * @param {string|number} tripId - 行程ID
     * @param {boolean} forceRefresh - 是否强制刷新缓存
     * @param {number} cacheValidTime - 缓存有效时间(ms)，默认5分钟
     * @returns {Promise<Array>} 日程列表
     */
    const getTripSchedules = async (tripId, forceRefresh = false, cacheValidTime = 5 * 60 * 1000) => {
        if (!tripId) return []

        const cached = todaySchedulesMap.value.get(tripId)
        const isCacheValid = cached?.timestamp && (Date.now() - cached.timestamp < cacheValidTime)

        // 如果缓存有效且不强制刷新，直接返回缓存数据
        if (!forceRefresh && isCacheValid) {
            return cached.data || []
        }

        try {
            const res = await getScheduleListAPI(tripId)
            const scheduleData = {
                data: res.code === 0 ? (res.data || []) : [],
                timestamp: Date.now()
            }

            todaySchedulesMap.value.set(tripId, scheduleData)
            return scheduleData.data
        } catch (error) {
            console.error('获取指定行程日程列表失败:', error)
            // 发生错误时，如果有缓存就返回缓存数据，没有则返回空数组
            return cached?.data || []
        }
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

                // 获取进行中行程的日程数据
                formattedList.forEach(trip => {
                    if (trip.status === 2) { // 只获取进行中的行程日程
                        getTripSchedules(trip.id)
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
                    getTripSchedules(tripId)
                } else {
                    // 如果不是进行中状态，清除缓存
                    clearTripScheduleCache(tripId)
                }
            }
            return true
        }
        throw new Error(res.message || '更新状态失败')
    }

    // 创建日程
    const createSchedule = async (tripId, scheduleData) => {
        const res = await createScheduleAPI(tripId, scheduleData)
        if (res.code === 0 && res.data) {
            // 清除缓存，强制下次获取最新数据
            clearTripScheduleCache(tripId)
            return res.data
        }
        throw new Error(res.message || '创建日程失败')
    }

    // 更新日程
    const updateSchedule = async (tripId, scheduleId, scheduleData) => {
        const res = await updateScheduleAPI(tripId, scheduleId, scheduleData)
        if (res.code === 0) {
            // 清除缓存，强制下次获取最新数据
            clearTripScheduleCache(tripId)
            return true
        }
        throw new Error(res.message || '更新日程失败')
    }

    // 删除日程
    const deleteSchedule = async (tripId, scheduleId) => {
        const res = await deleteScheduleAPI(tripId, scheduleId)
        if (res.code === 0) {
            // 清除缓存，强制下次获取最新数据
            clearTripScheduleCache(tripId)
            return true
        }
        throw new Error(res.message || '删除日程失败')
    }

    // 获取某天的日程安排
    const getDaySchedules = async (tripId, dayIndex) => {
        const res = await getDaySchedulesAPI(tripId, dayIndex)
        if (res.code === 0) {
            return res.data || []
        }
        throw new Error(res.message || '获取当天日程失败')
    }

    return {
        trips,
        loading,
        todaySchedulesMap,
        getTrips,
        createTrip,
        updateTrip,
        deleteTrip,
        getTripDetail,
        updateTripStatus,
        getTripSchedules,
        clearTripScheduleCache,
        clearAllScheduleCache,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        getDaySchedules
    }
}) 