-- ========================================
-- 综合修复脚本：使用虚拟字段修复所有表的唯一索引
-- 执行顺序：先修复 business_groups，再修复 user_business_groups
-- ========================================

USE vehicle_supplies_db;

SELECT '开始修复唯一索引，使用虚拟字段替代复合索引' AS status;

-- ========================================
-- 1. 修复 business_groups 表
-- ========================================

SELECT '正在修复 business_groups 表...' AS status;

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

SELECT 'business_groups 表修复完成' AS status;

-- ========================================
-- 2. 修复 user_business_groups 表
-- ========================================

SELECT '正在修复 user_business_groups 表...' AS status;

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

SELECT 'user_business_groups 表修复完成' AS status;

-- ========================================
-- 3. 验证修复结果
-- ========================================

SELECT '验证修复结果...' AS status;

-- 显示 business_groups 表的索引
SELECT 'business_groups 表的唯一索引:' AS info;
SHOW INDEX FROM business_groups WHERE Key_name IN ('uk_active_group_name', 'uk_active_group_email');

-- 显示 user_business_groups 表的索引
SELECT 'user_business_groups 表的唯一索引:' AS info;
SHOW INDEX FROM user_business_groups WHERE Key_name = 'uk_active_user_group';

SELECT '所有表的唯一索引修复完成！' AS final_status;