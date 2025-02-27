import { defineStore } from 'pinia'
import { getLocalHotelAPI } from '@/api/localhotel'

const CACHE_KEY = 'hotel_cache_storage'
const TWO_DAYS = 2 * 24 * 60 * 60 * 1000 // 2天的毫秒数

/**
 * 从localStorage加载缓存数据
 * @returns {Object} 缓存数据
 */
const loadCacheFromStorage = () => {
    try {
        const cached = localStorage.getItem(CACHE_KEY)
        return cached ? JSON.parse(cached) : {}
    } catch (error) {
        console.error('加载酒店缓存数据失败:', error)
        return {}
    }
}

/**
 * 保存缓存数据到localStorage
 * @param {Object} cache - 缓存数据
 */
const saveCacheToStorage = (cache) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    } catch (error) {
        console.error('保存酒店缓存数据失败:', error)
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
 * 酒店数据缓存管理Store
 */
export const useHotelStore = defineStore('hotel', {
    state: () => ({
        /**
         * 酒店数据缓存
         * @type {Object.<string, { data: Array, timestamp: number, total: number }>}
         */
        hotelCache: loadCacheFromStorage(),
    }),

    actions: {
        /**
         * 获取酒店数据，优先从缓存中获取
         * @param {string} keyword - 搜索关键字
         * @param {number} page_num - 页码
         * @param {number} page_size - 每页数量
         * @returns {Promise<{data: Array, total: number}>} 酒店数据列表和总数
         */
        async getHotels(keyword, page_num = 1, page_size = 10) {
            // 验证分页参数
            page_num = Math.min(Math.max(1, page_num), 100) // 限制页码范围在1-100
            page_size = Math.min(Math.max(1, page_size), 25) // 限制每页数量在1-25

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
                total: Number(response.count), // 确保是数字类型
                timestamp: now
            }

            // 保存到localStorage
            saveCacheToStorage(this.hotelCache)

            return {
                data: response.data,
                total: Number(response.count) // 确保返回数字类型
            }
        },

        /**
         * 清除所有酒店数据缓存
         */
        clearCache() {
            this.hotelCache = {}
            localStorage.removeItem(CACHE_KEY)
        }
    }
}) 