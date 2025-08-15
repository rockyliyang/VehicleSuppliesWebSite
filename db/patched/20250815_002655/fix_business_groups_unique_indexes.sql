-- ========================================
-- 修复 business_groups 表的唯一索引
-- 使用虚拟字段替代原有的复合唯一索引
-- ========================================

USE vehicle_supplies_db;

-- 删除原有的唯一索引（使用兼容性更好的语法）
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE table_schema = DATABASE() 
   AND table_name = 'business_groups' 
   AND index_name = 'uk_group_name_deleted') > 0,
  'DROP INDEX uk_group_name_deleted ON business_groups',
  'SELECT "Index uk_group_name_deleted does not exist" AS info'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE table_schema = DATABASE() 
   AND table_name = 'business_groups' 
   AND index_name = 'uk_group_email_deleted') > 0,
  'DROP INDEX uk_group_email_deleted ON business_groups',
  'SELECT "Index uk_group_email_deleted does not exist" AS info'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加虚拟字段
ALTER TABLE business_groups 
ADD COLUMN active_unique_group_name VARCHAR(255) AS (
  CASE 
    WHEN deleted = 0 THEN group_name
    ELSE NULL 
  END
) VIRTUAL,
ADD COLUMN active_unique_group_email VARCHAR(255) AS (
  CASE 
    WHEN deleted = 0 THEN group_email
    ELSE NULL 
  END
) VIRTUAL;

-- 在虚拟字段上创建唯一索引
ALTER TABLE business_groups 
ADD UNIQUE KEY uk_active_group_name (active_unique_group_name),
ADD UNIQUE KEY uk_active_group_email (active_unique_group_email);

-- 验证索引创建成功
SHOW INDEX FROM business_groups WHERE Key_name IN ('uk_active_group_name', 'uk_active_group_email');

SELECT 'business_groups 表唯一索引修复完成' AS status;