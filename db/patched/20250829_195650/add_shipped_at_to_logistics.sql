-- Patch: 为logistics表添加shipped_at和shipped_time_zone字段
-- 创建时间: 2025-01-16
-- 描述: 添加发货时间和发货时区字段到物流信息表

-- 添加shipped_at字段（发货时间）
ALTER TABLE logistics ADD COLUMN shipped_at TIMESTAMPTZ DEFAULT NULL;

-- 添加shipped_time_zone字段（发货时区）
ALTER TABLE logistics ADD COLUMN shipped_time_zone VARCHAR(64) DEFAULT NULL;

-- 添加字段注释
COMMENT ON COLUMN logistics.shipped_at IS '发货时间（UTC时间）';
COMMENT ON COLUMN logistics.shipped_time_zone IS '发货时的时区信息';

-- 创建索引以提高查询性能
CREATE INDEX idx_logistics_shipped_at ON logistics (shipped_at);

-- 验证字段是否添加成功
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'logistics' 
AND column_name IN ('shipped_at', 'shipped_time_zone')
ORDER BY column_name;