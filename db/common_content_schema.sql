-- About Us 页面数据库表结构
-- 基于主从表结构设计，使用现有 language_translations 表进行多语言支持

-- 创建通用内容导航菜单主表
CREATE TABLE IF NOT EXISTS common_content_nav (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name_key VARCHAR(64) NOT NULL COMMENT '导航名称翻译键，对应language_translations表的code字段',
  content_type VARCHAR(32) NOT NULL COMMENT '内容类型：about_us, news等',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序顺序',
  status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记：0-未删除，1-已删除',
  UNIQUE KEY uk_name_content_type (name_key, content_type),
  INDEX idx_content_type (content_type),
  INDEX idx_sort_order (sort_order),
  INDEX idx_status (status),
  INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用内容导航菜单主表';

-- 创建通用内容表
CREATE TABLE IF NOT EXISTS common_content (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nav_id INT NOT NULL COMMENT '关联导航菜单ID',
  language_code VARCHAR(16) NOT NULL COMMENT '语言代码：zh-CN, en等',
  title VARCHAR(200) COMMENT '内容标题',
  content LONGTEXT COMMENT '富文本内容',
  status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：1-发布，0-草稿',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记：0-未删除，1-已删除',
  FOREIGN KEY (nav_id) REFERENCES common_content_nav(id) ON DELETE CASCADE,
  UNIQUE KEY uk_nav_lang (nav_id, language_code),
  INDEX idx_language_code (language_code),
  INDEX idx_status (status),
  INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用内容表';

-- 创建通用内容图片表
CREATE TABLE IF NOT EXISTS common_content_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nav_id INT NOT NULL COMMENT '关联导航菜单ID',
  image_type ENUM('main', 'content') NOT NULL DEFAULT 'content' COMMENT '图片类型：main-菜单主图，content-内容图片',
  image_url VARCHAR(500) NOT NULL COMMENT '图片URL',
  alt_text VARCHAR(200) COMMENT '图片替代文本',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序顺序',
  status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记：0-未删除，1-已删除',
  FOREIGN KEY (nav_id) REFERENCES common_content_nav(id) ON DELETE CASCADE,
  INDEX idx_nav_id (nav_id),
  INDEX idx_image_type (image_type),
  INDEX idx_sort_order (sort_order),
  INDEX idx_status (status),
  INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用内容图片表';

-- 插入默认导航菜单
INSERT INTO common_content_nav (name_key, content_type, sort_order) VALUES
('about.company', 'about_us', 1),
('about.culture', 'about_us', 2),
('about.certificate', 'about_us', 3),
('about.honors', 'about_us', 4),
('news.industry', 'news', 1),
('news.company', 'news', 2)
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order);

-- 插入导航翻译数据到 language_translations 表
INSERT INTO language_translations (guid, code, lang, value) VALUES
(UNHEX(REPLACE(UUID(), '-', '')), 'about.company', 'zh-CN', '公司简介'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about.company', 'en', 'Our Company'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about.culture', 'zh-CN', '企业文化'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about.culture', 'en', 'Culture'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about.certificate', 'zh-CN', '资质证书'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about.certificate', 'en', 'Certificate'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about.honors', 'zh-CN', '荣誉资质'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about.honors', 'en', 'Honors and Qualification'),
(UNHEX(REPLACE(UUID(), '-', '')), 'news.industry', 'zh-CN', '行业新闻'),
(UNHEX(REPLACE(UUID(), '-', '')), 'news.industry', 'en', 'Industry News'),
(UNHEX(REPLACE(UUID(), '-', '')), 'news.company', 'zh-CN', '公司新闻'),
(UNHEX(REPLACE(UUID(), '-', '')), 'news.company', 'en', 'Company News')
ON DUPLICATE KEY UPDATE value = VALUES(value);