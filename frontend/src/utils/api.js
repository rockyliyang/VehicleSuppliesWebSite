import axios from 'axios';
import { ElMessage } from 'element-plus';
import store from '../store';
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

// 请求拦截器 - 添加token到请求头
api.interceptors.request.use(
  config => {
    // 优先从cookie读取token
    let token = getTokenFromCookie('token');
    
    // 如果cookie中没有token，尝试从localStorage获取
    if (!token) {
      // 根据请求路径判断使用哪个token
      if (config.url && config.url.startsWith('/admin')) {
        token = localStorage.getItem('admin_token');
      } else {
        token = localStorage.getItem('user_token') || localStorage.getItem('token');
      }
    }
    
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
    
    // 如果请求不成功，显示错误消息
    if (!res.success) {
      ElMessage.error(res.message || '操作失败');
      return Promise.reject(new Error(res.message || '操作失败'));
    }
    
    return res;
  },
  error => {
    // 处理HTTP错误
    let message = '请求失败';
    if (error.response) {
      // 服务器返回错误状态码
      switch (error.response.status) {
        case 401:
          message = '未授权，请登录';
          // 清除用户信息并跳转到登录页
          store.commit('setUser', null);
          //if (router) router.push('/login');
          break;
        case 403:
          message = '拒绝访问';
          break;
        case 404:
          message = '请求的资源不存在';
          break;
        case 500:
          message = '服务器内部错误';
          break;
        default:
          message = `请求错误: ${error.response.status}`;
      }
      
      // 尝试从响应中获取错误消息
      if (error.response.data && error.response.data.message) {
        message = error.response.data.message;
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      message = '服务器无响应';
    } else {
      // 请求配置出错
      message = error.message;
    }
    
    ElMessage.error(message);
    return Promise.reject({
      success: false,
      message: message,
      data: null
    });
  }
);

export default api;