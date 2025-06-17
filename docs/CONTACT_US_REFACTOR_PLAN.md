---
description: Contact Us 功能重构技术文档
author: AI Assistant
date: 2024-03-15
version: 1.0
---

# Contact Us 功能重构技术文档

## 1. 项目概述

### 1.1 业务需求
根据最新的业务需求，联系页面需要实现以下功能：
- 展示公司联系方式（地址、电话、邮箱、微信）
- **灵活访问**: 联系表单支持登录和未登录用户访问
- **智能填充**: 登录用户自动填充姓名、邮箱、电话信息且不可编辑
- **手动填写**: 未登录用户可手动填写所有信息
- **验证码验证**: 所有用户提交消息前必须通过图形验证码验证（类似Register.vue中的实现）
- **业务组分配**: 登录用户关联到对应业务组，未登录用户使用默认业务组
- 用户提交后将信息存储到数据库，包含姓名、邮箱、电话等完整信息
- 实现业务人员管理功能，业务人员作为特殊角色的用户
- 实现业务组管理，每个组有组名和组邮箱
- 普通用户注册后自动关联到默认业务组
- 用户提交联系信息后，系统根据用户关联的业务组发送邮件到组邮箱
- 管理员可以管理业务人员和业务组
- 业务人员登录后可查看和处理联系信息及订单信息
- **用户管理增强**: 管理员可在用户管理页面查看和修改普通用户的业务组分配

### 1.2 当前状态分析
- ✅ 前端页面已实现：`frontend/src/views/Contact.vue` (已更新支持name、email、phone字段)
- ✅ 邮件发送工具已存在：`backend/utils/email.js`
- ✅ 后端API接口已实现：`backend/controllers/contactController.js`
- ✅ 数据库表已存在：`contact_messages` 表包含name、email、phone字段
- ✅ 路由配置已完成：`backend/routes/contactRoutes.js` (支持可选认证)
- ✅ 前端表单提交功能已完成：包含验证码验证
- 🔄 验证码功能需调整：从邮箱验证码改为图形验证码（参考Register.vue实现）
- ✅ 翻译文件已更新：添加了新字段的多语言支持

## 2. 技术架构设计

### 2.1 技术栈
- **前端**: Vue.js 3 + Element Plus
- **后端**: Node.js + Express
- **数据库**: MySQL 8.0
- **邮件服务**: Nodemailer

### 2.2 模块划分
```
Contact Us 功能模块
├── 前端模块
│   ├── 联系表单组件 (Contact.vue)
│   ├── 业务组管理组件 (BusinessGroupManagement.vue)
│   ├── 业务人员管理组件 (BusinessStaffManagement.vue)
│   ├── 联系消息管理组件 (ContactMessageManagement.vue)
│   ├── 表单验证
│   └── API调用
├── 后端模块
│   ├── 联系消息控制器 (contactController.js)
│   ├── 业务组控制器 (businessGroupController.js)
│   ├── 用户管理控制器 (userManagementController.js)
│   ├── 路由配置 (contactRoutes.js, businessRoutes.js)
│   ├── 邮件路由服务
│   └── 数据验证
└── 数据库模块
    ├── 联系消息表 (contact_messages)
    ├── 业务组表 (business_groups)
    ├── 用户业务组关联表 (user_business_groups)
    ├── 用户表扩展 (users - 增加role字段)
    └── 相关索引
```

## 3. 数据库设计

### 3.1 用户表扩展

```sql
-- 扩展用户表，增加业务组关联字段（用户表中已有user_role字段）
ALTER TABLE users ADD COLUMN business_group_id BIGINT DEFAULT NULL COMMENT '关联的业务组ID';
ALTER TABLE users ADD INDEX idx_business_group_id (business_group_id);
ALTER TABLE users ADD FOREIGN KEY (business_group_id) REFERENCES business_groups(id);
```

### 3.2 业务组表结构

```sql
-- 业务组表
CREATE TABLE IF NOT EXISTS business_groups (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  group_name VARCHAR(64) NOT NULL COMMENT '业务组名称',
  group_email VARCHAR(64) NOT NULL COMMENT '业务组邮箱',
  description VARCHAR(256) COMMENT '业务组描述',
  is_default TINYINT(1) DEFAULT 0 COMMENT '是否为默认组',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  
  UNIQUE KEY uk_group_name_deleted (group_name, deleted),
  UNIQUE KEY uk_group_email_deleted (group_email, deleted),
  INDEX idx_is_default (is_default),
  INDEX idx_status (status),
  INDEX idx_deleted (deleted)
) COMMENT='业务组表';
```

### 3.3 用户业务组关联表

```sql
-- 用户业务组关联表
CREATE TABLE IF NOT EXISTS user_business_groups (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  business_group_id BIGINT NOT NULL COMMENT '业务组ID',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
  assigned_by BIGINT COMMENT '分配人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  
  UNIQUE KEY uk_user_group_deleted (user_id, business_group_id, deleted),
  INDEX idx_user_id (user_id),
  INDEX idx_business_group_id (business_group_id),
  INDEX idx_deleted (deleted),
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (business_group_id) REFERENCES business_groups(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
) COMMENT='用户业务组关联表';
```

### 3.4 联系消息表结构

```sql
-- 联系消息表（简化版 - 移除name、email、phone字段）
CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  user_id BIGINT NOT NULL COMMENT '关联用户ID（必须为已登录用户）',
  business_group_id BIGINT COMMENT '处理业务组ID',
  subject VARCHAR(128) NOT NULL COMMENT '消息主题',
  message TEXT NOT NULL COMMENT '消息内容',
  status ENUM('pending', 'processing', 'replied', 'closed') NOT NULL DEFAULT 'pending' COMMENT '处理状态',
  priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal' COMMENT '优先级',
  ip_address VARCHAR(32) COMMENT '提交者IP地址',
  user_agent TEXT COMMENT '用户代理信息',
  replied_at TIMESTAMP NULL COMMENT '回复时间',
  replied_by BIGINT COMMENT '回复人ID',
  assigned_to BIGINT COMMENT '分配给的业务人员ID',
  created_by BIGINT NOT NULL COMMENT '创建者ID（与user_id相同）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  
  INDEX idx_user_id (user_id),
  INDEX idx_business_group_id (business_group_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted (deleted),
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (business_group_id) REFERENCES business_groups(id),
  FOREIGN KEY (replied_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
) COMMENT='联系消息表（简化版）';
```

### 3.5 设计说明
- **遵循项目规范**: 使用 BIGINT 主键、BINARY(16) GUID、软删除机制
- **字符串长度规范**: 所有 VARCHAR 长度为 8 的倍数
- **角色管理**: 在用户表中增加 role 字段区分用户类型
- **业务组管理**: 支持多业务组，每组有独立邮箱
- **默认组机制**: 新用户自动分配到默认业务组
- **邮件路由**: 根据用户所属业务组路由邮件
- **权限控制**: 业务人员只能查看分配给自己组的消息
- **审计字段**: 记录 IP 地址和用户代理，便于安全审计
- **索引优化**: 为常用查询字段建立索引
- **外键约束**: 确保数据一致性

## 4. 后端API设计

### 4.1 API接口规范

#### 4.1.1 提交联系消息
```
POST /api/contact/messages
```

**请求参数**:
```json
{
  "subject": "产品咨询",
  "message": "我想了解贵公司的汽车配件产品...",
  "priority": "normal"
}
```

**说明**: 
- 用户信息（name、email、phone）通过JWT token自动获取，无需前端传递
- **需要登录**: 此接口需要用户登录，通过JWT验证用户身份
- **自动分配业务组**: 根据用户的business_group_id自动分配到对应业务组
- **默认业务组**: 如果用户未绑定业务组，自动分配到默认业务组

**响应格式**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "guid": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "business_group": {
      "id": 1,
      "name": "默认业务组",
      "email": "default@company.com"
    }
  },
  "message": "CONTACT.MESSAGE_SUBMITTED",
  "timestamp": "2024-03-15T10:30:00Z"
}
```

#### 4.1.2 业务组管理接口

**创建业务组**
```
POST /api/admin/business-groups
```

**请求参数**:
```json
{
  "group_name": "销售组",
  "group_email": "sales@company.com",
  "description": "负责产品销售咨询",
  "is_default": false
}
```

**获取业务组列表**
```
GET /api/admin/business-groups
```

**分配用户到业务组**
```
POST /api/admin/business-groups/{groupId}/users
```

**请求参数**:
```json
{
  "user_ids": [1, 2, 3]
}
```

#### 4.1.3 用户管理接口

**更新用户角色**
```
PATCH /api/admin/users/{userId}/role
```

**请求参数**:
```json
{
  "role": "business_staff"
}
```

**更新用户业务组**
```
PATCH /api/admin/users/{userId}/business-group
```

**请求参数**:
```json
{
  "businessGroupId": 2
}
```

**说明**: 
- 只有管理员可以修改用户的业务组
- 只能修改角色为"user"的普通用户的业务组
- businessGroupId为null时表示取消业务组分配

**响应格式**:
```json
{
  "success": true,
  "message": "USER_BUSINESS_GROUP_UPDATED",
  "data": {
    "userId": 123,
    "businessGroupId": 2
  }
}
```

**获取业务人员列表**
```
GET /api/admin/users/business-staff
```

#### 4.1.4 联系消息管理接口

**管理员获取所有消息**
```
GET /api/admin/contact/messages
```

**业务人员获取分配的消息**
```
GET /api/business/contact/messages
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `pageSize`: 每页数量 (默认: 20)
- `status`: 状态筛选
- `priority`: 优先级筛选
- `business_group_id`: 业务组筛选（管理员可用）
- `keyword`: 关键词搜索

**响应格式**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "张三",
        "email": "zhangsan@example.com",
        "subject": "产品咨询",
        "status": "pending",
        "priority": "normal",
        "business_group": {
          "id": 1,
          "name": "销售组"
        },
        "assigned_to": {
          "id": 5,
          "name": "李业务"
        },
        "created_at": "2024-03-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "message": "CONTACT.MESSAGE_LIST_SUCCESS",
  "timestamp": "2024-03-15T10:30:00Z"
}
```

### 4.2 控制器设计

#### 4.2.1 文件结构
```
backend/controllers/contactController.js
backend/controllers/businessGroupController.js
backend/controllers/userManagementController.js
```

#### 4.2.2 联系消息控制器 (contactController.js)
- `submitMessage()`: 提交联系消息（自动分配业务组）
- `getMessageList()`: 获取消息列表（管理员/业务人员）
- `getMessageDetail()`: 获取消息详情
- `updateMessageStatus()`: 更新消息状态
- `assignMessage()`: 分配消息给业务人员
- `deleteMessage()`: 删除消息（管理员）

#### 4.2.3 业务组控制器 (businessGroupController.js)
- `createGroup()`: 创建业务组
- `getGroupList()`: 获取业务组列表
- `updateGroup()`: 更新业务组信息
- `deleteGroup()`: 删除业务组
- `assignUsersToGroup()`: 分配用户到业务组
- `removeUsersFromGroup()`: 从业务组移除用户
- `setDefaultGroup()`: 设置默认业务组

#### 4.2.4 用户管理控制器 (userManagementController.js)
- `updateUserRole()`: 更新用户角色
- `getBusinessStaffList()`: 获取业务人员列表
- `getUserBusinessGroups()`: 获取用户所属业务组
- `createBusinessStaff()`: 创建业务人员账户

### 4.3 路由配置

#### 4.3.1 文件结构
```
backend/routes/contactRoutes.js
backend/routes/businessRoutes.js
backend/routes/userManagementRoutes.js
```

#### 4.3.2 联系消息路由 (contactRoutes.js)
```javascript
// 公开接口
router.post('/messages', contactController.submitMessage);

// 管理员接口
router.get('/admin/messages', jwt.verifyToken, jwt.requireAdmin, contactController.getMessageList);
router.get('/admin/messages/:id', jwt.verifyToken, jwt.requireAdmin, contactController.getMessageDetail);
router.patch('/admin/messages/:id/status', jwt.verifyToken, jwt.requireAdmin, contactController.updateMessageStatus);
router.patch('/admin/messages/:id/assign', jwt.verifyToken, jwt.requireAdmin, contactController.assignMessage);
router.delete('/admin/messages/:id', jwt.verifyToken, jwt.requireAdmin, contactController.deleteMessage);

// 业务人员接口
router.get('/business/messages', jwt.verifyToken, jwt.requireBusinessStaff, contactController.getMessageList);
router.get('/business/messages/:id', jwt.verifyToken, jwt.requireBusinessStaff, contactController.getMessageDetail);
router.patch('/business/messages/:id/status', jwt.verifyToken, jwt.requireBusinessStaff, contactController.updateMessageStatus);
```

#### 4.3.3 业务组路由 (businessRoutes.js)
```javascript
// 管理员接口
router.post('/admin/business-groups', jwt.verifyToken, jwt.requireAdmin, businessGroupController.createGroup);
router.get('/admin/business-groups', jwt.verifyToken, jwt.requireAdmin, businessGroupController.getGroupList);
router.patch('/admin/business-groups/:id', jwt.verifyToken, jwt.requireAdmin, businessGroupController.updateGroup);
router.delete('/admin/business-groups/:id', jwt.verifyToken, jwt.requireAdmin, businessGroupController.deleteGroup);
router.post('/admin/business-groups/:id/users', jwt.verifyToken, jwt.requireAdmin, businessGroupController.assignUsersToGroup);
router.delete('/admin/business-groups/:id/users', jwt.verifyToken, jwt.requireAdmin, businessGroupController.removeUsersFromGroup);
router.patch('/admin/business-groups/:id/default', jwt.verifyToken, jwt.requireAdmin, businessGroupController.setDefaultGroup);
```

#### 4.3.4 用户管理路由 (userManagementRoutes.js)
```javascript
// 管理员接口
router.patch('/admin/users/:id/role', jwt.verifyToken, jwt.requireAdmin, userManagementController.updateUserRole);
router.get('/admin/users/business-staff', jwt.verifyToken, jwt.requireAdmin, userManagementController.getBusinessStaffList);
router.get('/admin/users/:id/business-groups', jwt.verifyToken, jwt.requireAdmin, userManagementController.getUserBusinessGroups);
router.post('/admin/users/business-staff', jwt.verifyToken, jwt.requireAdmin, userManagementController.createBusinessStaff);
```

## 5. 前端实现设计

### 5.1 组件重构

#### 5.1.1 Contact.vue 优化
- **API集成**: 将模拟提交改为真实API调用
- **错误处理**: 使用 `$messageHandler` 统一处理错误（已删除 ErrorMessage.vue 组件，统一使用 messageHandler.js）
- **表单验证**: 增强客户端验证规则
- **用户体验**: 添加提交状态指示器
- **消息显示**: 所有成功、错误、警告消息均通过 `$messageHandler` 处理，支持国际化

#### 5.1.2 组件结构设计（简化版 - 仅登录用户）
```vue
<template>
  <div class="contact-page">
    <!-- 使用通用页面横幅组件 -->
    <PageBanner :title="$t('contact.title', 'Contact Us')" :breadcrumb="breadcrumbItems" />
    
    <!-- 登录检查 -->
    <div v-if="!isLoggedIn" class="login-required">
      <div class="container">
        <el-alert
          :title="$t('contact.loginRequired')"
          type="warning"
          :description="$t('contact.loginRequiredDesc')"
          show-icon
          :closable="false"
        />
        <div class="login-actions">
          <el-button type="primary" @click="$router.push('/login')">
            {{ $t('auth.login') }}
          </el-button>
          <el-button @click="$router.push('/register')">
            {{ $t('auth.register') }}
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 联系信息展示（仅登录用户可见） -->
    <div v-else class="contact-info-section">
      <div class="container">
        <!-- 显示当前用户信息 -->
        <div class="user-info">
          <el-tag type="info">{{ $t('contact.currentUser') }}: {{ userInfo.name }} ({{ userInfo.email }})</el-tag>
        </div>
        
        <div class="contact-info-grid">
          <div class="info-item">
            <h3>{{ $t('contact.info.address', 'Address') }}</h3>
            <p>{{ companyInfo.address || defaultAddress }}</p>
          </div>
          <div class="info-item">
            <h3>{{ $t('contact.info.phone', 'Phone') }}</h3>
            <p>{{ companyInfo.phone || defaultPhone }}</p>
          </div>
          <div class="info-item">
            <h3>{{ $t('contact.info.email', 'Email') }}</h3>
            <p>{{ companyInfo.email || defaultEmail }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 联系表单（仅登录用户可见，简化版） -->
    <div v-if="isLoggedIn" class="contact-form-section">
      <div class="container">
        <el-form ref="contactForm" :model="contactForm" :rules="contactRules" class="contact-form">
          <!-- 主题 -->
          <div class="form-row">
            <div class="form-col-full">
              <FormInput
                v-model="contactForm.subject"
                :placeholder="$t('contact.form.subject.placeholder', 'Subject')"
                :label="$t('contact.form.subject.label', 'Subject')"
                required
              />
            </div>
          </div>
          
          <!-- 消息内容 -->
          <div class="form-row">
            <div class="form-col-full">
              <el-input
                v-model="contactForm.message"
                type="textarea"
                :rows="6"
                :placeholder="$t('contact.form.message.placeholder', 'Your Message')"
                class="form-textarea"
                maxlength="2000"
                show-word-limit
              />
            </div>
          </div>
          
          <!-- 优先级 -->
          <div class="form-row">
            <div class="form-col">
              <el-form-item :label="$t('contact.priority')" prop="priority">
                <el-select v-model="contactForm.priority" :placeholder="$t('contact.selectPriority')">
                  <el-option :label="$t('contact.priorityLow')" value="low" />
                  <el-option :label="$t('contact.priorityNormal')" value="normal" />
                  <el-option :label="$t('contact.priorityHigh')" value="high" />
                  <el-option :label="$t('contact.priorityUrgent')" value="urgent" />
                </el-select>
              </el-form-item>
            </div>
          </div>
          
          <div class="form-actions">
            <el-button type="primary" @click="submitForm" :loading="submitting" class="submit-btn">
              {{ $t('contact.form.submit', 'Send Message') }}
            </el-button>
            <el-button @click="resetForm" class="reset-btn">
              {{ $t('contact.form.reset', 'Reset') }}
            </el-button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>
```

#### 5.1.3 表单验证规则（简化版）
```javascript
contactRules: {
  subject: [
    { required: true, message: this.$t('validation.subjectRequired'), trigger: 'blur' },
    { min: 2, max: 128, message: this.$t('validation.subjectLength'), trigger: 'blur' }
  ],
  message: [
    { required: true, message: this.$t('validation.messageRequired'), trigger: 'blur' },
    { min: 10, max: 2000, message: this.$t('validation.messageLength'), trigger: 'blur' }
  ],
  priority: [
    { required: true, message: this.$t('validation.priorityRequired'), trigger: 'change' }
  ]
}

// 注意：移除了name、email、phone字段的验证规则
// 用户信息通过JWT token自动获取
```

### 5.2 API调用实现

```javascript
async submitForm() {
  try {
    // 登录状态检查
    if (!this.isLoggedIn) {
      this.$messageHandler.showWarning(
        this.$t('contact.loginRequired'),
        'contact.loginRequired'
      );
      this.$router.push('/login');
      return;
    }
    
    this.submitting = true;
    
    const valid = await this.$refs.contactForm.validate();
    if (!valid) return;
    
    const response = await this.$api.post('contact/messages', this.contactForm);
    
    this.$messageHandler.showSuccess(
      this.$t('contact.success.messageSubmitted'), 
      'contact.success.messageSubmitted'
    );
    
    this.resetForm();
  } catch (error) {
    if (error.status === 401) {
      this.$messageHandler.showWarning(
        this.$t('auth.sessionExpired'),
        'auth.sessionExpired'
      );
      this.$router.push('/login');
    } else {
      this.$messageHandler.showError(error, 'contact.error.submitFailed');
    }
  } finally {
    this.submitting = false;
  }
}

// 计算属性
computed: {
  isLoggedIn() {
    return this.$store.getters['auth/isAuthenticated'];
  },
  userInfo() {
    return this.$store.getters['auth/userInfo'];
  }
}

// 注意：项目已统一使用 messageHandler.js 处理所有消息显示
// ErrorMessage.vue 组件已被删除，所有组件应使用 $messageHandler 全局方法
// 支持的方法：showSuccess, showError, showWarning, showInfo, confirm 等
```

## 6. 邮件服务设计

### 6.1 多语言邮件模板设计

#### 6.1.1 邮件模板生成器
```javascript
// backend/utils/emailTemplates.js
const { getTranslation } = require('./translationService');

// 生成管理员通知邮件
function generateAdminNotificationTemplate(contactData, businessGroup, language = 'en') {
  const translations = {
    subject: getTranslation('email.admin.notification.subject', language, 'New Contact Message'),
    title: getTranslation('email.admin.notification.title', language, 'You have received a new contact message'),
    sender: getTranslation('email.admin.notification.sender', language, 'Sender'),
    email: getTranslation('email.admin.notification.email', language, 'Email'),
    phone: getTranslation('email.admin.notification.phone', language, 'Phone'),
    subject_label: getTranslation('email.admin.notification.subject_label', language, 'Subject'),
    message: getTranslation('email.admin.notification.message', language, 'Message'),
    time: getTranslation('email.admin.notification.time', language, 'Submitted at'),
    group: getTranslation('email.admin.notification.group', language, 'Business Group')
  };
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${translations.subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #e53e3e;">${translations.title}</h2>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>${translations.sender}:</strong> ${contactData.name}</p>
                <p><strong>${translations.email}:</strong> ${contactData.email}</p>
                <p><strong>${translations.phone}:</strong> ${contactData.phone || 'N/A'}</p>
                <p><strong>${translations.subject_label}:</strong> ${contactData.subject}</p>
                <p><strong>${translations.group}:</strong> ${businessGroup.name}</p>
                <p><strong>${translations.message}:</strong></p>
                <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
                    ${contactData.message}
                </div>
                <p><strong>${translations.time}:</strong> ${new Date(contactData.created_at).toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

// 生成用户确认邮件
function generateUserConfirmationTemplate(contactData, companyInfo, language = 'en') {
  const translations = {
    subject: getTranslation('email.user.confirmation.subject', language, 'Thank you for contacting us'),
    title: getTranslation('email.user.confirmation.title', language, 'Thank you for contacting us'),
    greeting: getTranslation('email.user.confirmation.greeting', language, 'Dear'),
    received: getTranslation('email.user.confirmation.received', language, 'We have received your message and our team will respond within 24 hours.'),
    your_message: getTranslation('email.user.confirmation.your_message', language, 'Your message'),
    subject_label: getTranslation('email.user.confirmation.subject_label', language, 'Subject'),
    urgent: getTranslation('email.user.confirmation.urgent', language, 'For urgent matters, please call directly'),
    thanks: getTranslation('email.user.confirmation.thanks', language, 'Thank you!')
  };
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${translations.subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #e53e3e;">${translations.title}</h2>
            <p>${translations.greeting} ${contactData.name},</p>
            <p>${translations.received}</p>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>${translations.your_message}:</strong></p>
                <p><strong>${translations.subject_label}:</strong> ${contactData.subject}</p>
                <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
                    ${contactData.message}
                </div>
            </div>
            <p>${translations.urgent}: ${companyInfo.phone}</p>
            <p>${translations.thanks}</p>
        </div>
    </body>
    </html>
  `;
}

module.exports = {
  generateAdminNotificationTemplate,
  generateUserConfirmationTemplate
};
```

### 6.2 邮件路由服务

#### 6.2.1 服务函数设计
```javascript
// backend/utils/contactEmailService.js
class ContactEmailService {
  // 根据用户业务组发送新消息通知
  async sendNewMessageNotification(messageData) {
    try {
      // 获取用户所属业务组
      const businessGroup = await this.getUserBusinessGroup(messageData.user_id || messageData.email);
      
      // 发送到业务组邮箱
      if (businessGroup && businessGroup.group_email) {
        await this.sendEmailToGroup(businessGroup.group_email, messageData);
      } else {
        // 发送到默认业务组
        const defaultGroup = await this.getDefaultBusinessGroup();
        await this.sendEmailToGroup(defaultGroup.group_email, messageData);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }
  
  // 发送自动回复给用户
  async sendAutoReply(messageData) {
    // 实现自动回复逻辑
  }
  
  // 获取用户业务组
  async getUserBusinessGroup(userIdOrEmail) {
    // 查询用户所属业务组
  }
  
  // 获取默认业务组
  async getDefaultBusinessGroup() {
    // 查询默认业务组
  }
  
  // 发送邮件到业务组
  async sendEmailToGroup(groupEmail, messageData) {
    // 实现邮件发送逻辑
  }
  
  // 用户注册时自动分配到默认业务组
  async assignUserToDefaultGroup(userId) {
    const defaultGroup = await this.getDefaultBusinessGroup();
    if (defaultGroup) {
      await this.assignUserToGroup(userId, defaultGroup.id);
    }
  }
}
```

## 7. 国际化支持

### 7.1 消息键定义

#### 7.1.1 后端消息键 (backend/config/messages.js)
```javascript
CONTACT: {
  MESSAGE_SUBMITTED: 'Message submitted successfully',
  MESSAGE_SUBMIT_FAILED: 'Failed to submit message',
  MESSAGE_LIST_SUCCESS: 'Message list retrieved successfully',
  MESSAGE_LIST_FAILED: 'Failed to retrieve message list',
  MESSAGE_NOT_FOUND: 'Message not found',
  MESSAGE_UPDATE_SUCCESS: 'Message updated successfully',
  MESSAGE_DELETE_SUCCESS: 'Message deleted successfully',
  MESSAGE_ASSIGNED_SUCCESS: 'Message assigned successfully',
  VALIDATION_FAILED: 'Message validation failed',
  EMAIL_SEND_FAILED: 'Failed to send notification email',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number',
  MESSAGE_TOO_SHORT: 'Message is too short',
  MESSAGE_TOO_LONG: 'Message is too long',
  SUBJECT_REQUIRED: 'Subject is required',
  NAME_REQUIRED: 'Name is required',
  EMAIL_REQUIRED: 'Email is required',
  MESSAGE_REQUIRED: 'Message is required',
  RATE_LIMIT_EXCEEDED: 'Too many submissions, please try again later',
  EMAIL_SEND_SUCCESS: 'Notification emails sent successfully'
},
BUSINESS_GROUP: {
  GROUP_CREATED: 'Business group created successfully',
  GROUP_UPDATED: 'Business group updated successfully',
  GROUP_DELETED: 'Business group deleted successfully',
  GROUP_NOT_FOUND: 'Business group not found',
  GROUP_LIST_SUCCESS: 'Business group list retrieved successfully',
  USER_ASSIGNED: 'Users assigned to group successfully',
  USER_REMOVED: 'Users removed from group successfully',
  DEFAULT_GROUP_SET: 'Default group set successfully',
  CANNOT_DELETE_DEFAULT: 'Cannot delete default business group',
  NAME_REQUIRED: 'Business group name is required',
  ADMIN_EMAILS_REQUIRED: 'Admin emails are required',
  INVALID_EMAIL_FORMAT: 'Invalid email format in admin emails',
  DUPLICATE_NAME: 'Business group name already exists'
},
USER_MANAGEMENT: {
  ROLE_UPDATED: 'User role updated successfully',
  ROLE_UPDATE_FAILED: 'Failed to update user role',
  BUSINESS_STAFF_LIST_SUCCESS: 'Business staff list retrieved successfully',
  BUSINESS_STAFF_CREATED: 'Business staff created successfully',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this operation'
},
USER_BUSINESS_GROUP: {
  ASSIGN_SUCCESS: 'User assigned to business group successfully',
  REMOVE_SUCCESS: 'User removed from business group successfully',
  ASSIGNMENT_EXISTS: 'User is already assigned to this business group',
  ASSIGNMENT_NOT_FOUND: 'User business group assignment not found'
}
```

#### 7.1.2 数据库翻译数据
```sql
-- 联系表单相关翻译
INSERT INTO translations (guid, message_key, language_code, translation) VALUES
-- 成功消息
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.success.messageSubmitted', 'en', 'Your message has been submitted successfully! We will contact you within 24 hours.'),
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.success.messageSubmitted', 'zh-CN', '您的留言已成功提交！我们将在24小时内与您联系。'),

-- 错误消息
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.error.submitFailed', 'en', 'Failed to submit message, please try again later.'),
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.error.submitFailed', 'zh-CN', '留言提交失败，请稍后重试。'),

-- 页面标题和导航
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.title', 'en', 'Contact Us'),
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.title', 'zh-CN', '联系我们'),
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.breadcrumb.home', 'en', 'Home'),
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.breadcrumb.home', 'zh-CN', '首页'),

-- 联系信息标签
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.info.address', 'en', 'Address'),
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.info.address', 'zh-CN', '地址'),
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.info.phone', 'en', 'Phone'),
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.info.phone', 'zh-CN', '电话'),
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.info.email', 'en', 'Email'),
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.info.email', 'zh-CN', '邮箱'),

-- 表单字段标签和占位符
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.form.name.label', 'en', 'Name'),
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.form.name.label', 'zh-CN', '姓名'),
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.form.name.placeholder', 'en', 'Your Name'),
(UNHEX(REPLACE(UUID(), '-', '')), 'contact.form.name.placeholder', 'zh-CN', '请输入您的姓名'),

-- 验证消息
(UNHEX(REPLACE(UUID(), '-', '')), 'validation.nameRequired', 'en', 'Name is required'),
(UNHEX(REPLACE(UUID(), '-', '')), 'validation.nameRequired', 'zh-CN', '姓名为必填项'),
(UNHEX(REPLACE(UUID(), '-', '')), 'validation.nameLength', 'en', 'Name must be between 2 and 32 characters'),
(UNHEX(REPLACE(UUID(), '-', '')), 'validation.nameLength', 'zh-CN', '姓名长度必须在2-32个字符之间'),
(UNHEX(REPLACE(UUID(), '-', '')), 'validation.subjectRequired', 'en', 'Subject is required'),
(UNHEX(REPLACE(UUID(), '-', '')), 'validation.subjectRequired', 'zh-CN', '主题为必填项'),
(UNHEX(REPLACE(UUID(), '-', '')), 'validation.subjectLength', 'en', 'Subject cannot exceed 128 characters'),
(UNHEX(REPLACE(UUID(), '-', '')), 'validation.subjectLength', 'zh-CN', '主题不能超过128个字符'),
(UNHEX(REPLACE(UUID(), '-', '')), 'validation.messageMinLength', 'en', 'Message must be at least 10 characters'),
(UNHEX(REPLACE(UUID(), '-', '')), 'validation.messageMinLength', 'zh-CN', '留言内容至少需要10个字符'),

-- 邮件模板翻译
(UNHEX(REPLACE(UUID(), '-', '')), 'email.admin.notification.subject', 'en', 'New Contact Message'),
(UNHEX(REPLACE(UUID(), '-', '')), 'email.admin.notification.subject', 'zh-CN', '新的联系消息'),
(UNHEX(REPLACE(UUID(), '-', '')), 'email.user.confirmation.subject', 'en', 'Thank you for contacting us'),
(UNHEX(REPLACE(UUID(), '-', '')), 'email.user.confirmation.subject', 'zh-CN', '感谢您联系我们');
```

#### 7.1.3 翻译服务工具函数
```javascript
// backend/utils/translationService.js
const db = require('../db/db');

// 从数据库获取翻译
async function getTranslation(key, language = 'en', fallback = '') {
  try {
    const query = `
      SELECT translation 
      FROM translations 
      WHERE message_key = ? AND language_code = ? AND deleted = 0
      LIMIT 1
    `;
    
    const [rows] = await db.execute(query, [key, language]);
    
    if (rows.length > 0) {
      return rows[0].translation;
    }
    
    // 如果没找到指定语言的翻译，尝试获取英文翻译
    if (language !== 'en') {
      const [enRows] = await db.execute(query, [key, 'en']);
      if (enRows.length > 0) {
        return enRows[0].translation;
      }
    }
    
    // 如果都没找到，返回fallback
    return fallback;
  } catch (error) {
    console.error('Translation service error:', error);
    return fallback;
  }
}

// 批量获取翻译
async function getTranslations(keys, language = 'en') {
  try {
    const placeholders = keys.map(() => '?').join(',');
    const query = `
      SELECT message_key, translation 
      FROM translations 
      WHERE message_key IN (${placeholders}) AND language_code = ? AND deleted = 0
    `;
    
    const [rows] = await db.execute(query, [...keys, language]);
    
    const translations = {};
    rows.forEach(row => {
      translations[row.message_key] = row.translation;
    });
    
    return translations;
  } catch (error) {
    console.error('Batch translation service error:', error);
    return {};
  }
}

module.exports = {
  getTranslation,
  getTranslations
};
```

## 8. 安全设计

### 8.1 单元测试设计

#### 8.1.1 后端测试

**控制器测试**
```javascript
// backend/tests/controllers/contactController.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../db/db');
const { MESSAGES } = require('../../config/messages');

describe('Contact Controller', () => {
  beforeEach(async () => {
    // 清理测试数据
    await db.execute('DELETE FROM contact_messages WHERE email LIKE "%test%"');
  });

  describe('POST /api/contact/messages', () => {
    it('应该成功提交联系消息', async () => {
      const contactData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        subject: 'Test Subject',
        message: 'This is a test message with sufficient length.'
      };

      const response = await request(app)
        .post('/api/contact/messages')
        .send(contactData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(MESSAGES.CONTACT.MESSAGE_SUBMITTED);
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        email: 'test@example.com'
        // 缺少必填字段
      };

      const response = await request(app)
        .post('/api/contact/messages')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
```

**业务组管理测试**
```javascript
// backend/tests/controllers/businessGroupController.test.js
const request = require('supertest');
const app = require('../../server');
const { generateAdminToken } = require('../helpers/authHelper');

describe('Business Group Controller', () => {
  let adminToken;

  beforeAll(async () => {
    adminToken = await generateAdminToken();
  });

  describe('POST /api/admin/business-groups', () => {
    it('应该成功创建业务组', async () => {
      const groupData = {
        group_name: 'Test Group',
        group_email: 'test@company.com',
        description: 'Test Description'
      };

      const response = await request(app)
        .post('/api/admin/business-groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.group_name).toBe(groupData.group_name);
    });
  });
});
```

#### 8.1.2 前端测试

**组件测试**
```javascript
// frontend/tests/components/Contact.test.js
import { mount } from '@vue/test-utils';
import Contact from '@/views/Contact.vue';
import { ElForm, ElFormItem, ElInput, ElButton } from 'element-plus';

describe('Contact.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(Contact, {
      global: {
        components: {
          ElForm,
          ElFormItem,
          ElInput,
          ElButton
        },
        mocks: {
          $t: (key) => key,
          $api: {
            post: jest.fn()
          },
          $messageHandler: {
            showSuccess: jest.fn(),
            showError: jest.fn()
          }
        }
      }
    });
  });

  it('应该渲染所有表单字段', () => {
    expect(wrapper.find('input[placeholder*="name"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder*="email"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder*="subject"]').exists()).toBe(true);
    expect(wrapper.find('textarea[placeholder*="message"]').exists()).toBe(true);
  });

  it('应该验证必填字段', async () => {
    const submitButton = wrapper.find('.submit-btn');
    await submitButton.trigger('click');

    // 验证表单验证被触发
    expect(wrapper.vm.$refs.contactForm.validate).toBeDefined();
  });
});
```

### 8.2 输入验证
- **XSS防护**: 对所有用户输入进行HTML转义
- **SQL注入防护**: 使用参数化查询
- **长度限制**: 严格限制各字段长度
- **格式验证**: 邮箱、电话号码格式验证

### 8.3 频率限制
```javascript
// 防止垃圾邮件的频率限制
const rateLimit = require('express-rate-limit');

const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 3, // 最多3次提交
  message: {
    success: false,
    message: 'Too many contact submissions, please try again later.',
    error: { code: 'RATE_LIMIT_EXCEEDED' }
  }
});
```

### 8.4 数据保护
- **IP地址记录**: 记录提交者IP用于安全审计
- **敏感信息处理**: 邮箱和电话号码加密存储（可选）
- **数据保留策略**: 定期清理过期数据

## 9. 实施计划

### 9.1 开发阶段

#### 阶段1: 数据库设计 (2天)
- [ ] 扩展 users 表，增加 role 字段
- [ ] 创建 business_groups 表
- [ ] 创建 user_business_groups 关联表
- [ ] 创建 contact_messages 表
- [ ] 添加相关索引和外键约束
- [ ] 创建默认业务组数据
- [ ] 测试数据库结构

#### 阶段2: 后端API开发 (3天)
- [ ] 创建 contactController.js
- [ ] 创建 businessGroupController.js
- [ ] 创建 userManagementController.js
- [ ] 创建相应的路由文件
- [ ] 实现业务组管理接口
- [ ] 实现用户角色管理接口
- [ ] 实现联系消息接口（支持业务组路由）
- [ ] 添加权限验证中间件
- [ ] 添加输入验证和错误处理

#### 阶段3: 邮件路由服务开发 (2天)
- [ ] 创建邮件模板
- [ ] 实现邮件路由服务
- [ ] 实现用户注册时自动分配业务组
- [ ] 实现联系消息的业务组邮件通知
- [ ] 配置邮件通知
- [ ] 测试邮件功能

#### 阶段4: 前端管理界面开发 (3天)
- [ ] 创建业务组管理组件
- [ ] 创建业务人员管理组件
- [ ] 创建联系消息管理组件（支持角色权限）
- [ ] 修改 Contact.vue 组件
- [ ] 集成真实API调用
- [ ] 实现权限控制
- [ ] 优化用户体验
- [ ] 添加国际化支持

#### 阶段5: 权限和安全 (1天)
- [ ] 实现角色权限验证
- [ ] 添加业务人员权限限制
- [ ] 测试权限控制
- [ ] 安全测试

#### 阶段6: 测试和优化 (2天)
- [ ] 功能测试
- [ ] 权限测试
- [ ] 邮件路由测试
- [ ] 性能测试
- [ ] 用户体验测试
- [ ] 集成测试

### 9.2 部署计划

#### 9.2.1 环境配置
```bash
# 环境变量配置
CONTACT_AUTO_REPLY_ENABLED=true
CONTACT_RATE_LIMIT_ENABLED=true
DEFAULT_BUSINESS_GROUP_NAME=默认业务组
DEFAULT_BUSINESS_GROUP_EMAIL=default@company.com
AUTO_ASSIGN_NEW_USERS=true
```

#### 9.2.2 数据库迁移
```bash
# 执行数据库迁移
mysql -u username -p database_name < db/patch/users_role_extension.sql
mysql -u username -p database_name < db/patch/business_groups_table.sql
mysql -u username -p database_name < db/patch/user_business_groups_table.sql
mysql -u username -p database_name < db/patch/contact_messages_table.sql
mysql -u username -p database_name < db/patch/contact_translations.sql
mysql -u username -p database_name < db/patch/default_business_group_data.sql
```

#### 9.2.3 部署步骤

**测试环境部署**
- 数据库结构更新
- 后端服务部署
- 前端资源更新
- 邮件服务配置
- 功能验证测试

**生产环境部署**
- 数据库备份
- 滚动更新部署
- 监控系统检查
- 性能指标验证
- 回滚方案准备

## 10. 监控和维护

### 10.1 日志记录
- 记录所有联系消息提交
- 记录邮件发送状态
- 记录API调用和错误

### 10.2 性能监控
- 监控API响应时间
- 监控数据库查询性能
- 监控邮件发送成功率

### 10.3 数据分析
- 统计联系消息数量趋势
- 分析常见问题类型
- 监控回复时效

## 11. 风险评估

### 11.1 技术风险
- **邮件服务故障**: 配置备用邮件服务
- **数据库性能**: 优化查询和索引
- **API限流**: 合理设置频率限制

### 11.2 业务风险
- **垃圾邮件**: 实施验证码和频率限制
- **数据泄露**: 加强数据加密和访问控制
- **服务中断**: 建立监控和告警机制

## 12. 总结

本技术文档详细规划了 Contact Us 功能的重构方案，涵盖了从数据库设计到前端实现的完整技术栈。重构后的系统将具备：

- **完整的业务流程**: 从用户提交到业务组邮件路由的闭环
- **智能邮件路由**: 根据用户所属业务组自动路由邮件
- **角色权限管理**: 支持管理员、业务人员、普通用户三种角色
- **业务组管理**: 灵活的业务组创建、分配和管理
- **自动用户分配**: 新用户注册时自动分配到默认业务组
- **权限控制**: 业务人员只能查看分配给自己组的消息和订单
- **良好的用户体验**: 响应式设计和友好的错误提示
- **强大的管理功能**: 后台消息管理、业务组管理和用户管理
- **安全可靠**: 输入验证、频率限制和数据保护
- **国际化支持**: 多语言界面和消息
- **可扩展性**: 模块化设计便于后续功能扩展

通过遵循项目现有的技术规范和最佳实践，确保重构后的功能能够无缝集成到现有系统中，为用户提供优质的联系体验，同时为企业提供高效的客户服务管理体系。