-- 数据库设计

-- 切换到新创建的数据库
-- 注意：在PostgreSQL中，需要使用\c命令或在连接字符串中指定数据库
-- 以下注释仅作为提示，实际执行时需要在psql中使用\c命令
-- \c vehicle_supplies_db

-- 创建扩展（用于UUID生成）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建更新时间戳函数
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_active SMALLINT NOT NULL DEFAULT 0,
  activation_token VARCHAR(64) DEFAULT NULL,
  reset_token VARCHAR(64) DEFAULT NULL,
  reset_token_expire TIMESTAMP DEFAULT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  user_role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (user_role IN ('admin', 'user', 'business')),
  business_group_id BIGINT DEFAULT NULL,
  language VARCHAR(10) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted SMALLINT DEFAULT 0,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN users.business_group_id IS '普通用户关联的业务组ID（用于联系表单分配）';
COMMENT ON COLUMN users.language IS 'User preferred language for emails, NULL means English';
COMMENT ON COLUMN users.created_by IS '创建者用户ID';
COMMENT ON COLUMN users.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（模拟MySQL的虚拟列）
CREATE UNIQUE INDEX unique_active_username ON users (username) WHERE deleted = 0;
CREATE UNIQUE INDEX unique_active_email ON users (email) WHERE deleted = 0;

-- 创建普通索引
CREATE INDEX idx_created_by ON users (created_by);
CREATE INDEX idx_updated_by ON users (updated_by);
CREATE INDEX idx_business_group_id ON users (business_group_id);

-- 添加外键约束
ALTER TABLE users ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE users ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 产品分类表
CREATE TABLE IF NOT EXISTS product_categories (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(32) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(10) NOT NULL DEFAULT 'off_shelf' CHECK (status IN ('on_shelf', 'off_shelf')),
  description TEXT,
  deleted SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN product_categories.created_by IS '创建者用户ID';
COMMENT ON COLUMN product_categories.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（模拟MySQL的虚拟列）
CREATE UNIQUE INDEX unique_active_code ON product_categories (code) WHERE deleted = 0;

-- 创建普通索引
CREATE INDEX idx_product_categories_created_by ON product_categories (created_by);
CREATE INDEX idx_product_categories_updated_by ON product_categories (updated_by);

-- 添加外键约束
ALTER TABLE product_categories ADD CONSTRAINT fk_product_categories_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE product_categories ADD CONSTRAINT fk_product_categories_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_product_categories_modtime
    BEFORE UPDATE ON product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 产品表
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  name VARCHAR(255) NOT NULL,
  product_code VARCHAR(64) NOT NULL,
  short_description TEXT,
  full_description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  thumbnail_url VARCHAR(255) DEFAULT NULL,
  stock INT NOT NULL,
  category_id BIGINT NOT NULL,
  product_type VARCHAR(10) NOT NULL DEFAULT 'physical' CHECK (product_type IN ('physical', 'virtual', 'service')),
  status VARCHAR(10) NOT NULL DEFAULT 'off_shelf' CHECK (status IN ('on_shelf', 'off_shelf')),
  sort_order INT NOT NULL DEFAULT 0,
  deleted SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN products.product_type IS '产品类型：physical-实物商品，virtual-虚拟商品，service-服务';
COMMENT ON COLUMN products.sort_order IS '排序字段，数值越大排序越靠前';
COMMENT ON COLUMN products.created_by IS '创建者用户ID';
COMMENT ON COLUMN products.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（模拟MySQL的虚拟列）
CREATE UNIQUE INDEX unique_active_product_code ON products (product_code) WHERE deleted = 0;

-- 创建普通索引
CREATE INDEX idx_products_created_by ON products (created_by);
CREATE INDEX idx_products_updated_by ON products (updated_by);
CREATE INDEX idx_products_sort_order ON products (sort_order DESC);

-- 添加外键约束
ALTER TABLE products ADD CONSTRAINT fk_products_category_id FOREIGN KEY (category_id) REFERENCES product_categories(id);
ALTER TABLE products ADD CONSTRAINT fk_products_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE products ADD CONSTRAINT fk_products_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_products_modtime
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 产品图片表
CREATE TABLE IF NOT EXISTS product_images (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  product_id BIGINT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  image_type SMALLINT NOT NULL DEFAULT 0,
  sort_order INT DEFAULT 0,
  session_id VARCHAR(64) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted SMALLINT DEFAULT 0,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN product_images.image_type IS '图片类型：0-主图，1-轮播图,2-详情图';
COMMENT ON COLUMN product_images.session_id IS '临时会话ID，用于未保存产品时图片归属';
COMMENT ON COLUMN product_images.created_by IS '创建者用户ID';
COMMENT ON COLUMN product_images.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_product_images_created_by ON product_images (created_by);
CREATE INDEX idx_product_images_updated_by ON product_images (updated_by);

-- 添加外键约束
ALTER TABLE product_images ADD CONSTRAINT fk_product_images_product_id FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE product_images ADD CONSTRAINT fk_product_images_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE product_images ADD CONSTRAINT fk_product_images_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_product_images_modtime
    BEFORE UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_guid UUID DEFAULT gen_random_uuid() NOT NULL,
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted SMALLINT DEFAULT 0,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN orders.created_by IS '创建者用户ID';
COMMENT ON COLUMN orders.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_orders_user_id ON orders (user_id);
CREATE INDEX idx_orders_order_guid ON orders (order_guid);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at);
CREATE INDEX idx_orders_created_by ON orders (created_by);
CREATE INDEX idx_orders_updated_by ON orders (updated_by);

-- 添加外键约束
ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE orders ADD CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE orders ADD CONSTRAINT fk_orders_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_orders_modtime
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 订单项表
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_code VARCHAR(64) NOT NULL DEFAULT '',
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  product_name VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted SMALLINT DEFAULT 0,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN order_items.created_by IS '创建者用户ID';
COMMENT ON COLUMN order_items.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);
CREATE INDEX idx_order_items_created_by ON order_items (created_by);
CREATE INDEX idx_order_items_updated_by ON order_items (updated_by);

-- 添加外键约束
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_order_id FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_product_id FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_order_items_modtime
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 物流信息表
CREATE TABLE IF NOT EXISTS logistics (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  tracking_number VARCHAR(64),
  carrier VARCHAR(32),
  status VARCHAR(16) NOT NULL, -- processing, shipped, delivered
  location VARCHAR(128),
  description VARCHAR(256),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted SMALLINT DEFAULT 0,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN logistics.created_by IS '创建者用户ID';
COMMENT ON COLUMN logistics.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_logistics_order_id ON logistics (order_id);
CREATE INDEX idx_logistics_tracking_number ON logistics (tracking_number);
CREATE INDEX idx_logistics_status ON logistics (status);
CREATE INDEX idx_logistics_created_at ON logistics (created_at);
CREATE INDEX idx_logistics_created_by ON logistics (created_by);
CREATE INDEX idx_logistics_updated_by ON logistics (updated_by);

-- 添加外键约束
ALTER TABLE logistics ADD CONSTRAINT fk_logistics_order_id FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE logistics ADD CONSTRAINT fk_logistics_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE logistics ADD CONSTRAINT fk_logistics_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_logistics_modtime
    BEFORE UPDATE ON logistics
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 网站配置表
CREATE TABLE IF NOT EXISTS site_settings (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  setting_group VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted SMALLINT DEFAULT 0,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN site_settings.created_by IS '创建者用户ID';
COMMENT ON COLUMN site_settings.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（模拟MySQL的虚拟列）
CREATE UNIQUE INDEX unique_active_setting_key ON site_settings (setting_key) WHERE deleted = 0;

-- 创建普通索引
CREATE INDEX idx_site_settings_created_by ON site_settings (created_by);
CREATE INDEX idx_site_settings_updated_by ON site_settings (updated_by);

-- 添加外键约束
ALTER TABLE site_settings ADD CONSTRAINT fk_site_settings_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE site_settings ADD CONSTRAINT fk_site_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_site_settings_modtime
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 公司信息表
CREATE TABLE IF NOT EXISTS company_info (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(50),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  description TEXT,
  logo_url VARCHAR(255),
  wechat_qrcode VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted SMALLINT DEFAULT 0,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN company_info.created_by IS '创建者用户ID';
COMMENT ON COLUMN company_info.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_company_info_created_by ON company_info (created_by);
CREATE INDEX idx_company_info_updated_by ON company_info (updated_by);

-- 添加外键约束
ALTER TABLE company_info ADD CONSTRAINT fk_company_info_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE company_info ADD CONSTRAINT fk_company_info_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_company_info_modtime
    BEFORE UPDATE ON company_info
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Banner图片表
CREATE TABLE IF NOT EXISTS banners (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  title VARCHAR(200),
  description TEXT,
  link VARCHAR(255),
  sort_order INT DEFAULT 0,
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted SMALLINT DEFAULT 0,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN banners.created_by IS '创建者用户ID';
COMMENT ON COLUMN banners.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_banners_created_by ON banners (created_by);
CREATE INDEX idx_banners_updated_by ON banners (updated_by);

-- 添加外键约束
ALTER TABLE banners ADD CONSTRAINT fk_banners_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE banners ADD CONSTRAINT fk_banners_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_banners_modtime
    BEFORE UPDATE ON banners
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 新闻资讯表
CREATE TABLE IF NOT EXISTS news (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  thumbnail_url VARCHAR(255),
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted SMALLINT DEFAULT 0,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN news.created_by IS '创建者用户ID';
COMMENT ON COLUMN news.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_news_created_by ON news (created_by);
CREATE INDEX idx_news_updated_by ON news (updated_by);

-- 添加外键约束
ALTER TABLE news ADD CONSTRAINT fk_news_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE news ADD CONSTRAINT fk_news_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_news_modtime
    BEFORE UPDATE ON news
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 初始数据
INSERT INTO company_info (guid, company_name, address, phone, email) VALUES (gen_random_uuid(), 'AUTO EASE EXPERT CO., LTD', '123 Auto Street, Vehicle City', '+86 123 4567 8910', 'contact@autoease.com');

-- 插入网站设置
INSERT INTO site_settings (guid, setting_key, setting_value, setting_group) VALUES 
(gen_random_uuid(), 'site_logo', '/static/images/logo.png', 'general'),
(gen_random_uuid(), 'site_title', 'AUTO EASE EXPERT CO., LTD', 'general'),
(gen_random_uuid(), 'copyright_text', '© 2023 AUTO EASE EXPERT CO., LTD. All Rights Reserved', 'general');

-- 创建默认管理员用户 (密码: admin123)
INSERT INTO users (guid, username, password, email, user_role) 
VALUES (gen_random_uuid(), 'admin', '$2b$10$YourHashedPasswordHere', 'admin@autoease.com', 'admin');