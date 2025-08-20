-- Patch 001: Add banners table
-- Description: Create banners table for storing banner carousel information
-- Date: 2024-01-15
-- Author: System

-- Check if banners table already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'banners') THEN
        -- Create banners table
        CREATE TABLE banners (
          id BIGSERIAL PRIMARY KEY,
          guid UUID DEFAULT gen_random_uuid() NOT NULL,
          image_url VARCHAR(512) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          link VARCHAR(512),
          sort_order INT NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted BOOLEAN NOT NULL DEFAULT FALSE,
          created_by BIGINT DEFAULT NULL,
          updated_by BIGINT DEFAULT NULL
        );

        -- Add table and column comments
        COMMENT ON TABLE banners IS 'Banner轮播图表';
        COMMENT ON COLUMN banners.image_url IS 'Banner图片URL';
        COMMENT ON COLUMN banners.title IS 'Banner标题';
        COMMENT ON COLUMN banners.description IS 'Banner描述';
        COMMENT ON COLUMN banners.link IS 'Banner链接地址';
        COMMENT ON COLUMN banners.sort_order IS '排序字段，数值越大排序越靠前';
        COMMENT ON COLUMN banners.is_active IS '是否启用';
        COMMENT ON COLUMN banners.created_by IS '创建者用户ID';
        COMMENT ON COLUMN banners.updated_by IS '最后更新者用户ID';

        -- Create indexes
        CREATE INDEX idx_banners_sort_order ON banners (sort_order DESC);
        CREATE INDEX idx_banners_is_active ON banners (is_active);
        CREATE INDEX idx_banners_created_by ON banners (created_by);
        CREATE INDEX idx_banners_updated_by ON banners (updated_by);

        -- Add foreign key constraints (only if users table exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
            ALTER TABLE banners ADD CONSTRAINT fk_banners_created_by FOREIGN KEY (created_by) REFERENCES users(id);
            ALTER TABLE banners ADD CONSTRAINT fk_banners_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
        END IF;

        -- Create update timestamp trigger (only if function exists)
        IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_modified_column') THEN
            CREATE TRIGGER update_banners_modtime
                BEFORE UPDATE ON banners
                FOR EACH ROW
                EXECUTE FUNCTION update_modified_column();
        END IF;

        RAISE NOTICE 'Banners table created successfully';
    ELSE
        RAISE NOTICE 'Banners table already exists, skipping creation';
    END IF;
END
$$;

-- Insert some sample data (optional)
INSERT INTO banners (image_url, title, description, link, sort_order, is_active) VALUES
('https://example.com/banner1.jpg', 'Welcome Banner', 'Welcome to our vehicle supplies store', 'https://example.com/products', 100, true),
('https://example.com/banner2.jpg', 'Special Offer', 'Get 20% off on all automotive parts', 'https://example.com/offers', 90, true),
('https://example.com/banner3.jpg', 'New Arrivals', 'Check out our latest vehicle accessories', 'https://example.com/new-arrivals', 80, true)
ON CONFLICT DO NOTHING;

RAISE NOTICE 'Patch 001: Add banners table - Completed successfully';