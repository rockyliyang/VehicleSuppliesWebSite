-- ========================================
-- 为所有表添加 created_by 和 updated_by 字段的 ALTER SQL 语句
-- ========================================

USE vehicle_supplies_db;

-- 1. 用户表 (users)
-- 注意：users表是基础表，其他表的外键会引用它，所以先处理
ALTER TABLE users 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by);

-- 为users表添加外键约束（自引用）
ALTER TABLE users 
ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 2. 产品分类表 (product_categories)
ALTER TABLE product_categories 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by),
ADD CONSTRAINT fk_product_categories_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_product_categories_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 3. 产品表 (products)
ALTER TABLE products 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by),
ADD CONSTRAINT fk_products_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_products_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 4. 产品图片表 (product_images)
ALTER TABLE product_images 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by),
ADD CONSTRAINT fk_product_images_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_product_images_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 5. 订单表 (orders)
ALTER TABLE orders 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by),
ADD CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_orders_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 6. 订单项表 (order_items)
ALTER TABLE order_items 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by),
ADD CONSTRAINT fk_order_items_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_order_items_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 7. 物流信息表 (logistics)
ALTER TABLE logistics 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by),
ADD CONSTRAINT fk_logistics_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_logistics_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 8. 网站配置表 (site_settings)
ALTER TABLE site_settings 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by),
ADD CONSTRAINT fk_site_settings_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_site_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 9. 公司信息表 (company_info)
ALTER TABLE company_info 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by),
ADD CONSTRAINT fk_company_info_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_company_info_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 10. Banner图片表 (banners)
ALTER TABLE banners 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by),
ADD CONSTRAINT fk_banners_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_banners_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 11. 新闻资讯表 (news)
ALTER TABLE news 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by),
ADD CONSTRAINT fk_news_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_news_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 12. 购物车表 (cart)
ALTER TABLE cart 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by),
ADD CONSTRAINT fk_cart_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_cart_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 13. 通用内容导航菜单表 (common_content_nav)
ALTER TABLE common_content_nav 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by),
ADD CONSTRAINT fk_common_content_nav_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_common_content_nav_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 14. 通用内容表 (common_content)
ALTER TABLE common_content 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by),
ADD CONSTRAINT fk_common_content_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_common_content_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 15. 通用内容图片表 (common_content_images)
ALTER TABLE common_content_images 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by),
ADD CONSTRAINT fk_common_content_images_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_common_content_images_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- 16. 语言翻译表 (language_translations)
ALTER TABLE language_translations 
ADD COLUMN created_by BIGINT COMMENT '创建人ID' AFTER created_at,
ADD COLUMN updated_by BIGINT COMMENT '更新人ID' AFTER updated_at,
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_updated_by (updated_by),
ADD CONSTRAINT fk_language_translations_created_by FOREIGN KEY (created_by) REFERENCES users(id),
ADD CONSTRAINT fk_language_translations_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- ========================================
-- 注意事项：
-- 1. business_groups, user_business_groups, contact_messages 表已经包含了 created_by 和 updated_by 字段
-- 2. 执行此脚本前请备份数据库
-- 3. 建议在测试环境先执行验证
-- 4. 执行后需要修改后端代码以支持这些字段
-- 5. 新增表：cart, common_content_nav, common_content, common_content_images, language_translations
-- ========================================