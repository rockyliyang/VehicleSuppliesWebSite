-- 数据库补丁脚本：为 inquiry_messages 表的 sender_type 字段添加约束
-- 创建时间: 2024年
-- 说明: 确保 sender_type 字段只能是 'user' 或 'admin'

-- 检查约束是否已存在，如果不存在则添加
DO $$
BEGIN
    -- 检查约束是否存在
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_sender_type' 
        AND table_name = 'inquiry_messages'
    ) THEN
        -- 添加约束
        ALTER TABLE inquiry_messages 
        ADD CONSTRAINT chk_sender_type 
        CHECK (sender_type IN ('user', 'admin'));
        
        RAISE NOTICE 'Added sender_type constraint to inquiry_messages table';
    ELSE
        RAISE NOTICE 'sender_type constraint already exists on inquiry_messages table';
    END IF;
END $$;

-- 检查并修复可能存在的不符合约束的数据
-- 将任何不是 'user' 或 'admin' 的 sender_type 值修正为 'user'
UPDATE inquiry_messages 
SET sender_type = 'user', updated_at = NOW()
WHERE sender_type NOT IN ('user', 'admin') 
AND deleted = false;

-- 显示修复结果
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'No invalid sender_type values found'
        ELSE CONCAT('Fixed ', COUNT(*), ' invalid sender_type values')
    END as result
FROM inquiry_messages 
WHERE sender_type NOT IN ('user', 'admin') 
AND deleted = false;

-- 验证约束
SELECT 
    constraint_name,
    table_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'chk_sender_type' 
AND table_name = 'inquiry_messages';