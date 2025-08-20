-- 为inquiry_messages表添加is_emailed字段
-- 用于标记消息是否已发送邮件通知
-- 创建时间: 2025-01-16

-- 添加is_emailed字段
ALTER TABLE inquiry_messages 
ADD COLUMN IF NOT EXISTS is_emailed SMALLINT DEFAULT 0;

-- 添加字段注释
COMMENT ON COLUMN inquiry_messages.is_emailed IS '是否已发邮件: 0-未发送, 1-已发送';

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_inquiry_messages_is_emailed ON inquiry_messages(is_emailed);
CREATE INDEX IF NOT EXISTS idx_inquiry_messages_read_emailed ON inquiry_messages(is_read, is_emailed, deleted);

-- 更新现有记录，将所有现有消息标记为已发送邮件（避免重复发送历史消息）
UPDATE inquiry_messages 
SET is_emailed = 1 
WHERE is_emailed IS NULL OR is_emailed = 0;

COMMIT;