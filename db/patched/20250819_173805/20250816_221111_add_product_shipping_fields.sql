-- 添加产品物流字段的补丁脚本
-- 执行前请确保备份数据库
-- 创建时间: 2025-01-16 22:11:11

-- 添加产品物流相关字段到products表
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_length DECIMAL(8, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_width DECIMAL(8, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_height DECIMAL(8, 2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_weight DECIMAL(8, 3) DEFAULT NULL;

-- 添加字段注释
COMMENT ON COLUMN products.product_length IS '产品单件长度(cm)';
COMMENT ON COLUMN products.product_width IS '产品单件宽度(cm)';
COMMENT ON COLUMN products.product_height IS '产品单件高度(cm)';
COMMENT ON COLUMN products.product_weight IS '产品单件重量(kg)';

-- 验证字段是否添加成功
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('product_length', 'product_width', 'product_height', 'product_weight')
ORDER BY column_name;


-- 运费范围表
CREATE TABLE IF NOT EXISTS shippingfee_ranges (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  country_id BIGINT DEFAULT NULL,
  tags_id BIGINT DEFAULT NULL,
  logistics_companies_id BIGINT NOT NULL,
  unit VARCHAR(8) NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg', 'g', 'cm', 'm')),
  min_value DECIMAL(10, 3) NOT NULL,
  max_value DECIMAL(10, 3) DEFAULT NULL, -- NULL表示无上限
  fee DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON COLUMN shippingfee_ranges.country_id IS '关联的国家ID，可为空表示适用于所有国家';
COMMENT ON COLUMN shippingfee_ranges.tags_id IS '关联的标签ID，可为空，用于按标签分组运费范围';
COMMENT ON COLUMN shippingfee_ranges.logistics_companies_id IS '关联的物流公司ID';
COMMENT ON COLUMN shippingfee_ranges.unit IS '计量单位：kg-千克，g-克，cm-厘米，m-米';
COMMENT ON COLUMN shippingfee_ranges.min_value IS '范围下限（包含）';
COMMENT ON COLUMN shippingfee_ranges.max_value IS '范围上限（包含），NULL表示无上限';
COMMENT ON COLUMN shippingfee_ranges.fee IS '该范围对应的运费';
COMMENT ON COLUMN shippingfee_ranges.created_by IS '创建者用户ID';
COMMENT ON COLUMN shippingfee_ranges.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX idx_shippingfee_ranges_country_id ON shippingfee_ranges (country_id);
CREATE INDEX idx_shippingfee_ranges_tags_id ON shippingfee_ranges (tags_id);
CREATE INDEX idx_shippingfee_ranges_logistics_companies_id ON shippingfee_ranges (logistics_companies_id);
CREATE INDEX idx_shippingfee_ranges_value_range ON shippingfee_ranges (logistics_companies_id, unit, min_value, max_value);
CREATE INDEX idx_shippingfee_ranges_created_by ON shippingfee_ranges (created_by);
CREATE INDEX idx_shippingfee_ranges_updated_by ON shippingfee_ranges (updated_by);

-- 添加外键约束
ALTER TABLE shippingfee_ranges ADD CONSTRAINT fk_shippingfee_ranges_country_id FOREIGN KEY (country_id) REFERENCES countries(id);
ALTER TABLE shippingfee_ranges ADD CONSTRAINT fk_shippingfee_ranges_tags_id FOREIGN KEY (tags_id) REFERENCES tags(id);
ALTER TABLE shippingfee_ranges ADD CONSTRAINT fk_shippingfee_ranges_logistics_companies_id FOREIGN KEY (logistics_companies_id) REFERENCES logistics_companies(id);
ALTER TABLE shippingfee_ranges ADD CONSTRAINT fk_shippingfee_ranges_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE shippingfee_ranges ADD CONSTRAINT fk_shippingfee_ranges_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 添加约束确保范围的逻辑正确性
ALTER TABLE shippingfee_ranges ADD CONSTRAINT chk_shippingfee_value_range CHECK (
  min_value >= 0 AND 
  (max_value IS NULL OR max_value >= min_value)
);

-- 创建更新时间戳触发器
CREATE TRIGGER update_shippingfee_ranges_modtime
    BEFORE UPDATE ON shippingfee_ranges
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();