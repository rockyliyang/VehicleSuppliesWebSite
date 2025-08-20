-- Patch: 添加运费系数表 shippingfee_factor
-- Date: 2025-01-19 12:00:00
-- Description: 为物流公司添加运费系数配置表，支持按默认、标签、国家三种方式设置运费系数

-- 运费系数表
CREATE TABLE IF NOT EXISTS shippingfee_factor (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  logistics_companies_id BIGINT NOT NULL,
  tags_id BIGINT DEFAULT NULL,
  country_id BIGINT DEFAULT NULL,
  initial_weight DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
  initial_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  throw_ratio_coefficient DECIMAL(10, 3) NOT NULL DEFAULT 1.000,
  surcharge DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  surcharge2 DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  other_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE shippingfee_factor IS '运费系数表';
COMMENT ON COLUMN shippingfee_factor.logistics_companies_id IS '关联的物流公司ID，不能为空';
COMMENT ON COLUMN shippingfee_factor.tags_id IS '关联的标签ID，可为空，用于按标签设置运费系数';
COMMENT ON COLUMN shippingfee_factor.country_id IS '关联的国家ID，可为空，用于按国家设置运费系数';
COMMENT ON COLUMN shippingfee_factor.initial_weight IS '首重重量（千克）';
COMMENT ON COLUMN shippingfee_factor.initial_fee IS '首重费用';
COMMENT ON COLUMN shippingfee_factor.throw_ratio_coefficient IS '抛比系数';
COMMENT ON COLUMN shippingfee_factor.surcharge IS '附加费';
COMMENT ON COLUMN shippingfee_factor.surcharge2 IS '附加费2';
COMMENT ON COLUMN shippingfee_factor.other_fee IS '其他费用';
COMMENT ON COLUMN shippingfee_factor.discount IS '折扣（百分比）';
COMMENT ON COLUMN shippingfee_factor.created_by IS '创建者用户ID';
COMMENT ON COLUMN shippingfee_factor.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_shippingfee_factor_logistics_companies_id ON shippingfee_factor (logistics_companies_id);
CREATE INDEX idx_shippingfee_factor_tags_id ON shippingfee_factor (tags_id);
CREATE INDEX idx_shippingfee_factor_country_id ON shippingfee_factor (country_id);
CREATE INDEX idx_shippingfee_factor_created_by ON shippingfee_factor (created_by);
CREATE INDEX idx_shippingfee_factor_updated_by ON shippingfee_factor (updated_by);

-- 创建唯一约束确保每个物流公司的每个国家/标签/默认只能有一条记录
CREATE UNIQUE INDEX uk_shippingfee_factor_logistics_country ON shippingfee_factor (logistics_companies_id, country_id) 
  WHERE deleted = FALSE AND tags_id IS NULL AND country_id IS NOT NULL;
CREATE UNIQUE INDEX uk_shippingfee_factor_logistics_tag ON shippingfee_factor (logistics_companies_id, tags_id) 
  WHERE deleted = FALSE AND country_id IS NULL AND tags_id IS NOT NULL;
CREATE UNIQUE INDEX uk_shippingfee_factor_logistics_default ON shippingfee_factor (logistics_companies_id) 
  WHERE deleted = FALSE AND tags_id IS NULL AND country_id IS NULL;

-- 添加外键约束
ALTER TABLE shippingfee_factor ADD CONSTRAINT fk_shippingfee_factor_logistics_companies_id FOREIGN KEY (logistics_companies_id) REFERENCES logistics_companies(id);
ALTER TABLE shippingfee_factor ADD CONSTRAINT fk_shippingfee_factor_tags_id FOREIGN KEY (tags_id) REFERENCES tags(id);
ALTER TABLE shippingfee_factor ADD CONSTRAINT fk_shippingfee_factor_country_id FOREIGN KEY (country_id) REFERENCES countries(id);
ALTER TABLE shippingfee_factor ADD CONSTRAINT fk_shippingfee_factor_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE shippingfee_factor ADD CONSTRAINT fk_shippingfee_factor_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 添加约束确保数值的合理性
ALTER TABLE shippingfee_factor ADD CONSTRAINT chk_shippingfee_factor_values CHECK (
  initial_weight >= 0 AND 
  initial_fee >= 0 AND 
  throw_ratio_coefficient > 0 AND 
  surcharge >= 0 AND 
  surcharge2 >= 0 AND 
  other_fee >= 0 AND 
  discount >= 0 AND discount <= 100
);

-- 创建更新时间戳触发器
CREATE TRIGGER update_shippingfee_factor_modtime
    BEFORE UPDATE ON shippingfee_factor
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Patch完成
SELECT 'Patch 20250119_120000_add_shippingfee_factor_table.sql applied successfully' AS status;