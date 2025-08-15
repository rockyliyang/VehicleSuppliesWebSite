
-- 产品关联表（Buy Together功能）
CREATE TABLE IF NOT EXISTS product_links (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  product_id BIGINT NOT NULL,
  link_product_id BIGINT NOT NULL,
  link_type VARCHAR(32) NOT NULL DEFAULT 'buy_together' CHECK (link_type IN ('buy_together')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE product_links IS '产品关联表，用于实现Buy Together等功能';
COMMENT ON COLUMN product_links.product_id IS '主产品ID';
COMMENT ON COLUMN product_links.link_product_id IS '关联产品ID';
COMMENT ON COLUMN product_links.link_type IS '关联类型：buy_together-一起购买';
COMMENT ON COLUMN product_links.sort_order IS '排序字段，数值越大排序越靠前';
COMMENT ON COLUMN product_links.created_by IS '创建者用户ID';
COMMENT ON COLUMN product_links.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（防止重复关联）
CREATE UNIQUE INDEX unique_product_link ON product_links (product_id, link_product_id, link_type) WHERE deleted = FALSE;

-- 创建普通索引
CREATE INDEX idx_product_links_product_id ON product_links (product_id);
CREATE INDEX idx_product_links_link_product_id ON product_links (link_product_id);
CREATE INDEX idx_product_links_link_type ON product_links (link_type);
CREATE INDEX idx_product_links_sort_order ON product_links (sort_order DESC);
CREATE INDEX idx_product_links_created_by ON product_links (created_by);
CREATE INDEX idx_product_links_updated_by ON product_links (updated_by);

-- 添加外键约束
ALTER TABLE product_links ADD CONSTRAINT fk_product_links_product_id FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE product_links ADD CONSTRAINT fk_product_links_link_product_id FOREIGN KEY (link_product_id) REFERENCES products(id);
ALTER TABLE product_links ADD CONSTRAINT fk_product_links_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE product_links ADD CONSTRAINT fk_product_links_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 添加约束防止自关联
ALTER TABLE product_links ADD CONSTRAINT chk_no_self_link CHECK (product_id != link_product_id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_product_links_modtime
    BEFORE UPDATE ON product_links
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();