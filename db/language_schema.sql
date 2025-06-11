-- 语言翻译表
CREATE TABLE IF NOT EXISTS language_translations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  code VARCHAR(64) NOT NULL COMMENT '翻译键名',
  lang VARCHAR(16) NOT NULL COMMENT '语言代码，如en, zh-CN, ja',
  value TEXT NOT NULL COMMENT '翻译内容',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  active_unique_key VARCHAR(255) AS (
    CASE 
      WHEN deleted = 0 THEN CONCAT(code, '|', lang)
      ELSE NULL 
    END
  ) VIRTUAL,
  UNIQUE KEY unique_active_code_lang (active_unique_key)
);

-- 插入一些默认的翻译数据
INSERT INTO language_translations (guid, code, lang, value) VALUES
(UNHEX(REPLACE(UUID(), '-', '')), 'home', 'en', 'Home'),
(UNHEX(REPLACE(UUID(), '-', '')), 'home', 'zh-CN', '首页'),
(UNHEX(REPLACE(UUID(), '-', '')), 'products', 'en', 'Products'),
(UNHEX(REPLACE(UUID(), '-', '')), 'products', 'zh-CN', '产品中心'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about', 'en', 'About Us'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about', 'zh-CN', '关于我们'),
(UNHEX(REPLACE(UUID(), '-', '')), 'news', 'en', 'News'),
(UNHEX(REPLACE(UUID(), '-', '')), 'news', 'zh-CN', '新闻资讯'),
(UNHEX(REPLACE(UUID(), '-', '')), 'contact', 'en', 'Contact Us'),
(UNHEX(REPLACE(UUID(), '-', '')), 'contact', 'zh-CN', '联系我们'),
(UNHEX(REPLACE(UUID(), '-', '')), 'login', 'en', 'Login/Register'),
(UNHEX(REPLACE(UUID(), '-', '')), 'login', 'zh-CN', '注册/登录'),
(UNHEX(REPLACE(UUID(), '-', '')), 'logout', 'en', 'Logout'),
(UNHEX(REPLACE(UUID(), '-', '')), 'logout', 'zh-CN', '退出'),
(UNHEX(REPLACE(UUID(), '-', '')), 'orders', 'en', 'My Orders'),
(UNHEX(REPLACE(UUID(), '-', '')), 'orders', 'zh-CN', '我的订单');