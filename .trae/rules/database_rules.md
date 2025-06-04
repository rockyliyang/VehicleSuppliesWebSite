---
description: 数据库设计规则 - 表结构、字段类型、软删除等规范
globs: 
alwaysApply: true
---
# 数据库设计规则

## 表结构设计规范

### 主键设计
1. **所有表使用 BIGINT 做主键**
   - 主键字段名统一为 `id`
   - 类型：`BIGINT AUTO_INCREMENT PRIMARY KEY`
   - 确保足够的数值范围支持大规模数据

2. **GUID 字段要求**
   - 每个表必须有一个 BINARY 类型字段自动存储对应的 GUID
   - 字段名统一为 `guid`
   - 类型：`BINARY(16)`
   - 用于外部系统集成和数据同步

### 软删除机制
1. **禁止物理删除**
   - 所有记录不能直接删除
   - 必须使用 `deleted` 字段进行软删除

2. **软删除字段规范**
   ```sql
   deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记: 0-正常, 1-已删除'
   ```

3. **软删除查询规范**
   ```sql
   -- 查询正常记录
   SELECT id, name, email FROM users WHERE deleted = 0;
   
   -- 软删除操作
   UPDATE users SET deleted = 1, updated_at = NOW() WHERE id = ?;
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
price DECIMAL(10,2)        -- 价格

-- 订单相关
order_number VARCHAR(32)   -- 订单号
status VARCHAR(16)         -- 订单状态
remark VARCHAR(256)        -- 备注
```

## 表设计模板

### 基础表结构模板
```sql
CREATE TABLE table_name (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    guid BINARY(16) NOT NULL UNIQUE COMMENT '全局唯一标识符',
    
    -- 业务字段
    name VARCHAR(64) NOT NULL COMMENT '名称',
    description VARCHAR(256) DEFAULT '' COMMENT '描述',
    status VARCHAR(16) DEFAULT 'active' COMMENT '状态',
    
    -- 系统字段
    deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记: 0-正常, 1-已删除',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX idx_guid (guid),
    INDEX idx_status (status),
    INDEX idx_deleted (deleted),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='表注释';
```

### 用户表示例
```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    guid BINARY(16) NOT NULL UNIQUE COMMENT '用户GUID',
    
    username VARCHAR(32) NOT NULL UNIQUE COMMENT '用户名',
    email VARCHAR(64) NOT NULL UNIQUE COMMENT '邮箱地址',
    phone VARCHAR(16) DEFAULT '' COMMENT '手机号',
    password_hash VARCHAR(128) NOT NULL COMMENT '密码哈希',
    
    first_name VARCHAR(32) DEFAULT '' COMMENT '名',
    last_name VARCHAR(32) DEFAULT '' COMMENT '姓',
    avatar_url VARCHAR(256) DEFAULT '' COMMENT '头像URL',
    
    status VARCHAR(16) DEFAULT 'active' COMMENT '用户状态: active-活跃, inactive-非活跃, suspended-暂停',
    email_verified TINYINT(1) DEFAULT 0 COMMENT '邮箱验证状态: 0-未验证, 1-已验证',
    
    deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记: 0-正常, 1-已删除',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_guid (guid),
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_status (status),
    INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

## 索引设计规范

### 必需索引
1. **主键索引**：自动创建
2. **GUID索引**：`INDEX idx_guid (guid)`
3. **软删除索引**：`INDEX idx_deleted (deleted)`
4. **时间索引**：`INDEX idx_created_at (created_at)`

### 业务索引
1. **唯一性约束**：用户名、邮箱等唯一字段
2. **查询优化**：经常用于WHERE条件的字段
3. **外键索引**：关联查询的字段
4. **复合索引**：多字段组合查询

```sql
-- 复合索引示例
INDEX idx_status_deleted (status, deleted),
INDEX idx_user_created (user_id, created_at)
```

## 数据类型选择指南

### 数值类型
```sql
TINYINT(1)     -- 布尔值 (0/1)
TINYINT(4)     -- 小整数 (-128 到 127)
SMALLINT       -- 短整数 (-32,768 到 32,767)
INT            -- 整数 (-2,147,483,648 到 2,147,483,647)
BIGINT         -- 长整数 (主键推荐)
DECIMAL(10,2)  -- 精确小数 (价格等)
FLOAT/DOUBLE   -- 浮点数 (科学计算)
```

### 时间类型
```sql
TIMESTAMP      -- 时间戳 (推荐用于created_at, updated_at)
DATETIME       -- 日期时间 (不受时区影响)
DATE           -- 日期 (生日等)
TIME           -- 时间 (营业时间等)
```

### 文本类型
```sql
VARCHAR(n)     -- 可变长字符串 (n为8的倍数)
CHAR(n)        -- 固定长字符串 (状态码等)
TEXT           -- 长文本 (文章内容等)
JSON           -- JSON数据 (配置信息等)
```

## 命名规范

### 表名规范
- 使用复数形式：`users`, `products`, `orders`
- 使用下划线分隔：`product_categories`, `order_items`
- 避免保留字：不使用 `order`, `group` 等MySQL保留字

### 字段名规范
- 使用下划线命名：`first_name`, `created_at`
- 布尔字段前缀：`is_`, `has_`, `can_`
- 时间字段后缀：`_at`, `_time`
- 外键字段后缀：`_id`

### 索引名规范
```sql
idx_字段名           -- 单字段索引
idx_字段1_字段2      -- 复合索引
uniq_字段名          -- 唯一索引
fk_表名_字段名       -- 外键索引
```

## 性能优化建议

### 查询优化
1. **避免SELECT ***
   ```sql
   -- 错误
   SELECT * FROM users WHERE deleted = 0;
   
   -- 正确
   SELECT id, username, email FROM users WHERE deleted = 0;
   ```

2. **合理使用索引**
   - 为经常查询的字段创建索引
   - 避免过多索引影响写入性能
   - 定期分析慢查询日志

3. **分页查询优化**
   ```sql
   -- 使用LIMIT进行分页
   SELECT id, name FROM products 
   WHERE deleted = 0 
   ORDER BY created_at DESC 
   LIMIT 20 OFFSET 0;
   ```

### 存储优化
1. **选择合适的存储引擎**：推荐使用InnoDB
2. **设置合适的字符集**：utf8mb4
3. **定期维护**：OPTIMIZE TABLE, ANALYZE TABLE

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

START TRANSACTION;

-- 创建表
CREATE TABLE IF NOT EXISTS users (
    -- 表结构定义
);

-- 插入初始数据（如果需要）
INSERT INTO users (username, email) VALUES 
('admin', 'admin@example.com');

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
1. **使用参数化查询**
2. **输入验证**：验证用户输入
3. **权限控制**：限制数据库用户权限

---

> 📝 **注意**: 所有数据库操作都应遵循以上规范，确保数据一致性和系统稳定性。