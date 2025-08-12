# 产品评论功能测试指南

## 测试前准备

### 1. 数据库迁移
确保已运行最新的数据库迁移脚本：

```bash
# 进入项目根目录
cd c:/Code/IndependentWebSites/VehicleSuppliesWebSite

# 运行主要的评论表创建脚本
psql -d your_database_name -f db/patch/add_product_reviews_tables.sql

# 运行session_id字段添加脚本
psql -d your_database_name -f db/patch/add_session_id_to_review_images.sql
```

### 2. 启动服务
```bash
# 启动后端服务
cd backend
npm start

# 启动前端服务（新终端）
cd frontend
npm run serve
```

### 3. 测试数据准备
确保数据库中有：
- 至少一个测试用户（普通用户角色）
- 至少一个管理员用户
- 至少一个产品记录

## 功能测试清单

### ✅ 权限控制测试

#### 1. 普通用户权限测试
- [ ] **登录普通用户**
  - 使用测试用户账号登录
  - 验证JWT token正确生成

- [ ] **创建评论权限**
  - 普通用户可以创建评论 ✅
  - 评论包含评分、内容、匿名选项

- [ ] **修改评论权限**
  - 用户只能修改自己的评论 ✅
  - 无法修改其他用户的评论 ❌

- [ ] **删除评论权限**
  - 用户只能删除自己的评论 ✅
  - 无法删除其他用户的评论 ❌

#### 2. 管理员权限测试
- [ ] **登录管理员**
  - 使用管理员账号登录
  - 验证管理员角色正确识别

- [ ] **创建评论限制**
  - 管理员无法创建评论 ❌
  - 应返回权限错误信息

- [ ] **删除评论权限**
  - 管理员可以删除任何用户的评论 ✅
  - 验证删除操作成功

### ✅ Session ID机制测试

#### 1. 图片预上传测试
- [ ] **选择图片文件**
  - 在评论表单中选择1-5张图片
  - 验证图片格式限制（jpeg, jpg, png, gif, webp）
  - 验证图片大小限制（5MB）

- [ ] **自动上传功能**
  - 选择图片后自动触发上传
  - 验证上传进度和成功提示
  - 检查图片预览显示

- [ ] **Session ID关联**
  - 验证图片使用session_id上传
  - 检查数据库中session_id字段正确填充
  - review_id字段应为NULL

#### 2. 评论创建和图片分配测试
- [ ] **提交评论**
  - 填写评分和评论内容
  - 提交评论表单
  - 验证评论创建成功

- [ ] **图片自动分配**
  - 验证session_id关联的图片自动分配给新评论
  - 检查数据库中review_id字段更新
  - session_id字段保持不变（用于追踪）

### ✅ API端点测试

#### 1. 使用自动化测试脚本
```bash
cd backend
node start-and-test-reviews.js
```

#### 2. 手动API测试

**创建评论（带session_id）：**
```bash
curl -X POST http://localhost:3000/api/product-reviews \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "rating": 5,
    "review_content": "测试评论",
    "session_id": "session_123456"
  }'
```

**上传图片（使用session_id）：**
```bash
curl -X POST http://localhost:3000/api/product-review-images/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "session_id=session_123456" \
  -F "images=@test-image.jpg"
```

**分配图片到评论：**
```bash
curl -X POST http://localhost:3000/api/product-review-images/assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "review_id": 1,
    "session_id": "session_123456"
  }'
```

### ✅ 前端界面测试

#### 1. 评论表单测试
- [ ] **表单显示**
  - 只有登录的普通用户能看到"写评价"按钮
  - 管理员不显示"写评价"按钮

- [ ] **评分选择**
  - 星级评分正常工作
  - 必须选择评分才能提交

- [ ] **内容输入**
  - 文本框字符计数正常
  - 最大长度限制生效

#### 2. 图片上传界面测试
- [ ] **文件选择**
  - 文件选择器正常工作
  - 多选功能正常

- [ ] **即时上传**
  - 选择文件后立即上传
  - 上传进度提示

- [ ] **图片预览**
  - 已上传图片显示绿色边框和✓标记
  - 待上传图片显示删除按钮
  - 图片计数显示正确

- [ ] **上传限制**
  - 超过5张图片时禁用文件选择
  - 文件大小超限时显示错误

#### 3. 评论列表测试
- [ ] **评论显示**
  - 所有用户都能查看评论列表
  - 匿名评论正确显示

- [ ] **用户评论管理**
  - 用户能看到自己的评论
  - 编辑和删除按钮只对自己的评论显示

- [ ] **图片查看**
  - 评论图片正常显示
  - 点击图片放大功能正常

### ✅ 错误处理测试

#### 1. 权限错误
- [ ] **未登录用户**
  - 尝试创建评论返回401错误
  - 错误信息友好显示

- [ ] **管理员创建评论**
  - 返回403权限错误
  - 错误信息明确说明限制

#### 2. 数据验证错误
- [ ] **必填字段**
  - 缺少评分时显示错误
  - 产品ID无效时显示错误

- [ ] **文件上传错误**
  - 文件格式不支持时显示错误
  - 文件大小超限时显示错误

### ✅ 数据库一致性测试

#### 1. 事务完整性
- [ ] **评论创建事务**
  - 评论创建失败时图片分配回滚
  - 数据库状态保持一致

#### 2. 外键约束
- [ ] **关联完整性**
  - 删除评论时关联图片正确处理
  - 用户删除时评论数据完整性

### ✅ 性能测试

#### 1. 并发测试
- [ ] **多用户同时操作**
  - 多个用户同时创建评论
  - Session ID不冲突

#### 2. 大文件上传
- [ ] **图片上传性能**
  - 5MB图片上传正常
  - 多张图片同时上传

## 测试结果记录

### 通过的测试 ✅
- [ ] 普通用户权限控制
- [ ] 管理员权限限制
- [ ] Session ID机制
- [ ] 图片预上传
- [ ] 评论创建和图片分配
- [ ] 前端界面交互
- [ ] API端点功能
- [ ] 错误处理

### 发现的问题 ❌
记录测试中发现的问题：

1. **问题描述**：
   - 重现步骤：
   - 预期结果：
   - 实际结果：
   - 严重程度：

## 部署前检查清单

- [ ] 所有测试用例通过
- [ ] 数据库迁移脚本验证
- [ ] 生产环境配置检查
- [ ] 图片存储目录权限设置
- [ ] JWT密钥配置
- [ ] 错误日志监控设置

## 故障排除

### 常见问题

1. **JWT中间件错误**
   - 检查token格式
   - 验证中间件导入路径

2. **图片上传失败**
   - 检查存储目录权限
   - 验证文件大小限制配置

3. **Session ID冲突**
   - 检查ID生成算法
   - 验证数据库唯一性约束

4. **权限验证失败**
   - 检查用户角色配置
   - 验证中间件执行顺序

### 调试命令

```bash
# 查看数据库表结构
\d product_reviews
\d product_review_images

# 检查评论数据
SELECT * FROM product_reviews WHERE deleted = false;

# 检查图片数据
SELECT * FROM product_review_images WHERE deleted = false;

# 检查session_id关联
SELECT * FROM product_review_images WHERE session_id IS NOT NULL;
```

## 联系信息

如果测试过程中遇到问题，请：
1. 记录详细的错误信息
2. 保存相关的日志文件
3. 提供重现步骤
4. 联系开发团队进行支持