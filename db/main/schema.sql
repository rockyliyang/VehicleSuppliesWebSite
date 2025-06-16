-- 数据库设计

-- 创建数据库
CREATE DATABASE IF NOT EXISTS vehicle_supplies_db DEFAULT CHARSET utf8 COLLATE utf8_general_ci;
GRANT ALL PRIVILEGES ON vehicle_supplies_db.* TO 'VehicleWebUser'@'localhost';

USE vehicle_supplies_db;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  activation_token VARCHAR(64) DEFAULT NULL,
  reset_token VARCHAR(64) DEFAULT NULL,
  reset_token_expire DATETIME DEFAULT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  user_role ENUM('admin', 'user', 'business') NOT NULL DEFAULT 'user',
  business_group_id BIGINT DEFAULT NULL COMMENT '普通用户关联的业务组ID（用于联系表单分配）',
  language VARCHAR(10) DEFAULT NULL COMMENT 'User preferred language for emails, NULL means English',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  active_unique_username VARCHAR(255) AS (
    CASE 
      WHEN deleted = 0 THEN username
      ELSE NULL 
    END
  ) VIRTUAL,
  active_unique_email VARCHAR(255) AS (
    CASE 
      WHEN deleted = 0 THEN email
      ELSE NULL 
    END
  ) VIRTUAL,
  UNIQUE KEY unique_active_username (active_unique_username),
  UNIQUE KEY unique_active_email (active_unique_email),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  INDEX idx_business_group_id (business_group_id),
  CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 产品分类表
CREATE TABLE IF NOT EXISTS product_categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(32) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('on_shelf', 'off_shelf') NOT NULL DEFAULT 'off_shelf',
  description TEXT,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  active_unique_key VARCHAR(255) AS (
    CASE 
      WHEN deleted = 0 THEN code
      ELSE NULL 
    END
  ) VIRTUAL,
  UNIQUE KEY unique_active_code (active_unique_key),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  CONSTRAINT fk_product_categories_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_product_categories_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 产品表
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  name VARCHAR(255) NOT NULL,
  product_code VARCHAR(64) NOT NULL,
  short_description TEXT,
  full_description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  thumbnail_url varchar(255) DEFAULT NULL,
  stock INT NOT NULL,
  category_id BIGINT NOT NULL,
  product_type ENUM('physical', 'virtual', 'service') NOT NULL DEFAULT 'physical' COMMENT '产品类型：physical-实物商品，virtual-虚拟商品，service-服务',
  status ENUM('on_shelf', 'off_shelf') NOT NULL DEFAULT 'off_shelf',
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  active_unique_key VARCHAR(255) AS (
    CASE 
      WHEN deleted = 0 THEN product_code
      ELSE NULL 
    END
  ) VIRTUAL,
  FOREIGN KEY (category_id) REFERENCES product_categories(id),
  UNIQUE KEY unique_active_product_code (active_unique_key),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  CONSTRAINT fk_products_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_products_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 产品图片表
CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  product_id BIGINT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  session_id VARCHAR(64) DEFAULT NULL COMMENT '临时会话ID，用于未保存产品时图片归属',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  CONSTRAINT fk_product_images_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_product_images_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);
-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_guid BINARY(16) NOT NULL,
  user_id BIGINT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(16) NOT NULL, -- pending, paid, shipped, delivered, cancelled
  payment_method VARCHAR(16) NOT NULL, -- card, alipay, wechat
  payment_id VARCHAR(64),
  shipping_name VARCHAR(32) NOT NULL,
  shipping_phone VARCHAR(16) NOT NULL,
  shipping_email VARCHAR(64) NOT NULL,
  shipping_address VARCHAR(256) NOT NULL,
  shipping_zip_code VARCHAR(16) NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  INDEX idx_user_id (user_id),
  INDEX idx_order_guid (order_guid),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_orders_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 订单项表
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_code VARCHAR(64) NOT NULL DEFAULT '',
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  product_name VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_order_items_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_order_items_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 物流信息表
CREATE TABLE IF NOT EXISTS logistics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  tracking_number VARCHAR(64),
  carrier VARCHAR(32),
  status VARCHAR(16) NOT NULL, -- processing, shipped, delivered
  location VARCHAR(128),
  description VARCHAR(256),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  INDEX idx_order_id (order_id),
  INDEX idx_tracking_number (tracking_number),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_logistics_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_logistics_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 网站配置表
CREATE TABLE IF NOT EXISTS site_settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  setting_group VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  active_unique_key VARCHAR(255) AS (
    CASE 
      WHEN deleted = 0 THEN setting_key
      ELSE NULL 
    END
  ) VIRTUAL,
  UNIQUE KEY unique_active_setting_key (active_unique_key),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  CONSTRAINT fk_site_settings_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_site_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 公司信息表
CREATE TABLE IF NOT EXISTS company_info (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(50),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  description TEXT,
  logo_url VARCHAR(255),
  wechat_qrcode VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  CONSTRAINT fk_company_info_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_company_info_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Banner图片表
CREATE TABLE IF NOT EXISTS banners (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  title VARCHAR(200),
  description TEXT,
  link VARCHAR(255),
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  CONSTRAINT fk_banners_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_banners_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 新闻资讯表
CREATE TABLE IF NOT EXISTS news (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  thumbnail_url VARCHAR(255),
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  CONSTRAINT fk_news_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_news_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);


-- 初始数据
INSERT INTO company_info (guid, company_name, address, phone, email) VALUES (UUID_TO_BIN(UUID()), 'AUTO EASE EXPERT CO., LTD', '123 Auto Street, Vehicle City', '+86 123 4567 8910', 'contact@autoease.com');

-- 插入网站设置
INSERT INTO site_settings (guid, setting_key, setting_value, setting_group) VALUES 
(UUID_TO_BIN(UUID()), 'site_logo', '/static/images/logo.png', 'general'),
(UUID_TO_BIN(UUID()), 'site_title', 'AUTO EASE EXPERT CO., LTD', 'general'),
(UUID_TO_BIN(UUID()), 'copyright_text', '© 2023 AUTO EASE EXPERT CO., LTD. All Rights Reserved', 'general');

-- 创建默认管理员用户 (密码: admin123)
INSERT INTO users (guid, username, password, email, user_role) 
VALUES (UUID_TO_BIN(UUID()), 'admin', '$2b$10$YourHashedPasswordHere', 'admin@autoease.com', 'admin');