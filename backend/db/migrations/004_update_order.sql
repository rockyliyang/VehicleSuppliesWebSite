-- 增加 orders 表邮编字段（如未存在）
ALTER TABLE orders ADD COLUMN shipping_zip_code VARCHAR(16) NOT NULL DEFAULT '' AFTER shipping_address;

-- order_items 表增加 product_id, product_code 字段（如未存在）
ALTER TABLE order_items ADD COLUMN product_id BIGINT NOT NULL AFTER order_id;
ALTER TABLE order_items ADD COLUMN product_code VARCHAR(64) NOT NULL DEFAULT '' AFTER product_name;
ALTER TABLE orders ADD COLUMN paypal_order_id VARCHAR(64) DEFAULT NULL COMMENT 'PayPal原始订单号' AFTER payment_id;