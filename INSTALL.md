# 车辆用品商城系统安装指南

## 系统概述

这是一个基于Vue.js前端和Node.js后端的车辆用品电商系统，主要功能包括：

- 产品展示、询价和下单
- 用户信息和订单管理
- 物流跟踪功能

系统分为三个主要部分：前端(Frontend)、后端(Backend)和数据库(DB)。

## 安装步骤

### 1. 安装依赖

#### 前端依赖安装

```bash
cd Frontend
npm install
```

#### 后端依赖安装

```bash
cd Backend
npm install
```

### 2. 数据库设置

1. 确保已安装MySQL数据库服务器
2. 创建数据库并导入架构：

```bash
mysql -u root -p < Db/schema.sql
```

3. 在Backend目录下创建.env文件，配置数据库连接信息：

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vehicle_supplies_db
PORT=3000
JWT_SECRET=your_secret_key
```

### 3. 启动服务

#### 启动后端服务

```bash
cd Backend
npm run dev
```

服务器将在 http://localhost:3000 运行。

#### 启动前端开发服务器

```bash
cd Frontend
npm run dev
```

前端开发服务器将在 http://localhost:5173 运行。

## 系统使用说明

### 前端功能

- **首页**：展示热门产品和服务介绍
- **产品展示**：浏览所有车辆用品产品
- **产品询价**：对感兴趣的产品进行询价
- **订单管理**：查看和管理已下订单
- **物流跟踪**：通过订单号跟踪物流状态
- **用户中心**：管理个人信息和订单历史

### 后台管理

后台管理界面可通过 http://localhost:3000/admin 访问，用于：

- 配置前端组件的图片和文字内容
- 管理产品信息
- 处理用户询价和订单
- 更新物流信息

## 开发指南

### 前端开发

前端使用Vue.js框架，通过组件ID从后端获取动态数据（图片地址和文字信息）。主要文件结构：

- `src/views/`：各页面视图组件
- `src/components/`：可复用组件
- `src/router/`：路由配置
- `src/assets/`：静态资源

### 后端开发

后端使用Node.js和Express框架，提供API接口和后台管理功能。主要功能：

- 提供接口返回前端需要的动态数据
- 提供后台管理界面，用于配置前端内容
- 处理用户询价、订单和物流信息

### 数据库

数据库使用MySQL，主要表结构：

- `users`：用户信息
- `products`：产品信息
- `inquiries`：询价信息
- `orders`和`order_items`：订单信息
- `shipping_tracking`和`tracking_details`：物流信息
- `component_configs`：前端组件配置

## 部署指南

### 生产环境部署

1. 构建前端生产版本：

```bash
cd Frontend
npm run build
```

2. 配置后端服务器（如Nginx）指向前端构建目录

3. 启动后端服务：

```bash
cd Backend
npm start
```

4. 配置数据库备份策略

## 常见问题

1. **数据库连接失败**：检查.env文件中的数据库配置是否正确
2. **图片无法显示**：确保uploads目录存在且有正确的访问权限
3. **API请求失败**：检查前端API请求地址是否正确配置

## 技术支持

如有任何问题，请联系技术支持团队。