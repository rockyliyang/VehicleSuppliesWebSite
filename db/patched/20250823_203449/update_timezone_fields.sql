-- 更新所有表的时间字段为UTC时间
-- 执行日期: 2025-08-23
-- 描述: 将所有表的created_at和updated_at字段默认值改为UTC时间，并在orders表中添加时区相关字段

-- 1. 更新update_modified_column函数使用UTC时间
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 更新users表的时间字段类型和默认值
-- 修改created_at字段类型为TIMESTAMPTZ
ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- 修改updated_at字段类型为TIMESTAMPTZ
ALTER TABLE users ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- 3. 更新product_categories表的时间字段类型和默认值
-- 修改created_at字段类型为TIMESTAMPTZ
ALTER TABLE product_categories ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE product_categories ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- 修改updated_at字段类型为TIMESTAMPTZ
ALTER TABLE product_categories ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE product_categories ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- 4. 更新products表的时间字段类型和默认值
-- 修改created_at字段类型为TIMESTAMPTZ
ALTER TABLE products ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE products ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- 修改updated_at字段类型为TIMESTAMPTZ
ALTER TABLE products ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE products ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- 5. 更新product_images表的时间字段类型和默认值
-- 修改created_at字段类型为TIMESTAMPTZ
ALTER TABLE product_images ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE product_images ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- 修改updated_at字段类型为TIMESTAMPTZ
ALTER TABLE product_images ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE product_images ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- 6. 更新product_price_ranges表的时间字段类型和默认值
-- 修改created_at字段类型为TIMESTAMPTZ
ALTER TABLE product_price_ranges ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE product_price_ranges ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- 修改updated_at字段类型为TIMESTAMPTZ
ALTER TABLE product_price_ranges ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE product_price_ranges ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- 7. 更新logistics_companies表的时间字段类型和默认值
-- 修改created_at字段类型为TIMESTAMPTZ
ALTER TABLE logistics_companies ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE logistics_companies ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- 修改updated_at字段类型为TIMESTAMPTZ
ALTER TABLE logistics_companies ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE logistics_companies ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- 8. 更新shippingfee_ranges表的时间字段类型和默认值
-- 修改created_at字段类型为TIMESTAMPTZ
ALTER TABLE shippingfee_ranges ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE shippingfee_ranges ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- 修改updated_at字段类型为TIMESTAMPTZ
ALTER TABLE shippingfee_ranges ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE shippingfee_ranges ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- 9. 更新orders表的时间字段类型和默认值
-- 修改created_at字段类型为TIMESTAMPTZ
ALTER TABLE orders ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE orders ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- 修改updated_at字段类型为TIMESTAMPTZ
ALTER TABLE orders ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE orders ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- 检查并添加orders表的时区相关字段
DO $$
BEGIN
    -- 添加create_time_zone字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'create_time_zone') THEN
        ALTER TABLE orders ADD COLUMN create_time_zone VARCHAR(64) DEFAULT NULL;
    END IF;
    
    -- 添加paid_at字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paid_at') THEN
        ALTER TABLE orders ADD COLUMN paid_at TIMESTAMPTZ DEFAULT NULL;
    ELSE
        -- 如果字段已存在，修改其类型为TIMESTAMPTZ
        ALTER TABLE orders ALTER COLUMN paid_at TYPE TIMESTAMPTZ USING paid_at AT TIME ZONE 'UTC';
    END IF;
    
    -- 添加paid_time_zone字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paid_time_zone') THEN
        ALTER TABLE orders ADD COLUMN paid_time_zone VARCHAR(64) DEFAULT NULL;
    END IF;
END $$;

-- 10. 更新order_items表的时间字段默认值
ALTER TABLE order_items ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
ALTER TABLE order_items ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');

-- 11. 更新logistics表的时间字段默认值
ALTER TABLE logistics ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
ALTER TABLE logistics ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');

-- 12. 更新carts表的时间字段默认值（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'carts') THEN
        ALTER TABLE carts ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
        ALTER TABLE carts ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
    END IF;
END $$;

-- 13. 更新inquiries表的时间字段默认值（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inquiries') THEN
        ALTER TABLE inquiries ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
        ALTER TABLE inquiries ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
    END IF;
END $$;

-- 14. 更新inquiry_items表的时间字段默认值（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inquiry_items') THEN
        ALTER TABLE inquiry_items ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
        ALTER TABLE inquiry_items ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
    END IF;
END $$;

-- 15. 更新countries表的时间字段默认值（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'countries') THEN
        ALTER TABLE countries ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
        ALTER TABLE countries ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
    END IF;
END $$;

-- 16. 更新states表的时间字段默认值（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'states') THEN
        ALTER TABLE states ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
        ALTER TABLE states ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
    END IF;
END $$;

-- 17. 更新tags表的时间字段默认值（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') THEN
        ALTER TABLE tags ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
        ALTER TABLE tags ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
    END IF;
END $$;

-- 18. 动态处理其他包含created_at和updated_at字段的表
DO $$
DECLARE
    table_record RECORD;
    sql_command TEXT;
BEGIN
    -- 查找所有包含created_at或updated_at字段的表，排除已处理的表
    FOR table_record IN
        SELECT DISTINCT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name IN ('created_at', 'updated_at')
        AND table_name NOT IN (
            'users', 'product_categories', 'products', 'product_images', 
            'product_price_ranges', 'logistics_companies', 'shippingfee_ranges',
            'orders', 'order_items', 'logistics', 'carts', 'inquiries', 
            'inquiry_items', 'countries', 'states', 'tags'
        )
    LOOP
        -- 处理created_at字段
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = table_record.table_name 
            AND column_name = 'created_at'
        ) THEN
            -- 修改字段类型为TIMESTAMPTZ
            sql_command := 'ALTER TABLE ' || table_record.table_name || ' ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE ''UTC''';
            EXECUTE sql_command;
            -- 设置默认值
            sql_command := 'ALTER TABLE ' || table_record.table_name || ' ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP';
            EXECUTE sql_command;
            RAISE NOTICE 'Updated created_at type and default for table: %', table_record.table_name;
        END IF;
        
        -- 处理updated_at字段
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = table_record.table_name 
            AND column_name = 'updated_at'
        ) THEN
            -- 修改字段类型为TIMESTAMPTZ
            sql_command := 'ALTER TABLE ' || table_record.table_name || ' ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE ''UTC''';
            EXECUTE sql_command;
            -- 设置默认值
            sql_command := 'ALTER TABLE ' || table_record.table_name || ' ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP';
            EXECUTE sql_command;
            RAISE NOTICE 'Updated updated_at type and default for table: %', table_record.table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed updating timezone fields for all tables';
END $$;

-- 添加注释说明
COMMENT ON COLUMN orders.create_time_zone IS '订单创建时的时区信息';
COMMENT ON COLUMN orders.paid_at IS '支付完成时间（UTC时间）';
COMMENT ON COLUMN orders.paid_time_zone IS '支付完成时的时区信息';

-- 完成提示
SELECT 'UTC时区更新完成！所有表的created_at和updated_at字段已设置为UTC时间，orders表已添加时区相关字段。' AS status;