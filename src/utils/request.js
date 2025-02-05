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

// 请求队列管理类
class RequestQueue {
  constructor() {
    this.queue = new Map();
    this.interval = 2000;
    this.maxRequests = 3;
  }

  clean() {
    const now = Date.now();
    for (const [key, value] of this.queue.entries()) {
      if (now - value.timestamp > this.interval) {
        this.queue.delete(key);
      }
    }
  }

  check(key) {
    const now = Date.now();
    const request = this.queue.get(key);
    
    if (!request) {
      this.queue.set(key, { count: 1, timestamp: now });
      return true;
    }
    
    if (now - request.timestamp > this.interval) {
      this.queue.set(key, { count: 1, timestamp: now });
      return true;
    }
    
    if (request.count >= this.maxRequests) {
      return false;
    }
    
    request.count++;
    return true;
  }
}

// 创建axios实例的工厂函数
export const createRequest = (customConfig = {}) => {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  const requestQueue = new RequestQueue();
  const axiosInstance = axios.create(config);

  // 添加请求拦截器
  axiosInstance.interceptors.request.use(async (config) => {
    let currentConfig = { ...config };
    for (const interceptor of requestInterceptors) {
      try {
        currentConfig = await interceptor.success(currentConfig);
      } catch (error) {
        console.error(`Request interceptor ${interceptor.name} failed:`, error);
        throw error;
      }
    }
    return currentConfig;
  });

  // 添加响应拦截器
  axiosInstance.interceptors.response.use(
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

  return async (options) => {
    const mergedOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      headers: {
        ...config.headers,
        ...options.headers
      }
    };

    const requestKey = `${mergedOptions.url}_${mergedOptions.method}_${JSON.stringify(mergedOptions.data)}`;
    if (!requestQueue.check(requestKey)) {
      return Promise.reject(new Error('请求过于频繁'));
    }

    try {
      const response = await axiosInstance(mergedOptions);
      return response;
    } catch (error) {
      return Promise.reject(error);
    } finally {
      requestQueue.clean();
    }
  };
};

// 创建默认请求实例
const request = createRequest();

export default request;