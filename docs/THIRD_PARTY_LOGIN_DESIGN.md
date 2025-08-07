# 第三方登录集成技术方案

## 1. 项目概述

### 1.1 需求背景
为了提升用户体验和降低注册门槛，需要在现有登录系统基础上集成第三方登录功能，支持以下平台：
- Apple Sign In
- Google OAuth 2.0
- Facebook Login

### 1.2 技术目标
- 保持现有登录系统的完整性
- 实现第三方账号与本地账号的关联
- 确保数据安全和用户隐私
- 提供良好的用户体验

## 2. 数据库设计

### 2.1 用户表扩展
在现有 `users` 表基础上添加第三方登录相关字段：

```sql
-- 为 users 表添加第三方登录字段
ALTER TABLE users 
ADD COLUMN apple_id VARCHAR(256) DEFAULT NULL,
ADD COLUMN google_id VARCHAR(256) DEFAULT NULL, 
ADD COLUMN facebook_id VARCHAR(256) DEFAULT NULL,
ADD COLUMN avatar_url VARCHAR(512) DEFAULT NULL,
ADD COLUMN third_party_email VARCHAR(64) DEFAULT NULL,
ADD COLUMN login_source VARCHAR(16) DEFAULT 'local' CHECK (login_source IN ('local', 'apple', 'google', 'facebook', 'mixed')),
ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE;

-- 添加字段注释
COMMENT ON COLUMN users.apple_id IS 'Apple用户唯一标识';
COMMENT ON COLUMN users.google_id IS 'Google用户唯一标识';
COMMENT ON COLUMN users.facebook_id IS 'Facebook用户唯一标识';
COMMENT ON COLUMN users.avatar_url IS '用户头像URL';
COMMENT ON COLUMN users.third_party_email IS '第三方平台邮箱（可能与主邮箱不同）';
COMMENT ON COLUMN users.login_source IS '主要登录方式';
COMMENT ON COLUMN users.is_email_verified IS '邮箱是否已验证（第三方登录默认已验证）';

-- 添加唯一索引确保第三方ID不重复（只对未删除记录生效）
CREATE UNIQUE INDEX uk_users_apple_id ON users (apple_id) WHERE deleted = FALSE AND apple_id IS NOT NULL;
CREATE UNIQUE INDEX uk_users_google_id ON users (google_id) WHERE deleted = FALSE AND google_id IS NOT NULL;
CREATE UNIQUE INDEX uk_users_facebook_id ON users (facebook_id) WHERE deleted = FALSE AND facebook_id IS NOT NULL;
```

### 2.2 第三方登录记录表
创建专门的表记录第三方登录历史和token信息：

```sql
-- 第三方登录记录表
CREATE TABLE IF NOT EXISTS third_party_logins (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  provider VARCHAR(16) NOT NULL CHECK (provider IN ('apple', 'google', 'facebook')),
  provider_user_id VARCHAR(256) NOT NULL,
  provider_email VARCHAR(64) DEFAULT NULL,
  provider_name VARCHAR(64) DEFAULT NULL,
  access_token TEXT DEFAULT NULL,
  refresh_token TEXT DEFAULT NULL,
  token_expires_at TIMESTAMPTZ DEFAULT NULL,
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL,
  
  CONSTRAINT fk_third_party_logins_user_id FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_third_party_logins_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_third_party_logins_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX idx_third_party_logins_guid ON third_party_logins (guid);
CREATE INDEX idx_third_party_logins_user_provider ON third_party_logins (user_id, provider);
CREATE INDEX idx_third_party_logins_deleted ON third_party_logins (deleted);
CREATE INDEX idx_third_party_logins_created_by ON third_party_logins (created_by);
CREATE INDEX idx_third_party_logins_updated_by ON third_party_logins (updated_by);

-- 创建唯一约束（只对未删除记录生效）
CREATE UNIQUE INDEX uk_third_party_logins_provider_user 
ON third_party_logins (provider, provider_user_id) 
WHERE deleted = FALSE;

-- 创建更新时间触发器
CREATE TRIGGER update_third_party_logins_updated_at 
    BEFORE UPDATE ON third_party_logins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 表和字段注释
COMMENT ON TABLE third_party_logins IS '第三方登录记录表';
COMMENT ON COLUMN third_party_logins.provider_user_id IS '第三方平台用户ID';
COMMENT ON COLUMN third_party_logins.access_token IS '访问令牌（加密存储）';
COMMENT ON COLUMN third_party_logins.refresh_token IS '刷新令牌（加密存储）';
```

## 3. 后端API设计

### 3.1 第三方登录控制器
创建新的控制器 `thirdPartyAuthController.js`：

```javascript
// backend/controllers/thirdPartyAuthController.js
class ThirdPartyAuthController {
  
  /**
   * Apple登录回调处理
   * POST /api/auth/apple/callback
   */
  async appleCallback(req, res) {
    // 处理Apple Sign In回调
  }
  
  /**
   * Google登录回调处理  
   * POST /api/auth/google/callback
   */
  async googleCallback(req, res) {
    // 处理Google OAuth回调
  }
  
  /**
   * Facebook登录回调处理
   * POST /api/auth/facebook/callback
   */
  async facebookCallback(req, res) {
    // 处理Facebook Login回调
  }
  
  /**
   * 绑定第三方账号
   * POST /api/auth/bind-third-party
   */
  async bindThirdPartyAccount(req, res) {
    // 为已登录用户绑定第三方账号
  }
  
  /**
   * 解绑第三方账号
   * DELETE /api/auth/unbind-third-party
   */
  async unbindThirdPartyAccount(req, res) {
    // 解绑第三方账号
  }
}
```

### 3.2 路由设计
创建第三方认证路由 `thirdPartyAuthRoutes.js`：

```javascript
// backend/routes/thirdPartyAuthRoutes.js
const express = require('express');
const router = express.Router();
const ThirdPartyAuthController = require('../controllers/thirdPartyAuthController');
const { verifyToken } = require('../middleware/jwt');

const controller = new ThirdPartyAuthController();

// 第三方登录回调
router.post('/apple/callback', controller.appleCallback);
router.post('/google/callback', controller.googleCallback);
router.post('/facebook/callback', controller.facebookCallback);

// 账号绑定/解绑（需要登录）
router.post('/bind-third-party', verifyToken, controller.bindThirdPartyAccount);
router.delete('/unbind-third-party', verifyToken, controller.unbindThirdPartyAccount);

module.exports = router;
```

### 3.3 核心业务逻辑

#### 3.3.1 第三方登录流程
1. **用户授权**：前端调用第三方SDK获取授权码
2. **后端验证**：后端验证授权码并获取用户信息
3. **账号匹配**：
   - 如果第三方ID已存在，直接登录
   - 如果邮箱匹配现有用户，提示绑定
   - 如果都不匹配，创建新用户
4. **生成JWT**：返回登录token

#### 3.3.2 安全考虑
- 所有第三方token加密存储
- 实施CSRF保护
- 验证第三方回调的合法性
- 限制登录频率

## 4. 前端实现设计

### 4.1 登录页面改造
修改 `Login.vue` 组件，在现有社交登录区域添加具体按钮：

```vue
<!-- 替换现有的社交登录图标 -->
<div class="social-login">
  <button 
    @click="loginWithApple" 
    :disabled="socialLoading.apple"
    class="social-button apple-button"
  >
    <AppleIcon class="social-icon" />
    <span>{{ $t('login.continueWithApple') || 'Continue With Apple' }}</span>
  </button>
  
  <button 
    @click="loginWithGoogle" 
    :disabled="socialLoading.google"
    class="social-button google-button"
  >
    <GoogleIcon class="social-icon" />
    <span>{{ $t('login.continueWithGoogle') || 'Continue With Google' }}</span>
  </button>
  
  <button 
    @click="loginWithFacebook" 
    :disabled="socialLoading.facebook"
    class="social-button facebook-button"
  >
    <FacebookIcon class="social-icon" />
    <span>{{ $t('login.continueWithFacebook') || 'Continue With Facebook' }}</span>
  </button>
</div>
```

### 4.2 第三方SDK集成

#### 4.2.1 Apple Sign In
```javascript
// 在index.html中引入Apple JS SDK
<script type="text/javascript" src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"></script>

// 在Login.vue中实现
methods: {
  async loginWithApple() {
    try {
      this.socialLoading.apple = true;
      
      const response = await AppleID.auth.signIn();
      
      // 发送到后端验证
      const result = await this.$api.post('/auth/apple/callback', {
        authorizationCode: response.authorization.code,
        identityToken: response.authorization.id_token,
        user: response.user
      });
      
      this.handleLoginSuccess(result.data);
    } catch (error) {
      this.handleLoginError(error);
    } finally {
      this.socialLoading.apple = false;
    }
  }
}
```

#### 4.2.2 Google OAuth
```javascript
// 安装Google OAuth库
// npm install @google-cloud/oauth2

// 在Login.vue中实现
import { GoogleAuth } from 'google-auth-library';

methods: {
  async loginWithGoogle() {
    try {
      this.socialLoading.google = true;
      
      // 使用Google OAuth弹窗
      const auth2 = gapi.auth2.getAuthInstance();
      const googleUser = await auth2.signIn();
      
      const authResponse = googleUser.getAuthResponse();
      
      // 发送到后端验证
      const result = await this.$api.post('/auth/google/callback', {
        accessToken: authResponse.access_token,
        idToken: authResponse.id_token
      });
      
      this.handleLoginSuccess(result.data);
    } catch (error) {
      this.handleLoginError(error);
    } finally {
      this.socialLoading.google = false;
    }
  }
}
```

#### 4.2.3 Facebook Login
```javascript
// 在index.html中引入Facebook SDK
<script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js"></script>

// 在Login.vue中实现
methods: {
  async loginWithFacebook() {
    try {
      this.socialLoading.facebook = true;
      
      const response = await new Promise((resolve, reject) => {
        FB.login((response) => {
          if (response.authResponse) {
            resolve(response);
          } else {
            reject(new Error('Facebook login cancelled'));
          }
        }, { scope: 'email,public_profile' });
      });
      
      // 发送到后端验证
      const result = await this.$api.post('/auth/facebook/callback', {
        accessToken: response.authResponse.accessToken,
        userID: response.authResponse.userID
      });
      
      this.handleLoginSuccess(result.data);
    } catch (error) {
      this.handleLoginError(error);
    } finally {
      this.socialLoading.facebook = false;
    }
  }
}
```

### 4.3 样式设计
```scss
// 第三方登录按钮样式
.social-login {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.social-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  height: 48px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.apple-button {
  color: #000;
  
  &:hover {
    background-color: #f8f8f8;
  }
}

.google-button {
  color: #757575;
  
  &:hover {
    background-color: #f8f8f8;
  }
}

.facebook-button {
  color: #1877f2;
  
  &:hover {
    background-color: #f0f2f5;
  }
}

.social-icon {
  width: 20px;
  height: 20px;
}
```

## 5. 国际化支持

### 5.1 多语言文本
在 `insert_message_translations.sql` 中添加第三方登录相关翻译：

```sql
-- 第三方登录相关翻译
INSERT INTO translations (id, translation_key, language, translation_value) VALUES
-- Apple登录
(gen_random_uuid(), 'login.continueWithApple', 'en', 'Continue With Apple'),
(gen_random_uuid(), 'login.continueWithApple', 'zh-CN', '使用Apple账号继续'),

-- Google登录
(gen_random_uuid(), 'login.continueWithGoogle', 'en', 'Continue With Google'),
(gen_random_uuid(), 'login.continueWithGoogle', 'zh-CN', '使用Google账号继续'),

-- Facebook登录
(gen_random_uuid(), 'login.continueWithFacebook', 'en', 'Continue With Facebook'),
(gen_random_uuid(), 'login.continueWithFacebook', 'zh-CN', '使用Facebook账号继续'),

-- 错误消息
(gen_random_uuid(), 'login.error.thirdPartyFailed', 'en', 'Third-party login failed'),
(gen_random_uuid(), 'login.error.thirdPartyFailed', 'zh-CN', '第三方登录失败'),

(gen_random_uuid(), 'login.error.accountBinding', 'en', 'Account binding required'),
(gen_random_uuid(), 'login.error.accountBinding', 'zh-CN', '需要绑定账号'),

-- 成功消息
(gen_random_uuid(), 'login.success.thirdPartyLogin', 'en', 'Login successful'),
(gen_random_uuid(), 'login.success.thirdPartyLogin', 'zh-CN', '登录成功');
```

## 6. 安全策略

### 6.1 数据保护
- 第三方token使用AES加密存储
- 敏感信息不记录到日志
- 定期清理过期token

### 6.2 防护措施
- 实施CSRF保护
- 验证第三方回调来源
- 限制登录尝试频率
- 监控异常登录行为

### 6.3 隐私合规
- 明确告知用户数据使用范围
- 提供数据删除选项
- 遵循GDPR等隐私法规

## 7. 部署配置

### 7.1 环境变量
```bash
# Apple Sign In
APPLE_CLIENT_ID=your_apple_client_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY_PATH=/path/to/apple/private/key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook Login
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# 加密密钥
THIRD_PARTY_ENCRYPTION_KEY=your_encryption_key
```

### 7.2 依赖包安装
```bash
# 后端依赖
npm install apple-signin-auth google-auth-library passport-facebook

# 前端依赖
npm install @google-cloud/oauth2
```

## 8. 测试策略

### 8.1 单元测试
- 第三方登录控制器测试
- 数据库操作测试
- 加密解密功能测试

### 8.2 数据库迁移脚本

**文件位置**: `db/main/postgresql/add_third_party_login.sql`

```sql
-- 第三方登录功能数据库迁移脚本
-- 执行时间: 2024-01-XX
-- 版本: v1.0.0

BEGIN;

-- 1. 扩展用户表
ALTER TABLE users 
ADD COLUMN apple_id VARCHAR(256) DEFAULT NULL,
ADD COLUMN google_id VARCHAR(256) DEFAULT NULL, 
ADD COLUMN facebook_id VARCHAR(256) DEFAULT NULL,
ADD COLUMN avatar_url VARCHAR(512) DEFAULT NULL,
ADD COLUMN third_party_email VARCHAR(64) DEFAULT NULL,
ADD COLUMN login_source VARCHAR(16) DEFAULT 'local' CHECK (login_source IN ('local', 'apple', 'google', 'facebook', 'mixed')),
ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE;

-- 添加字段注释
COMMENT ON COLUMN users.apple_id IS 'Apple用户唯一标识';
COMMENT ON COLUMN users.google_id IS 'Google用户唯一标识';
COMMENT ON COLUMN users.facebook_id IS 'Facebook用户唯一标识';
COMMENT ON COLUMN users.avatar_url IS '用户头像URL';
COMMENT ON COLUMN users.third_party_email IS '第三方平台邮箱';
COMMENT ON COLUMN users.login_source IS '主要登录方式';
COMMENT ON COLUMN users.is_email_verified IS '邮箱是否已验证';

-- 2. 添加唯一索引（只对未删除记录生效）
CREATE UNIQUE INDEX uk_users_apple_id ON users (apple_id) WHERE deleted = FALSE AND apple_id IS NOT NULL;
CREATE UNIQUE INDEX uk_users_google_id ON users (google_id) WHERE deleted = FALSE AND google_id IS NOT NULL;
CREATE UNIQUE INDEX uk_users_facebook_id ON users (facebook_id) WHERE deleted = FALSE AND facebook_id IS NOT NULL;

-- 3. 创建第三方登录记录表
CREATE TABLE IF NOT EXISTS third_party_logins (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  provider VARCHAR(16) NOT NULL CHECK (provider IN ('apple', 'google', 'facebook')),
  provider_user_id VARCHAR(256) NOT NULL,
  provider_email VARCHAR(64) DEFAULT NULL,
  provider_name VARCHAR(64) DEFAULT NULL,
  access_token TEXT DEFAULT NULL,
  refresh_token TEXT DEFAULT NULL,
  token_expires_at TIMESTAMPTZ DEFAULT NULL,
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL,
  
  CONSTRAINT fk_third_party_logins_user_id FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_third_party_logins_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_third_party_logins_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX idx_third_party_logins_guid ON third_party_logins (guid);
CREATE INDEX idx_third_party_logins_user_provider ON third_party_logins (user_id, provider);
CREATE INDEX idx_third_party_logins_deleted ON third_party_logins (deleted);
CREATE INDEX idx_third_party_logins_created_by ON third_party_logins (created_by);
CREATE INDEX idx_third_party_logins_updated_by ON third_party_logins (updated_by);

-- 创建唯一约束（只对未删除记录生效）
CREATE UNIQUE INDEX uk_third_party_logins_provider_user 
ON third_party_logins (provider, provider_user_id) 
WHERE deleted = FALSE;

-- 创建更新时间触发器
CREATE TRIGGER update_third_party_logins_updated_at 
    BEFORE UPDATE ON third_party_logins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 表和字段注释
COMMENT ON TABLE third_party_logins IS '第三方登录记录表';
COMMENT ON COLUMN third_party_logins.provider_user_id IS '第三方平台用户ID';
COMMENT ON COLUMN third_party_logins.access_token IS '访问令牌（加密存储）';
COMMENT ON COLUMN third_party_logins.refresh_token IS '刷新令牌（加密存储）';

COMMIT;
```

### 8.3 回滚脚本

**文件位置**: `db/main/postgresql/rollback_third_party_login.sql`

```sql
-- 第三方登录功能回滚脚本
BEGIN;

-- 1. 删除第三方登录记录表
DROP TABLE IF EXISTS third_party_logins;

-- 2. 删除用户表的第三方登录字段
ALTER TABLE users 
DROP COLUMN IF EXISTS apple_id,
DROP COLUMN IF EXISTS google_id,
DROP COLUMN IF EXISTS facebook_id,
DROP COLUMN IF EXISTS avatar_url,
DROP COLUMN IF EXISTS third_party_email,
DROP COLUMN IF EXISTS login_source,
DROP COLUMN IF EXISTS is_email_verified;

COMMIT;
```

### 8.4 集成测试
- 完整登录流程测试
- 账号绑定/解绑测试
- 错误处理测试

### 8.5 用户体验测试
- 多设备兼容性测试
- 网络异常处理测试
- 界面响应性测试

## 9. 实施计划

### 9.1 第一阶段（数据库和后端）
1. 数据库表结构修改
2. 后端API开发
3. 安全机制实现
4. 单元测试编写

### 9.2 第二阶段（前端集成）
1. 前端UI改造
2. 第三方SDK集成
3. 错误处理完善
4. 国际化支持

### 9.3 第三阶段（测试和部署）
1. 集成测试
2. 用户体验测试
3. 安全测试
4. 生产环境部署

## 10. 维护和监控

### 10.1 日志监控
- 第三方登录成功/失败率
- 响应时间监控
- 错误日志分析

### 10.2 定期维护
- token有效性检查
- 第三方API变更适配
- 安全漏洞修复

---

> 📝 **注意**: 本方案需要根据实际的第三方平台开发者账号配置进行调整，确保所有配置信息的安全性。