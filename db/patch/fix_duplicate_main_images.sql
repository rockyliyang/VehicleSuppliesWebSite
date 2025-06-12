-- 修复重复主图问题的SQL脚本
-- 该脚本会删除每个导航下除了最新的主图之外的所有重复主图

-- 1. 查看当前重复的主图情况
SELECT 
    nav_id,
    COUNT(*) as main_image_count,
    GROUP_CONCAT(id ORDER BY created_at DESC) as image_ids,
    GROUP_CONCAT(image_url ORDER BY created_at DESC) as image_urls
FROM common_content_images 
WHERE image_type = 'main' AND deleted = 0
GROUP BY nav_id
HAVING COUNT(*) > 1;

-- 2. 软删除重复的主图（保留每个导航下最新的一张）
UPDATE common_content_images 
SET deleted = 1, updated_at = NOW()
WHERE image_type = 'main' 
  AND deleted = 0
  AND id NOT IN (
    SELECT * FROM (
      SELECT MAX(id) as latest_id
      FROM common_content_images 
      WHERE image_type = 'main' AND deleted = 0
      GROUP BY nav_id
    ) as latest_images
  );

-- 3. 验证修复结果 - 每个导航应该只有一张主图
SELECT 
    nav_id,
    COUNT(*) as main_image_count,
    image_url,
    created_at
FROM common_content_images 
WHERE image_type = 'main' AND deleted = 0
GROUP BY nav_id
ORDER BY nav_id;

-- 4. 查看被软删除的主图记录
SELECT 
    nav_id,
    image_url,
    created_at,
    updated_at
FROM common_content_images 
WHERE image_type = 'main' AND deleted = 1
ORDER BY nav_id, created_at DESC;