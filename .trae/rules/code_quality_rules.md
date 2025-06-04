---
description: 代码质量和测试规则 - 代码规范、测试策略、性能优化等
globs: 
alwaysApply: true
---
# 代码质量和测试规则

## 代码规范

### 通用编码规范

#### 命名规范
```javascript
// 变量和函数 - camelCase
const userName = 'john_doe';
const userAge = 25;
function getUserProfile() {}
function calculateTotalPrice() {}

// 常量 - SCREAMING_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;
const DEFAULT_PAGE_SIZE = 20;

// 类名 - PascalCase
class UserService {}
class ProductManager {}
class OrderProcessor {}

// 文件名 - kebab-case 或 PascalCase（组件）
user-service.js
product-manager.js
UserProfile.vue
ProductCard.vue

// 数据库表名 - snake_case
users
product_categories
order_items

// 数据库字段名 - snake_case
user_id
created_at
updated_at
first_name
```

#### 注释规范
```javascript
/**
 * 用户服务类
 * 负责处理用户相关的业务逻辑
 * 
 * @class UserService
 * @author 开发者姓名
 * @since 2024-03-15
 */
class UserService {
  /**
   * 获取用户信息
   * 
   * @param {number} userId - 用户ID
   * @param {Object} options - 选项参数
   * @param {boolean} options.includeProfile - 是否包含详细资料
   * @returns {Promise<Object>} 用户信息对象
   * @throws {Error} 当用户不存在时抛出错误
   * 
   * @example
   * const user = await userService.getUserById(123, { includeProfile: true });
   */
  async getUserById(userId, options = {}) {
    // 参数验证
    if (!userId || typeof userId !== 'number') {
      throw new Error('用户ID必须是有效的数字');
    }
    
    try {
      // 查询用户基本信息
      const user = await this.findUserById(userId);
      
      // 如果需要包含详细资料
      if (options.includeProfile) {
        user.profile = await this.getUserProfile(userId);
      }
      
      return user;
    } catch (error) {
      // 记录错误日志
      logger.error('获取用户信息失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 私有方法：查找用户
   * @private
   */
  async findUserById(userId) {
    // 实现细节
  }
}

// 单行注释规范
// TODO: 需要添加缓存机制
// FIXME: 修复并发访问问题
// NOTE: 这里使用了特殊的算法
// HACK: 临时解决方案，后续需要重构
```

#### 代码格式化
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    '@vue/typescript/recommended',
    '@vue/prettier',
    '@vue/prettier/@typescript-eslint'
  ],
  rules: {
    // 缩进：2个空格
    'indent': ['error', 2],
    
    // 引号：单引号
    'quotes': ['error', 'single'],
    
    // 分号：必须有
    'semi': ['error', 'always'],
    
    // 行尾逗号
    'comma-dangle': ['error', 'never'],
    
    // 最大行长度
    'max-len': ['error', { code: 100 }],
    
    // 函数最大行数
    'max-lines-per-function': ['error', { max: 50 }],
    
    // 最大嵌套深度
    'max-depth': ['error', 4],
    
    // 禁用 console（生产环境）
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    
    // 禁用 debugger（生产环境）
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    
    // 未使用的变量
    'no-unused-vars': 'error',
    
    // 变量声明
    'prefer-const': 'error',
    'no-var': 'error'
  }
};

// .prettierrc.js
module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'none',
  printWidth: 100,
  bracketSpacing: true,
  arrowParens: 'avoid'
};
```

### 错误处理规范

#### 统一错误处理
```javascript
// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource = '资源') {
    super(`${resource}不存在`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

// 错误处理工具函数
class ErrorHandler {
  /**
   * 包装异步函数，统一处理错误
   */
  static catchAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
  
  /**
   * 处理数据库错误
   */
  static handleDatabaseError(error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return new ValidationError('数据已存在');
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return new ValidationError('关联数据不存在');
    }
    
    return new AppError('数据库操作失败', 500, 'DATABASE_ERROR');
  }
  
  /**
   * 发送错误响应
   */
  static sendErrorResponse(error, res) {
    const { statusCode = 500, errorCode = 'INTERNAL_ERROR', message } = error;
    
    // 记录错误日志
    if (statusCode >= 500) {
      logger.error('服务器错误', {
        error: message,
        stack: error.stack,
        errorCode
      });
    }
    
    // 生产环境不暴露详细错误信息
    const responseMessage = statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : message;
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: responseMessage,
        details: error.details || []
      },
      timestamp: new Date().toISOString()
    });
  }
}

// 使用示例
const userController = {
  // 使用 catchAsync 包装
  getUser: ErrorHandler.catchAsync(async (req, res) => {
    const { id } = req.params;
    
    // 参数验证
    if (!id || isNaN(id)) {
      throw new ValidationError('用户ID必须是有效的数字');
    }
    
    // 查询用户
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError('用户');
    }
    
    res.json({
      success: true,
      data: user
    });
  })
};
```

#### 前端错误处理
```javascript
// Vue 全局错误处理
Vue.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err);
  console.error('Component:', vm);
  console.error('Info:', info);
  
  // 发送错误报告
  errorReporter.report({
    error: err.message,
    stack: err.stack,
    component: vm.$options.name || 'Unknown',
    info
  });
};

// 组件错误边界
export default {
  name: 'ErrorBoundary',
  
  data() {
    return {
      hasError: false,
      error: null
    };
  },
  
  errorCaptured(err, instance, info) {
    this.hasError = true;
    this.error = err;
    
    // 记录错误
    console.error('Component Error:', err);
    
    // 阻止错误继续传播
    return false;
  },
  
  render(h) {
    if (this.hasError) {
      return h('div', {
        class: 'error-boundary'
      }, [
        h('h3', '出现了一些问题'),
        h('p', '请刷新页面重试'),
        h('button', {
          on: {
            click: () => {
              this.hasError = false;
              this.error = null;
            }
          }
        }, '重试')
      ]);
    }
    
    return this.$slots.default;
  }
};
```

## 测试策略

### 测试金字塔

#### 单元测试（70%）
```javascript
// 使用 Jest 进行单元测试
// tests/unit/services/user.service.test.js
import UserService from '@/services/user.service';
import { User } from '@/models';

// Mock 数据库模型
jest.mock('@/models');

describe('UserService', () => {
  let userService;
  
  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });
  
  describe('getUserById', () => {
    it('应该返回用户信息', async () => {
      // Arrange
      const userId = 1;
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };
      User.findById.mockResolvedValue(mockUser);
      
      // Act
      const result = await userService.getUserById(userId);
      
      // Assert
      expect(result).toEqual(mockUser);
      expect(User.findById).toHaveBeenCalledWith(userId);
    });
    
    it('当用户不存在时应该抛出错误', async () => {
      // Arrange
      const userId = 999;
      User.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(userService.getUserById(userId))
        .rejects
        .toThrow('用户不存在');
    });
    
    it('当传入无效ID时应该抛出验证错误', async () => {
      // Arrange
      const invalidId = 'invalid';
      
      // Act & Assert
      await expect(userService.getUserById(invalidId))
        .rejects
        .toThrow('用户ID必须是有效的数字');
    });
  });
  
  describe('createUser', () => {
    it('应该创建新用户', async () => {
      // Arrange
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      };
      const mockCreatedUser = { id: 1, ...userData };
      User.create.mockResolvedValue(mockCreatedUser);
      
      // Act
      const result = await userService.createUser(userData);
      
      // Assert
      expect(result).toEqual(mockCreatedUser);
      expect(User.create).toHaveBeenCalledWith(userData);
    });
  });
});

// Vue 组件单元测试
// tests/unit/components/UserCard.test.js
import { shallowMount } from '@vue/test-utils';
import UserCard from '@/components/UserCard.vue';

describe('UserCard.vue', () => {
  let wrapper;
  
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    avatar: 'avatar.jpg'
  };
  
  beforeEach(() => {
    wrapper = shallowMount(UserCard, {
      propsData: {
        user: mockUser
      }
    });
  });
  
  afterEach(() => {
    wrapper.destroy();
  });
  
  it('应该渲染用户信息', () => {
    expect(wrapper.find('.user-card__name').text()).toBe(mockUser.username);
    expect(wrapper.find('.user-card__email').text()).toBe(mockUser.email);
    expect(wrapper.find('.user-card__avatar').attributes('src')).toBe(mockUser.avatar);
  });
  
  it('点击编辑按钮应该触发 edit 事件', async () => {
    const editButton = wrapper.find('.user-card__edit-btn');
    await editButton.trigger('click');
    
    expect(wrapper.emitted().edit).toBeTruthy();
    expect(wrapper.emitted().edit[0]).toEqual([mockUser]);
  });
  
  it('当没有头像时应该显示默认头像', () => {
    const userWithoutAvatar = { ...mockUser, avatar: null };
    wrapper.setProps({ user: userWithoutAvatar });
    
    expect(wrapper.find('.user-card__avatar').attributes('src'))
      .toBe('/images/default-avatar.png');
  });
});
```

#### 集成测试（20%）
```javascript
// tests/integration/api/users.test.js
import request from 'supertest';
import app from '@/app';
import { User } from '@/models';
import { generateToken } from '@/utils/auth';

describe('Users API', () => {
  let authToken;
  
  beforeAll(async () => {
    // 创建测试用户并获取认证令牌
    const testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    authToken = generateToken(testUser);
  });
  
  afterAll(async () => {
    // 清理测试数据
    await User.destroy({ where: {} });
  });
  
  describe('GET /api/users', () => {
    it('应该返回用户列表', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('pagination');
    });
    
    it('未认证用户应该返回401', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });
  });
  
  describe('POST /api/users', () => {
    it('应该创建新用户', async () => {
      const newUser = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUser)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(newUser.username);
      expect(response.body.data.email).toBe(newUser.email);
      expect(response.body.data).not.toHaveProperty('password');
    });
    
    it('重复用户名应该返回409', async () => {
      const duplicateUser = {
        username: 'testuser', // 已存在的用户名
        email: 'duplicate@example.com',
        password: 'password123'
      };
      
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateUser)
        .expect(409);
    });
  });
});
```

#### 端到端测试（10%）
```javascript
// tests/e2e/user-management.test.js
import { test, expect } from '@playwright/test';

test.describe('用户管理', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-btn"]');
    await page.waitForURL('/');
  });
  
  test('应该能够查看用户列表', async ({ page }) => {
    await page.goto('/users');
    
    // 等待用户列表加载
    await page.waitForSelector('[data-testid="user-table"]');
    
    // 验证表格存在
    const table = page.locator('[data-testid="user-table"]');
    await expect(table).toBeVisible();
    
    // 验证至少有一行数据
    const rows = page.locator('[data-testid="user-row"]');
    await expect(rows).toHaveCountGreaterThan(0);
  });
  
  test('应该能够创建新用户', async ({ page }) => {
    await page.goto('/users');
    
    // 点击添加用户按钮
    await page.click('[data-testid="add-user-btn"]');
    
    // 填写用户信息
    await page.fill('[data-testid="username-input"]', 'newuser');
    await page.fill('[data-testid="email-input"]', 'new@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    
    // 提交表单
    await page.click('[data-testid="submit-btn"]');
    
    // 验证成功消息
    await expect(page.locator('.el-message--success')).toBeVisible();
    
    // 验证用户出现在列表中
    await expect(page.locator('text=newuser')).toBeVisible();
  });
  
  test('应该能够编辑用户信息', async ({ page }) => {
    await page.goto('/users');
    
    // 点击第一个用户的编辑按钮
    await page.click('[data-testid="edit-btn"]:first-child');
    
    // 修改用户名
    await page.fill('[data-testid="username-input"]', 'updateduser');
    
    // 保存更改
    await page.click('[data-testid="save-btn"]');
    
    // 验证成功消息
    await expect(page.locator('.el-message--success')).toBeVisible();
    
    // 验证更改已保存
    await expect(page.locator('text=updateduser')).toBeVisible();
  });
});
```

### 测试工具配置

#### Jest 配置
```javascript
// jest.config.js
module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,vue}',
    '!src/main.js',
    '!src/router/index.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};

// tests/setup.js
import { config } from '@vue/test-utils';
import ElementUI from 'element-ui';
import VueI18n from 'vue-i18n';

// 全局配置
config.mocks = {
  $t: key => key,
  $tc: key => key,
  $message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  },
  $api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    getWithErrorHandler: jest.fn(),
    postWithErrorHandler: jest.fn()
  }
};

// 全局插件
config.plugins.VueWrapper.install(ElementUI);
config.plugins.VueWrapper.install(VueI18n);
```

## 性能优化

### 代码分割
```javascript
// 路由级别的代码分割
const routes = [
  {
    path: '/users',
    component: () => import(/* webpackChunkName: "users" */ '@/views/Users.vue')
  },
  {
    path: '/products',
    component: () => import(/* webpackChunkName: "products" */ '@/views/Products.vue')
  }
];

// 组件级别的代码分割
export default {
  components: {
    HeavyComponent: () => import('@/components/HeavyComponent.vue')
  }
};

// 第三方库的代码分割
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        },
        elementUI: {
          test: /[\\/]node_modules[\\/]element-ui[\\/]/,
          name: 'element-ui',
          chunks: 'all'
        }
      }
    }
  }
};
```

### 缓存策略
```javascript
// 内存缓存
class MemoryCache {
  constructor(ttl = 300000) { // 默认5分钟
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  set(key, value) {
    const expiry = Date.now() + this.ttl;
    this.cache.set(key, { value, expiry });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  clear() {
    this.cache.clear();
  }
}

// API 缓存装饰器
function cached(ttl = 300000) {
  return function(target, propertyName, descriptor) {
    const method = descriptor.value;
    const cache = new MemoryCache(ttl);
    
    descriptor.value = async function(...args) {
      const key = JSON.stringify(args);
      let result = cache.get(key);
      
      if (result === null) {
        result = await method.apply(this, args);
        cache.set(key, result);
      }
      
      return result;
    };
  };
}

// 使用示例
class UserService {
  @cached(600000) // 缓存10分钟
  async getUserProfile(userId) {
    return await api.get(`/users/${userId}/profile`);
  }
}
```

### 数据库优化
```javascript
// 查询优化
class UserRepository {
  // 使用索引优化查询
  async findActiveUsers(page = 1, pageSize = 20) {
    return await User.findAndCountAll({
      where: {
        status: 'active',  // 确保 status 字段有索引
        deleted: 0         // 确保 deleted 字段有索引
      },
      order: [['createdAt', 'DESC']], // 确保 createdAt 字段有索引
      limit: pageSize,
      offset: (page - 1) * pageSize,
      attributes: ['id', 'username', 'email', 'createdAt'], // 只查询需要的字段
      include: [{
        model: Profile,
        attributes: ['firstName', 'lastName', 'avatar']
      }]
    });
  }
  
  // 批量操作优化
  async createUsers(usersData) {
    // 使用事务确保数据一致性
    const transaction = await sequelize.transaction();
    
    try {
      // 批量插入而不是逐个插入
      const users = await User.bulkCreate(usersData, {
        transaction,
        returning: true
      });
      
      await transaction.commit();
      return users;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  // 避免 N+1 查询
  async getUsersWithOrders() {
    return await User.findAll({
      include: [{
        model: Order,
        include: [{
          model: OrderItem,
          include: [Product]
        }]
      }]
    });
  }
}
```

## 监控和日志

### 日志系统
```javascript
// logger.js
const winston = require('winston');
const { format } = winston;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: {
    service: 'vehicle-supplies-api',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // 错误日志
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // 所有日志
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

// 请求日志中间件
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    });
  });
  
  next();
}

module.exports = { logger, requestLogger };
```

### 性能监控
```javascript
// performance.js
class PerformanceMonitor {
  static measureExecutionTime(target, propertyName, descriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function(...args) {
      const start = process.hrtime.bigint();
      
      try {
        const result = await method.apply(this, args);
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // 转换为毫秒
        
        logger.info('Method execution time', {
          class: target.constructor.name,
          method: propertyName,
          duration,
          args: args.length
        });
        
        return result;
      } catch (error) {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000;
        
        logger.error('Method execution failed', {
          class: target.constructor.name,
          method: propertyName,
          duration,
          error: error.message
        });
        
        throw error;
      }
    };
  }
  
  static trackMemoryUsage() {
    const usage = process.memoryUsage();
    
    logger.info('Memory usage', {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    });
  }
}

// 使用示例
class UserService {
  @PerformanceMonitor.measureExecutionTime
  async createUser(userData) {
    // 方法实现
  }
}

// 定期监控内存使用
setInterval(() => {
  PerformanceMonitor.trackMemoryUsage();
}, 60000); // 每分钟记录一次
```

### 错误追踪
```javascript
// error-tracker.js
class ErrorTracker {
  static init() {
    // 捕获未处理的 Promise 拒绝
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason: reason.toString(),
        stack: reason.stack,
        promise
      });
      
      // 发送到错误追踪服务
      this.sendToErrorService({
        type: 'unhandledRejection',
        error: reason
      });
    });
    
    // 捕获未处理的异常
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
      });
      
      this.sendToErrorService({
        type: 'uncaughtException',
        error
      });
      
      // 优雅关闭
      process.exit(1);
    });
  }
  
  static async sendToErrorService(errorData) {
    try {
      // 发送到第三方错误追踪服务（如 Sentry）
      await fetch('https://error-tracking-service.com/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ERROR_TRACKING_TOKEN}`
        },
        body: JSON.stringify({
          ...errorData,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          version: process.env.APP_VERSION
        })
      });
    } catch (error) {
      logger.error('Failed to send error to tracking service', {
        error: error.message
      });
    }
  }
}

// 初始化错误追踪
ErrorTracker.init();
```

## 代码审查清单

### 审查要点
```markdown
## 代码审查清单

### 功能性
- [ ] 代码是否实现了预期功能？
- [ ] 是否有遗漏的边界情况？
- [ ] 错误处理是否完整？
- [ ] 是否有潜在的安全漏洞？

### 代码质量
- [ ] 代码是否易于理解？
- [ ] 变量和函数命名是否清晰？
- [ ] 是否遵循了项目的编码规范？
- [ ] 是否有重复代码需要重构？

### 性能
- [ ] 是否有性能瓶颈？
- [ ] 数据库查询是否优化？
- [ ] 是否有内存泄漏风险？
- [ ] 是否需要添加缓存？

### 测试
- [ ] 是否有足够的单元测试？
- [ ] 测试覆盖率是否达标？
- [ ] 是否需要集成测试？
- [ ] 边界情况是否被测试？

### 文档
- [ ] 是否有必要的注释？
- [ ] API 文档是否更新？
- [ ] README 是否需要更新？
- [ ] 是否有使用示例？

### 安全性
- [ ] 输入验证是否充分？
- [ ] 是否有 SQL 注入风险？
- [ ] 敏感信息是否被正确处理？
- [ ] 权限控制是否正确？
```

---

> 📝 **注意**: 所有代码开发都应遵循以上质量标准，确保代码的可靠性、可维护性和安全性。