// 引入 request 文件
import request from '@/utils/request.js'

//用户登录
export const clientUserLoginAPI = (params) => {
	return request({
		url: 'dev-api/ClientUser/login',
		method: 'POST',
		data: params,
		needToken: false,  // 明确标记不需要token
		isPublic: true     // 标记为公开接口
	})
}

//登录状态检查
export const checkLoginAPI = () => {
	return request({
		url: 'dev-api/ClientUser/checkLoginStatus',
		method: 'GET',
		needToken: true,
	})
}

// 在现有代码中添加注册接口
export const clientUserRegisterAPI = (params) => {
	return request({
		url: 'dev-api/ClientUser/register',
		method: 'POST',
		data: params,
		needToken: false,  // 明确标记不需要token
		isPublic: true     // 标记为公开接口
	})
}

// 添加获取用户信息和更新用户信息的API
export const getUserInfoAPI = () => {
	return request({
		url: 'dev-api/ClientUser/userInfo',
		method: 'GET',
		needToken: true,
		headers: {
			'Content-Type': 'application/json'
		}
	})
}

// 更新用户信息
export const updateUserInfoAPI = (params) => {
	return request({
		url: 'dev-api/ClientUser/userInfoUpdate',
		method: 'PUT',
		data: params,
		needToken: true,
		headers: {
			'Content-Type': 'application/json'
		}
	})
}

// 修改上传头像的 API
export const uploadAvatarAPI = (formData) => {
	return request({
		url: 'dev-api/upload',
		method: 'POST',
		data: formData,
		needToken: true,
		headers: {
			'Content-Type': 'multipart/form-data'
		}
	})
}

// 更新密码的API
export const updatePasswordAPI = (params) => {
	return request({
		url: 'dev-api/ClientUser/updatePassword',
		method: 'PUT',
		data: params
	})
}

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

// 获取热门主题
export const getPopularThemesAPI = () => {
	return request({
		url: 'dev-api/recommend/themes',
		method: 'GET',
		needToken: true,
		headers: {
			'Content-Type': 'application/json'
		}
	})
}

// 获取季节性主题
export const getSeasonalThemesAPI = () => {
	return request({
		url: 'dev-api/recommend/seasonal-themes',
		method: 'GET',
		needToken: true
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

// 获取所有主题的API
export const getAllThemes = () => {
	return request({
		url: 'dev-api/theme/all',
		method: 'GET',
		needToken: true
	});
};

// 获取主题详情的API
export const getThemeById = (id) => {
	return request({
		url: `dev-api/theme/${id}`,
		method: 'GET',
		needToken: true
	});
};

// 获取相似目的地的API
export const getSimilarDestinations = (id, limit = 5) => {
	return request({
		url: `dev-api/recommend/similar/${id}`,
		method: 'GET',
		params: { limit },
		needToken: true
	});
};
