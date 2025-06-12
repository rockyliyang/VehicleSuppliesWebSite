-- 移除common_content表的UNIQUE约束脚本
-- 此脚本用于修改现有数据库，去除common_content相关表的唯一性约束

-- 2. 处理 common_content 表
-- 先删除依赖的外键约束
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                  WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'common_content_images' 
                  AND CONSTRAINT_NAME = 'fk_content_images_content_id');

SET @sql = IF(@fk_exists > 0, 
              'ALTER TABLE common_content_images DROP FOREIGN KEY fk_content_images_content_id', 
              'SELECT "Foreign key fk_content_images_content_id does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 删除虚拟列的唯一索引
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                     WHERE TABLE_SCHEMA = DATABASE() 
                     AND TABLE_NAME = 'common_content' 
                     AND INDEX_NAME = 'uk_active_nav_lang');

SET @sql = IF(@index_exists > 0, 
              'ALTER TABLE common_content DROP INDEX uk_active_nav_lang', 
              'SELECT "Index uk_active_nav_lang does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 删除虚拟列
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                      WHERE TABLE_SCHEMA = DATABASE() 
                      AND TABLE_NAME = 'common_content' 
                      AND COLUMN_NAME = 'active_unique_key');

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE common_content DROP COLUMN active_unique_key', 
              'SELECT "Column active_unique_key does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 删除原有的唯一索引
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                     WHERE TABLE_SCHEMA = DATABASE() 
                     AND TABLE_NAME = 'common_content' 
                     AND INDEX_NAME = 'uk_nav_lang');

SET @sql = IF(@index_exists > 0, 
              'ALTER TABLE common_content DROP INDEX uk_nav_lang', 
              'SELECT "Index uk_nav_lang does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 重新创建外键约束
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                  WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'common_content_images' 
                  AND CONSTRAINT_NAME = 'fk_content_images_content_id');

SET @sql = IF(@fk_exists = 0, 
              'ALTER TABLE common_content_images ADD CONSTRAINT fk_content_images_content_id FOREIGN KEY (content_id) REFERENCES common_content (id) ON DELETE CASCADE', 
              'SELECT "Foreign key fk_content_images_content_id already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 验证修改结果
SELECT 'Verification: Checking remaining indexes on common_content tables' as message;

SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE,
    CASE WHEN NON_UNIQUE = 0 THEN 'UNIQUE' ELSE 'NON-UNIQUE' END as INDEX_TYPE
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME IN ( 'common_content')
    AND INDEX_NAME != 'PRIMARY'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

SELECT 'Script execution completed. All UNIQUE constraints have been removed from common_content tables.' as result;