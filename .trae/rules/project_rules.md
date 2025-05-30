---
description: 
globs: 
alwaysApply: true
---
# 项目开发规则

## 技术栈
系统使用 vue 做前端，nodejs 做后端，mysql 做 DB。
- 前端目录: frontend
- 后端目录: backend
- DB 目录: db

## DB 设计需求
1. DB 所有的表使用 BIGINT 做主键，需要有一个 BINARY 类型字段自动存储一个对应 GUID。
2. 所有记录不能直接删除，需要使用 deleted 字段软删除。
3. 字符串类型长度请都为 8 的倍数，例如 16, 32, 64, 256。

## 后端接口设计
1. 管理接口和用户信息接口需要使用 JWT 鉴权,后端接口都不提供用Id 作为输入参数，用户Id 存在JWT token 中
2. 所有接口都使用 {success: boolean, message: string, data: object} 的格式返回数据。
3. 后台所有接口都应该用 try/catch 包裹，不要让进程挂掉。
4. 后端的所有查询db 的请求都要列出具体的字段，不要使用 select * 

### 前端设计
1. 如果遇到第三方组件样式问题时需要样式穿透, 推荐使用 :deep() 语法，也可以使用 /deep/ 或 >>> 来穿透作用域限制
2. 所有 Vue 组件必须统一使用 Options API（export default）风格，不使用 Composition API（setup 函数），以保持代码风格一致性

### 代码检查
每次修改完代码，需要检查是否有编译错误。推荐使用以下方式进行快速代码检查：

1. **开发时实时检查**：使用 `npm run serve` 启动开发服务器，利用热重载功能实时检查编译错误
2. **语法检查**：使用 `npm run lint` 进行 ESLint 语法检查，快速发现代码规范问题
3. **完整构建检查**：仅在提交代码前使用 `npm run build` 进行完整的生产环境构建检查

**推荐工作流程**：
- 代码修改后运行 `npm run lint` 检查语法规范
- 提交前运行 `npm run build` 确保生产环境构建正常