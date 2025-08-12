# 产品评论功能设置指南

## 概述

本文档介绍如何设置和使用产品评论功能，包括数据库迁移、API测试和前端集成。

## 功能特性

### 核心功能
- ✅ 用户评论和评分（1-5星）
- ✅ 评论图片上传（最多5张，每张5MB）
- ✅ 评论审核系统（待审核/已通过/已拒绝）
- ✅ 管理员回复功能
- ✅ 评论统计（平均评分、各星级数量）
- ✅ 软删除支持
- ✅ 权限控制（用户只能管理自己的评论）

### 数据库表
- `product_reviews` - 产品评论主表
- `product_review_images` - 评论图片表

## 设置步骤

### 1. 数据库迁移

运行数据库迁移脚本：

```bash
# 连接到PostgreSQL数据库
psql -U your_username -d vehicle_supplies_db

# 执行迁移脚本
\i db/patch/add_product_reviews_tables.sql
```

或者如果数据库是全新的，直接运行主schema：

```bash
psql -U your_username -d vehicle_supplies_db -f db/main/postgresql/schema_postgresql.sql
```

### 2. 创建图片存储目录

确保以下目录存在并有写入权限：

```bash
mkdir -p public/static/user
chmod 755 public/static/user
```

### 3. 启动服务器

```bash
cd backend
npm install
node server.js
```

### 4. 运行API测试

```bash
# 方法1：使用自动化测试脚本
node start-and-test-reviews.js

# 方法2：手动测试
node test_product_review_api.js
```

## API接口

### 基础URL
```
http://localhost:3000/api
```

### 产品评论接口

#### 1. 创建评论
```http
POST /product-reviews
Authorization: Bearer {token}
Content-Type: application/json

{
  "product_id": 1,
  "rating": 5,
  "review_content": "产品质量很好！"
}
```

#### 2. 获取产品评论列表
```http
GET /product-reviews/product/{product_id}?page=1&limit=10&status=approved
```

#### 3. 获取评论统计
```http
GET /product-reviews/stats?product_id=1
```

#### 4. 更新评论
```http
PUT /product-reviews/{review_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 4,
  "review_content": "更新后的评论内容"
}
```

#### 5. 删除评论
```http
DELETE /product-reviews/{review_id}
Authorization: Bearer {token}
```

### 评论图片接口

#### 1. 上传图片
```http
POST /product-review-images/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

review_id: 1
images: [file1, file2, ...]
```

#### 2. 获取评论图片
```http
GET /product-review-images/review/{review_id}
```

#### 3. 删除图片
```http
DELETE /product-review-images/{image_id}
Authorization: Bearer {token}
```

### 管理员接口

#### 1. 获取所有评论
```http
GET /admin/product-reviews?page=1&limit=10&status=pending
Authorization: Bearer {admin_token}
```

#### 2. 管理员回复
```http
POST /admin/product-reviews/{review_id}/reply
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "admin_reply": "感谢您的反馈！"
}
```

#### 3. 更新评论状态
```http
PUT /admin/product-reviews/{review_id}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "approved"
}
```

## 测试数据

### 测试用户
- 用户名: `admin`
- 密码: `admin123`
- 角色: 管理员

### 测试前准备
1. 确保数据库中有产品数据（product_id = 1）
2. 确保有测试用户账号
3. 修改 `test_product_review_api.js` 中的测试用户信息

## 错误处理

### 常见错误代码
- `REVIEW_NOT_FOUND` - 评论不存在
- `REVIEW_ALREADY_EXISTS` - 用户已对该产品评论过
- `INVALID_RATING` - 评分无效（必须1-5）
- `REVIEW_CONTENT_TOO_LONG` - 评论内容过长
- `PERMISSION_DENIED` - 权限不足
- `IMAGE_UPLOAD_FAILED` - 图片上传失败
- `TOO_MANY_IMAGES` - 图片数量超限

## 业务规则

### 评论规则
1. 每个用户对每个产品只能评论一次
2. 评分必须在1-5之间
3. 评论内容最长1000字符
4. 普通用户只能查看已审核通过的评论
5. 用户只能编辑/删除自己的评论

### 图片规则
1. 每个评论最多上传5张图片
2. 单张图片最大5MB
3. 支持格式：jpg, jpeg, png, gif
4. 图片存储在 `/public/static/user/{user_id}/` 目录

### 权限规则
1. 普通用户：创建、查看、编辑自己的评论
2. 管理员：查看所有评论、审核、回复、删除任意评论

## 前端集成建议

### 1. 评论列表组件
```javascript
// 获取产品评论
async function getProductReviews(productId, page = 1) {
  const response = await fetch(`/api/product-reviews/product/${productId}?page=${page}&limit=10`);
  return response.json();
}

// 获取评论统计
async function getReviewStats(productId) {
  const response = await fetch(`/api/product-reviews/stats?product_id=${productId}`);
  return response.json();
}
```

### 2. 评论表单组件
```javascript
// 创建评论
async function createReview(productId, rating, content) {
  const response = await fetch('/api/product-reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      product_id: productId,
      rating: rating,
      review_content: content
    })
  });
  return response.json();
}
```

### 3. 图片上传组件
```javascript
// 上传评论图片
async function uploadReviewImages(reviewId, files) {
  const formData = new FormData();
  formData.append('review_id', reviewId);
  files.forEach(file => {
    formData.append('images', file);
  });

  const response = await fetch('/api/product-review-images/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
}
```

## 故障排除

### 1. 数据库连接问题
- 检查PostgreSQL服务是否运行
- 验证数据库连接配置
- 确认数据库用户权限

### 2. 图片上传问题
- 检查目录权限：`chmod 755 public/static/user`
- 确认磁盘空间充足
- 验证文件大小和格式限制

### 3. 权限问题
- 确认JWT token有效
- 检查用户角色设置
- 验证API路由权限配置

## 性能优化建议

1. **数据库索引**：已创建必要索引，注意定期维护
2. **图片优化**：考虑添加图片压缩和CDN
3. **缓存策略**：对评论统计数据添加缓存
4. **分页加载**：大量评论时使用分页或无限滚动

## 安全注意事项

1. **输入验证**：所有用户输入都经过验证和清理
2. **文件上传**：限制文件类型、大小和数量
3. **权限控制**：严格的用户权限检查
4. **SQL注入防护**：使用参数化查询
5. **XSS防护**：评论内容需要前端转义显示

---

如有问题，请查看 `docs/product-review-api.md` 获取详细的API文档。