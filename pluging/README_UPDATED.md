# 1688产品导入插件 - 更新说明

## 架构重构

### 主要变更
1. **移除background.js依赖**: 图片上传功能从background.js迁移到popup.js
2. **分离图片上传逻辑**: 图片通过`/api/product-images/upload`接口单独上传
3. **简化产品创建**: `importFrom1688`接口不再处理图片，专注于产品数据

### 新的工作流程
1. **图片上传阶段**:
   - popup.js直接下载1688图片
   - 通过`/api/product-images/upload`上传到服务器
   - 使用session_id临时关联图片

2. **产品创建阶段**:
   - 调用`/api/products/import-from-1688`创建产品
   - 不包含图片数据，只有产品基本信息

3. **图片关联阶段**:
   - 产品创建成功后调用`/api/product-images/assign`
   - 通过session_id将图片关联到产品

### 接口变更

#### `/api/products/import-from-1688`
- **移除**: mainImage, carouselImages, detailImages 参数
- **保留**: 产品基本信息（title, price, description等）
- **功能**: 仅创建产品记录，不处理图片

#### `/api/product-images/upload`
- **新增**: session_id 参数用于临时关联
- **支持**: product_id为undefined的临时上传
- **返回**: 上传成功的图片路径

#### `/api/product-images/assign`
- **功能**: 将临时上传的图片关联到指定产品
- **参数**: product_id, session_id

### 图片类型定义
- **0**: 主图和轮播图
- **1**: 详情图

### 错误处理
- 图片上传失败时保留原始URL作为备选
- 图片关联失败时记录警告但不影响产品创建
- 支持部分图片上传失败的情况

### 测试步骤
1. 配置API地址和令牌
2. 在1688产品页面点击"提取产品信息"
3. 确认产品信息显示正确
4. 点击"上传产品"观察流程:
   - 状态显示"正在上传图片..."
   - 状态显示"正在上传产品..."
   - 显示上传成功结果
5. 检查后端数据库中的产品和图片记录

### 优势
- **更清晰的职责分离**: 图片上传和产品创建分离
- **更好的错误处理**: 图片上传失败不影响产品创建
- **更灵活的扩展**: 可以独立优化图片上传逻辑
- **更符合RESTful设计**: 每个接口职责单一