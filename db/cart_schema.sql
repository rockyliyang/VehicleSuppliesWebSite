CREATE TABLE cart_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  -- 添加虚拟列：当未删除时生成唯一标识
  active_unique_key VARCHAR(255) GENERATED ALWAYS AS (
    IF(deleted = 0, CONCAT(user_id, '-', product_id), NULL)
  ) STORED,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  -- 对虚拟列创建唯一索引
  UNIQUE KEY unique_active_user_product (active_unique_key)
);