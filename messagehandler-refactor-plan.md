# MessageHandler 重构计划

## 概述
将 `errorHandler` 重构为 `messageHandler`，增加 `confirm` 方法封装，并修改相关调用。

## 重构目标
1. 将 `errorHandler.js` 重命名为 `messageHandler.js`
2. 将 `ErrorHandler` 类重命名为 `MessageHandler`
3. 在 `MessageHandler` 中增加 `confirm` 方法封装
4. 修改 `main.js` 中的全局属性注册
5. 修改 `cartUtils.js` 中的 `addToCart` 函数
6. 更新调用 `addToCart` 的组件
7. 更新前端规则文件

## 执行步骤

### 步骤 1: 重命名文件并重构 MessageHandler 类
- 将 `frontend/src/utils/errorHandler.js` 重命名为 `messageHandler.js`
- 将类名 `ErrorHandler` 改为 `MessageHandler`
- 增加 `confirm` 静态方法

### 步骤 2: 修改 main.js 中的全局属性注册
- 将导入从 `ErrorHandler` 改为 `MessageHandler`
- 将全局属性从 `$errorHandler` 改为 `$messageHandler`

### 步骤 3: 修改 cartUtils.js
- 将参数从 `$message` 改为 `messageHandler`
- 使用 `messageHandler.confirm` 替代 `$message.confirm`
- 恢复使用 `postWithErrorHandler`

### 步骤 4: 更新调用 addToCart 的组件
- 修改 `ProductDetail.vue` 中的调用
- 修改 `Products.vue` 中的调用

### 步骤 5: 更新前端规则文件
- 修改 `frontend_rules.md` 中的相关描述

### 步骤 6: 搜索并更新所有其他使用 $errorHandler 的地方
- 搜索项目中所有 `$errorHandler` 的使用
- 逐一替换为 `$messageHandler`

## 注意事项
1. 每个步骤完成后进行验证
2. 确保不影响其他功能
3. 保持代码风格一致
4. 确保所有导入和引用都正确更新

## 验证清单
- [ ] 文件重命名成功
- [ ] 类名更新正确
- [ ] confirm 方法添加成功
- [ ] main.js 更新正确
- [ ] cartUtils.js 更新正确
- [ ] 组件调用更新正确
- [ ] 规则文件更新正确
- [x] 所有 $errorHandler 引用已替换
- [ ] 项目可以正常运行