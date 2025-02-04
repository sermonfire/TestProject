import { useUserStore } from '@/stores/userstore.js';
import { ErrorMessage } from './errorHandler.js';

// 基础配置
const DEFAULT_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '',  // 从环境变量获取基础URL
  timeout: 60000,
  header: {
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
  retryTimes: 3,  // 请求重试次数
  retryDelay: 1000,  // 重试延迟时间(ms)
  header: {}  // 添加默认的header对象
};

// 请求拦截器
const requestInterceptors = [
  {
    name: 'addToken',
    success: (config) => {
      const userStore = useUserStore();
      // console.debug('Token in interceptor:', userStore.token);
      if (config.needToken && userStore.token) {
        config.header = config.header || {};
        config.header.Authorization = userStore.token;
      }
      return config;
    }
  },
  {
    name: 'addTimestamp',
    success: (config) => {
      // 为GET请求添加时间戳，避免缓存
      if (config.method.toUpperCase() === 'GET') {
        config.data = {
          ...config.data,
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
      const { statusCode, data } = response;
      
      console.debug('Response status:', statusCode);
      console.debug('Response data:', data);
      
      if (statusCode === 200 && data) {
        return {
          code: data.code || 0,
          data: data.data,
          message: data.message || 'success'
        };
      }
      
      // 只对需要token的内部API请求进行401处理
      if (statusCode === 401 && response.config.needToken && !response.config.isPublic) {
        const userStore = useUserStore();
        userStore.clear();
        // 显示提示
        uni.showToast({
          title: '登录已过期，请重新登录',
          icon: 'none',
          duration: 1500
        });
        // 确保清除所有登录相关的存储
        uni.removeStorageSync('rememberMe');
        uni.removeStorageSync('savedPhone');
        uni.removeStorageSync('savedPassword');
        // 延迟跳转
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/login/login'
          });
        }, 1500);
        return Promise.reject({ code: 401, message: '登录已过期，请重新登录' });
      }
      
      // 其他错误直接抛出,由调用方处理
      throw { 
        code: statusCode,
        message: data.message || ErrorMessage[statusCode] 
      };
    },
    error: (error) => {
      return Promise.reject({
        code: error.statusCode || 500,
        message: error.errMsg || '网络请求失败'
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

// 创建请求实例的工厂函数
export const createRequest = (customConfig = {}) => {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  const requestQueue = new RequestQueue();

  // 执行请求拦截器
  const executeRequestInterceptors = async (options) => {
    let currentConfig = { ...options };
    for (const interceptor of requestInterceptors) {
      try {
        currentConfig = await interceptor.success(currentConfig);
      } catch (error) {
        console.error(`Request interceptor ${interceptor.name} failed:`, error);
        throw error;
      }
    }
    return currentConfig;
  };

  // 执行响应拦截器
  const executeResponseInterceptors = async (response) => {
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
  };

  // 重试机制
  const retryRequest = async (options, retryTimes) => {
    try {
      const response = await uni.request(options);
      return response;
    } catch (error) {
      if (retryTimes > 0) {
        await new Promise(resolve => setTimeout(resolve, options.retryDelay));
        return retryRequest(options, retryTimes - 1);
      }
      throw error;
    }
  };

  return async (options) => {
    const mergedOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      header: {
        ...config.header,
        ...options.headers
      }
    };

    // 检查是否需要token
    if (!mergedOptions.isPublic && mergedOptions.needToken) {
      const userStore = useUserStore();
      if (!userStore.token) {
        return Promise.reject(new Error('请先登录'));
      }
    }

    // 请求频率限制
    const requestKey = `${mergedOptions.url}_${mergedOptions.method}_${JSON.stringify(mergedOptions.data)}`;
    if (!requestQueue.check(requestKey)) {
      return Promise.reject(new Error('请求过于频繁'));
    }

    try {
      // 执行请求拦截器
      const interceptedOptions = await executeRequestInterceptors(mergedOptions);
      
      // 构建最终请求配置
      const requestConfig = {
        url: config.baseURL + interceptedOptions.url,
        method: interceptedOptions.method,
        header: {
          ...config.header,
          ...interceptedOptions.header
        },
        data: interceptedOptions.data,
        timeout: config.timeout
      };

      // 发送请求（带重试机制）
      const response = await retryRequest(requestConfig, mergedOptions.retryTimes);
      
      // 执行响应拦截器
      const result = await executeResponseInterceptors(response);
      
      return result;
    } catch (error) {
      if (mergedOptions.showErrorToast) {
        uni.showToast({
          title: error.message || '请求失败',
          icon: 'none'
        });
      }
      return Promise.reject(error);
    } finally {
      requestQueue.clean();
    }
  };
};

// 创建默认请求实例
const request = createRequest();

export default request;