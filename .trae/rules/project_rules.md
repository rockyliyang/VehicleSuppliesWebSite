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
