/**
 * @description 天气相关接口
 */

import request from '@/utils/request'

/**
 * @description 获取实时天气
 * @param {string} city - 城市名称
 * @returns {Promise} 返回实时天气信息
 */
export const getCurrentWeatherAPI = (city) => {
  return request({
    url: '/dev-api/weather/current',
    method: 'GET',
    params: { city },
    needToken: true
  })
}

/**
 * @description 获取天气预报
 * @param {string} city - 城市名称
 * @param {number} [days=3] - 预报天数
 * @returns {Promise} 返回天气预报信息
 */
export const getWeatherForecastAPI = (city, days = 3) => {
  return request({
    url: '/dev-api/weather/forecast',
    method: 'GET',
    params: { city, days },
    needToken: true
  })
}

/**
 * @description 获取完整天气信息
 * @param {string} city - 城市名称
 * @returns {Promise} 返回完整天气信息
 */
export const getWeatherInfoAPI = (city) => {
  return request({
    url: '/dev-api/weather/info',
    method: 'GET',
    params: { city },
    needToken: true
  })
} 