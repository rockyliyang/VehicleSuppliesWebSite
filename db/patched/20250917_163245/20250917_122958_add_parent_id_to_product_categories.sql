-- 为product_categories表添加parent_id字段的patch脚本
-- 执行日期: 2025-01-17
-- 描述: 为产品分类表添加parent_id字段以支持层级分类结构

-- 开始事务
BEGIN;

-- 1. 为product_categories表添加parent_id字段
ALTER TABLE product_categories 
  ADD COLUMN IF NOT EXISTS parent_id BIGINT DEFAULT NULL;

-- 2. 为parent_id字段添加注释
COMMENT ON COLUMN product_categories.parent_id IS '父级分类ID，NULL表示顶级分类';

-- 3. 创建parent_id字段的索引
CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id ON product_categories (parent_id);

-- 4. 添加外键约束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_product_categories_parent_id' 
        AND table_name = 'product_categories'
    ) THEN
        ALTER TABLE product_categories 
        ADD CONSTRAINT fk_product_categories_parent_id 
        FOREIGN KEY (parent_id) REFERENCES product_categories(id);
    END IF;
END $$;

-- 提交事务
COMMIT;

-- 验证字段是否添加成功
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'product_categories' AND column_name = 'parent_id';

PRINT '产品分类表parent_id字段添加完成';