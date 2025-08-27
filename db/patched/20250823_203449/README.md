# 时区转换 Patch 脚本

## 概述

本 patch 脚本用于将数据库中所有表的 `created_at` 和 `updated_at` 字段的值从东八区时间转换为 UTC 时间。

## 背景

在项目早期，数据库中的时间字段可能存储的是东八区（Asia/Shanghai）的本地时间。为了统一时间标准并支持国际化，需要将这些时间值转换为 UTC 时间。

## 脚本功能

### `convert_timezone_to_utc.sql`

- **功能**: 将所有表中的 `created_at`、`updated_at` 和 `paid_at` 字段值从东八区时间转换为 UTC 时间
- **转换方式**: 原时间 - 8小时 = UTC时间
- **影响范围**: 所有包含时间字段的表

### 脚本处理方式：

1. **动态查找所有表**：
   - 使用 `information_schema.columns` 动态查找所有包含 `created_at` 和 `updated_at` 字段的表
   - 自动处理所有符合条件的表，无需手动维护表名列表
   - 确保不遗漏任何包含时间字段的表

2. **处理的主要表包括**：
   - `users` - 用户表
   - `product_categories` - 产品分类表
   - `products` - 产品表
   - `product_images` - 产品图片表
   - `product_price_ranges` - 产品价格区间表
   - `logistics_companies` - 物流公司表
   - `shippingfee_ranges` - 运费区间表
   - `orders` - 订单表（包括 `paid_at` 字段）
   - `order_items` - 订单项表
   - `logistics` - 物流表
   - 以及所有其他包含时间字段的表

## 使用方法

### 1. 备份数据库

**重要**: 在执行脚本前，请务必备份数据库！

```bash
pg_dump -h localhost -U your_username -d vehicle_supplies_db > backup_before_timezone_conversion.sql
```

### 2. 执行脚本

```bash
psql -h localhost -U your_username -d vehicle_supplies_db -f convert_timezone_to_utc.sql
```

### 3. 验证结果

执行脚本后，可以通过以下 SQL 验证转换结果：

```sql
-- 执行验证脚本
\i verify_timezone_conversion.sql

-- 检查所有表的转换后数据（动态查询所有包含时间字段的表）
SELECT * FROM verify_timezone_conversion();

-- 检查所有表的时间范围（动态查询所有包含时间字段的表）
SELECT * FROM check_time_ranges();
```

验证函数会自动检查所有包含 `created_at` 和 `updated_at` 字段的表，无需手动指定表名。

## 注意事项

1. **数据备份**: 执行前必须备份数据库
2. **一次性操作**: 此脚本只能执行一次，重复执行会导致时间再次减去8小时
3. **业务影响**: 执行期间可能会锁定表，建议在业务低峰期执行
4. **时区假设**: 脚本假设现有数据存储的是东八区时间
5. **事务保护**: 脚本使用事务包装，如果出错会自动回滚

## 执行日志

脚本执行时会输出详细的日志信息，包括：
- 每个表的转换开始和完成时间
- 每个字段影响的行数
- 总体执行状态

## 回滚方案

如果需要回滚，可以执行以下操作：

1. 从备份恢复数据库
2. 或者手动将时间加回8小时（不推荐）

```sql
-- 紧急回滚示例（仅在必要时使用）
UPDATE users SET created_at = created_at + INTERVAL '8 hours' WHERE created_at IS NOT NULL;
UPDATE users SET updated_at = updated_at + INTERVAL '8 hours' WHERE updated_at IS NOT NULL;
-- ... 对所有表重复此操作
```

## 相关文档

- [数据库设计规则](../../docs/database_rules.md)
- [时区处理最佳实践](../../docs/timezone_best_practices.md)

## 执行记录

- **创建日期**: 2025-08-23
- **执行状态**: 待执行
- **执行人**: 
- **执行时间**: 
- **备注**: