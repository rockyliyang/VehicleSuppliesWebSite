-- 修复 common_content_nav 和 common_content 表的唯一索引问题
-- 使用虚拟列方式避免软删除记录被判断为重复

-- 1. 修复 common_content_nav 表
-- 检查并删除原有的唯一索引（如果存在）
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                     WHERE TABLE_SCHEMA = DATABASE() 
                     AND TABLE_NAME = 'common_content_nav' 
                     AND INDEX_NAME = 'uk_name_content_type');

SET @sql = IF(@index_exists > 0, 
              'ALTER TABLE common_content_nav DROP INDEX uk_name_content_type', 
              'SELECT "Index uk_name_content_type does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加虚拟列：当未删除时生成唯一标识（如果不存在）
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                      WHERE TABLE_SCHEMA = DATABASE() 
                      AND TABLE_NAME = 'common_content_nav' 
                      AND COLUMN_NAME = 'active_unique_key');

SET @sql = IF(@column_exists = 0, 
              'ALTER TABLE common_content_nav ADD COLUMN active_unique_key VARCHAR(255) GENERATED ALWAYS AS (IF(deleted = 0, CONCAT(name_key, "-", content_type), NULL)) STORED', 
              'SELECT "Column active_unique_key already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 对虚拟列创建唯一索引（如果不存在）
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                     WHERE TABLE_SCHEMA = DATABASE() 
                     AND TABLE_NAME = 'common_content_nav' 
                     AND INDEX_NAME = 'uk_active_name_content_type');

SET @sql = IF(@index_exists = 0, 
              'ALTER TABLE common_content_nav ADD UNIQUE KEY uk_active_name_content_type (active_unique_key)', 
              'SELECT "Index uk_active_name_content_type already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 修复 common_content 表
-- 先删除依赖uk_nav_lang索引的外键约束
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

-- 添加虚拟列：当未删除时生成唯一标识（如果不存在）
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                      WHERE TABLE_SCHEMA = DATABASE() 
                      AND TABLE_NAME = 'common_content' 
                      AND COLUMN_NAME = 'active_unique_key');

SET @sql = IF(@column_exists = 0, 
              'ALTER TABLE common_content ADD COLUMN active_unique_key VARCHAR(255) GENERATED ALWAYS AS (IF(deleted = 0, CONCAT(nav_id, "-", language_code), NULL)) STORED', 
              'SELECT "Column active_unique_key already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 对虚拟列创建唯一索引（如果不存在）
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                     WHERE TABLE_SCHEMA = DATABASE() 
                     AND TABLE_NAME = 'common_content' 
                     AND INDEX_NAME = 'uk_active_nav_lang');

SET @sql = IF(@index_exists = 0, 
              'ALTER TABLE common_content ADD UNIQUE KEY uk_active_nav_lang (active_unique_key)', 
              'SELECT "Index uk_active_nav_lang already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 重新创建外键约束（如果之前删除了）
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
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_TYPE,
    GENERATION_EXPRESSION,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME IN ('common_content_nav', 'common_content')
    AND COLUMN_NAME = 'active_unique_key';

SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME IN ('common_content_nav', 'common_content')
    AND INDEX_NAME LIKE '%active%'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;