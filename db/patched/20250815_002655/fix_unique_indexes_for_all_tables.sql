-- 修改所有表的唯一索引，使用虚拟列解决软删除后的唯一索引冲突问题
-- 执行前请备份数据库

USE vehicle_supplies_db;

-- 1. 修改 language_translations 表
-- 删除原有的唯一索引
ALTER TABLE language_translations DROP INDEX unique_code_lang_not_deleted;

-- 添加虚拟列
ALTER TABLE language_translations ADD COLUMN active_unique_key VARCHAR(255) AS (
  CASE 
    WHEN deleted = 0 THEN CONCAT(code, '|', lang)
    ELSE NULL 
  END
) VIRTUAL;

-- 在虚拟列上创建唯一索引
ALTER TABLE language_translations ADD UNIQUE INDEX unique_active_code_lang (active_unique_key);

-- 2. 修改 users 表
-- 删除原有的唯一索引
ALTER TABLE users DROP INDEX username;
ALTER TABLE users DROP INDEX email;

-- 添加虚拟列
ALTER TABLE users ADD COLUMN active_unique_username VARCHAR(255) AS (
  CASE 
    WHEN deleted = 0 THEN username
    ELSE NULL 
  END
) VIRTUAL;

ALTER TABLE users ADD COLUMN active_unique_email VARCHAR(255) AS (
  CASE 
    WHEN deleted = 0 THEN email
    ELSE NULL 
  END
) VIRTUAL;

-- 在虚拟列上创建唯一索引
ALTER TABLE users ADD UNIQUE INDEX unique_active_username (active_unique_username);
ALTER TABLE users ADD UNIQUE INDEX unique_active_email (active_unique_email);

-- 3. 修改 product_categories 表
-- 删除原有的唯一索引
ALTER TABLE product_categories DROP INDEX unique_code_not_deleted;

-- 添加虚拟列
ALTER TABLE product_categories ADD COLUMN active_unique_key VARCHAR(255) AS (
  CASE 
    WHEN deleted = 0 THEN code
    ELSE NULL 
  END
) VIRTUAL;

-- 在虚拟列上创建唯一索引
ALTER TABLE product_categories ADD UNIQUE INDEX unique_active_code (active_unique_key);

-- 4. 修改 products 表
-- 删除原有的唯一索引
ALTER TABLE products DROP INDEX unique_product_code_not_deleted;

-- 添加虚拟列
ALTER TABLE products ADD COLUMN active_unique_key VARCHAR(255) AS (
  CASE 
    WHEN deleted = 0 THEN product_code
    ELSE NULL 
  END
) VIRTUAL;

-- 在虚拟列上创建唯一索引
ALTER TABLE products ADD UNIQUE INDEX unique_active_product_code (active_unique_key);

-- 5. 修改 site_settings 表（虽然没有软删除，但为了一致性也修改）
-- 删除原有的唯一索引
ALTER TABLE site_settings DROP INDEX setting_key;

-- 添加虚拟列
ALTER TABLE site_settings ADD COLUMN active_unique_key VARCHAR(255) AS (
  CASE 
    WHEN deleted = 0 THEN setting_key
    ELSE NULL 
  END
) VIRTUAL;

-- 在虚拟列上创建唯一索引
ALTER TABLE site_settings ADD UNIQUE INDEX unique_active_setting_key (active_unique_key);

-- 验证修改结果
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  INDEX_NAME,
  NON_UNIQUE
FROM 
  INFORMATION_SCHEMA.STATISTICS 
WHERE 
  TABLE_SCHEMA = 'vehicle_supplies_db' 
  AND TABLE_NAME IN ('language_translations', 'users', 'product_categories', 'products', 'site_settings')
  AND INDEX_NAME LIKE '%unique%'
ORDER BY TABLE_NAME, INDEX_NAME;

-- 查看虚拟列信息
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  GENERATION_EXPRESSION,
  IS_GENERATED
FROM s
  INFORMATION_SCHEMA.COLUMNS 
WHERE 
  TABLE_SCHEMA = 'vehicle_supplies_db' 
  AND TABLE_NAME IN ('language_translations', 'users', 'product_categories', 'products', 'site_settings')
  AND IS_GENERATED = 'ALWAYS'
ORDER BY TABLE_NAME, COLUMN_NAME;