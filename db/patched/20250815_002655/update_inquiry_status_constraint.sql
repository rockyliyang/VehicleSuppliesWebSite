-- 更新询价状态约束，只允许inquiried、approved、rejected三种状态
-- 执行日期: 2024年

-- 首先删除现有的状态约束
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS chk_inquiry_status;

-- 更新现有数据，将不符合新状态的记录转换
-- pending -> inquiried (待处理改为已询价)
UPDATE inquiries SET status = 'inquiried' WHERE status = 'pending';
-- quoted -> inquiried (已报价改为已询价)
UPDATE inquiries SET status = 'inquiried' WHERE status = 'quoted';
-- completed -> approved (已完成改为已批准)
UPDATE inquiries SET status = 'approved' WHERE status = 'completed';
-- cancelled -> rejected (已取消改为已拒绝)
UPDATE inquiries SET status = 'rejected' WHERE status = 'cancelled';

-- 添加新的状态约束，只允许inquiried、approved、rejected
ALTER TABLE inquiries 
    ADD CONSTRAINT chk_inquiry_status
    CHECK (status IN ('inquiried', 'approved', 'rejected'));

-- 更新注释
COMMENT ON COLUMN inquiries.status IS '询价状态: inquiried-已询价, approved-已批准, rejected-已拒绝';