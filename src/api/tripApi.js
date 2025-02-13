import request from '@/utils/request'

// 获取行程列表
export const getTripsAPI = (params = { pageNum: 1, pageSize: 10 }) => {
  return request({
    url: '/dev-api/trip/list',
    method: 'GET',
    params
  })
}

// 创建行程
export const createTripAPI = (data) => {
  return request({
    url: '/dev-api/trip',
    method: 'POST',
    data: {
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description,
      totalBudget: data.totalBudget
    }
  })
}

// 更新行程
export const updateTripAPI = (data) => {
  return request({
    url: `/dev-api/trip/${data.id}`,
    method: 'PUT',
    data: {
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description,
      totalBudget: data.totalBudget
    }
  })
}

// 删除行程
export const deleteTripAPI = (id) => {
  return request({
    url: `/dev-api/trip/${id}`,
    method: 'DELETE'
  })
}

// 获取行程详情
export const getTripDetailAPI = (id) => {
  return request({
    url: `/dev-api/trip/${id}`,
    method: 'GET'
  })
}

// 更新行程状态
export const updateTripStatusAPI = (tripId, status) => {
  return request({
    url: `/dev-api/trip/${tripId}/status`,
    method: 'PUT',
    params: { status }
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