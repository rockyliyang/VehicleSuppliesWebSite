-- 添加is_default字段到logistics_companies表
-- 创建时间: 2025-08-18 11:25:04
-- 描述: 为物流公司表添加is_default字段，用于标识默认物流公司

-- 添加is_default字段
ALTER TABLE logistics_companies 
ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;

-- 添加字段注释
COMMENT ON COLUMN logistics_companies.is_default IS '是否为默认物流公司';

-- 创建索引
CREATE INDEX idx_logistics_companies_is_default ON logistics_companies (is_default);

-- 添加唯一约束，确保只有一个默认物流公司
CREATE UNIQUE INDEX uk_logistics_companies_is_default 
ON logistics_companies (is_default) 
WHERE is_default = TRUE AND deleted = FALSE;

-- 如果存在物流公司且没有默认公司，将第一个启用的公司设为默认
DO $$
BEGIN
    -- 检查是否存在物流公司但没有默认公司
    IF EXISTS (
        SELECT 1 FROM logistics_companies 
        WHERE deleted = FALSE AND is_active = TRUE
    ) AND NOT EXISTS (
        SELECT 1 FROM logistics_companies 
        WHERE deleted = FALSE AND is_default = TRUE
    ) THEN
        -- 将第一个启用的公司设为默认
        UPDATE logistics_companies 
        SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE id = (
            SELECT id FROM logistics_companies 
            WHERE deleted = FALSE AND is_active = TRUE 
            ORDER BY created_at ASC 
            LIMIT 1
        );
    END IF;
END $$;