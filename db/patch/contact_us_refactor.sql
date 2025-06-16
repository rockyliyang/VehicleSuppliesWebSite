ALTER TABLE users 
MODIFY COLUMN user_role ENUM('admin', 'user', 'business') NOT NULL DEFAULT 'user';

ALTER TABLE users 
ADD COLUMN language VARCHAR(10) DEFAULT NULL COMMENT 'User preferred language for emails, NULL means English';