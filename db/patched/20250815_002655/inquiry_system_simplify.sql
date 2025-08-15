-- 询价系统简化修改脚本
-- 创建时间: 2024
-- 说明: 移除同步到购物车功能，简化价格字段

USE vehicle_supplies_db;

-- 修改 inquiry_items 表，移除 quoted_price 和 expected_price 字段
ALTER TABLE inquiry_items 
DROP COLUMN IF EXISTS quoted_price,
DROP COLUMN IF EXISTS expected_price;

-- 添加注释说明 unit_price 字段的用途
ALTER TABLE inquiry_items 
MODIFY COLUMN unit_price DECIMAL(10,2) DEFAULT NULL COMMENT '业务员报价（管理员设置的价格）';

-- 更新询价状态枚举值说明
ALTER TABLE inquiries 
MODIFY COLUMN status VARCHAR(16) DEFAULT 'pending' COMMENT '询价状态: pending-待处理, quoted-已报价, approved-已批准, rejected-已拒绝, completed-已完成';

-- 添加 inquiry_items 表的状态字段（可选，用于单个商品的状态管理）
ALTER TABLE inquiry_items 
ADD COLUMN IF NOT EXISTS status VARCHAR(16) DEFAULT 'pending' COMMENT '商品状态: pending-待报价, quoted-已报价, approved-已批准, rejected-已拒绝' AFTER unit_price;

-- 添加索引
ALTER TABLE inquiry_items 
ADD INDEX IF NOT EXISTS idx_status (status);

COMMIT;

-- 说明：
-- 1. 移除了 quoted_price 和 expected_price 字段
-- 2. unit_price 现在作为业务员的报价字段
-- 3. 添加了商品级别的状态管理
-- 4. 移除同步到购物车的相关功能将在后端代码中处理