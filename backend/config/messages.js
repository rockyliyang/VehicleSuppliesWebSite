/**
 * 后端API返回消息定义文件
 * 所有消息使用英文，前端根据语言设置进行翻译
 */

const MESSAGES = {
  // 通用消息
  SUCCESS: 'Operation successful',
  FAILED: 'Operation failed',
  SERVER_ERROR: 'Internal server error',
  INVALID_PARAMS: 'Invalid parameters',
  UNAUTHORIZED: 'Unauthorized, please login first',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  
  // 用户相关
  USER: {
    LOGIN_SUCCESS: 'Login successful',
    LOGIN_FAILED: 'Login failed',
    LOGOUT_SUCCESS: 'Logout successful',
    REGISTER_SUCCESS: 'Registration successful, please check your email to activate account',
    REGISTER_FAILED: 'Registration failed',
    USER_NOT_FOUND: 'User not found',
    USER_EXISTS: 'User already exists',
    EMAIL_EXISTS: 'Email already exists',
    PASSWORD_INCORRECT: 'Incorrect password',
    ACCOUNT_NOT_ACTIVATED: 'Account not activated',
    ACTIVATION_SUCCESS: 'Account activated successfully',
    ACTIVATION_FAILED: 'Activation failed',
    ACTIVATION_TOKEN_INVALID: 'Invalid activation token',
    RESET_EMAIL_SENT: 'Password reset email sent, please check your inbox',
    RESET_TOKEN_INVALID: 'Invalid reset token',
    RESET_TOKEN_EXPIRED: 'Reset token expired',
    PASSWORD_RESET_SUCCESS: 'Password reset successful',
    EMAIL_REQUIRED: 'Email is required',
    PASSWORD_REQUIRED: 'Password is required',
    EMAIL_PASSWORD_REQUIRED: 'Email and password are required',
    ADMIN_PERMISSION_REQUIRED: 'Admin permission required',
    NON_ADMIN_ACCOUNT: 'Non-admin account',
    USER_INFO_GET_SUCCESS: 'User information retrieved successfully',
    USER_LIST_GET_SUCCESS: 'User list retrieved successfully',
    ADMIN_CREATE_SUCCESS: 'Admin created successfully',
    USERNAME_EMAIL_EXISTS: 'Username or email already exists',
    TOKEN_VALID_RENEWED: 'Token is valid and renewed',
    TOKEN_EXPIRED: 'Token expired, please login again',
    INVALID_TOKEN: 'Invalid token, please login again'
  },
  
  // 购物车相关
  CART: {
    GET_SUCCESS: 'Cart retrieved successfully',
    GET_FAILED: 'Failed to retrieve cart',
    EMPTY: 'Cart is empty',
    ADD_SUCCESS: 'Product added to cart',
    ADD_FAILED: 'Failed to add product to cart',
    UPDATE_SUCCESS: 'Cart updated successfully',
    UPDATE_FAILED: 'Failed to update cart',
    REMOVE_SUCCESS: 'Product removed from cart',
    REMOVE_FAILED: 'Failed to remove product from cart',
    CLEAR_SUCCESS: 'Cart cleared successfully',
    CLEAR_FAILED: 'Failed to clear cart',
    PRODUCT_ID_REQUIRED: 'Product ID is required',
    PRODUCT_NOT_FOUND: 'Product not found',
    INSUFFICIENT_STOCK: 'Insufficient stock',
    QUANTITY_INVALID: 'Quantity must be greater than 0',
    ITEM_NOT_FOUND: 'Cart item not found',
    COUNT_GET_FAILED: 'Failed to get cart count'
  },
  
  // 订单相关
  ORDER: {
    CREATE_SUCCESS: 'Order created successfully',
    CREATE_FAILED: 'Failed to create order',
    GET_SUCCESS: 'Order retrieved successfully',
    GET_FAILED: 'Failed to retrieve order',
    LIST_GET_SUCCESS: 'Order list retrieved successfully',
    LIST_GET_FAILED: 'Failed to retrieve order list',
    DETAIL_GET_SUCCESS: 'Order details retrieved successfully',
    DETAIL_GET_FAILED: 'Failed to retrieve order details',
    NOT_FOUND: 'Order not found',
    CART_EMPTY: 'Cart is empty, cannot create order',
    CART_EMPTY_PAYMENT: 'Cart is empty, cannot process payment'
  },
  
  // 支付相关
  PAYMENT: {
    SUCCESS: 'Payment successful',
    FAILED: 'Payment failed',
    METHOD_NOT_SUPPORTED: 'Payment method not supported',
    GATEWAY_CONFIG_ERROR: 'Payment gateway configuration error',
    GATEWAY_NOT_CONFIGURED: 'Payment gateway not properly configured',
    CONFIG_GET_SUCCESS: 'Payment configuration retrieved successfully',
    CONFIG_GET_FAILED: 'Failed to retrieve payment configuration',
    QRCODE_GENERATE_SUCCESS: 'QR code generated successfully',
    QRCODE_GENERATE_FAILED: 'Failed to generate QR code',
    STATUS_CHECK_SUCCESS: 'Payment status checked successfully',
    PAYPAL_CONFIG_INCOMPLETE: 'PayPal configuration incomplete',
    ORDER_NOT_FOUND: 'Order not found',
    ORDER_ALREADY_PAID: 'Order already paid',
    ORDER_NOT_PENDING: 'Order is not in pending status',
    REPAY_SUCCESS: 'Repayment initiated successfully',
    REPAY_FAILED: 'Failed to initiate repayment'
  },
  
  // 产品相关
  PRODUCT: {
    GET_SUCCESS: 'Product retrieved successfully',
    GET_FAILED: 'Failed to retrieve product',
    LIST_GET_SUCCESS: 'Product list retrieved successfully',
    LIST_GET_FAILED: 'Failed to retrieve product list',
    CREATE_SUCCESS: 'Product created successfully',
    CREATE_FAILED: 'Failed to create product',
    UPDATE_SUCCESS: 'Product updated successfully',
    UPDATE_FAILED: 'Failed to update product',
    DELETE_SUCCESS: 'Product deleted successfully',
    DELETE_FAILED: 'Failed to delete product',
    NOT_FOUND: 'Product not found'
  },
  
  // 公司信息相关
  COMPANY: {
    GET_SUCCESS: 'Company information retrieved successfully',
    GET_FAILED: 'Failed to retrieve company information',
    UPDATE_SUCCESS: 'Company information updated successfully',
    UPDATE_FAILED: 'Failed to update company information',
    NOT_FOUND: 'Company information not found',
    LOGO_UPLOAD_SUCCESS: 'Logo uploaded successfully',
    LOGO_UPLOAD_FAILED: 'Failed to upload logo',
    WECHAT_QR_UPLOAD_SUCCESS: 'WeChat QR code uploaded successfully',
    WECHAT_QR_UPLOAD_FAILED: 'Failed to upload WeChat QR code',
    FILE_NOT_UPLOADED: 'No file uploaded',
    FILE_FORMAT_NOT_SUPPORTED: 'Only jpg/png formats are supported',
    FILE_SAVE_FAILED: 'Failed to save file'
  },
  
  // 语言翻译相关
  LANGUAGE: {
    GET_SUCCESS: 'Translations retrieved successfully',
    GET_FAILED: 'Failed to retrieve translations',
    ADD_SUCCESS: 'Translation added successfully',
    ADD_FAILED: 'Failed to add translation',
    UPDATE_SUCCESS: 'Translation updated successfully',
    UPDATE_FAILED: 'Failed to update translation',
    DELETE_SUCCESS: 'Translation deleted successfully',
    DELETE_FAILED: 'Failed to delete translation',
    NOT_FOUND: 'Translation not found',
    KEY_EXISTS: 'Translation key already exists for this language',
    REQUIRED_PARAMS_MISSING: 'Required parameters missing',
    SUPPORTED_LANGUAGES_GET_SUCCESS: 'Supported languages retrieved successfully',
    SUPPORTED_LANGUAGES_GET_FAILED: 'Failed to retrieve supported languages',
    DEFAULT_LANGUAGE_GET_SUCCESS: 'Default language retrieved successfully',
    DEFAULT_LANGUAGE_GET_FAILED: 'Failed to retrieve default language'
  },
  
  // Banner相关
  BANNER: {
    GET_SUCCESS: 'Banner retrieved successfully',
    GET_FAILED: 'Failed to retrieve banner',
    CREATE_SUCCESS: 'Banner created successfully',
    CREATE_FAILED: 'Failed to create banner',
    UPDATE_SUCCESS: 'Banner updated successfully',
    UPDATE_FAILED: 'Failed to update banner',
    DELETE_SUCCESS: 'Banner deleted successfully',
    DELETE_FAILED: 'Failed to delete banner',
    NOT_FOUND: 'Banner not found'
  }
};

/**
 * 获取消息文本
 * @param {string} key - 消息键，支持点号分隔的嵌套键如 'USER.LOGIN_SUCCESS'
 * @param {object} params - 可选的参数对象，用于消息模板替换
 * @returns {string} 消息文本
 */
function getMessage(key, params = {}) {
  const keys = key.split('.');
  let message = MESSAGES;
  
  for (const k of keys) {
    if (message && typeof message === 'object' && k in message) {
      message = message[k];
    } else {
      return key; // 如果找不到消息，返回原始键
    }
  }
  
  if (typeof message !== 'string') {
    return key; // 如果最终结果不是字符串，返回原始键
  }
  
  // 简单的模板替换
  let result = message;
  for (const [param, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
  }
  
  return result;
}

module.exports = {
  MESSAGES,
  getMessage
};