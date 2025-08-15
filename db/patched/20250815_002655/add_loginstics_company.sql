
-- 物流公司表
CREATE TABLE IF NOT EXISTS logistics_companies (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  contact_phone VARCHAR(32),
  contact_email VARCHAR(128),
  website VARCHAR(256),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE logistics_companies IS '物流公司信息表';
COMMENT ON COLUMN logistics_companies.name IS '物流公司名称';
COMMENT ON COLUMN logistics_companies.description IS '物流公司描述';
COMMENT ON COLUMN logistics_companies.contact_phone IS '联系电话';
COMMENT ON COLUMN logistics_companies.contact_email IS '联系邮箱';
COMMENT ON COLUMN logistics_companies.website IS '官方网站';
COMMENT ON COLUMN logistics_companies.is_active IS '是否启用';
COMMENT ON COLUMN logistics_companies.created_by IS '创建者用户ID';
COMMENT ON COLUMN logistics_companies.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_logistics_companies_name ON logistics_companies (name);
CREATE INDEX idx_logistics_companies_is_active ON logistics_companies (is_active);
CREATE INDEX idx_logistics_companies_created_by ON logistics_companies (created_by);
CREATE INDEX idx_logistics_companies_updated_by ON logistics_companies (updated_by);

-- 添加外键约束
ALTER TABLE logistics_companies ADD CONSTRAINT fk_logistics_companies_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE logistics_companies ADD CONSTRAINT fk_logistics_companies_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_logistics_companies_modtime
    BEFORE UPDATE ON logistics_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

drop table if exists logistics;

-- 物流信息表
CREATE TABLE IF NOT EXISTS logistics (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  order_id BIGINT NOT NULL,
  logistics_company_id BIGINT,
  shipping_no VARCHAR(128),
  shipping_name VARCHAR(128) NOT NULL,
  shipping_phone VARCHAR(32) NOT NULL,
  shipping_email VARCHAR(128) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_zip_code VARCHAR(16) NOT NULL DEFAULT '',
  shipping_status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, processing, shipped, in_transit, delivered, exception
  tracking_info TEXT, -- JSON格式存储跟踪信息
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE logistics IS '物流信息表';
COMMENT ON COLUMN logistics.order_id IS '关联的订单ID';
COMMENT ON COLUMN logistics.logistics_company_id IS '物流公司ID';
COMMENT ON COLUMN logistics.shipping_no IS '物流单号';
COMMENT ON COLUMN logistics.shipping_name IS '收货人姓名';
COMMENT ON COLUMN logistics.shipping_phone IS '收货人电话';
COMMENT ON COLUMN logistics.shipping_email IS '收货人邮箱';
COMMENT ON COLUMN logistics.shipping_address IS '收货地址';
COMMENT ON COLUMN logistics.shipping_zip_code IS '邮政编码';
COMMENT ON COLUMN logistics.shipping_status IS '物流状态：pending-待处理, processing-处理中, shipped-已发货, in_transit-运输中, delivered-已送达, exception-异常';
COMMENT ON COLUMN logistics.tracking_info IS '跟踪信息，JSON格式';
COMMENT ON COLUMN logistics.notes IS '备注信息';
COMMENT ON COLUMN logistics.created_by IS '创建者用户ID';
COMMENT ON COLUMN logistics.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_logistics_order_id ON logistics (order_id);
CREATE INDEX idx_logistics_company_id ON logistics (logistics_company_id);
CREATE INDEX idx_logistics_shipping_no ON logistics (shipping_no);
CREATE INDEX idx_logistics_shipping_status ON logistics (shipping_status);
CREATE INDEX idx_logistics_created_at ON logistics (created_at);
CREATE INDEX idx_logistics_created_by ON logistics (created_by);
CREATE INDEX idx_logistics_updated_by ON logistics (updated_by);

-- 添加外键约束
ALTER TABLE logistics ADD CONSTRAINT fk_logistics_order_id FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE logistics ADD CONSTRAINT fk_logistics_company_id FOREIGN KEY (logistics_company_id) REFERENCES logistics_companies(id);
ALTER TABLE logistics ADD CONSTRAINT fk_logistics_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE logistics ADD CONSTRAINT fk_logistics_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_logistics_modtime
    BEFORE UPDATE ON logistics
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
