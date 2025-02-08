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

// 添加清除缓存的方法
export const clearRecommendationsCache = () => {
	cache.clear();
};

// 修改获取个性化推荐的方法
export const getPersonalizedRecommendationsAPI = debounce((pageNum = 1, pageSize = 10, forceRefresh = false) => {
	const cacheKey = `recommendations_${pageNum}_${pageSize}`;
	const cachedData = cache.get(cacheKey);
	
	// 如果强制刷新或缓存过期，则重新请求数据
	if (forceRefresh || !cachedData || Date.now() - cachedData.timestamp >= CACHE_TIME) {
		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				reject(new Error('请求超时'));
			}, 10000);
			
			(async () => {
				try {
					const response = await request({
						url: 'dev-api/recommend/personalized',
						method: 'GET',
						params: { pageNum, pageSize },
						needToken: true
					});
					
					clearTimeout(timeoutId);
					
					if (!response) {
						console.warn('Empty response received');
						return reject(new Error('服务器响应为空'));
					}
					
					if (typeof response !== 'object') {
						console.warn('Invalid response format:', response);
						return reject(new Error('响应格式错误'));
					}
					
					if (response.code !== 0 || !response.data) {
						console.warn('Business logic error:', response);
						return reject(new Error(response.message || '业务处理失败'));
					}
					
					if (!Array.isArray(response.data.list)) {
						console.warn('Invalid data structure:', response.data);
						return reject(new Error('数据结构错误'));
					}
					
					// 更新缓存
					cache.set(cacheKey, {
						data: response,
						timestamp: Date.now()
					});
					
					resolve(response);
				} catch (error) {
					clearTimeout(timeoutId);
					console.error('Request failed:', error);
					reject(error);
				}
			})();
		});
	}
	
	return Promise.resolve(cachedData.data);
}, 300, { leading: true, trailing: false });

// 预览个性化推荐
export const getPreviewRecommendationsAPI = () => {
	return request({
		url: 'dev-api/recommend//personalized/preview',
		method: 'GET',
		needToken: true
	});
};

// 获取搜索结果
export const getSearchResultsAPI = ({ tags, pageNum = 1, pageSize = 10 }) => {
	// 确保 tags 是数组
	const tagsArray = Array.isArray(tags) ? tags : [tags];	
	// 构建查询字符串
	const queryParams = tagsArray.map(tag => `tags=${encodeURIComponent(tag)}`).join('&');
	const url = `dev-api/recommend/related?${queryParams}&pageNum=${pageNum}&pageSize=${pageSize}`;
	
	return request({
		url,
		method: 'GET',
		needToken: true
	});
};

// 获取目的地详情
export const getDestinationDetailAPI = (destinationId) => {
	return request({
		url: `dev-api/recommend/destination/${destinationId}`,
		method: 'GET',
		needToken: true
	})
}

// 批量获取目的地详情
export const batchGetDestinationDetailsAPI = (destinationIds) => {
	return request({
		url: 'dev-api/recommend/destinations/batch',
		method: 'GET',
		params: {
			ids: destinationIds.join(',')
		},
		needToken: true
	})
}