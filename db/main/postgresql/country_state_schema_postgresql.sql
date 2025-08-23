-- PostgreSQL版本的国家和州/省数据表架构（重构版本）
-- 创建时间: 2024年
-- 描述: 国家和州/省数据表，支持税率和运费费率配置
-- 重构: 将timezones和translations改为独立子表

-- 创建扩展（如果不存在）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建更新时间戳函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 国家表（重构版本 - 移除JSONB字段）
CREATE TABLE IF NOT EXISTS countries (
    id BIGSERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() NOT NULL,
    name VARCHAR(255) NOT NULL,
    iso3 VARCHAR(3) NOT NULL,
    iso2 VARCHAR(2) NOT NULL,
    numeric_code VARCHAR(3),
    phone_code VARCHAR(20),
    capital VARCHAR(255),
    currency VARCHAR(3),
    currency_name VARCHAR(100),
    currency_symbol VARCHAR(10),
    tld VARCHAR(10),
    native VARCHAR(255),
    region VARCHAR(100),
    region_id VARCHAR(10),
    subregion VARCHAR(100),
    subregion_id VARCHAR(10),
    nationality VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    emoji VARCHAR(10),
    emoji_u VARCHAR(50),
    -- 新增字段：税率和运费费率
    tax_rate DECIMAL(5, 4) DEFAULT 0.0000,
    shipping_rate DECIMAL(8, 4) DEFAULT 0.0000,
    shipping_rate_type VARCHAR(20) DEFAULT 'weight_based' CHECK (shipping_rate_type IN ('fixed', 'weight_based')),
    -- 标准字段
    status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by BIGINT DEFAULT NULL,
    updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE countries IS '国家信息表（重构版本）';
COMMENT ON COLUMN countries.name IS '国家名称';
COMMENT ON COLUMN countries.iso3 IS 'ISO 3166-1 alpha-3 三位字母代码';
COMMENT ON COLUMN countries.iso2 IS 'ISO 3166-1 alpha-2 两位字母代码';
COMMENT ON COLUMN countries.numeric_code IS 'ISO 3166-1 数字代码';
COMMENT ON COLUMN countries.phone_code IS '国际电话区号';
COMMENT ON COLUMN countries.capital IS '首都';
COMMENT ON COLUMN countries.currency IS '货币代码';
COMMENT ON COLUMN countries.currency_name IS '货币名称';
COMMENT ON COLUMN countries.currency_symbol IS '货币符号';
COMMENT ON COLUMN countries.tld IS '顶级域名';
COMMENT ON COLUMN countries.native IS '本地语言国家名称';
COMMENT ON COLUMN countries.region IS '地区';
COMMENT ON COLUMN countries.region_id IS '地区ID';
COMMENT ON COLUMN countries.subregion IS '子地区';
COMMENT ON COLUMN countries.subregion_id IS '子地区ID';
COMMENT ON COLUMN countries.nationality IS '国籍';
COMMENT ON COLUMN countries.latitude IS '纬度';
COMMENT ON COLUMN countries.longitude IS '经度';
COMMENT ON COLUMN countries.emoji IS '国旗emoji';
COMMENT ON COLUMN countries.emoji_u IS 'emoji Unicode';
COMMENT ON COLUMN countries.tax_rate IS '税率，小数形式，例如0.0825表示8.25%';
COMMENT ON COLUMN countries.shipping_rate IS '运费费率';
COMMENT ON COLUMN countries.shipping_rate_type IS '运费计算方式';
COMMENT ON COLUMN countries.status IS '状态：active-启用，inactive-禁用';
COMMENT ON COLUMN countries.created_by IS '创建者用户ID';
COMMENT ON COLUMN countries.updated_by IS '最后更新者用户ID';

-- 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_country_iso2 ON countries(iso2) WHERE deleted = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_country_iso3 ON countries(iso3) WHERE deleted = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_country_numeric_code ON countries(numeric_code) WHERE deleted = FALSE AND numeric_code IS NOT NULL;

-- 创建普通索引
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name);
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region);
CREATE INDEX IF NOT EXISTS idx_countries_subregion ON countries(subregion);
CREATE INDEX IF NOT EXISTS idx_countries_currency ON countries(currency);
CREATE INDEX IF NOT EXISTS idx_countries_status ON countries(status);
CREATE INDEX IF NOT EXISTS idx_countries_created_by ON countries(created_by);
CREATE INDEX IF NOT EXISTS idx_countries_updated_by ON countries(updated_by);

-- 为countries表创建更新时间触发器
DROP TRIGGER IF EXISTS update_countries_updated_at ON countries;
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 国家时区表
CREATE TABLE IF NOT EXISTS country_timezones (
    id BIGSERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() NOT NULL,
    country_id BIGINT NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    gmt_offset INTEGER,
    gmt_offset_name VARCHAR(20),
    abbreviation VARCHAR(10),
    tz_name VARCHAR(100),
    -- 标准字段
    status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by BIGINT DEFAULT NULL,
    updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE country_timezones IS '国家时区信息表';
COMMENT ON COLUMN country_timezones.country_id IS '所属国家ID';
COMMENT ON COLUMN country_timezones.zone_name IS '时区名称，如Asia/Shanghai';
COMMENT ON COLUMN country_timezones.gmt_offset IS 'GMT偏移量（秒）';
COMMENT ON COLUMN country_timezones.gmt_offset_name IS 'GMT偏移量名称，如UTC+08:00';
COMMENT ON COLUMN country_timezones.abbreviation IS '时区缩写，如CST';
COMMENT ON COLUMN country_timezones.tz_name IS '时区全名，如China Standard Time';
COMMENT ON COLUMN country_timezones.status IS '状态：active-启用，inactive-禁用';
COMMENT ON COLUMN country_timezones.created_by IS '创建者用户ID';
COMMENT ON COLUMN country_timezones.updated_by IS '最后更新者用户ID';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_country_timezones_country_id ON country_timezones(country_id);
CREATE INDEX IF NOT EXISTS idx_country_timezones_zone_name ON country_timezones(zone_name);
CREATE INDEX IF NOT EXISTS idx_country_timezones_status ON country_timezones(status);
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_country_timezone ON country_timezones(country_id, zone_name) WHERE deleted = FALSE;

-- 添加外键约束
ALTER TABLE country_timezones DROP CONSTRAINT IF EXISTS fk_country_timezones_country_id;
ALTER TABLE country_timezones ADD CONSTRAINT fk_country_timezones_country_id FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE;

-- 为country_timezones表创建更新时间触发器
DROP TRIGGER IF EXISTS update_country_timezones_updated_at ON country_timezones;
CREATE TRIGGER update_country_timezones_updated_at BEFORE UPDATE ON country_timezones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 国家翻译表
CREATE TABLE IF NOT EXISTS country_translations (
    id BIGSERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() NOT NULL,
    country_id BIGINT NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    country_name VARCHAR(255) NOT NULL,
    -- 标准字段
    status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by BIGINT DEFAULT NULL,
    updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE country_translations IS '国家多语言翻译表';
COMMENT ON COLUMN country_translations.country_id IS '所属国家ID';
COMMENT ON COLUMN country_translations.language_code IS '语言代码，如zh-CN, en-US, fr, de等';
COMMENT ON COLUMN country_translations.country_name IS '该语言下的国家名称';
COMMENT ON COLUMN country_translations.status IS '状态：active-启用，inactive-禁用';
COMMENT ON COLUMN country_translations.created_by IS '创建者用户ID';
COMMENT ON COLUMN country_translations.updated_by IS '最后更新者用户ID';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_country_translations_country_id ON country_translations(country_id);
CREATE INDEX IF NOT EXISTS idx_country_translations_language_code ON country_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_country_translations_status ON country_translations(status);
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_country_translation ON country_translations(country_id, language_code) WHERE deleted = FALSE;

-- 添加外键约束
ALTER TABLE country_translations DROP CONSTRAINT IF EXISTS fk_country_translations_country_id;
ALTER TABLE country_translations ADD CONSTRAINT fk_country_translations_country_id FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE;

-- 为country_translations表创建更新时间触发器
DROP TRIGGER IF EXISTS update_country_translations_updated_at ON country_translations;
CREATE TRIGGER update_country_translations_updated_at BEFORE UPDATE ON country_translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 州/省表
CREATE TABLE IF NOT EXISTS states (
    id BIGSERIAL PRIMARY KEY,
    guid UUID DEFAULT gen_random_uuid() NOT NULL,
    name VARCHAR(255) NOT NULL,
    country_id BIGINT NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    country_name VARCHAR(255) NOT NULL,
    state_code VARCHAR(10),
    type VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    -- 新增字段：州/省级别的税率和运费费率（可选，覆盖国家级别设置）
    tax_rate DECIMAL(5, 4) DEFAULT NULL,
    shipping_rate DECIMAL(8, 4) DEFAULT NULL,
    shipping_rate_type VARCHAR(20) DEFAULT NULL CHECK (shipping_rate_type IS NULL OR shipping_rate_type IN ('fixed', 'weight_based')),
    -- 标准字段
    status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by BIGINT DEFAULT NULL,
    updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE states IS '州/省信息表';
COMMENT ON COLUMN states.name IS '州/省名称';
COMMENT ON COLUMN states.country_id IS '所属国家ID';
COMMENT ON COLUMN states.country_code IS '国家代码';
COMMENT ON COLUMN states.country_name IS '国家名称';
COMMENT ON COLUMN states.state_code IS '州/省代码';
COMMENT ON COLUMN states.type IS '行政区划类型';
COMMENT ON COLUMN states.latitude IS '纬度';
COMMENT ON COLUMN states.longitude IS '经度';
COMMENT ON COLUMN states.tax_rate IS '州/省税率，覆盖国家税率';
COMMENT ON COLUMN states.shipping_rate IS '州/省运费费率，覆盖国家运费费率';
COMMENT ON COLUMN states.shipping_rate_type IS '州/省运费计算方式，覆盖国家设置';
COMMENT ON COLUMN states.status IS '状态：active-启用，inactive-禁用';
COMMENT ON COLUMN states.created_by IS '创建者用户ID';
COMMENT ON COLUMN states.updated_by IS '最后更新者用户ID';

-- 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_state_country_name ON states(country_id, name) WHERE deleted = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_state_country_code ON states(country_id, state_code) WHERE deleted = FALSE AND state_code IS NOT NULL;

-- 创建普通索引
CREATE INDEX IF NOT EXISTS idx_states_country_id ON states(country_id);
CREATE INDEX IF NOT EXISTS idx_states_country_code ON states(country_code);
CREATE INDEX IF NOT EXISTS idx_states_name ON states(name);
CREATE INDEX IF NOT EXISTS idx_states_state_code ON states(state_code);
CREATE INDEX IF NOT EXISTS idx_states_status ON states(status);
CREATE INDEX IF NOT EXISTS idx_states_created_by ON states(created_by);
CREATE INDEX IF NOT EXISTS idx_states_updated_by ON states(updated_by);

-- 添加外键约束
ALTER TABLE states DROP CONSTRAINT IF EXISTS fk_states_country_id;
ALTER TABLE states ADD CONSTRAINT fk_states_country_id FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE;

-- 为states表创建更新时间触发器
DROP TRIGGER IF EXISTS update_states_updated_at ON states;
CREATE TRIGGER update_states_updated_at BEFORE UPDATE ON states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建视图：获取完整的地址信息（包含税率和运费信息）
CREATE OR REPLACE VIEW v_location_rates AS
SELECT 
    s.id as state_id,
    s.name as state_name,
    s.state_code,
    s.country_id,
    c.name as country_name,
    c.iso2 as country_code,
    c.iso3,
    -- 税率：优先使用州/省税率，如果为NULL则使用国家税率
    COALESCE(s.tax_rate, c.tax_rate, 0.0000) as effective_tax_rate,
    -- 运费费率：优先使用州/省运费费率，如果为NULL则使用国家运费费率
    COALESCE(s.shipping_rate, c.shipping_rate, 0.0000) as effective_shipping_rate,
    -- 运费计算方式：优先使用州/省设置，如果为NULL则使用国家设置
    COALESCE(s.shipping_rate_type, c.shipping_rate_type, 'fixed') as effective_shipping_rate_type,
    c.currency,
    c.currency_symbol,
    s.latitude as state_latitude,
    s.longitude as state_longitude,
    c.latitude as country_latitude,
    c.longitude as country_longitude
FROM states s
INNER JOIN countries c ON s.country_id = c.id
WHERE s.deleted = FALSE AND c.deleted = FALSE
    AND s.status = 'active' AND c.status = 'active';

COMMENT ON VIEW v_location_rates IS '地址税率和运费费率视图，提供完整的地理位置和费率信息';

-- 创建视图：获取国家及其时区信息
CREATE OR REPLACE VIEW v_countries_with_timezones AS
SELECT 
    c.id,
    c.name,
    c.iso2,
    c.iso3,
    c.currency,
    c.currency_symbol,
    c.region,
    c.subregion,
    ct.zone_name,
    ct.gmt_offset,
    ct.gmt_offset_name,
    ct.abbreviation,
    ct.tz_name
FROM countries c
LEFT JOIN country_timezones ct ON c.id = ct.country_id AND ct.deleted = FALSE AND ct.status = 'active'
WHERE c.deleted = FALSE AND c.status = 'active'
ORDER BY c.name, ct.zone_name;

COMMENT ON VIEW v_countries_with_timezones IS '国家及其时区信息视图';

-- 创建视图：获取国家及其翻译信息
CREATE OR REPLACE VIEW v_countries_with_translations AS
SELECT 
    c.id,
    c.name as original_name,
    c.iso2,
    c.iso3,
    c.currency,
    c.currency_symbol,
    c.region,
    c.subregion,
    ctr.language_code,
    ctr.country_name as translated_name
FROM countries c
LEFT JOIN country_translations ctr ON c.id = ctr.country_id AND ctr.deleted = FALSE AND ctr.status = 'active'
WHERE c.deleted = FALSE AND c.status = 'active'
ORDER BY c.name, ctr.language_code;

COMMENT ON VIEW v_countries_with_translations IS '国家及其多语言翻译信息视图';

-- 创建函数：获取国家的所有时区
CREATE OR REPLACE FUNCTION get_country_timezones(country_iso2 VARCHAR(2))
RETURNS TABLE(
    zone_name VARCHAR(100),
    gmt_offset INTEGER,
    gmt_offset_name VARCHAR(20),
    abbreviation VARCHAR(10),
    tz_name VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ct.zone_name,
        ct.gmt_offset,
        ct.gmt_offset_name,
        ct.abbreviation,
        ct.tz_name
    FROM countries c
    JOIN country_timezones ct ON c.id = ct.country_id
    WHERE c.iso2 = country_iso2 
        AND c.deleted = FALSE AND c.status = 'active'
        AND ct.deleted = FALSE AND ct.status = 'active'
    ORDER BY ct.zone_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_country_timezones(VARCHAR) IS '获取指定国家的所有时区信息';

-- 创建函数：获取国家的翻译名称
CREATE OR REPLACE FUNCTION get_country_translation(country_iso2 VARCHAR(2), lang_code VARCHAR(10))
RETURNS VARCHAR(255) AS $$
DECLARE
    translated_name VARCHAR(255);
BEGIN
    SELECT ctr.country_name INTO translated_name
    FROM countries c
    JOIN country_translations ctr ON c.id = ctr.country_id
    WHERE c.iso2 = country_iso2 
        AND ctr.language_code = lang_code
        AND c.deleted = FALSE AND c.status = 'active'
        AND ctr.deleted = FALSE AND ctr.status = 'active'
    LIMIT 1;
    
    -- 如果没有找到翻译，返回原始名称
    IF translated_name IS NULL THEN
        SELECT c.name INTO translated_name
        FROM countries c
        WHERE c.iso2 = country_iso2 
            AND c.deleted = FALSE AND c.status = 'active'
        LIMIT 1;
    END IF;
    
    RETURN translated_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_country_translation(VARCHAR, VARCHAR) IS '获取指定国家在指定语言下的翻译名称，如果没有翻译则返回原始名称';