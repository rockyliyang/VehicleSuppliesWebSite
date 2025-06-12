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
  -- 添加虚拟列：当未删除时生成唯一标识
  active_unique_key VARCHAR(255) GENERATED ALWAYS AS (
    IF(deleted = 0, CONCAT(name_key, '-', content_type), NULL)
  ) STORED,
  -- 对虚拟列创建唯一索引
  UNIQUE KEY uk_active_name_content_type (active_unique_key),
  INDEX idx_content_type (content_type),
  INDEX idx_sort_order (sort_order),
  INDEX idx_status (status),
  INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用内容导航菜单主表';

-- 创建通用内容表（去除UNIQUE约束）
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
  INDEX idx_nav_id (nav_id),
  INDEX idx_language_code (language_code),
  INDEX idx_status (status),
  INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用内容表';

-- 创建通用内容图片表
CREATE TABLE `common_content_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nav_id` int NOT NULL COMMENT '关联导航菜单ID',
  `content_id` int DEFAULT NULL COMMENT '关联内容ID',
  `image_type` enum('main','content') NOT NULL DEFAULT 'content' COMMENT '图片类型：main-菜单主图，content-内容图片',
  `image_url` varchar(500) NOT NULL COMMENT '图片URL',
  `alt_text` varchar(200) DEFAULT NULL COMMENT '图片替代文本',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序顺序',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态：1-启用，0-禁用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) DEFAULT '0' COMMENT '软删除标记：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_nav_id` (`nav_id`),
  KEY `idx_image_type` (`image_type`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_status` (`status`),
  KEY `idx_deleted` (`deleted`),
  KEY `idx_content_id` (`content_id`),
  CONSTRAINT `common_content_images_ibfk_1` FOREIGN KEY (`nav_id`) REFERENCES `common_content_nav` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_content_images_content_id` FOREIGN KEY (`content_id`) REFERENCES `common_content` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='通用内容图片表'

-- 插入默认导航菜单
--truncate table common_content_nav;
INSERT INTO common_content_nav (name_key, content_type, sort_order) VALUES
('about.company', 'about_us', 1),
('about.culture', 'about_us', 2),
('about.certificate', 'about_us', 3),
('about.honors', 'about_us', 4),
('news.industry', 'news', 1),
('news.company', 'news', 2)
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order);

INSERT INTO common_content_nav (name_key, content_type, sort_order) VALUES
('home.about_us', 'home', 1)
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order);
