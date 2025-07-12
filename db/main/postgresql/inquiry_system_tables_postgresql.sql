-- PostgreSQL版本的询价系统数据库表结构
-- 从MySQL转换而来，严格保持原有字段名称和结构
-- 转换日期: 2024年
-- 说明: 用户询价功能相关表

-- 询价单主表
CREATE TABLE IF NOT EXISTS inquiries (
    id BIGSERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    user_inquiry_id INTEGER DEFAULT NULL,
    title VARCHAR(32) DEFAULT '',
    status VARCHAR(16) DEFAULT 'pending',
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT DEFAULT NULL,
    updated_by BIGINT DEFAULT NULL
);

-- 创建更新时间触发器（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为inquiries表创建更新时间触发器
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加检查约束
ALTER TABLE inquiries 
    ADD CONSTRAINT chk_inquiry_status
    CHECK (status IN ('inquiried',  'approved', 'rejected', 'paid'));

-- 创建索引
CREATE INDEX idx_inquiries_guid ON inquiries(guid);
CREATE INDEX idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_deleted ON inquiries(deleted);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at);
CREATE INDEX idx_inquiries_status_deleted ON inquiries(status, deleted);
CREATE INDEX idx_inquiries_created_by ON inquiries(created_by);
CREATE INDEX idx_inquiries_updated_by ON inquiries(updated_by);

-- 创建唯一约束
CREATE UNIQUE INDEX uk_user_inquiry_id ON inquiries(user_id, user_inquiry_id);

-- 添加外键约束
ALTER TABLE inquiries ADD CONSTRAINT fk_inquiries_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE inquiries ADD CONSTRAINT fk_inquiries_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE inquiries ADD CONSTRAINT fk_inquiries_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 询价商品表
CREATE TABLE IF NOT EXISTS inquiry_items (
    id BIGSERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    inquiry_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER DEFAULT NULL,
    unit_price DECIMAL(10,2) DEFAULT NULL,
    
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT DEFAULT NULL,
    updated_by BIGINT DEFAULT NULL
);

-- 为inquiry_items表创建更新时间触发器
CREATE TRIGGER update_inquiry_items_updated_at BEFORE UPDATE ON inquiry_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建唯一索引（模拟MySQL的虚拟列uk_active_inquiry_product）
CREATE UNIQUE INDEX uk_active_inquiry_product ON inquiry_items(inquiry_id, product_id) WHERE deleted = FALSE;

-- 创建索引
CREATE INDEX idx_inquiry_items_guid ON inquiry_items(guid);
CREATE INDEX idx_inquiry_items_inquiry_id ON inquiry_items(inquiry_id);
CREATE INDEX idx_inquiry_items_product_id ON inquiry_items(product_id);
CREATE INDEX idx_inquiry_items_deleted ON inquiry_items(deleted);
CREATE INDEX idx_inquiry_items_created_at ON inquiry_items(created_at);
CREATE INDEX idx_inquiry_items_created_by ON inquiry_items(created_by);
CREATE INDEX idx_inquiry_items_updated_by ON inquiry_items(updated_by);

-- 添加外键约束
ALTER TABLE inquiry_items ADD CONSTRAINT fk_inquiry_items_inquiry_id FOREIGN KEY (inquiry_id) REFERENCES inquiries(id);
ALTER TABLE inquiry_items ADD CONSTRAINT fk_inquiry_items_product_id FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE inquiry_items ADD CONSTRAINT fk_inquiry_items_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE inquiry_items ADD CONSTRAINT fk_inquiry_items_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 询价消息表
CREATE TABLE IF NOT EXISTS inquiry_messages (
    id BIGSERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    inquiry_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    sender_type VARCHAR(8) NOT NULL,
    message_type VARCHAR(8) DEFAULT 'text',
    content TEXT NOT NULL,
    is_read SMALLINT DEFAULT 0,
    
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT DEFAULT NULL,
    updated_by BIGINT DEFAULT NULL
);

-- 为inquiry_messages表创建更新时间触发器
CREATE TRIGGER update_inquiry_messages_updated_at BEFORE UPDATE ON inquiry_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加检查约束
ALTER TABLE inquiry_messages ADD CONSTRAINT chk_sender_type CHECK (sender_type IN ('user', 'admin'));
ALTER TABLE inquiry_messages ADD CONSTRAINT chk_message_type CHECK (message_type IN ('text', 'quote', 'system'));

-- 创建索引
CREATE INDEX idx_inquiry_messages_guid ON inquiry_messages(guid);
CREATE INDEX idx_inquiry_messages_inquiry_id ON inquiry_messages(inquiry_id);
CREATE INDEX idx_inquiry_messages_sender_id ON inquiry_messages(sender_id);
CREATE INDEX idx_inquiry_messages_sender_type ON inquiry_messages(sender_type);
CREATE INDEX idx_inquiry_messages_message_type ON inquiry_messages(message_type);
CREATE INDEX idx_inquiry_messages_deleted ON inquiry_messages(deleted);
CREATE INDEX idx_inquiry_messages_created_at ON inquiry_messages(created_at);
CREATE INDEX idx_inquiry_messages_inquiry_deleted ON inquiry_messages(inquiry_id, deleted);
CREATE INDEX idx_inquiry_messages_is_read ON inquiry_messages(is_read);
CREATE INDEX idx_inquiry_messages_created_by ON inquiry_messages(created_by);
CREATE INDEX idx_inquiry_messages_updated_by ON inquiry_messages(updated_by);

-- 添加外键约束
ALTER TABLE inquiry_messages ADD CONSTRAINT fk_inquiry_messages_inquiry_id FOREIGN KEY (inquiry_id) REFERENCES inquiries(id);
ALTER TABLE inquiry_messages ADD CONSTRAINT fk_inquiry_messages_sender_id FOREIGN KEY (sender_id) REFERENCES users(id);
ALTER TABLE inquiry_messages ADD CONSTRAINT fk_inquiry_messages_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE inquiry_messages ADD CONSTRAINT fk_inquiry_messages_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建索引以优化查询性能
-- 用户询价单查询优化
CREATE INDEX idx_user_status_deleted ON inquiries(user_id, status, deleted);
CREATE INDEX idx_user_inquiry_id ON inquiries(user_id, user_inquiry_id);
-- 询价消息查询优化
CREATE INDEX idx_inquiry_sender_type ON inquiry_messages(inquiry_id, sender_type, deleted);

-- 未读消息统计优化
CREATE INDEX idx_inquiry_read_deleted ON inquiry_messages(inquiry_id, is_read, deleted);

-- 注释说明
COMMENT ON TABLE inquiries IS '询价单主表';
COMMENT ON COLUMN inquiries.id IS '询价单ID';
COMMENT ON COLUMN inquiries.guid IS '全局唯一标识符';
COMMENT ON COLUMN inquiries.user_id IS '用户ID';
COMMENT ON COLUMN inquiries.user_inquiry_id IS '用户级别的询价单编号';
COMMENT ON COLUMN inquiries.title IS '询价单标题';
COMMENT ON COLUMN inquiries.status IS '询价状态: inquiried-已询价, approved-已批准, rejected-已拒绝';
COMMENT ON COLUMN inquiries.total_amount IS '总金额';
COMMENT ON COLUMN inquiries.deleted IS '软删除标记: 0-正常, 1-已删除';
COMMENT ON COLUMN inquiries.created_at IS '创建时间';
COMMENT ON COLUMN inquiries.updated_at IS '更新时间';
COMMENT ON COLUMN inquiries.created_by IS '创建者用户ID';
COMMENT ON COLUMN inquiries.updated_by IS '最后更新者用户ID';

COMMENT ON TABLE inquiry_items IS '询价商品表';
COMMENT ON COLUMN inquiry_items.id IS '询价商品ID';
COMMENT ON COLUMN inquiry_items.guid IS '全局唯一标识符';
COMMENT ON COLUMN inquiry_items.inquiry_id IS '询价单ID';
COMMENT ON COLUMN inquiry_items.product_id IS '商品ID';
COMMENT ON COLUMN inquiry_items.quantity IS '数量';
COMMENT ON COLUMN inquiry_items.unit_price IS '业务员报价（管理员设置的价格）';
COMMENT ON COLUMN inquiry_items.deleted IS '软删除标记: 0-正常, 1-已删除';
COMMENT ON COLUMN inquiry_items.created_at IS '创建时间';
COMMENT ON COLUMN inquiry_items.updated_at IS '更新时间';
COMMENT ON COLUMN inquiry_items.created_by IS '创建者用户ID';
COMMENT ON COLUMN inquiry_items.updated_by IS '最后更新者用户ID';

COMMENT ON TABLE inquiry_messages IS '询价消息表';
COMMENT ON COLUMN inquiry_messages.id IS '消息ID';
COMMENT ON COLUMN inquiry_messages.guid IS '全局唯一标识符';
COMMENT ON COLUMN inquiry_messages.inquiry_id IS '询价单ID';
COMMENT ON COLUMN inquiry_messages.sender_id IS '发送者ID';
COMMENT ON COLUMN inquiry_messages.sender_type IS '发送者类型: user-用户, admin-管理员';
COMMENT ON COLUMN inquiry_messages.message_type IS '消息类型: text-文本, quote-报价, system-系统';
COMMENT ON COLUMN inquiry_messages.content IS '消息内容';
COMMENT ON COLUMN inquiry_messages.is_read IS '是否已读: 0-未读, 1-已读';
COMMENT ON COLUMN inquiry_messages.deleted IS '软删除标记: 0-正常, 1-已删除';
COMMENT ON COLUMN inquiry_messages.created_at IS '创建时间';
COMMENT ON COLUMN inquiry_messages.updated_at IS '更新时间';
COMMENT ON COLUMN inquiry_messages.created_by IS '创建者用户ID';
COMMENT ON COLUMN inquiry_messages.updated_by IS '最后更新者用户ID';