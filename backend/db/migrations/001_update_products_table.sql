-- 更新产品表结构
ALTER TABLE products
ADD COLUMN product_code VARCHAR(64) NOT NULL AFTER name,
ADD COLUMN product_type ENUM('physical', 'virtual', 'service') NOT NULL DEFAULT 'physical' COMMENT '产品类型：physical-实物商品，virtual-虚拟商品，service-服务' AFTER category_id,
ADD COLUMN status ENUM('on_shelf', 'off_shelf') NOT NULL DEFAULT 'off_shelf' AFTER product_type,
ADD UNIQUE KEY unique_product_code_not_deleted (product_code, deleted);

-- 更新现有记录
UPDATE products SET 
  product_code = CONCAT('P', LPAD(id, 6, '0')),
  status = 'off_shelf'
WHERE product_code IS NULL;

-- 创建产品图片表
CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  product_id BIGINT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 如果有缩略图，移动到product_images表
INSERT INTO product_images (guid, product_id, image_url, sort_order)
SELECT 
  UUID_TO_BIN(UUID()),
  id,
  thumbnail_url,
  0
FROM products 
WHERE thumbnail_url IS NOT NULL AND thumbnail_url != '';

-- 添加索引
ALTER TABLE products
ADD INDEX idx_product_code (product_code),
ADD INDEX idx_status (status),
ADD INDEX idx_product_type (product_type); 