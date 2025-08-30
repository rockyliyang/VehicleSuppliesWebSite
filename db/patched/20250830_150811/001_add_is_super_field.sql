-- Patch: Add is_super field to users table
-- Date: 2024-12-19
-- Description: Add is_super boolean field to users table for super user identification

-- Add is_super column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment for the new column
COMMENT ON COLUMN users.is_super IS '超级用户标识，可访问所有状态的产品记录';

-- Optional: Update existing admin users to be super users (uncomment if needed)
-- UPDATE users SET is_super = TRUE WHERE user_role = 'admin';

COMMIT;