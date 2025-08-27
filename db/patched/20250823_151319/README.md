# 时区字段更新补丁

## 补丁信息
- **创建日期**: 2025-08-23
- **补丁版本**: 20250823_151319
- **描述**: 将所有表的时间字段统一为UTC时间，并在orders表中添加时区相关字段

## 主要变更

### 1. 函数更新
- 更新 `update_modified_column()` 函数，确保触发器更新时间时使用 `CURRENT_TIMESTAMP`（自动带时区信息）

### 2. 时间字段类型和默认值更新
将以下表的 `created_at` 和 `updated_at` 字段类型从 `TIMESTAMP` 改为 `TIMESTAMPTZ`，并设置默认值为 `CURRENT_TIMESTAMP`：
- users
- product_categories
- products
- product_images
- product_price_ranges
- logistics_companies
- shippingfee_ranges
- orders
- order_items
- logistics
- carts（如果存在）
- inquiries（如果存在）
- inquiry_items（如果存在）
- countries（如果存在）
- states（如果存在）
- tags（如果存在）
- 其他包含时间字段的表

### 3. orders表新增字段
在 `orders` 表中添加以下字段（如果不存在）：
- `create_time_zone VARCHAR(64) DEFAULT NULL` - 订单创建时的时区信息
- `paid_at TIMESTAMPTZ DEFAULT NULL` - 支付完成时间（带时区信息）
- `paid_time_zone VARCHAR(64) DEFAULT NULL` - 支付完成时的时区信息

## 执行方法

### 方法1: 使用psql命令行
```bash
psql -U your_username -d your_database_name -f update_timezone_fields.sql
```

### 方法2: 在PostgreSQL客户端中执行
1. 连接到目标数据库
2. 执行 `update_timezone_fields.sql` 文件中的所有SQL语句

## 注意事项

1. **备份重要性**: 执行前务必备份数据库
2. **停机时间**: 建议在维护窗口期间执行，因为涉及字段类型转换
3. **权限要求**: 需要数据库管理员权限
4. **兼容性**: 此补丁适用于PostgreSQL数据库
5. **幂等性**: 此补丁可以安全地重复执行
6. **时区处理**: 所有时间字段将使用 `TIMESTAMPTZ` 类型，自动处理时区信息
7. **数据转换**: 现有的 `TIMESTAMP` 数据将通过 `AT TIME ZONE 'UTC'` 转换为 `TIMESTAMPTZ`
8. **应用程序影响**: 应用程序代码可能需要相应调整以处理带时区的时间戳

## 验证方法

执行补丁后，可以通过以下SQL验证更改：

```sql
-- 检查orders表的新字段
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('create_time_zone', 'paid_at', 'paid_time_zone');

-- 检查时间字段的默认值
SELECT table_name, column_name, column_default
FROM information_schema.columns 
WHERE column_name IN ('created_at', 'updated_at')
AND table_schema = 'public'
ORDER BY table_name, column_name;

-- 验证update_modified_column函数
SELECT prosrc FROM pg_proc WHERE proname = 'update_modified_column';
```

## 回滚方案

如果需要回滚此补丁，可以执行以下操作：

1. 将时间字段类型从 `TIMESTAMPTZ` 改回 `TIMESTAMP`：
   ```sql
   ALTER TABLE table_name ALTER COLUMN created_at TYPE TIMESTAMP USING created_at::TIMESTAMP;
   ALTER TABLE table_name ALTER COLUMN updated_at TYPE TIMESTAMP USING updated_at::TIMESTAMP;
   ```
2. 删除orders表中新增的时区字段（如果需要）
3. 恢复原始的 `update_modified_column()` 函数
4. 将字段默认值改回原来的设置

**注意**: 回滚可能会影响数据一致性，请谨慎操作。

## 相关文件

- `update_timezone_fields.sql` - 主要的补丁脚本
- `../../../main/postgresql/schema_postgresql.sql` - 更新后的主schema文件
- `../../../backend/controllers/paymentController.js` - 相关的后端代码更新