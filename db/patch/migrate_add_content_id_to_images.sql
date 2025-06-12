-- 数据库迁移脚本：为 common_content_images 表添加 content_id 字段
-- 解决图片只关联 nav_id 而不关联具体内容的问题

-- 1. 添加 content_id 字段
ALTER TABLE common_content_images 
ADD COLUMN content_id INT NULL COMMENT '关联内容ID' AFTER nav_id;

-- 2. 添加外键约束
ALTER TABLE common_content_images 
ADD CONSTRAINT fk_content_images_content_id 
FOREIGN KEY (content_id) REFERENCES common_content(id) ON DELETE CASCADE;

-- 3. 添加索引
ALTER TABLE common_content_images 
ADD INDEX idx_content_id (content_id);

-- 4. 更新现有数据：将主图关联到对应的内容
-- 注意：这个步骤需要根据实际业务逻辑调整
-- 如果一个导航下有多个内容，需要手动分配主图到具体内容

-- 查看当前需要处理的数据
SELECT 
    img.id as image_id,
    img.nav_id,
    img.image_type,
    img.image_url,
    c.id as content_id,
    c.title,
    c.language_code
FROM common_content_images img
LEFT JOIN common_content c ON img.nav_id = c.nav_id AND c.deleted = 0
WHERE img.deleted = 0 AND img.image_type = 'main'
ORDER BY img.nav_id, c.id;

-- 5. 临时更新：将主图分配给每个导航下的第一个内容
-- 注意：这只是临时方案，实际应该根据业务需求手动分配
UPDATE common_content_images img
INNER JOIN (
    SELECT 
        c.nav_id,
        MIN(c.id) as first_content_id
    FROM common_content c
    WHERE c.deleted = 0
    GROUP BY c.nav_id
) first_content ON img.nav_id = first_content.nav_id
SET img.content_id = first_content.first_content_id
WHERE img.image_type = 'main' AND img.deleted = 0;

-- 6. 验证更新结果
SELECT 
    img.id,
    img.nav_id,
    img.content_id,
    img.image_type,
    img.image_url,
    c.title,
    c.language_code
FROM common_content_images img
LEFT JOIN common_content c ON img.content_id = c.id
WHERE img.deleted = 0 AND img.image_type = 'main'
ORDER BY img.nav_id, img.content_id;

-- 7. 清理重复的主图（每个内容只保留一张主图）
DELETE img1 FROM common_content_images img1
INNER JOIN common_content_images img2 
WHERE img1.content_id = img2.content_id 
  AND img1.image_type = 'main' 
  AND img2.image_type = 'main'
  AND img1.id > img2.id
  AND img1.deleted = 0 
  AND img2.deleted = 0;

-- 8. 最终验证：确保每个内容最多只有一张主图
SELECT 
    content_id,
    COUNT(*) as main_image_count
FROM common_content_images 
WHERE image_type = 'main' AND deleted = 0 AND content_id IS NOT NULL
GROUP BY content_id
HAVING COUNT(*) > 1;