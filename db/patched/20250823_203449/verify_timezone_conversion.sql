-- 时区转换验证脚本
-- 用于在转换前后验证数据的正确性
-- 执行日期: 2025-08-23

-- ========================================
-- 转换前验证脚本
-- ========================================

-- 1. 检查各表的时间字段数据样本（转换前）
DO $$
BEGIN
    RAISE NOTICE '=========================================';
    RAISE NOTICE '转换前数据检查开始: %', NOW();
    RAISE NOTICE '=========================================';
END $$;

-- 检查users表的时间数据
DO $$
DECLARE
    sample_record RECORD;
BEGIN
    RAISE NOTICE '--- users表时间数据样本 ---';
    FOR sample_record IN 
        SELECT id, created_at, updated_at 
        FROM users 
        WHERE created_at IS NOT NULL 
        ORDER BY created_at DESC 
        LIMIT 5
    LOOP
        RAISE NOTICE 'ID: %, created_at: %, updated_at: %', 
            sample_record.id, sample_record.created_at, sample_record.updated_at;
    END LOOP;
END $$;

-- 检查orders表的时间数据
DO $$
DECLARE
    sample_record RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        RAISE NOTICE '--- orders表时间数据样本 ---';
        FOR sample_record IN 
            SELECT id, created_at, updated_at, 
                   CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paid_at') 
                        THEN (SELECT paid_at FROM orders o WHERE o.id = orders.id) 
                        ELSE NULL END as paid_at
            FROM orders 
            WHERE created_at IS NOT NULL 
            ORDER BY created_at DESC 
            LIMIT 5
        LOOP
            RAISE NOTICE 'ID: %, created_at: %, updated_at: %, paid_at: %', 
                sample_record.id, sample_record.created_at, sample_record.updated_at, sample_record.paid_at;
        END LOOP;
    END IF;
END $$;

-- 统计各表的记录数量
DO $$
DECLARE
    table_record RECORD;
    record_count INTEGER;
BEGIN
    RAISE NOTICE '--- 各表记录数量统计 ---';
    
    FOR table_record IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE column_name IN ('created_at', 'updated_at') 
        AND table_schema = 'public'
        ORDER BY table_name
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', table_record.table_name) INTO record_count;
        RAISE NOTICE '表 %: % 条记录', table_record.table_name, record_count;
    END LOOP;
END $$;

-- ========================================
-- 转换后验证脚本
-- ========================================

-- 创建验证函数
CREATE OR REPLACE FUNCTION verify_timezone_conversion()
RETURNS TABLE(table_name TEXT, created_at_nulls BIGINT, updated_at_nulls BIGINT, latest_created_at TIMESTAMP, latest_updated_at TIMESTAMP) AS $$
DECLARE
    table_record RECORD;
    sql_statement TEXT;
BEGIN
    -- 动态查找所有包含created_at和updated_at字段的表
    FOR table_record IN 
        SELECT DISTINCT t.table_name 
        FROM information_schema.columns t
        WHERE t.column_name IN ('created_at', 'updated_at') 
        AND t.table_schema = 'public'
    LOOP
        -- 构建动态SQL查询
        sql_statement := format('
            SELECT ''%s''::TEXT, 
                   (SELECT COUNT(*) FROM %I WHERE created_at IS NULL),
                   (SELECT COUNT(*) FROM %I WHERE updated_at IS NULL),
                   (SELECT MAX(created_at) FROM %I),
                   (SELECT MAX(updated_at) FROM %I)',
            table_record.table_name, 
            table_record.table_name, 
            table_record.table_name, 
            table_record.table_name, 
            table_record.table_name
        );
        
        -- 执行查询并返回结果
        RETURN QUERY EXECUTE sql_statement;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 时间范围检查脚本
-- ========================================

-- 检查时间范围是否合理（转换后应该比转换前早8小时）
CREATE OR REPLACE FUNCTION check_time_ranges()
RETURNS TABLE(table_name TEXT, min_created_at TIMESTAMP, max_created_at TIMESTAMP, min_updated_at TIMESTAMP, max_updated_at TIMESTAMP) AS $$
DECLARE
    table_record RECORD;
    sql_statement TEXT;
BEGIN
    -- 动态查找所有包含created_at和updated_at字段的表
    FOR table_record IN 
        SELECT DISTINCT t.table_name 
        FROM information_schema.columns t
        WHERE t.column_name IN ('created_at', 'updated_at') 
        AND t.table_schema = 'public'
    LOOP
        -- 构建动态SQL查询
        sql_statement := format('
            SELECT ''%s''::TEXT, 
                   (SELECT MIN(created_at) FROM %I WHERE created_at IS NOT NULL),
                   (SELECT MAX(created_at) FROM %I WHERE created_at IS NOT NULL),
                   (SELECT MIN(updated_at) FROM %I WHERE updated_at IS NOT NULL),
                   (SELECT MAX(updated_at) FROM %I WHERE updated_at IS NOT NULL)',
            table_record.table_name, 
            table_record.table_name, 
            table_record.table_name, 
            table_record.table_name, 
            table_record.table_name
        );
        
        -- 执行查询并返回结果
        RETURN QUERY EXECUTE sql_statement;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 使用说明
-- ========================================

/*
使用方法：

1. 转换前验证：
   直接运行本脚本的前半部分（转换前验证脚本）

2. 转换后验证：
   SELECT verify_timezone_conversion();

3. 时间范围检查：
   SELECT check_time_ranges();

4. 清理验证函数（可选）：
   DROP FUNCTION IF EXISTS verify_timezone_conversion();
   DROP FUNCTION IF EXISTS check_time_ranges();
*/

DO $$
BEGIN
    RAISE NOTICE '=========================================';
    RAISE NOTICE '验证脚本加载完成！';
    RAISE NOTICE '请根据需要调用相应的验证函数：';
    RAISE NOTICE '- SELECT verify_timezone_conversion(); -- 转换后验证';
    RAISE NOTICE '- SELECT check_time_ranges(); -- 时间范围检查';
    RAISE NOTICE '=========================================';
END $$;