<template>
  <div></div>
</template>

<script>
import { ElMessage, ElNotification } from 'element-plus'

export default {
  name: 'ErrorMessage',
  methods: {
    // 显示错误消息的统一方法
    showError(error, fallbackKey = 'common.error.unknown') {
      let message = ''
      
      // 处理不同类型的错误
      if (typeof error === 'string') {
        // 如果是字符串，直接使用
        message = error
      } else if (error && error.response && error.response.data) {
        // 处理axios错误响应
        const responseData = error.response.data
        if (responseData.message) {
          message = responseData.message
        } else if (responseData.error) {
          message = responseData.error
        }
      } else if (error && error.message) {
        // 处理普通错误对象
        message = error.message
      }
      
      // 如果没有获取到具体错误信息，使用fallback
      if (!message) {
        message = this.$t(fallbackKey)
      }
      
      // 检查是否是后端返回的原始错误信息（通常包含技术细节）
      // 如果是，则尝试翻译为用户友好的信息
      const translatedMessage = this.translateErrorMessage(message, fallbackKey)
      
      // 显示错误消息
      this.displayError(translatedMessage)
    },
    
    // 翻译错误消息
    translateErrorMessage(message, fallbackKey) {
      // 常见错误信息的映射
      const errorMappings = {
        // 网络相关错误
        'Network Error': 'common.error.network',
        'timeout': 'common.error.timeout',
        'Request failed': 'common.error.requestFailed',
        
        // 认证相关错误
        'Unauthorized': 'common.error.unauthorized',
        'Token expired': 'common.error.tokenExpired',
        'Invalid token': 'common.error.invalidToken',
        
        // 权限相关错误
        'Forbidden': 'common.error.forbidden',
        'Access denied': 'common.error.accessDenied',
        
        // 数据相关错误
        'Not found': 'common.error.notFound',
        'Data not found': 'common.error.dataNotFound',
        'Invalid data': 'common.error.invalidData',
        
        // 服务器错误
        'Internal server error': 'common.error.serverError',
        'Service unavailable': 'common.error.serviceUnavailable',
        
        // 业务逻辑错误
        '用户不存在': 'user.error.notExists',
        '密码错误': 'user.error.wrongPassword',
        '用户名已存在': 'user.error.usernameExists',
        '邮箱已存在': 'user.error.emailExists',
        '手机号已存在': 'user.error.phoneExists',
        '验证码错误': 'user.error.wrongCode',
        '验证码已过期': 'user.error.codeExpired',
        
        // 购物车相关
        '商品不存在': 'product.error.notExists',
        '库存不足': 'product.error.insufficientStock',
        '购物车为空': 'cart.error.empty',
        
        // 订单相关
        '订单不存在': 'order.error.notExists',
        '订单状态错误': 'order.error.invalidStatus',
        '支付失败': 'payment.error.failed',
        
        // 文件上传相关
        '文件格式不支持': 'upload.error.unsupportedFormat',
        '文件大小超限': 'upload.error.sizeExceeded',
        '上传失败': 'upload.error.failed'
      }
      
      // 尝试精确匹配
      for (const [key, translationKey] of Object.entries(errorMappings)) {
        if (message.includes(key)) {
          const translated = this.$t(translationKey)
          if (translated !== translationKey) {
            return translated
          }
        }
      }
      
      // 如果没有找到匹配的翻译，检查是否是中文错误信息
      // 如果是中文，直接显示；如果是英文技术错误，使用fallback
      if (this.isChinese(message)) {
        return message
      } else {
        return this.$t(fallbackKey)
      }
    },
    
    // 检查字符串是否包含中文
    isChinese(str) {
      return /[\u4e00-\u9fa5]/.test(str)
    },
    
    // 显示错误消息
    displayError(message, type = 'message') {
      if (type === 'notification') {
        ElNotification({
          title: this.$t('common.error.title'),
          message: message,
          type: 'error',
          duration: 4000,
          showClose: true,
          customClass: 'elegant-error-notification'
        })
      } else {
        ElMessage({
          message: message,
          type: 'error',
          duration: 3000,
          showClose: true,
          customClass: 'elegant-error-message'
        })
      }
    },
    
    // 显示成功消息
    showSuccess(message, translationKey = null) {
      const displayMessage = translationKey ? this.$t(translationKey) : message
      ElMessage({
        message: displayMessage,
        type: 'success',
        duration: 2000,
        showClose: true,
        customClass: 'elegant-success-message'
      })
    },
    
    // 显示警告消息
    showWarning(message, translationKey = null) {
      const displayMessage = translationKey ? this.$t(translationKey) : message
      ElMessage({
        message: displayMessage,
        type: 'warning',
        duration: 3000,
        showClose: true,
        customClass: 'elegant-warning-message'
      })
    },
    
    // 显示信息消息
    showInfo(message, translationKey = null) {
      const displayMessage = translationKey ? this.$t(translationKey) : message
      ElMessage({
        message: displayMessage,
        type: 'info',
        duration: 2000,
        showClose: true,
        customClass: 'elegant-info-message'
      })
    }
  }
}
</script>

<style>
/* 优雅的错误提示样式 */
.elegant-error-message {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  color: white;
  font-weight: 500;
}

.elegant-error-message .el-message__content {
  color: white;
}

.elegant-error-message .el-message__closeBtn {
  color: rgba(255, 255, 255, 0.8);
}

.elegant-error-message .el-message__closeBtn:hover {
  color: white;
}

.elegant-success-message {
  background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(81, 207, 102, 0.3);
  color: white;
  font-weight: 500;
}

.elegant-success-message .el-message__content {
  color: white;
}

.elegant-success-message .el-message__closeBtn {
  color: rgba(255, 255, 255, 0.8);
}

.elegant-success-message .el-message__closeBtn:hover {
  color: white;
}

.elegant-warning-message {
  background: linear-gradient(135deg, #ffd43b 0%, #fab005 100%);
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(255, 212, 59, 0.3);
  color: #333;
  font-weight: 500;
}

.elegant-info-message {
  background: linear-gradient(135deg, #74c0fc 0%, #339af0 100%);
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(116, 192, 252, 0.3);
  color: white;
  font-weight: 500;
}

.elegant-info-message .el-message__content {
  color: white;
}

.elegant-info-message .el-message__closeBtn {
  color: rgba(255, 255, 255, 0.8);
}

.elegant-info-message .el-message__closeBtn:hover {
  color: white;
}

.elegant-error-notification {
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.elegant-error-notification .el-notification__title {
  color: #ff6b6b;
  font-weight: 600;
}

.elegant-error-notification .el-notification__content {
  color: #666;
  line-height: 1.5;
}
</style>