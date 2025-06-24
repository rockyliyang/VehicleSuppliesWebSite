# 询价系统设计文档（简化版）

## 1. 系统概述

### 1.1 功能目标
- 用户可以创建询价单，添加商品并与业务员实时沟通
- 业务员可以查看所有询价单，提供报价并回复用户
- 支持实时消息推送，提升沟通效率
- 询价单可以同步到购物车，简化购买流程

### 1.2 核心设计原则
- **复用现有代码**：最大化利用项目现有的公共组件和工具
- **简化状态管理**：避免过度使用Vuex，优先组件本地状态
- **统一错误处理**：使用现有的错误处理机制
- **国际化支持**：所有消息键必须在翻译系统中定义

## 2. 系统架构

### 2.1 整体架构
```
前端 (Vue.js)
├── 询价组件 (本地状态管理)
├── 实时通信 (SSE)
└── API调用 (现有api.js工具)

后端 (Node.js)
├── 询价API (RESTful)
├── 实时推送 (SSE)
└── 数据存储 (MySQL)
```

### 2.2 技术选型理由
- **SSE vs WebSocket**：单向推送足够，SSE更简单轻量
- **本地状态 vs Vuex**：询价数据主要在单个组件内使用
- **现有工具集成**：减少重复开发，保持代码一致性

## 3. 数据模型设计

### 3.1 数据库脚本目录规范

**⚠️ 重要：数据库脚本存放规则**
- **建表脚本**：所有新建表的CREATE TABLE语句必须放在 `db/main/` 目录下
- **数据修复脚本**：数据修复、补丁、ALTER TABLE等修改操作放在 `db/patch/` 目录下
- **脚本命名规范**：使用描述性名称，如 `inquiry_system_tables.sql`

**询价系统建表脚本应创建为：**
```
db/main/inquiry_system_tables.sql
```

**如果后续需要修改表结构，则创建：**
```
db/patch/YYYYMMDD_inquiry_system_modifications.sql
```

### 3.2 核心表结构

```sql
-- 询价单主表
CREATE TABLE inquiries (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '询价单ID',
  guid BINARY(16) NOT NULL UNIQUE COMMENT '全局唯一标识符',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  status VARCHAR(16) DEFAULT 'pending' COMMENT '询价状态: pending-待处理, quoted-已报价, completed-已完成, cancelled-已取消',
  total_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '总金额',
  
  deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记: 0-正常, 1-已删除',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_guid (guid),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_deleted (deleted),
  INDEX idx_created_at (created_at),
  INDEX idx_status_deleted (status, deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='询价单主表';

-- 询价商品表
CREATE TABLE inquiry_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '询价商品ID',
  guid BINARY(16) NOT NULL UNIQUE COMMENT '全局唯一标识符',
  inquiry_id BIGINT NOT NULL COMMENT '询价单ID',
  product_id BIGINT NOT NULL COMMENT '商品ID',
  quantity INT NOT NULL COMMENT '数量',
  unit_price DECIMAL(10,2) DEFAULT NULL COMMENT '单价',
  quoted_price DECIMAL(10,2) DEFAULT NULL COMMENT '报价',
  
  deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记: 0-正常, 1-已删除',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 虚拟列：确保同一询价单中同一商品只能有一条未删除记录
  active_unique_key VARCHAR(64) GENERATED ALWAYS AS (
    IF(deleted = 0, CONCAT(inquiry_id, '-', product_id), NULL)
  ) STORED,
  
  INDEX idx_guid (guid),
  INDEX idx_inquiry_id (inquiry_id),
  INDEX idx_product_id (product_id),
  INDEX idx_deleted (deleted),
  INDEX idx_created_at (created_at),
  UNIQUE KEY uk_active_inquiry_product (active_unique_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='询价商品表';

-- 询价消息表
CREATE TABLE inquiry_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
  guid BINARY(16) NOT NULL UNIQUE COMMENT '全局唯一标识符',
  inquiry_id BIGINT NOT NULL COMMENT '询价单ID',
  sender_id BIGINT NOT NULL COMMENT '发送者ID',
  sender_type VARCHAR(8) NOT NULL COMMENT '发送者类型: user-用户, admin-管理员',
  message_type VARCHAR(8) DEFAULT 'text' COMMENT '消息类型: text-文本, quote-报价, system-系统',
  content TEXT NOT NULL COMMENT '消息内容',
  
  deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记: 0-正常, 1-已删除',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_guid (guid),
  INDEX idx_inquiry_id (inquiry_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_sender_type (sender_type),
  INDEX idx_message_type (message_type),
  INDEX idx_deleted (deleted),
  INDEX idx_created_at (created_at),
  INDEX idx_inquiry_deleted (inquiry_id, deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='询价消息表';
```

## 4. 现有代码集成约束

### 4.1 后端公共代码集成

**必须使用的后端组件：**
- **响应处理中间件**：`middleware/responseHandler.js` - 统一API响应格式
- **消息管理**：`config/messages.js` - 统一错误和成功消息，必须使用getMessage函数
- **JWT认证**：`middleware/jwt.js` - 用户身份验证和权限控制
- **数据库连接**：`db/db.js` - 统一数据库操作
- **UUID工具**：`utils/uuid.js` - 生成唯一标识符

**消息键约定（config/messages.js）：**
```javascript
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
    SEND_FAILED: 'INQUIRY.MESSAGE.SEND_FAILED'
  },
  UPDATE: {
    SUCCESS: 'INQUIRY.UPDATE.SUCCESS',
    FAILED: 'INQUIRY.UPDATE.FAILED'
  },
  DELETE: {
    SUCCESS: 'INQUIRY.DELETE.SUCCESS',
    FAILED: 'INQUIRY.DELETE.FAILED'
  }
}
```

**⚠️ 重要：消息键翻译管理**
所有新增的消息键都必须添加到 `db/main/insert_message_translations.sql` 中：

```sql
-- 询价系统消息键翻译
INSERT INTO language_translations (guid, code, lang, value) VALUES
-- 询价创建
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.CREATE.SUCCESS', 'en', 'Inquiry created successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.CREATE.SUCCESS', 'zh-CN', '询价单创建成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.CREATE.FAILED', 'en', 'Failed to create inquiry'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.CREATE.FAILED', 'zh-CN', '询价单创建失败'),
-- 询价获取
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.FETCH.SUCCESS', 'en', 'Inquiries retrieved successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.FETCH.SUCCESS', 'zh-CN', '询价单获取成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.FETCH.FAILED', 'en', 'Failed to fetch inquiries'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.FETCH.FAILED', 'zh-CN', '询价单获取失败');
```

### 4.2 前端公共代码集成

**必须使用的前端组件：**
- **API工具**：`utils/api.js` - 必须使用postWithErrorHandler/getWithErrorHandler等方法
- **消息处理**：`utils/messageHandler.js` - 统一的错误和成功消息显示
- **Vuex扩展**：仅在必要时扩展现有store模块
- **国际化**：利用现有的语言切换和翻译系统

**前端组件集成约束：**
- **CSS约束**：必须使用现有的SCSS变量和断点
- **命名约束**：组件文件名使用PascalCase
- **API调用约束**：必须使用带错误处理的API方法
- **格式化约束**：使用现有的format.js工具

## 5. API接口设计

### 5.1 设计原则
- **RESTful风格**：遵循现有API设计模式
- **统一响应格式**：`{success: boolean, message: string, data: object}`
- **认证集成**：必须使用现有的JWT中间件

### 5.2 核心接口分组

#### 用户端接口
- `GET /api/inquiries` - 获取用户询价单列表
- `POST /api/inquiries` - 创建新询价单
- `POST /api/inquiries/{id}/items` - 添加商品到询价单
- `POST /api/inquiries/{id}/messages` - 发送消息
- `POST /api/inquiries/{id}/sync-to-cart` - 同步到购物车

#### 管理端接口
- `GET /api/admin/inquiries` - 获取所有询价单（分页）
- `PUT /api/admin/inquiries/{id}/items/{item_id}/quote` - 更新商品报价
- `POST /api/admin/inquiries/{id}/messages` - 业务员发送消息
- `PUT /api/admin/inquiries/{id}/status` - 更新询价单状态

### 5.3 Controller实现约束
必须遵循现有Controller的模式：

```javascript
// 示例：inquiryController.js
const { getMessage } = require('../config/messages');
const db = require('../db/db');
const { generateUUID } = require('../utils/uuid');

// 必须使用getMessage函数而不是直接使用MESSAGES
const createInquiry = async (req, res) => {
  try {
    // 业务逻辑
    const inquiryId = generateUUID();
    // ... 创建询价单逻辑
    
    res.status(201).json({
      success: true,
      message: getMessage('INQUIRY.CREATE.SUCCESS'),
      data: { inquiryId }
    });
  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.CREATE.FAILED'),
      data: null
    });
  }
};

// 获取询价单列表
const getUserInquiries = async (req, res) => {
  try {
    const userId = req.userId; // 从JWT中间件获取
    // ... 查询逻辑
    
    res.json({
      success: true,
      message: getMessage('INQUIRY.FETCH.SUCCESS'),
      data: inquiries
    });
  } catch (error) {
    console.error('Fetch inquiries error:', error);
    res.status(500).json({
      success: false,
      message: getMessage('INQUIRY.FETCH.FAILED'),
      data: null
    });
  }
};
```

### 5.4 认证和授权集成
必须使用现有的JWT中间件和权限控制：

```javascript
// routes/inquiryRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/jwt');
const inquiryController = require('../controllers/inquiryController');

// 用户路由 - 需要登录验证
router.get('/api/inquiries', verifyToken, inquiryController.getUserInquiries);
router.post('/api/inquiries', verifyToken, inquiryController.createInquiry);
router.post('/api/inquiries/:id/messages', verifyToken, inquiryController.sendMessage);

// 管理员路由 - 需要登录验证 + 管理员权限
router.get('/api/admin/inquiries', verifyToken, isAdmin, inquiryController.getAllInquiries);
router.put('/api/admin/inquiries/:id/items/:itemId/quote', verifyToken, isAdmin, inquiryController.updateQuote);
router.post('/api/admin/inquiries/:id/messages', verifyToken, isAdmin, inquiryController.sendAdminMessage);

module.exports = router;
```

**关键约束：**
- **verifyToken**：验证JWT token并提取用户信息（userId, userEmail, userRole）
- **isAdmin**：检查用户角色是否为admin，必须在verifyToken之后使用
- **错误处理**：中间件自动使用getMessage函数返回标准化错误消息

## 6. 前端架构设计

### 6.1 组件架构与现有代码集成

**询价功能设计原则：**
根据README.md和Cart-new.html的设计，询价功能应该集成在购物车页面中，采用tab页的方式管理多个询价单，而不是独立的页面或组件。

```
InquirySystem/
├── InquiryTabs.vue (询价tab页管理组件)
│   ├── InquiryPanel.vue (单个询价面板)
│   ├── InquiryChat.vue (聊天界面)
│   └── InquiryItems.vue (询价商品列表)
└── AdminInquiryManagement.vue (管理端询价管理)
```

**核心设计要点：**
1. **Tab页设计**：用户最多可创建10个询价单，每个询价单作为一个tab页
2. **New Inquiry按钮**：点击后创建新的空白询价tab页，成为当前激活的询价
3. **商品添加逻辑**：
   - 购物车商品右侧有"Inquire"按钮
   - 如果没有激活的询价单，自动创建新询价单并添加商品
   - 如果有激活的询价单，将商品添加到当前激活的询价单
   - 如果商品已在某个询价单中，按钮不可点击并显示提示
4. **询价单结构**：每个询价单包含商品列表、聊天功能、同步到购物车功能

**必须遵循的组件约束：**
- 所有组件必须使用Options API风格（export default）
- 必须使用现有的 `utils/api.js` 进行API调用
- 必须使用 `utils/messageHandler.js` 处理错误和成功消息
- 组件文件名必须使用PascalCase命名
- 询价功能必须集成在购物车页面中，不是独立页面

### 6.2 状态管理策略
**避免过度使用Vuex Store**，询价系统主要使用组件本地状态：

```javascript
// 组件本地状态管理示例
export default {
  data() {
    return {
      inquiries: [],
      currentInquiry: null,
      messages: [],
      loading: false,
      pagination: {
        page: 1,
        limit: 10,
        total: 0
      }
    }
  },
  
  methods: {
    // 本地状态更新方法
    updateInquiryStatus(inquiryId, status) {
      const inquiry = this.inquiries.find(item => item.id === inquiryId)
      if (inquiry) {
        inquiry.status = status
      }
    },
    
    addNewMessage(message) {
      this.messages.push({
        ...message,
        timestamp: new Date().toISOString()
      })
    },
    
    refreshInquiryList() {
      this.fetchInquiries()
    }
  }
}
```

**仅在以下情况使用Store：**
- 跨多个页面需要共享的用户信息（已有user模块）
- 全局语言设置（已有language模块）
- 需要在多个组件间同步的实时数据（如未读消息数量）

**Store使用约束：**
- 不要为每个业务模块都创建store模块
- 优先使用组件间通信（props/events）
- 只有真正需要全局状态时才使用store

### 6.3 API调用标准模式
所有组件必须使用现有的带错误处理的API方法：

```javascript
// 在Vue组件中
import api from '@/utils/api'
import MessageHandler from '@/utils/messageHandler'

export default {
  methods: {
    async createInquiry() {
      try {
        this.loading = true
        // 必须使用postWithErrorHandler而不是post
        const response = await api.postWithErrorHandler('/inquiries', this.formData, {
          fallbackKey: 'inquiry.error.createFailed'
        })
        
        // 使用MessageHandler显示成功消息
        MessageHandler.showSuccess(response.message)
        
        // 直接更新本地数据，避免不必要的store使用
        this.refreshInquiryList()
        
      } catch (error) {
        // postWithErrorHandler已经自动处理了错误显示
        console.error('Create inquiry failed:', error)
      } finally {
        this.loading = false
      }
    },
    
    async fetchInquiries() {
      try {
        this.loading = true
        // 必须使用getWithErrorHandler而不是get
        const response = await api.getWithErrorHandler('/inquiries', {
          fallbackKey: 'inquiry.error.fetchFailed'
        })
        
        this.inquiries = response.data
        
      } catch (error) {
        // getWithErrorHandler已经自动处理了错误显示
        console.error('Fetch inquiries failed:', error)
      } finally {
        this.loading = false
      }
    }
  }
}
```

### 6.4 国际化集成约束
- **必须使用现有的语言模块**：所有文本都需要在翻译系统中定义
- **强制使用t函数**：所有组件中的文本显示必须使用 `this.$t('messageKey')` 函数
- **fallbackKey管理**：API调用中的fallbackKey必须添加到 `db/main/insert_message_translations.sql` 中
- **消息键命名规范**：遵循 `模块.类型.具体消息` 的格式
- **自动语言切换**：利用现有的语言检测和切换机制

**前端国际化示例：**
```javascript
// 在Vue组件中使用t函数
export default {
  template: `
    <div>
      <h1>{{ $t('inquiry.title') }}</h1>
      <button>{{ $t('inquiry.create.button') }}</button>
      <p>{{ $t('inquiry.status.' + inquiry.status) }}</p>
    </div>
  `,
  
  methods: {
    async createInquiry() {
      const response = await api.postWithErrorHandler('/inquiries', this.formData, {
        fallbackKey: 'inquiry.error.createFailed' // 必须在翻译文件中定义
      })
    }
  }
}
```

**翻译键管理要求：**
所有前端使用的翻译键都必须在 `db/main/insert_message_translations.sql` 中定义：
```sql
-- 前端询价系统翻译键
INSERT INTO language_translations (guid, code, lang, value) VALUES
-- 页面标题和按钮
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.title', 'en', 'Inquiry System'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.title', 'zh-CN', '询价系统'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.create.button', 'en', 'Create Inquiry'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.create.button', 'zh-CN', '创建询价'),
-- 状态翻译
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.status.pending', 'en', 'Pending'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.status.pending', 'zh-CN', '待处理'),
-- 错误消息fallbackKey
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.error.createFailed', 'en', 'Failed to create inquiry'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.error.createFailed', 'zh-CN', '创建询价失败');
```

### 6.5 样式集成约束
- **必须使用现有的SCSS变量**：颜色、字体、间距等都要使用项目已定义的变量
- **响应式断点**：必须使用现有的断点定义
- **组件样式作用域**：使用scoped样式避免全局污染

## 7. 实时通信设计

### 7.1 Server-Sent Events (SSE) 集成
必须使用现有的SSE基础设施：

```javascript
// 后端：必须扩展现有的SSE处理器
const sseHandler = require('../utils/sseHandler'); // 假设存在

// 询价消息推送
const pushInquiryMessage = (inquiryId, message) => {
  const eventData = {
    type: 'inquiry_message',
    inquiryId,
    message,
    timestamp: new Date().toISOString()
  };
  
  sseHandler.broadcast(`inquiry_${inquiryId}`, eventData);
};
```

```javascript
// 前端：必须使用现有的SSE工具
import { inquiryPolling } from '@/utils/inquiryPolling'

export default {
  mounted() {
    // 使用现有的轮询工具建立SSE连接
    this.sseConnection = inquiryPolling.connect(this.inquiryId, {
      onMessage: this.handleNewMessage,
      onError: this.handleConnectionError,
      onReconnect: this.handleReconnect
    })
  },
  
  beforeDestroy() {
    if (this.sseConnection) {
      inquiryPolling.disconnect(this.sseConnection)
    }
  }
}
```

### 7.2 消息推送策略
- **新消息通知**：实时推送给相关用户
- **状态更新**：询价单状态变化通知
- **系统通知**：重要系统消息推送
- **连接管理**：利用现有的重连和错误处理机制

## 8. 安全性设计

### 8.1 认证授权集成
必须使用现有的安全基础设施：

```javascript
// 路由保护：必须使用现有中间件
const jwt = require('../middleware/jwt');
const adminAuth = require('../middleware/adminAuth'); // 假设存在

// 用户路由
router.get('/api/inquiries', jwt.authenticateToken, inquiryController.getUserInquiries);

// 管理员路由
router.get('/api/admin/inquiries', adminAuth.requireAdmin, inquiryController.getAllInquiries);
```

### 8.2 数据验证集成
必须使用现有的验证模式：

```javascript
// 必须使用现有的验证工具
const validator = require('../utils/validator'); // 假设存在

const validateInquiryData = (req, res, next) => {
  const { error } = validator.validateInquiry(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: getMessage('VALIDATION.INVALID_DATA'),
      data: { errors: error.details }
    });
  }
  next();
};
```

### 8.3 安全约束
- **输入验证**：必须使用现有的验证中间件
- **错误处理**：必须使用统一的错误响应格式
- **日志记录**：必须使用现有的日志系统
- **权限检查**：必须使用现有的权限中间件

## 9. 管理端询价模块设计

### 9.1 管理端功能概述
根据README.md的要求，管理端询价功能应该为业务人员提供完整的询价管理界面。

**核心功能：**
1. **用户管理视图**：按业务人员管理的用户列表显示
2. **未读消息提示**：显示每个用户是否有未读消息
3. **询价单管理**：查看用户的所有询价单列表
4. **商品报价**：为询价单中的商品设置期望价格和购买数量
5. **聊天功能**：与用户进行实时沟通
6. **审批功能**：同意用户提出的价格，允许同步到购物车

### 9.2 管理端界面设计

**主界面结构：**
```
AdminInquiryManagement/
├── UserList.vue (用户列表)
│   ├── 显示业务人员管理的用户
│   ├── 未读消息数量提示
│   └── 点击进入用户详情
├── UserInquiryList.vue (用户询价单列表)
│   ├── 显示选中用户的所有询价单
│   ├── 询价单状态和未读消息提示
│   └── 点击进入询价单详情
└── InquiryDetail.vue (询价单详情)
    ├── InquiryItemsManagement.vue (商品管理)
    │   ├── 商品列表显示
    │   ├── 设置期望价格
    │   ├── 设置购买数量
    │   └── 审批按钮
    └── AdminChat.vue (管理员聊天)
        ├── 历史消息显示
        ├── 发送消息功能
        └── 实时消息推送
```

### 9.3 业务流程设计

**询价处理流程：**
1. **接收询价**：用户创建询价单后，分配给对应业务组
2. **消息通知**：业务人员收到新询价通知
3. **查看详情**：业务人员查看询价单详情和商品信息
4. **沟通协商**：通过聊天功能与用户沟通
5. **设置报价**：为每个商品设置期望价格和数量
6. **审批确认**：最终确认价格，允许用户同步到购物车

**权限控制：**
- 业务人员只能查看分配给自己业务组的用户询价
- 管理员可以查看所有询价单
- 业务人员可以修改询价状态和商品报价
- 业务人员不能修改系统其他设置

### 9.4 管理端API设计

**核心接口：**
```javascript
// 获取业务人员管理的用户列表
GET /api/admin/inquiry/users
// 响应：用户列表，包含未读消息数量

// 获取指定用户的询价单列表
GET /api/admin/inquiry/users/{userId}/inquiries
// 响应：询价单列表，包含状态和未读消息

// 获取询价单详情
GET /api/admin/inquiry/{inquiryId}
// 响应：询价单详情，包含商品和消息

// 更新商品报价
PUT /api/admin/inquiry/{inquiryId}/items/{itemId}/quote
// 请求：{ quotedPrice, quantity }

// 发送管理员消息
POST /api/admin/inquiry/{inquiryId}/messages
// 请求：{ content, messageType }

// 审批询价单
PUT /api/admin/inquiry/{inquiryId}/approve
// 请求：{ approved: true/false }
```

## 10. 后端架构设计

### 10.1 分层架构
```
Controller Layer (控制层)
├── 请求验证和参数处理
├── 业务逻辑调用
└── 响应格式化

Service Layer (服务层)
├── 业务逻辑实现
├── 数据处理和转换
└── 外部服务调用

Data Layer (数据层)
├── 数据库操作
├── 缓存管理
└── 数据验证
```

### 10.2 核心服务设计
- **InquiryService**：询价单业务逻辑
- **MessageService**：消息处理和推送
- **NotificationService**：通知服务
- **AuthService**：认证和授权
- **BusinessGroupService**：业务组管理服务

### 10.3 关键设计模式
- **Repository模式**：数据访问抽象
- **Service模式**：业务逻辑封装
- **Middleware模式**：请求处理管道
- **Observer模式**：事件驱动的消息推送

## 11. 性能优化策略

### 11.1 前端优化
- **组件懒加载**：按需加载减少初始包大小
- **虚拟滚动**：处理大量消息列表
- **防抖处理**：用户输入和API调用优化
- **缓存策略**：合理使用浏览器缓存

### 11.2 后端优化
- **数据库索引**：基于查询模式的索引优化
- **连接池管理**：数据库连接复用
- **缓存策略**：Redis缓存热点数据
- **分页查询**：大数据量的分页处理
- **HTTP/2支持**：多路复用提升性能

## 12. 测试策略

### 12.1 测试层次
- **单元测试**：组件和函数级别测试
- **集成测试**：模块间交互测试
- **端到端测试**：完整业务流程测试
- **性能测试**：负载和压力测试

### 12.2 关键测试场景
- 询价流程完整性测试
- SSE连接稳定性测试
- 并发用户场景测试
- 数据一致性测试

## 13. 部署和运维

### 13.1 部署策略
- **分阶段部署**：功能模块逐步上线
- **蓝绿部署**：零停机时间部署
- **数据库迁移**：渐进式数据结构更新
- **回滚机制**：快速回滚到稳定版本

### 13.2 监控运维
- **业务指标**：询价单创建数、转化率
- **技术指标**：API响应时间、错误率
- **用户体验**：页面加载时间、交互响应
- **系统资源**：CPU、内存、数据库性能
- **实时告警**：异常情况及时通知
- **日志聚合**：集中式日志收集和分析

## 14. 扩展性考虑

### 14.1 水平扩展
- **无状态设计**：服务实例可水平扩展
- **数据库分片**：支持数据量增长
- **负载均衡**：请求分发和故障转移
- **缓存集群**：Redis集群支持

### 14.2 功能扩展
- **多语言支持**：国际化框架预留
- **文件上传**：支持图片和文档分享
- **移动端适配**：响应式设计扩展
- **通知系统**：邮件和短信通知集成

## 15. 风险评估

### 15.1 技术风险
- **SSE连接稳定性**：网络中断处理
- **数据库性能**：大并发下的性能瓶颈
- **浏览器兼容性**：SSE在老版本浏览器的支持

### 15.2 业务风险
- **用户体验**：实时性要求vs性能平衡
- **数据一致性**：分布式环境下的数据同步
- **安全合规**：用户数据保护要求

### 15.3 缓解措施
- **降级方案**：SSE不可用时的轮询备选
- **性能监控**：实时监控和告警机制
- **数据备份**：定期备份和恢复测试
- **安全审计**：定期安全检查和漏洞修复

---

## 总结

本设计文档强调了与现有代码的深度集成，避免重复造轮子。关键要点：

1. **强制使用现有工具**：postWithErrorHandler、getMessage、isAdmin等
2. **避免过度设计**：减少不必要的store使用，优先本地状态
3. **统一错误处理**：利用现有的错误处理和国际化机制
4. **消息键管理**：所有新增消息键必须在insert_message_translations.sql中定义
5. **渐进式实现**：可以分阶段实现功能，保持系统稳定性

这种设计方式确保了新功能与现有系统的无缝集成，降低了开发和维护成本。