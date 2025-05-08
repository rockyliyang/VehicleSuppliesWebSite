# 汽车用品网站调试指南

## 问题修复

### API代理配置问题
经过检查，main.js文件本身没有错误，但项目缺少前端API代理配置。已创建vue.config.js文件解决此问题。

### 安全漏洞修复
项目依赖中存在多个安全漏洞，已进行修复：
- 前端：修复了94个漏洞（3个低危、59个中危、27个高危、5个严重级别）
- 后端：修复了6个高危漏洞

已更新的依赖包版本如下：

**前端依赖更新**：
- axios: ^0.21.1 → ^1.6.7
- core-js: ^3.6.5 → ^3.36.0
- element-ui: ^2.15.6 → ^2.15.14
- swiper: ^6.8.4 → ^11.0.5
- vue: ^2.6.11 → ^2.7.16
- vue-router: ^3.2.0 → ^3.6.5
- vuex: ^3.4.0 → ^3.6.2
- 开发依赖也已全面更新到最新安全版本

**后端依赖更新**：
- body-parser: ^1.19.0 → ^1.20.2
- dotenv: ^10.0.0 → ^16.4.5
- express: ^4.17.1 → ^4.18.2
- multer: ^1.4.3 → ^1.4.5-lts.1
- nodemon: ^2.0.12 → ^3.0.3

### 兼容性注意事项

依赖包更新到较新版本后，可能会出现一些兼容性问题，请注意以下几点：

1. **前端兼容性**
   - Vue 2.7.x 是 Vue 2 的最终版本，API 与 Vue 2.6.x 基本兼容，但引入了部分 Vue 3 的特性
   - Swiper 从 v6 升级到 v11 变化较大，如遇到滑动组件问题，请参考 [Swiper 官方迁移指南](https://swiperjs.com/migration-guide)
   - Element UI 更新较小，一般不会有兼容性问题

2. **后端兼容性**
   - Express 4.18.x 与 4.17.x 基本兼容，主要是安全性提升
   - 如果使用了 body-parser 的特定功能，请检查 API 变化
   - Nodemon 3.x 可能需要调整配置文件格式

3. **如遇问题的解决方案**
   - 检查控制台错误信息，根据具体错误查找解决方案
   - 对于前端组件库的变化，查阅相应的官方文档
   - 如果更新后出现严重兼容性问题，可以考虑回退到特定的中间版本

## 调试环境配置

### 前端配置

已完成的配置：
- 创建了`vue.config.js`文件，配置了API代理，将所有`/api`请求转发到后端服务器

```javascript
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
}
```

### 后端配置

已完成的配置：
- 创建了`.env`文件，配置了数据库连接参数和其他环境变量

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=vehicle_supplies_db
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
```

## 应用安全更新

在启动项目前，请先应用安全更新：

### 更新前端依赖

1. 进入前端目录
```
cd c:\Code\IndependentWebSites\VehicleSuppliesWebSite\frontend
```

2. 删除旧的node_modules和package-lock.json（如果存在）
```
rmdir /s /q node_modules
del package-lock.json
```

3. 安装更新后的依赖
```
npm install
```

### 更新后端依赖

1. 进入后端目录
```
cd c:\Code\IndependentWebSites\VehicleSuppliesWebSite\backend
```

2. 删除旧的node_modules和package-lock.json（如果存在）
```
rmdir /s /q node_modules
del package-lock.json
```

3. 安装更新后的依赖
```
npm install
```

## 启动调试环境

### 启动前端服务

1. 进入前端目录
```
cd c:\Code\IndependentWebSites\VehicleSuppliesWebSite\frontend
```

2. 启动开发服务器
```
npm run serve
```
前端将在 http://localhost:8080 运行

### 启动后端服务

1. 进入后端目录
```
cd c:\Code\IndependentWebSites\VehicleSuppliesWebSite\backend
```

2. 启动开发服务器
```
npm run dev
```
后端将在 http://localhost:3000 运行

## 数据库配置

后端使用MySQL数据库，请确保您已安装MySQL并创建了名为`vehicle_supplies_db`的数据库。数据库连接参数在后端的`.env`文件中配置。

请根据您的实际MySQL配置修改这些参数。

## 注意事项

- 前端开发服务器会自动将API请求代理到后端服务器
- 后端服务器使用nodemon启动，可以自动重启以响应代码变更
- 确保数据库已正确配置并可以连接