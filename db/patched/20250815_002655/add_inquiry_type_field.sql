-- 数据库补丁脚本: 为 inquiries 表添加 inquiry_type 字段
-- 创建日期: 2024年
-- 说明: 添加询价类型字段，区分单品询价(single)和自定义询价(custom)

-- 检查字段是否已存在，如果不存在则添加
DO $$
BEGIN
    -- 检查 inquiry_type 字段是否存在
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inquiries' 
        AND column_name = 'inquiry_type'
    ) THEN
        -- 添加 inquiry_type 字段
        ALTER TABLE inquiries 
        ADD COLUMN inquiry_type VARCHAR(16) DEFAULT 'custom';
        
        -- 添加检查约束
        ALTER TABLE inquiries 
        ADD CONSTRAINT chk_inquiry_type
        CHECK (inquiry_type IN ('single', 'custom'));
        
        -- 创建索引
        CREATE INDEX idx_inquiries_inquiry_type ON inquiries(inquiry_type);
        CREATE INDEX idx_inquiries_type_deleted ON inquiries(inquiry_type, deleted);
        
        -- 添加字段注释
        COMMENT ON COLUMN inquiries.inquiry_type IS '询价类型: single-单品询价, custom-自定义询价';
        
        RAISE NOTICE 'inquiry_type 字段已成功添加到 inquiries 表';
    ELSE
        RAISE NOTICE 'inquiry_type 字段已存在，跳过添加';
    END IF;
END $$;

-- 更新现有数据：将所有现有询价单设置为 custom 类型
UPDATE inquiries 
SET inquiry_type = 'custom' 
WHERE inquiry_type IS NULL;

-- 验证更新结果
DO $$
DECLARE
    total_count INTEGER;
    custom_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM inquiries WHERE deleted = FALSE;
    SELECT COUNT(*) INTO custom_count FROM inquiries WHERE inquiry_type = 'custom' AND deleted = FALSE;
    
    RAISE NOTICE '总询价单数量: %, 自定义询价单数量: %', total_count, custom_count;
END $$;