-- 为inquiries表添加user_inquiry_id字段
-- 用于实现用户级别的询价单编号

USE vehicle_supplies_db;

-- 添加user_inquiry_id字段
ALTER TABLE inquiries 
ADD COLUMN user_inquiry_id INT DEFAULT NULL COMMENT '用户级别的询价单编号' 
AFTER user_id;

-- 为现有数据生成user_inquiry_id
-- 使用ROW_NUMBER()为每个用户的询价单按创建时间顺序编号
SET @row_number = 0;
SET @prev_user_id = '';

UPDATE inquiries 
SET user_inquiry_id = (
  SELECT user_inquiry_number 
  FROM (
    SELECT 
      id,
      user_id,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as user_inquiry_number
    FROM inquiries 
    WHERE deleted = FALSE
  ) as numbered_inquiries 
  WHERE numbered_inquiries.id = inquiries.id
)
WHERE deleted = FALSE;

-- 添加索引以优化查询性能
CREATE INDEX idx_user_inquiry_id ON inquiries(user_id, user_inquiry_id);

-- 添加复合唯一索引确保同一用户的user_inquiry_id不重复
ALTER TABLE inquiries 
ADD CONSTRAINT uk_user_inquiry_id 
UNIQUE (user_id, user_inquiry_id);