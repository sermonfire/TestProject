import request from '@/utils/request'

/**
 * 搜索景点
 * @param {string} keyword - 搜索关键词
 * @returns {Promise} 返回搜索结果
 */
export const searchDestinationsAPI = (query) => {
    return request({
        url: '/dev-api/destinations/search',
        method: 'GET',
        params: { query },
        needToken: true
    })
} 