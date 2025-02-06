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

// 注册接口
export const clientUserRegisterAPI = (params) => {
	return request({
		url: 'dev-api/ClientUser/register',
		method: 'POST',
		data: params,
		needToken: false,  // 明确标记不需要token
		isPublic: true     // 标记为公开接口
	})
}

// 获取用户信息
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

// 上传头像
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

// 更新密码
export const updatePasswordAPI = (params) => {
	return request({
		url: 'dev-api/ClientUser/updatePassword',
		method: 'PUT',
		data: params,
		needToken: true
	})
}