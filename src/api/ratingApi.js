import request from '@/utils/request.js'

/**
 * @description 发表评价
 * @param {number} destinationId - 目的地ID
 * @param {Object} ratingData - 评价数据
 * @param {number} ratingData.rating - 评分(1-5分)
 * @param {string} ratingData.comment - 评价内容
 * @param {Array} ratingData.tags - 标签
 * @param {string} ratingData.visitTime - 游览时间
 * @param {number} ratingData.visitDuration - 游览时长(分钟)
 * @param {number} ratingData.crowdLevel - 人流量级别(1-5)
 * @param {number} ratingData.costPerPerson - 人均消费
 * @param {boolean} ratingData.isAnonymous - 是否匿名
 * @returns {Promise} 请求结果
 */
export const submitRatingAPI = (destinationId, ratingData) => {
    return request({
        url: `/dev-api/destination/rating/${destinationId}`,
        method: 'POST',
        data: ratingData,
        needToken: true
    })
}

/**
 * @description 删除评价
 * @param {number} ratingId - 评价ID
 * @returns {Promise} 请求结果
 */
export const deleteRatingAPI = (ratingId) => {
    return request({
        url: `/dev-api/destination/rating/${ratingId}`,
        method: 'DELETE',
        needToken: true
    })
}

/**
 * @description 获取目的地评价列表
 * @param {number} destinationId - 目的地ID
 * @param {number} pageNum - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise} 请求结果
 */
export const getDestinationRatingsAPI = (destinationId, pageNum = 1, pageSize = 10) => {
    return request({
        url: `/dev-api/destination/rating/destination/${destinationId}`,
        method: 'GET',
        params: { pageNum, pageSize },
        needToken: true
    })
}

/**
 * @description 获取用户评价列表
 * @param {number} pageNum - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise} 请求结果
 */
export const getUserRatingsAPI = (pageNum = 1, pageSize = 10) => {
    return request({
        url: '/dev-api/destination/rating/user',
        method: 'GET',
        params: { pageNum, pageSize },
        needToken: true
    })
}

/**
 * @description 获取评分统计
 * @param {number} destinationId - 目的地ID
 * @returns {Promise} 请求结果
 */
export const getRatingStatsAPI = (destinationId) => {
    return request({
        url: `/dev-api/destination/rating/stats/${destinationId}`,
        method: 'GET',
        needToken: true
    })
}

/**
 * @description 点赞/取消点赞评价
 * @param {number} ratingId - 评价ID
 * @param {boolean} isLike - 是否点赞
 * @returns {Promise} 请求结果
 */
export const toggleRatingLikeAPI = (ratingId, isLike) => {
    return request({
        url: `/dev-api/destination/rating/${ratingId}/like`,
        method: 'POST',
        params: { isLike },
        needToken: true
    })
}

/**
 * @description 检查是否已评价
 * @param {number} destinationId - 目的地ID
 * @returns {Promise} 请求结果
 */
export const checkRatedAPI = (destinationId) => {
    return request({
        url: `/dev-api/destination/rating/check/${destinationId}`,
        method: 'GET',
        needToken: true
    })
}

/**
 * @description 检查是否已点赞
 * @param {number} ratingId - 评价ID
 * @returns {Promise} 请求结果
 */
export const checkLikedAPI = (ratingId) => {
    return request({
        url: `/dev-api/destination/rating/${ratingId}/like/check`,
        method: 'GET',
        needToken: true
    })
}

/**
 * @description 更新评价
 * @param {number} ratingId - 评价ID
 * @param {Object} ratingData - 评价数据
 * @param {number} ratingData.rating - 评分(1-5分)
 * @param {string} ratingData.comment - 评价内容
 * @param {Array} ratingData.tags - 标签
 * @param {string} ratingData.visitTime - 游览时间
 * @param {number} ratingData.visitDuration - 游览时长(分钟)
 * @param {number} ratingData.crowdLevel - 人流量级别(1-5)
 * @param {number} ratingData.costPerPerson - 人均消费
 * @param {boolean} ratingData.isAnonymous - 是否匿名
 * @returns {Promise} 请求结果
 */
export const updateRatingAPI = (ratingId, ratingData) => {
    return request({
        url: `/dev-api/destination/rating/${ratingId}`,
        method: 'PUT',
        data: ratingData,
        needToken: true
    })
} 