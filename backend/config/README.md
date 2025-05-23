# 环境变量配置说明

## 概述

本项目使用多环境配置方案，根据不同的运行环境（开发、测试、生产）加载对应的环境变量配置文件。

## 配置文件优先级

系统按照以下优先级加载环境变量配置文件：

1. `.env.{NODE_ENV}.local` - 本地特定环境配置（不提交到版本控制）
2. `.env.{NODE_ENV}` - 特定环境配置
3. `.env.local` - 本地通用配置（不提交到版本控制）
4. `.env` - 默认配置

## 现有配置文件

- `.env` - 默认配置文件
- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置

## 使用方法

### 开发环境

默认情况下，系统使用开发环境配置：

```bash
npm run dev
```

### 生产环境

在生产环境中运行时，需要设置 NODE_ENV 环境变量为 production：

```bash
NODE_ENV=production npm start
```

或者在 Windows 环境下：

```bash
set NODE_ENV=production && npm start
```

### 自定义本地配置

如果需要在本地覆盖某些配置，但不想提交到版本控制，可以创建以下文件：

- `.env.development.local` - 本地开发环境特定配置
- `.env.production.local` - 本地生产环境特定配置
- `.env.local` - 本地通用配置

## 注意事项

1. 敏感信息（如数据库密码、API密钥等）不应该提交到版本控制系统
2. 生产环境的敏感配置应该通过环境变量或安全的配置管理系统提供
3. `.env.*.local` 文件应该添加到 .gitignore 中

## 在代码中使用

环境变量会自动加载到 `process.env` 对象中，可以直接使用：

```javascript
const dbHost = process.env.DB_HOST;
const isProduction = process.env.NODE_ENV === 'production';
```

也可以通过 `env` 模块获取当前环境信息：

```javascript
const env = require('./config/env');

if (env.isProduction) {
  // 生产环境特定代码
}
```