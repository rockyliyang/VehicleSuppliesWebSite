-- 添加wst_euro标签并关联欧洲国家
-- 创建时间: 2025-09-10
-- 描述: 在tags表中添加value为wst_euro、type为country的标签，并将其与所有Region为Europe的国家关联

BEGIN;

-- 插入wst_euro标签
INSERT INTO tags (value, type, description, status)
VALUES ('wst_euro', 'country', '万盛通欧洲国家标签', 'active')
ON CONFLICT (value, type) WHERE deleted = FALSE
DO NOTHING;

-- 获取新插入的标签ID
DO $$
DECLARE
    v_tag_id BIGINT;
BEGIN
    -- 获取wst_euro标签ID
    SELECT id INTO v_tag_id FROM tags 
    WHERE value = 'wst_euro' AND type = 'country' AND deleted = FALSE;
    
    -- 如果标签存在，则关联欧洲国家
    IF v_tag_id IS NOT NULL THEN
        -- 为所有Region为Europe的国家添加标签关联
        INSERT INTO country_tags (country_id, tag_id)
        SELECT c.id, v_tag_id
        FROM countries c
        WHERE c.region = 'Europe' 
          AND c.deleted = FALSE 
          AND NOT EXISTS (
              -- 避免重复插入
              SELECT 1 FROM country_tags ct 
              WHERE ct.country_id = c.id 
                AND ct.tag_id = v_tag_id
                AND ct.deleted = FALSE
          );
    END IF;
END $$;

-- 验证标签是否创建成功
SELECT id, value, type, description, status
FROM tags
WHERE value = 'wst_euro' AND type = 'country' AND deleted = FALSE;

-- 验证关联是否创建成功
SELECT COUNT(*) as europe_countries_with_tag
FROM country_tags ct
JOIN tags t ON ct.tag_id = t.id
JOIN countries c ON ct.country_id = c.id
WHERE t.value = 'wst_euro' 
  AND c.region = 'Europe'
  AND ct.deleted = FALSE
  AND t.deleted = FALSE
  AND c.deleted = FALSE;

COMMIT;