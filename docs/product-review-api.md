# 产品评论功能 API 文档

## 概述

本文档描述了产品评论和评论图片功能的API接口。该功能允许用户对产品进行评价、上传图片，并提供管理员审核和回复功能。

## 数据库表结构

### product_reviews 表
- `id`: 主键ID
- `guid`: 全局唯一标识符
- `product_id`: 产品ID（外键）
- `user_id`: 用户ID（外键）
- `rating`: 评分（1-5星）
- `review_content`: 评论内容
- `is_anonymous`: 是否匿名评论
- `status`: 审核状态（pending/approved/rejected）
- `admin_reply`: 管理员回复
- `admin_reply_at`: 管理员回复时间
- `admin_reply_by`: 管理员回复人ID
- `created_at`: 创建时间
- `updated_at`: 更新时间
- `deleted`: 软删除标记

### product_review_images 表
- `id`: 主键ID
- `guid`: 全局唯一标识符
- `review_id`: 评论ID（外键）
- `image_url`: 图片URL路径
- `sort_order`: 图片排序
- `created_at`: 创建时间
- `updated_at`: 更新时间
- `deleted`: 软删除标记

## API 接口

### 基础URL
```
http://localhost:3000/api
```

### 认证
大部分接口需要JWT认证，在请求头中添加：
```
Authorization: Bearer <your-jwt-token>
```

## 产品评论接口

### 1. 获取产品评论列表
**GET** `/product-reviews/product/{product_id}`

**参数：**
- `product_id` (路径参数): 产品ID
- `page` (查询参数): 页码，默认1
- `limit` (查询参数): 每页数量，默认10
- `status` (查询参数): 状态筛选（仅管理员可用）

**响应示例：**
```json
{
  "success": true,
  "message": "获取评论列表成功",
  "data": {
    "reviews": [
      {
        "id": 1,
        "guid": "uuid-string",
        "product_id": 1,
        "user_id": 1,
        "rating": 5,
        "review_content": "产品很好",
        "is_anonymous": false,
        "status": "approved",
        "admin_reply": null,
        "admin_reply_at": null,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "reviewer_name": "用户名",
        "reviewer_avatar": "/static/avatars/user1.jpg",
        "images": [
          {
            "id": 1,
            "image_url": "/static/user/1/review-123.jpg",
            "sort_order": 1
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 2. 获取评论统计信息
**GET** `/product-reviews/stats`

**参数：**
- `product_id` (查询参数): 产品ID

**响应示例：**
```json
{
  "success": true,
  "message": "获取评论统计成功",
  "data": {
    "total_reviews": 10,
    "average_rating": "4.5",
    "five_star": 5,
    "four_star": 3,
    "three_star": 1,
    "two_star": 1,
    "one_star": 0
  }
}
```

### 3. 创建评论
**POST** `/product-reviews`

**需要认证：** 是

**请求体：**
```json
{
  "product_id": 1,
  "rating": 5,
  "review_content": "产品质量很好",
  "is_anonymous": false
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "评论创建成功",
  "data": {
    "id": 1,
    "guid": "uuid-string",
    "product_id": 1,
    "rating": 5,
    "review_content": "产品质量很好",
    "is_anonymous": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. 更新评论
**PUT** `/product-reviews/{id}`

**需要认证：** 是（只能更新自己的评论）

**请求体：**
```json
{
  "rating": 4,
  "review_content": "更新后的评论内容",
  "is_anonymous": true
}
```

### 5. 删除评论
**DELETE** `/product-reviews/{id}`

**需要认证：** 是（只能删除自己的评论或管理员可删除任何评论）

### 6. 获取单个评论详情
**GET** `/product-reviews/{id}`

**响应示例：**
```json
{
  "success": true,
  "message": "获取评论详情成功",
  "data": {
    "id": 1,
    "guid": "uuid-string",
    "product_id": 1,
    "user_id": 1,
    "rating": 5,
    "review_content": "产品很好",
    "is_anonymous": false,
    "status": "approved",
    "admin_reply": "感谢您的评价",
    "admin_reply_at": "2024-01-02T00:00:00.000Z",
    "admin_reply_by": 2,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "reviewer_name": "用户名",
    "reviewer_avatar": "/static/avatars/user1.jpg",
    "product_name": "产品名称",
    "admin_reply_username": "管理员",
    "images": []
  }
}
```

## 管理员专用接口

### 7. 获取所有评论列表（管理员）
**GET** `/product-reviews/admin/all`

**需要认证：** 是（管理员权限）

**参数：**
- `page` (查询参数): 页码，默认1
- `limit` (查询参数): 每页数量，默认10
- `status` (查询参数): 状态筛选（pending/approved/rejected/all）
- `product_id` (查询参数): 产品ID筛选
- `user_id` (查询参数): 用户ID筛选

### 8. 管理员回复评论
**POST** `/product-reviews/{id}/reply`

**需要认证：** 是（管理员权限）

**请求体：**
```json
{
  "admin_reply": "感谢您的评价，我们会继续努力"
}
```

### 9. 更新评论状态
**PUT** `/product-reviews/{id}/status`

**需要认证：** 是（管理员权限）

**请求体：**
```json
{
  "status": "approved"
}
```

## 评论图片接口

### 1. 上传评论图片
**POST** `/product-review-images/upload`

**需要认证：** 是

**请求类型：** multipart/form-data

**参数：**
- `review_id`: 评论ID
- `images`: 图片文件（最多5张，每张最大5MB）

**支持格式：** jpeg, jpg, png, gif, webp

**存储路径：** `/public/static/user/{userid}/`

**响应示例：**
```json
{
  "success": true,
  "message": "图片上传成功",
  "data": {
    "images": [
      {
        "id": 1,
        "guid": "uuid-string",
        "image_url": "/static/user/1/review-123456.jpg",
        "sort_order": 1,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total_uploaded": 1
  }
}
```

### 2. 获取评论图片列表
**GET** `/product-review-images/review/{review_id}`

**响应示例：**
```json
{
  "success": true,
  "message": "获取图片列表成功",
  "data": {
    "review_id": 1,
    "images": [
      {
        "id": 1,
        "guid": "uuid-string",
        "image_url": "/static/user/1/review-123456.jpg",
        "sort_order": 1,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

### 3. 更新图片排序
**PUT** `/product-review-images/review/{review_id}/order`

**需要认证：** 是（只能更新自己评论的图片）

**请求体：**
```json
{
  "image_orders": [
    { "id": 1, "sort_order": 2 },
    { "id": 2, "sort_order": 1 }
  ]
}
```

### 4. 删除单个图片
**DELETE** `/product-review-images/{id}`

**需要认证：** 是（只能删除自己评论的图片或管理员可删除任何图片）

### 5. 批量删除图片
**DELETE** `/product-review-images/batch`

**需要认证：** 是

**请求体：**
```json
{
  "image_ids": [1, 2, 3]
}
```

### 6. 获取单个图片详情
**GET** `/product-review-images/{id}`

## 错误代码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 业务规则

1. **评论权限**：
   - 用户只能对每个产品评论一次
   - 用户只能修改和删除自己的评论
   - 管理员可以删除任何评论

2. **图片上传**：
   - 每个评论最多上传5张图片
   - 单张图片最大5MB
   - 支持格式：jpeg, jpg, png, gif, webp
   - 图片存储在用户专属目录：`/public/static/user/{userid}/`

3. **评论审核**：
   - 新评论默认状态为 `pending`（待审核）
   - 管理员可以将状态改为 `approved`（已通过）或 `rejected`（已拒绝）
   - 普通用户只能看到 `approved` 状态的评论

4. **匿名评论**：
   - 用户可以选择匿名发表评论
   - 匿名评论显示为 "Anonymous"

5. **软删除**：
   - 所有删除操作都是软删除
   - 删除评论时会同时软删除相关图片

## 测试

运行测试脚本：
```bash
cd backend
node test_product_review_api.js
```

**注意**：运行测试前请确保：
1. 服务器正在运行
2. 数据库已创建相关表
3. 修改测试脚本中的测试用户邮箱和密码
4. 确保测试的产品ID存在

## 前端集成建议

1. **评论列表页面**：
   - 显示评论内容、评分、用户名（或匿名）、时间
   - 支持分页加载
   - 显示评论图片（点击放大）
   - 显示管理员回复

2. **评论表单**：
   - 星级评分组件
   - 文本输入框（限制2000字符）
   - 图片上传组件（支持多张，拖拽排序）
   - 匿名选项

3. **评论统计**：
   - 平均评分显示
   - 各星级评论数量分布
   - 总评论数

4. **管理后台**：
   - 评论审核列表
   - 批量操作（批准/拒绝）
   - 回复评论功能
   - 评论搜索和筛选