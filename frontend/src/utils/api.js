import axios from 'axios';
import store from '../store';
import MessageHandler from './messageHandler'
//import router from '../router';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || '/api',
  timeout: 10000
});

// 工具函数：从cookie中读取token
function getTokenFromCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// 导出的工具函数：获取当前用户token
export function getAuthToken(isAdminRequest = false) {
  // 从cookie读取token
  if (isAdminRequest) {
    return getTokenFromCookie('admin_token') || getTokenFromCookie('aex-token');
  } else {
    return getTokenFromCookie('aex-token');
  }
}

// 请求拦截器 - 添加token到请求头
api.interceptors.request.use(
  config => {
    // 使用封装的函数获取token
    const isAdminRequest = config.url && config.url.startsWith('/admin');
    const token = getAuthToken(isAdminRequest);
    
    // 如果有token，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 默认错误处理函数
let defaultErrorHandler = (error, fallbackKey) => {
  MessageHandler.showError(error, fallbackKey);
};

// 允许外部设置自定义错误处理函数
api.setErrorHandler = (handler) => {
  if (typeof handler === 'function') {
    defaultErrorHandler = handler;
  }
};

// 重置为默认错误处理函数
api.resetErrorHandler = () => {
  defaultErrorHandler = (error, fallbackKey) => {
    MessageHandler.showError(error, fallbackKey);
  };
};

// 响应拦截器 - 统一处理响应格式
api.interceptors.response.use(
  response => {
    const res = response.data;
    
    // 检查响应是否符合统一格式 {success, message, data}
    if (res.success === undefined) {
      // 如果后端返回的不是统一格式，转换为统一格式
      return {
        success: true,
        message: '操作成功',
        data: res
      };
    }
    
    // 如果请求不成功，不在这里显示错误，让调用方决定如何处理
    if (!res.success) {
      return Promise.reject({
        success: false,
        message: res.message || '操作失败',
        data: res.data || null,
        showError: true // 标记这是一个需要显示错误的响应
      });
    }
    
    return res;
  },
  error => {
    // 处理HTTP错误
    let showError = true;
    let message = '请求失败';
    let fallbackKey;
    
    if (error.response) {
      // 服务器返回错误状态码
      switch (error.response.status) {
        case 401:
          message = '未授权，请登录';
          //fallbackKey = 'common.error.unauthorized';
          // 清除用户信息并跳转到登录页
          store.commit('setUser', null);
          showError = false;
          //if (router) router.push('/login');
          break;
        case 403:
          message = '拒绝访问';
          fallbackKey = 'common.error.forbidden';
          showError = false;
          break;
        case 404:
          message = '请求的资源不存在';
          fallbackKey = 'common.error.notFound';
          showError = false;
          break;
        case 500:
          message = '服务器内部错误';
          fallbackKey = 'common.error.serverError';
          showError = false;
          break;
        default:
          message = `请求错误: ${error.response.status}`;
          fallbackKey = 'common.error.requestFailed';
      }
      
      // 尝试从响应中获取错误消息
      if (error.response.data && error.response.data.message) {
        message = null;
        fallbackKey = error.response.data.message; //backend return the message code for thranslation
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      fallbackKey = 'common.error.network';
      showError = false;
    } else {
      // 请求配置出错
      message = error.message;
      fallbackKey = 'common.error.unknown';
    }
    
    return Promise.reject({
      success: false,
      message: message,
      data: null,
      fallbackKey: fallbackKey,
      showError: showError // 标记这是一个需要显示错误的响应
    });
  }
);

// 扩展api对象，添加带错误处理的请求方法
api.postWithErrorHandler = function(url, data, options = {}) {
  const { errorHandler, fallbackKey, ...axiosOptions } = options;
  
  return this.post(url, data, axiosOptions).catch(error => {
    // 如果提供了自定义错误处理函数，使用它
    if (typeof errorHandler === 'function') {
      errorHandler(error, fallbackKey);
    } else if (error.showError) {
      // 使用默认错误处理函数
      defaultErrorHandler(error, fallbackKey || error.fallbackKey);
    }
    
    console.error('error:', error);
    throw error;
  });
};

api.getWithErrorHandler = function(url, options = {}) {
  const { errorHandler, fallbackKey, ...axiosOptions } = options;
  
  return this.get(url, axiosOptions).catch(error => {
    // 如果提供了自定义错误处理函数，使用它
    if (typeof errorHandler === 'function') {
      errorHandler(error, fallbackKey);
    } else if (error.showError) {
      // 使用默认错误处理函数
      defaultErrorHandler(error, fallbackKey || error.fallbackKey);
    }
    
    console.error('error:', error);
    throw error;
  });
};

api.putWithErrorHandler = function(url, data, options = {}) {
  const { errorHandler, fallbackKey, ...axiosOptions } = options;
  
  return this.put(url, data, axiosOptions).catch(error => {
    // 如果提供了自定义错误处理函数，使用它
    if (typeof errorHandler === 'function') {
      errorHandler(error, fallbackKey);
    } else if (error.showError) {
      // 使用默认错误处理函数
      defaultErrorHandler(error, fallbackKey || error.fallbackKey);
    }
    
    console.error('error:', error);
    throw error;
  });
};

api.patchWithErrorHandler = function(url, data, options = {}) {
  const { errorHandler, fallbackKey, ...axiosOptions } = options;
  
  return this.patch(url, data, axiosOptions).catch(error => {
    // 如果提供了自定义错误处理函数，使用它
    if (typeof errorHandler === 'function') {
      errorHandler(error, fallbackKey);
    } else if (error.showError) {
      // 使用默认错误处理函数
      defaultErrorHandler(error, fallbackKey || error.fallbackKey);
    }
    
    console.error('error:', error);
    throw error;
  });
};

api.deleteWithErrorHandler = function(url, options = {}) {
  const { errorHandler, fallbackKey, ...axiosOptions } = options;
  
  return this.delete(url, axiosOptions).catch(error => {
    // 如果提供了自定义错误处理函数，使用它
    if (typeof errorHandler === 'function') {
      errorHandler(error, fallbackKey);
    } else if (error.showError) {
      // 使用默认错误处理函数
      defaultErrorHandler(error, fallbackKey || error.fallbackKey);
    }
    
    console.error('error:', error);
    throw error;
  });
};

export default api;