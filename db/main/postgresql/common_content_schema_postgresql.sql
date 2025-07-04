-- PostgreSQL版本的通用内容架构
-- 从MySQL转换而来，严格保持原有字段名称和结构
-- 转换日期: 2024年
-- About Us 页面数据库表结构
-- 基于主从表结构设计，使用现有 language_translations 表进行多语言支持

-- 创建通用内容导航菜单主表
CREATE TABLE IF NOT EXISTS common_content_nav (
    id SERIAL PRIMARY KEY,
    name_key VARCHAR(64) NOT NULL,
    content_type VARCHAR(32) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted SMALLINT DEFAULT 0,
    created_by BIGINT DEFAULT NULL,
    updated_by BIGINT DEFAULT NULL
);

-- 创建更新时间触发器（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为common_content_nav表创建更新时间触发器
CREATE TRIGGER update_common_content_nav_updated_at BEFORE UPDATE ON common_content_nav
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建唯一索引（模拟MySQL的虚拟列uk_active_name_content_type）
CREATE UNIQUE INDEX uk_active_name_content_type ON common_content_nav(name_key, content_type) WHERE deleted = 0;

-- 创建索引
CREATE INDEX idx_common_content_nav_content_type ON common_content_nav(content_type);
CREATE INDEX idx_common_content_nav_sort_order ON common_content_nav(sort_order);
CREATE INDEX idx_common_content_nav_status ON common_content_nav(status);
CREATE INDEX idx_common_content_nav_deleted ON common_content_nav(deleted);
CREATE INDEX idx_common_content_nav_created_by ON common_content_nav(created_by);
CREATE INDEX idx_common_content_nav_updated_by ON common_content_nav(updated_by);

-- 添加外键约束
ALTER TABLE common_content_nav ADD CONSTRAINT fk_common_content_nav_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE common_content_nav ADD CONSTRAINT fk_common_content_nav_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建通用内容表（去除UNIQUE约束）
CREATE TABLE IF NOT EXISTS common_content (
    id SERIAL PRIMARY KEY,
    nav_id INTEGER NOT NULL,
    language_code VARCHAR(16) NOT NULL,
    title VARCHAR(200),
    content TEXT,
    status SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted SMALLINT DEFAULT 0,
    created_by BIGINT DEFAULT NULL,
    updated_by BIGINT DEFAULT NULL
);

-- 为common_content表创建更新时间触发器
CREATE TRIGGER update_common_content_updated_at BEFORE UPDATE ON common_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加外键约束
ALTER TABLE common_content ADD CONSTRAINT fk_common_content_nav_id FOREIGN KEY (nav_id) REFERENCES common_content_nav(id) ON DELETE CASCADE;
ALTER TABLE common_content ADD CONSTRAINT fk_common_content_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE common_content ADD CONSTRAINT fk_common_content_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建索引
CREATE INDEX idx_common_content_nav_id ON common_content(nav_id);
CREATE INDEX idx_common_content_language_code ON common_content(language_code);
CREATE INDEX idx_common_content_status ON common_content(status);
CREATE INDEX idx_common_content_deleted ON common_content(deleted);
CREATE INDEX idx_common_content_created_by ON common_content(created_by);
CREATE INDEX idx_common_content_updated_by ON common_content(updated_by);

-- 创建通用内容图片表
CREATE TABLE common_content_images (
    id SERIAL PRIMARY KEY,
    nav_id INTEGER NOT NULL,
    content_id INTEGER DEFAULT NULL,
    image_type VARCHAR(20) NOT NULL DEFAULT 'content',
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(200) DEFAULT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted SMALLINT DEFAULT 0,
    created_by BIGINT DEFAULT NULL,
    updated_by BIGINT DEFAULT NULL
);

-- 为common_content_images表创建更新时间触发器
CREATE TRIGGER update_common_content_images_updated_at BEFORE UPDATE ON common_content_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加检查约束（模拟MySQL的ENUM）
ALTER TABLE common_content_images ADD CONSTRAINT chk_image_type CHECK (image_type IN ('main', 'content'));

-- 添加外键约束
ALTER TABLE common_content_images ADD CONSTRAINT common_content_images_ibfk_1 FOREIGN KEY (nav_id) REFERENCES common_content_nav(id) ON DELETE CASCADE;
ALTER TABLE common_content_images ADD CONSTRAINT fk_content_images_content_id FOREIGN KEY (content_id) REFERENCES common_content(id) ON DELETE CASCADE;
ALTER TABLE common_content_images ADD CONSTRAINT fk_common_content_images_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE common_content_images ADD CONSTRAINT fk_common_content_images_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建索引
CREATE INDEX idx_common_content_images_nav_id ON common_content_images(nav_id);
CREATE INDEX idx_common_content_images_image_type ON common_content_images(image_type);
CREATE INDEX idx_common_content_images_sort_order ON common_content_images(sort_order);
CREATE INDEX idx_common_content_images_status ON common_content_images(status);
CREATE INDEX idx_common_content_images_deleted ON common_content_images(deleted);
CREATE INDEX idx_common_content_images_content_id ON common_content_images(content_id);
CREATE INDEX idx_common_content_images_created_by ON common_content_images(created_by);
CREATE INDEX idx_common_content_images_updated_by ON common_content_images(updated_by);

-- 注释说明
COMMENT ON TABLE common_content_nav IS '通用内容导航菜单主表';
COMMENT ON COLUMN common_content_nav.name_key IS '导航名称翻译键，对应language_translations表的code字段';
COMMENT ON COLUMN common_content_nav.content_type IS '内容类型：about_us, news等';
COMMENT ON COLUMN common_content_nav.sort_order IS '排序顺序';
COMMENT ON COLUMN common_content_nav.status IS '状态：1-启用，0-禁用';
COMMENT ON COLUMN common_content_nav.deleted IS '软删除标记：0-未删除，1-已删除';
COMMENT ON COLUMN common_content_nav.created_by IS '创建者用户ID';
COMMENT ON COLUMN common_content_nav.updated_by IS '最后更新者用户ID';

COMMENT ON TABLE common_content IS '通用内容表';
COMMENT ON COLUMN common_content.nav_id IS '关联导航菜单ID';
COMMENT ON COLUMN common_content.language_code IS '语言代码：zh-CN, en等';
COMMENT ON COLUMN common_content.title IS '内容标题';
COMMENT ON COLUMN common_content.content IS '富文本内容';
COMMENT ON COLUMN common_content.status IS '状态：1-发布，0-草稿';
COMMENT ON COLUMN common_content.deleted IS '软删除标记：0-未删除，1-已删除';
COMMENT ON COLUMN common_content.created_by IS '创建者用户ID';
COMMENT ON COLUMN common_content.updated_by IS '最后更新者用户ID';

COMMENT ON TABLE common_content_images IS '通用内容图片表';
COMMENT ON COLUMN common_content_images.nav_id IS '关联导航菜单ID';
COMMENT ON COLUMN common_content_images.content_id IS '关联内容ID';
COMMENT ON COLUMN common_content_images.image_type IS '图片类型：main-菜单主图，content-内容图片';
COMMENT ON COLUMN common_content_images.image_url IS '图片URL';
COMMENT ON COLUMN common_content_images.alt_text IS '图片替代文本';
COMMENT ON COLUMN common_content_images.sort_order IS '排序顺序';
COMMENT ON COLUMN common_content_images.status IS '状态：1-启用，0-禁用';
COMMENT ON COLUMN common_content_images.deleted IS '软删除标记：0-未删除，1-已删除';
COMMENT ON COLUMN common_content_images.created_by IS '创建者用户ID';
COMMENT ON COLUMN common_content_images.updated_by IS '最后更新者用户ID';

-- 插入默认导航菜单
-- 注意：PostgreSQL使用ON CONFLICT替代MySQL的ON DUPLICATE KEY UPDATE
INSERT INTO common_content_nav (name_key, content_type, sort_order) VALUES
('about.company', 'about_us', 1),
('about.culture', 'about_us', 2),
('about.certificate', 'about_us', 3),
('about.honors', 'about_us', 4),
('news.industry', 'news', 1),
('news.company', 'news', 2)
ON CONFLICT (name_key, content_type) WHERE deleted = 0 DO UPDATE SET sort_order = EXCLUDED.sort_order;

INSERT INTO common_content_nav (name_key, content_type, sort_order) VALUES
('home.about_us', 'home', 1)
ON CONFLICT (name_key, content_type) WHERE deleted = 0 DO UPDATE SET sort_order = EXCLUDED.sort_order;