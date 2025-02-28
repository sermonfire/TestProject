import { defineStore } from 'pinia'
import { getLocalHotelAPI } from '@/api/localhotel'
import { getLocalFoodAPI } from '@/api/localfood'

const HOTEL_CACHE_KEY = 'hotel_cache_storage'
const FOOD_CACHE_KEY = 'food_cache_storage'
const TWO_DAYS = 2 * 24 * 60 * 60 * 1000 // 2天的毫秒数

/**
 * 从localStorage加载缓存数据
 * @param {string} cacheKey - 缓存键名
 * @returns {Object} 缓存数据
 */
const loadCacheFromStorage = (cacheKey) => {
    try {
        const cached = localStorage.getItem(cacheKey)
        return cached ? JSON.parse(cached) : {}
    } catch (error) {
        console.error(`加载${cacheKey}缓存数据失败:`, error)
        return {}
    }
}

/**
 * 保存缓存数据到localStorage
 * @param {string} cacheKey - 缓存键名
 * @param {Object} cache - 缓存数据
 */
const saveCacheToStorage = (cacheKey, cache) => {
    try {
        localStorage.setItem(cacheKey, JSON.stringify(cache))
    } catch (error) {
        console.error(`保存${cacheKey}缓存数据失败:`, error)
    }
}

/**
 * 清理过期的缓存数据
 * @param {Object} cache - 缓存数据
 * @returns {Object} 清理后的缓存数据
 */
const cleanExpiredCache = (cache) => {
    const now = Date.now()
    const cleanedCache = {}

    Object.entries(cache).forEach(([key, value]) => {
        if (now - value.timestamp < TWO_DAYS) {
            cleanedCache[key] = value
        }
    })

    return cleanedCache
}

/**
 * 本地服务（酒店和食物）数据缓存管理Store
 */
export const useLocalServiceStore = defineStore('localService', {
    state: () => ({
        /**
         * 酒店数据缓存
         * @type {Object.<string, { data: Array, timestamp: number, total: number }>}
         */
        hotelCache: loadCacheFromStorage(HOTEL_CACHE_KEY),

        /**
         * 食物数据缓存
         * @type {Object.<string, { data: Array, timestamp: number, total: number }>}
         */
        foodCache: loadCacheFromStorage(FOOD_CACHE_KEY),

        /**
         * 请求锁，用于确保请求串行执行
         * @type {boolean}
         */
        isRequesting: false
    }),

    actions: {
        /**
         * 等待请求锁释放
         * @returns {Promise<void>}
         */
        async waitForLock() {
            while (this.isRequesting) {
                await new Promise(resolve => setTimeout(resolve, 100))
            }
        },

        /**
         * 获取酒店数据，优先从缓存中获取
         * @param {string} keyword - 搜索关键字
         * @param {number} page_num - 页码
         * @param {number} page_size - 每页数量
         * @returns {Promise<{data: Array, total: number}>} 酒店数据列表和总数
         */
        async getHotels(keyword, page_num = 1, page_size = 12) {
            await this.waitForLock()
            this.isRequesting = true

            try {
                // 验证分页参数
                page_num = Math.min(Math.max(1, page_num), 100)
                page_size = Math.min(Math.max(1, page_size), 25)

                // 清理过期缓存
                this.hotelCache = cleanExpiredCache(this.hotelCache)

                // 使用更精确的缓存键
                const cacheKey = `${keyword}_p${page_num}_s${page_size}`
                const now = Date.now()

                // 检查缓存是否存在且未过期
                if (
                    this.hotelCache[cacheKey] &&
                    now - this.hotelCache[cacheKey].timestamp < TWO_DAYS
                ) {
                    return {
                        data: this.hotelCache[cacheKey].data,
                        total: this.hotelCache[cacheKey].total
                    }
                }

                // 缓存不存在或已过期，重新请求数据
                const response = await getLocalHotelAPI(keyword, page_num, page_size)

                // 更新缓存，确保 total 是数字类型
                this.hotelCache[cacheKey] = {
                    data: response.data,
                    total: Number(response.count),
                    timestamp: now
                }

                // 保存到localStorage
                saveCacheToStorage(HOTEL_CACHE_KEY, this.hotelCache)

                return {
                    data: response.data,
                    total: Number(response.count)
                }
            } finally {
                this.isRequesting = false
            }
        },

        /**
         * 获取食物数据，优先从缓存中获取
         * @param {string} keyword - 搜索关键字
         * @param {number} page_num - 页码
         * @param {number} page_size - 每页数量
         * @returns {Promise<{data: Array, total: number}>} 食物数据列表和总数
         */
        async getFoods(keyword, page_num = 1, page_size = 12) {
            await this.waitForLock()
            this.isRequesting = true

            try {
                // 验证分页参数
                page_num = Math.min(Math.max(1, page_num), 100)
                page_size = Math.min(Math.max(1, page_size), 25)

                // 清理过期缓存
                this.foodCache = cleanExpiredCache(this.foodCache)

                // 使用更精确的缓存键
                const cacheKey = `${keyword}_p${page_num}_s${page_size}`
                const now = Date.now()

                // 检查缓存是否存在且未过期
                if (
                    this.foodCache[cacheKey] &&
                    now - this.foodCache[cacheKey].timestamp < TWO_DAYS
                ) {
                    return {
                        data: this.foodCache[cacheKey].data,
                        total: this.foodCache[cacheKey].total
                    }
                }

                // 缓存不存在或已过期，重新请求数据
                const response = await getLocalFoodAPI(keyword, page_num, page_size)

                // 更新缓存，确保 total 是数字类型
                this.foodCache[cacheKey] = {
                    data: response.data,
                    total: Number(response.count),
                    timestamp: now
                }

                // 保存到localStorage
                saveCacheToStorage(FOOD_CACHE_KEY, this.foodCache)

                return {
                    data: response.data,
                    total: Number(response.count)
                }
            } finally {
                this.isRequesting = false
            }
        },

        /**
         * 清除所有缓存数据
         */
        clearAllCache() {
            this.hotelCache = {}
            this.foodCache = {}
            localStorage.removeItem(HOTEL_CACHE_KEY)
            localStorage.removeItem(FOOD_CACHE_KEY)
        },

        /**
         * 清除酒店缓存数据
         */
        clearHotelCache() {
            this.hotelCache = {}
            localStorage.removeItem(HOTEL_CACHE_KEY)
        },

        /**
         * 清除食物缓存数据
         */
        clearFoodCache() {
            this.foodCache = {}
            localStorage.removeItem(FOOD_CACHE_KEY)
        }
    }
}) 