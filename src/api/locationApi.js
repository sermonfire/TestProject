/**
 * @description 位置相关接口
 */
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

/**
 * @description 验证坐标格式
 * @param {string|number} longitude 经度
 * @param {string|number} latitude 纬度
 * @returns {boolean} 是否有效
 */
const validateCoordinates = (longitude, latitude) => {
    const lng = Number(longitude)
    const lat = Number(latitude)

    // 验证经纬度范围
    // 高德地图经纬度范围：
    // 经度范围：73.66~135.05
    // 纬度范围：3.86~53.55
    if (
        isNaN(lng) ||
        isNaN(lat) ||
        lng < 73.66 ||
        lng > 135.05 ||
        lat < 3.86 ||
        lat > 53.55
    ) {
        return false
    }

    return true
}

/**
 * @description 格式化坐标
 * @param {string|number} longitude 经度
 * @param {string|number} latitude 纬度
 * @returns {Object} 格式化后的坐标
 */
const formatCoordinates = (longitude, latitude) => {
    return {
        longitude: Number(longitude).toFixed(6),
        latitude: Number(latitude).toFixed(6)
    }
}

/**
 * @description 获取当前位置信息
 * @param {Object} coordinates GCJ02坐标信息
 * @returns {Promise} 位置信息
 */
export const getCurrentLocationAPI = ({ longitude, latitude }) => {
    // 验证坐标
    if (!validateCoordinates(longitude, latitude)) {
        ElMessage.error('无效的坐标信息')
        return Promise.reject(new Error('无效的坐标信息'))
    }

    // 格式化坐标
    const formattedCoords = formatCoordinates(longitude, latitude)

    return request({
        url: 'dev-api/location/current',
        method: 'GET',
        params: formattedCoords,
        needToken: true
    })
}

/**
 * @description 获取路线规划
 * @param {Object} params 路线参数
 * @param {string} params.startLon 起点经度(GCJ02)
 * @param {string} params.startLat 起点纬度(GCJ02)
 * @param {string} params.endLon 终点经度(GCJ02)
 * @param {string} params.endLat 终点纬度(GCJ02)
 * @param {number} params.type 路线类型(0:驾车,1:公交,2:步行,3:骑行)
 * @returns {Promise} 路线信息
 */
export const getRouteAPI = ({ startLon, startLat, endLon, endLat, type }) => {
    // 验证起点坐标
    if (!validateCoordinates(startLon, startLat)) {
        ElMessage.error('无效的起点坐标')
        return Promise.reject(new Error('无效的起点坐标'))
    }

    // 验证终点坐标
    if (!validateCoordinates(endLon, endLat)) {
        ElMessage.error('无效的终点坐标')
        return Promise.reject(new Error('无效的终点坐标'))
    }

    // 验证路线类型
    if (![0, 1, 2, 3].includes(type)) {
        ElMessage.error('无效的路线类型')
        return Promise.reject(new Error('无效的路线类型'))
    }

    // 格式化坐标
    const startCoords = formatCoordinates(startLon, startLat)
    const endCoords = formatCoordinates(endLon, endLat)

    return request({
        url: 'dev-api/location/route',
        method: 'GET',
        params: {
            startLon: startCoords.longitude,
            startLat: startCoords.latitude,
            endLon: endCoords.longitude,
            endLat: endCoords.latitude,
            type
        },
        needToken: true
    })
} 