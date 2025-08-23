-- PostgreSQL版本的语言翻译表架构
-- 从MySQL转换而来，严格保持原有字段名称和结构
-- 转换日期: 2024年

-- 语言翻译表
CREATE TABLE IF NOT EXISTS language_translations (
    id BIGSERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() NOT NULL,
    code VARCHAR(64) NOT NULL,
    lang VARCHAR(16) NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
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

-- 为language_translations表创建更新时间触发器
CREATE TRIGGER update_language_translations_updated_at BEFORE UPDATE ON language_translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建唯一索引（模拟MySQL的虚拟列unique_active_code_lang）
CREATE UNIQUE INDEX unique_active_code_lang ON language_translations(code, lang) WHERE deleted = FALSE;

-- 创建索引
CREATE INDEX idx_language_translations_created_by ON language_translations(created_by);
CREATE INDEX idx_language_translations_updated_by ON language_translations(updated_by);

-- 添加外键约束
ALTER TABLE language_translations ADD CONSTRAINT fk_language_translations_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE language_translations ADD CONSTRAINT fk_language_translations_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 注释说明
COMMENT ON TABLE language_translations IS '语言翻译表';
COMMENT ON COLUMN language_translations.code IS '翻译键名';
COMMENT ON COLUMN language_translations.lang IS '语言代码，如en, zh-CN';
COMMENT ON COLUMN language_translations.value IS '翻译内容';
COMMENT ON COLUMN language_translations.created_by IS '创建者用户ID';
COMMENT ON COLUMN language_translations.updated_by IS '最后更新者用户ID';

-- 插入一些默认的翻译数据
INSERT INTO language_translations (guid, code, lang, value) VALUES
(gen_random_uuid(), 'home', 'en', 'Home'),
(gen_random_uuid(), 'home', 'zh-CN', '首页'),
(gen_random_uuid(), 'products', 'en', 'Products'),
(gen_random_uuid(), 'products', 'zh-CN', '产品中心'),
(gen_random_uuid(), 'about', 'en', 'About Us'),
(gen_random_uuid(), 'about', 'zh-CN', '关于我们'),
(gen_random_uuid(), 'news', 'en', 'News'),
(gen_random_uuid(), 'news', 'zh-CN', '新闻资讯'),
(gen_random_uuid(), 'contact', 'en', 'Contact Us'),
(gen_random_uuid(), 'contact', 'zh-CN', '联系我们'),
(gen_random_uuid(), 'login', 'en', 'Login/Register'),
(gen_random_uuid(), 'login', 'zh-CN', '注册/登录'),
(gen_random_uuid(), 'logout', 'en', 'Logout'),
(gen_random_uuid(), 'logout', 'zh-CN', '退出'),
(gen_random_uuid(), 'orders', 'en', 'My Orders'),
(gen_random_uuid(), 'orders', 'zh-CN', '我的订单')
ON CONFLICT (code, lang) WHERE deleted = FALSE DO NOTHING;