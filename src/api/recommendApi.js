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
	
	// 创建一个新的Promise来处理请求
	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new Error('请求超时'));
		}, 10000);
		
		// 使用async/await处理请求
		(async () => {
			try {
				const response = await request({
					url: 'dev-api/recommend/personalized',
					method: 'GET',
					params: { pageNum, pageSize },
					needToken: true
				});
				
				clearTimeout(timeoutId);
				
				// 确保response存在且格式正确
				if (!response) {
					console.warn('Empty response received');
					return reject(new Error('服务器响应为空'));
				}
				
				// 验证响应格式
				if (typeof response !== 'object') {
					console.warn('Invalid response format:', response);
					return reject(new Error('响应格式错误'));
				}
				
				// 验证业务数据
				if (response.code !== 0 || !response.data) {
					console.warn('Business logic error:', response);
					return reject(new Error(response.message || '业务处理失败'));
				}
				
				// 验证数据结构
				if (!Array.isArray(response.data.list)) {
					console.warn('Invalid data structure:', response.data);
					return reject(new Error('数据结构错误'));
				}
				
				// 缓存有效响应
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
}, 300, { leading: true, trailing: false }); // 修改防抖配置，确保第一次调用立即执行

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