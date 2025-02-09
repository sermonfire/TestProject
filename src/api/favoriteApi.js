import request from '@/utils/request'

// 添加收藏
export const addFavoriteAPI = (destinationId, category = '', notes = '') => {
  return request({
    url: `dev-api/favorite/${destinationId}`,
    method: 'POST',
    params: { category, notes },
    needToken: true
  })
}

// 取消收藏
export const removeFavoriteAPI = (destinationId) => {
  return request({
    url: `dev-api/favorite/${destinationId}`,
    method: 'DELETE',
    needToken: true
  })
}

// 取消所有收藏
export const removeAllFavoritesAPI = () => {
  return request({
    url: 'dev-api/favorite/all',
    method: 'DELETE',
    needToken: true
  })
}

// 根据分类id获取不同分类下的收藏列表（不传代表获取所有收藏信息，0代表获取默认分类下的收藏信息，其他代表获取对应分类下的收藏信息）
export const getFavoriteListAPI = (pageNum = 1, pageSize = 10, categoryId = null) => {
  return request({
    url: 'dev-api/favorite/list',
    method: 'GET',
    params: { pageNum, pageSize, categoryId },
    needToken: true
  })
}

// 检查是否已收藏
export const checkIsFavoriteAPI = (destinationId) => {
  return request({
    url: `dev-api/favorite/check/${destinationId}`,
    method: 'GET',
    needToken: true
  })
}

// 创建收藏分类
export const createCategoryAPI = (data) => {
  return request({
    url: 'dev-api/favorite/category',
    method: 'POST',
    data,
    needToken: true
  })
}

// 删除收藏分类
export const deleteCategoryAPI = (categoryId) => {
  return request({
    url: `dev-api/favorite/category/${categoryId}`,
    method: 'DELETE',
    needToken: true
  })
}

// 获取分类列表
export const getCategoryListAPI = () => {
  return request({
    url: 'dev-api/favorite/category/list',
    method: 'GET',
    needToken: true
  })
}

// 更新分类信息
export const updateCategoryAPI = (categoryId, data) => {
  return request({
    url: `dev-api/favorite/category/${categoryId}`,
    method: 'PUT',
    data,
    needToken: true
  })
}

// 更新分类排序
export const updateCategorySortAPI = (categoryId, sortOrder) => {
  return request({
    url: `dev-api/favorite/category/${categoryId}/sort`,
    method: 'PUT',
    params: { sortOrder },
    needToken: true
  })
}

// 获取收藏统计
export const getFavoriteStatsAPI = () => {
  return request({
    url: 'dev-api/favorite/stats',
    method: 'GET',
    needToken: true
  })
}

// 搜索收藏
export const searchFavoritesAPI = (keyword, pageNum = 1, pageSize = 10) => {
  return request({
    url: 'dev-api/favorite/search',
    method: 'GET',
    params: { keyword, pageNum, pageSize },
    needToken: true
  })
}

// 批量删除收藏
export const batchDeleteFavoritesAPI = (favoriteIds) => {
  // console.log('调用批量删除API:', favoriteIds)
  return request({
    url: 'dev-api/favorite/batch',
    method: 'DELETE',
    params: {
      favoriteIds: favoriteIds.join(',')  // 将数组转换为逗号分隔的字符串
    },
    needToken: true
  })
}

// 批量更新分类
export const batchUpdateCategoryAPI = (favoriteIds, categoryId) => {
  return request({
    url: 'dev-api/favorite/batch/category',
    method: 'PUT',
    data: {
      favoriteIds,
      categoryId
    },
    needToken: true
  })
}