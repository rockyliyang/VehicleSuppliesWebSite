-- 1688产品相关表结构
-- 用于存储从1688平台选品的产品信息

USE vehicle_supplies_db;

-- 1688产品关联表
CREATE TABLE IF NOT EXISTS product_alibaba1688 (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  product_id BIGINT NOT NULL COMMENT '关联的产品ID',
  alibaba_product_id VARCHAR(64) NOT NULL COMMENT '1688平台产品ID',
  alibaba_url VARCHAR(512) COMMENT '1688产品链接',
  supplier_name VARCHAR(255) COMMENT '供应商名称',
  supplier_id VARCHAR(64) COMMENT '供应商ID',
  original_price DECIMAL(10, 2) COMMENT '1688原价',
  min_order_quantity INT DEFAULT 1 COMMENT '最小起订量',
  unit VARCHAR(32) COMMENT '单位',
  freight_template VARCHAR(255) COMMENT '运费模板',
  location VARCHAR(255) COMMENT '发货地',
  sync_status ENUM('pending', 'synced', 'failed') DEFAULT 'pending' COMMENT '同步状态',
  last_sync_at TIMESTAMP NULL COMMENT '最后同步时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_alibaba_product_id (alibaba_product_id),
  INDEX idx_supplier_id (supplier_id),
  INDEX idx_sync_status (sync_status),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  CONSTRAINT fk_product_alibaba1688_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_product_alibaba1688_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_product_alibaba1688_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 产品属性表（扩展现有产品表的属性功能）
CREATE TABLE IF NOT EXISTS product_attributes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  product_id BIGINT NOT NULL COMMENT '关联的产品ID',
  attribute_name VARCHAR(255) NOT NULL COMMENT '属性名称',
  attribute_value TEXT COMMENT '属性值',
  attribute_type ENUM('text', 'number', 'boolean', 'json') DEFAULT 'text' COMMENT '属性类型',
  sort_order INT DEFAULT 0 COMMENT '排序',
  is_searchable TINYINT(1) DEFAULT 0 COMMENT '是否可搜索',
  is_filterable TINYINT(1) DEFAULT 0 COMMENT '是否可筛选',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_product_id (product_id),
  INDEX idx_attribute_name (attribute_name),
  INDEX idx_searchable (is_searchable),
  INDEX idx_filterable (is_filterable),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  CONSTRAINT fk_product_attributes_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_product_attributes_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_product_attributes_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 为现有product_images表添加图片类型字段（如果不存在）
ALTER TABLE product_images 
ADD COLUMN IF NOT EXISTS image_type ENUM('thumbnail', 'carousel', 'detail') DEFAULT 'carousel' COMMENT '图片类型：缩略图、轮播图、详情图';

-- 为现有product_images表添加索引
ALTER TABLE product_images 
ADD INDEX IF NOT EXISTS idx_image_type (image_type);

-- 为现有products表添加索引优化
ALTER TABLE products 
ADD INDEX IF NOT EXISTS idx_product_type (product_type),
ADD INDEX IF NOT EXISTS idx_status (status),
ADD INDEX IF NOT EXISTS idx_category_status (category_id, status);