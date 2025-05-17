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
  shipping_zip_code VARCHAR(16) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  INDEX idx_user_id (user_id),
  INDEX idx_order_guid (order_guid),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- 订单项表
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  product_name VARCHAR(64) NOT NULL,
  product_code VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id)
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
  INDEX idx_order_id (order_id),
  INDEX idx_tracking_number (tracking_number),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);