import request from '@/utils/request'

// 高德地图 API 配置
export const AMAP_API_CONFIG = {
    baseURL: '/amap-api',
    key: 'ed434af0fbf97a80fce9c5f84e8a20c0'
};

/**
 * 获取本地酒店信息
 * @param {string} keyword - 搜索关键字
 * @param {number} page_num - 页码，默认为1
 * @param {number} page_size - 每页数量，默认为10
 * @returns {Promise<{data: Array, count: number}>} 返回酒店搜索结果和总数
 */
export const getLocalHotelAPI = (keyword, page_num = 1, page_size = 10) => {
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
            offset: page_size,
            page: page_num
        },
        needToken: false,
        isPublic: true
    })
}
