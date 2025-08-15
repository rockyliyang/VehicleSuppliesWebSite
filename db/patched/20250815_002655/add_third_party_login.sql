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