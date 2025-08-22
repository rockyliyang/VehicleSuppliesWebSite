-- 数据库补丁脚本: 为 orders 表添加 inquiry_id 字段
-- 创建日期: 2025-08-20
-- 说明: 添加询价单ID字段，用于关联订单和询价单

-- 检查字段是否已存在，如果不存在则添加
DO $$
BEGIN
    -- 检查 inquiry_id 字段是否存在
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'inquiry_id'
    ) THEN
        -- 添加 inquiry_id 字段
        ALTER TABLE orders 
        ADD COLUMN inquiry_id BIGINT DEFAULT NULL;
        
        -- 添加字段注释
        COMMENT ON COLUMN orders.inquiry_id IS '关联的询价单ID';
        
        -- 创建索引
        CREATE INDEX idx_orders_inquiry_id ON orders (inquiry_id);
        
        -- 添加外键约束（如果 inquiries 表存在）
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = 'inquiries'
        ) THEN
            ALTER TABLE orders 
            ADD CONSTRAINT fk_orders_inquiry_id 
            FOREIGN KEY (inquiry_id) REFERENCES inquiries(id);
        END IF;
        
        RAISE NOTICE 'inquiry_id 字段已成功添加到 orders 表';
    ELSE
        RAISE NOTICE 'inquiry_id 字段已存在于 orders 表中';
    END IF;
END $$;