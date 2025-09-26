-- 添加供应商表和修改产品表
-- 创建时间: 2025-01-25
-- 描述: 添加suppliers表，并在products表中添加supplier_id字段

-- 创建供应商表
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(100) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  contact_phone1 VARCHAR(50) DEFAULT NULL,
  contact_phone2 VARCHAR(50) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  website VARCHAR(255) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT NOT NULL,
  updated_by BIGINT NOT NULL
);

-- 添加表注释
COMMENT ON TABLE suppliers IS '供应商信息表';
COMMENT ON COLUMN suppliers.id IS '主键ID';
COMMENT ON COLUMN suppliers.guid IS '全局唯一标识符';
COMMENT ON COLUMN suppliers.name IS '供应商名称';
COMMENT ON COLUMN suppliers.contact_person IS '联系人姓名';
COMMENT ON COLUMN suppliers.address IS '供应商地址';
COMMENT ON COLUMN suppliers.contact_phone1 IS '联系电话1';
COMMENT ON COLUMN suppliers.contact_phone2 IS '联系电话2';
COMMENT ON COLUMN suppliers.email IS '邮箱地址';
COMMENT ON COLUMN suppliers.website IS '网站地址';
COMMENT ON COLUMN suppliers.notes IS '备注信息';
COMMENT ON COLUMN suppliers.created_at IS '创建时间';
COMMENT ON COLUMN suppliers.updated_at IS '更新时间';
COMMENT ON COLUMN suppliers.deleted IS '软删除标记';
COMMENT ON COLUMN suppliers.created_by IS '创建者用户ID';
COMMENT ON COLUMN suppliers.updated_by IS '最后更新者用户ID';

-- 创建唯一索引
CREATE UNIQUE INDEX unique_active_supplier_name ON suppliers (name) WHERE deleted = FALSE;

-- 创建普通索引
CREATE INDEX idx_suppliers_created_by ON suppliers (created_by);
CREATE INDEX idx_suppliers_updated_by ON suppliers (updated_by);
CREATE INDEX idx_suppliers_email ON suppliers (email);

-- 添加外键约束
ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_suppliers_modtime
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 在products表中添加supplier_id字段
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id BIGINT DEFAULT NULL;

-- 在products表中添加source_url字段
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_url VARCHAR(2048) DEFAULT NULL;

-- 添加字段注释
COMMENT ON COLUMN products.supplier_id IS '供应商ID';
COMMENT ON COLUMN products.source_url IS '产品来源链接';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products (supplier_id);

-- 添加外键约束
ALTER TABLE products ADD CONSTRAINT fk_products_supplier_id FOREIGN KEY (supplier_id) REFERENCES suppliers(id);