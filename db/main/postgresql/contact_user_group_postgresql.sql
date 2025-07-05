-- PostgreSQL版本的联系用户组架构
-- 从MySQL转换而来，严格保持原有字段名称和结构
-- 转换日期: 2024年

CREATE TABLE IF NOT EXISTS business_groups (
    id BIGSERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() NOT NULL,
    group_name VARCHAR(64) NOT NULL,
    group_email VARCHAR(64) NOT NULL,
    description VARCHAR(256),
    is_default SMALLINT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 创建更新时间触发器（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为business_groups表创建更新时间触发器
CREATE TRIGGER update_business_groups_updated_at BEFORE UPDATE ON business_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加检查约束（模拟MySQL的ENUM）
ALTER TABLE business_groups ADD CONSTRAINT chk_status CHECK (status IN ('active', 'inactive'));

-- 创建唯一索引（模拟MySQL的虚拟列）
CREATE UNIQUE INDEX uk_active_group_name ON business_groups(group_name) WHERE deleted = FALSE;
CREATE UNIQUE INDEX uk_active_group_email ON business_groups(group_email) WHERE deleted = FALSE;

-- 创建索引
CREATE INDEX idx_business_groups_is_default ON business_groups(is_default);
CREATE INDEX idx_business_groups_status ON business_groups(status);
CREATE INDEX idx_business_groups_deleted ON business_groups(deleted);
CREATE INDEX idx_business_groups_created_by ON business_groups(created_by);
CREATE INDEX idx_business_groups_updated_by ON business_groups(updated_by);

-- 添加外键约束
ALTER TABLE business_groups ADD CONSTRAINT fk_business_groups_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE business_groups ADD CONSTRAINT fk_business_groups_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- ========================================
-- 步骤3: 创建用户业务组关联表
-- ========================================

CREATE TABLE IF NOT EXISTS user_business_groups (
    id BIGSERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id BIGINT NOT NULL,
    business_group_id BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 为user_business_groups表创建更新时间触发器
CREATE TRIGGER update_user_business_groups_updated_at BEFORE UPDATE ON user_business_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建唯一索引（模拟MySQL的虚拟列）
CREATE UNIQUE INDEX uk_active_user_group ON user_business_groups(user_id, business_group_id) WHERE deleted = FALSE;

-- 创建索引
CREATE INDEX idx_user_business_groups_user_id ON user_business_groups(user_id);
CREATE INDEX idx_user_business_groups_business_group_id ON user_business_groups(business_group_id);
CREATE INDEX idx_user_business_groups_deleted ON user_business_groups(deleted);
CREATE INDEX idx_user_business_groups_created_by ON user_business_groups(created_by);
CREATE INDEX idx_user_business_groups_updated_by ON user_business_groups(updated_by);

-- 添加外键约束
ALTER TABLE user_business_groups ADD CONSTRAINT fk_user_business_groups_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE user_business_groups ADD CONSTRAINT fk_user_business_groups_business_group_id FOREIGN KEY (business_group_id) REFERENCES business_groups(id);
ALTER TABLE user_business_groups ADD CONSTRAINT fk_user_business_groups_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id);
ALTER TABLE user_business_groups ADD CONSTRAINT fk_user_business_groups_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE user_business_groups ADD CONSTRAINT fk_user_business_groups_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- ========================================
-- 步骤4: 创建联系消息表
-- ========================================

CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGSERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id BIGINT,
    business_group_id BIGINT,
    name VARCHAR(64) NOT NULL,
    email VARCHAR(64) NOT NULL,
    phone VARCHAR(16),
    subject VARCHAR(128) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    ip_address VARCHAR(32),
    user_agent TEXT,
    replied_at TIMESTAMP NULL,
    replied_by BIGINT,
    assigned_to BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 为contact_messages表创建更新时间触发器
CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON contact_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加检查约束（模拟MySQL的ENUM）
ALTER TABLE contact_messages ADD CONSTRAINT chk_contact_status CHECK (status IN ('pending', 'processing', 'replied', 'closed'));
ALTER TABLE contact_messages ADD CONSTRAINT chk_contact_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- 创建索引
CREATE INDEX idx_contact_messages_user_id ON contact_messages(user_id);
CREATE INDEX idx_contact_messages_business_group_id ON contact_messages(business_group_id);
CREATE INDEX idx_contact_messages_email ON contact_messages(email);
CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_contact_messages_priority ON contact_messages(priority);
CREATE INDEX idx_contact_messages_assigned_to ON contact_messages(assigned_to);
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX idx_contact_messages_deleted ON contact_messages(deleted);
CREATE INDEX idx_contact_messages_created_by ON contact_messages(created_by);
CREATE INDEX idx_contact_messages_updated_by ON contact_messages(updated_by);

-- 添加外键约束
ALTER TABLE contact_messages ADD CONSTRAINT fk_contact_messages_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE contact_messages ADD CONSTRAINT fk_contact_messages_business_group_id FOREIGN KEY (business_group_id) REFERENCES business_groups(id);
ALTER TABLE contact_messages ADD CONSTRAINT fk_contact_messages_replied_by FOREIGN KEY (replied_by) REFERENCES users(id);
ALTER TABLE contact_messages ADD CONSTRAINT fk_contact_messages_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id);
ALTER TABLE contact_messages ADD CONSTRAINT fk_contact_messages_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE contact_messages ADD CONSTRAINT fk_contact_messages_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 注释说明
COMMENT ON TABLE business_groups IS '业务组表';
COMMENT ON COLUMN business_groups.group_name IS '业务组名称';
COMMENT ON COLUMN business_groups.group_email IS '业务组邮箱';
COMMENT ON COLUMN business_groups.description IS '业务组描述';
COMMENT ON COLUMN business_groups.is_default IS '是否为默认组';
COMMENT ON COLUMN business_groups.status IS '状态';
COMMENT ON COLUMN business_groups.created_by IS '创建人ID';
COMMENT ON COLUMN business_groups.updated_by IS '更新人ID';

COMMENT ON TABLE user_business_groups IS '用户业务组关联表';
COMMENT ON COLUMN user_business_groups.user_id IS '用户ID';
COMMENT ON COLUMN user_business_groups.business_group_id IS '业务组ID';
COMMENT ON COLUMN user_business_groups.assigned_at IS '分配时间';
COMMENT ON COLUMN user_business_groups.assigned_by IS '分配人ID';
COMMENT ON COLUMN user_business_groups.created_by IS '创建人ID';
COMMENT ON COLUMN user_business_groups.updated_by IS '更新人ID';

COMMENT ON TABLE contact_messages IS '联系消息表';
COMMENT ON COLUMN contact_messages.user_id IS '关联用户ID（如果是注册用户）';
COMMENT ON COLUMN contact_messages.business_group_id IS '处理业务组ID';
COMMENT ON COLUMN contact_messages.name IS '联系人姓名';
COMMENT ON COLUMN contact_messages.email IS '联系人邮箱';
COMMENT ON COLUMN contact_messages.phone IS '联系人电话';
COMMENT ON COLUMN contact_messages.subject IS '消息主题';
COMMENT ON COLUMN contact_messages.message IS '消息内容';
COMMENT ON COLUMN contact_messages.status IS '处理状态';
COMMENT ON COLUMN contact_messages.priority IS '优先级';
COMMENT ON COLUMN contact_messages.ip_address IS '提交者IP地址';
COMMENT ON COLUMN contact_messages.user_agent IS '用户代理信息';
COMMENT ON COLUMN contact_messages.replied_at IS '回复时间';
COMMENT ON COLUMN contact_messages.replied_by IS '回复人ID';
COMMENT ON COLUMN contact_messages.assigned_to IS '分配给的业务人员ID';
COMMENT ON COLUMN contact_messages.created_by IS '创建人ID';
COMMENT ON COLUMN contact_messages.updated_by IS '更新人ID';

-- ========================================
-- 步骤5: 插入默认业务组数据
-- ========================================

-- 插入默认业务组（如果不存在）
-- 注意：PostgreSQL使用ON CONFLICT替代MySQL的INSERT IGNORE
INSERT INTO business_groups (guid, group_name, group_email, description, is_default, status)
VALUES (
    gen_random_uuid(),
    '默认业务组',
    'default@company.com',
    '系统默认业务组，新用户自动分配到此组',
    1,
    'active'
)
ON CONFLICT (group_name) WHERE deleted = FALSE DO NOTHING;