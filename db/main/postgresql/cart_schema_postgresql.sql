-- PostgreSQL版本的购物车架构
-- 从MySQL转换而来，严格保持原有字段名称和结构
-- 转换日期: 2024年

CREATE TABLE IF NOT EXISTS cart_items (
    id BIGSERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
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

-- 为cart_items表创建更新时间触发器
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加外键约束
ALTER TABLE cart_items ADD CONSTRAINT fk_cart_items_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE cart_items ADD CONSTRAINT fk_cart_items_product_id FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE cart_items ADD CONSTRAINT fk_cart_items_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE cart_items ADD CONSTRAINT fk_cart_items_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建索引
CREATE INDEX idx_cart_items_created_by ON cart_items(created_by);
CREATE INDEX idx_cart_items_updated_by ON cart_items(updated_by);

-- 创建唯一索引（模拟MySQL的虚拟列unique_active_user_product）
CREATE UNIQUE INDEX unique_active_user_product ON cart_items(user_id, product_id) WHERE deleted = FALSE;

-- 注释说明
COMMENT ON TABLE cart_items IS '购物车项目表';
COMMENT ON COLUMN cart_items.created_by IS '创建者用户ID';
COMMENT ON COLUMN cart_items.updated_by IS '最后更新者用户ID';