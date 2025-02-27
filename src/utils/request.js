import axios from 'axios';
import { useUserStore } from '@/stores/userstore.js';
import { ElMessage } from 'element-plus';
import { ErrorMessage } from './errorHandler.js';

// 基础配置
const DEFAULT_CONFIG = {
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json'
    }
};

// 默认请求选项
const DEFAULT_OPTIONS = {
    method: 'GET',
    data: {},
    showErrorToast: true,
    needToken: true,
    isPublic: false,
    retryTimes: 3,
    retryDelay: 1000,
    headers: {}
};

// 请求拦截器
const requestInterceptors = [
    {
        name: 'addToken',
        success: (config) => {
            const userStore = useUserStore();
            if (config.needToken && userStore.token) {
                config.headers = config.headers || {};
                config.headers.Authorization = userStore.token;
            }
            return config;
        }
    },
    {
        name: 'addTimestamp',
        success: (config) => {
            if (config.method.toUpperCase() === 'GET') {
                config.params = {
                    ...config.params,
                    _t: Date.now()
                };
            }
            return config;
        }
    }
];

// 响应拦截器
const responseInterceptors = [
    {
        name: 'handleStatus',
        success: (response) => {
            const { status, data, config, } = response;

            // 如果是DeepSeek API的请求，直接返回原始响应
            if (config.url?.includes('deepseek')) {
                return data;
            }

            // 对于其他API请求保持原有的处理逻辑
            if (status === 200 && data) {
                return {
                    code: data.code || 0,
                    data: data.data || data.pois,
                    message: data.message || 'success'
                };
            }

            if (status === 401 && response.config.needToken && !response.config.isPublic) {
                const userStore = useUserStore();
                userStore.clear();

                ElMessage({
                    message: '登录已过期，请重新登录',
                    type: 'warning'
                });

                return Promise.reject({ code: 401, message: '登录已过期，请重新登录' });
            }

            throw {
                code: status,
                message: data.message || ErrorMessage[status]
            };
        },
        error: (error) => {
            return Promise.reject({
                code: error.response?.status || 500,
                message: error.message || '网络请求失败'
            });
        }
    }
];

// 创建axios实例
const service = axios.create({
    ...DEFAULT_CONFIG,
    timeoutErrorMessage: '请求超时，请重试'
});

// 请求拦截器
service.interceptors.request.use(
    async config => {
        config = { ...DEFAULT_OPTIONS, ...config };

        // 应用所有请求拦截器
        for (const interceptor of requestInterceptors) {
            config = await interceptor.success(config);
        }

        // 如果是AI请求，移除超时限制
        if (config.url?.includes('deepseek')) {
            config.timeout = 0;
        }

        return config;
    },
    error => Promise.reject(error)
);

// 响应拦截器
service.interceptors.response.use(
    async (response) => {

        let currentResponse = response;
        for (const interceptor of responseInterceptors) {
            try {
                currentResponse = await interceptor.success(currentResponse);
            } catch (error) {
                if (interceptor.error) {
                    return interceptor.error(error);
                }
                throw error;
            }
        }
        return currentResponse;
    },
    error => {
        return Promise.reject(error);
    }
);

// 导出实例
export default service

// 如果有其他导出的工具函数，保持不变
export const createRequest = (config) => {
    return axios.create({
        ...config,
        // 如果是AI相关的请求，则不设置超时
        timeout: config?.url?.includes('deepseek') ? 0 : 10000
    })
}