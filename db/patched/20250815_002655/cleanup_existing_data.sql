-- 清理现有数据脚本
-- 在执行数据库迁移后运行此脚本

-- 1. 查看当前数据状态
SELECT '=== 当前图片表数据统计 ===' as info;
SELECT 
    image_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN deleted = 0 THEN 1 END) as active_count,
    COUNT(CASE WHEN deleted = 1 THEN 1 END) as deleted_count
FROM common_content_images 
GROUP BY image_type;

-- 2. 查看需要处理的主图数据
SELECT '=== 需要关联content_id的主图 ===' as info;
SELECT 
    img.id as image_id,
    img.nav_id,
    img.content_id,
    img.image_type,
    img.image_url,
    COUNT(c.id) as content_count
FROM common_content_images img
LEFT JOIN common_content c ON img.nav_id = c.nav_id AND c.deleted = 0
WHERE img.image_type = 'main' AND img.deleted = 0 AND img.content_id IS NULL
GROUP BY img.id, img.nav_id, img.content_id, img.image_type, img.image_url
ORDER BY img.nav_id, img.id;

-- 3. 为主图分配content_id（分配给每个导航下的第一个内容）
SELECT '=== 开始分配主图到内容 ===' as info;

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
WHERE img.image_type = 'main' AND img.deleted = 0 AND img.content_id IS NULL;

-- 4. 查看分配结果
SELECT '=== 分配结果验证 ===' as info;
SELECT 
    img.id,
    img.nav_id,
    img.content_id,
    img.image_type,
    img.image_url,
    c.title as content_title,
    c.language_code
FROM common_content_images img
LEFT JOIN common_content c ON img.content_id = c.id
WHERE img.deleted = 0 AND img.image_type = 'main'
ORDER BY img.nav_id, img.content_id;

-- 5. 处理重复主图（每个内容只保留一张主图）
SELECT '=== 查找重复主图 ===' as info;
SELECT 
    content_id,
    COUNT(*) as main_image_count,
    GROUP_CONCAT(id ORDER BY id) as image_ids
FROM common_content_images 
WHERE image_type = 'main' AND deleted = 0 AND content_id IS NOT NULL
GROUP BY content_id
HAVING COUNT(*) > 1;

-- 6. 删除重复的主图（保留ID最小的）
SELECT '=== 删除重复主图 ===' as info;

DELETE img1 FROM common_content_images img1
INNER JOIN common_content_images img2 
WHERE img1.content_id = img2.content_id 
  AND img1.image_type = 'main' 
  AND img2.image_type = 'main'
  AND img1.id > img2.id
  AND img1.deleted = 0 
  AND img2.deleted = 0;

-- 7. 最终验证
SELECT '=== 最终验证结果 ===' as info;

-- 检查是否还有重复主图
SELECT 
    'duplicate_check' as check_type,
    content_id,
    COUNT(*) as main_image_count
FROM common_content_images 
WHERE image_type = 'main' AND deleted = 0 AND content_id IS NOT NULL
GROUP BY content_id
HAVING COUNT(*) > 1;

-- 检查是否还有未分配content_id的主图
SELECT 
    'unassigned_check' as check_type,
    COUNT(*) as unassigned_main_images
FROM common_content_images 
WHERE image_type = 'main' AND deleted = 0 AND content_id IS NULL;

-- 最终统计
SELECT 
    'final_stats' as check_type,
    image_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN deleted = 0 THEN 1 END) as active_count,
    COUNT(CASE WHEN content_id IS NOT NULL THEN 1 END) as with_content_id
FROM common_content_images 
GROUP BY image_type;

SELECT '=== 清理完成 ===' as info;