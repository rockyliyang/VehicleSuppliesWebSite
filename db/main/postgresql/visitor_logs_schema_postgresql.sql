-- 创建用户访问记录表
-- 创建时间: 2024-01-15
-- 描述: 记录用户访问网站的详细信息，用于统计分析

-- 创建访问记录表
CREATE TABLE IF NOT EXISTS visitor_logs (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  
  -- 访问者信息
  user_id BIGINT DEFAULT NULL,
  session_id VARCHAR(64) NOT NULL,
  visitor_ip VARCHAR(45) NOT NULL,
  
  -- 访问详情
  page_url VARCHAR(1024) NOT NULL,
  page_title VARCHAR(255) DEFAULT NULL,
  referrer_url VARCHAR(1024) DEFAULT NULL,
  
  -- 设备和浏览器信息
  user_agent TEXT DEFAULT NULL,
  device_type VARCHAR(32) DEFAULT NULL,
  browser_name VARCHAR(64) DEFAULT NULL,
  browser_version VARCHAR(32) DEFAULT NULL,
  operating_system VARCHAR(64) DEFAULT NULL,
  screen_resolution VARCHAR(32) DEFAULT NULL,
  
  -- 地理位置信息
  country VARCHAR(64) DEFAULT NULL,
  region VARCHAR(64) DEFAULT NULL,
  city VARCHAR(64) DEFAULT NULL,
  timezone VARCHAR(64) DEFAULT NULL,
  
  -- 访问统计
  visit_duration INT DEFAULT 0, -- 页面停留时间(秒)
  is_bounce BOOLEAN DEFAULT FALSE, -- 是否跳出访问
  is_new_visitor BOOLEAN DEFAULT TRUE, -- 是否新访客
  
  -- 系统字段
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE visitor_logs IS '用户访问记录表';
COMMENT ON COLUMN visitor_logs.user_id IS '关联的用户ID，匿名访问时为NULL';
COMMENT ON COLUMN visitor_logs.session_id IS '会话ID，用于关联同一次访问的多个页面';
COMMENT ON COLUMN visitor_logs.visitor_ip IS '访问者IP地址';
COMMENT ON COLUMN visitor_logs.page_url IS '访问的页面URL';
COMMENT ON COLUMN visitor_logs.page_title IS '页面标题';
COMMENT ON COLUMN visitor_logs.referrer_url IS '来源页面URL';
COMMENT ON COLUMN visitor_logs.user_agent IS '浏览器用户代理字符串';
COMMENT ON COLUMN visitor_logs.device_type IS '设备类型：desktop, mobile, tablet';
COMMENT ON COLUMN visitor_logs.browser_name IS '浏览器名称';
COMMENT ON COLUMN visitor_logs.browser_version IS '浏览器版本';
COMMENT ON COLUMN visitor_logs.operating_system IS '操作系统';
COMMENT ON COLUMN visitor_logs.screen_resolution IS '屏幕分辨率';
COMMENT ON COLUMN visitor_logs.country IS '国家';
COMMENT ON COLUMN visitor_logs.region IS '地区/省份';
COMMENT ON COLUMN visitor_logs.city IS '城市';
COMMENT ON COLUMN visitor_logs.timezone IS '时区';
COMMENT ON COLUMN visitor_logs.visit_duration IS '页面停留时间(秒)';
COMMENT ON COLUMN visitor_logs.is_bounce IS '是否跳出访问(只访问一个页面就离开)';
COMMENT ON COLUMN visitor_logs.is_new_visitor IS '是否新访客';
COMMENT ON COLUMN visitor_logs.created_by IS '创建者用户ID';
COMMENT ON COLUMN visitor_logs.updated_by IS '最后更新者用户ID';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_visitor_logs_user_id ON visitor_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_session_id ON visitor_logs (session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visitor_ip ON visitor_logs (visitor_ip);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_created_at ON visitor_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_page_url ON visitor_logs (page_url);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_country ON visitor_logs (country);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_device_type ON visitor_logs (device_type);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_browser_name ON visitor_logs (browser_name);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_created_by ON visitor_logs (created_by);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_updated_by ON visitor_logs (updated_by);

-- 添加外键约束
ALTER TABLE visitor_logs ADD CONSTRAINT fk_visitor_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE visitor_logs ADD CONSTRAINT fk_visitor_logs_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE visitor_logs ADD CONSTRAINT fk_visitor_logs_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 创建更新时间戳触发器
CREATE TRIGGER update_visitor_logs_modtime
    BEFORE UPDATE ON visitor_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();