-- 订单金额字段更新补丁
-- 修改日期: 2025-01-27
-- 说明: 为orders表添加original_amount字段和update_amount_time字段，更新status约束

-- 如果original_amount字段不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'original_amount'
    ) THEN
        ALTER TABLE orders 
            ADD COLUMN original_amount DECIMAL(10, 2) DEFAULT NULL;
    END IF;
END $$;

-- 重命名update_price_time为update_amount_time（如果存在）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'update_price_time'
    ) THEN
        ALTER TABLE orders 
            RENAME COLUMN update_price_time TO update_amount_time;
    END IF;
END $$;

-- 如果update_amount_time字段不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'update_amount_time'
    ) THEN
        ALTER TABLE orders 
            ADD COLUMN update_amount_time TIMESTAMPTZ DEFAULT NULL;
    END IF;
END $$;

-- 更新status字段约束
DO $$
BEGIN
    -- 删除旧约束（如果存在）
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'orders' 
        AND constraint_type = 'CHECK'
        AND constraint_name LIKE '%status%'
    ) THEN
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
    END IF;
    
    -- 添加新约束
    ALTER TABLE orders 
        ADD CONSTRAINT orders_status_check 
        CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'pay_timeout'));
END $$;

-- 添加注释
COMMENT ON COLUMN orders.original_amount IS '原始订单金额（首次修改价格时保存）';
COMMENT ON COLUMN orders.update_amount_time IS '金额更新时间（修改total_amount或shipping_fee时更新）';

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_orders_original_amount ON orders(original_amount);
CREATE INDEX IF NOT EXISTS idx_orders_update_amount_time ON orders(update_amount_time);

-- 验证字段是否添加成功
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('original_amount', 'update_amount_time');