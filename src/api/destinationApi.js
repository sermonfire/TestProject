import request from '@/utils/request'

/**
 * 添加目的地到行程
 * @param {number|string} tripId - 行程ID
 * @param {Object} destinationData - 目的地数据
 * @returns {Promise} 返回创建结果
 */
export const addDestinationAPI = (tripId, destinationData) => {
  return request({
    url: `/dev-api/trip/${tripId}/destination`,
    method: 'POST',
    data: destinationData,
    needToken: true
  })
}

/**
 * 从行程中删除目的地
 * @param {number|string} tripId - 行程ID
 * @param {number|string} destinationId - 目的地ID
 * @returns {Promise} 返回删除结果
 */
export const deleteDestinationAPI = (tripId, destinationId) => {
  return request({
    url: `/dev-api/trip/${tripId}/destination/${destinationId}`,
    method: 'DELETE',
    needToken: true
  })
}

/**
 * 获取行程某天的目的地列表
 * @param {number|string} tripId - 行程ID
 * @param {number} dayIndex - 第几天
 * @returns {Promise} 返回目的地列表
 */
export const getDayDestinationsAPI = (tripId, dayIndex) => {
  return request({
    url: `/dev-api/trip/${tripId}/destination/day/${dayIndex}`,
    method: 'GET',
    needToken: true
  })
}

/**
 * 调整游览顺序
 * @param {number|string} tripId - 行程ID
 * @param {number|string} destinationId - 目的地ID
 * @param {number} newOrder - 新的游览顺序
 * @returns {Promise} 返回更新结果
 */
export const updateVisitOrderAPI = (tripId, destinationId, newOrder) => {
  return request({
    url: `/dev-api/trip/${tripId}/destination/${destinationId}/order`,
    method: 'PUT',
    data: { newOrder },
    needToken: true
  })
}

/**
 * 获取智能路线推荐
 * @param {number|string} tripId - 行程ID
 * @param {number} dayIndex - 第几天
 * @returns {Promise} 返回推荐路线
 */
export const getRecommendRouteAPI = (tripId, dayIndex) => {
  return request({
    url: `/dev-api/trip/${tripId}/destination/day/${dayIndex}/recommend`,
    method: 'GET',
    needToken: true
  })
}

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