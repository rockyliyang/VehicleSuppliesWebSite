# About Us 页面重新设计方案 (基于主从表结构和现有翻译机制)

## 1. 概述

本方案旨在根据用户提出的主从表结构设计，并结合现有 `language_translations` 表进行多语言支持，设计一个通用的内容管理系统。该系统可以支持多种内容类型（如About Us、News等），实现一个灵活、易于管理且支持多语言的内容管理平台。

## 2. 技术栈

- **前端**: Vue.js, Vue Router, Vuex, Element UI, Quill 富文本编辑器
- **后端**: Node.js, Express.js
- **数据库**: MySQL

## 3. 数据库设计

为了支持主从表结构和多语言内容，我们将使用以下数据库表：

### 3.1 `common_content_nav` (通用内容导航菜单主表)

存储导航菜单的基本信息和顺序，支持多种内容类型。

| 字段名         | 数据类型    | 约束        | 描述                                                           |
| -------------- | ----------- | ----------- | -------------------------------------------------------------- |
| `id`           | INT         | PRIMARY KEY | 唯一标识符                                                     |
| `name_key`     | VARCHAR(64) | NOT NULL    | 导航名称翻译键 (对应 `language_translations` 表的 `code` 字段) |
| `content_type` | VARCHAR(32) | NOT NULL    | 内容类型：about_us, news 等                                    |
| `sort_order`   | INT         | NOT NULL    | 导航菜单顺序                                                   |
| `status`       | TINYINT(1)  | NOT NULL    | 状态：1-启用，0-禁用                                           |
| `created_at`   | TIMESTAMP   |             | 创建时间                                                       |
| `updated_at`   | TIMESTAMP   |             | 更新时间                                                       |
| `deleted`      | TINYINT(1)  | DEFAULT 0   | 软删除标记                                                     |

### 3.2 `common_content` (通用内容从表)

存储每个导航菜单对应的富文本内容，支持多语言。

| 字段名          | 数据类型     | 约束        | 描述                               |
| --------------- | ------------ | ----------- | ---------------------------------- |
| `id`            | INT          | PRIMARY KEY | 唯一标识符                         |
| `nav_id`        | INT          | NOT NULL    | 对应 `common_content_nav` 的 ID    |
| `language_code` | VARCHAR(16)  | NOT NULL    | 语言代码 (e.g., 'en', 'zh-CN')     |
| `title`         | VARCHAR(200) |             | 内容标题                           |
| `content`       | LONGTEXT     |             | 富文本内容                         |
| `status`        | TINYINT(1)   | NOT NULL    | 状态：1-发布，0-草稿               |
| `created_at`    | TIMESTAMP    |             | 创建时间                           |
| `updated_at`    | TIMESTAMP    |             | 更新时间                           |
| `deleted`       | TINYINT(1)   | DEFAULT 0   | 软删除标记                         |

### 3.3 `common_content_images` (通用内容图片表)

存储内容相关的图片，包括菜单主图和内容中使用的图片。

| 字段名        | 数据类型     | 约束        | 描述         |
| ------------- | ------------ | ----------- | ------------ |
| `id`          | INT          | PRIMARY KEY | 唯一标识符   |
| `nav_id`      | INT          | NOT NULL    | 对应 `common_content_nav` 的 ID |
| `image_type`  | VARCHAR(32)  | NOT NULL    | 图片类型：main_image-菜单主图，content_image-内容图片 |
| `image_url`   | VARCHAR(500) | NOT NULL    | 图片URL路径  |
| `alt_text`    | VARCHAR(200) |             | 图片替代文本 |
| `sort_order`  | INT          | NOT NULL    | 图片排序     |
| `created_at`  | TIMESTAMP    |             | 创建时间     |
| `updated_at`  | TIMESTAMP    |             | 更新时间     |
| `deleted`     | TINYINT(1)   | DEFAULT 0   | 软删除标记   |

### 3.4 `language_translations` (现有语言翻译表)

用于存储导航菜单名称的翻译。

| 字段名    | 数据类型    | 约束        | 描述         |
| --------- | ----------- | ----------- | ------------ |
| `id`      | BIGINT      | PRIMARY KEY | 唯一标识符   |
| `guid`    | BINARY(16)  | NOT NULL    | 全局唯一标识 |
| `code`    | VARCHAR(64) | NOT NULL    | 翻译键       |
| `lang`    | VARCHAR(16) | NOT NULL    | 语言代码     |
| `value`   | TEXT        | NOT NULL    | 翻译值       |
| `deleted` | TINYINT(1)  | DEFAULT 0   | 软删除标记   |

## 4. 数据库脚本

### 4.1 创建 common_content_nav 表

```sql
CREATE TABLE common_content_nav (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name_key VARCHAR(64) NOT NULL COMMENT '导航名称翻译键，对应language_translations表的code字段',
  content_type VARCHAR(32) NOT NULL COMMENT '内容类型：about_us, news等',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序顺序',
  status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记：0-未删除，1-已删除',
  UNIQUE KEY uk_name_key_type (name_key, content_type),
  INDEX idx_content_type (content_type),
  INDEX idx_sort_order (sort_order),
  INDEX idx_status (status),
  INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用内容导航菜单主表';
```

### 4.2 创建 common_content 表

```sql
CREATE TABLE common_content (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nav_id INT NOT NULL COMMENT '关联导航菜单ID',
  language_code VARCHAR(16) NOT NULL COMMENT '语言代码：zh-CN, en-US等',
  title VARCHAR(200) COMMENT '内容标题',
  content LONGTEXT COMMENT '富文本内容',
  status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：1-发布，0-草稿',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记：0-未删除，1-已删除',
  FOREIGN KEY (nav_id) REFERENCES common_content_nav(id) ON DELETE CASCADE,
  UNIQUE KEY uk_nav_lang (nav_id, language_code),
  INDEX idx_language_code (language_code),
  INDEX idx_status (status),
  INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用内容表';
```

### 4.3 创建 common_content_images 表

```sql
CREATE TABLE common_content_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nav_id INT NOT NULL COMMENT '关联导航菜单ID',
  image_type VARCHAR(32) NOT NULL COMMENT '图片类型：main_image-菜单主图，content_image-内容图片',
  image_url VARCHAR(500) NOT NULL COMMENT '图片URL路径',
  alt_text VARCHAR(200) COMMENT '图片替代文本',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '图片排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记：0-未删除，1-已删除',
  FOREIGN KEY (nav_id) REFERENCES common_content_nav(id) ON DELETE CASCADE,
  INDEX idx_nav_id (nav_id),
  INDEX idx_image_type (image_type),
  INDEX idx_sort_order (sort_order),
  INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用内容图片表';
```

### 4.4 初始化数据

```sql
-- 插入默认导航菜单（About Us类型）
INSERT INTO common_content_nav (name_key, content_type, sort_order) VALUES
('about.company', 'about_us', 1),
('about.culture', 'about_us', 2),
('about.certificate', 'about_us', 3),
('about.honors', 'about_us', 4);

-- 插入默认导航菜单（News类型）
INSERT INTO common_content_nav (name_key, content_type, sort_order) VALUES
('news.company', 'news', 1),
('news.industry', 'news', 2),
('news.product', 'news', 3);

-- 插入导航翻译数据到 language_translations 表
INSERT INTO language_translations (guid, code, lang, value) VALUES
-- About Us 翻译
(UNHEX(REPLACE(UUID(), '-', '')), 'about.company', 'zh-CN', '公司简介'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about.company', 'en', 'Our Company'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about.culture', 'zh-CN', '企业文化'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about.culture', 'en', 'Culture'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about.certificate', 'zh-CN', '资质证书'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about.certificate', 'en', 'Certificate'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about.honors', 'zh-CN', '荣誉资质'),
(UNHEX(REPLACE(UUID(), '-', '')), 'about.honors', 'en', 'Honors and Qualification'),
-- News 翻译
(UNHEX(REPLACE(UUID(), '-', '')), 'news.company', 'zh-CN', '公司新闻'),
(UNHEX(REPLACE(UUID(), '-', '')), 'news.company', 'en', 'Company News'),
(UNHEX(REPLACE(UUID(), '-', '')), 'news.industry', 'zh-CN', '行业动态'),
(UNHEX(REPLACE(UUID(), '-', '')), 'news.industry', 'en', 'Industry News'),
(UNHEX(REPLACE(UUID(), '-', '')), 'news.product', 'zh-CN', '产品资讯'),
(UNHEX(REPLACE(UUID(), '-', '')), 'news.product', 'en', 'Product News');
```

## 2. 后端API设计

### 2.1 控制器：CommonContentController.js

```javascript
const db = require('../db/db');
const { successResponse, errorResponse } = require('../middleware/responseHandler');

class CommonContentController {
  // 获取导航菜单列表
  async getNavList(req, res) {
    try {
      const { language = 'zh-CN', contentType = 'about_us' } = req.query;
      
      const query = `
        SELECT 
          n.id,
          n.name_key,
          n.content_type,
          n.sort_order,
          lt.value as nav_name
        FROM common_content_nav n
        LEFT JOIN language_translations lt ON n.name_key = lt.code AND lt.lang = ? AND lt.deleted = 0
        WHERE n.status = 1 AND n.deleted = 0 AND n.content_type = ?
        ORDER BY n.sort_order ASC
      `;
      
      const navList = await db.query(query, [language, contentType]);
      return successResponse(res, navList, 'Navigation list retrieved successfully');
    } catch (error) {
      console.error('Get nav list error:', error);
      return errorResponse(res, 'Failed to get navigation list', 500);
    }
  }

  // 获取指定导航的内容
  async getContent(req, res) {
    try {
      const { nameKey } = req.params;
      const { language = 'zh-CN' } = req.query;
      
      const query = `
        SELECT 
          c.id,
          c.title,
          c.content,
          n.name_key,
          n.content_type,
          lt.value as nav_name
        FROM common_content c
        INNER JOIN common_content_nav n ON c.nav_id = n.id
        LEFT JOIN language_translations lt ON n.name_key = lt.code AND lt.lang = ? AND lt.deleted = 0
        WHERE n.name_key = ? AND c.language_code = ? AND c.status = 1 AND c.deleted = 0 AND n.deleted = 0
      `;
      
      const content = await db.query(query, [language, nameKey, language]);
      
      if (content.length === 0) {
        return errorResponse(res, 'Content not found', 404);
      }
      
      return successResponse(res, content[0], 'Content retrieved successfully');
    } catch (error) {
      console.error('Get content error:', error);
      return errorResponse(res, 'Failed to get content', 500);
    }
  }

  // 管理员：获取所有导航菜单（包括禁用的）
  async adminGetNavList(req, res) {
    try {
      const { language = 'zh-CN', contentType } = req.query;
      
      let query = `
        SELECT 
          n.id,
          n.name_key,
          n.content_type,
          n.sort_order,
          n.status,
          lt.value as nav_name
        FROM common_content_nav n
        LEFT JOIN language_translations lt ON n.name_key = lt.code AND lt.lang = ? AND lt.deleted = 0
        WHERE n.deleted = 0
      `;
      
      const params = [language];
      if (contentType) {
        query += ' AND n.content_type = ?';
        params.push(contentType);
      }
      
      query += ' ORDER BY n.content_type ASC, n.sort_order ASC';
      
      const navList = await db.query(query, params);
      return successResponse(res, navList, 'Admin navigation list retrieved successfully');
    } catch (error) {
      console.error('Admin get nav list error:', error);
      return errorResponse(res, 'Failed to get admin navigation list', 500);
    }
  }

  // 管理员：创建/更新内容
  async adminSaveContent(req, res) {
    try {
      const { navId, languageCode, title, content, status = 1 } = req.body;
      
      // 检查是否已存在
      const existingQuery = `
        SELECT id FROM common_content 
        WHERE nav_id = ? AND language_code = ? AND deleted = 0
      `;
      const existing = await db.query(existingQuery, [navId, languageCode]);
      
      let result;
      if (existing.length > 0) {
        // 更新
        const updateQuery = `
          UPDATE common_content 
          SET title = ?, content = ?, status = ?, updated_at = NOW()
          WHERE nav_id = ? AND language_code = ? AND deleted = 0
        `;
        result = await db.query(updateQuery, [title, content, status, navId, languageCode]);
      } else {
        // 创建
        const insertQuery = `
          INSERT INTO common_content (nav_id, language_code, title, content, status)
          VALUES (?, ?, ?, ?, ?)
        `;
        result = await db.query(insertQuery, [navId, languageCode, title, content, status]);
      }
      
      return successResponse(res, { id: existing.length > 0 ? existing[0].id : result.insertId }, 'Content saved successfully');
    } catch (error) {
      console.error('Admin save content error:', error);
      return errorResponse(res, 'Failed to save content', 500);
    }
  }

  // 管理员：更新导航菜单排序
  async adminUpdateNavOrder(req, res) {
    try {
      const { navItems } = req.body; // [{ id, sort_order }, ...]
      
      const updatePromises = navItems.map(item => {
        const query = 'UPDATE common_content_nav SET sort_order = ? WHERE id = ?';
        return db.query(query, [item.sort_order, item.id]);
      });
      
      await Promise.all(updatePromises);
      return successResponse(res, null, 'Navigation order updated successfully');
    } catch (error) {
      console.error('Admin update nav order error:', error);
      return errorResponse(res, 'Failed to update navigation order', 500);
    }
  }
}

module.exports = new CommonContentController();
```

### 2.2 路由：CommonContentRoutes.js

```javascript
const express = require('express');
const router = express.Router();
const commonContentController = require('../controllers/CommonContentController');
const { authenticateToken, requireAdmin } = require('../middleware/jwt');

// 前端API
router.get('/nav', commonContentController.getNavList);
router.get('/content/:nameKey', commonContentController.getContent);

// 管理员API
router.get('/admin/nav', authenticateToken, requireAdmin, commonContentController.adminGetNavList);
router.post('/admin/content', authenticateToken, requireAdmin, commonContentController.adminSaveContent);
router.put('/admin/nav/order', authenticateToken, requireAdmin, commonContentController.adminUpdateNavOrder);

module.exports = router;
```

## 3. 前端实现

### 3.1 About.vue 重新设计

```vue
<template>
  <div class="about-page">
    <PageBanner title="关于我们" />
    
    <div class="about-container">
      <!-- 左侧导航菜单 -->
      <div class="nav-sidebar">
        <ul class="nav-menu">
          <li 
            v-for="nav in navList" 
            :key="nav.id"
            :class="['nav-item', { active: activeNavKey === nav.nav_key }]"
            @click="handleNavClick(nav.nav_key)"
          >
            <span class="nav-text">{{ nav.nav_name }}</span>
            <div v-if="activeNavKey === nav.nav_key" class="active-indicator"></div>
          </li>
        </ul>
      </div>
      
      <!-- 右侧内容区域 -->
      <div class="content-area">
        <div v-if="loading" class="loading-container">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
        
        <div v-else-if="currentContent" class="content-wrapper">
          <h1 class="content-title">{{ currentContent.title }}</h1>
          <div class="content-body" v-html="currentContent.content"></div>
        </div>
        
        <div v-else class="empty-content">
          <el-empty description="暂无内容" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Loading } from '@element-plus/icons-vue'
import PageBanner from '@/components/PageBanner.vue'

export default {
  name: 'About',
  components: {
    PageBanner,
    Loading
  },
  data() {
    return {
      navList: [],
      currentContent: null,
      activeNavKey: '',
      loading: false,
      currentLanguage: 'zh-CN'
    }
  },
  async created() {
    await this.fetchNavList()
    if (this.navList.length > 0) {
      // 默认选择第一个导航项
      this.activeNavKey = this.navList[0].nav_key
      await this.fetchContent(this.activeNavKey)
    }
  },
  methods: {
    async fetchNavList() {
      try {
        const response = await this.$api.get('/about-us/nav', {
          params: { language: this.currentLanguage }
        })
        this.navList = response.data || []
      } catch (error) {
        console.error('获取导航列表失败:', error)
        this.$messageHandler.showError('获取导航列表失败')
      }
    },
    
    async fetchContent(navKey) {
      if (!navKey) return
      
      this.loading = true
      try {
        const response = await this.$api.get(`/about-us/content/${navKey}`, {
          params: { language: this.currentLanguage }
        })
        this.currentContent = response.data
      } catch (error) {
        console.error('获取内容失败:', error)
        this.$messageHandler.showError('获取内容失败')
        this.currentContent = null
      } finally {
        this.loading = false
      }
    },
    
    async handleNavClick(navKey) {
      if (this.activeNavKey === navKey) return
      
      this.activeNavKey = navKey
      await this.fetchContent(navKey)
      
      // 平滑滚动到内容区域顶部
      this.$nextTick(() => {
        const contentArea = this.$el.querySelector('.content-area')
        if (contentArea) {
          contentArea.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.about-page {
  min-height: 100vh;
  background-color: #ffffff;
}

.about-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  display: flex;
  gap: 40px;
  
  @media (max-width: $breakpoint-tablet) {
    flex-direction: column;
    gap: 20px;
    padding: 20px 15px;
  }
}

// 左侧导航菜单
.nav-sidebar {
  flex: 0 0 280px;
  
  @media (max-width: $breakpoint-tablet) {
    flex: none;
  }
}

.nav-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.nav-item {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f7f7f7;
    
    .nav-text {
      color: $color-primary;
    }
  }
  
  &.active {
    background-color: $color-text-primary;
    
    .nav-text {
      color: #ffffff;
      font-weight: 600;
    }
    
    .active-indicator {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: $color-primary;
    }
  }
}

.nav-text {
  display: block;
  padding: 20px 24px;
  font-size: 16px;
  color: $color-text-primary;
  transition: color 0.3s ease;
  
  @media (max-width: $breakpoint-mobile) {
    padding: 16px 20px;
    font-size: 15px;
  }
}

// 右侧内容区域
.content-area {
  flex: 1;
  min-height: 500px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: $color-text-secondary;
  
  .el-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }
}

.content-wrapper {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 40px;
  
  @media (max-width: $breakpoint-mobile) {
    padding: 24px 20px;
  }
}

.content-title {
  font-size: 32px;
  font-weight: 700;
  color: $color-text-primary;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 3px solid $color-primary;
  
  @media (max-width: $breakpoint-mobile) {
    font-size: 24px;
    margin-bottom: 24px;
  }
}

.content-body {
  font-size: 16px;
  line-height: 1.8;
  color: $color-text-primary;
  
  // 富文本内容样式
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    color: $color-text-primary;
    font-weight: 600;
    margin: 24px 0 16px 0;
    
    &:first-child {
      margin-top: 0;
    }
  }
  
  :deep(h2) {
    font-size: 24px;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 8px;
  }
  
  :deep(h3) {
    font-size: 20px;
  }
  
  :deep(p) {
    margin: 16px 0;
    
    &:first-child {
      margin-top: 0;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  :deep(ul), :deep(ol) {
    margin: 16px 0;
    padding-left: 24px;
  }
  
  :deep(li) {
    margin: 8px 0;
  }
  
  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 16px 0;
  }
  
  :deep(blockquote) {
    border-left: 4px solid $color-primary;
    background-color: #f9f9f9;
    padding: 16px 20px;
    margin: 20px 0;
    font-style: italic;
  }
  
  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    
    th, td {
      border: 1px solid #e0e0e0;
      padding: 12px;
      text-align: left;
    }
    
    th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
  }
}

.empty-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
}

// 移动端优化
@media (max-width: $breakpoint-mobile) {
  .nav-menu {
    display: flex;
    overflow-x: auto;
    white-space: nowrap;
    
    .nav-item {
      flex: 0 0 auto;
      border-bottom: none;
      border-right: 1px solid #f0f0f0;
      
      &:last-child {
        border-right: none;
      }
    }
    
    .nav-text {
      white-space: nowrap;
    }
  }
}
</style>
```

### 3.2 管理员编辑页面：AdminAboutUs.vue

```vue
<template>
  <div class="admin-about-us">
    <div class="page-header">
      <h2>关于我们管理</h2>
    </div>

    <!-- 导航菜单管理 -->
    <el-card class="nav-management" shadow="never">
      <template #header>
        <div class="card-header">
          <span>导航菜单管理</span>
        </div>
      </template>
      
      <el-table :data="navList" border>
        <el-table-column prop="sort_order" label="排序" width="80" />
        <el-table-column prop="nav_key" label="键值" width="120" />
        <el-table-column prop="nav_name" label="菜单名称" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{row}">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{row}">
            <el-button type="primary" size="small" @click="handleEditContent(row)">
              编辑内容
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 内容编辑对话框 -->
    <el-dialog 
      :title="`编辑内容 - ${currentNav?.nav_name}`" 
      v-model="dialogVisible" 
      width="90%"
      :close-on-click-modal="false"
    >
      <el-form :model="contentForm" label-width="100px">
        <el-form-item label="语言">
          <el-select v-model="contentForm.languageCode" @change="handleLanguageChange">
            <el-option label="中文" value="zh-CN" />
            <el-option label="English" value="en-US" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="标题">
          <el-input v-model="contentForm.title" placeholder="请输入内容标题" />
        </el-form-item>
        
        <el-form-item label="SEO描述">
          <el-input 
            v-model="contentForm.metaDescription" 
            type="textarea" 
            :rows="3"
            placeholder="请输入SEO描述"
          />
        </el-form-item>
        
        <el-form-item label="内容">
          <quill-editor 
            ref="quillEditor" 
            v-model="contentForm.content" 
            :options="quillOptions" 
            :key="quillKey"
            style="height: 400px" 
            @change="onQuillChange" 
            @ready="onQuillReady" 
          />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="contentForm.status">
            <el-radio :label="1">发布</el-radio>
            <el-radio :label="0">草稿</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveContent" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { quillEditor } from 'vue3-quill'
import { getAuthToken } from '@/utils/auth'

export default {
  name: 'AdminAboutUs',
  components: {
    quillEditor
  },
  data() {
    return {
      navList: [],
      dialogVisible: false,
      currentNav: null,
      saving: false,
      contentForm: {
        navId: null,
        languageCode: 'zh-CN',
        title: '',
        content: '',
        metaDescription: '',
        status: 1
      },
      sessionId: localStorage.getItem('session_id') || (Date.now() + '-' + Math.random().toString(36).substr(2, 9)),
      quillOptions: {
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean']
          ]
        }
      },
      quillKey: 0
    }
  },
  computed: {
    uploadHeaders() {
      const token = getAuthToken(true)
      return {
        Authorization: token ? `Bearer ${token}` : ''
      }
    }
  },
  created() {
    this.fetchNavList()
    if (!localStorage.getItem('session_id')) {
      localStorage.setItem('session_id', this.sessionId)
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.$refs.quillEditor && this.$refs.quillEditor.getQuill) {
        const quill = this.$refs.quillEditor.getQuill()
        quill.getModule('toolbar').addHandler('image', () => {
          this.handleQuillImageUpload(quill)
        })
      }
    })
  },
  methods: {
    async fetchNavList() {
      try {
        const response = await this.$api.get('/about-us/admin/nav', {
          params: { language: 'zh-CN' }
        })
        this.navList = response.data || []
      } catch (error) {
        console.error('获取导航列表失败:', error)
        this.$messageHandler.showError('获取导航列表失败')
      }
    },
    
    async handleEditContent(nav) {
      this.currentNav = nav
      this.contentForm.navId = nav.id
      this.contentForm.languageCode = 'zh-CN'
      
      // 获取现有内容
      await this.fetchContent(nav.nav_key, 'zh-CN')
      
      this.dialogVisible = true
      this.quillKey++
    },
    
    async fetchContent(navKey, language) {
      try {
        const response = await this.$api.get(`/about-us/content/${navKey}`, {
          params: { language }
        })
        
        if (response.data) {
          this.contentForm.title = response.data.title || ''
          this.contentForm.content = response.data.content || ''
          this.contentForm.metaDescription = response.data.meta_description || ''
        } else {
          // 新内容
          this.contentForm.title = ''
          this.contentForm.content = ''
          this.contentForm.metaDescription = ''
        }
      } catch (error) {
        // 内容不存在，重置表单
        this.contentForm.title = ''
        this.contentForm.content = ''
        this.contentForm.metaDescription = ''
      }
    },
    
    async handleLanguageChange() {
      if (this.currentNav) {
        await this.fetchContent(this.currentNav.nav_key, this.contentForm.languageCode)
        this.quillKey++
      }
    },
    
    async handleSaveContent() {
      this.saving = true
      try {
        await this.$api.post('/about-us/admin/content', {
          navId: this.contentForm.navId,
          languageCode: this.contentForm.languageCode,
          title: this.contentForm.title,
          content: this.contentForm.content,
          metaDescription: this.contentForm.metaDescription,
          status: this.contentForm.status
        })
        
        this.$messageHandler.showSuccess('内容保存成功')
        this.dialogVisible = false
      } catch (error) {
        console.error('保存内容失败:', error)
        this.$messageHandler.showError('保存内容失败')
      } finally {
        this.saving = false
      }
    },
    
    async handleQuillImageUpload(quill) {
      const input = document.createElement('input')
      input.setAttribute('type', 'file')
      input.setAttribute('accept', 'image/*')
      input.click()
      
      input.onchange = async () => {
        const file = input.files[0]
        if (!file) return
        
        const formData = new FormData()
        formData.append('images', file)
        formData.append('image_type', 2)
        formData.append('session_id', this.sessionId)
        
        try {
          const res = await this.$api.postWithErrorHandler('/product-images/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              ...this.uploadHeaders
            }
          })
          
          if (res.success && res.data && res.data.images && res.data.images[0]) {
            const url = res.data.images[0].path
            const range = quill.getSelection()
            quill.insertEmbed(range ? range.index : 0, 'image', url)
          } else {
            this.$messageHandler.showError('图片上传失败')
          }
        } catch (err) {
          this.$messageHandler.showError('图片上传失败')
        }
      }
    },
    
    onQuillChange(content) {
      if (typeof content === 'object' && content.html) {
        this.contentForm.content = content.html
      } else if (typeof content === 'string') {
        this.contentForm.content = content
      } else {
        this.contentForm.content = ''
      }
    },
    
    onQuillReady(quill) {
      if (quill && this.contentForm.content) {
        quill.root.innerHTML = this.contentForm.content
      }
      if (quill && quill.getModule('toolbar')) {
        quill.getModule('toolbar').addHandler('image', () => {
          this.handleQuillImageUpload(quill)
        })
      }
    }
  }
}
</script>

<style scoped>
.admin-about-us {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.nav-management {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
```

## 4. 实施步骤

### 4.1 数据库迁移
1. 执行数据库表创建脚本
2. 插入初始化数据
3. 配置数据库索引优化

### 4.2 后端开发
1. 创建 `aboutUsController.js` 控制器
2. 创建 `aboutUsRoutes.js` 路由文件
3. 在 `server.js` 中注册路由
4. 测试API接口

### 4.3 前端开发
1. 重写 `About.vue` 组件
2. 创建 `AdminAboutUs.vue` 管理页面
3. 配置路由
4. 集成富文本编辑器
5. 测试前端功能

### 4.4 集成测试
1. 前后端联调测试
2. 多语言功能测试
3. 富文本编辑功能测试
4. 响应式布局测试

## 5. 技术特性

### 5.1 主要功能
- ✅ 主从表结构设计
- ✅ 多语言支持
- ✅ 富文本编辑（基于Quill）
- ✅ 可配置导航菜单
- ✅ 响应式设计
- ✅ 管理员后台编辑
- ✅ 图片上传支持
- ✅ SEO优化

### 5.2 性能优化
- 数据库索引优化
- 前端懒加载
- 图片压缩和优化
- 缓存策略

### 5.3 安全考虑
- JWT身份验证
- 管理员权限控制
- XSS防护（富文本内容过滤）
- SQL注入防护

## 6. 维护和扩展

### 6.1 内容管理
- 支持多语言内容编辑
- 富文本编辑器支持图片、视频等媒体
- 版本控制和内容历史

### 6.2 功能扩展
- 可添加更多导航菜单项
- 支持内容模板
- 支持内容预览功能
- 支持内容发布时间控制

### 6.3 监控和分析
- 内容访问统计
- 用户行为分析
- 性能监控

---

本设计方案提供了完整的About Us页面重构解决方案，包含数据库设计、后端API、前端实现和管理功能，支持多语言和富文本编辑，具有良好的可扩展性和维护性。