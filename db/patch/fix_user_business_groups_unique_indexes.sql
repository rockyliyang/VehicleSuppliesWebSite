-- ========================================
-- 修复 user_business_groups 表的唯一索引
-- 使用虚拟字段替代原有的复合唯一索引
-- ========================================

USE vehicle_supplies_db;

-- 删除原有的唯一索引（使用兼容性更好的语法）
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE table_schema = DATABASE() 
   AND table_name = 'user_business_groups' 
   AND index_name = 'uk_user_group_deleted') > 0,
  'DROP INDEX uk_user_group_deleted ON user_business_groups',
  'SELECT "Index uk_user_group_deleted does not exist" AS info'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加虚拟字段
ALTER TABLE user_business_groups 
ADD COLUMN active_unique_user_group VARCHAR(255) AS (
  CASE 
    WHEN deleted = 0 THEN CONCAT(user_id, '-', business_group_id)
    ELSE NULL 
  END
) VIRTUAL;

-- 在虚拟字段上创建唯一索引
ALTER TABLE user_business_groups 
ADD UNIQUE KEY uk_active_user_group (active_unique_user_group);

-- 验证索引创建成功
SHOW INDEX FROM user_business_groups WHERE Key_name = 'uk_active_user_group';

SELECT 'user_business_groups 表唯一索引修复完成' AS status;