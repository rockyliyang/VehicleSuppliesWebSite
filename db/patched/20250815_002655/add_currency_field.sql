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
        WHERE table_name = 'users' 
        AND column_name = 'currency'
    ) THEN
        -- 添加currency字段
        ALTER TABLE users ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
        
        -- 添加字段注释
        COMMENT ON COLUMN users.currency IS '用户首选货币，默认USD';
        
        -- 为现有用户设置默认货币
        UPDATE users SET currency = 'USD' WHERE currency IS NULL;
        
        RAISE NOTICE 'Currency field added successfully to users table';
    ELSE
        RAISE NOTICE 'Currency field already exists in users table';
    END IF;
END
$$;

COMMIT;