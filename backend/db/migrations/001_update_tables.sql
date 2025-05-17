-- 更新产品分类表结构
ALTER TABLE product_categories
ADD COLUMN code VARCHAR(32) NOT NULL AFTER name,
ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER code,
ADD COLUMN status ENUM('on_shelf', 'off_shelf') NOT NULL DEFAULT 'off_shelf' AFTER sort_order,
ADD UNIQUE KEY unique_code_not_deleted (code, deleted);

-- 更新现有产品分类记录
UPDATE product_categories SET 
  code = CONCAT('C', LPAD(id, 4, '0')),
  status = 'off_shelf'
WHERE code IS NULL;

-- 更新产品表结构
ALTER TABLE products
ADD COLUMN product_code VARCHAR(64) NOT NULL AFTER name,
MODIFY COLUMN product_type ENUM('consignment', 'self_operated') NOT NULL DEFAULT 'consignment' COMMENT '产品类型：consignment-代销，self_operated-自营',
ADD COLUMN status ENUM('on_shelf', 'off_shelf') NOT NULL DEFAULT 'off_shelf' AFTER product_type,
ADD UNIQUE KEY unique_product_code_not_deleted (product_code, deleted);

-- 更新现有产品记录
UPDATE products SET 
  product_code = CONCAT('P', LPAD(id, 6, '0')),
  status = 'off_shelf',
  product_type = 'consignment'
WHERE product_code IS NULL;

-- 创建产品图片表
CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  product_id BIGINT NULL,
  image_url VARCHAR(255) NOT NULL,
  image_type TINYINT NOT NULL DEFAULT 0 COMMENT '图片类型：0-主图，1-轮播图',
  sort_order INT DEFAULT 0,
  session_id VARCHAR(64) DEFAULT NULL COMMENT '临时会话ID，用于未保存产品时图片归属',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 迁移产品缩略图到product_images表（作为主图）
INSERT INTO product_images (guid, product_id, image_url, image_type, sort_order)
SELECT 
  UUID_TO_BIN(UUID()),
  id,
  thumbnail_url,
  0,
  0
FROM products 
WHERE thumbnail_url IS NOT NULL AND thumbnail_url != '';

-- 迁移产品分类图片到product_images表（作为轮播图）
INSERT INTO product_images (guid, product_id, image_url, image_type, sort_order)
SELECT 
  UUID_TO_BIN(UUID()),
  p.id,
  pc.image_url,
  1,
  0
FROM products p
JOIN product_categories pc ON p.category_id = pc.id
WHERE pc.image_url IS NOT NULL AND pc.image_url != '';

-- 添加索引
ALTER TABLE products
ADD INDEX idx_product_code (product_code),
ADD INDEX idx_status (status),
ADD INDEX idx_product_type (product_type);

ALTER TABLE product_categories
ADD INDEX idx_code (code),
ADD INDEX idx_status (status),
ADD INDEX idx_sort_order (sort_order);

-- 为product_images表添加索引
ALTER TABLE product_images
ADD INDEX idx_product_image_type (product_id, image_type, deleted); 