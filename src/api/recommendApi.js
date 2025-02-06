import request from '@/utils/request.js'

// 获取所有推荐内容（包括个性化、热门、季节性推荐）
export const getRecommendationsAPI = () => {
	return request({
		url: 'dev-api/recommend/destinations',
		method: 'GET',
		needToken: true
	})
}

// 获取相似目的地推荐
export const getSimilarDestinationsAPI = (id, limit = 6) => {
	return request({
		url: `dev-api/recommend/similar/${id}?limit=${limit}`,
		method: 'GET',
		needToken: true
	})
}

// 获取当前热门目的地
export const getTrendingDestinationsAPI = () => {
	return request({
		url: 'dev-api/recommend/trending',
		method: 'GET',
		needToken: true
	})
}

// 保存用户偏好设置
export const saveUserPreferencesAPI = (preferences) => {
	return request({
		url: 'dev-api/recommend/preferences',
		method: 'POST',
		data: preferences,
		needToken: true
	})
}

// 获取用户偏好设置
export const getUserPreferencesAPI = () => {
	return request({
		url: 'dev-api/recommend/preferences',
		method: 'GET',
		needToken: true
	})
}

// 获取季节性推荐
export const getSeasonalRecommendationsAPI = () => {
	return request({
		url: 'dev-api/recommend/seasonal',
		method: 'GET',
		needToken: true,
		headers: {
			'Content-Type': 'application/json'
		}
	})
}

// 获取所有推荐内容
export const getAllRecommendationsAPI = () => {
	return request({
		url: 'dev-api/recommend/all',
		method: 'GET',
		needToken: true
	})
}

// 获取个性化推荐的API
export const getPersonalizedRecommendationsAPI = () => {
	return request({
		url: 'dev-api/recommend/personalized',
		method: 'GET',
		needToken: true
	})
}

// 获取目的地详情
export const getDestinationDetailAPI = (id) => {
	return request({
		url: `dev-api/recommend/destination/${id}`,
		method: 'GET',
		needToken: true
	})
}

// 获取相似目的地的API
export const getSimilarDestinations = (id, limit = 5) => {
	return request({
		url: `dev-api/recommend/similar/${id}`,
		method: 'GET',
		params: { limit },
		needToken: true
	});
};