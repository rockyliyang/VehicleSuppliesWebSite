# 询价功能设计方案

## 1. 概述

本文档详细描述了电商系统询价功能的设计方案，包括用户端和业务员端的完整功能实现。该方案基于现有的购物车页面设计，符合项目的技术栈和设计规范。

## 2. 功能需求分析

### 2.1 核心功能
- **用户端询价**：用户可以将购物车中的商品添加到询价单，与业务员进行实时沟通
- **业务员端管理**：业务员可以查看、回复和管理所有询价单
- **实时通信**：支持用户与业务员之间的实时消息交流
- **询价单管理**：支持多个询价单并行处理，每个询价单独立管理
- **状态跟踪**：询价单状态管理（待处理、进行中、已完成、已取消）

### 2.2 用户体验要求
- **无缝集成**：与现有购物车系统无缝集成
- **响应式设计**：支持桌面端和移动端
- **实时反馈**：消息发送和接收的实时反馈
- **直观操作**：简单易懂的操作界面
- **多语言支持**：支持中英文切换，遵循项目国际化规范

### 2.3 用户端需求
- 用户最多可以创建10个询价单
- 每个询价单可以包含多个商品
- 用户可以设置每个商品的购买个数和期望价格
- 用户可以通过聊天功能与业务员讨论价格
- 业务员同意价格后，价格会同步到购物车

### 2.4 业务员端需求
- 业务员可以在后台管理所有询价单
- 查看用户列表和未读消息
- 设置期望价格和购买个数
- 查看历史聊天记录
- 发送消息给用户

## 3. 数据库设计

### 3.1 询价单表 (inquiries)
```sql
CREATE TABLE inquiries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    guid BINARY(16) NOT NULL UNIQUE COMMENT 'GUID标识符',
    user_id INT NOT NULL COMMENT '用户ID',
    title VARCHAR(255) NOT NULL DEFAULT '询价单' COMMENT '询价单标题',
    status CHAR(16) NOT NULL DEFAULT 'pending' COMMENT '状态：pending/active/completed/cancelled',
    total_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '总金额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记：0-未删除，1-已删除',
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_deleted (deleted),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='询价单表';
```

### 3.2 询价商品表 (inquiry_items)
```sql
CREATE TABLE inquiry_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    guid BINARY(16) NOT NULL UNIQUE COMMENT 'GUID标识符',
    inquiry_id INT NOT NULL COMMENT '询价单ID',
    product_id INT NOT NULL COMMENT '产品ID',
    quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
    original_price DECIMAL(10,2) NOT NULL COMMENT '原价',
    quoted_price DECIMAL(10,2) NULL COMMENT '报价',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记：0-未删除，1-已删除',
    INDEX idx_inquiry_id (inquiry_id),
    INDEX idx_product_id (product_id),
    INDEX idx_deleted (deleted),
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='询价商品表';
```

### 3.3 询价消息表 (inquiry_messages)
```sql
CREATE TABLE inquiry_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    guid BINARY(16) NOT NULL UNIQUE COMMENT 'GUID标识符',
    inquiry_id INT NOT NULL COMMENT '询价单ID',
    sender_id INT NOT NULL COMMENT '发送者ID',
    sender_type CHAR(8) NOT NULL COMMENT '发送者类型：user/admin',
    message_type CHAR(16) DEFAULT 'text' COMMENT '消息类型：text/price_update/system',
    content TEXT NOT NULL COMMENT '消息内容',
    metadata JSON NULL COMMENT '元数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记：0-未删除，1-已删除',
    INDEX idx_inquiry_id (inquiry_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_sender_type (sender_type),
    INDEX idx_created_at (created_at),
    INDEX idx_deleted (deleted),
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='询价消息表';
```

## 4. API接口设计

### 4.1 用户端API

#### 4.1.1 获取询价单列表
```http
GET /api/inquiries
Authorization: Bearer <token>
```

**响应示例：**
```json
{
  "success": true,
  "message": "INQUIRY.LIST.SUCCESS",
  "data": {
    "inquiries": [
      {
        "id": 1,
        "guid": "550e8400-e29b-41d4-a716-446655440000",
        "title": "询价单标题",
        "status": "pending",
        "total_amount": 200.00,
        "items_count": 2,
        "created_at": "2024-03-15T10:00:00Z",
        "updated_at": "2024-03-15T10:00:00Z"
      }
    ],
    "total": 10,
    "maxAllowed": 10
  },
  "timestamp": "2024-03-15T10:00:00Z"
}
```

#### 4.1.2 创建询价单
```http
POST /api/inquiries
Content-Type: application/json
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "title": "询价单标题",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "expected_price": 100.00
    }
  ]
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "INQUIRY.CREATE.SUCCESS",
  "data": {
    "id": 1,
    "guid": "550e8400-e29b-41d4-a716-446655440000",
    "title": "询价单标题",
    "status": "pending",
    "total_amount": 200.00,
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "quantity": 2,
        "original_price": 100.00,
        "quoted_price": null
      }
    ],
    "created_at": "2024-03-15T10:00:00Z"
  },
  "timestamp": "2024-03-15T10:00:00Z"
}
```

#### 4.1.3 添加商品到询价单
```http
POST /api/inquiries/{id}/items
Content-Type: application/json
Authorization: Bearer <token>

{
  "product_id": 1,
  "quantity": 2,
  "expected_price": 100.00
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "INQUIRY.ITEM.ADD.SUCCESS",
  "data": {
    "id": 2,
    "product_id": 1,
    "quantity": 2,
    "original_price": 100.00,
    "quoted_price": null
  },
  "timestamp": "2024-03-15T10:00:00Z"
}
```

#### 4.1.4 发送消息
```http
POST /api/inquiries/{id}/messages
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "消息内容",
  "message_type": "text"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "INQUIRY.MESSAGE.SEND.SUCCESS",
  "data": {
    "id": 1,
    "content": "消息内容",
    "sender_type": "user",
    "message_type": "text",
    "created_at": "2024-03-15T10:00:00Z"
  },
  "timestamp": "2024-03-15T10:00:00Z"
}
```

#### 4.1.5 同步到购物车
```http
POST /api/inquiries/{id}/sync-to-cart
Content-Type: application/json
Authorization: Bearer <token>

{
  "item_ids": [1, 2, 3]
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "INQUIRY.SYNC.SUCCESS",
  "data": {
    "synced_items": 3,
    "cart_total": 285.00
  },
  "timestamp": "2024-03-15T10:00:00Z"
}
```

### 4.2 业务员端API

#### 4.2.1 获取所有询价单
```http
GET /api/admin/inquiries?page=1&pageSize=20&status=pending
Authorization: Bearer <token>
```

**响应示例：**
```json
{
  "success": true,
  "message": "INQUIRY.ADMIN.LIST.SUCCESS",
  "data": {
    "inquiries": [
      {
        "id": 1,
        "guid": "550e8400-e29b-41d4-a716-446655440000",
        "title": "询价单标题",
        "status": "pending",
        "user_name": "张三",
        "user_email": "zhangsan@example.com",
        "total_amount": 200.00,
        "items_count": 2,
        "unread_messages": 3,
        "created_at": "2024-03-15T10:00:00Z",
        "updated_at": "2024-03-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  },
  "timestamp": "2024-03-15T10:00:00Z"
}
```

#### 4.2.2 更新商品报价
```http
PUT /api/admin/inquiries/{id}/items/{item_id}/quote
Content-Type: application/json
Authorization: Bearer <token>

{
  "quoted_price": 85.00,
  "note": "批量采购优惠价"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "INQUIRY.QUOTE.UPDATE.SUCCESS",
  "data": {
    "id": 1,
    "product_id": 1,
    "original_price": 100.00,
    "quoted_price": 85.00,
    "updated_at": "2024-03-15T10:00:00Z"
  },
  "timestamp": "2024-03-15T10:00:00Z"
}
```

#### 4.2.3 发送消息
```http
POST /api/admin/inquiries/{id}/messages
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "业务员回复",
  "message_type": "text"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "INQUIRY.MESSAGE.SEND.SUCCESS",
  "data": {
    "id": 2,
    "content": "业务员回复",
    "sender_type": "admin",
    "message_type": "text",
    "created_at": "2024-03-15T10:00:00Z"
  },
  "timestamp": "2024-03-15T10:00:00Z"
}
```

### 4.3 消息键管理

根据项目规范，需要在 `config/messages.js` 中添加以下消息键，并同时更新 `db/insert_message_translations.sql`：

```javascript
// 询价相关消息键
INQUIRY: {
  CREATE: {
    SUCCESS: 'INQUIRY.CREATE.SUCCESS',
    FAILED: 'INQUIRY.CREATE.FAILED'
  },
  LIST: {
    SUCCESS: 'INQUIRY.LIST.SUCCESS',
    FAILED: 'INQUIRY.LIST.FAILED'
  },
  ITEM: {
    ADD: {
      SUCCESS: 'INQUIRY.ITEM.ADD.SUCCESS',
      FAILED: 'INQUIRY.ITEM.ADD.FAILED'
    }
  },
  MESSAGE: {
    SEND: {
      SUCCESS: 'INQUIRY.MESSAGE.SEND.SUCCESS',
      FAILED: 'INQUIRY.MESSAGE.SEND.FAILED'
    },
    LIST: {
      SUCCESS: 'INQUIRY.MESSAGE.LIST.SUCCESS',
      FAILED: 'INQUIRY.MESSAGE.LIST.FAILED'
    }
  },
  QUOTE: {
    UPDATE: {
      SUCCESS: 'INQUIRY.QUOTE.UPDATE.SUCCESS',
      FAILED: 'INQUIRY.QUOTE.UPDATE.FAILED'
    }
  },
  SYNC: {
    SUCCESS: 'INQUIRY.SYNC.SUCCESS',
    FAILED: 'INQUIRY.SYNC.FAILED'
  },
  ADMIN: {
    LIST: {
      SUCCESS: 'INQUIRY.ADMIN.LIST.SUCCESS',
      FAILED: 'INQUIRY.ADMIN.LIST.FAILED'
    }
  }
}
```

**对应的SQL翻译数据：**
```sql
-- 询价功能消息翻译
INSERT INTO language_translations (guid, code, lang, value) VALUES
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.CREATE.SUCCESS', 'zh-CN', '询价单创建成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.CREATE.SUCCESS', 'en', 'Inquiry created successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.CREATE.FAILED', 'zh-CN', '询价单创建失败'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.CREATE.FAILED', 'en', 'Failed to create inquiry'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.LIST.SUCCESS', 'zh-CN', '获取询价单列表成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.LIST.SUCCESS', 'en', 'Inquiry list retrieved successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.ITEM.ADD.SUCCESS', 'zh-CN', '商品添加成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.ITEM.ADD.SUCCESS', 'en', 'Item added successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.MESSAGE.SEND.SUCCESS', 'zh-CN', '消息发送成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.MESSAGE.SEND.SUCCESS', 'en', 'Message sent successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.QUOTE.UPDATE.SUCCESS', 'zh-CN', '报价更新成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.QUOTE.UPDATE.SUCCESS', 'en', 'Quote updated successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.SYNC.SUCCESS', 'zh-CN', '同步到购物车成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.SYNC.SUCCESS', 'en', 'Synced to cart successfully');
```

## 5. 前端组件设计

### 5.1 询价单列表组件 (InquiryList.vue)

```vue
<template>
  <div class="inquiry-list">
    <!-- 搜索和筛选区域 -->
    <div class="inquiry-list__filters">
      <el-form :inline="true" :model="searchForm" class="inquiry-list__search-form">
        <el-form-item :label="$t('inquiry.search.title')">
          <el-input
            v-model="searchForm.title"
            :placeholder="$t('inquiry.search.titlePlaceholder')"
            clearable
            @keyup.enter.native="handleSearch"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('inquiry.search.status')">
          <el-select v-model="searchForm.status" :placeholder="$t('inquiry.search.statusPlaceholder')" clearable>
            <el-option
              v-for="status in statusOptions"
              :key="status.value"
              :label="$t(status.label)"
              :value="status.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ $t('common.search') }}</el-button>
          <el-button @click="handleReset">{{ $t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="inquiry-list__table">
      <el-table
        v-loading="loading"
        :data="inquiries"
        stripe
        border
        class="inquiry-list__data-table"
      >
        <el-table-column prop="title" :label="$t('inquiry.table.title')" min-width="200">
          <template slot-scope="scope">
            <el-link type="primary" @click="viewDetail(scope.row)">{{ scope.row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('inquiry.table.status')" width="120">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ $t(`inquiry.status.${scope.row.status}`) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="items_count" :label="$t('inquiry.table.itemsCount')" width="100"></el-table-column>
        <el-table-column prop="total_amount" :label="$t('inquiry.table.totalAmount')" width="120">
          <template slot-scope="scope">
            ¥{{ scope.row.total_amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" :label="$t('inquiry.table.createdAt')" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" @click="viewDetail(scope.row)">{{ $t('common.view') }}</el-button>
            <el-button size="mini" type="success" @click="syncToCart(scope.row)" :disabled="scope.row.status !== 'quoted'">{{ $t('inquiry.actions.syncToCart') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="inquiry-list__pagination">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.page"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
      >
      </el-pagination>
    </div>
  </div>
</template>

<script>
// API调用通过 this.$api 进行，无需单独导入
import { formatDate } from '@/utils/date'

export default {
  name: 'InquiryList',
  data() {
    return {
      loading: false,
      inquiries: [],
      searchForm: {
        title: '',
        status: ''
      },
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      },
      statusOptions: [
        { value: 'pending', label: 'inquiry.status.pending' },
        { value: 'quoted', label: 'inquiry.status.quoted' },
        { value: 'completed', label: 'inquiry.status.completed' },
        { value: 'cancelled', label: 'inquiry.status.cancelled' }
      ]
    }
  },
  computed: {
    // 计算属性
  },
  watch: {
    // 监听器
  },
  created() {
    this.loadInquiries()
  },
  mounted() {
    // 组件挂载后的操作
  },
  beforeDestroy() {
    // 清理工作
  },
  methods: {
    async loadInquiries() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          pageSize: this.pagination.pageSize,
          ...this.searchForm
        }
        const response = await this.$api.getWithErrorHandler('/inquiries', {
          fallbackKey: 'inquiry.fetchError',
          params
        })
        if (response.success) {
          this.inquiries = response.data.inquiries
          this.pagination.total = response.data.pagination.total
        }
      } catch (error) {
        this.$messageHandler.showError('INQUIRY.LIST.FAILED')
      } finally {
        this.loading = false
      }
    },
    
    handleSearch() {
      this.pagination.page = 1
      this.loadInquiries()
    },
    
    handleReset() {
      this.searchForm = {
        title: '',
        status: ''
      }
      this.pagination.page = 1
      this.loadInquiries()
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.page = 1
      this.loadInquiries()
    },
    
    handleCurrentChange(val) {
      this.pagination.page = val
      this.loadInquiries()
    },
    
    viewDetail(inquiry) {
      this.$router.push(`/inquiry/${inquiry.id}`)
    },
    
    async syncToCart(inquiry) {
      try {
        const response = await this.$api.postWithErrorHandler(`/inquiries/${inquiry.id}/sync-to-cart`, {}, {
          fallbackKey: 'inquiry.syncError'
        })
        if (response.success) {
          this.$messageHandler.showSuccess('INQUIRY.SYNC.SUCCESS')
          this.loadInquiries()
        }
      } catch (error) {
        this.$messageHandler.showError('INQUIRY.SYNC.FAILED')
      }
    },
    
    getStatusType(status) {
      const statusMap = {
        pending: 'warning',
        quoted: 'info',
        completed: 'success',
        cancelled: 'danger'
      }
      return statusMap[status] || 'info'
    },
    
    formatDate
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.inquiry-list {
  padding: $spacing-lg;
  
  &__filters {
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
    background-color: $color-bg-light;
    border-radius: $border-radius-base;
  }
  
  &__search-form {
    .el-form-item {
      margin-bottom: 0;
    }
  }
  
  &__table {
    margin-bottom: $spacing-lg;
  }
  
  &__data-table {
    .el-link {
      font-weight: 500;
    }
  }
  
  &__pagination {
    @include flex-center;
    justify-content: flex-end;
  }
  
  // 响应式设计
  @include mobile {
    padding: $spacing-md;
    
    &__filters {
      .el-form--inline .el-form-item {
        display: block;
        margin-right: 0;
        margin-bottom: $spacing-sm;
      }
    }
    
    &__data-table {
      .el-table__fixed-right {
        display: none;
      }
    }
  }
}
</style>
```

### 5.2 询价单详情组件 (InquiryDetail.vue)

```vue
<template>
  <div class="inquiry-detail" v-loading="loading">
    <!-- 询价单基本信息 -->
    <el-card class="inquiry-detail__header" shadow="never">
      <div slot="header" class="inquiry-detail__header-title">
        <span>{{ $t('inquiry.detail.title') }}</span>
        <el-tag :type="getStatusType(inquiry.status)">{{ $t(`inquiry.status.${inquiry.status}`) }}</el-tag>
      </div>
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="inquiry-detail__info-item">
            <label>{{ $t('inquiry.detail.inquiryTitle') }}:</label>
            <span>{{ inquiry.title }}</span>
          </div>
          <div class="inquiry-detail__info-item">
            <label>{{ $t('inquiry.detail.createdAt') }}:</label>
            <span>{{ formatDate(inquiry.created_at) }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="inquiry-detail__info-item">
            <label>{{ $t('inquiry.detail.totalAmount') }}:</label>
            <span class="inquiry-detail__amount">¥{{ inquiry.total_amount ? inquiry.total_amount.toFixed(2) : '0.00' }}</span>
          </div>
          <div class="inquiry-detail__info-item">
            <label>{{ $t('inquiry.detail.itemsCount') }}:</label>
            <span>{{ inquiry.items ? inquiry.items.length : 0 }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 商品列表 -->
    <el-card class="inquiry-detail__items" shadow="never">
      <div slot="header">{{ $t('inquiry.detail.itemsList') }}</div>
      <el-table :data="inquiry.items" border>
        <el-table-column prop="product_name" :label="$t('inquiry.table.productName')" min-width="200"></el-table-column>
        <el-table-column prop="quantity" :label="$t('inquiry.table.quantity')" width="100"></el-table-column>
        <el-table-column prop="original_price" :label="$t('inquiry.table.originalPrice')" width="120">
          <template slot-scope="scope">
            ¥{{ scope.row.original_price.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="quoted_price" :label="$t('inquiry.table.quotedPrice')" width="120">
          <template slot-scope="scope">
            <span v-if="scope.row.quoted_price" class="inquiry-detail__quoted-price">
              ¥{{ scope.row.quoted_price.toFixed(2) }}
            </span>
            <span v-else class="inquiry-detail__no-quote">{{ $t('inquiry.detail.noQuote') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="subtotal" :label="$t('inquiry.table.subtotal')" width="120">
          <template slot-scope="scope">
            ¥{{ ((scope.row.quoted_price || scope.row.original_price) * scope.row.quantity).toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 消息交流区域 -->
    <el-card class="inquiry-detail__messages" shadow="never">
      <div slot="header">{{ $t('inquiry.detail.messageHistory') }}</div>
      <div class="inquiry-detail__message-list">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="['inquiry-detail__message', `inquiry-detail__message--${message.sender_type}`]"
        >
          <div class="inquiry-detail__message-header">
            <span class="inquiry-detail__message-sender">
              {{ message.sender_type === 'user' ? $t('inquiry.message.customer') : $t('inquiry.message.admin') }}
            </span>
            <span class="inquiry-detail__message-time">{{ formatDate(message.created_at) }}</span>
          </div>
          <div class="inquiry-detail__message-content">{{ message.content }}</div>
        </div>
      </div>
      
      <!-- 发送消息 -->
      <div class="inquiry-detail__send-message">
        <el-input
          v-model="newMessage"
          type="textarea"
          :rows="3"
          :placeholder="$t('inquiry.message.placeholder')"
          maxlength="500"
          show-word-limit
        ></el-input>
        <div class="inquiry-detail__send-actions">
          <el-button type="primary" @click="sendMessage" :loading="sendingMessage">{{ $t('inquiry.message.send') }}</el-button>
        </div>
      </div>
    </el-card>

    <!-- 操作按钮 -->
    <div class="inquiry-detail__actions">
      <el-button @click="goBack">{{ $t('common.back') }}</el-button>
      <el-button v-if="inquiry.status === 'quoted'" type="success" @click="syncToCart">{{ $t('inquiry.actions.syncToCart') }}</el-button>
    </div>
  </div>
</template>

<script>
// API调用通过 this.$api 进行，无需单独导入
import { formatDate } from '@/utils/date'

export default {
  name: 'InquiryDetail',
  data() {
    return {
      loading: false,
      sendingMessage: false,
      inquiry: {
        items: []
      },
      messages: [],
      newMessage: ''
    }
  },
  computed: {
    inquiryId() {
      return this.$route.params.id
    }
  },
  watch: {
    // 监听器
  },
  created() {
    this.loadInquiryDetail()
    this.loadMessages()
  },
  mounted() {
    // 组件挂载后的操作
  },
  beforeDestroy() {
    // 清理工作
  },
  methods: {
    async loadInquiryDetail() {
      this.loading = true
      try {
        const response = await this.$api.getWithErrorHandler(`/inquiries/${this.inquiryId}`, {
          fallbackKey: 'inquiry.fetchDetailError'
        })
        if (response.success) {
          this.inquiry = response.data
        }
      } catch (error) {
        this.$messageHandler.showError('INQUIRY.DETAIL.LOAD.FAILED')
      } finally {
        this.loading = false
      }
    },
    
    async loadMessages() {
      try {
        const response = await this.$api.getWithErrorHandler(`/inquiries/${this.inquiryId}/messages`, {
          fallbackKey: 'inquiry.fetchMessagesError'
        })
        if (response.success) {
          this.messages = response.data.messages
        }
      } catch (error) {
        this.$messageHandler.showError('INQUIRY.MESSAGE.LIST.FAILED')
      }
    },
    
    async sendMessage() {
      if (!this.newMessage.trim()) {
        this.$messageHandler.showWarning('INQUIRY.MESSAGE.EMPTY')
        return
      }
      
      this.sendingMessage = true
      try {
        const response = await this.$api.postWithErrorHandler(`/inquiries/${this.inquiryId}/messages`, {
          content: this.newMessage,
          message_type: 'text'
        }, {
          fallbackKey: 'inquiry.sendMessageError'
        })
        if (response.success) {
          this.newMessage = ''
          this.loadMessages()
          this.$messageHandler.showSuccess('INQUIRY.MESSAGE.SEND.SUCCESS')
        }
      } catch (error) {
        this.$messageHandler.showError('INQUIRY.MESSAGE.SEND.FAILED')
      } finally {
        this.sendingMessage = false
      }
    },
    
    async syncToCart() {
      try {
        const response = await this.$api.postWithErrorHandler(`/inquiries/${this.inquiryId}/sync-to-cart`, {}, {
          fallbackKey: 'inquiry.syncError'
        })
        if (response.success) {
          this.$messageHandler.showSuccess('INQUIRY.SYNC.SUCCESS')
          this.$router.push('/cart')
        }
      } catch (error) {
        this.$messageHandler.showError('INQUIRY.SYNC.FAILED')
      }
    },
    
    getStatusType(status) {
      const statusMap = {
        pending: 'warning',
        quoted: 'info',
        completed: 'success',
        cancelled: 'danger'
      }
      return statusMap[status] || 'info'
    },
    
    goBack() {
      this.$router.go(-1)
    },
    
    formatDate
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.inquiry-detail {
  padding: $spacing-lg;
  
  &__header {
    margin-bottom: $spacing-lg;
    
    &-title {
      @include flex-between;
      align-items: center;
    }
  }
  
  &__info-item {
    margin-bottom: $spacing-sm;
    
    label {
      font-weight: 500;
      color: $color-text-secondary;
      margin-right: $spacing-sm;
    }
  }
  
  &__amount {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-primary;
  }
  
  &__items {
    margin-bottom: $spacing-lg;
  }
  
  &__quoted-price {
    color: $color-success;
    font-weight: 500;
  }
  
  &__no-quote {
    color: $color-text-placeholder;
    font-style: italic;
  }
  
  &__messages {
    margin-bottom: $spacing-lg;
  }
  
  &__message-list {
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: $spacing-md;
  }
  
  &__message {
    margin-bottom: $spacing-md;
    padding: $spacing-sm;
    border-radius: $border-radius-base;
    
    &--user {
      background-color: $color-bg-light;
      margin-left: $spacing-xl;
    }
    
    &--admin {
      background-color: $color-primary-light;
      margin-right: $spacing-xl;
    }
  }
  
  &__message-header {
    @include flex-between;
    margin-bottom: $spacing-xs;
    font-size: $font-size-sm;
  }
  
  &__message-sender {
    font-weight: 500;
    color: $color-text-primary;
  }
  
  &__message-time {
    color: $color-text-placeholder;
  }
  
  &__message-content {
    line-height: 1.5;
    word-break: break-word;
  }
  
  &__send-message {
    border-top: 1px solid $color-border-light;
    padding-top: $spacing-md;
  }
  
  &__send-actions {
    margin-top: $spacing-sm;
    text-align: right;
  }
  
  &__actions {
    text-align: center;
    
    .el-button {
      margin: 0 $spacing-sm;
    }
  }
  
  // 响应式设计
  @include mobile {
    padding: $spacing-md;
    
    &__message {
      &--user {
        margin-left: $spacing-sm;
      }
      
      &--admin {
        margin-right: $spacing-sm;
      }
    }
  }
}
</style>
```

### 5.3 创建询价单组件 (CreateInquiry.vue)

```vue
<template>
  <div class="create-inquiry">
    <el-card shadow="never">
      <div slot="header">{{ $t('inquiry.create.title') }}</div>
      
      <el-form
        ref="inquiryForm"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="create-inquiry__form"
      >
        <el-form-item :label="$t('inquiry.form.title')" prop="title">
          <el-input
            v-model="form.title"
            :placeholder="$t('inquiry.form.titlePlaceholder')"
            maxlength="100"
            show-word-limit
          ></el-input>
        </el-form-item>
        
        <el-form-item :label="$t('inquiry.form.description')" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            :placeholder="$t('inquiry.form.descriptionPlaceholder')"
            maxlength="500"
            show-word-limit
          ></el-input>
        </el-form-item>
        
        <el-form-item :label="$t('inquiry.form.items')">
          <div class="create-inquiry__items">
            <div
              v-for="(item, index) in form.items"
              :key="index"
              class="create-inquiry__item"
            >
              <el-row :gutter="10">
                <el-col :span="8">
                  <el-select
                    v-model="item.product_id"
                    :placeholder="$t('inquiry.form.selectProduct')"
                    filterable
                    remote
                    :remote-method="searchProducts"
                    :loading="searchingProducts"
                    @change="onProductChange(item, index)"
                  >
                    <el-option
                      v-for="product in productOptions"
                      :key="product.id"
                      :label="product.name"
                      :value="product.id"
                    ></el-option>
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-input-number
                    v-model="item.quantity"
                    :min="1"
                    :max="9999"
                    :placeholder="$t('inquiry.form.quantity')"
                  ></el-input-number>
                </el-col>
                <el-col :span="6">
                  <span class="create-inquiry__price">¥{{ item.price ? item.price.toFixed(2) : '0.00' }}</span>
                </el-col>
                <el-col :span="4">
                  <el-button
                    type="danger"
                    icon="el-icon-delete"
                    size="mini"
                    @click="removeItem(index)"
                    :disabled="form.items.length <= 1"
                  ></el-button>
                </el-col>
              </el-row>
            </div>
            
            <el-button
              type="dashed"
              icon="el-icon-plus"
              @click="addItem"
              class="create-inquiry__add-item"
            >
              {{ $t('inquiry.form.addItem') }}
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">{{ $t('inquiry.form.submit') }}</el-button>
          <el-button @click="resetForm">{{ $t('common.reset') }}</el-button>
          <el-button @click="goBack">{{ $t('common.cancel') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
// API调用通过 this.$api 进行，无需单独导入

export default {
  name: 'CreateInquiry',
  data() {
    return {
      submitting: false,
      searchingProducts: false,
      productOptions: [],
      form: {
        title: '',
        description: '',
        items: [
          {
            product_id: null,
            quantity: 1,
            price: 0
          }
        ]
      },
      rules: {
        title: [
          { required: true, message: this.$t('inquiry.validation.titleRequired'), trigger: 'blur' },
          { min: 2, max: 100, message: this.$t('inquiry.validation.titleLength'), trigger: 'blur' }
        ],
        description: [
          { max: 500, message: this.$t('inquiry.validation.descriptionLength'), trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    // 计算属性
  },
  watch: {
    // 监听器
  },
  created() {
    // 组件创建时的操作
  },
  mounted() {
    // 组件挂载后的操作
  },
  beforeDestroy() {
    // 清理工作
  },
  methods: {
    async searchProducts(query) {
      if (!query) {
        this.productOptions = []
        return
      }
      
      this.searchingProducts = true
      try {
        const response = await this.$api.getWithErrorHandler('/products/search', {
          fallbackKey: 'product.searchError',
          params: { q: query, limit: 20 }
        })
        if (response.success) {
          this.productOptions = response.data.products
        }
      } catch (error) {
        this.$messageHandler.showError('PRODUCT.SEARCH.FAILED')
      } finally {
        this.searchingProducts = false
      }
    },
    
    onProductChange(item, index) {
      const product = this.productOptions.find(p => p.id === item.product_id)
      if (product) {
        item.price = product.price
        item.product_name = product.name
      }
    },
    
    addItem() {
      this.form.items.push({
        product_id: null,
        quantity: 1,
        price: 0
      })
    },
    
    removeItem(index) {
      if (this.form.items.length > 1) {
        this.form.items.splice(index, 1)
      }
    },
    
    submitForm() {
      this.$refs.inquiryForm.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        // 验证商品项
        const hasValidItems = this.form.items.every(item => item.product_id && item.quantity > 0)
        if (!hasValidItems) {
          this.$messageHandler.showError('INQUIRY.VALIDATION.ITEMS_REQUIRED')
          return
        }
        
        this.submitting = true
        try {
          const response = await this.$api.postWithErrorHandler('/inquiries', this.form, {
            fallbackKey: 'inquiry.createError'
          })
          if (response.success) {
            this.$messageHandler.showSuccess('INQUIRY.CREATE.SUCCESS')
            this.$router.push('/inquiries')
          }
        } catch (error) {
          this.$messageHandler.showError('INQUIRY.CREATE.FAILED')
        } finally {
          this.submitting = false
        }
      })
    },
    
    resetForm() {
      this.$refs.inquiryForm.resetFields()
      this.form.items = [
        {
          product_id: null,
          quantity: 1,
          price: 0
        }
      ]
    },
    
    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.create-inquiry {
  padding: $spacing-lg;
  
  &__form {
    max-width: 800px;
  }
  
  &__items {
    border: 1px solid $color-border-light;
    border-radius: $border-radius-base;
    padding: $spacing-md;
  }
  
  &__item {
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-md;
    border-bottom: 1px solid $color-border-lighter;
    
    &:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
  }
  
  &__price {
    line-height: 32px;
    font-weight: 500;
    color: $color-primary;
  }
  
  &__add-item {
    width: 100%;
    border-style: dashed;
  }
  
  // 响应式设计
  @include mobile {
    padding: $spacing-md;
    
    &__form {
      .el-form-item__label {
        width: 100px !important;
      }
    }
  }
}
</style>
```

### 5.4 Vue组件结构规范

根据项目规范，所有Vue组件必须遵循以下结构：

```vue
<template>
  <!-- 模板内容 -->
</template>

<script>
export default {
  name: 'ComponentName', // 必须设置组件名称
  props: {
    // 组件属性定义
  },
  data() {
    return {
      // 响应式数据
    }
  },
  computed: {
    // 计算属性
  },
  watch: {
    // 监听器
  },
  created() {
    // 组件创建时的操作
  },
  mounted() {
    // 组件挂载后的操作
  },
  beforeDestroy() {
    // 清理工作
  },
  methods: {
    // 方法定义
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

// 组件样式，使用BEM命名规范
.component-name {
  // 样式定义
}
</style>
```

### 5.5 路由配置

在 `src/router/index.js` 中添加询价功能相关路由：

```javascript
// 询价功能路由
{
  path: '/inquiries',
  name: 'InquiryList',
  component: () => import('@/views/inquiry/InquiryList.vue'),
  meta: {
    title: 'inquiry.list.title',
    requiresAuth: true
  }
},
{
  path: '/inquiry/create',
  name: 'CreateInquiry',
  component: () => import('@/views/inquiry/CreateInquiry.vue'),
  meta: {
    title: 'inquiry.create.title',
    requiresAuth: true
  }
},
{
  path: '/inquiry/:id',
  name: 'InquiryDetail',
  component: () => import('@/views/inquiry/InquiryDetail.vue'),
  meta: {
    title: 'inquiry.detail.title',
    requiresAuth: true
  }
}
```

### 5.6 多语言翻译键

根据项目前端规范，需要将前端翻译键添加到 `db/main/insert_message_translations.sql` 文件中：

```sql
-- 询价功能前端翻译键
INSERT INTO language_translations (guid, code, lang, value) VALUES
-- 询价列表页面
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.list.title', 'zh-CN', '询价单列表'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.list.title', 'en', 'Inquiry List'),

-- 创建询价页面
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.create.title', 'zh-CN', '创建询价单'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.create.title', 'en', 'Create Inquiry'),

-- 询价详情页面
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.title', 'zh-CN', '询价单详情'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.title', 'en', 'Inquiry Detail'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.inquiryTitle', 'zh-CN', '询价标题'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.inquiryTitle', 'en', 'Inquiry Title'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.createdAt', 'zh-CN', '创建时间'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.createdAt', 'en', 'Created At'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.totalAmount', 'zh-CN', '总金额'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.totalAmount', 'en', 'Total Amount'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.itemsCount', 'zh-CN', '商品数量'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.itemsCount', 'en', 'Items Count'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.itemsList', 'zh-CN', '商品列表'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.itemsList', 'en', 'Items List'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.messageHistory', 'zh-CN', '消息记录'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.messageHistory', 'en', 'Message History'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.noQuote', 'zh-CN', '未报价'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.detail.noQuote', 'en', 'No Quote'),

-- 搜索表单
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.search.title', 'zh-CN', '标题'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.search.title', 'en', 'Title'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.search.titlePlaceholder', 'zh-CN', '请输入询价单标题'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.search.titlePlaceholder', 'en', 'Enter inquiry title'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.search.status', 'zh-CN', '状态'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.search.status', 'en', 'Status'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.search.statusPlaceholder', 'zh-CN', '请选择状态'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.search.statusPlaceholder', 'en', 'Select status'),

-- 表格列
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.title', 'zh-CN', '标题'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.title', 'en', 'Title'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.status', 'zh-CN', '状态'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.status', 'en', 'Status'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.itemsCount', 'zh-CN', '商品数量'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.itemsCount', 'en', 'Items Count'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.totalAmount', 'zh-CN', '总金额'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.totalAmount', 'en', 'Total Amount'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.createdAt', 'zh-CN', '创建时间'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.createdAt', 'en', 'Created At'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.productName', 'zh-CN', '商品名称'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.productName', 'en', 'Product Name'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.quantity', 'zh-CN', '数量'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.quantity', 'en', 'Quantity'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.originalPrice', 'zh-CN', '原价'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.originalPrice', 'en', 'Original Price'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.quotedPrice', 'zh-CN', '报价'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.quotedPrice', 'en', 'Quoted Price'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.subtotal', 'zh-CN', '小计'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.table.subtotal', 'en', 'Subtotal'),

-- 状态
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.status.pending', 'zh-CN', '待报价'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.status.pending', 'en', 'Pending'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.status.quoted', 'zh-CN', '已报价'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.status.quoted', 'en', 'Quoted'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.status.completed', 'zh-CN', '已完成'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.status.completed', 'en', 'Completed'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.status.cancelled', 'zh-CN', '已取消'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.status.cancelled', 'en', 'Cancelled'),

-- 操作按钮
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.actions.syncToCart', 'zh-CN', '同步到购物车'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.actions.syncToCart', 'en', 'Sync to Cart'),

-- 表单
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.title', 'zh-CN', '询价标题'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.title', 'en', 'Inquiry Title'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.titlePlaceholder', 'zh-CN', '请输入询价标题'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.titlePlaceholder', 'en', 'Enter inquiry title'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.description', 'zh-CN', '询价描述'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.description', 'en', 'Description'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.descriptionPlaceholder', 'zh-CN', '请输入询价描述'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.descriptionPlaceholder', 'en', 'Enter inquiry description'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.items', 'zh-CN', '询价商品'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.items', 'en', 'Inquiry Items'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.selectProduct', 'zh-CN', '选择商品'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.selectProduct', 'en', 'Select Product'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.quantity', 'zh-CN', '数量'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.quantity', 'en', 'Quantity'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.addItem', 'zh-CN', '添加商品'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.addItem', 'en', 'Add Item'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.submit', 'zh-CN', '提交询价'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.form.submit', 'en', 'Submit Inquiry'),

-- 消息
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.message.customer', 'zh-CN', '客户'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.message.customer', 'en', 'Customer'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.message.admin', 'zh-CN', '业务员'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.message.admin', 'en', 'Admin'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.message.placeholder', 'zh-CN', '请输入消息内容...'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.message.placeholder', 'en', 'Enter message content...'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.message.send', 'zh-CN', '发送'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.message.send', 'en', 'Send'),

-- 验证消息
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.validation.titleRequired', 'zh-CN', '请输入询价标题'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.validation.titleRequired', 'en', 'Please enter inquiry title'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.validation.titleLength', 'zh-CN', '标题长度应在2-100个字符之间'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.validation.titleLength', 'en', 'Title length should be between 2-100 characters'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.validation.descriptionLength', 'zh-CN', '描述长度不能超过500个字符'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.validation.descriptionLength', 'en', 'Description length should not exceed 500 characters'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.validation.itemsRequired', 'zh-CN', '请至少添加一个有效商品'),
(UNHEX(REPLACE(UUID(), '-', '')), 'inquiry.validation.itemsRequired', 'en', 'Please add at least one valid item');
```

## 6. 实施计划

### 6.1 开发阶段

1. **数据库设计阶段** (1天)
   - 创建数据库表结构
   - 添加索引和约束
   - 插入测试数据

2. **后端API开发阶段** (3天)
   - 实现询价单CRUD接口
   - 实现消息系统接口
   - 添加消息键和翻译
   - 编写单元测试

3. **前端组件开发阶段** (3天)
   - 开发询价单列表组件
   - 开发询价单详情组件
   - 开发创建询价单组件
   - 集成多语言支持

4. **集成测试阶段** (1天)
   - 前后端联调
   - 功能测试
   - 用户体验优化

### 6.2 部署计划

1. **开发环境部署**
   - 数据库迁移
   - 后端服务部署
   - 前端构建部署

2. **生产环境部署**
   - 数据库备份
   - 灰度发布
   - 监控和日志配置

### 6.3 验收标准

1. **功能完整性**
   - 所有API接口正常工作
   - 前端组件功能完整
   - 多语言支持正常

2. **性能要求**
   - 页面加载时间 < 2秒
   - API响应时间 < 500ms
   - 支持并发用户数 > 100

3. **用户体验**
   - 界面美观易用
   - 操作流程顺畅
   - 错误提示友好

4. **代码质量**
   - 遵循项目编码规范
   - 代码覆盖率 > 80%
   - 无严重安全漏洞

## 7. 总结

本设计方案严格遵循了项目的开发规范，包括：

- **数据库设计**：使用GUID主键、软删除、规范的字段命名和索引设计
- **后端API**：统一响应格式、消息键管理、错误处理和认证授权
- **前端组件**：Vue组件结构规范、SCSS样式规范、多语言支持和响应式设计
- **代码规范**：BEM命名法、文件命名规范、代码风格统一

该方案提供了完整的询价功能实现，包括用户端的询价单创建和管理，以及业务员端的报价和沟通功能，确保了良好的用户体验和系统可维护性。
components/
├── inquiry/
│   ├── InquiryPanel.vue          # 询价面板主组件
│   ├── InquiryList.vue           # 询价单列表
│   ├── InquiryItem.vue           # 单个询价单
│   ├── InquiryChat.vue           # 聊天组件
│   ├── InquiryProductItem.vue    # 询价商品项
│   └── InquiryStatusBadge.vue    # 状态标签
└── admin/
    ├── AdminInquiryList.vue      # 管理员询价列表
    ├── AdminInquiryDetail.vue    # 管理员询价详情
    └── AdminInquiryChat.vue      # 管理员聊天组件
```

### 5.2 状态管理 (Vuex)

```javascript
// store/modules/inquiry.js
const state = {
  inquiries: [],
  currentInquiry: null,
  messages: {},
  unreadCounts: {},
  maxInquiries: 10
}

const mutations = {
  SET_INQUIRIES(state, inquiries) {
    state.inquiries = inquiries
  },
  SET_CURRENT_INQUIRY(state, inquiry) {
    state.currentInquiry = inquiry
  },
  ADD_MESSAGE(state, { inquiryId, message }) {
    if (!state.messages[inquiryId]) {
      state.messages[inquiryId] = []
    }
    state.messages[inquiryId].push(message)
  },
  UPDATE_UNREAD_COUNT(state, { inquiryId, count }) {
    state.unreadCounts[inquiryId] = count
  }
}

const actions = {
  async fetchInquiries({ commit }) {
    const response = await api.get('/inquiries')
    commit('SET_INQUIRIES', response.data.inquiries)
  },
  async createInquiry({ dispatch }, inquiryData) {
    await api.post('/inquiries', inquiryData)
    dispatch('fetchInquiries')
  },
  async sendMessage({ commit }, { inquiryId, message }) {
    const response = await api.post(`/inquiries/${inquiryId}/messages`, message)
    commit('ADD_MESSAGE', { inquiryId, message: response.data })
  }
}
```

## 6. 样式设计 (SCSS)

### 6.1 使用现有变量

基于项目现有的SCSS变量，询价功能将使用以下变量：

```scss
// 颜色变量
$primary-color: #e53e3e;        // 主色调
$success-color: #38a169;        // 成功状态
$warning-color: #d69e2e;        // 警告状态
$info-color: #3182ce;           // 信息状态
$gray-100: #edf2f7;             // 背景色
$gray-200: #e2e8f0;             // 边框色
$gray-600: #4a5568;             // 文字色

// 间距变量
$spacing-sm: 6px;
$spacing-md: 13px;
$spacing-lg: 19px;
$spacing-xl: 26px;
$spacing-2xl: 38px;

// 字体变量
$font-size-sm: 11px;
$font-size-base: 13px;
$font-size-lg: 14px;
$font-weight-medium: 500;
$font-weight-semibold: 600;

// 边框变量
$border-radius-sm: 3px;
$border-radius-md: 6px;
$border-radius-lg: 10px;

// 阴影变量
$shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
$shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

// 过渡变量
$transition-base: all 0.2s ease;
$transition-fast: all 0.15s ease;
```

### 6.2 新增变量

需要在 `_variables.scss` 文件中新增以下询价功能专用变量：

```scss
// 询价功能专用变量
$inquiry-panel-width: 100%;
$inquiry-panel-max-height: 400px;
$inquiry-tab-height: 40px;
$inquiry-chat-height: 300px;
$inquiry-message-max-width: 70%;
$inquiry-avatar-size: 32px;
$inquiry-status-badge-padding: 4px 8px;
$inquiry-item-padding: $spacing-md;
$inquiry-item-border: 1px solid $gray-200;
$inquiry-item-hover-bg: $gray-50;
$inquiry-button-height: 32px;
$inquiry-input-height: 36px;
$inquiry-price-input-width: 100px;
$inquiry-quantity-input-width: 80px;

// 询价状态颜色
$inquiry-status-pending: $warning-color;
$inquiry-status-discussing: $info-color;
$inquiry-status-agreed: $success-color;
$inquiry-status-rejected: $error-color;
$inquiry-status-expired: $gray-500;

// 询价聊天相关
$inquiry-chat-bg: $white;
$inquiry-chat-border: 1px solid $gray-200;
$inquiry-message-user-bg: $primary-color;
$inquiry-message-business-bg: $gray-100;
$inquiry-message-user-color: $white;
$inquiry-message-business-color: $text-primary;
$inquiry-message-border-radius: $border-radius-lg;
$inquiry-message-padding: $spacing-sm $spacing-md;
$inquiry-message-margin: $spacing-xs 0;

// 询价面板动画
$inquiry-panel-transition: all 0.3s ease-in-out;
$inquiry-tab-transition: all 0.2s ease;
$inquiry-message-animation: slideInUp 0.3s ease;
```

### 6.3 组件样式示例

```scss
// InquiryPanel.vue 样式
.inquiry-panel {
  background: $white;
  border: $inquiry-item-border;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;
  margin-top: $spacing-xl;
  transition: $inquiry-panel-transition;

  &__header {
    padding: $spacing-lg;
    border-bottom: 1px solid $gray-200;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      color: $text-primary;
    }
  }

  &__tabs {
    display: flex;
    border-bottom: 1px solid $gray-200;
    background: $gray-50;

    .tab {
      flex: 1;
      padding: $spacing-md;
      text-align: center;
      cursor: pointer;
      transition: $inquiry-tab-transition;
      font-size: $font-size-sm;
      color: $text-secondary;
      border-right: 1px solid $gray-200;

      &:last-child {
        border-right: none;
      }

      &.active {
        background: $white;
        color: $primary-color;
        font-weight: $font-weight-medium;
        border-bottom: 2px solid $primary-color;
      }

      &:hover:not(.active) {
        background: $gray-100;
        color: $text-primary;
      }
    }
  }

  &__content {
    padding: $spacing-lg;
    max-height: $inquiry-panel-max-height;
    overflow-y: auto;
  }
}

// InquiryChat.vue 样式
.inquiry-chat {
  height: $inquiry-chat-height;
  display: flex;
  flex-direction: column;
  background: $inquiry-chat-bg;
  border: $inquiry-chat-border;
  border-radius: $border-radius-md;

  &__messages {
    flex: 1;
    padding: $spacing-md;
    overflow-y: auto;
    background: $gray-50;

    .message {
      margin: $inquiry-message-margin;
      display: flex;
      align-items: flex-start;
      gap: $spacing-sm;

      &.user {
        flex-direction: row-reverse;

        .message-content {
          background: $inquiry-message-user-bg;
          color: $inquiry-message-user-color;
          margin-left: auto;
        }
      }

      &.business {
        .message-content {
          background: $inquiry-message-business-bg;
          color: $inquiry-message-business-color;
        }
      }

      .avatar {
        width: $inquiry-avatar-size;
        height: $inquiry-avatar-size;
        border-radius: 50%;
        background: $gray-300;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: $font-size-sm;
        color: $white;
        flex-shrink: 0;
      }

      .message-content {
        max-width: $inquiry-message-max-width;
        padding: $inquiry-message-padding;
        border-radius: $inquiry-message-border-radius;
        font-size: $font-size-sm;
        line-height: $line-height-normal;
        word-wrap: break-word;
      }

      .message-time {
        font-size: $font-size-xs;
        color: $text-muted;
        margin-top: $spacing-xs;
      }
    }
  }

  &__input {
    padding: $spacing-md;
    border-top: 1px solid $gray-200;
    display: flex;
    gap: $spacing-sm;

    input {
      flex: 1;
      height: $inquiry-input-height;
      padding: 0 $spacing-md;
      border: 1px solid $gray-300;
      border-radius: $border-radius-md;
      font-size: $font-size-sm;

      &:focus {
        outline: none;
        border-color: $primary-color;
        box-shadow: 0 0 0 2px rgba($primary-color, 0.2);
      }
    }

    button {
      height: $inquiry-input-height;
      padding: 0 $spacing-lg;
      background: $primary-color;
      color: $white;
      border: none;
      border-radius: $border-radius-md;
      font-size: $font-size-sm;
      cursor: pointer;
      transition: $transition-fast;

      &:hover {
        background: $primary-dark;
      }

      &:disabled {
        background: $gray-400;
        cursor: not-allowed;
      }
    }
  }
}

// 状态标签样式
.inquiry-status-badge {
  padding: $inquiry-status-badge-padding;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.pending {
    background: rgba($inquiry-status-pending, 0.1);
    color: $inquiry-status-pending;
  }

  &.discussing {
    background: rgba($inquiry-status-discussing, 0.1);
    color: $inquiry-status-discussing;
  }

  &.agreed {
    background: rgba($inquiry-status-agreed, 0.1);
    color: $inquiry-status-agreed;
  }

  &.rejected {
    background: rgba($inquiry-status-rejected, 0.1);
    color: $inquiry-status-rejected;
  }

  &.expired {
    background: rgba($inquiry-status-expired, 0.1);
    color: $inquiry-status-expired;
  }
}
```

## 7. 实时通信设计

### 7.1 SSE (Server-Sent Events) 集成

```javascript
// utils/sse.js
class InquirySSE {
  constructor() {
    this.eventSource = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 3000
    this.lastEventId = null
  }

  connect(userId) {
    const sseUrl = `${process.env.VUE_APP_API_URL}/api/inquiries/events?userId=${userId}`
    
    // 添加认证头和Last-Event-ID
    const token = localStorage.getItem('token')
    const url = new URL(sseUrl)
    if (this.lastEventId) {
      url.searchParams.set('lastEventId', this.lastEventId)
    }
    
    this.eventSource = new EventSource(url.toString())

    this.eventSource.onopen = () => {
      console.log('Inquiry SSE connected')
      this.reconnectAttempts = 0
    }

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      this.lastEventId = event.lastEventId
      this.handleMessage(data)
    }

    this.eventSource.onerror = (error) => {
      console.error('Inquiry SSE error:', error)
      if (this.eventSource.readyState === EventSource.CLOSED) {
        console.log('Inquiry SSE disconnected')
        this.reconnect(userId)
      }
    }

    // 监听特定事件类型
    this.eventSource.addEventListener('new_message', (event) => {
      const data = JSON.parse(event.data)
      this.handleMessage({ type: 'new_message', ...data })
    })

    this.eventSource.addEventListener('price_update', (event) => {
      const data = JSON.parse(event.data)
      this.handleMessage({ type: 'price_update', ...data })
    })

    this.eventSource.addEventListener('status_change', (event) => {
      const data = JSON.parse(event.data)
      this.handleMessage({ type: 'status_change', ...data })
    })
  }

  handleMessage(data) {
    switch (data.type) {
      case 'new_message':
        store.commit('inquiry/ADD_MESSAGE', {
          inquiryId: data.inquiryId,
          message: data.message
        })
        break
      case 'price_update':
        store.dispatch('inquiry/updateInquiryItem', data.item)
        break
      case 'status_change':
        store.dispatch('inquiry/updateInquiryStatus', {
          inquiryId: data.inquiryId,
          status: data.status
        })
        break
      case 'heartbeat':
        // 心跳消息，保持连接活跃
        console.log('SSE heartbeat received')
        break
    }
  }

  // SSE是单向通信，发送消息仍需要使用HTTP API
  async sendMessage(inquiryId, message) {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.VUE_APP_API_URL}/api/inquiries/${inquiryId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(message)
      })
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  reconnect(userId) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect SSE (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      setTimeout(() => {
        this.connect(userId)
      }, this.reconnectInterval)
    } else {
      console.error('Max reconnection attempts reached for SSE')
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.lastEventId = null
    }
  }

  // 获取连接状态
  getReadyState() {
    return this.eventSource ? this.eventSource.readyState : EventSource.CLOSED
  }

  // 检查是否连接
  isConnected() {
    return this.eventSource && this.eventSource.readyState === EventSource.OPEN
  }
}

export default new InquirySSE()
```

### 7.3 SSE vs WebSocket 对比

**选择SSE的优势：**

1. **简单性**：SSE基于HTTP协议，实现更简单，无需处理复杂的WebSocket握手
2. **自动重连**：浏览器原生支持自动重连机制
3. **防火墙友好**：基于HTTP，更容易通过企业防火墙和代理
4. **事件ID支持**：内置Last-Event-ID机制，支持断线重连后的消息恢复
5. **更好的错误处理**：HTTP状态码提供更清晰的错误信息
6. **负载均衡友好**：更容易与现有的HTTP负载均衡器集成

**适用场景：**
- 单向数据推送（服务器到客户端）
- 实时通知和消息推送
- 股票价格、新闻更新等实时数据流
- 聊天应用中的消息接收（发送仍使用HTTP API）

**使用注意事项：**

1. **浏览器连接限制**：每个域名最多6个并发SSE连接
2. **单向通信**：只能服务器向客户端推送，客户端发送数据需要额外的HTTP请求
3. **文本数据**：只支持文本数据传输，二进制数据需要编码
4. **认证处理**：需要通过URL参数或自定义头部处理认证

### 7.4 前端集成示例

```javascript
// 在Vue组件中使用SSE
export default {
  name: 'InquiryChat',
  data() {
    return {
      messages: [],
      newMessage: '',
      isConnected: false
    }
  },
  async mounted() {
    // 连接SSE
    const userId = this.$store.state.auth.user.id
    await this.connectSSE(userId)
  },
  beforeUnmount() {
    // 断开SSE连接
    this.disconnectSSE()
  },
  methods: {
    async connectSSE(userId) {
      try {
        InquirySSE.connect(userId)
        this.isConnected = true
        
        // 监听连接状态变化
        this.$nextTick(() => {
          this.checkConnectionStatus()
        })
      } catch (error) {
        console.error('Failed to connect SSE:', error)
        this.isConnected = false
      }
    },
    
    disconnectSSE() {
      InquirySSE.disconnect()
      this.isConnected = false
    },
    
    async sendMessage() {
      if (!this.newMessage.trim()) return
      
      try {
        await InquirySSE.sendMessage(this.inquiryId, {
          content: this.newMessage,
          message_type: 'text'
        })
        this.newMessage = ''
      } catch (error) {
        console.error('Failed to send message:', error)
        this.$message.error('发送消息失败，请重试')
      }
    },
    
    checkConnectionStatus() {
      const checkInterval = setInterval(() => {
        this.isConnected = InquirySSE.isConnected()
        if (!this.isConnected) {
          clearInterval(checkInterval)
        }
      }, 1000)
    }
  }
}
```

### 7.2 后端SSE实现

```javascript
// routes/inquiryRoutes.js - 添加SSE端点
router.get('/events', verifyToken, inquiryController.getSSEEvents)

// controllers/inquiryController.js
exports.getSSEEvents = async (req, res) => {
  const userId = req.userId
  const { lastEventId } = req.query
  
  // 设置SSE响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  })

  // 发送初始连接确认
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)

  // 如果有lastEventId，发送错过的消息
  if (lastEventId) {
    try {
      const missedMessages = await getMissedMessages(userId, lastEventId)
      missedMessages.forEach(message => {
        res.write(`id: ${message.id}\n`)
        res.write(`event: ${message.type}\n`)
        res.write(`data: ${JSON.stringify(message.data)}\n\n`)
      })
    } catch (error) {
      console.error('Error sending missed messages:', error)
    }
  }

  // 设置心跳
  const heartbeat = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeat)
      return
    }
    res.write(`event: heartbeat\n`)
    res.write(`data: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`)
  }, 30000) // 每30秒发送心跳

  // 将连接添加到活跃连接列表
  addSSEConnection(userId, res)

  // 处理客户端断开连接
  req.on('close', () => {
    clearInterval(heartbeat)
    removeSSEConnection(userId, res)
    console.log(`SSE connection closed for user ${userId}`)
  })

  req.on('error', (error) => {
    console.error('SSE connection error:', error)
    clearInterval(heartbeat)
    removeSSEConnection(userId, res)
  })
}

// SSE连接管理
const sseConnections = new Map() // userId -> Set of response objects

function addSSEConnection(userId, res) {
  if (!sseConnections.has(userId)) {
    sseConnections.set(userId, new Set())
  }
  sseConnections.get(userId).add(res)
}

function removeSSEConnection(userId, res) {
  if (sseConnections.has(userId)) {
    sseConnections.get(userId).delete(res)
    if (sseConnections.get(userId).size === 0) {
      sseConnections.delete(userId)
    }
  }
}

// 广播消息到特定用户
function broadcastToUser(userId, eventType, data, eventId = null) {
  if (sseConnections.has(userId)) {
    const connections = sseConnections.get(userId)
    connections.forEach(res => {
      if (!res.writableEnded) {
        try {
          if (eventId) {
            res.write(`id: ${eventId}\n`)
          }
          res.write(`event: ${eventType}\n`)
          res.write(`data: ${JSON.stringify(data)}\n\n`)
        } catch (error) {
          console.error('Error broadcasting to user:', error)
          connections.delete(res)
        }
      } else {
        connections.delete(res)
      }
    })
  }
}

// 获取错过的消息
async function getMissedMessages(userId, lastEventId) {
  try {
    // 查询用户相关的询价单
    const [userInquiries] = await pool.query(
      'SELECT id FROM inquiries WHERE user_id = ? AND deleted = 0',
      [userId]
    )
    
    if (userInquiries.length === 0) {
      return []
    }
    
    const inquiryIds = userInquiries.map(inquiry => inquiry.id)
    const placeholders = inquiryIds.map(() => '?').join(',')
    
    // 查询错过的消息
    const [messages] = await pool.query(
      `SELECT 
         im.id,
         im.inquiry_id,
         im.message_type,
         im.content,
         im.created_at,
         u.username as sender_name
       FROM inquiry_messages im
       LEFT JOIN users u ON im.sender_id = u.id
       WHERE im.inquiry_id IN (${placeholders}) 
         AND im.id > ? 
         AND im.deleted = 0
       ORDER BY im.created_at ASC`,
      [...inquiryIds, parseInt(lastEventId)]
    )
    
    return messages.map(msg => ({
      id: msg.id,
      type: 'new_message',
      data: {
        inquiryId: msg.inquiry_id,
        message: {
          id: msg.id,
          content: msg.content,
          messageType: msg.message_type,
          senderName: msg.sender_name,
          createdAt: msg.created_at
        }
      }
    }))
  } catch (error) {
    console.error('Error getting missed messages:', error)
    return []
  }
}

// 导出广播函数供其他模块使用
module.exports = {
  broadcastToUser,
  addSSEConnection,
  removeSSEConnection
}
```

## 8. 移动端适配

### 8.1 响应式设计

```scss
// 移动端适配
@media (max-width: $breakpoint-mobile) {
  .inquiry-panel {
    margin: $spacing-md;
    border-radius: $border-radius-md;

    &__header {
      padding: $spacing-md;
      
      h3 {
        font-size: $font-size-base;
      }
    }

    &__tabs {
      .tab {
        padding: $spacing-sm;
        font-size: $font-size-xs;
      }
    }

    &__content {
      padding: $spacing-md;
      max-height: 300px;
    }
  }

  .inquiry-chat {
    height: 250px;

    &__messages {
      padding: $spacing-sm;

      .message {
        .message-content {
          max-width: 85%;
          padding: $spacing-xs $spacing-sm;
          font-size: $font-size-xs;
        }

        .avatar {
          width: 24px;
          height: 24px;
          font-size: $font-size-xs;
        }
      }
    }

    &__input {
      padding: $spacing-sm;

      input {
        height: 32px;
        font-size: $font-size-xs;
      }

      button {
        height: 32px;
        padding: 0 $spacing-md;
        font-size: $font-size-xs;
      }
    }
  }
}
```

## 9. 安全考虑

### 9.1 权限控制
- 用户只能查看和操作自己的询价单
- 业务员需要特定权限才能访问询价管理功能
- 所有API接口都需要身份验证

### 9.2 数据验证
- 前端和后端都需要进行数据验证
- 防止XSS攻击，所有用户输入都需要转义
- 限制询价单数量和消息长度

### 9.3 敏感信息保护
- 价格信息需要加密传输
- 聊天记录需要定期清理
- 用户隐私信息不得泄露

## 10. 性能优化

### 10.1 前端优化
- 使用虚拟滚动处理大量消息
- 实现消息分页加载
- 使用防抖处理用户输入
- 组件懒加载

### 10.2 后端优化
- 数据库索引优化
- 缓存热点数据
- 消息队列处理实时通信
- API响应压缩

## 11. 测试策略

### 11.1 单元测试
- Vue组件测试
- API接口测试
- 工具函数测试

### 11.2 集成测试
- 询价流程端到端测试
- SSE连接测试
- 权限控制测试

### 11.3 性能测试
- 并发用户测试
- 消息传输性能测试
- 数据库查询性能测试

## 12. 部署方案

### 12.1 分阶段部署
1. **第一阶段**: 基础询价功能（创建询价单、添加商品）
2. **第二阶段**: 聊天功能和实时通信
3. **第三阶段**: 业务员管理功能
4. **第四阶段**: 高级功能和优化

### 12.2 数据迁移
- 现有购物车数据兼容性处理
- 用户数据迁移脚本
- 数据备份和恢复策略

## 13. 维护和监控

### 13.1 日志记录
- 用户操作日志
- 系统错误日志
- 性能监控日志

### 13.2 监控指标
- 询价单创建数量
- 消息发送成功率
- SSE连接稳定性
- API响应时间

## 14. 总结

本设计方案提供了完整的询价功能实现方案，包括：

1. **完整的数据库设计**：支持询价单、商品和消息管理
2. **RESTful API设计**：清晰的接口定义和数据格式
3. **Vue组件架构**：模块化的前端组件设计
4. **SCSS样式规范**：基于现有变量的一致性设计
5. **实时通信**：SSE (Server-Sent Events) 支持的即时消息功能
6. **移动端适配**：响应式设计确保多端体验
7. **安全性考虑**：权限控制和数据保护
8. **性能优化**：前后端性能优化策略
9. **测试和部署**：完整的测试和部署方案

该方案符合项目现有的技术栈和设计规范，可以直接实施并与现有系统无缝集成。