CREATE TABLE cart_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  -- 添加虚拟列：当未删除时生成唯一标识
  active_unique_key VARCHAR(255) GENERATED ALWAYS AS (
    IF(deleted = 0, CONCAT(user_id, '-', product_id), NULL)
  ) STORED,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  CONSTRAINT fk_cart_items_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_cart_items_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
  -- 对虚拟列创建唯一索引
  UNIQUE KEY unique_active_user_product (active_unique_key)
);