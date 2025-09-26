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
  is_super BOOLEAN NOT NULL DEFAULT FALSE,
  business_group_id BIGINT DEFAULT NULL,
  language VARCHAR(10) DEFAULT NULL,
  apple_id VARCHAR(256) DEFAULT NULL,
  google_id VARCHAR(256) DEFAULT NULL,
  facebook_id VARCHAR(256) DEFAULT NULL,
  avatar_url VARCHAR(512) DEFAULT NULL,
  third_party_email VARCHAR(64) DEFAULT NULL,
  login_source VARCHAR(16) DEFAULT 'local' CHECK (login_source IN ('local', 'apple', 'google', 'facebook', 'mixed')),
  is_email_verified BOOLEAN DEFAULT FALSE,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN users.is_super IS '超级用户标识，可访问所有状态的产品记录';
COMMENT ON COLUMN users.business_group_id IS '普通用户关联的业务组ID（用于联系表单分配）';
COMMENT ON COLUMN users.language IS 'User preferred language for emails, NULL means English';
COMMENT ON COLUMN users.apple_id IS 'Apple用户唯一标识';
COMMENT ON COLUMN users.google_id IS 'Google用户唯一标识';
COMMENT ON COLUMN users.facebook_id IS 'Facebook用户唯一标识';
COMMENT ON COLUMN users.avatar_url IS '用户头像URL';
COMMENT ON COLUMN users.third_party_email IS '第三方平台邮箱';
COMMENT ON COLUMN users.login_source IS '主要登录方式';
COMMENT ON COLUMN users.is_email_verified IS '邮箱是否已验证';
COMMENT ON COLUMN users.currency IS '用户首选货币，默认USD';
COMMENT ON COLUMN users.created_by IS '创建者用户ID';
COMMENT ON COLUMN users.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（模拟MySQL的虚拟列）
CREATE UNIQUE INDEX unique_active_username ON users (username) WHERE deleted = FALSE;
CREATE UNIQUE INDEX unique_active_email ON users (email) WHERE deleted = FALSE;
CREATE UNIQUE INDEX uk_users_apple_id ON users (apple_id) WHERE deleted = FALSE AND apple_id IS NOT NULL;
CREATE UNIQUE INDEX uk_users_google_id ON users (google_id) WHERE deleted = FALSE AND google_id IS NOT NULL;
CREATE UNIQUE INDEX uk_users_facebook_id ON users (facebook_id) WHERE deleted = FALSE AND facebook_id IS NOT NULL;

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
  parent_id BIGINT DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'off_shelf' CHECK (status IN ('on_shelf', 'off_shelf')),
  description TEXT,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN product_categories.parent_id IS '父级分类ID，NULL表示顶级分类';
COMMENT ON COLUMN product_categories.created_by IS '创建者用户ID';
COMMENT ON COLUMN product_categories.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（模拟MySQL的虚拟列）
CREATE UNIQUE INDEX unique_active_code ON product_categories (code) WHERE deleted = FALSE;

-- 创建普通索引
CREATE INDEX idx_product_categories_parent_id ON product_categories (parent_id);
CREATE INDEX idx_product_categories_created_by ON product_categories (created_by);
CREATE INDEX idx_product_categories_updated_by ON product_categories (updated_by);

-- 添加外键约束
ALTER TABLE product_categories ADD CONSTRAINT fk_product_categories_parent_id FOREIGN KEY (parent_id) REFERENCES product_categories(id);
ALTER TABLE product_categories ADD CONSTRAINT fk_product_categories_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE product_categories ADD CONSTRAINT fk_product_categories_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_product_categories_modtime
    BEFORE UPDATE ON product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 供应商表
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(100),
  address TEXT,
  contact_phone1 VARCHAR(32),
  contact_phone2 VARCHAR(32),
  email VARCHAR(128),
  website VARCHAR(256),
  notes TEXT,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE suppliers IS '供应商信息表';
COMMENT ON COLUMN suppliers.name IS '供应商名称';
COMMENT ON COLUMN suppliers.contact_person IS '联系人姓名';
COMMENT ON COLUMN suppliers.address IS '供应商地址';
COMMENT ON COLUMN suppliers.contact_phone1 IS '联系电话1';
COMMENT ON COLUMN suppliers.contact_phone2 IS '联系电话2';
COMMENT ON COLUMN suppliers.email IS '邮箱地址';
COMMENT ON COLUMN suppliers.website IS '网站地址';
COMMENT ON COLUMN suppliers.notes IS '备注信息';
COMMENT ON COLUMN suppliers.created_by IS '创建者用户ID';
COMMENT ON COLUMN suppliers.updated_by IS '最后更新者用户ID';

-- 创建唯一索引
CREATE UNIQUE INDEX unique_active_supplier_name ON suppliers (name) WHERE deleted = FALSE;

-- 创建普通索引
CREATE INDEX idx_suppliers_name ON suppliers (name);
CREATE INDEX idx_suppliers_email ON suppliers (email);
CREATE INDEX idx_suppliers_created_by ON suppliers (created_by);
CREATE INDEX idx_suppliers_updated_by ON suppliers (updated_by);

-- 添加外键约束
ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_suppliers_modtime
    BEFORE UPDATE ON suppliers
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
  outside_video VARCHAR(512) DEFAULT NULL,
  stock INT NOT NULL,
  category_id BIGINT NOT NULL,
  supplier_id BIGINT DEFAULT NULL,
  source_url VARCHAR(2048) DEFAULT NULL,
  product_type VARCHAR(16) NOT NULL DEFAULT 'self_operated' CHECK (product_type IN ('self_operated', 'consignment')),
  status VARCHAR(16) NOT NULL DEFAULT 'off_shelf' CHECK (status IN ('on_shelf', 'off_shelf')),
  sort_order INT NOT NULL DEFAULT 0,
  
  -- 产品物流信息 (product_shipping_info)
  product_length DECIMAL(8, 2) DEFAULT NULL,
  product_width DECIMAL(8, 2) DEFAULT NULL,
  product_height DECIMAL(8, 2) DEFAULT NULL,
  product_weight DECIMAL(8, 3) DEFAULT NULL,
  
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN products.product_type IS '产品类型：self_operated-自营，consignment-代销';
COMMENT ON COLUMN products.outside_video IS '外部视频链接(YouTube、Vimeo等)';
COMMENT ON COLUMN products.sort_order IS '排序字段，数值越大排序越靠前';
COMMENT ON COLUMN products.product_length IS '产品单件长度(cm)';
COMMENT ON COLUMN products.product_width IS '产品单件宽度(cm)';
COMMENT ON COLUMN products.product_height IS '产品单件高度(cm)';
COMMENT ON COLUMN products.product_weight IS '产品单件重量(kg)';
COMMENT ON COLUMN products.supplier_id IS '供应商ID';
COMMENT ON COLUMN products.source_url IS '产品来源链接';
COMMENT ON COLUMN products.created_by IS '创建者用户ID';
COMMENT ON COLUMN products.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（模拟MySQL的虚拟列）
CREATE UNIQUE INDEX unique_active_product_code ON products (product_code) WHERE deleted = FALSE;

-- 创建普通索引
CREATE INDEX idx_products_created_by ON products (created_by);
CREATE INDEX idx_products_updated_by ON products (updated_by);
CREATE INDEX idx_products_supplier_id ON products (supplier_id);
CREATE INDEX idx_products_sort_order ON products (sort_order DESC);

-- 添加外键约束
ALTER TABLE products ADD CONSTRAINT fk_products_category_id FOREIGN KEY (category_id) REFERENCES product_categories(id);
ALTER TABLE products ADD CONSTRAINT fk_products_supplier_id FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
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
  product_id BIGINT NULL,
  image_url VARCHAR(255) NOT NULL,
  image_type SMALLINT NOT NULL DEFAULT 0,
  sort_order INT DEFAULT 0,
  session_id VARCHAR(64) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
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

-- 产品阶梯价格表
CREATE TABLE IF NOT EXISTS product_price_ranges (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  product_id BIGINT NOT NULL,
  min_quantity INT NOT NULL,
  max_quantity INT DEFAULT NULL, -- NULL表示无上限
  price DECIMAL(10, 2) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN product_price_ranges.product_id IS '关联的产品ID';
COMMENT ON COLUMN product_price_ranges.min_quantity IS '数量范围下限（包含）';
COMMENT ON COLUMN product_price_ranges.max_quantity IS '数量范围上限（包含），NULL表示无上限';
COMMENT ON COLUMN product_price_ranges.price IS '该数量范围对应的单价';
COMMENT ON COLUMN product_price_ranges.sort_order IS '排序字段，用于确保价格范围的顺序';
COMMENT ON COLUMN product_price_ranges.created_by IS '创建者用户ID';
COMMENT ON COLUMN product_price_ranges.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_product_price_ranges_product_id ON product_price_ranges (product_id);
CREATE INDEX idx_product_price_ranges_quantity_range ON product_price_ranges (product_id, min_quantity, max_quantity);
CREATE INDEX idx_product_price_ranges_created_by ON product_price_ranges (created_by);
CREATE INDEX idx_product_price_ranges_updated_by ON product_price_ranges (updated_by);

-- 添加外键约束
ALTER TABLE product_price_ranges ADD CONSTRAINT fk_product_price_ranges_product_id FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE product_price_ranges ADD CONSTRAINT fk_product_price_ranges_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE product_price_ranges ADD CONSTRAINT fk_product_price_ranges_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 添加约束确保数量范围的逻辑正确性
ALTER TABLE product_price_ranges ADD CONSTRAINT chk_quantity_range CHECK (
  min_quantity > 0 AND 
  (max_quantity IS NULL OR max_quantity >= min_quantity)
);

-- 创建更新时间戳触发器
CREATE TRIGGER update_product_price_ranges_modtime
    BEFORE UPDATE ON product_price_ranges
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- 物流公司表
CREATE TABLE IF NOT EXISTS logistics_companies (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  name VARCHAR(128) NOT NULL,
  code VARCHAR(32) NOT NULL,
  description TEXT,
  contact_phone VARCHAR(32),
  contact_email VARCHAR(128),
  website VARCHAR(256),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE logistics_companies IS '物流公司信息表';
COMMENT ON COLUMN logistics_companies.name IS '物流公司名称';
COMMENT ON COLUMN logistics_companies.code IS '物流公司代码';
COMMENT ON COLUMN logistics_companies.description IS '物流公司描述';
COMMENT ON COLUMN logistics_companies.contact_phone IS '联系电话';
COMMENT ON COLUMN logistics_companies.contact_email IS '联系邮箱';
COMMENT ON COLUMN logistics_companies.website IS '官方网站';
COMMENT ON COLUMN logistics_companies.is_active IS '是否启用';
COMMENT ON COLUMN logistics_companies.is_default IS '是否为默认物流公司';
COMMENT ON COLUMN logistics_companies.created_by IS '创建者用户ID';
COMMENT ON COLUMN logistics_companies.updated_by IS '最后更新者用户ID';

-- 创建唯一索引
CREATE UNIQUE INDEX unique_active_logistics_companies_code ON logistics_companies (code) WHERE deleted = FALSE;

-- 创建普通索引
CREATE INDEX idx_logistics_companies_name ON logistics_companies (name);
CREATE INDEX idx_logistics_companies_is_active ON logistics_companies (is_active);
CREATE INDEX idx_logistics_companies_is_default ON logistics_companies (is_default);
CREATE INDEX idx_logistics_companies_created_by ON logistics_companies (created_by);
CREATE INDEX idx_logistics_companies_updated_by ON logistics_companies (updated_by);

-- 添加外键约束
ALTER TABLE logistics_companies ADD CONSTRAINT fk_logistics_companies_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE logistics_companies ADD CONSTRAINT fk_logistics_companies_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_logistics_companies_modtime
    BEFORE UPDATE ON logistics_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
    
-- 产品运费范围表
CREATE TABLE IF NOT EXISTS shippingfee_ranges (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  country_id BIGINT DEFAULT NULL,
  tags_id BIGINT DEFAULT NULL,
  logistics_companies_id BIGINT NOT NULL,
  unit VARCHAR(8) NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg', 'g', 'cm', 'm')),
  min_value DECIMAL(10, 3) NOT NULL,
  max_value DECIMAL(10, 3) DEFAULT NULL, -- NULL表示无上限
  fee DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN shippingfee_ranges.country_id IS '关联的国家ID，可为空表示适用于所有国家';
COMMENT ON COLUMN shippingfee_ranges.tags_id IS '关联的标签ID，可为空，用于按标签分组运费范围';
COMMENT ON COLUMN shippingfee_ranges.logistics_companies_id IS '关联的物流公司ID';
COMMENT ON COLUMN shippingfee_ranges.unit IS '计量单位：kg-千克，g-克，cm-厘米，m-米';
COMMENT ON COLUMN shippingfee_ranges.min_value IS '范围下限（包含）';
COMMENT ON COLUMN shippingfee_ranges.max_value IS '范围上限（包含），NULL表示无上限';
COMMENT ON COLUMN shippingfee_ranges.fee IS '该范围对应的运费';
COMMENT ON COLUMN shippingfee_ranges.created_by IS '创建者用户ID';
COMMENT ON COLUMN shippingfee_ranges.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_shippingfee_ranges_country_id ON shippingfee_ranges (country_id);
CREATE INDEX idx_shippingfee_ranges_tags_id ON shippingfee_ranges (tags_id);
CREATE INDEX idx_shippingfee_ranges_logistics_companies_id ON shippingfee_ranges (logistics_companies_id);
CREATE INDEX idx_shippingfee_ranges_value_range ON shippingfee_ranges (logistics_companies_id, unit, min_value, max_value);
CREATE INDEX idx_shippingfee_ranges_created_by ON shippingfee_ranges (created_by);
CREATE INDEX idx_shippingfee_ranges_updated_by ON shippingfee_ranges (updated_by);

-- 添加外键约束
ALTER TABLE shippingfee_ranges ADD CONSTRAINT fk_shippingfee_ranges_country_id FOREIGN KEY (country_id) REFERENCES countries(id);
ALTER TABLE shippingfee_ranges ADD CONSTRAINT fk_shippingfee_ranges_tags_id FOREIGN KEY (tags_id) REFERENCES tags(id);
ALTER TABLE shippingfee_ranges ADD CONSTRAINT fk_shippingfee_ranges_logistics_companies_id FOREIGN KEY (logistics_companies_id) REFERENCES logistics_companies(id);
ALTER TABLE shippingfee_ranges ADD CONSTRAINT fk_shippingfee_ranges_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE shippingfee_ranges ADD CONSTRAINT fk_shippingfee_ranges_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 添加约束确保范围的逻辑正确性
ALTER TABLE shippingfee_ranges ADD CONSTRAINT chk_shippingfee_value_range CHECK (
  min_value >= 0 AND 
  (max_value IS NULL OR max_value >= min_value)
);

-- 创建更新时间戳触发器
CREATE TRIGGER update_shippingfee_ranges_modtime
    BEFORE UPDATE ON shippingfee_ranges
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_guid UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id BIGINT NOT NULL,
  inquiry_id BIGINT DEFAULT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  original_amount DECIMAL(10, 2) DEFAULT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'pay_timeout')),
  payment_method VARCHAR(16), -- card, alipay, wechat
  payment_id VARCHAR(64),
  shipping_name VARCHAR(32) NOT NULL,
  shipping_phone VARCHAR(16) NOT NULL,
  shipping_email VARCHAR(64) NOT NULL,
  shipping_address VARCHAR(256) NOT NULL,
  shipping_zip_code VARCHAR(16) NOT NULL DEFAULT '',
  shipping_country VARCHAR(64) DEFAULT NULL,
  shipping_state VARCHAR(64) DEFAULT NULL,
  shipping_city VARCHAR(64) DEFAULT NULL,
  shipping_phone_country_code VARCHAR(8) DEFAULT NULL,
  shipping_fee DECIMAL(10, 2) DEFAULT 0.00,
  update_amount_time TIMESTAMPTZ DEFAULT NULL,
  create_time_zone VARCHAR(64) DEFAULT NULL,
  paid_at TIMESTAMPTZ DEFAULT NULL,
  paid_time_zone VARCHAR(64) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN orders.inquiry_id IS '关联的询价单ID';
COMMENT ON COLUMN orders.shipping_country IS '收货国家';
COMMENT ON COLUMN orders.shipping_state IS '收货省份/州';
COMMENT ON COLUMN orders.shipping_city IS '收货城市';
COMMENT ON COLUMN orders.shipping_phone_country_code IS '收货电话国家区号';
COMMENT ON COLUMN orders.original_amount IS '原始订单金额（首次修改价格时保存）';
COMMENT ON COLUMN orders.update_amount_time IS '金额更新时间（修改total_amount或shipping_fee时更新）';
COMMENT ON COLUMN orders.create_time_zone IS '订单创建时的时区信息';
COMMENT ON COLUMN orders.paid_at IS '支付完成时间（UTC时间）';
COMMENT ON COLUMN orders.paid_time_zone IS '支付完成时的时区信息';
COMMENT ON COLUMN orders.created_by IS '创建者用户ID';
COMMENT ON COLUMN orders.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_orders_user_id ON orders (user_id);
CREATE INDEX idx_orders_inquiry_id ON orders (inquiry_id);
CREATE INDEX idx_orders_order_guid ON orders (order_guid);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at);
CREATE INDEX idx_orders_created_by ON orders (created_by);
CREATE INDEX idx_orders_updated_by ON orders (updated_by);

-- 添加外键约束
ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE orders ADD CONSTRAINT fk_orders_inquiry_id FOREIGN KEY (inquiry_id) REFERENCES inquiries(id);
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
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
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
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  order_id BIGINT NOT NULL,
  logistics_company_id BIGINT,
  shipping_no VARCHAR(128),
  shipping_name VARCHAR(128) NOT NULL,
  shipping_phone VARCHAR(32) NOT NULL,
  shipping_email VARCHAR(128) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_zip_code VARCHAR(16) NOT NULL DEFAULT '',
  shipping_country VARCHAR(64) DEFAULT NULL,
  shipping_state VARCHAR(64) DEFAULT NULL,
  shipping_city VARCHAR(64) DEFAULT NULL,
  shipping_phone_country_code VARCHAR(8) DEFAULT NULL,
  shipping_status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, processing, shipped, in_transit, delivered, exception
  tracking_info TEXT, -- JSON格式存储跟踪信息
  notes TEXT,
  shipped_at TIMESTAMPTZ DEFAULT NULL,
  shipped_time_zone VARCHAR(64) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE logistics IS '物流信息表';
COMMENT ON COLUMN logistics.order_id IS '关联的订单ID';
COMMENT ON COLUMN logistics.logistics_company_id IS '物流公司ID';
COMMENT ON COLUMN logistics.shipping_no IS '物流单号';
COMMENT ON COLUMN logistics.shipping_name IS '收货人姓名';
COMMENT ON COLUMN logistics.shipping_phone IS '收货人电话';
COMMENT ON COLUMN logistics.shipping_email IS '收货人邮箱';
COMMENT ON COLUMN logistics.shipping_address IS '收货地址';
COMMENT ON COLUMN logistics.shipping_zip_code IS '邮政编码';
COMMENT ON COLUMN logistics.shipping_country IS '收货国家';
COMMENT ON COLUMN logistics.shipping_state IS '收货省份/州';
COMMENT ON COLUMN logistics.shipping_city IS '收货城市';
COMMENT ON COLUMN logistics.shipping_phone_country_code IS '收货电话国家区号';
COMMENT ON COLUMN logistics.shipping_status IS '物流状态：pending-待处理, processing-处理中, shipped-已发货, in_transit-运输中, delivered-已送达, exception-异常';
COMMENT ON COLUMN logistics.tracking_info IS '跟踪信息，JSON格式';
COMMENT ON COLUMN logistics.notes IS '备注信息';
COMMENT ON COLUMN logistics.shipped_at IS '发货时间（UTC时间）';
COMMENT ON COLUMN logistics.shipped_time_zone IS '发货时的时区信息';
COMMENT ON COLUMN logistics.created_by IS '创建者用户ID';
COMMENT ON COLUMN logistics.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_logistics_order_id ON logistics (order_id);
CREATE INDEX idx_logistics_company_id ON logistics (logistics_company_id);
CREATE INDEX idx_logistics_shipping_no ON logistics (shipping_no);
CREATE INDEX idx_logistics_shipping_status ON logistics (shipping_status);
CREATE INDEX idx_logistics_shipped_at ON logistics (shipped_at);
CREATE INDEX idx_logistics_created_at ON logistics (created_at);
CREATE INDEX idx_logistics_created_by ON logistics (created_by);
CREATE INDEX idx_logistics_updated_by ON logistics (updated_by);

-- 添加外键约束
ALTER TABLE logistics ADD CONSTRAINT fk_logistics_order_id FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE logistics ADD CONSTRAINT fk_logistics_company_id FOREIGN KEY (logistics_company_id) REFERENCES logistics_companies(id);
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
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN site_settings.created_by IS '创建者用户ID';
COMMENT ON COLUMN site_settings.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（模拟MySQL的虚拟列）
CREATE UNIQUE INDEX unique_active_setting_key ON site_settings (setting_key) WHERE deleted = FALSE;

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
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
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
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
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

-- 运费系数表
CREATE TABLE IF NOT EXISTS shippingfee_factor (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  logistics_companies_id BIGINT NOT NULL,
  tags_id BIGINT DEFAULT NULL,
  country_id BIGINT DEFAULT NULL,
  initial_weight DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
  continued_weight DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
  initial_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  throw_ratio_coefficient DECIMAL(10, 3) NOT NULL DEFAULT 1.000,
  surcharge DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  surcharge2 DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  other_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE shippingfee_factor IS '运费系数表';
COMMENT ON COLUMN shippingfee_factor.logistics_companies_id IS '关联的物流公司ID，不能为空';
COMMENT ON COLUMN shippingfee_factor.tags_id IS '关联的标签ID，可为空，用于按标签设置运费系数';
COMMENT ON COLUMN shippingfee_factor.country_id IS '关联的国家ID，可为空，用于按国家设置运费系数';
COMMENT ON COLUMN shippingfee_factor.initial_weight IS '首重重量（千克）';
COMMENT ON COLUMN shippingfee_factor.continued_weight IS '续重重量（千克）';
COMMENT ON COLUMN shippingfee_factor.initial_fee IS '首重费用';
COMMENT ON COLUMN shippingfee_factor.throw_ratio_coefficient IS '抛比系数';
COMMENT ON COLUMN shippingfee_factor.surcharge IS '附加费';
COMMENT ON COLUMN shippingfee_factor.surcharge2 IS '附加费2';
COMMENT ON COLUMN shippingfee_factor.other_fee IS '其他费用';
COMMENT ON COLUMN shippingfee_factor.discount IS '折扣（百分比）';
COMMENT ON COLUMN shippingfee_factor.created_by IS '创建者用户ID';
COMMENT ON COLUMN shippingfee_factor.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_shippingfee_factor_logistics_companies_id ON shippingfee_factor (logistics_companies_id);
CREATE INDEX idx_shippingfee_factor_tags_id ON shippingfee_factor (tags_id);
CREATE INDEX idx_shippingfee_factor_country_id ON shippingfee_factor (country_id);
CREATE INDEX idx_shippingfee_factor_created_by ON shippingfee_factor (created_by);
CREATE INDEX idx_shippingfee_factor_updated_by ON shippingfee_factor (updated_by);

-- 创建唯一约束确保每个物流公司的每个国家/标签/默认只能有一条记录
CREATE UNIQUE INDEX uk_shippingfee_factor_logistics_country ON shippingfee_factor (logistics_companies_id, country_id) 
  WHERE deleted = FALSE AND tags_id IS NULL AND country_id IS NOT NULL;
CREATE UNIQUE INDEX uk_shippingfee_factor_logistics_tag ON shippingfee_factor (logistics_companies_id, tags_id) 
  WHERE deleted = FALSE AND country_id IS NULL AND tags_id IS NOT NULL;
CREATE UNIQUE INDEX uk_shippingfee_factor_logistics_default ON shippingfee_factor (logistics_companies_id) 
  WHERE deleted = FALSE AND tags_id IS NULL AND country_id IS NULL;

-- 添加外键约束
ALTER TABLE shippingfee_factor ADD CONSTRAINT fk_shippingfee_factor_logistics_companies_id FOREIGN KEY (logistics_companies_id) REFERENCES logistics_companies(id);
ALTER TABLE shippingfee_factor ADD CONSTRAINT fk_shippingfee_factor_tags_id FOREIGN KEY (tags_id) REFERENCES tags(id);
ALTER TABLE shippingfee_factor ADD CONSTRAINT fk_shippingfee_factor_country_id FOREIGN KEY (country_id) REFERENCES countries(id);
ALTER TABLE shippingfee_factor ADD CONSTRAINT fk_shippingfee_factor_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE shippingfee_factor ADD CONSTRAINT fk_shippingfee_factor_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 添加约束确保数值的合理性
ALTER TABLE shippingfee_factor ADD CONSTRAINT chk_shippingfee_factor_values CHECK (
  initial_weight >= 0 AND 
  initial_fee >= 0 AND 
  throw_ratio_coefficient > 0 AND 
  surcharge >= 0 AND 
  discount >= 0 AND discount <= 100
);

-- 创建更新时间戳触发器
CREATE TRIGGER update_shippingfee_factor_modtime
    BEFORE UPDATE ON shippingfee_factor
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  value VARCHAR(64) NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'country',
  description VARCHAR(256) DEFAULT '',
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE tags IS '标签表，用于为各种实体添加标签功能';
COMMENT ON COLUMN tags.value IS '标签值';
COMMENT ON COLUMN tags.type IS '标签类型，目前支持：country';
COMMENT ON COLUMN tags.description IS '标签描述';
COMMENT ON COLUMN tags.status IS '状态：active-启用，inactive-禁用';
COMMENT ON COLUMN tags.created_by IS '创建者用户ID';
COMMENT ON COLUMN tags.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（value + type 组合不能重复）
CREATE UNIQUE INDEX unique_active_tag_value_type ON tags (value, type) WHERE deleted = FALSE;

-- 创建普通索引
CREATE INDEX idx_tags_value ON tags (value);
CREATE INDEX idx_tags_type ON tags (type);
CREATE INDEX idx_tags_status ON tags (status);
CREATE INDEX idx_tags_created_by ON tags (created_by);
CREATE INDEX idx_tags_updated_by ON tags (updated_by);

-- 添加外键约束
ALTER TABLE tags ADD CONSTRAINT fk_tags_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE tags ADD CONSTRAINT fk_tags_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_tags_modtime
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 国家标签关联表
CREATE TABLE IF NOT EXISTS country_tags (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  country_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE country_tags IS '国家标签关联表';
COMMENT ON COLUMN country_tags.country_id IS '关联的国家ID';
COMMENT ON COLUMN country_tags.tag_id IS '关联的标签ID';
COMMENT ON COLUMN country_tags.created_by IS '创建者用户ID';
COMMENT ON COLUMN country_tags.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（同一国家同一标签只能关联一次）
CREATE UNIQUE INDEX unique_active_country_tag ON country_tags (country_id, tag_id) WHERE deleted = FALSE;

-- 创建普通索引
CREATE INDEX idx_country_tags_country_id ON country_tags (country_id);
CREATE INDEX idx_country_tags_tag_id ON country_tags (tag_id);
CREATE INDEX idx_country_tags_created_by ON country_tags (created_by);
CREATE INDEX idx_country_tags_updated_by ON country_tags (updated_by);

-- 添加外键约束
ALTER TABLE country_tags ADD CONSTRAINT fk_country_tags_country_id FOREIGN KEY (country_id) REFERENCES countries(id);
ALTER TABLE country_tags ADD CONSTRAINT fk_country_tags_tag_id FOREIGN KEY (tag_id) REFERENCES tags(id);
ALTER TABLE country_tags ADD CONSTRAINT fk_country_tags_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE country_tags ADD CONSTRAINT fk_country_tags_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_country_tags_modtime
    BEFORE UPDATE ON country_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- 初始数据
INSERT INTO company_info (guid, company_name, address, phone, email) VALUES (gen_random_uuid(), 'AUTO EASE EXPERT CO., LTD', '123 Auto Street, Vehicle City', '+86 123 4567 8910', 'contact@autoease.com');

-- 插入网站设置
INSERT INTO site_settings (guid, setting_key, setting_value, setting_group) VALUES 
(gen_random_uuid(), 'site_logo', '/static/images/logo.png', 'general'),
(gen_random_uuid(), 'site_title', 'AUTO EASE EXPERT CO., LTD', 'general'),
(gen_random_uuid(), 'copyright_text', '© 2025 AUTO EASE EXPERT CO., LTD. All Rights Reserved', 'general');

-- 第三方登录记录表
CREATE TABLE IF NOT EXISTS third_party_logins (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  provider VARCHAR(16) NOT NULL CHECK (provider IN ('apple', 'google', 'facebook')),
  provider_user_id VARCHAR(256) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  email VARCHAR(64),
  name VARCHAR(64),
  avatar_url VARCHAR(512),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN third_party_logins.user_id IS '关联的用户ID';
COMMENT ON COLUMN third_party_logins.provider IS '第三方登录提供商';
COMMENT ON COLUMN third_party_logins.provider_user_id IS '第三方平台用户ID';
COMMENT ON COLUMN third_party_logins.access_token IS '访问令牌';
COMMENT ON COLUMN third_party_logins.refresh_token IS '刷新令牌';
COMMENT ON COLUMN third_party_logins.token_expires_at IS '令牌过期时间';
COMMENT ON COLUMN third_party_logins.email IS '第三方平台邮箱';
COMMENT ON COLUMN third_party_logins.name IS '第三方平台用户名';
COMMENT ON COLUMN third_party_logins.avatar_url IS '第三方平台头像URL';
COMMENT ON COLUMN third_party_logins.created_by IS '创建者用户ID';
COMMENT ON COLUMN third_party_logins.updated_by IS '最后更新者用户ID';

-- 创建唯一索引
CREATE UNIQUE INDEX uk_third_party_logins_provider_user ON third_party_logins (provider, provider_user_id) WHERE deleted = FALSE;

-- 创建普通索引
CREATE INDEX idx_third_party_logins_user_id ON third_party_logins (user_id);
CREATE INDEX idx_third_party_logins_provider ON third_party_logins (provider);
CREATE INDEX idx_third_party_logins_created_at ON third_party_logins (created_at);
CREATE INDEX idx_third_party_logins_created_by ON third_party_logins (created_by);
CREATE INDEX idx_third_party_logins_updated_by ON third_party_logins (updated_by);

-- 添加外键约束
ALTER TABLE third_party_logins ADD CONSTRAINT fk_third_party_logins_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE third_party_logins ADD CONSTRAINT fk_third_party_logins_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE third_party_logins ADD CONSTRAINT fk_third_party_logins_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_third_party_logins_modtime
    BEFORE UPDATE ON third_party_logins
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 用户产品关联表（收藏和浏览历史）
CREATE TABLE IF NOT EXISTS user_products (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  type VARCHAR(16) NOT NULL CHECK (type IN ('favorite', 'viewed')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN user_products.user_id IS '用户ID';
COMMENT ON COLUMN user_products.product_id IS '产品ID';
COMMENT ON COLUMN user_products.type IS '类型：favorite-收藏，viewed-浏览历史';
COMMENT ON COLUMN user_products.created_by IS '创建者用户ID';
COMMENT ON COLUMN user_products.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（同一用户对同一产品的同一类型记录唯一）
CREATE UNIQUE INDEX unique_user_product_type ON user_products (user_id, product_id, type) WHERE deleted = FALSE;

-- 创建普通索引
CREATE INDEX idx_user_products_user_id ON user_products (user_id);
CREATE INDEX idx_user_products_product_id ON user_products (product_id);
CREATE INDEX idx_user_products_type ON user_products (type);
CREATE INDEX idx_user_products_created_at ON user_products (created_at DESC);
CREATE INDEX idx_user_products_created_by ON user_products (created_by);
CREATE INDEX idx_user_products_updated_by ON user_products (updated_by);

-- 添加外键约束
ALTER TABLE user_products ADD CONSTRAINT fk_user_products_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE user_products ADD CONSTRAINT fk_user_products_product_id FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE user_products ADD CONSTRAINT fk_user_products_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE user_products ADD CONSTRAINT fk_user_products_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_user_products_modtime
    BEFORE UPDATE ON user_products
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- 创建默认管理员用户 (密码: admin123)
INSERT INTO users (guid, username, password, email, user_role) 
VALUES (gen_random_uuid(), 'admin', '$2a$10$cwY5LmaMC5j17oqGUKmBMe5FCSizuXvqMi23rpqEGFpIc4NRd2PTS', 'admin@autoeasetechx.com', 'admin');


-- 用户地址表
CREATE TABLE IF NOT EXISTS user_addresses (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id BIGINT NOT NULL,
  recipient_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  postal_code VARCHAR(20),
  country VARCHAR(64) DEFAULT NULL,
  state VARCHAR(64) DEFAULT NULL,
  city VARCHAR(64) DEFAULT NULL,
  phone_country_code VARCHAR(8) DEFAULT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  label VARCHAR(20) DEFAULT 'home',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN user_addresses.user_id IS '用户ID';
COMMENT ON COLUMN user_addresses.recipient_name IS '收货人姓名';
COMMENT ON COLUMN user_addresses.phone IS '收货人手机号';
COMMENT ON COLUMN user_addresses.address IS '详细地址';
COMMENT ON COLUMN user_addresses.postal_code IS '邮政编码';
COMMENT ON COLUMN user_addresses.country IS '国家';
COMMENT ON COLUMN user_addresses.state IS '省份/州';
COMMENT ON COLUMN user_addresses.city IS '城市';
COMMENT ON COLUMN user_addresses.phone_country_code IS '电话国家区号';
COMMENT ON COLUMN user_addresses.is_default IS '是否为默认地址';
COMMENT ON COLUMN user_addresses.label IS '地址标签：home-家，company-公司，school-学校，other-其他';
COMMENT ON COLUMN user_addresses.created_by IS '创建者用户ID';
COMMENT ON COLUMN user_addresses.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_user_addresses_user_id ON user_addresses (user_id);
CREATE INDEX idx_user_addresses_is_default ON user_addresses (is_default);
CREATE INDEX idx_user_addresses_created_by ON user_addresses (created_by);
CREATE INDEX idx_user_addresses_updated_by ON user_addresses (updated_by);

-- 添加外键约束
ALTER TABLE user_addresses ADD CONSTRAINT fk_user_addresses_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE user_addresses ADD CONSTRAINT fk_user_addresses_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE user_addresses ADD CONSTRAINT fk_user_addresses_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_user_addresses_modtime
    BEFORE UPDATE ON user_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 产品关联表（Buy Together功能）
CREATE TABLE IF NOT EXISTS product_links (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  product_id BIGINT NOT NULL,
  link_product_id BIGINT NOT NULL,
  link_type VARCHAR(32) NOT NULL DEFAULT 'buy_together' CHECK (link_type IN ('buy_together')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE product_links IS '产品关联表，用于实现Buy Together等功能';
COMMENT ON COLUMN product_links.product_id IS '主产品ID';
COMMENT ON COLUMN product_links.link_product_id IS '关联产品ID';
COMMENT ON COLUMN product_links.link_type IS '关联类型：buy_together-一起购买';
COMMENT ON COLUMN product_links.sort_order IS '排序字段，数值越大排序越靠前';
COMMENT ON COLUMN product_links.created_by IS '创建者用户ID';
COMMENT ON COLUMN product_links.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（防止重复关联）
CREATE UNIQUE INDEX unique_product_link ON product_links (product_id, link_product_id, link_type) WHERE deleted = FALSE;

-- 创建普通索引
CREATE INDEX idx_product_links_product_id ON product_links (product_id);
CREATE INDEX idx_product_links_link_product_id ON product_links (link_product_id);
CREATE INDEX idx_product_links_link_type ON product_links (link_type);
CREATE INDEX idx_product_links_sort_order ON product_links (sort_order DESC);
CREATE INDEX idx_product_links_created_by ON product_links (created_by);
CREATE INDEX idx_product_links_updated_by ON product_links (updated_by);

-- 添加外键约束
ALTER TABLE product_links ADD CONSTRAINT fk_product_links_product_id FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE product_links ADD CONSTRAINT fk_product_links_link_product_id FOREIGN KEY (link_product_id) REFERENCES products(id);
ALTER TABLE product_links ADD CONSTRAINT fk_product_links_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE product_links ADD CONSTRAINT fk_product_links_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 添加约束防止自关联
ALTER TABLE product_links ADD CONSTRAINT chk_no_self_link CHECK (product_id != link_product_id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_product_links_modtime
    BEFORE UPDATE ON product_links
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 产品评论表
CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  product_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_content TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_reply TEXT,
  admin_reply_at TIMESTAMP DEFAULT NULL,
  admin_reply_by BIGINT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE product_reviews IS '产品评论表';
COMMENT ON COLUMN product_reviews.product_id IS '产品ID';
COMMENT ON COLUMN product_reviews.user_id IS '评论用户ID';
COMMENT ON COLUMN product_reviews.rating IS '评价等级，1-5星';
COMMENT ON COLUMN product_reviews.review_content IS '评论内容';
COMMENT ON COLUMN product_reviews.is_anonymous IS '是否匿名评论';
COMMENT ON COLUMN product_reviews.status IS '审核状态：pending-待审核，approved-已通过，rejected-已拒绝';
COMMENT ON COLUMN product_reviews.admin_reply IS '管理员回复内容';
COMMENT ON COLUMN product_reviews.admin_reply_at IS '管理员回复时间';
COMMENT ON COLUMN product_reviews.admin_reply_by IS '管理员回复者ID';
COMMENT ON COLUMN product_reviews.created_by IS '创建者用户ID';
COMMENT ON COLUMN product_reviews.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（一个用户对一个产品只能评论一次）
CREATE UNIQUE INDEX unique_user_product_review ON product_reviews (user_id, product_id) WHERE deleted = FALSE;

-- 创建普通索引
CREATE INDEX idx_product_reviews_product_id ON product_reviews (product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews (user_id);
CREATE INDEX idx_product_reviews_rating ON product_reviews (rating);
CREATE INDEX idx_product_reviews_status ON product_reviews (status);
CREATE INDEX idx_product_reviews_created_at ON product_reviews (created_at DESC);
CREATE INDEX idx_product_reviews_created_by ON product_reviews (created_by);
CREATE INDEX idx_product_reviews_updated_by ON product_reviews (updated_by);
CREATE INDEX idx_product_reviews_admin_reply_by ON product_reviews (admin_reply_by);

-- 添加外键约束
ALTER TABLE product_reviews ADD CONSTRAINT fk_product_reviews_product_id FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE product_reviews ADD CONSTRAINT fk_product_reviews_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE product_reviews ADD CONSTRAINT fk_product_reviews_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE product_reviews ADD CONSTRAINT fk_product_reviews_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
ALTER TABLE product_reviews ADD CONSTRAINT fk_product_reviews_admin_reply_by FOREIGN KEY (admin_reply_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_product_reviews_modtime
    BEFORE UPDATE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 产品评论图片表
CREATE TABLE IF NOT EXISTS product_review_images (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  review_id BIGINT NOT NULL,
  session_id VARCHAR(255) DEFAULT NULL,
  image_url VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE product_review_images IS '产品评论图片表';
COMMENT ON COLUMN product_review_images.review_id IS '关联的评论ID';
COMMENT ON COLUMN product_review_images.image_url IS '图片URL路径';
COMMENT ON COLUMN product_review_images.sort_order IS '图片排序，数值越小排序越靠前';
COMMENT ON COLUMN product_review_images.created_by IS '创建者用户ID';
COMMENT ON COLUMN product_review_images.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_product_review_images_review_id ON product_review_images (review_id);
CREATE INDEX IF NOT EXISTS idx_product_review_images_session_id ON product_review_images (session_id);
CREATE INDEX idx_product_review_images_sort_order ON product_review_images (review_id, sort_order);
CREATE INDEX idx_product_review_images_created_by ON product_review_images (created_by);
CREATE INDEX idx_product_review_images_updated_by ON product_review_images (updated_by);

-- 添加外键约束
ALTER TABLE product_review_images ADD CONSTRAINT fk_product_review_images_review_id FOREIGN KEY (review_id) REFERENCES product_reviews(id);
ALTER TABLE product_review_images ADD CONSTRAINT fk_product_review_images_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE product_review_images ADD CONSTRAINT fk_product_review_images_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_product_review_images_modtime
    BEFORE UPDATE ON product_review_images
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
