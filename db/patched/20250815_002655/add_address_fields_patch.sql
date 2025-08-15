-- 为user_addresses、orders、logistics表添加国家、城市、省份、电话国家区号字段的patch脚本
-- 执行日期: 2024年
-- 描述: 为地址相关表添加更详细的地理位置信息字段

-- 开始事务
BEGIN;

-- 1. 为user_addresses表添加新字段
ALTER TABLE user_addresses 
  ADD COLUMN IF NOT EXISTS country VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS state VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS city VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS phone_country_code VARCHAR(8) DEFAULT NULL;

-- 为user_addresses表新字段添加注释
COMMENT ON COLUMN user_addresses.country IS '国家';
COMMENT ON COLUMN user_addresses.state IS '省份/州';
COMMENT ON COLUMN user_addresses.city IS '城市';
COMMENT ON COLUMN user_addresses.phone_country_code IS '电话国家区号';

-- 2. 为orders表添加新字段
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shipping_phone_country_code VARCHAR(8) DEFAULT NULL;

-- 为orders表新字段添加注释
COMMENT ON COLUMN orders.shipping_country IS '收货国家';
COMMENT ON COLUMN orders.shipping_state IS '收货省份/州';
COMMENT ON COLUMN orders.shipping_city IS '收货城市';
COMMENT ON COLUMN orders.shipping_phone_country_code IS '收货电话国家区号';

-- 3. 为logistics表添加新字段
ALTER TABLE logistics 
  ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shipping_phone_country_code VARCHAR(8) DEFAULT NULL;

-- 为logistics表新字段添加注释
COMMENT ON COLUMN logistics.shipping_country IS '收货国家';
COMMENT ON COLUMN logistics.shipping_state IS '收货省份/州';
COMMENT ON COLUMN logistics.shipping_city IS '收货城市';
COMMENT ON COLUMN logistics.shipping_phone_country_code IS '收货电话国家区号';

-- 提交事务
COMMIT;

-- 验证字段是否添加成功
-- 可以使用以下查询来验证字段是否存在：
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name IN ('user_addresses', 'orders', 'logistics') 
--   AND column_name IN ('country', 'state', 'city', 'phone_country_code', 'shipping_country', 'shipping_state', 'shipping_city', 'shipping_phone_country_code')
-- ORDER BY table_name, column_name;

SELECT 'Patch executed successfully: Added address fields to user_addresses, orders, and logistics tables' AS result;