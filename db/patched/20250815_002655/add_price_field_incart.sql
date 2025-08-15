-- 为users表添加currency字段的patch脚本
-- 执行时间: 2024-01-XX
-- 版本: v1.0.0
-- 描述: 为用户表添加货币偏好字段，默认值为USD

BEGIN;

-- 检查currency字段是否已存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cart_items' 
        AND column_name = 'price'
    ) THEN
        -- 添加price字段
        ALTER TABLE cart_items ADD COLUMN price DECIMAL(10,2) DEFAULT NULL;
        
        -- 添加字段注释
        COMMENT ON COLUMN cart_items.price IS '购物车中的商品价格（支持阶梯价格）';
        
        
        RAISE NOTICE 'Currency field added successfully to users table';
    ELSE
        RAISE NOTICE 'Currency field already exists in users table';
    END IF;
END
$$;

COMMIT;