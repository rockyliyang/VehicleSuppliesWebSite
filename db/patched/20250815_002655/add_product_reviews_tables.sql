-- 产品评论功能数据库迁移脚本
-- 创建时间: 2024-12-19
-- 描述: 添加产品评论和评论图片表

-- 检查并创建产品评论表
CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  product_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_content TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_reply TEXT,
  admin_reply_at TIMESTAMP DEFAULT NULL,
  admin_reply_by BIGINT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE product_reviews IS '产品评论表';
COMMENT ON COLUMN product_reviews.product_id IS '产品ID';
COMMENT ON COLUMN product_reviews.user_id IS '评论用户ID';
COMMENT ON COLUMN product_reviews.rating IS '评价等级，1-5星';
COMMENT ON COLUMN product_reviews.review_content IS '评论内容';
COMMENT ON COLUMN product_reviews.is_anonymous IS '是否匿名评论';
COMMENT ON COLUMN product_reviews.status IS '审核状态：pending-待审核，approved-已通过，rejected-已拒绝';
COMMENT ON COLUMN product_reviews.admin_reply IS '管理员回复内容';
COMMENT ON COLUMN product_reviews.admin_reply_at IS '管理员回复时间';
COMMENT ON COLUMN product_reviews.admin_reply_by IS '管理员回复者ID';
COMMENT ON COLUMN product_reviews.created_by IS '创建者用户ID';
COMMENT ON COLUMN product_reviews.updated_by IS '最后更新者用户ID';

-- 创建唯一索引（一个用户对一个产品只能评论一次）
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_product_review ON product_reviews (user_id, product_id) WHERE deleted = FALSE;

-- 创建普通索引
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews (rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews (status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_by ON product_reviews (created_by);
CREATE INDEX IF NOT EXISTS idx_product_reviews_updated_by ON product_reviews (updated_by);
CREATE INDEX IF NOT EXISTS idx_product_reviews_admin_reply_by ON product_reviews (admin_reply_by);

-- 添加外键约束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_product_reviews_product_id') THEN
        ALTER TABLE product_reviews ADD CONSTRAINT fk_product_reviews_product_id FOREIGN KEY (product_id) REFERENCES products(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_product_reviews_user_id') THEN
        ALTER TABLE product_reviews ADD CONSTRAINT fk_product_reviews_user_id FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_product_reviews_created_by') THEN
        ALTER TABLE product_reviews ADD CONSTRAINT fk_product_reviews_created_by FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_product_reviews_updated_by') THEN
        ALTER TABLE product_reviews ADD CONSTRAINT fk_product_reviews_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_product_reviews_admin_reply_by') THEN
        ALTER TABLE product_reviews ADD CONSTRAINT fk_product_reviews_admin_reply_by FOREIGN KEY (admin_reply_by) REFERENCES users(id);
    END IF;
END
$$;

-- 创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_product_reviews_modtime ON product_reviews;
CREATE TRIGGER update_product_reviews_modtime
    BEFORE UPDATE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 检查并创建产品评论图片表
CREATE TABLE IF NOT EXISTS product_review_images (
  id BIGSERIAL PRIMARY KEY,
  guid UUID DEFAULT gen_random_uuid() NOT NULL,
  review_id BIGINT DEFAULT NULL,
  session_id VARCHAR(255) DEFAULT NULL,
  image_url VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT DEFAULT NULL,
  updated_by BIGINT DEFAULT NULL
);

-- 添加注释
COMMENT ON TABLE product_review_images IS '产品评论图片表';
COMMENT ON COLUMN product_review_images.review_id IS '关联的评论ID，可为空（评论创建前上传图片时）';
COMMENT ON COLUMN product_review_images.session_id IS '会话ID，用于在评论创建前关联图片';
COMMENT ON COLUMN product_review_images.image_url IS '图片URL路径';
COMMENT ON COLUMN product_review_images.sort_order IS '图片排序，数值越小排序越靠前';
COMMENT ON COLUMN product_review_images.created_by IS '创建者用户ID';
COMMENT ON COLUMN product_review_images.updated_by IS '最后更新者用户ID';

-- 创建普通索引
CREATE INDEX IF NOT EXISTS idx_product_review_images_review_id ON product_review_images (review_id);
CREATE INDEX IF NOT EXISTS idx_product_review_images_session_id ON product_review_images (session_id);
CREATE INDEX IF NOT EXISTS idx_product_review_images_sort_order ON product_review_images (review_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_review_images_created_by ON product_review_images (created_by);
CREATE INDEX IF NOT EXISTS idx_product_review_images_updated_by ON product_review_images (updated_by);

-- 添加外键约束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_product_review_images_review_id') THEN
        ALTER TABLE product_review_images ADD CONSTRAINT fk_product_review_images_review_id FOREIGN KEY (review_id) REFERENCES product_reviews(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_product_review_images_created_by') THEN
        ALTER TABLE product_review_images ADD CONSTRAINT fk_product_review_images_created_by FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_product_review_images_updated_by') THEN
        ALTER TABLE product_review_images ADD CONSTRAINT fk_product_review_images_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
    END IF;
END
$$;

-- 创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_product_review_images_modtime ON product_review_images;
CREATE TRIGGER update_product_review_images_modtime
    BEFORE UPDATE ON product_review_images
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 创建用户图片存储目录的函数（仅作为文档说明）
-- 用户图片存储路径: /public/static/user/{userid}/
-- 例如: /public/static/user/123/review_image_1.jpg

-- 插入一些测试数据（可选）
-- 注意：这里假设已有产品ID为1和用户ID为1的数据
-- INSERT INTO product_reviews (product_id, user_id, rating, review_content, status, created_by, updated_by) 
-- VALUES (1, 1, 5, '这个产品非常好用，质量很棒！', 'approved', 1, 1);

COMMIT;

-- 验证表创建成功
SELECT 
    'product_reviews' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'product_reviews'
UNION ALL
SELECT 
    'product_review_images' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'product_review_images';

-- 显示表结构
\d product_reviews;
\d product_review_images;