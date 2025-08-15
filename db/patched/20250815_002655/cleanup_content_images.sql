-- 数据清理脚本：为现有的内容图片分配 content_id
-- 执行前请先备份数据库

-- 1. 查看当前内容图片的状态
SELECT 
    COUNT(*) as total_content_images,
    COUNT(CASE WHEN content_id IS NULL THEN 1 END) as without_content_id,
    COUNT(CASE WHEN content_id IS NOT NULL THEN 1 END) as with_content_id
FROM common_content_images 
WHERE image_type = 'content' AND deleted = 0;

-- 2. 查看需要关联 content_id 的内容图片
SELECT 
    img.id,
    img.nav_id,
    img.content_id,
    img.image_type,
    img.image_url,
    img.created_at
FROM common_content_images img
WHERE img.image_type = 'content' AND img.deleted = 0 AND img.content_id IS NULL
ORDER BY img.nav_id, img.created_at;

-- 3. 为内容图片分配 content_id
-- 策略：将每个导航下的内容图片分配给该导航下的第一个内容
UPDATE common_content_images img
INNER JOIN (
    SELECT 
        c.nav_id,
        MIN(c.id) as first_content_id
    FROM common_content c
    GROUP BY c.nav_id
) first_content ON img.nav_id = first_content.nav_id
SET img.content_id = first_content.first_content_id
WHERE img.image_type = 'content' AND img.deleted = 0 AND img.content_id IS NULL;

-- 4. 验证分配结果
SELECT 
    img.nav_id,
    img.content_id,
    COUNT(*) as content_images_count,
    c.title as content_title
FROM common_content_images img
LEFT JOIN common_content c ON img.content_id = c.id
WHERE img.image_type = 'content' AND img.deleted = 0 AND img.content_id IS NOT NULL
GROUP BY img.nav_id, img.content_id
ORDER BY img.nav_id, img.content_id;

-- 5. 检查是否还有未分配 content_id 的内容图片
SELECT 
    COUNT(*) as remaining_unassigned_content_images
FROM common_content_images
WHERE image_type = 'content' AND deleted = 0 AND content_id IS NULL;

-- 6. 最终验证：查看所有内容图片的分配状态
SELECT 
    'content' as image_type,
    COUNT(*) as total_images,
    COUNT(CASE WHEN content_id IS NOT NULL THEN 1 END) as with_content_id,
    COUNT(CASE WHEN content_id IS NULL THEN 1 END) as without_content_id
FROM common_content_images
WHERE image_type = 'content' AND deleted = 0
UNION ALL
SELECT 
    'main' as image_type,
    COUNT(*) as total_images,
    COUNT(CASE WHEN content_id IS NOT NULL THEN 1 END) as with_content_id,
    COUNT(CASE WHEN content_id IS NULL THEN 1 END) as without_content_id
FROM common_content_images
WHERE image_type = 'main' AND deleted = 0;