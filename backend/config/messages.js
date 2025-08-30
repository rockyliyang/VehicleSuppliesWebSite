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
    INVALID_TOKEN: 'Invalid token, please login again',
    CAPTCHA_REQUIRED: 'Captcha is required',
    CAPTCHA_EXPIRED: 'Captcha expired, please refresh',
    CAPTCHA_INVALID: 'Invalid captcha',
    
    // 用户信息更新相关
    PROFILE_SUCCESS: 'User profile retrieved successfully',
    PROFILE_UPDATE_SUCCESS: 'User profile updated successfully',
    NO_FIELDS_TO_UPDATE: 'No fields to update',
    INVALID_PHONE_FORMAT: 'Invalid phone number format',
    INVALID_EMAIL_FORMAT: 'Invalid email format',
    INVALID_CURRENCY_FORMAT: 'Invalid currency format, must be 3-letter code',
    USERNAME_EXISTS: 'Username already exists',
    PHONE_UPDATE_SUCCESS: 'Phone number updated successfully',
    
    // 第三方登录相关
    THIRD_PARTY_LOGIN_SUCCESS: 'Third-party login successful',
    THIRD_PARTY_LOGIN_FAILED: 'Third-party login failed',
    THIRD_PARTY_ACCOUNT_BIND_SUCCESS: 'Third-party account bound successfully',
    THIRD_PARTY_ACCOUNT_BIND_FAILED: 'Failed to bind third-party account',
    THIRD_PARTY_ACCOUNT_UNBIND_SUCCESS: 'Third-party account unbound successfully',
    THIRD_PARTY_ACCOUNT_UNBIND_FAILED: 'Failed to unbind third-party account',
    THIRD_PARTY_ACCOUNT_EXISTS: 'Third-party account already exists',
    THIRD_PARTY_TOKEN_INVALID: 'Invalid third-party token',
    THIRD_PARTY_USER_INFO_FAILED: 'Failed to get third-party user information',
    APPLE_AUTH_FAILED: 'Apple authentication failed',
    GOOGLE_AUTH_FAILED: 'Google authentication failed',
    FACEBOOK_AUTH_FAILED: 'Facebook authentication failed',
    ACCOUNT_BINDING_REQUIRED: 'Account binding required',
    PROVIDER_REQUIRED: 'Provider is required',
    PROVIDER_USER_ID_REQUIRED: 'Provider user ID is required'
  },
  
  // 地址相关
  ADDRESS: {
    GET_SUCCESS: 'Address retrieved successfully',
    GET_FAILED: 'Failed to retrieve address',
    LIST_GET_SUCCESS: 'Address list retrieved successfully',
    LIST_GET_FAILED: 'Failed to retrieve address list',
    CREATE_SUCCESS: 'Address created successfully',
    CREATE_FAILED: 'Failed to create address',
    UPDATE_SUCCESS: 'Address updated successfully',
    UPDATE_FAILED: 'Failed to update address',
    DELETE_SUCCESS: 'Address deleted successfully',
    DELETE_FAILED: 'Failed to delete address',
    SET_DEFAULT_SUCCESS: 'Default address set successfully',
    SET_DEFAULT_FAILED: 'Failed to set default address',
    NOT_FOUND: 'Address not found',
    REQUIRED_FIELDS: 'Recipient name, phone and address are required'
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

  // 认证相关
  AUTH: {
    UNAUTHORIZED: 'Unauthorized, please login first',
    TOKEN_EXPIRED: 'Token expired, please login again',
    INVALID_TOKEN: 'Invalid token, please login again',
    ADMIN_REQUIRED: 'Admin permission required',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this operation'
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
    CART_EMPTY_PAYMENT: 'Cart is empty, cannot process payment',
    FETCH_SUCCESS: 'Orders retrieved successfully',
    FETCH_FAILED: 'Failed to retrieve orders',
    NOT_FOUND_OR_NO_PERMISSION: 'Order not found or no permission',
    LOGISTICS_UPDATE_SUCCESS: 'Order logistics updated successfully',
    LOGISTICS_UPDATE_FAILED: 'Failed to update order logistics',
    DETAIL_FETCH_SUCCESS: 'Order detail retrieved successfully',
    DETAIL_FETCH_FAILED: 'Failed to retrieve order detail'
  },

  // 物流相关
  LOGISTICS: {
    FETCH_COMPANIES_SUCCESS: 'Logistics companies retrieved successfully',
    FETCH_COMPANIES_FAILED: 'Failed to retrieve logistics companies',
    COMPANY_NAME_REQUIRED: 'Logistics company name is required',
    COMPANY_NAME_EXISTS: 'Logistics company name already exists',
    COMPANY_CREATE_SUCCESS: 'Logistics company created successfully',
    COMPANY_CREATE_FAILED: 'Failed to create logistics company',
    COMPANY_NOT_FOUND: 'Logistics company not found',
    NO_FIELDS_TO_UPDATE: 'No fields to update',
    COMPANY_UPDATE_SUCCESS: 'Logistics company updated successfully',
    COMPANY_UPDATE_FAILED: 'Failed to update logistics company',
    COMPANY_HAS_RECORDS: 'Cannot delete logistics company with existing records',
    COMPANY_DELETE_SUCCESS: 'Logistics company deleted successfully',
    COMPANY_DELETE_FAILED: 'Failed to delete logistics company',
    COMPANY_DETAIL_SUCCESS: 'Logistics company detail retrieved successfully',
    COMPANY_DETAIL_FAILED: 'Failed to retrieve logistics company detail',
    SET_DEFAULT_SUCCESS: 'Logistics company set as default successfully',
    SET_DEFAULT_FAILED: 'Failed to set logistics company as default',
    GET_DEFAULT_SUCCESS: 'Default logistics company retrieved successfully',
    GET_DEFAULT_FAILED: 'Failed to retrieve default logistics company',
    COMPANY_NOT_ACTIVE: 'Cannot set inactive company as default'
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
    REPAY_FAILED: 'Failed to initiate repayment',
    EXCHANGE_RATE_GET_SUCCESS: 'Exchange rate retrieved successfully',
    EXCHANGE_RATE_GET_FAILED: 'Failed to retrieve exchange rate',
    EXCHANGE_RATE_NOT_FOUND: 'Exchange rate not found'
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
  },

  // 通用内容管理相关
  COMMON_CONTENT: {
    NAV_LIST_SUCCESS: 'Navigation list retrieved successfully',
    NAV_LIST_FAILED: 'Failed to retrieve navigation list',
    CONTENT_SUCCESS: 'Content retrieved successfully',
    CONTENT_FAILED: 'Failed to retrieve content',
    CONTENT_NOT_FOUND: 'Content not found',
    NAME_KEY_REQUIRED: 'Name key is required',
    NAV_CODE_REQUIRED: 'Navigation code is required',
    NAV_ID_REQUIRED: 'Navigation ID is required',
    ADMIN_NAV_LIST_SUCCESS: 'Admin navigation list retrieved successfully',
    ADMIN_NAV_LIST_FAILED: 'Failed to retrieve admin navigation list',
    NAME_KEY_EXISTS: 'Name key already exists',
    NAV_CODE_EXISTS: 'Navigation code already exists',
    NAV_ADD_SUCCESS: 'Navigation added successfully',
    NAV_ADD_FAILED: 'Failed to add navigation',
    NAV_NOT_FOUND: 'Navigation not found',
    NAV_UPDATE_SUCCESS: 'Navigation updated successfully',
    NAV_UPDATE_FAILED: 'Failed to update navigation',
    NAV_DELETE_SUCCESS: 'Navigation deleted successfully',
    NAV_DELETE_FAILED: 'Failed to delete navigation',
    CONTENT_LIST_SUCCESS: 'Content list retrieved successfully',
    CONTENT_LIST_FAILED: 'Failed to retrieve content list',
    REQUIRED_FIELDS_MISSING: 'Required fields are missing',
    CONTENT_LANGUAGE_EXISTS: 'Content already exists for this language under this navigation',
    CONTENT_ADD_SUCCESS: 'Content added successfully',
    CONTENT_ADD_FAILED: 'Failed to add content',
    TITLE_CONTENT_REQUIRED: 'Title and content are required',
    CONTENT_UPDATE_SUCCESS: 'Content updated successfully',
    CONTENT_UPDATE_FAILED: 'Failed to update content',
    CONTENT_DELETE_SUCCESS: 'Content deleted successfully',
    CONTENT_DELETE_FAILED: 'Failed to delete content'
  },

  // 联系消息相关
  CONTACT: {
    VALIDATION_FAILED: 'Contact form validation failed',
    NAME_INVALID_LENGTH: 'Name must be between 2 and 32 characters',
    SUBJECT_TOO_LONG: 'Subject cannot exceed 128 characters',
    MESSAGE_TOO_SHORT: 'Message must be at least 10 characters',
    INVALID_EMAIL: 'Invalid email format',
    INVALID_PHONE: 'Invalid phone number format',
    MESSAGE_SUBMITTED: 'Contact message submitted successfully',
    MESSAGE_SUBMIT_FAILED: 'Failed to submit contact message',
    MESSAGE_LIST_SUCCESS: 'Contact message list retrieved successfully',
    MESSAGE_LIST_FAILED: 'Failed to retrieve contact message list',
    MESSAGE_DETAIL_SUCCESS: 'Contact message detail retrieved successfully',
    MESSAGE_DETAIL_FAILED: 'Failed to retrieve contact message detail',
    MESSAGE_NOT_FOUND: 'Contact message not found',
    MESSAGE_UPDATE_SUCCESS: 'Contact message updated successfully',
    MESSAGE_UPDATE_FAILED: 'Failed to update contact message',
    MESSAGE_ASSIGNED_SUCCESS: 'Contact message assigned successfully',
    MESSAGE_ASSIGN_FAILED: 'Failed to assign contact message',
    MESSAGE_DELETE_SUCCESS: 'Contact message deleted successfully',
    MESSAGE_DELETE_FAILED: 'Failed to delete contact message',
    INVALID_STATUS: 'Invalid message status',
    INVALID_ASSIGNEE: 'Invalid assignee user',
    ACCESS_DENIED: 'Access denied for this operation',
    CAPTCHA_REQUIRED: 'Captcha is required',
    CAPTCHA_EXPIRED: 'Captcha expired, please refresh',
    CAPTCHA_INVALID: 'Invalid captcha'
  },

  // 业务组相关
  BUSINESS_GROUP: {
    VALIDATION_FAILED: 'Business group validation failed',
    NAME_INVALID_LENGTH: 'Group name must be between 2 and 64 characters',
    INVALID_EMAIL: 'Invalid group email format',
    NAME_EXISTS: 'Business group name already exists',
    EMAIL_EXISTS: 'Business group email already exists',
    CREATE_SUCCESS: 'Business group created successfully',
    CREATE_FAILED: 'Failed to create business group',
    LIST_SUCCESS: 'Business group list retrieved successfully',
    LIST_FAILED: 'Failed to retrieve business group list',
    DETAIL_SUCCESS: 'Business group detail retrieved successfully',
    DETAIL_FAILED: 'Failed to retrieve business group detail',
    NOT_FOUND: 'Business group not found',
    UPDATE_SUCCESS: 'Business group updated successfully',
    UPDATE_FAILED: 'Failed to update business group',
    DELETE_SUCCESS: 'Business group deleted successfully',
    DELETE_FAILED: 'Failed to delete business group',
    CANNOT_DELETE_DEFAULT: 'Cannot delete default business group',
    HAS_MESSAGES: 'Cannot delete business group with existing messages',
    USER_ID_REQUIRED: 'User ID is required',
    INVALID_USER_ROLE: 'User must be business staff or admin',
    USER_ASSIGNED_SUCCESS: 'User assigned to business group successfully',
    USER_ASSIGN_FAILED: 'Failed to assign user to business group',
    USER_ALREADY_ASSIGNED: 'User already assigned to this business group',
    USER_NOT_IN_GROUP: 'User not found in business group',
    USER_REMOVED_SUCCESS: 'User removed from business group successfully',
    USER_REMOVE_FAILED: 'Failed to remove user from business group',
    AVAILABLE_USERS_SUCCESS: 'Available users retrieved successfully',
    AVAILABLE_USERS_FAILED: 'Failed to retrieve available users'
  },

  // 用户管理相关
  USER_MANAGEMENT: {
    INVALID_ROLE: 'Invalid user role',
    USER_NOT_FOUND: 'User not found',
    CANNOT_MODIFY_SELF: 'Cannot modify your own role',
    ROLE_UPDATE_SUCCESS: 'User role updated successfully',
    ROLE_UPDATE_FAILED: 'Failed to update user role',
    BUSINESS_STAFF_LIST_SUCCESS: 'Business staff list retrieved successfully',
    BUSINESS_STAFF_LIST_FAILED: 'Failed to retrieve business staff list',
    USER_DETAIL_SUCCESS: 'User detail retrieved successfully',
    USER_DETAIL_FAILED: 'Failed to retrieve user detail',
    USER_LIST_SUCCESS: 'User list retrieved successfully',
    USER_LIST_FAILED: 'Failed to retrieve user list',
    INVALID_USER_IDS: 'Invalid user IDs provided',
    SOME_USERS_NOT_FOUND: 'Some users not found',
    BATCH_ROLE_UPDATE_SUCCESS: 'Batch role update completed successfully',
    BATCH_ROLE_UPDATE_FAILED: 'Failed to perform batch role update',
    BUSINESS_GROUP_UPDATE_SUCCESS: 'User business group updated successfully',
    BUSINESS_GROUP_UPDATE_FAILED: 'Failed to update user business group',
    REQUIRED_FIELDS_MISSING: 'Required fields are missing',
    USERNAME_EXISTS: 'Username already exists',
    EMAIL_EXISTS: 'Email already exists',
    USER_CREATE_SUCCESS: 'User created successfully',
    USER_CREATE_FAILED: 'Failed to create user',
    INVALID_USER_ROLE_FOR_BUSINESS_GROUP: 'Invalid user role for business group assignment',
    INVALID_BUSINESS_GROUPS: 'Invalid business groups provided',
    BUSINESS_GROUPS_UPDATE_SUCCESS: 'Business groups updated successfully',
    BUSINESS_GROUPS_UPDATE_FAILED: 'Failed to update business groups',
    BUSINESS_GROUPS_SUCCESS: 'Business groups retrieved successfully',
    BUSINESS_GROUPS_FAILED: 'Failed to retrieve business groups',
    USER_BUSINESS_GROUPS_SUCCESS: 'User business groups retrieved successfully',
    USER_BUSINESS_GROUPS_FAILED: 'Failed to retrieve user business groups',
    NO_FIELDS_TO_UPDATE: 'No fields to update',
    USER_UPDATE_SUCCESS: 'User updated successfully',
    USER_UPDATE_FAILED: 'Failed to update user',
    PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long',
    CANNOT_DELETE_SELF: 'Cannot delete your own account',
     CANNOT_DELETE_ADMIN: 'Cannot delete admin account',
     CANNOT_DELETE_REGULAR_USER: 'Cannot delete regular user account',
     USER_DELETE_SUCCESS: 'User deleted successfully',
     USER_DELETE_FAILED: 'Failed to delete user'
  },

  // 产品图片相关
  PRODUCT_IMAGE: {
    UPLOAD_SUCCESS: 'Product image uploaded successfully',
    UPLOAD_FAILED: 'Failed to upload product image',
    NO_FILE_UPLOADED: 'No file uploaded',
    INVALID_FILE_TYPE: 'Invalid file type, please upload images (jpg, jpeg, png, gif) or videos (mp4, webm, ogg)',
    IMAGE_TOO_LARGE: 'Image file size cannot exceed 5MB',
    VIDEO_TOO_LARGE: 'Video file size cannot exceed 50MB',
    GET_SUCCESS: 'Product images retrieved successfully',
    GET_FAILED: 'Failed to retrieve product images',
    NOT_FOUND: 'Product image not found',
    DELETE_SUCCESS: 'Product image deleted successfully',
    DELETE_FAILED: 'Failed to delete product image',
    ORDER_UPDATE_SUCCESS: 'Product image order updated successfully',
    ORDER_UPDATE_FAILED: 'Failed to update product image order',
    MISSING_PARAMS: 'Missing required parameters',
    ASSIGN_SUCCESS: 'Product images assigned successfully',
    ASSIGN_FAILED: 'Failed to assign product images'
  },

  // 产品评论相关
  PRODUCT_REVIEW: {
    CREATE_SUCCESS: 'Product review created successfully',
    CREATE_FAILED: 'Failed to create product review',
    GET_SUCCESS: 'Product review retrieved successfully',
    GET_FAILED: 'Failed to retrieve product review',
    LIST_GET_SUCCESS: 'Product reviews retrieved successfully',
    LIST_GET_FAILED: 'Failed to retrieve product reviews',
    UPDATE_SUCCESS: 'Product review updated successfully',
    UPDATE_FAILED: 'Failed to update product review',
    DELETE_SUCCESS: 'Product review deleted successfully',
    DELETE_FAILED: 'Failed to delete product review',
    NOT_FOUND: 'Product review not found',
    ALREADY_REVIEWED: 'You have already reviewed this product',
    INVALID_RATING: 'Rating must be between 1 and 5',
    PRODUCT_ID_REQUIRED: 'Product ID is required',
    RATING_REQUIRED: 'Rating is required',
    REVIEW_CONTENT_TOO_LONG: 'Review content cannot exceed 2000 characters',
    ADMIN_REPLY_SUCCESS: 'Admin reply added successfully',
    ADMIN_REPLY_FAILED: 'Failed to add admin reply',
    STATUS_UPDATE_SUCCESS: 'Review status updated successfully',
    STATUS_UPDATE_FAILED: 'Failed to update review status',
    INVALID_STATUS: 'Invalid review status',
    PERMISSION_DENIED: 'Permission denied for this operation',
    STATS_GET_SUCCESS: 'Review statistics retrieved successfully',
    STATS_GET_FAILED: 'Failed to retrieve review statistics'
  },

  // 产品评论图片相关
  PRODUCT_REVIEW_IMAGE: {
    UPLOAD_SUCCESS: 'Review image uploaded successfully',
    UPLOAD_FAILED: 'Failed to upload review image',
    NO_FILE_UPLOADED: 'No file uploaded',
    INVALID_FILE_TYPE: 'Invalid file type, only images (jpg, jpeg, png, gif, webp) are allowed',
    IMAGE_TOO_LARGE: 'Image file size cannot exceed 5MB',
    GET_SUCCESS: 'Review images retrieved successfully',
    GET_FAILED: 'Failed to retrieve review images',
    NOT_FOUND: 'Review image not found',
    DELETE_SUCCESS: 'Review image deleted successfully',
    DELETE_FAILED: 'Failed to delete review image',
    ORDER_UPDATE_SUCCESS: 'Review image order updated successfully',
    ORDER_UPDATE_FAILED: 'Failed to update review image order',
    REVIEW_ID_REQUIRED: 'Review ID is required',
    MAX_IMAGES_EXCEEDED: 'Maximum 5 images allowed per review'
  },

  // 询价相关
  INQUIRY: {
    CREATE: {
      SUCCESS: 'INQUIRY.CREATE.SUCCESS',
      FAILED: 'INQUIRY.CREATE.FAILED'
    },
    FETCH: {
      SUCCESS: 'INQUIRY.FETCH.SUCCESS',
      FAILED: 'INQUIRY.FETCH.FAILED'
    },
    MESSAGE: {
      SEND_SUCCESS: 'INQUIRY.MESSAGE.SEND_SUCCESS',
      SEND_FAILED: 'INQUIRY.MESSAGE.SEND_FAILED',
      CONTENT_REQUIRED: 'INQUIRY.MESSAGE.CONTENT_REQUIRED',
      MARK_READ_SUCCESS: 'INQUIRY.MESSAGE.MARK_READ_SUCCESS',
      MARK_READ_FAILED: 'INQUIRY.MESSAGE.MARK_READ_FAILED'
    },
    UPDATE: {
      SUCCESS: 'INQUIRY.UPDATE.SUCCESS',
      FAILED: 'INQUIRY.UPDATE.FAILED'
    },
    DELETE: {
      SUCCESS: 'INQUIRY.DELETE.SUCCESS',
      FAILED: 'INQUIRY.DELETE.FAILED'
    },
    ITEM: {
      ADD: {
        SUCCESS: 'INQUIRY.ITEM.ADD.SUCCESS',
        FAILED: 'INQUIRY.ITEM.ADD.FAILED'
      },
      UPDATE: {
        SUCCESS: 'INQUIRY.ITEM.UPDATE.SUCCESS',
        FAILED: 'INQUIRY.ITEM.UPDATE.FAILED'
      },
      DELETE: {
        SUCCESS: 'INQUIRY.ITEM.DELETE.SUCCESS',
        FAILED: 'INQUIRY.ITEM.DELETE.FAILED'
      }
    },
    QUOTE: {
      SUCCESS: 'INQUIRY.QUOTE.SUCCESS',
      FAILED: 'INQUIRY.QUOTE.FAILED'
    },
    STATUS: {
      UPDATE: {
        SUCCESS: 'INQUIRY.STATUS.UPDATE.SUCCESS',
        FAILED: 'INQUIRY.STATUS.UPDATE.FAILED'
      }
    },
    SYNC_CART: {
      SUCCESS: 'INQUIRY.SYNC_CART.SUCCESS',
      FAILED: 'INQUIRY.SYNC_CART.FAILED'
    },
    VALIDATION: {
        INVALID_ID: 'INQUIRY.VALIDATION.INVALID_ID',
        INVALID_TITLE_PREFIX: 'INQUIRY.VALIDATION.INVALID_TITLE_PREFIX',
        NOT_FOUND: 'INQUIRY.VALIDATION.NOT_FOUND',
        ACCESS_DENIED: 'INQUIRY.VALIDATION.ACCESS_DENIED',
        MAX_INQUIRIES: 'INQUIRY.VALIDATION.MAX_INQUIRIES',
        PRODUCT_EXISTS: 'INQUIRY.VALIDATION.PRODUCT_EXISTS',
        INVALID_QUANTITY: 'INQUIRY.VALIDATION.INVALID_QUANTITY',
        INVALID_PRICE: 'INQUIRY.VALIDATION.INVALID_PRICE'
      },
    PERMISSION: {
      USER_ONLY: 'INQUIRY.PERMISSION.USER_ONLY',
      ADMIN_ONLY: 'INQUIRY.PERMISSION.ADMIN_ONLY'
    },
    BUSINESS: {
      CANNOT_MODIFY_COMPLETED: 'INQUIRY.BUSINESS.CANNOT_MODIFY_COMPLETED',
      CANNOT_DELETE_WITH_MESSAGES: 'INQUIRY.BUSINESS.CANNOT_DELETE_WITH_MESSAGES',
      PRODUCT_NOT_AVAILABLE: 'INQUIRY.BUSINESS.PRODUCT_NOT_AVAILABLE'
    }
  },

  // 国家省份数据相关
  COUNTRY_STATE: {
    GET_SUCCESS: 'Country and state data retrieved successfully',
    GET_FAILED: 'Failed to retrieve country and state data',
    DATA_NOT_MODIFIED: 'Country and state data not modified',
    FILE_READ_ERROR: 'Failed to read country or state data file'
  },

  // 标签相关
  TAG: {
    GET_SUCCESS: 'Tag retrieved successfully',
    GET_FAILED: 'Failed to retrieve tag',
    LIST_SUCCESS: 'Tag list retrieved successfully',
    LIST_FAILED: 'Failed to retrieve tag list',
    CREATE_SUCCESS: 'Tag created successfully',
    CREATE_FAILED: 'Failed to create tag',
    UPDATE_SUCCESS: 'Tag updated successfully',
    UPDATE_FAILED: 'Failed to update tag',
    DELETE_SUCCESS: 'Tag deleted successfully',
    DELETE_FAILED: 'Failed to delete tag',
    NOT_FOUND: 'Tag not found',
    REQUIRED_FIELDS: 'Value and type are required',
    INVALID_TYPE: 'Invalid tag type, only "country" is supported',
    INVALID_STATUS: 'Invalid status, must be "active" or "inactive"',
    VALUE_TYPE_EXISTS: 'Tag with this value and type combination already exists',
    NO_FIELDS_TO_UPDATE: 'No fields to update',
    HAS_RELATED_RECORDS: 'Cannot delete tag with existing related records'
  }
};

/**
 * 获取消息代码
 * @param {string} key - 消息键，支持点号分隔的嵌套键如 'USER.LOGIN_SUCCESS'
 * @param {object} params - 可选的参数对象，用于前端模板替换
 * @returns {string} 消息代码(key)，前端根据此代码查询翻译表
 */
function getMessage(key, params = {}) {
  const keys = key.split('.');
  let message = MESSAGES;
  
  // 验证消息键是否存在
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
  
  // 只返回消息代码(key)，不返回实际消息内容
  // 前端将使用此代码查询翻译表获取对应语言的消息
  return key;
}

module.exports = {
  MESSAGES,
  getMessage
};