import request from '@/utils/request'

/**
 * 获取日程列表
 * @param {number} tripId - 行程ID
 * @returns {Promise} 返回日程列表
 */
export const getScheduleListAPI = (tripId) => {
    return request({
        url: `/dev-api/trip/${tripId}/schedule/list`,
        method: 'GET'
    })
}

/**
 * 创建日程安排
 * @param {number|string} tripId - 行程ID
 * @param {Object} scheduleData - 日程数据
 * @returns {Promise} 返回创建结果
 */
export const createScheduleAPI = (tripId, scheduleData) => {
    return request({
        url: `/dev-api/trip/${tripId}/schedule`,
        method: 'POST',
        data: scheduleData,
        needToken: true
    })
}

/**
 * 更新日程安排
 * @param {number|string} tripId - 行程ID
 * @param {number|string} scheduleId - 日程ID
 * @param {Object} scheduleData - 日程数据
 * @returns {Promise} 返回更新结果
 */
export const updateScheduleAPI = (tripId, scheduleId, scheduleData) => {
    return request({
        url: `/dev-api/trip/${tripId}/schedule/${scheduleId}`,
        method: 'PUT',
        data: scheduleData,
        needToken: true
    })
}

/**
 * 删除日程安排
 * @param {number|string} tripId - 行程ID
 * @param {number|string} scheduleId - 日程ID
 * @returns {Promise} 返回删除结果
 */
export const deleteScheduleAPI = (tripId, scheduleId) => {
    return request({
        url: `/dev-api/trip/${tripId}/schedule/${scheduleId}`,
        method: 'DELETE',
        needToken: true
    })
}

/**
 * 删除所有日程安排
 * @param {number|string} tripId - 行程ID
 * @returns {Promise} 返回删除结果
 */
export const deleteAllSchedulesAPI = (tripId) => {
    return request({
        url: `/dev-api/trip/${tripId}/schedule/deleteAll`,
        method: 'DELETE',
        needToken: true
    })
}

/**
 * 删除当天日程安排
 * @param {number|string} tripId - 行程ID
 * @param {number} dayIndex - 第几天
 * @returns {Promise} 返回删除结果
 */
export const deleteDayScheduleAPI = (tripId, dayIndex) => {
    return request({
        url: `/dev-api/trip/${tripId}/schedule/deleteDay/${dayIndex}`,
        method: 'DELETE',
        needToken: true
    })
}


/**
 * 获取某天的日程安排
 * @param {number|string} tripId - 行程ID
 * @param {number} dayIndex - 第几天
 * @returns {Promise} 返回当天日程列表
 */
export const getDaySchedulesAPI = (tripId, dayIndex) => {
    return request({
        url: `/dev-api/trip/${tripId}/schedule/day/${dayIndex}`,
        method: 'GET',
        needToken: true
    })
} 