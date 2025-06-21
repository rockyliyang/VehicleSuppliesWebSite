-- 询价系统数据库表结构
-- 创建时间: 2024
-- 说明: 用户询价功能相关表

USE vehicle_supplies_db;

-- 询价单主表
CREATE TABLE IF NOT EXISTS inquiries (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '询价单ID',
  guid BINARY(16) NOT NULL UNIQUE COMMENT '全局唯一标识符',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  user_inquiry_id INT DEFAULT NULL COMMENT '用户级别的询价单编号',
  title VARCHAR(32) DEFAULT '' COMMENT '询价单标题',
  status VARCHAR(16) DEFAULT 'pending' COMMENT '询价状态: pending-待处理, quoted-已报价, completed-已完成, cancelled-已取消',
  total_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '总金额',
  
  deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记: 0-正常, 1-已删除',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  
  INDEX idx_guid (guid),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_deleted (deleted),
  INDEX idx_created_at (created_at),
  INDEX idx_status_deleted (status, deleted),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  
  UNIQUE KEY uk_user_inquiry_id (user_id, user_inquiry_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_inquiries_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_inquiries_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='询价单主表';

-- 询价商品表
CREATE TABLE IF NOT EXISTS inquiry_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '询价商品ID',
  guid BINARY(16) NOT NULL UNIQUE COMMENT '全局唯一标识符',
  inquiry_id BIGINT NOT NULL COMMENT '询价单ID',
  product_id BIGINT NOT NULL COMMENT '商品ID',
  quantity INT DEFAULT NULL COMMENT '数量',
  unit_price DECIMAL(10,2) DEFAULT NULL COMMENT '业务员报价（管理员设置的价格）',
  
  deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记: 0-正常, 1-已删除',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  
  -- 虚拟列：确保同一询价单中同一商品只能有一条未删除记录
  active_unique_key VARCHAR(64) GENERATED ALWAYS AS (
    IF(deleted = 0, CONCAT(inquiry_id, '-', product_id), NULL)
  ) STORED,
  
  INDEX idx_guid (guid),
  INDEX idx_inquiry_id (inquiry_id),
  INDEX idx_product_id (product_id),
  INDEX idx_deleted (deleted),
  INDEX idx_created_at (created_at),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  
  UNIQUE KEY uk_active_inquiry_product (active_unique_key),
  
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_inquiry_items_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_inquiry_items_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='询价商品表';

-- 询价消息表
CREATE TABLE IF NOT EXISTS inquiry_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
  guid BINARY(16) NOT NULL UNIQUE COMMENT '全局唯一标识符',
  inquiry_id BIGINT NOT NULL COMMENT '询价单ID',
  sender_id BIGINT NOT NULL COMMENT '发送者ID',
  sender_type VARCHAR(8) NOT NULL COMMENT '发送者类型: user-用户, admin-管理员',
  message_type VARCHAR(8) DEFAULT 'text' COMMENT '消息类型: text-文本, quote-报价, system-系统',
  content TEXT NOT NULL COMMENT '消息内容',
  is_read TINYINT(1) DEFAULT 0 COMMENT '是否已读: 0-未读, 1-已读',
  
  deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记: 0-正常, 1-已删除',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  created_by BIGINT DEFAULT NULL COMMENT '创建者用户ID',
  updated_by BIGINT DEFAULT NULL COMMENT '最后更新者用户ID',
  
  INDEX idx_guid (guid),
  INDEX idx_inquiry_id (inquiry_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_sender_type (sender_type),
  INDEX idx_message_type (message_type),
  INDEX idx_deleted (deleted),
  INDEX idx_created_at (created_at),
  INDEX idx_inquiry_deleted (inquiry_id, deleted),
  INDEX idx_is_read (is_read),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id),
  FOREIGN KEY (sender_id) REFERENCES users(id),
  CONSTRAINT fk_inquiry_messages_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_inquiry_messages_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='询价消息表';

-- 创建索引以优化查询性能
-- 用户询价单查询优化
CREATE INDEX idx_user_status_deleted ON inquiries(user_id, status, deleted);
CREATE INDEX idx_user_inquiry_id ON inquiries(user_id, user_inquiry_id);
-- 询价消息查询优化
CREATE INDEX idx_inquiry_sender_type ON inquiry_messages(inquiry_id, sender_type, deleted);

-- 未读消息统计优化
CREATE INDEX idx_inquiry_read_deleted ON inquiry_messages(inquiry_id, is_read, deleted);