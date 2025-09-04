# 媒体文件清理工具

## cleanUnusedMedia.js

这个工具用于扫描和清理项目中未使用的媒体文件（图片和视频）。

### 功能

- 扫描 `public/static/images` 和 `public/static/videos` 目录下的所有媒体文件
- 检查这些文件是否在以下数据库表中被引用：
  - `product_images` (image_url 字段)
  - `common_content_images` (image_url 字段)
  - `banners` (image_url 字段)
  - `product_review_images` (image_url 字段)
  - `company_info` (logo_url 和 wechat_qrcode 字段)
- 将未使用的文件移动到 `public/static_backup` 目录
- 提供详细的统计信息和操作日志

### 支持的文件格式

**图片格式：**
- .jpg, .jpeg, .png, .gif, .webp, .svg

**视频格式：**
- .mp4, .avi, .mov, .wmv, .flv, .webm

### 使用方法

#### 1. 确保环境配置

确保你的 `.env` 文件包含正确的数据库连接信息：

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=vehicle_supplies_db
DB_PASSWORD=your_password
DB_PORT=5432
```

#### 2. 运行工具

在 `backend` 目录下运行：

**开发环境：**
```bash
# 直接运行（使用默认.env文件）
node tools/cleanUnusedMedia.js

# 或者使用 npm script
npm run clean-media
```

**生产环境：**
```bash
# 方法1：使用NODE_ENV环境变量指定生产环境配置
NODE_ENV=production node tools/cleanUnusedMedia.js

# 方法2：使用npm script（推荐）
npm run clean-media:prod

# 方法3：手动指定.env.production文件
node -r dotenv/config tools/cleanUnusedMedia.js dotenv_config_path=.env.production

# 方法4：在Windows PowerShell中
$env:NODE_ENV="production"; node tools/cleanUnusedMedia.js

# 方法5：在Windows CMD中
set NODE_ENV=production && node tools/cleanUnusedMedia.js
```

#### 3. 查看结果

工具会输出详细的执行日志，包括：
- 扫描的文件数量
- 发现的未使用文件
- 移动操作的结果
- 节省的存储空间
- 备份目录位置

### 安全特性

1. **非破坏性操作**：文件被移动到备份目录而不是直接删除
2. **详细日志**：每个操作都有详细的日志记录
3. **错误处理**：单个文件操作失败不会影响整个流程
4. **路径匹配**：支持多种路径格式的匹配（相对路径、绝对路径、URL路径）

### 输出示例

```
开始清理未使用的媒体文件...
==================================================
正在查询数据库中使用的媒体文件...
从 product_images 表找到 25 个文件
从 common_content_images 表找到 8 个文件
从 banners 表找到 5 个文件
从 product_review_images 表找到 12 个文件
从 company_info 表找到 4 个可能的文件
数据库中总共使用了 45 个唯一的媒体文件

正在扫描目录: C:\path\to\public\static\images
找到 67 个媒体文件
发现 22 个未使用的文件

移动未使用的文件到备份目录:
✓ images/old-banner.jpg -> public/static_backup/images/old-banner.jpg (245.6 KB)
✓ images/unused-product.png -> public/static_backup/images/unused-product.png (89.2 KB)
...

==================================================
清理完成！统计信息:
扫描文件总数: 67
未使用文件数: 22
节省空间: 2.3 MB
备份目录: C:\path\to\public\static_backup

📦 已将 22 个未使用的文件移动到备份目录
如果确认这些文件不需要，可以手动删除备份目录
```

### 注意事项

1. **运行前备份**：虽然工具会将文件移动到备份目录，但建议在首次运行前手动备份重要文件
2. **数据库连接**：确保数据库连接正常，工具需要查询多个表
3. **权限检查**：确保 Node.js 进程有读写相关目录的权限
4. **路径格式**：工具会尝试匹配多种路径格式，但如果数据库中的路径格式特殊，可能需要调整匹配逻辑

### 恢复文件

如果需要恢复某些文件，可以手动将它们从 `public/static_backup` 目录移回原位置。

### 自定义配置

可以修改脚本中的 `config` 对象来调整：
- 扫描的目录
- 备份目录位置
- 支持的文件扩展名

### 故障排除

**常见问题：**

1. **数据库连接失败**
   - 检查 `.env` 文件中的数据库配置
   - 确保数据库服务正在运行

2. **权限错误**
   - 确保 Node.js 进程有读写目标目录的权限
   - 在 Windows 上可能需要以管理员身份运行

3. **文件移动失败**
   - 检查目标文件是否被其他程序占用
   - 确保有足够的磁盘空间

4. **路径匹配问题**
   - 检查数据库中存储的路径格式
   - 可能需要调整 `isFileUsed` 函数中的匹配逻辑