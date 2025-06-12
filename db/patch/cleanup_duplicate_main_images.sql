-- 清理重复主图的简化SQL脚本
-- 请在MySQL客户端或phpMyAdmin中执行以下语句

-- 1. 首先查看当前重复的主图情况
SELECT 
    nav_id,
    COUNT(*) as main_image_count,
    GROUP_CONCAT(id ORDER BY created_at DESC) as image_ids
FROM common_content_images 
WHERE image_type = 'main' AND deleted = 0
GROUP BY nav_id
HAVING COUNT(*) > 1;

-- 2. 删除重复的主图（保留每个导航下最新的一张）
-- 注意：这个查询会软删除除了最新主图之外的所有重复主图
UPDATE common_content_images 
SET deleted = 1, updated_at = NOW()
WHERE image_type = 'main' 
  AND deleted = 0
  AND id NOT IN (
    -- 获取每个导航下最新的主图ID
    SELECT latest_id FROM (
      SELECT MAX(id) as latest_id
      FROM common_content_images 
      WHERE image_type = 'main' AND deleted = 0
      GROUP BY nav_id
    ) as temp_table
  );

-- 3. 验证修复结果
SELECT 
    nav_id,
    COUNT(*) as main_image_count,
    image_url
FROM common_content_images 
WHERE image_type = 'main' AND deleted = 0
GROUP BY nav_id
ORDER BY nav_id;