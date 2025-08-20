-- 添加标签功能的补丁脚本
-- 执行前请确保备份数据库
-- 创建时间: 2025-01-18 14:30:00
-- 描述: 为Countries表增加tags功能，创建tags表和country_tags关联表

BEGIN;

-- 创建标签表
CREATE TABLE IF NOT EXISTS tags (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  value VARCHAR(64) NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'country',
  description VARCHAR(256) DEFAULT '',
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE tags IS '标签表，用于为各种实体添加标签功能';
COMMENT ON COLUMN tags.value IS '标签值';
COMMENT ON COLUMN tags.type IS '标签类型，目前支持：country';
COMMENT ON COLUMN tags.description IS '标签描述';
COMMENT ON COLUMN tags.status IS '状态：active-启用，inactive-禁用';
COMMENT ON COLUMN tags.created_by IS '创建者用户ID';
COMMENT ON COLUMN tags.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（value + type 组合不能重复）
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_tag_value_type ON tags (value, type) WHERE deleted = FALSE;

-- 创建普通索引
CREATE INDEX IF NOT EXISTS idx_tags_value ON tags (value);
CREATE INDEX IF NOT EXISTS idx_tags_type ON tags (type);
CREATE INDEX IF NOT EXISTS idx_tags_status ON tags (status);
CREATE INDEX IF NOT EXISTS idx_tags_created_by ON tags (created_by);
CREATE INDEX IF NOT EXISTS idx_tags_updated_by ON tags (updated_by);

-- 添加外键约束
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_tags_created_by') THEN
        ALTER TABLE tags ADD CONSTRAINT fk_tags_created_by FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_tags_updated_by') THEN
        ALTER TABLE tags ADD CONSTRAINT fk_tags_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
    END IF;
END $$;

-- 创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_tags_modtime ON tags;
CREATE TRIGGER update_tags_modtime
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 创建国家标签关联表
CREATE TABLE IF NOT EXISTS country_tags (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  country_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE country_tags IS '国家标签关联表';
COMMENT ON COLUMN country_tags.country_id IS '关联的国家ID';
COMMENT ON COLUMN country_tags.tag_id IS '关联的标签ID';
COMMENT ON COLUMN country_tags.created_by IS '创建者用户ID';
COMMENT ON COLUMN country_tags.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（同一国家同一标签只能关联一次）
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_country_tag ON country_tags (country_id, tag_id) WHERE deleted = FALSE;

-- 创建普通索引
CREATE INDEX IF NOT EXISTS idx_country_tags_country_id ON country_tags (country_id);
CREATE INDEX IF NOT EXISTS idx_country_tags_tag_id ON country_tags (tag_id);
CREATE INDEX IF NOT EXISTS idx_country_tags_created_by ON country_tags (created_by);
CREATE INDEX IF NOT EXISTS idx_country_tags_updated_by ON country_tags (updated_by);

-- 添加外键约束
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_country_tags_country_id') THEN
        ALTER TABLE country_tags ADD CONSTRAINT fk_country_tags_country_id FOREIGN KEY (country_id) REFERENCES countries(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_country_tags_tag_id') THEN
        ALTER TABLE country_tags ADD CONSTRAINT fk_country_tags_tag_id FOREIGN KEY (tag_id) REFERENCES tags(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_country_tags_created_by') THEN
        ALTER TABLE country_tags ADD CONSTRAINT fk_country_tags_created_by FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_country_tags_updated_by') THEN
        ALTER TABLE country_tags ADD CONSTRAINT fk_country_tags_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
    END IF;
END $$;

-- 创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_country_tags_modtime ON country_tags;
CREATE TRIGGER update_country_tags_modtime
    BEFORE UPDATE ON country_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 验证表是否创建成功
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('tags', 'country_tags') 
AND table_schema = 'public'
ORDER BY table_name;

-- 验证索引是否创建成功
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('tags', 'country_tags')
ORDER BY tablename, indexname;

COMMIT;

-- 补丁脚本执行完成
-- 如果需要回滚，请执行以下语句：
-- DROP TABLE IF EXISTS country_tags CASCADE;
-- DROP TABLE IF EXISTS tags CASCADE;