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

// 获取收藏列表
export const getFavoriteListAPI = (pageNum = 1, pageSize = 10) => {
  return request({
    url: 'dev-api/favorite/list',
    method: 'GET',
    params: { pageNum, pageSize },
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

// 更新收藏信息
export const updateFavoriteAPI = (id, category, notes) => {
  return request({
    url: `dev-api/favorite/${id}`,
    method: 'PUT',
    data: { category, notes },
    needToken: true
  })
} 