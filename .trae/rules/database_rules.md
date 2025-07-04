---
description: 数据库设计规则 - 表结构、字段类型、软删除等规范 (PostgreSQL)
globs: 
alwaysApply: true
---
# 数据库设计规则 (PostgreSQL)

## 表结构设计规范

### 主键设计
1. **所有表使用 BIGINT 做主键**
   - 主键字段名统一为 `id`
   - 类型：`BIGSERIAL PRIMARY KEY` (PostgreSQL自增序列)
   - 确保足够的数值范围支持大规模数据

2. **GUID 字段要求**
   - 每个表必须有一个 UUID 类型字段自动存储对应的 GUID
   - 字段名统一为 `guid`
   - 类型：`UUID DEFAULT gen_random_uuid()`
   - 用于外部系统集成和数据同步

### 软删除机制
1. **禁止物理删除**
   - 所有记录不能直接删除
   - 必须使用 `deleted` 字段进行软删除

2. **软删除字段规范**
   ```sql
   deleted BOOLEAN DEFAULT FALSE -- 软删除标记: FALSE-正常, TRUE-已删除
   ```

3. **软删除查询规范**
   ```sql
   -- 查询正常记录
   SELECT id, name, email FROM users WHERE deleted = FALSE;
   
   -- 软删除操作
   UPDATE users SET deleted = TRUE, updated_at = NOW() WHERE id = $1;
   ```

4. **软删除与唯一索引**
   - **问题**: 直接在业务字段上建唯一索引会导致软删除记录被判断为重复
   - **解决方案**: 使用 Partial Index (部分索引)，只对未删除记录生效
   
   ```sql
   -- 创建部分唯一索引：只对未删除记录生效
   CREATE UNIQUE INDEX uk_active_unique 
   ON table_name (field1, field2) 
   WHERE deleted = FALSE;
   ```
   
   **示例应用**:
   ```sql
   -- 购物车表：同一用户同一商品只能有一条未删除记录
   CREATE UNIQUE INDEX unique_active_user_product 
   ON cart (user_id, product_id) 
   WHERE deleted = FALSE;
   
   -- 内容表：同一导航同一语言只能有一条未删除记录
   CREATE UNIQUE INDEX uk_active_nav_lang 
   ON content (nav_id, language_code) 
   WHERE deleted = FALSE;
   ```

### 字段类型规范

#### 字符串类型长度
**所有字符串类型长度必须为 8 的倍数**

```sql
-- 推荐的字符串长度
VARCHAR(8)     -- 极短文本（状态码等）
VARCHAR(16)    -- 短文本（用户名、手机号等）
VARCHAR(32)    -- 中等文本（姓名、标题等）
VARCHAR(64)    -- 较长文本（邮箱、地址等）
VARCHAR(128)   -- 长文本（描述、备注等）
VARCHAR(256)   -- 超长文本（详细描述等）
VARCHAR(512)   -- 特长文本（富文本内容等）
```

#### 常用字段类型映射
```sql
-- 用户相关
username VARCHAR(32)     -- 用户名
email VARCHAR(64)        -- 邮箱地址
phone VARCHAR(16)        -- 手机号
password_hash VARCHAR(128) -- 密码哈希

-- 产品相关
product_name VARCHAR(64)   -- 产品名称
product_code VARCHAR(32)   -- 产品编码
description TEXT           -- 产品描述
price NUMERIC(10,2)        -- 价格 (PostgreSQL推荐NUMERIC)

-- 订单相关
order_number VARCHAR(32)   -- 订单号
status VARCHAR(16)         -- 订单状态
remark VARCHAR(256)        -- 备注
```

## 表设计模板

### 基础表结构模板
```sql
CREATE TABLE table_name (
    id BIGSERIAL PRIMARY KEY, -- 主键ID
    guid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE, -- 全局唯一标识符
    
    -- 业务字段
    name VARCHAR(64) NOT NULL, -- 名称
    description VARCHAR(256) DEFAULT '', -- 描述
    status VARCHAR(16) DEFAULT 'active', -- 状态
    
    -- 系统字段
    deleted BOOLEAN DEFAULT FALSE, -- 软删除标记: FALSE-正常, TRUE-已删除
    created_at TIMESTAMPTZ DEFAULT NOW(), -- 创建时间
    updated_at TIMESTAMPTZ DEFAULT NOW() -- 更新时间
);

-- 创建索引
CREATE INDEX idx_table_name_guid ON table_name (guid);
CREATE INDEX idx_table_name_status ON table_name (status);
CREATE INDEX idx_table_name_deleted ON table_name (deleted);
CREATE INDEX idx_table_name_created_at ON table_name (created_at);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_table_name_updated_at 
    BEFORE UPDATE ON table_name 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 表注释
COMMENT ON TABLE table_name IS '表注释';
```

### 用户表示例
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY, -- 用户ID
    guid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE, -- 用户GUID
    
    username VARCHAR(32) NOT NULL, -- 用户名
    email VARCHAR(64) NOT NULL, -- 邮箱地址
    phone VARCHAR(16) DEFAULT '', -- 手机号
    password_hash VARCHAR(128) NOT NULL, -- 密码哈希
    
    first_name VARCHAR(32) DEFAULT '', -- 名
    last_name VARCHAR(32) DEFAULT '', -- 姓
    avatar_url VARCHAR(256) DEFAULT '', -- 头像URL
    
    status VARCHAR(16) DEFAULT 'active', -- 用户状态: active-活跃, inactive-非活跃, suspended-暂停
    email_verified BOOLEAN DEFAULT FALSE, -- 邮箱验证状态: FALSE-未验证, TRUE-已验证
    
    deleted BOOLEAN DEFAULT FALSE, -- 软删除标记: FALSE-正常, TRUE-已删除
    created_at TIMESTAMPTZ DEFAULT NOW(), -- 创建时间
    updated_at TIMESTAMPTZ DEFAULT NOW() -- 更新时间
);

-- 创建索引
CREATE INDEX idx_users_guid ON users (guid);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_phone ON users (phone);
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_deleted ON users (deleted);

-- 创建唯一约束（只对未删除记录生效）
CREATE UNIQUE INDEX uk_users_username ON users (username) WHERE deleted = FALSE;
CREATE UNIQUE INDEX uk_users_email ON users (email) WHERE deleted = FALSE;

-- 创建更新时间触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 表注释
COMMENT ON TABLE users IS '用户表';
```

## 索引设计规范

### 必需索引
1. **主键索引**：自动创建
2. **GUID索引**：`CREATE INDEX idx_table_guid ON table_name (guid)`
3. **软删除索引**：`CREATE INDEX idx_table_deleted ON table_name (deleted)`
4. **时间索引**：`CREATE INDEX idx_table_created_at ON table_name (created_at)`

### 业务索引
1. **唯一性约束**：使用部分索引，只对未删除记录生效
2. **查询优化**：经常用于WHERE条件的字段
3. **外键索引**：关联查询的字段
4. **复合索引**：多字段组合查询
5. **部分索引**：PostgreSQL特有，可以基于条件创建索引

```sql
-- 复合索引示例
CREATE INDEX idx_status_deleted ON table_name (status, deleted);
CREATE INDEX idx_user_created ON table_name (user_id, created_at);

-- 部分索引示例（PostgreSQL特性）
CREATE INDEX idx_active_users ON users (username) WHERE deleted = FALSE;
CREATE INDEX idx_verified_emails ON users (email) WHERE email_verified = TRUE;
```

## 数据类型选择指南

### 数值类型
```sql
BOOLEAN        -- 布尔值 (TRUE/FALSE)
SMALLINT       -- 短整数 (-32,768 到 32,767)
INTEGER        -- 整数 (-2,147,483,648 到 2,147,483,647)
BIGINT         -- 长整数 (手动指定)
BIGSERIAL      -- 自增长整数 (主键推荐)
NUMERIC(10,2)  -- 精确小数 (价格等，推荐)
REAL           -- 单精度浮点数
DOUBLE PRECISION -- 双精度浮点数
```

### 时间类型
```sql
TIMESTAMPTZ    -- 带时区时间戳 (推荐用于created_at, updated_at)
TIMESTAMP      -- 不带时区时间戳
DATE           -- 日期 (生日等)
TIME           -- 时间 (营业时间等)
INTERVAL       -- 时间间隔
```

### 文本类型
```sql
VARCHAR(n)     -- 可变长字符串 (n为8的倍数)
CHAR(n)        -- 固定长字符串 (状态码等)
TEXT           -- 长文本 (文章内容等)
JSON           -- JSON数据 (配置信息等)
JSONB          -- 二进制JSON (推荐，性能更好)
```

### PostgreSQL特有类型
```sql
UUID           -- 通用唯一标识符
INET           -- IP地址
CIDR           -- 网络地址
ARRAY          -- 数组类型
HSTORE         -- 键值对存储
```

## 命名规范

### 表名规范
- 使用复数形式：`users`, `products`, `orders`
- 使用下划线分隔：`product_categories`, `order_items`
- 避免保留字：不使用 `order`, `group`, `user` 等PostgreSQL保留字
- 使用小写字母：PostgreSQL对大小写敏感，统一使用小写等postgreSQL保留字

### 字段名规范
- 使用下划线命名：`first_name`, `created_at`
- 布尔字段前缀：`is_`, `has_`, `can_`
- 时间字段后缀：`_at`, `_time`
- 外键字段后缀：`_id`

### 索引名规范
```sql
idx_表名_字段名           -- 单字段索引
idx_表名_字段1_字段2      -- 复合索引
uk_表名_字段名            -- 唯一索引
fk_表名_字段名            -- 外键索引
partial_表名_条件         -- 部分索引
```

## 性能优化建议

### 查询优化
1. **避免SELECT ***
   ```sql
   -- 错误
   SELECT * FROM users WHERE deleted = FALSE;
   
   -- 正确
   SELECT id, username, email FROM users WHERE deleted = FALSE;
   ```

2. **合理使用索引**
   - 为经常查询的字段创建索引
   - 使用部分索引优化特定条件查询
   - 避免过多索引影响写入性能
   - 使用 EXPLAIN ANALYZE 分析查询计划

3. **分页查询优化**
   ```sql
   -- 使用LIMIT和OFFSET进行分页
   SELECT id, name FROM products 
   WHERE deleted = FALSE 
   ORDER BY created_at DESC 
   LIMIT 20 OFFSET 0;
   
   -- 大数据量时使用游标分页（性能更好）
   SELECT id, name FROM products 
   WHERE deleted = FALSE AND created_at < $1
   ORDER BY created_at DESC 
   LIMIT 20;
   ```

4. **PostgreSQL特有优化**
   ```sql
   -- 使用JSONB操作符
   SELECT * FROM products WHERE metadata @> '{"category": "electronics"}';
   
   -- 使用数组操作
   SELECT * FROM users WHERE tags && ARRAY['vip', 'premium'];
   
   -- 使用全文搜索
   SELECT * FROM articles WHERE to_tsvector('english', content) @@ to_tsquery('postgresql');
   ```

### 存储优化
1. **使用合适的数据类型**：选择最小满足需求的数据类型
2. **字符编码**：PostgreSQL默认使用UTF-8
3. **定期维护**：
   ```sql
   -- 更新表统计信息
   ANALYZE table_name;
   
   -- 清理死元组
   VACUUM table_name;
   
   -- 完全清理并重建索引
   VACUUM FULL table_name;
   
   -- 重建索引
   REINDEX TABLE table_name;
   ```
4. **使用表分区**：对大表进行分区提高查询性能
5. **配置自动清理**：设置合适的autovacuum参数

## 数据迁移规范

### 迁移脚本命名
```
YYYYMMDD_HHMMSS_description.sql
例如：20240315_143000_create_users_table.sql
```

### 迁移脚本结构
```sql
-- 迁移脚本开始
-- 描述：创建用户表
-- 作者：开发者姓名
-- 日期：2024-03-15

BEGIN;

-- 创建扩展（如果需要）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建表
CREATE TABLE IF NOT EXISTS users (
    -- 表结构定义
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_guid ON users (guid);

-- 创建触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入初始数据（如果需要）
INSERT INTO users (username, email) VALUES 
('admin', 'admin@example.com')
ON CONFLICT DO NOTHING;

COMMIT;

-- 迁移脚本结束
```

## 安全规范

### 数据保护
1. **敏感数据加密**：密码、身份证号等
2. **访问控制**：最小权限原则
3. **数据备份**：定期备份重要数据
4. **审计日志**：记录重要操作

### SQL注入防护
1. **使用参数化查询**：使用 $1, $2 等占位符
   ```sql
   -- 正确的参数化查询
   SELECT * FROM users WHERE email = $1 AND deleted = FALSE;
   ```
2. **输入验证**：验证用户输入
3. **权限控制**：限制数据库用户权限
4. **使用预处理语句**：提高性能和安全性

### PostgreSQL特有安全特性
1. **行级安全策略 (RLS)**：
   ```sql
   -- 启用行级安全
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   
   -- 创建安全策略
   CREATE POLICY user_policy ON users
   FOR ALL TO app_user
   USING (user_id = current_setting('app.current_user_id')::bigint);
   ```

2. **角色和权限管理**：
   ```sql
   -- 创建应用角色
   CREATE ROLE app_user LOGIN PASSWORD 'secure_password';
   
   -- 授予表权限
   GRANT SELECT, INSERT, UPDATE ON users TO app_user;
   GRANT USAGE ON SEQUENCE users_id_seq TO app_user;
   ```

---

> 📝 **注意**: 所有数据库操作都应遵循以上PostgreSQL规范，确保数据一致性和系统稳定性。迁移时注意MySQL和PostgreSQL的语法差异。