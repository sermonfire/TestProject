import request from '@/utils/request'

// 高德地图 API 配置
export const AMAP_API_CONFIG = {
    baseURL: '/amap-api',
    key: 'ed434af0fbf97a80fce9c5f84e8a20c0'
};

/**
 * 获取本地酒店信息
 * @param {string} keyword - 搜索关键字
 * @param {number} page_num - 页码，取值范围1-100
 * @param {number} page_size - 每页数量，取值范围1-25
 * @returns {Promise<{data: Array, count: number}>} 返回酒店搜索结果和总数
 */
export const getLocalHotelAPI = (keyword, page_num = 1, page_size = 12) => {
    // 确保参数在合法范围内
    page_num = Math.min(Math.max(1, page_num), 100)
    page_size = Math.min(Math.max(1, page_size), 25)

    return request({
        url: '/place/text',
        method: 'GET',
        baseURL: AMAP_API_CONFIG.baseURL,
        params: {
            keywords: keyword,
            key: AMAP_API_CONFIG.key,
            types: '酒店',
            page_num,
            page_size,
            output: 'json',
            citylimit: true
        },
        needToken: false,
        isPublic: true
    })
}
