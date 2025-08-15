-- 修改产品类型字段的SQL语句
-- 执行前请确保备份数据库

-- 1. 首先删除现有的检查约束
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_check;

-- 2. 更新现有数据（将旧的类型映射到新的类型）
-- 假设将 'physical' 映射为 'self_operated'，其他类型也映射为 'self_operated'
UPDATE products SET product_type = 'self_operated' WHERE product_type IN ('physical', 'virtual', 'service');

-- 3. 修改字段默认值
ALTER TABLE products ALTER COLUMN product_type SET DEFAULT 'self_operated';

-- 4. 添加新的检查约束
ALTER TABLE products ADD CONSTRAINT products_product_type_check 
CHECK (product_type IN ('self_operated', 'consignment'));

-- 5. 更新字段注释
COMMENT ON COLUMN products.product_type IS '产品类型：self_operated-自营，consignment-代销';

-- 验证修改结果
SELECT DISTINCT product_type FROM products;