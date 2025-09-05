-- 为shippingfee_factor表添加续重重量字段
-- 创建时间: 2025-09-05
-- 描述: 在运费系数表中添加additional_weight字段，用于存储续重重量

-- 添加续重重量字段
ALTER TABLE shippingfee_factor 
ADD COLUMN continued_weight DECIMAL(10, 3) NOT NULL DEFAULT 0.000;

-- 添加字段注释
COMMENT ON COLUMN shippingfee_factor.continued_weight IS '续重重量（千克）';

-- 验证字段是否添加成功
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'shippingfee_factor' 
AND column_name = 'continued_weight';