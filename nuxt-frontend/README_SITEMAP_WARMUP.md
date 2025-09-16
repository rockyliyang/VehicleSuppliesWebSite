# Nuxt Frontend - Sitemap 生成和页面预热功能

本文档介绍了在 Nuxt Frontend 中实现的 sitemap 生成和页面预热功能。

## 功能概述

### 1. Sitemap 生成
- 自动生成 `sitemap.xml` 文件
- 包含静态页面和动态页面（产品页、新闻页）
- 支持在构建过程中自动生成
- 遵循 XML Sitemap 标准

### 2. 页面预热 (Warmup)
- 预热关键页面以提升用户访问体验
- 支持并发请求控制
- 包含主页、Header/Footer API、产品页面预热
- 可配置预热选项

## 文件结构

```
nuxt-frontend/
├── app/
│   ├── public/
│   │   ├── robots.txt          # 搜索引擎爬虫规则
│   │   └── sitemap.xml         # 自动生成的站点地图
│   └── utils/
│       ├── sitemapGenerator.js # Sitemap生成器和预热功能
│       └── warmup.js          # 独立的预热脚本
├── nuxt.config.ts             # 包含构建钩子配置
└── README_SITEMAP_WARMUP.md   # 本文档
```

## 使用方法

### 自动执行（推荐）

在构建过程中，sitemap 生成和预热会自动执行：

```bash
# 构建项目时自动执行
npm run build
```

构建过程中会：
1. 生成 sitemap.xml
2. 在生产环境下执行页面预热

### 手动执行

#### 1. 生成 Sitemap

```bash
# 进入 nuxt-frontend 目录
cd nuxt-frontend

# 直接运行 sitemap 生成器
node app/utils/sitemapGenerator.js
```

#### 2. 执行页面预热

```bash
# 使用默认设置预热
node app/utils/warmup.js

# 使用自定义并发数
node app/utils/warmup.js -c 5

# 跳过产品页面预热
node app/utils/warmup.js -s

# 组合选项：使用2个并发且跳过产品页面
node app/utils/warmup.js -c 2 -s

# 查看帮助信息
node app/utils/warmup.js -h
```

## 配置选项

### Sitemap 配置

在 `app/utils/sitemapGenerator.js` 中可以配置：

```javascript
// 基础URL
const BASE_URL = 'https://v.autoeasetechx.com';

// 静态页面配置
const STATIC_PAGES = [
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/products', changefreq: 'daily', priority: 0.9 },
  // ... 更多页面
];
```

### 预热配置

预热功能支持以下选项：

- `concurrency`: 并发请求数量（默认：3）
- `skipProducts`: 是否跳过产品页面预热（默认：false）

### Nuxt 配置

在 `nuxt.config.ts` 中的构建钩子配置：

```typescript
nitro: {
  hooks: {
    'build:done': async () => {
      // 生成 sitemap
    },
    'nitro:build:public-assets': async () => {
      // 执行预热（仅生产环境）
    }
  }
}
```

## 预热页面列表

预热功能会预热以下页面：

1. **主页** - 最高优先级
   - `/`

2. **重要静态页面**
   - `/products`
   - `/about`
   - `/news`
   - `/contact`

3. **API 端点**（用于 Header/Footer）
   - `/api/company-info`
   - `/api/common-content/nav/news?lang=en`

4. **产品页面**（前10个）
   - `/product/{id}`

## robots.txt 配置

`app/public/robots.txt` 文件配置了搜索引擎爬虫规则：

```
User-agent: *
Allow: /
Allow: /products
Allow: /product/
# ... 更多规则

Sitemap: https://autoeasetechx.com/sitemap.xml
```

## 构建集成

在 `build.bat` 中集成了自动执行：

```batch
:: 生成 sitemap
node app/utils/sitemapGenerator.js

:: 执行预热（仅生产环境）
if "%NODE_ENV%"=="production" (
    node app/utils/warmup.js -c 2
)
```

## 监控和日志

### Sitemap 生成日志
- 成功生成会显示文件路径
- 失败时会显示错误信息
- 包含动态页面获取统计

### 预热日志
- 显示预热进度和结果统计
- 记录成功/失败的页面
- 显示总耗时和成功率

## 故障排除

### 常见问题

1. **Sitemap 生成失败**
   - 检查 API 连接是否正常
   - 确认输出目录权限
   - 查看控制台错误信息

2. **预热失败**
   - 检查网络连接
   - 确认目标服务器是否运行
   - 调整并发数量

3. **构建时执行失败**
   - 检查 Node.js 版本兼容性
   - 确认依赖包已安装
   - 查看构建日志

### 调试模式

可以通过环境变量启用详细日志：

```bash
# 启用调试模式
DEBUG=sitemap,warmup node app/utils/warmup.js
```

## 性能优化建议

1. **并发控制**：根据服务器性能调整并发数量
2. **选择性预热**：在资源有限时可跳过产品页面预热
3. **定时执行**：可以设置定时任务定期更新 sitemap 和预热
4. **缓存策略**：配合 CDN 和缓存策略提升效果

## 扩展功能

可以根据需要扩展以下功能：

1. **更多页面类型**：添加其他动态页面到 sitemap
2. **智能预热**：根据访问统计选择预热页面
3. **预热调度**：实现定时预热任务
4. **监控集成**：集成监控系统跟踪预热效果

---

> 📝 **注意**: 预热功能主要在生产环境中使用，开发环境下会跳过预热步骤以提升构建速度。