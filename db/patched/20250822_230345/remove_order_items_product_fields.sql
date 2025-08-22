-- 移除order_items表的product_name和product_code字段
-- 创建时间: 2025-01-21
-- 说明: 这些字段将通过JOIN products表来获取，不再在order_items表中冗余存储

-- 移除product_code字段
ALTER TABLE order_items DROP COLUMN IF EXISTS product_code;

-- 移除product_name字段
ALTER TABLE order_items DROP COLUMN IF EXISTS product_name;

-- 验证字段已被移除
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
  AND table_schema = 'public'
  AND column_name IN ('product_code', 'product_name');

-- 如果上述查询返回空结果，说明字段已成功移除