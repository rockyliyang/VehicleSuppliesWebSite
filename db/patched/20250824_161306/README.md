# 添加外部视频字段 Patch 脚本

## 概述

本 patch 脚本用于在 products 表中添加 `outside_video` 字段，用于存储外部视频链接（如 YouTube、Vimeo 等）。

## 背景

为了支持产品展示页面显示外部视频（YouTube、Vimeo等），需要在 products 表中添加一个新字段来存储外部视频链接。

## 脚本功能

### `add_outside_video_field.sql`

- **功能**: 在 products 表中添加 `outside_video` 字段
- **字段类型**: VARCHAR(512)
- **默认值**: NULL
- **用途**: 存储外部视频链接（YouTube、Vimeo等平台的视频URL）

## 使用方法

### 1. 备份数据库

**重要**: 在执行脚本前，请务必备份数据库！

```bash
pg_dump -h localhost -U your_username -d vehicle_supplies_db > backup_before_add_outside_video.sql
```

### 2. 执行脚本

```bash
psql -h localhost -U your_username -d vehicle_supplies_db -f add_outside_video_field.sql
```

### 3. 验证结果

执行以下 SQL 验证字段是否添加成功：

```sql
\d products
```

应该能看到新增的 `outside_video` 字段。

## 回滚方法

如果需要回滚此更改，可以执行以下 SQL：

```sql
ALTER TABLE products DROP COLUMN IF EXISTS outside_video;
```

## 注意事项

1. 此字段为可选字段，默认值为 NULL
2. 字段长度为 512 字符，足以存储大部分视频平台的 URL
3. 建议在生产环境执行前先在测试环境验证
4. 执行前请确保数据库连接正常且有足够权限

## 影响范围

- **表**: products
- **字段**: 新增 outside_video 字段
- **数据**: 不影响现有数据
- **应用**: 需要相应更新后端 API 和前端界面