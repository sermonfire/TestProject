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
// 根据用户ID获取个性化推荐内容
export const getPersonalizedRecommendationsAPI = () => {
	return request({
		url: 'dev-api/recommend/personalized',
		method: 'GET',
		needToken: true
	})
}

// 预览个性化推荐
export const getPreviewRecommendationsAPI = () => {
	return request({
		url: 'dev-api/recommend//personalized/preview',
		method: 'GET',
		needToken: true
	});
};