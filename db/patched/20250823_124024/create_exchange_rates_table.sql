-- 汇率表创建脚本
-- 描述：创建汇率表用于存储货币汇率信息
-- 作者：System
-- 日期：2024-01-22

BEGIN;

-- 创建汇率表
CREATE TABLE IF NOT EXISTS exchange_rates (
    id BIGSERIAL PRIMARY KEY, -- 主键ID
    guid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE, -- 全局唯一标识符
    
    -- 汇率业务字段
    exchange_rate NUMERIC(10,6) NOT NULL, -- 汇率值，支持6位小数精度
    from_currency VARCHAR(8) NOT NULL, -- 源货币代码 (如 USD)
    to_currency VARCHAR(8) NOT NULL, -- 目标货币代码 (如 CNY)
    
    -- 汇率元数据
    rate_date DATE NOT NULL, -- 汇率日期
    source VARCHAR(32) DEFAULT 'ExchangeRate-API', -- 汇率数据源
    status VARCHAR(16) DEFAULT 'active', -- 状态: active-有效, inactive-无效
    
    -- 系统字段
    deleted BOOLEAN DEFAULT FALSE, -- 软删除标记: FALSE-正常, TRUE-已删除
    created_at TIMESTAMPTZ DEFAULT NOW(), -- 创建时间
    updated_at TIMESTAMPTZ DEFAULT NOW() -- 更新时间
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_exchange_rates_guid ON exchange_rates (guid);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates (from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates (rate_date);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_status ON exchange_rates (status);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_deleted ON exchange_rates (deleted);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_created_at ON exchange_rates (created_at);

-- 创建唯一约束（同一天同一货币对只能有一条有效记录）
CREATE UNIQUE INDEX IF NOT EXISTS uk_exchange_rates_daily 
ON exchange_rates (from_currency, to_currency, rate_date) 
WHERE deleted = FALSE AND status = 'active';

-- 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建更新时间触发器
DROP TRIGGER IF EXISTS update_exchange_rates_updated_at ON exchange_rates;
CREATE TRIGGER update_exchange_rates_updated_at 
    BEFORE UPDATE ON exchange_rates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 表注释
COMMENT ON TABLE exchange_rates IS '汇率表 - 存储各种货币对的汇率信息';
COMMENT ON COLUMN exchange_rates.exchange_rate IS '汇率值，表示1单位源货币兑换目标货币的数量';
COMMENT ON COLUMN exchange_rates.from_currency IS '源货币代码，如USD';
COMMENT ON COLUMN exchange_rates.to_currency IS '目标货币代码，如CNY';
COMMENT ON COLUMN exchange_rates.rate_date IS '汇率生效日期';
COMMENT ON COLUMN exchange_rates.source IS '汇率数据来源';

COMMIT;

-- 创建脚本结束