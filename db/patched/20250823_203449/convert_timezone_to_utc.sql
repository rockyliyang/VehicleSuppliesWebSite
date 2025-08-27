-- 将数据库中所有表的created_at和updated_at字段值从东八区时间转换为UTC时间
-- 执行日期: 2025-08-23
-- 描述: 将现有数据中的created_at和updated_at字段值从东八区(Asia/Shanghai)转换为UTC时间
-- 注意: 此脚本假设现有数据存储的是东八区时间，需要减去8小时转换为UTC时间

-- 开始事务
BEGIN;

-- 记录转换开始时间
DO $$
BEGIN
    RAISE NOTICE '开始时区转换: %', NOW();
END $$;

-- 1. 转换users表的时间字段
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- 转换created_at字段（减去8小时）
    UPDATE users 
    SET created_at = created_at - INTERVAL '8 hours'
    WHERE created_at IS NOT NULL;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'users表 created_at 字段转换完成，影响行数: %', affected_rows;
    
    -- 转换updated_at字段（减去8小时）
    UPDATE users 
    SET updated_at = updated_at - INTERVAL '8 hours'
    WHERE updated_at IS NOT NULL;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'users表 updated_at 字段转换完成，影响行数: %', affected_rows;
END $$;

-- 2. 转换product_categories表的时间字段
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_categories') THEN
        UPDATE product_categories 
        SET created_at = created_at - INTERVAL '8 hours'
        WHERE created_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'product_categories表 created_at 字段转换完成，影响行数: %', affected_rows;
        
        UPDATE product_categories 
        SET updated_at = updated_at - INTERVAL '8 hours'
        WHERE updated_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'product_categories表 updated_at 字段转换完成，影响行数: %', affected_rows;
    END IF;
END $$;

-- 3. 转换products表的时间字段
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        UPDATE products 
        SET created_at = created_at - INTERVAL '8 hours'
        WHERE created_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'products表 created_at 字段转换完成，影响行数: %', affected_rows;
        
        UPDATE products 
        SET updated_at = updated_at - INTERVAL '8 hours'
        WHERE updated_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'products表 updated_at 字段转换完成，影响行数: %', affected_rows;
    END IF;
END $$;

-- 4. 转换product_images表的时间字段
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') THEN
        UPDATE product_images 
        SET created_at = created_at - INTERVAL '8 hours'
        WHERE created_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'product_images表 created_at 字段转换完成，影响行数: %', affected_rows;
        
        UPDATE product_images 
        SET updated_at = updated_at - INTERVAL '8 hours'
        WHERE updated_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'product_images表 updated_at 字段转换完成，影响行数: %', affected_rows;
    END IF;
END $$;

-- 5. 转换product_price_ranges表的时间字段
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_price_ranges') THEN
        UPDATE product_price_ranges 
        SET created_at = created_at - INTERVAL '8 hours'
        WHERE created_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'product_price_ranges表 created_at 字段转换完成，影响行数: %', affected_rows;
        
        UPDATE product_price_ranges 
        SET updated_at = updated_at - INTERVAL '8 hours'
        WHERE updated_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'product_price_ranges表 updated_at 字段转换完成，影响行数: %', affected_rows;
    END IF;
END $$;

-- 6. 转换logistics_companies表的时间字段
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'logistics_companies') THEN
        UPDATE logistics_companies 
        SET created_at = created_at - INTERVAL '8 hours'
        WHERE created_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'logistics_companies表 created_at 字段转换完成，影响行数: %', affected_rows;
        
        UPDATE logistics_companies 
        SET updated_at = updated_at - INTERVAL '8 hours'
        WHERE updated_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'logistics_companies表 updated_at 字段转换完成，影响行数: %', affected_rows;
    END IF;
END $$;

-- 7. 转换shippingfee_ranges表的时间字段
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shippingfee_ranges') THEN
        UPDATE shippingfee_ranges 
        SET created_at = created_at - INTERVAL '8 hours'
        WHERE created_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'shippingfee_ranges表 created_at 字段转换完成，影响行数: %', affected_rows;
        
        UPDATE shippingfee_ranges 
        SET updated_at = updated_at - INTERVAL '8 hours'
        WHERE updated_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'shippingfee_ranges表 updated_at 字段转换完成，影响行数: %', affected_rows;
    END IF;
END $$;

-- 8. 转换orders表的时间字段
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        UPDATE orders 
        SET created_at = created_at - INTERVAL '8 hours'
        WHERE created_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'orders表 created_at 字段转换完成，影响行数: %', affected_rows;
        
        UPDATE orders 
        SET updated_at = updated_at - INTERVAL '8 hours'
        WHERE updated_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'orders表 updated_at 字段转换完成，影响行数: %', affected_rows;
        
        -- 如果存在paid_at字段，也需要转换
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paid_at') THEN
            UPDATE orders 
            SET paid_at = paid_at - INTERVAL '8 hours'
            WHERE paid_at IS NOT NULL;
            
            GET DIAGNOSTICS affected_rows = ROW_COUNT;
            RAISE NOTICE 'orders表 paid_at 字段转换完成，影响行数: %', affected_rows;
        END IF;
    END IF;
END $$;

-- 9. 转换order_items表的时间字段
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
        UPDATE order_items 
        SET created_at = created_at - INTERVAL '8 hours'
        WHERE created_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'order_items表 created_at 字段转换完成，影响行数: %', affected_rows;
        
        UPDATE order_items 
        SET updated_at = updated_at - INTERVAL '8 hours'
        WHERE updated_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'order_items表 updated_at 字段转换完成，影响行数: %', affected_rows;
    END IF;
END $$;

-- 10. 转换logistics表的时间字段
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'logistics') THEN
        UPDATE logistics 
        SET created_at = created_at - INTERVAL '8 hours'
        WHERE created_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'logistics表 created_at 字段转换完成，影响行数: %', affected_rows;
        
        UPDATE logistics 
        SET updated_at = updated_at - INTERVAL '8 hours'
        WHERE updated_at IS NOT NULL;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'logistics表 updated_at 字段转换完成，影响行数: %', affected_rows;
    END IF;
END $$;

-- 11. 通用逻辑：动态查找并处理所有包含时间字段的表
DO $$
DECLARE
    table_record RECORD;
    affected_rows INTEGER;
    sql_statement TEXT;
    processed_tables TEXT[] := ARRAY[
        'users', 'product_categories', 'products', 'product_images', 
        'product_price_ranges', 'logistics_companies', 'shippingfee_ranges',
        'orders', 'order_items', 'logistics'
    ];
BEGIN
    -- 查找所有包含created_at和updated_at字段的表（排除已处理的表）
    FOR table_record IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE column_name IN ('created_at', 'updated_at') 
        AND table_schema = 'public'
        AND table_name != ALL(processed_tables)
    LOOP
        -- 转换created_at字段
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = table_record.table_name 
                  AND column_name = 'created_at') THEN
            sql_statement := format('UPDATE %I SET created_at = created_at - INTERVAL ''8 hours'' WHERE created_at IS NOT NULL', table_record.table_name);
            EXECUTE sql_statement;
            GET DIAGNOSTICS affected_rows = ROW_COUNT;
            RAISE NOTICE '已更新表 % 的 created_at 字段，影响 % 行', table_record.table_name, affected_rows;
        END IF;
        
        -- 转换updated_at字段
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = table_record.table_name 
                  AND column_name = 'updated_at') THEN
            sql_statement := format('UPDATE %I SET updated_at = updated_at - INTERVAL ''8 hours'' WHERE updated_at IS NOT NULL', table_record.table_name);
            EXECUTE sql_statement;
            GET DIAGNOSTICS affected_rows = ROW_COUNT;
            RAISE NOTICE '已更新表 % 的 updated_at 字段，影响 % 行', table_record.table_name, affected_rows;
        END IF;
    END LOOP;
    
    RAISE NOTICE '所有表的时区转换已完成！';
END $$;

-- 记录转换完成时间
DO $$
BEGIN
    RAISE NOTICE '时区转换完成: %', NOW();
END $$;

-- 提交事务
COMMIT;

-- 显示完成信息
DO $$
BEGIN
    RAISE NOTICE '=========================================';
    RAISE NOTICE '时区转换脚本执行完成！';
    RAISE NOTICE '所有表的created_at和updated_at字段已从东八区时间转换为UTC时间';
    RAISE NOTICE '转换方式：原时间 - 8小时 = UTC时间';
    RAISE NOTICE '=========================================';
END $$;