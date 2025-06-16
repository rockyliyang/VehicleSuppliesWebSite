
CREATE TABLE IF NOT EXISTS business_groups (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  group_name VARCHAR(64) NOT NULL COMMENT '业务组名称',
  group_email VARCHAR(64) NOT NULL COMMENT '业务组邮箱',
  description VARCHAR(256) COMMENT '业务组描述',
  is_default TINYINT(1) DEFAULT 0 COMMENT '是否为默认组',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by BIGINT COMMENT '创建人ID',
  updated_by BIGINT COMMENT '更新人ID',
  deleted TINYINT(1) DEFAULT 0,
  
  -- 虚拟字段用于唯一索引
  active_unique_group_name VARCHAR(255) AS (
    CASE 
      WHEN deleted = 0 THEN group_name
      ELSE NULL 
    END
  ) VIRTUAL,
  active_unique_group_email VARCHAR(255) AS (
    CASE 
      WHEN deleted = 0 THEN group_email
      ELSE NULL 
    END
  ) VIRTUAL,
  
  UNIQUE KEY uk_active_group_name (active_unique_group_name),
  UNIQUE KEY uk_active_group_email (active_unique_group_email),
  INDEX idx_is_default (is_default),
  INDEX idx_status (status),
  INDEX idx_deleted (deleted),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
) COMMENT='业务组表';

-- ========================================
-- 步骤3: 创建用户业务组关联表
-- ========================================

CREATE TABLE IF NOT EXISTS user_business_groups (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  business_group_id BIGINT NOT NULL COMMENT '业务组ID',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
  assigned_by BIGINT COMMENT '分配人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by BIGINT COMMENT '创建人ID',
  updated_by BIGINT COMMENT '更新人ID',
  deleted TINYINT(1) DEFAULT 0,
  
  -- 虚拟字段用于唯一索引
  active_unique_user_group VARCHAR(255) AS (
    CASE 
      WHEN deleted = 0 THEN CONCAT(user_id, '-', business_group_id)
      ELSE NULL 
    END
  ) VIRTUAL,
  
  UNIQUE KEY uk_active_user_group (active_unique_user_group),
  INDEX idx_user_id (user_id),
  INDEX idx_business_group_id (business_group_id),
  INDEX idx_deleted (deleted),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (business_group_id) REFERENCES business_groups(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
) COMMENT='用户业务组关联表';

-- ========================================
-- 步骤4: 创建联系消息表
-- ========================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guid BINARY(16) NOT NULL,
  user_id BIGINT COMMENT '关联用户ID（如果是注册用户）',
  business_group_id BIGINT COMMENT '处理业务组ID',
  name VARCHAR(64) NOT NULL COMMENT '联系人姓名',
  email VARCHAR(64) NOT NULL COMMENT '联系人邮箱',
  phone VARCHAR(16) COMMENT '联系人电话',
  subject VARCHAR(128) NOT NULL COMMENT '消息主题',
  message TEXT NOT NULL COMMENT '消息内容',
  status ENUM('pending', 'processing', 'replied', 'closed') NOT NULL DEFAULT 'pending' COMMENT '处理状态',
  priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal' COMMENT '优先级',
  ip_address VARCHAR(32) COMMENT '提交者IP地址',
  user_agent TEXT COMMENT '用户代理信息',
  replied_at TIMESTAMP NULL COMMENT '回复时间',
  replied_by BIGINT COMMENT '回复人ID',
  assigned_to BIGINT COMMENT '分配给的业务人员ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by BIGINT COMMENT '创建人ID',
  updated_by BIGINT COMMENT '更新人ID',
  deleted TINYINT(1) DEFAULT 0,
  
  INDEX idx_user_id (user_id),
  INDEX idx_business_group_id (business_group_id),
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted (deleted),
  INDEX idx_created_by (created_by),
  INDEX idx_updated_by (updated_by),
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (business_group_id) REFERENCES business_groups(id),
  FOREIGN KEY (replied_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
) COMMENT='联系消息表';

-- ========================================
-- 步骤5: 插入默认业务组数据
-- ========================================

-- 插入默认业务组（如果不存在）
INSERT IGNORE INTO business_groups (guid, group_name, group_email, description, is_default, status)
VALUES (
  UNHEX(REPLACE(UUID(), '-', '')),
  '默认业务组',
  'default@company.com',
  '系统默认业务组，新用户自动分配到此组',
  1,
  'active'
);
