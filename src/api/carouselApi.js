import request from '@/utils/request'

/**
 * @description 获取轮播图列表
 * @param {Object} params 查询参数
 * @param {number} [params.pageNum=1] 页码
 * @param {number} [params.pageSize=10] 每页数量
 * @returns {Promise} 轮播图数据
 */
export const getCarouselImagesAPI = (params = { pageNum: 1, pageSize: 10 }) => {
  return request({
    url: '/dev-api/images/list',
    method: 'GET',
    params: {
      ...params,
      prefix: 'images/carousel/'
    },
    needToken: true
  })
} 