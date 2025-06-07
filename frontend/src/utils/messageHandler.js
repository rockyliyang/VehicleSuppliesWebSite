import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import store from '../store'

// 错误消息映射
const ERROR_MAPPINGS = {
  // 网络相关错误
  'Network Error': 'common.error.network',
  'timeout': 'common.error.timeout',
  'Request failed': 'common.error.requestFailed',
  'ERR_NETWORK': 'common.error.network',
  'ERR_TIMEOUT': 'common.error.timeout',
  
  // 认证相关错误
  'Unauthorized': 'common.error.unauthorized',
  'Token expired': 'common.error.tokenExpired',
  'Invalid token': 'common.error.invalidToken',
  'jwt expired': 'common.error.tokenExpired',
  'jwt malformed': 'common.error.invalidToken',
  
  // 权限相关错误
  'Forbidden': 'common.error.forbidden',
  'Access denied': 'common.error.accessDenied',
  
  // 数据相关错误
  'Not found': 'common.error.notFound',
  'Data not found': 'common.error.dataNotFound',
  'Invalid data': 'common.error.invalidData',
  'Validation failed': 'common.error.validationFailed',
  
  // 服务器错误
  'Internal server error': 'common.error.serverError',
  'Service unavailable': 'common.error.serviceUnavailable',
  'Bad Gateway': 'common.error.badGateway',
  'Gateway Timeout': 'common.error.gatewayTimeout',
  
  // 业务逻辑错误
  '用户不存在': 'user.error.notExists',
  '密码错误': 'user.error.wrongPassword',
  '用户名已存在': 'user.error.usernameExists',
  '邮箱已存在': 'user.error.emailExists',
  '手机号已存在': 'user.error.phoneExists',
  '验证码错误': 'user.error.wrongCode',
  '验证码已过期': 'user.error.codeExpired',
  '手机号格式错误': 'user.error.phoneFormat',
  '邮箱格式错误': 'user.error.emailFormat',
  
  // 购物车相关
  '商品不存在': 'product.error.notExists',
  '库存不足': 'product.error.insufficientStock',
  '购物车为空': 'cart.error.empty',
  '获取购物车失败': 'cart.error.fetchFailed',
  '更新数量失败': 'cart.error.updateFailed',
  '移除商品失败': 'cart.error.removeFailed',
  
  // 订单相关
  '订单不存在': 'order.error.notExists',
  '订单状态错误': 'order.error.invalidStatus',
  '支付失败': 'payment.error.failed',
  '支付处理失败': 'payment.error.processFailed',
  '获取订单列表失败': 'order.error.fetchListFailed',
  '获取订单详情失败': 'order.error.fetchDetailFailed',
  
  // 文件上传相关
  '文件格式不支持': 'upload.error.unsupportedFormat',
  '文件大小超限': 'upload.error.sizeExceeded',
  '上传失败': 'upload.error.failed',
  '图片上传失败': 'upload.error.imageFailed',
  
  // 分类相关
  '获取分类失败': 'category.error.fetchFailed',
  '添加分类失败': 'category.error.addFailed',
  '更新分类失败': 'category.error.updateFailed',
  '删除分类失败': 'category.error.deleteFailed',
  
  // 产品相关
  '获取产品失败': 'product.error.fetchFailed',
  '添加产品失败': 'product.error.addFailed',
  '更新产品失败': 'product.error.updateFailed',
  '删除产品失败': 'product.error.deleteFailed',
  '获取相关产品失败': 'product.error.fetchRelatedFailed',
  
  // 公司信息相关
  '获取公司信息失败': 'company.error.fetchFailed',
  '更新公司信息失败': 'company.error.updateFailed',
  
  // Banner相关
  '获取Banner列表失败': 'banner.error.fetchFailed',
  '添加Banner失败': 'banner.error.addFailed',
  '更新Banner失败': 'banner.error.updateFailed',
  '删除Banner失败': 'banner.error.deleteFailed',
  
  // 语言相关
  '加载翻译失败': 'language.error.loadFailed',
  '添加翻译失败': 'language.error.addFailed',
  '更新翻译失败': 'language.error.updateFailed',
  '删除翻译失败': 'language.error.deleteFailed',
  
  // 密码重置相关
  '密码重置失败': 'resetPassword.error.failed',
  '无效的重置密码链接': 'resetPassword.error.invalidToken',
  '发送失败': 'forgotPassword.error.failed',
  
  // 支付相关
  '获取支付配置失败': 'payment.error.configFailed',
  '保存收货信息失败': 'payment.error.saveInfoFailed',
  '二维码生成失败': 'payment.error.qrCodeFailed'
}

// HTTP状态码映射
const HTTP_STATUS_MAPPINGS = {
  400: 'common.error.badRequest',
  401: 'common.error.unauthorized',
  403: 'common.error.forbidden',
  404: 'common.error.notFound',
  408: 'common.error.timeout',
  422: 'common.error.validationFailed',
  429: 'common.error.tooManyRequests',
  500: 'common.error.serverError',
  502: 'common.error.badGateway',
  503: 'common.error.serviceUnavailable',
  504: 'common.error.gatewayTimeout'
}

/**
 * 检查字符串是否包含中文
 * @param {string} str 
 * @returns {boolean}
 */
//function isChinese(str) {
//  return /[\u4e00-\u9fa5]/.test(str)
//}

/**
 * 获取翻译文本
 * @param {string} key 
 * @param {string} defaultValue 
 * @returns {string}
 */
function getTranslation(key, defaultValue = key) {
  return store.getters['language/translate'](key, defaultValue)
}

/**
 * 翻译错误消息
 * @param {string} message 
 * @param {string} fallbackKey 
 * @returns {string}
 */
function translateErrorMessage(message, fallbackKey) {
  if (!message) {
    return getTranslation(fallbackKey)
  }
  
  if (!fallbackKey) {
    fallbackKey = message
  }

  // 尝试精确匹配
  for (const [key, translationKey] of Object.entries(ERROR_MAPPINGS)) {
    if (message.includes(key)) {
      const translated = getTranslation(translationKey)
      if (translated !== translationKey) {
        return translated
      }
    }
  }
  
  return getTranslation(fallbackKey)
}

/**
 * 从错误对象中提取错误消息
 * @param {*} error 
 * @returns {string}
 */
function extractErrorMessage(error) {
  if (typeof error === 'string') {
    return error
  }
  
  if (error && error.response) {
    const response = error.response
    
    // 检查HTTP状态码
    if (response.status && HTTP_STATUS_MAPPINGS[response.status]) {
      const statusTranslation = HTTP_STATUS_MAPPINGS[response.status];
      return statusTranslation
    }
    
    // 检查响应数据中的错误信息
    if (response.data) {
      if (response.data.message) {
        return response.data.message
      }
      if (response.data.error) {
        return response.data.error
      }
      if (response.data.msg) {
        return response.data.msg
      }
    }
    
    // 检查响应状态文本
    if (response.statusText) {
      return response.statusText
    }
  }
  
  if (error && error.message) {
    return error.message
  }
  
  return ''
}

/**
 * 消息处理器类
 */
class MessageHandler {
  /**
   * 显示错误消息
   * @param {*} error 
   * @param {string} fallbackKey 
   * @param {string} type 
   */
  static showError(error, fallbackKey, type = 'message') {
    const rawMessage = extractErrorMessage(error)
    if (!fallbackKey) 
      fallbackKey = error.fallbackKey
    
    const translatedMessage = translateErrorMessage(rawMessage, fallbackKey)
    
    if (type === 'notification') {
      ElNotification({
        title: getTranslation('common.error.title'),
        message: translatedMessage,
        type: 'error',
        duration: 4000,
        showClose: true,
        customClass: 'elegant-error-notification'
      })
    } else {
      ElMessage({
        message: translatedMessage,
        type: 'error',
        duration: 3000,
        showClose: true,
        customClass: 'elegant-error-message'
      })
    }
  }
  
  /**
   * 显示成功消息
   * @param {string} message 
   * @param {string} translationKey 
   */
  static showSuccess(message, translationKey = null) {
    const displayMessage = translationKey ? getTranslation(translationKey) : message
    ElMessage({
      message: displayMessage,
      type: 'success',
      duration: 2000,
      showClose: true,
      customClass: 'elegant-success-message'
    })
  }
  
  /**
   * 显示警告消息
   * @param {string} message 
   * @param {string} translationKey 
   */
  static showWarning(message, translationKey = null) {
    const displayMessage = translationKey ? getTranslation(translationKey) : message
    ElMessage({
      message: displayMessage,
      type: 'warning',
      duration: 3000,
      showClose: true,
      customClass: 'elegant-warning-message'
    })
  }
  
  /**
   * 显示信息消息
   * @param {string} message 
   * @param {string} translationKey 
   */
  static showInfo(message, translationKey = null) {
    const displayMessage = translationKey ? getTranslation(translationKey) : message
    ElMessage({
      message: displayMessage,
      type: 'info',
      duration: 2000,
      showClose: true,
      customClass: 'elegant-info-message'
    })
  }

  /**
   * 显示确认对话框
   * @param {string} message 
   * @param {string} translationKey 
   * @param {Object} options 
   */
  static confirm({ message, translationKey = null, options = {}}) {
    const displayMessage = translationKey ? getTranslation(translationKey) : message
    return ElMessageBox.confirm(
      displayMessage,
      getTranslation('common.confirm.title') || '确认',
      {
        confirmButtonText: getTranslation('common.confirm.ok') || '确定',
        cancelButtonText: getTranslation('common.confirm.cancel') || '取消',
        type: 'warning',
        customClass: 'elegant-confirm-dialog',
        ...options
      }
    )
  }
}

export default MessageHandler