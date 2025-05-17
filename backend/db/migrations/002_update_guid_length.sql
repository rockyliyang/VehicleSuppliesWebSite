-- 修改 product_categories 表的 guid 字段长度
ALTER TABLE product_categories MODIFY COLUMN guid VARCHAR(36) NOT NULL COMMENT '全局唯一标识符';

-- 修改 products 表的 guid 字段长度
ALTER TABLE products MODIFY COLUMN guid VARCHAR(36) NOT NULL COMMENT '全局唯一标识符'; 