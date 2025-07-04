---
description: 后端API设计规则 - 接口规范、错误处理、认证授权等
globs: 
alwaysApply: true
---
# 后端API设计规则

## 接口设计规范

### RESTful API 设计原则

#### HTTP 方法使用规范
```
GET    /api/users          # 获取用户列表
GET    /api/users/{id}     # 获取单个用户
POST   /api/users          # 创建用户
PUT    /api/users/{id}     # 更新用户（完整更新）
PATCH  /api/users/{id}     # 更新用户（部分更新）
DELETE /api/users/{id}     # 删除用户（软删除）
```

#### URL 命名规范
1. **使用复数名词**：`/api/users`, `/api/products`
2. **使用小写字母**：避免大写字母
3. **使用连字符分隔**：`/api/product-categories`
4. **避免动词**：动作通过HTTP方法表达
5. **嵌套资源**：`/api/users/{userId}/orders`

#### 版本控制
```
/api/v1/users    # 版本1
/api/v2/users    # 版本2
```

### 统一响应格式

#### 成功响应格式
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  },
  "message": "操作成功",
  "timestamp": "2024-03-15T10:30:00Z"
}
```

#### 列表响应格式
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "username": "john_doe"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "message": "获取成功",
  "timestamp": "2024-03-15T10:30:00Z"
}
```

#### 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "输入数据验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2024-03-15T10:30:00Z"
}
```

## 国际化规范

### 消息定义规范

#### 消息文件结构
所有API返回的提示信息必须定义在 `backend/config/messages.js` 文件中，使用英文作为基础语言：

```javascript
const MESSAGES = {
  // 通用消息
  SUCCESS: 'Operation successful',
  FAILED: 'Operation failed',
  
  // 用户相关
  USER: {
    LOGIN_SUCCESS: 'Login successful',
    LOGIN_FAILED: 'Login failed',
    USER_NOT_FOUND: 'User not found',
    PASSWORD_INCORRECT: 'Incorrect password'
  },
  
  // 购物车相关
  CART: {
    ADD_SUCCESS: 'Product added to cart',
    ADD_FAILED: 'Failed to add product to cart',
    REMOVE_SUCCESS: 'Product removed from cart',
    CLEAR_SUCCESS: 'Cart cleared successfully'
  }
};
```

#### 消息使用规范

1. **引入消息函数**：
```javascript
const { getMessage } = require('../config/messages');
```

2. **使用消息键**：
```javascript
// 简单消息
res.json({
  success: true,
  message: getMessage('SUCCESS'),
  data: result
});

// 嵌套消息
res.json({
  success: true,
  message: getMessage('CART.ADD_SUCCESS'),
  data: result
});

// 带参数的消息（如果需要）
res.json({
  success: false,
  message: getMessage('USER.VALIDATION_ERROR', { field: 'email' })
});
```

3. **禁止硬编码**：
- ❌ 错误：`message: '操作成功'` 或 `message: 'Operation successful'`
- ✅ 正确：`message: getMessage('SUCCESS')`

#### 消息键命名规范

1. **使用英文大写**：`SUCCESS`, `FAILED`
2. **按模块分组**：`USER.LOGIN_SUCCESS`, `CART.ADD_SUCCESS`
3. **语义明确**：避免使用 `MSG1`, `ERROR1` 等无意义命名
4. **一致性**：同类型操作使用相同的命名模式
   - 成功：`MODULE.ACTION_SUCCESS`
   - 失败：`MODULE.ACTION_FAILED`
   - 未找到：`MODULE.NOT_FOUND`

#### 翻译数据管理

1. **数据库存储**：翻译数据存储在数据库的 `translations` 表中
2. **API接口**：提供 `/language/translations/{lang}` 接口供前端获取翻译
3. **语言检测**：提供 `/language/detect` 接口根据IP检测用户语言
4. **支持的语言**：通过 `/language/supported` 接口获取支持的语言列表

#### 前后端协作

1. **后端职责**：
   - 返回英文消息键对应的英文文本
   - 提供翻译数据API接口
   - 维护消息定义文件

2. **前端职责**：
   - 从数据库加载翻译数据
   - 在错误处理中自动翻译消息
   - 管理用户语言偏好设置

## HTTP 状态码规范

### 成功状态码
```
200 OK           # 请求成功
201 Created      # 资源创建成功
204 No Content   # 请求成功但无返回内容（如删除操作）
```

### 客户端错误状态码
```
400 Bad Request          # 请求参数错误
401 Unauthorized         # 未认证
403 Forbidden           # 无权限
404 Not Found           # 资源不存在
409 Conflict            # 资源冲突（如重复创建）
422 Unprocessable Entity # 请求格式正确但语义错误
429 Too Many Requests   # 请求频率限制
```

### 服务器错误状态码
```
500 Internal Server Error # 服务器内部错误
502 Bad Gateway          # 网关错误
503 Service Unavailable  # 服务不可用
504 Gateway Timeout      # 网关超时
```

## 错误处理规范

### 错误代码定义
```javascript
// 系统级错误
SYSTEM_ERROR = "SYSTEM_ERROR"           // 系统错误
DATABASE_ERROR = "DATABASE_ERROR"       // 数据库错误
NETWORK_ERROR = "NETWORK_ERROR"         // 网络错误

// 认证授权错误
UNAUTHORIZED = "UNAUTHORIZED"           // 未认证
FORBIDDEN = "FORBIDDEN"                 // 无权限
TOKEN_EXPIRED = "TOKEN_EXPIRED"         // Token过期
TOKEN_INVALID = "TOKEN_INVALID"         // Token无效

// 业务逻辑错误
VALIDATION_ERROR = "VALIDATION_ERROR"   // 验证错误
RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND" // 资源不存在
RESOURCE_CONFLICT = "RESOURCE_CONFLICT" // 资源冲突
BUSINESS_ERROR = "BUSINESS_ERROR"       // 业务逻辑错误

// 限流错误
RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED" // 请求频率超限
```

### 错误处理中间件
```javascript
// Express.js 错误处理中间件示例
function errorHandler(err, req, res, next) {
  const timestamp = new Date().toISOString();
  
  // 记录错误日志
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp
  });
  
  // 根据错误类型返回相应状态码和错误信息
  let statusCode = 500;
  let errorCode = 'SYSTEM_ERROR';
  let message = '服务器内部错误';
  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = '输入数据验证失败';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = '未授权访问';
  }
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
      details: err.details || []
    },
    timestamp
  });
}
```

## 认证与授权

### JWT Token 规范

#### Token 结构
```javascript
// JWT Payload 结构
{
  "sub": "user_id",           // 用户ID
  "username": "john_doe",     // 用户名
  "email": "john@example.com", // 邮箱
  "roles": ["user", "admin"], // 角色列表
  "permissions": [             // 权限列表
    "user:read",
    "user:write"
  ],
  "iat": 1647331200,          // 签发时间
  "exp": 1647417600           // 过期时间
}
```

#### Token 使用规范
```javascript
// 请求头格式
Authorization: Bearer <token>

// Token 验证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '缺少访问令牌'
      }
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: '无效的访问令牌'
        }
      });
    }
    
    req.user = user;
    next();
  });
}
```

### 权限控制

#### 基于角色的访问控制 (RBAC)
```javascript
// 权限检查中间件
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证用户'
        }
      });
    }
    
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '权限不足'
        }
      });
    }
    
    next();
  };
}

// 使用示例
app.get('/api/admin/users', 
  authenticateToken, 
  requirePermission('admin:users:read'), 
  getUsersController
);
```

## 数据验证规范

### 输入验证
```javascript
// 使用 Joi 进行数据验证
const Joi = require('joi');

// 用户注册验证规则
const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': '用户名只能包含字母和数字',
      'string.min': '用户名至少3个字符',
      'string.max': '用户名最多30个字符',
      'any.required': '用户名是必填项'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '邮箱格式不正确',
      'any.required': '邮箱是必填项'
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .required()
    .messages({
      'string.min': '密码至少8个字符',
      'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符',
      'any.required': '密码是必填项'
    })
});

// 验证中间件
function validateRequest(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '输入数据验证失败',
          details
        }
      });
    }
    
    next();
  };
}
```

## 分页和排序

### 分页参数规范
```javascript
// 查询参数
{
  page: 1,        // 页码（从1开始）
  pageSize: 20,   // 每页数量（默认20，最大100）
  sortBy: 'createdAt',  // 排序字段
  sortOrder: 'desc'     // 排序方向：asc/desc
}

// 分页处理函数
function getPaginationParams(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
  const offset = (page - 1) * pageSize;
  
  return { page, pageSize, offset };
}

// 排序处理函数
function getSortParams(req, allowedFields = []) {
  const sortBy = req.query.sortBy;
  const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
  
  if (sortBy && allowedFields.includes(sortBy)) {
    return { sortBy, sortOrder };
  }
  
  return { sortBy: 'createdAt', sortOrder: 'DESC' };
}
```

## 缓存策略

### Redis 缓存规范
```javascript
// 缓存键命名规范
const CACHE_KEYS = {
  USER_PROFILE: (userId) => `user:profile:${userId}`,
  USER_PERMISSIONS: (userId) => `user:permissions:${userId}`,
  PRODUCT_LIST: (page, pageSize) => `products:list:${page}:${pageSize}`,
  PRODUCT_DETAIL: (productId) => `product:detail:${productId}`
};

// 缓存时间设置
const CACHE_TTL = {
  SHORT: 300,    // 5分钟
  MEDIUM: 1800,  // 30分钟
  LONG: 3600,    // 1小时
  VERY_LONG: 86400 // 24小时
};

// 缓存工具函数
class CacheService {
  static async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }
  
  static async set(key, data, ttl = CACHE_TTL.MEDIUM) {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }
  
  static async del(key) {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }
}
```

## 日志记录规范

### 日志级别
```javascript
// 日志级别定义
const LOG_LEVELS = {
  ERROR: 'error',   // 错误信息
  WARN: 'warn',     // 警告信息
  INFO: 'info',     // 一般信息
  DEBUG: 'debug'    // 调试信息
};

// 日志记录示例
logger.info('User login', {
  userId: user.id,
  username: user.username,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  timestamp: new Date().toISOString()
});

logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
```

### 审计日志
```javascript
// 审计日志记录
function auditLog(action, resource, userId, details = {}) {
  const auditEntry = {
    action,           // 操作类型：CREATE, UPDATE, DELETE, READ
    resource,         // 资源类型：USER, PRODUCT, ORDER
    userId,           // 操作用户ID
    details,          // 详细信息
    timestamp: new Date().toISOString(),
    ip: req.ip
  };
  
  // 记录到审计日志表或文件
  auditLogger.info('Audit log', auditEntry);
}

// 使用示例
auditLog('CREATE', 'USER', req.user.id, {
  targetUserId: newUser.id,
  username: newUser.username
});
```

## 性能优化

### 数据库查询优化
```javascript
// 避免 N+1 查询问题
// 错误方式
const users = await User.findAll();
for (const user of users) {
  user.orders = await Order.findAll({ where: { userId: user.id } });
}

// 正确方式
const users = await User.findAll({
  include: [{
    model: Order,
    as: 'orders'
  }]
});

// 使用索引优化查询
const products = await Product.findAll({
  where: {
    categoryId: categoryId,  // 确保 categoryId 有索引
    status: 'active',        // 确保 status 有索引
    deleted: false           // 确保 deleted 有索引
  },
  order: [['createdAt', 'DESC']], // 确保 createdAt 有索引
  limit: pageSize,
  offset: offset
});
```

### 接口限流
```javascript
const rateLimit = require('express-rate-limit');

// 通用限流配置
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100个请求
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求频率过高，请稍后再试'
    }
  }
});

// 登录接口限流
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次登录尝试
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '登录尝试次数过多，请15分钟后再试'
    }
  }
});
```

## API 文档规范

### Swagger/OpenAPI 文档
```yaml
# swagger.yaml 示例
openapi: 3.0.0
info:
  title: Vehicle Supplies API
  version: 1.0.0
  description: 汽车用品网站API文档

paths:
  /api/v1/users:
    get:
      summary: 获取用户列表
      tags:
        - Users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: pageSize
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: 成功获取用户列表
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          description: 用户ID
        username:
          type: string
          description: 用户名
        email:
          type: string
          description: 邮箱地址
```

## 测试规范

### 单元测试
```javascript
// 使用 Jest 进行单元测试
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#'
      };
      
      const result = await UserService.createUser(userData);
      
      expect(result.success).toBe(true);
      expect(result.data.username).toBe(userData.username);
      expect(result.data.email).toBe(userData.email);
    });
    
    it('should throw error for duplicate username', async () => {
      const userData = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'Test123!@#'
      };
      
      await expect(UserService.createUser(userData))
        .rejects
        .toThrow('用户名已存在');
    });
  });
});
```

### 集成测试
```javascript
// API 集成测试
describe('POST /api/v1/users', () => {
  it('should create user successfully', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!@#'
    };
    
    const response = await request(app)
      .post('/api/v1/users')
      .send(userData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.username).toBe(userData.username);
  });
});
```

## 多语言支持规范

### 消息键管理

#### getMessage函数使用规范
1. **统一引入路径**：所有文件必须使用 `require('../config/messages')` 引入getMessage函数
2. **消息键命名规范**：
   ```
   模块.操作.状态
   例如：USER.LOGIN.SUCCESS, PRODUCT.CREATE.FAILED
   ```
3. **消息键分类**：
   - `AUTH.*` - 认证授权相关
   - `USER.*` - 用户操作相关
   - `PRODUCT.*` - 产品操作相关
   - `CART.*` - 购物车操作相关
   - `ORDER.*` - 订单操作相关
   - `PAYMENT.*` - 支付相关
   - `COMMON.*` - 通用消息

#### 新增消息键规则
**重要：每当添加新的消息键时，必须同时执行以下步骤：**

1. **在 `config/messages.js` 中添加新的消息键**
2. **更新 `db/insert_message_translations.sql` 文件**，添加对应的中英文翻译：
   ```sql
   -- 新增消息键翻译
   INSERT INTO language_translations (guid, code, lang, value) VALUES
   (gen_random_uuid(), 'NEW.MESSAGE.KEY', 'en', 'English message'),
   (gen_random_uuid(), 'NEW.MESSAGE.KEY', 'zh-CN', '中文消息');
   ```
3. **执行SQL脚本更新数据库**
4. **通知前端团队同步更新前端翻译文件**

#### getMessage函数返回值
- getMessage函数只返回消息键（code），不返回完整消息文本
- 前端通过消息键查询language_translations表获取对应语言的翻译文本
- 这确保了前后端翻译功能的一致性

### 示例代码
```javascript
// 正确的使用方式
const { getMessage } = require('../config/messages');

// 在控制器中使用
res.status(200).json({
  success: true,
  message: getMessage('USER.LOGIN.SUCCESS'),
  data: userData
});

// 错误处理中使用
res.status(400).json({
  success: false,
  message: getMessage('USER.EMAIL_EXISTS')
});
```

## GUID 字段处理规范

### GUID 插入规则

**重要：所有包含 GUID 字段的表在插入数据时，必须使用以下统一方法：**

#### 1. 使用 UUID 工具函数（推荐）
```javascript
// 引入 UUID 工具
const { v4: uuidv4 } = require('uuid');

// 生成 GUID
const guid = uuidv4();

// 插入数据
const result = await pool.query(
  'INSERT INTO table_name (guid, field1, field2) VALUES ($1, $2, $3)',
  [guid, value1, value2]
);
```

#### 2. 使用 PostgreSQL 函数（备选）
```javascript
// 直接在 SQL 中使用 gen_random_uuid()
const result = await pool.query(
  'INSERT INTO table_name (guid, field1, field2) VALUES (gen_random_uuid(), $1, $2)',
  [value1, value2]
);
```

#### 3. 使用默认值（推荐用于新表）
```javascript
// 利用表定义中的默认值 gen_random_uuid()
const result = await pool.query(
  'INSERT INTO table_name (field1, field2) VALUES ($1, $2)',
  [value1, value2]
);
```

### GUID 字段规范要求

1. **所有表必须包含 GUID 字段**：
   - 字段名：`guid`
   - 类型：`UUID`
   - 约束：`NOT NULL UNIQUE DEFAULT gen_random_uuid()`

2. **插入数据时的 GUID 处理**：
   - 可以依赖数据库默认值（推荐）
   - 也可以显式提供 GUID 值

3. **GUID 生成方法选择**：
   - **新代码**：优先使用方法3（依赖默认值）或方法1（UUID工具函数）
   - **数据库脚本**：使用方法2（PostgreSQL函数）
   - **需要预知GUID的场景**：使用方法1（UUID工具函数）

### 常见错误及解决方案

#### PostgreSQL GUID 字段最佳实践
```javascript
// ✅ 推荐：依赖默认值（最简洁）
const result = await pool.query(
  'INSERT INTO user_business_groups (user_id, business_group_id, assigned_by) VALUES ($1, $2, $3) RETURNING guid',
  [userId, businessGroupId, assignedBy]
);

// ✅ 备选：显式提供 GUID
const { v4: uuidv4 } = require('uuid');
const guid = uuidv4();
const result = await pool.query(
  'INSERT INTO user_business_groups (guid, user_id, business_group_id, assigned_by) VALUES ($1, $2, $3, $4)',
  [guid, userId, businessGroupId, assignedBy]
);
```

#### 迁移注意事项
1. 参数占位符从 `?` 改为 `$1, $2, $3...`
2. GUID 字段类型从 `BINARY(16)` 改为 `UUID`
3. 移除 `uuidToBinary` 工具函数的使用
4. 软删除字段值从数字改为布尔值（`0` → `false`, `1` → `true`）
5. 查询结果解构从 `const [result]` 改为 `const result`