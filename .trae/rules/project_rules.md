---
description: 项目开发主规则文件 - 包含项目概览和规则索引
globs: 
alwaysApply: true
---
# 项目开发规则

## 项目概览
项目的默认语言是英语，所有的默认文本都应该是英语。

### 技术栈
系统使用 vue 做前端，nodejs 做后端，postgresql 做 DB。
- 前端目录: frontend
- 后端目录: backend
- DB 目录: db, db 下的main 目录存放主要的脚本, patch 下面存放做数据fix 的脚步
- 项目文档: docs, 除了根目录下的README.md,其他文档都在这个目录下

### 规则文件索引

本项目采用分离式规则管理，不同领域的开发规则分别存储在专门的文件中：

- **[数据库设计规则](./database_rules.md)** - 数据库表结构、字段类型、软删除等规则
- **[后端开发规则](./backend_rules.md)** - 后端接口设计、JWT鉴权、错误处理等规则
- **[前端开发规则](./frontend_rules.md)** - 前端组件开发、样式处理、API调用等规则
- **[API设计规则](./api_rules.md)** - 前后端接口规范、错误处理、数据格式等规则
- **[组件库规则](./component_rules.md)** - 前端组件库使用、命名规范、复用原则等规则
- **[代码质量规则](./code_quality_rules.md)** - 代码检查、测试、构建等质量保证规则

## 通用开发规范

### 文件命名规范
- 组件文件名使用 PascalCase（如 `FormInput.vue`）
- 工具函数文件使用 camelCase（如 `apiUtils.js`）
- 配置文件使用 kebab-case（如 `vue.config.js`）

### 代码风格
- 所有 Vue 组件必须统一使用 Options API（export default）风格
- 不使用 Composition API（setup 函数），以保持代码风格一致性
- 使用 ESLint 进行代码规范检查

### 版本控制
- 提交前必须通过 `npm run lint` 检查
- 重要功能提交前运行 `npm run build` 确保构建正常
- 提交信息使用中文，格式：`功能: 具体描述`

## 使用说明

### 对于开发者
1. **前端开发**：主要参考 `frontend_rules.md` 和 `component_rules.md`
2. **后端开发**：主要参考 `backend_rules.md` 和 `api_rules.md`
3. **数据库设计**：主要参考 `database_rules.md`
4. **全栈开发**：根据任务类型组合相关规则文件

### 对于AI助手
- 根据任务类型自动加载相关规则文件
- 前端任务：加载 frontend_rules.md + component_rules.md
- 后端任务：加载 backend_rules.md + api_rules.md
- 数据库任务：加载 database_rules.md
- 复杂任务：组合多个相关规则文件

## 规则更新

当需要更新规则时：
1. 确定规则所属的领域
2. 修改对应的专门规则文件
3. 如果是新的规则类别，考虑创建新的规则文件
4. 更新本文件的索引部分

---

> 📝 **注意**: 本文件作为规则索引，具体的开发规则请查看对应的专门文件。