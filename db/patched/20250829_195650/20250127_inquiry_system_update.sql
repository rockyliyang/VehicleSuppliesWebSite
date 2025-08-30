-- 询价系统更新补丁
-- 修改日期: 2025-01-27
-- 说明: 更新inquiries表状态约束和添加update_price_time字段

-- 修改inquiries表的status字段默认值和约束
ALTER TABLE inquiries 
    DROP CONSTRAINT IF EXISTS chk_inquiry_status;

ALTER TABLE inquiries 
    ADD CONSTRAINT chk_inquiry_status
    CHECK (status IN ('inquiried', 'paid'));

-- 如果update_price_time字段不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inquiries' 
        AND column_name = 'update_price_time'
    ) THEN
        ALTER TABLE inquiries 
            ADD COLUMN update_price_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 更新现有记录的update_price_time字段（如果为空）
UPDATE inquiries 
SET update_price_time = CURRENT_TIMESTAMP 
WHERE update_price_time IS NULL;

-- 添加注释
COMMENT ON COLUMN inquiries.update_price_time IS '报价更新时间，用于48小时价格过期检查';

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_inquiries_update_price_time ON inquiries(update_price_time);