---
description: Contact Form 简化修改计划
author: AI Assistant
date: 2024-03-15
version: 1.0
---

# Contact Form 重新设计修改计划

## 1. 修改概述

### 1.1 业务逻辑变更

- **灵活访问**: 联系表单支持登录和未登录用户访问
- **智能填充**: 登录用户自动填充姓名、邮箱、电话信息且不可编辑
- **手动填写**: 未登录用户可手动填写所有信息
- **验证码验证**: 所有用户提交消息前必须通过图形验证码验证（类似Register.vue中的实现）
- **业务组分配**: 登录用户关联到对应业务组，未登录用户使用默认业务组

### 1.2 主要变更点
1. **前端表单恢复**: 恢复name、email、phone字段，支持条件编辑
2. **验证码集成**: 添加图形验证码验证功能（类似Register.vue）
3. **后端API调整**: 支持登录和未登录用户的不同处理逻辑
4. **路由调整**: 移除登录限制，允许所有用户访问
5. **数据库字段**: contact_messages表已包含name、email、phone字段
6. **邮件模板**: 更新邮件模板以包含新的联系人信息字段

## 2. 数据库修改

### 2.1 用户表扩展

**文件**: `db/patch/add_business_group_to_users.sql`

```sql
-- 为用户表添加业务组关联字段
USE vehicle_supplies_db;

-- 添加业务组ID字段
ALTER TABLE users 
ADD COLUMN business_group_id BIGINT DEFAULT NULL COMMENT '关联的业务组ID';

-- 添加索引
ALTER TABLE users 
ADD INDEX idx_business_group_id (business_group_id);

-- 添加外键约束（在business_groups表创建后）
-- ALTER TABLE users 
-- ADD FOREIGN KEY (business_group_id) REFERENCES business_groups(id);
```

### 2.2 联系消息表调整

**文件**: `db/patch/update_contact_messages_schema.sql`

```sql
-- 更新联系消息表结构
USE vehicle_supplies_db;

-- 如果contact_messages表已存在，需要先备份数据
-- CREATE TABLE contact_messages_backup AS SELECT * FROM contact_messages;

-- 删除不需要的字段（如果存在）
ALTER TABLE contact_messages 
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone;

-- 修改user_id为必填字段
ALTER TABLE contact_messages 
MODIFY COLUMN user_id BIGINT NOT NULL COMMENT '关联用户ID（必须为已登录用户）';

-- 删除email相关索引
ALTER TABLE contact_messages 
DROP INDEX IF EXISTS idx_email;
```

## 3. 前端修改

### 3.1 Contact.vue 组件修改

**文件**: `frontend/src/views/Contact.vue`

#### 3.1.1 模板修改
```vue
<!-- 恢复name、email、phone字段，添加图形验证码 -->
<div class="contact-form">
  <el-form ref="contactFormRef" :model="contactForm" :rules="contactRules" label-width="80px"
    @submit.prevent="submitForm">
    
    <!-- 姓名字段 -->
    <el-form-item :label="$t('CONTACT.NAME')" prop="name">
      <FormInput v-model="contactForm.name" :placeholder="$t('CONTACT.NAME_PLACEHOLDER')" 
        :disabled="isLoggedIn" />
    </el-form-item>
    
    <!-- 邮箱字段 -->
    <el-form-item :label="$t('CONTACT.EMAIL')" prop="email">
      <FormInput v-model="contactForm.email" :placeholder="$t('CONTACT.EMAIL_PLACEHOLDER')" 
        :disabled="isLoggedIn" />
    </el-form-item>
    
    <!-- 电话字段 -->
    <el-form-item :label="$t('CONTACT.PHONE')" prop="phone">
      <FormInput v-model="contactForm.phone" :placeholder="$t('CONTACT.PHONE_PLACEHOLDER')" 
        :disabled="isLoggedIn" />
    </el-form-item>
    
    <el-form-item :label="$t('CONTACT.SUBJECT')" prop="subject">
      <FormInput v-model="contactForm.subject" :placeholder="$t('CONTACT.SUBJECT_PLACEHOLDER')" />
    </el-form-item>
    
    <el-form-item :label="$t('CONTACT.MESSAGE')" prop="message">
      <FormInput v-model="contactForm.message" type="textarea" :rows="6"
        :placeholder="$t('CONTACT.MESSAGE_PLACEHOLDER')" />
    </el-form-item>
    
    <!-- 图形验证码字段 -->
    <el-form-item :label="$t('CONTACT.CAPTCHA')" prop="captcha">
      <div class="captcha-container">
        <FormInput v-model="contactForm.captcha" :placeholder="$t('CONTACT.CAPTCHA_PLACEHOLDER')" 
          class="captcha-input" />
        <img :src="captchaUrl" @click="refreshCaptcha" class="captcha-img"
          :alt="$t('CONTACT.CAPTCHA_ALT')" :title="$t('CONTACT.CAPTCHA_REFRESH')" />
      </div>
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" @click="submitForm" :loading="isSubmitting" class="submit-btn">
        {{ isSubmitting ? $t('CONTACT.SUBMITTING') : $t('CONTACT.SUBMIT_MESSAGE') }}
      </el-button>
    </el-form-item>
  </el-form>
</div>
```

#### 3.1.2 数据模型修改
```javascript
data() {
  return {
    // 恢复name、email、phone字段，添加captcha字段
    contactForm: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      captcha: ''
    },
    // 更新验证规则
    contactRules: {
      name: [
        { required: true, message: this.$t('CONTACT.NAME_REQUIRED'), trigger: 'blur' },
        { max: 50, message: this.$t('CONTACT.NAME_TOO_LONG'), trigger: 'blur' }
      ],
      email: [
        { required: true, message: this.$t('CONTACT.EMAIL_REQUIRED'), trigger: 'blur' },
        { type: 'email', message: this.$t('CONTACT.EMAIL_FORMAT'), trigger: 'blur' }
      ],
      phone: [
        { required: true, message: this.$t('CONTACT.PHONE_REQUIRED'), trigger: 'blur' },
        { pattern: /^[+]?[\d\s\-()]+$/, message: this.$t('CONTACT.PHONE_FORMAT'), trigger: 'blur' }
      ],
      subject: [
        { required: true, message: this.$t('CONTACT.SUBJECT_REQUIRED'), trigger: 'blur' },
        { max: 128, message: this.$t('CONTACT.SUBJECT_TOO_LONG'), trigger: 'blur' }
      ],
      message: [
        { required: true, message: this.$t('CONTACT.MESSAGE_REQUIRED'), trigger: 'blur' },
        { min: 10, message: this.$t('CONTACT.MESSAGE_TOO_SHORT'), trigger: 'blur' }
      ],
      captcha: [
        { required: true, message: this.$t('CONTACT.CAPTCHA_REQUIRED'), trigger: 'blur' }
      ]
    },
    captchaUrl: '/api/users/captcha?' + Date.now()
  }
}
```

#### 3.1.3 提交方法修改
```javascript
async submitForm() {
  this.$refs.contactFormRef.validate(async (valid) => {
    if (valid) {
      this.isSubmitting = true;
      try {
        // 提交所有字段包括图形验证码
        const response = await this.$api.post('contact/messages', {
          name: this.contactForm.name,
          email: this.contactForm.email,
          phone: this.contactForm.phone,
          subject: this.contactForm.subject,
          message: this.contactForm.message,
          captcha: this.contactForm.captcha
        });
        
        if (response.success) {
          this.$messageHandler.showSuccess(
            this.$t('CONTACT.SUBMIT_SUCCESS'), 
            'contact.success.messageSubmitted'
          );
          this.resetForm();
          this.refreshCaptcha(); // 刷新验证码
        }
      } catch (error) {
        this.$messageHandler.showError(error, 'contact.error.submitFailed');
        this.refreshCaptcha(); // 验证失败时刷新验证码
      } finally {
        this.isSubmitting = false;
      }
    }
  });
},

// 添加刷新验证码方法
refreshCaptcha() {
  this.captchaUrl = '/api/users/captcha?' + Date.now();
}
```

### 3.2 路由守卫修改

**文件**: `frontend/src/router/index.js`

```javascript
// 移除contact页面的登录限制，允许所有用户访问
{
  path: '/contact',
  name: 'Contact',
  component: () => import('@/views/Contact.vue')
  // 移除 meta: { requiresAuth: true }
}
```

## 4. 后端修改

### 4.1 联系消息控制器修改

**文件**: `backend/controllers/contactController.js`

#### 4.1.1 提交消息接口修改
```javascript
async submitContactMessage(req, res) {
  try {
    const { name, email, phone, subject, message, captcha, priority = 'normal' } = req.body;
    const userId = req.userId; // 可选，从JWT中获取（如果用户已登录）
    
    // 基础验证
    if (!name || !email || !phone || !subject || !message || !captcha) {
      return res.status(400).json({
        success: false,
        message: 'CONTACT.REQUIRED_FIELDS_MISSING',
        data: null
      });
    }
    
    // 验证图形验证码
    if (!req.session.captcha || req.session.captcha.toLowerCase() !== captcha.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'CONTACT.CAPTCHA_INVALID',
        data: null
      });
    }
    
    // 清除已使用的验证码
    delete req.session.captcha;
    
    // 长度验证
    if (subject.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'CONTACT.SUBJECT_TOO_LONG',
        data: null
      });
    }
    
    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'CONTACT.MESSAGE_TOO_SHORT',
        data: null
      });
    }
    
    // 获取用户信息和业务组
    const [userRows] = await pool.query(
      'SELECT id, username, email, phone, business_group_id FROM users WHERE id = ? AND deleted = 0',
      [userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'USER.NOT_FOUND',
        data: null
      });
    }
    
    const user = userRows[0];
    const businessGroupId = user.business_group_id;
    
    // 如果用户没有绑定业务组，分配到默认业务组
    if (!businessGroupId) {
      const [defaultGroupRows] = await pool.query(
        'SELECT id FROM business_groups WHERE is_default = 1 AND deleted = 0 LIMIT 1'
      );
      
      if (defaultGroupRows.length > 0) {
        const defaultGroupId = defaultGroupRows[0].id;
        // 更新用户的业务组
        await pool.query(
          'UPDATE users SET business_group_id = ? WHERE id = ?',
          [defaultGroupId, userId]
        );
        businessGroupId = defaultGroupId;
      }
    }
    
    // 获取客户端信息
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // 插入联系消息
    const guid = uuidToBinary(uuidv4());
    const [insertResult] = await pool.query(
      'INSERT INTO contact_messages (guid, user_id, business_group_id, subject, message, priority, ip_address, user_agent, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [guid, userId, businessGroupId, subject, message, priority, ipAddress, userAgent, userId]
    );
    
    // 发送邮件通知业务组
    if (businessGroupId) {
      await this.sendBusinessGroupNotification(insertResult.insertId, businessGroupId, user);
    }
    
    res.status(201).json({
      success: true,
      message: 'CONTACT.MESSAGE_SUBMITTED',
      data: {
        id: insertResult.insertId,
        status: 'pending',
        business_group_id: businessGroupId
      }
    });
    
  } catch (error) {
    console.error('提交联系消息错误:', error);
    res.status(500).json({
      success: false,
      message: 'CONTACT.SUBMIT_FAILED',
      data: null
    });
  }
}
```

### 4.2 用户注册时自动分配业务组

**文件**: `backend/controllers/userController.js` (注册接口)

```javascript
// 在用户注册成功后，自动分配到默认业务组
const [defaultGroupRows] = await pool.query(
  'SELECT id FROM business_groups WHERE is_default = 1 AND deleted = 0 LIMIT 1'
);

if (defaultGroupRows.length > 0) {
  await pool.query(
    'UPDATE users SET business_group_id = ? WHERE id = ?',
    [defaultGroupRows[0].id, insertResult.insertId]
  );
}
```

## 5. 路由修改

### 5.1 联系消息路由

**文件**: `backend/routes/contactRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const jwt = require('../middleware/jwt');

// 提交联系消息 - 需要登录
router.post('/messages', jwt.verifyToken, contactController.submitContactMessage);

// 管理员查看所有消息
router.get('/admin/messages', jwt.verifyToken, jwt.requireAdmin, contactController.getAdminMessages);

// 业务人员查看分配的消息
router.get('/business/messages', jwt.verifyToken, jwt.requireBusinessOrAdmin, contactController.getBusinessMessages);

module.exports = router;
```

## 6. 翻译文件更新

### 6.1 添加新的翻译键

**文件**: `db/main/insert_message_translations.sql`

```sql
-- 添加新的翻译消息
INSERT INTO language_translations (guid, code, lang, value) VALUES 
(UNHEX(REPLACE(UUID(), '-', '')), 'CONTACT.LOGIN_REQUIRED', 'en', 'Please login to submit a message'),
(UNHEX(REPLACE(UUID(), '-', '')), 'CONTACT.LOGIN_REQUIRED', 'zh', '请登录后再提交消息'),
(UNHEX(REPLACE(UUID(), '-', '')), 'CONTACT.SUBJECT_TOO_LONG', 'en', 'Subject cannot exceed 128 characters'),
(UNHEX(REPLACE(UUID(), '-', '')), 'CONTACT.SUBJECT_TOO_LONG', 'zh', '主题不能超过128个字符'),
(UNHEX(REPLACE(UUID(), '-', '')), 'CONTACT.MESSAGE_TOO_SHORT', 'en', 'Message must be at least 10 characters'),
(UNHEX(REPLACE(UUID(), '-', '')), 'CONTACT.MESSAGE_TOO_SHORT', 'zh', '消息内容至少需要10个字符');
```

## 7. 实施步骤

### 7.1 数据库修改
1. 执行 `db/patch/add_business_group_to_users.sql`
2. 确保business_groups表已创建
3. 执行 `db/patch/update_contact_messages_schema.sql`
4. 添加外键约束
5. 插入默认业务组数据

### 7.2 后端修改
1. 修改 `contactController.js`
2. 更新用户注册逻辑
3. 添加JWT中间件验证
4. 更新路由配置

### 7.3 前端修改
1. 修改 `Contact.vue` 组件
2. 更新表单验证规则
3. 添加登录状态检查
4. 更新路由守卫

### 7.4 测试验证
1. 测试未登录用户访问联系页面
2. 测试已登录用户提交消息
3. 测试业务组邮件通知
4. 测试表单验证
5. 测试错误处理

## 8. 注意事项

1. **向后兼容**: 如果现有数据库中已有contact_messages数据，需要先备份
2. **默认业务组**: 确保系统中至少有一个默认业务组
3. **用户迁移**: 现有用户需要分配到默认业务组
4. **权限控制**: 确保只有已登录用户才能提交消息
5. **错误处理**: 完善各种异常情况的处理
6. **邮件通知**: 确保邮件服务配置正确

## 9. 风险评估

### 9.1 高风险
- 数据库结构变更可能影响现有数据
- JWT依赖可能导致未登录用户无法使用

### 9.2 中风险
- 前端表单变更可能影响用户体验
- 业务组分配逻辑需要仔细测试

### 9.3 低风险
- 翻译文件更新
- 路由配置调整

## 10. 用户管理页面增加业务组显示和修改功能

### 10.1 业务逻辑变更

- 在用户管理页面（UserManagement.vue）中，需要为角色为"普通用户"的用户增加其绑定的业务组信息的显示。
- 管理员应能在用户管理页面修改普通用户绑定的业务组。
- 用户列表中已经显示业务组信息，需要增加修改功能。

### 10.2 前端修改 (frontend/src/views/admin/UserManagement.vue)

#### 10.2.1 已完成的功能
- ✅ **用户列表显示**: 用户列表中已显示普通用户绑定的业务组名称
- ✅ **用户详情显示**: 用户详情对话框中已显示业务组信息
- ✅ **修改业务组UI**: 为普通用户增加了"业务组"操作按钮
- ✅ **业务组修改对话框**: 实现了专门的业务组修改对话框
- ✅ **数据加载**: `loadUsers` 方法已包含业务组信息加载
- ✅ **API调用**: 已实现调用后端 API 修改用户业务组的逻辑

#### 10.2.2 功能特性
```javascript
// 业务组修改对话框功能
showBusinessGroupDialog(user) {
  this.selectedUserForGroup = user;
  this.selectedBusinessGroupId = user.businessGroupId || '';
  this.businessGroupDialogVisible = true;
}

// 更新用户业务组
async updateUserBusinessGroup() {
  // 数据验证、API调用、成功提示、列表刷新
}
```

#### 10.2.3 UI组件
- **操作按钮**: 为角色为"user"的用户显示"业务组"按钮
- **修改对话框**: 显示用户信息和业务组选择器
- **样式优化**: 统一的界面风格和用户体验

### 10.3 后端修改

#### 10.3.1 需要实现的API接口

**文件**: `backend/controllers/userManagementController.js`

```javascript
// 修改用户业务组接口
async updateUserBusinessGroup(req, res) {
  try {
    const { userId } = req.params;
    const { businessGroupId } = req.body;
    const adminUserId = req.userId; // 从JWT获取管理员ID
    
    // 验证管理员权限
    const [adminRows] = await pool.query(
      'SELECT user_role FROM users WHERE id = ? AND deleted = 0',
      [adminUserId]
    );
    
    if (adminRows.length === 0 || adminRows[0].user_role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ACCESS_DENIED',
        data: null
      });
    }
    
    // 验证目标用户存在且为普通用户
    const [userRows] = await pool.query(
      'SELECT id, username, user_role FROM users WHERE id = ? AND deleted = 0',
      [userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'USER_NOT_FOUND',
        data: null
      });
    }
    
    if (userRows[0].user_role !== 'user') {
      return res.status(400).json({
        success: false,
        message: 'ONLY_REGULAR_USERS_CAN_BE_ASSIGNED',
        data: null
      });
    }
    
    // 验证业务组存在（如果提供了businessGroupId）
    if (businessGroupId) {
      const [groupRows] = await pool.query(
        'SELECT id FROM business_groups WHERE id = ? AND deleted = 0',
        [businessGroupId]
      );
      
      if (groupRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'BUSINESS_GROUP_NOT_FOUND',
          data: null
        });
      }
    }
    
    // 更新用户业务组
    await pool.query(
      'UPDATE users SET business_group_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [businessGroupId || null, userId]
    );
    
    res.json({
      success: true,
      message: 'USER_BUSINESS_GROUP_UPDATED',
      data: {
        userId: userId,
        businessGroupId: businessGroupId
      }
    });
    
  } catch (error) {
    console.error('更新用户业务组错误:', error);
    res.status(500).json({
      success: false,
      message: 'UPDATE_FAILED',
      data: null
    });
  }
}
```

#### 10.3.2 路由配置

**文件**: `backend/routes/userManagementRoutes.js`

```javascript
// 添加修改用户业务组的路由
router.patch('/users/:userId/business-group', 
  jwt.verifyToken, 
  jwt.requireAdmin, 
  userManagementController.updateUserBusinessGroup
);
```

#### 10.3.3 用户列表接口增强

确保现有的用户列表接口返回业务组信息：

```javascript
// 在getUserList方法中确保包含业务组信息
const query = `
  SELECT 
    u.id, u.guid, u.username, u.email, u.phone, u.user_role, u.status,
    u.business_group_id, bg.group_name as business_group_name,
    u.created_at, u.updated_at
  FROM users u
  LEFT JOIN business_groups bg ON u.business_group_id = bg.id AND bg.deleted = 0
  WHERE u.deleted = 0
  ORDER BY u.created_at DESC
`;
```

### 10.4 数据库修改

#### 10.4.1 用户表扩展（已在前面定义）
```sql
-- users表已包含business_group_id字段
ALTER TABLE users ADD COLUMN business_group_id BIGINT DEFAULT NULL COMMENT '关联的业务组ID';
ALTER TABLE users ADD INDEX idx_business_group_id (business_group_id);
ALTER TABLE users ADD FOREIGN KEY (business_group_id) REFERENCES business_groups(id);
```

### 10.5 实施步骤

1. ✅ **前端UI实现**: UserManagement.vue已完成业务组显示和修改功能
2. ⏳ **后端API实现**: 实现 `updateUserBusinessGroup` 接口
3. ⏳ **路由配置**: 添加业务组修改路由
4. ⏳ **权限验证**: 确保只有管理员可以修改
5. ⏳ **测试验证**: 测试修改功能和权限控制

### 10.6 注意事项

- **权限控制**: 严格限制只有管理员才能修改用户业务组
- **数据一致性**: 确保业务组ID的有效性验证
- **用户体验**: 提供清晰的成功/失败反馈
- **日志记录**: 记录业务组修改操作用于审计
- **错误处理**: 完善各种异常情况的处理

### 10.7 风险评估

#### 10.7.1 低风险
- 前端UI修改已完成且经过测试
- 业务组修改是独立功能，不影响现有流程

#### 10.7.2 中风险
- 后端API需要严格的权限验证
- 数据库外键约束需要正确配置

#### 10.7.3 测试要点
- 管理员权限验证
- 普通用户无法访问修改接口
- 业务组ID有效性验证
- 前端UI交互流畅性

---

> 📝 **重要提醒**: 在生产环境实施前，请务必在测试环境完整验证所有功能，并备份现有数据。