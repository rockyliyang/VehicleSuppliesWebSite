-- 为users表添加business_group_id字段，用于保存普通用户绑定的业务组
-- 这个字段与user_business_groups表不同，user_business_groups用于业务人员的多业务组关联
-- 而business_group_id字段用于普通用户的单一业务组关联

USE vehicle_supplies_db;

-- 添加business_group_id字段
ALTER TABLE users 
ADD COLUMN business_group_id BIGINT DEFAULT NULL COMMENT '普通用户关联的业务组ID（用于联系表单分配）' 
AFTER user_role;

-- 添加索引
ALTER TABLE users 
ADD INDEX idx_business_group_id (business_group_id);

-- 添加外键约束
ALTER TABLE users 
ADD CONSTRAINT fk_users_business_group 
FOREIGN KEY (business_group_id) REFERENCES business_groups(id);

-- 为现有的普通用户设置默认业务组
UPDATE users u
SET business_group_id = (
    SELECT id 
    FROM business_groups 
    WHERE is_default = 1 AND deleted = 0 
    LIMIT 1
)
WHERE u.user_role = 'user' 
  AND u.business_group_id IS NULL 
  AND u.deleted = 0;

SELECT 'users表business_group_id字段添加完成' AS status;