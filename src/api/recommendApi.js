import request from '@/utils/request.js'

//该接口已调用
// 保存用户偏好设置
export const saveUserPreferencesAPI = (preferences) => {
	return request({
		url: 'dev-api/recommend/preferences',
		method: 'POST',
		data: preferences,
		needToken: true
	})
}

//该接口已调用
// 获取用户偏好设置
export const getUserPreferencesAPI = () => {
	return request({
		url: 'dev-api/recommend/preferences',
		method: 'GET',
		needToken: true
	})
}

//该接口已调用
// 获取所有推荐内容
export const getAllRecommendationsAPI = () => {
	return request({
		url: 'dev-api/recommend/all',
		method: 'GET',
		needToken: true
	})
}

//该接口已调用
// 获取相似目的地的API
export const getSimilarDestinationsAPI = (id, limit = 5) => {
	return request({
		url: `dev-api/recommend/similar/${id}`,
		method: 'GET',
		params: { limit },
		needToken: true
	});
};