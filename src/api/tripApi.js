import request from '@/utils/request'

// 获取行程列表
export const getTripsAPI = () => {
  return request({
    url: '/dev-api/trips',
    method: 'GET'
  })
}

// 创建行程
export const createTripAPI = (data) => {
  return request({
    url: '/dev-api/trips',
    method: 'POST',
    data
  })
}

// 更新行程
export const updateTripAPI = (data) => {
  return request({
    url: `/dev-api/trips/${data.id}`,
    method: 'PUT',
    data
  })
}

// 删除行程
export const deleteTripAPI = (id) => {
  return request({
    url: `/dev-api/trips/${id}`,
    method: 'DELETE'
  })
}

// 搜索目的地
export const searchDestinationsAPI = (query) => {
  return request({
    url: '/dev-api/destinations/search',
    method: 'GET',
    params: { query }
  })
}

// 获取目的地详情
export const getDestinationDetailAPI = (destinationId) => {
	// console.log('Destination ID:', destinationId);
	return request({
		url: `/dev-api/recommend/destination/${destinationId}`,
		method: 'GET',
		needToken: true
	})
}

// 批量获取目的地详情
export const batchGetDestinationDetailsAPI = (destinationIds) => {
	return request({
		url: '/dev-api/recommend/destinations/batch',
		method: 'GET',
		params: {
			ids: destinationIds.join(',')
		},
		needToken: true
	})
}