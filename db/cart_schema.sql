-- 购物车表
CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY unique_user_product (user_id, product_id, deleted)
);