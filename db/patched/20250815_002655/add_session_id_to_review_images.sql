-- 为product_review_images表添加session_id字段的迁移脚本
-- 创建时间: 2024-12-19
-- 描述: 添加session_id字段支持评论创建前上传图片

BEGIN;

-- 检查session_id字段是否已存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'product_review_images' 
        AND column_name = 'session_id'
    ) THEN
        -- 添加session_id字段
        ALTER TABLE product_review_images 
        ADD COLUMN session_id VARCHAR(255) DEFAULT NULL;
        
        -- 添加字段注释
        COMMENT ON COLUMN product_review_images.session_id IS '会话ID，用于在评论创建前关联图片';
        
        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_product_review_images_session_id ON product_review_images (session_id);
        
        RAISE NOTICE 'session_id字段已成功添加到product_review_images表';
    ELSE
        RAISE NOTICE 'session_id字段已存在于product_review_images表中';
    END IF;
END
$$;

-- 检查review_id字段是否允许NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'product_review_images' 
        AND column_name = 'review_id'
        AND is_nullable = 'NO'
    ) THEN
        -- 修改review_id字段允许NULL
        ALTER TABLE product_review_images 
        ALTER COLUMN review_id DROP NOT NULL;
        
        -- 更新字段注释
        COMMENT ON COLUMN product_review_images.review_id IS '关联的评论ID，可为空（评论创建前上传图片时）';
        
        RAISE NOTICE 'review_id字段已修改为允许NULL';
    ELSE
        RAISE NOTICE 'review_id字段已允许NULL值';
    END IF;
END
$$;

COMMIT;

-- 验证修改结果
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'product_review_images' 
AND column_name IN ('review_id', 'session_id')
ORDER BY column_name;