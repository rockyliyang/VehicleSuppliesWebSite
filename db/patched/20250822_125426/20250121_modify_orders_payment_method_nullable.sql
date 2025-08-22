-- Patch script to modify orders table payment_method column to allow NULL values
-- Created: 2025-01-21
-- Description: Allow payment_method to be NULL when creating orders without immediate payment selection

-- Modify the payment_method column to allow NULL values
ALTER TABLE orders ALTER COLUMN payment_method DROP NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN orders.payment_method IS 'Payment method: card, alipay, wechat, paypal. Can be NULL when order is created without payment selection';

-- Optional: Update existing records if needed (uncomment if required)
-- UPDATE orders SET payment_method = NULL WHERE payment_method = '' OR payment_method IS NULL;

PRINT 'Successfully modified orders.payment_method column to allow NULL values';