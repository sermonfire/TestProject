import request from '@/utils/request.js'
import { debounce } from 'lodash-es';

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

const cache = new Map();
const CACHE_TIME = 5 * 60 * 1000; // 5分钟缓存

// 获取个性化推荐的防抖处理
export const getPersonalizedRecommendationsAPI = debounce((pageNum = 1, pageSize = 10) => {
	const cacheKey = `recommendations_${pageNum}_${pageSize}`;
	const cachedData = cache.get(cacheKey);
	
	if (cachedData && Date.now() - cachedData.timestamp < CACHE_TIME) {
		return Promise.resolve(cachedData.data);
	}
	
	return request({
		url: 'dev-api/recommend/personalized',
		method: 'GET',
		params: { pageNum, pageSize },
		needToken: true
	}).then(response => {
		cache.set(cacheKey, {
			data: response,
			timestamp: Date.now()
		});
		return response;
	});
}, 300);

// 预览个性化推荐
export const getPreviewRecommendationsAPI = () => {
	return request({
		url: 'dev-api/recommend//personalized/preview',
		method: 'GET',
		needToken: true
	});
};