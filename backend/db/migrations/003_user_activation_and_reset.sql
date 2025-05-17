-- 用户表增加邮箱激活和找回密码字段
ALTER TABLE users
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 0 AFTER password,
  ADD COLUMN activation_token VARCHAR(64) DEFAULT NULL AFTER is_active,
  ADD COLUMN reset_token VARCHAR(64) DEFAULT NULL AFTER activation_token,
  ADD COLUMN reset_token_expire DATETIME DEFAULT NULL AFTER reset_token; 