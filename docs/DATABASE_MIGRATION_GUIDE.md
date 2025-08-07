# 数据库迁移指南

本项目现在支持MySQL和PostgreSQL两种数据库。本指南将帮助您在两种数据库之间进行切换和迁移。

## 环境配置

### 数据库类型选择

在 `.env.development` 或 `.env.production` 文件中设置 `DB_TYPE` 变量：

```bash
# 使用MySQL
DB_TYPE=mysql

# 使用PostgreSQL
DB_TYPE=postgresql
```

### MySQL配置

```bash
# MySQL配置
DB_HOST=localhost
DB_USER=VehicleWebUser
DB_PASSWORD=your_mysql_password
DB_NAME=vehicle_supplies_db
```

### PostgreSQL配置

```bash
# PostgreSQL配置
PG_HOST=localhost
PG_PORT=5432
PG_USER=vehicle_web_user
PG_PASSWORD=your_postgresql_password
PG_DATABASE=vehicle_supplies_db
PG_SSL=false  # 开发环境设为false，生产环境设为true
```

## 数据库安装和设置

### PostgreSQL安装

#### Windows
1. 下载PostgreSQL安装程序：https://www.postgresql.org/download/windows/
2. 运行安装程序，设置超级用户密码
3. 记住端口号（默认5432）

#### macOS
```bash
# 使用Homebrew安装
brew install postgresql
brew services start postgresql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 创建PostgreSQL数据库和用户

```sql
-- 连接到PostgreSQL
psql -U postgres

-- 创建数据库
CREATE DATABASE vehicle_supplies_db;

-- 创建用户
CREATE USER vehicle_web_user WITH PASSWORD 'your_password';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE vehicle_supplies_db TO vehicle_web_user;

-- 退出
\q
```

## 数据迁移步骤

### 从MySQL迁移到PostgreSQL

1. **安装依赖**
   ```bash
   cd backend
   npm install
   ```

2. **准备PostgreSQL数据库**
   - 按照上述步骤安装PostgreSQL
   - 创建数据库和用户

3. **运行PostgreSQL脚本**
   ```bash
   # 连接到PostgreSQL数据库
   psql -U vehicle_web_user -d vehicle_supplies_db
   
   # 执行架构脚本
   \i db/main/postgresql/schema_postgresql.sql
   \i db/main/postgresql/cart_schema_postgresql.sql
   \i db/main/postgresql/common_content_schema_postgresql.sql
   \i db/main/postgresql/contact_user_group_postgresql.sql
   \i db/main/postgresql/inquiry_system_tables_postgresql.sql
   \i db/main/postgresql/language_schema_postgresql.sql
   \i db/main/postgresql/insert_message_translations_postgresql.sql
   ```

4. **更新环境配置**
   ```bash
   # 在.env.development或.env.production中
   DB_TYPE=postgresql
   ```

5. **重启应用**
   ```bash
   npm run dev  # 开发环境
   # 或
   npm start    # 生产环境
   ```

### 从PostgreSQL回退到MySQL

1. **确保MySQL服务运行**
2. **更新环境配置**
   ```bash
   DB_TYPE=mysql
   ```
3. **重启应用**

## 数据库差异说明

### 主要转换内容

| MySQL | PostgreSQL | 说明 |
|-------|------------|------|
| `AUTO_INCREMENT` | `BIGSERIAL PRIMARY KEY` | 自增主键 |
| `BINARY(16)` | `UUID DEFAULT gen_random_uuid()` | UUID字段 |
| `TINYINT(1)` | `SMALLINT` | 布尔类型字段 |
| `ENUM('a','b')` | `VARCHAR(50) CHECK (field IN ('a','b'))` | 枚举类型 |
| `ON UPDATE CURRENT_TIMESTAMP` | 触发器函数 | 自动更新时间戳 |
| 虚拟列 | 条件唯一索引 | 唯一性约束 |

### PostgreSQL特有功能

- **扩展功能**：使用`pgcrypto`扩展生成UUID
- **触发器**：自动更新`updated_at`字段
- **字段注释**：使用`COMMENT ON COLUMN`添加字段说明
- **条件索引**：替代MySQL虚拟列的唯一性约束

## 性能优化建议

### PostgreSQL优化

1. **连接池配置**
   ```javascript
   // 在db.js中已配置
   max: 10,                    // 最大连接数
   idleTimeoutMillis: 30000,   // 空闲超时
   connectionTimeoutMillis: 2000 // 连接超时
   ```

2. **索引优化**
   - PostgreSQL脚本中已包含所有必要索引
   - 定期运行`ANALYZE`更新统计信息

3. **配置调优**
   ```sql
   -- 在postgresql.conf中调整
   shared_buffers = 256MB
   effective_cache_size = 1GB
   work_mem = 4MB
   ```

## 故障排除

### 常见问题

1. **连接失败**
   - 检查PostgreSQL服务是否运行
   - 验证用户名、密码和数据库名
   - 确认端口号正确（默认5432）

2. **权限错误**
   ```sql
   -- 重新授予权限
   GRANT ALL PRIVILEGES ON DATABASE vehicle_supplies_db TO vehicle_web_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vehicle_web_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vehicle_web_user;
   ```

3. **SSL连接问题**
   ```bash
   # 开发环境禁用SSL
   PG_SSL=false
   
   # 生产环境启用SSL
   PG_SSL=true
   ```

### 日志查看

```bash
# PostgreSQL日志位置
# Windows: C:\Program Files\PostgreSQL\15\data\log
# Linux: /var/log/postgresql/
# macOS: /usr/local/var/log/

# 查看应用日志
npm run dev  # 开发环境会显示详细连接信息
```

## 备份和恢复

### PostgreSQL备份

```bash
# 备份数据库
pg_dump -U vehicle_web_user -h localhost vehicle_supplies_db > backup.sql

# 恢复数据库
psql -U vehicle_web_user -h localhost vehicle_supplies_db < backup.sql
```

### MySQL备份

```bash
# 备份数据库
mysqldump -u VehicleWebUser -p vehicle_supplies_db > backup.sql

# 恢复数据库
mysql -u VehicleWebUser -p vehicle_supplies_db < backup.sql
```

## 注意事项

1. **数据类型兼容性**：确保应用代码能处理两种数据库的数据类型差异
2. **SQL语法**：某些复杂查询可能需要针对不同数据库进行调整
3. **事务处理**：PostgreSQL和MySQL的事务行为可能略有不同
4. **性能特性**：两种数据库的性能特点不同，可能需要不同的优化策略

## 联系支持

如果在迁移过程中遇到问题，请：
1. 检查应用日志和数据库日志
2. 验证环境配置是否正确
3. 确认数据库服务状态
4. 查看本文档的故障排除部分