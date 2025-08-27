-- 添加外部视频字段到 products 表
-- 执行日期: 2025-08-24
-- 描述: 为产品表添加 outside_video 字段，用于存储外部视频链接（YouTube、Vimeo等）

-- 开始事务
BEGIN;

-- 添加 outside_video 字段
ALTER TABLE products 
ADD COLUMN outside_video VARCHAR(512) DEFAULT NULL;

-- 添加字段注释
COMMENT ON COLUMN products.outside_video IS '外部视频链接(YouTube、Vimeo等)';

-- 验证字段是否添加成功
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'outside_video'
    ) THEN
        RAISE NOTICE 'SUCCESS: outside_video 字段已成功添加到 products 表';
    ELSE
        RAISE EXCEPTION 'ERROR: outside_video 字段添加失败';
    END IF;
END $$;

-- 提交事务
COMMIT;

-- 显示表结构以确认更改
\d products;