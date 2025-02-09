import axios from 'axios';
import { useUserStore } from '@/stores/userstore.js';
import { ElMessage } from 'element-plus';
import { ErrorMessage } from './errorHandler.js';
import router from '@/router';

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
      const { status, data } = response;
      
      if (status === 200 && data) {
        return {
          code: data.code || 0,
          data: data.data,
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
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    
    // 保留原有的token处理逻辑
    const token = localStorage.getItem('token')
    if (token && config.needToken !== false) {
      config.headers.Authorization = `${token}`
    }
    return config
  },
  error => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

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
  error => Promise.reject(error)
);

// 导出实例
export default service

// 如果有其他导出的工具函数，保持不变
export const createRequest = (config) => {
  return axios.create({
    ...config,
    timeout: 10000
  })
}