# API 错误处理指南

## 概述

新的 API 错误处理机制解决了以下问题：
1. 后端不再需要按照前端语言格式做多语言控制
2. 前端可以灵活控制是否显示错误信息
3. 支持自定义错误处理函数
4. 提供国际化错误信息翻译

## 使用方法

### 1. 基本用法（使用默认错误处理）

```javascript
// 使用带错误处理的方法，会自动显示国际化的错误信息
try {
  const response = await this.$api.postWithErrorHandler('/users/login', {
    username: this.username,
    password: this.password
  });
  // 处理成功响应
  console.log('登录成功:', response.data);
} catch (error) {
  // 错误已经被自动处理和显示，这里可以做额外的逻辑
  console.log('登录失败，但错误已显示给用户');
}
```

### 2. 指定错误回退键

```javascript
// 指定特定的国际化错误键作为回退
try {
  const response = await this.$api.postWithErrorHandler('/products', productData, {
    fallbackKey: 'product.error.createFailed'
  });
} catch (error) {
  // 错误处理
}
```

### 3. 自定义错误处理函数

```javascript
// 为单个请求提供自定义错误处理
try {
  const response = await this.$api.postWithErrorHandler('/sensitive-operation', data, {
    errorHandler: (error, fallbackKey) => {
      // 自定义错误处理逻辑
      console.log('自定义处理:', error.message);
      // 可以选择不显示错误，或显示自定义消息
      this.$messageHandler.showWarning('操作失败，请稍后重试', 'common.warning.retry');
    },
    fallbackKey: 'operation.error.failed'
  });
} catch (error) {
  // 额外处理
}
```

### 4. 静默处理（不显示错误）

```javascript
// 提供空的错误处理函数来静默处理错误
try {
  const response = await this.$api.getWithErrorHandler('/optional-data', {
    errorHandler: () => {
      // 什么都不做，静默处理错误
    }
  });
} catch (error) {
  // 可以在这里做自己的错误处理
  console.log('获取可选数据失败，但不影响主要功能');
}
```

### 5. 全局设置错误处理函数

```javascript
// 在 main.js 或其他初始化文件中设置全局错误处理
import api from './utils/api';

// 设置全局自定义错误处理
api.setErrorHandler((error, fallbackKey) => {
  // 全局自定义错误处理逻辑
  console.log('全局错误处理:', error);
  
  // 可以根据错误类型做不同处理
  if (error.message.includes('网络')) {
    // 网络错误的特殊处理
    ErrorHandler.showError('网络连接异常，请检查网络设置', 'common.error.network');
  } else {
    // 其他错误使用默认处理
    ErrorHandler.showError(error, fallbackKey);
  }
});

// 重置为默认错误处理
api.resetErrorHandler();
```

### 6. 可用的方法

- `api.postWithErrorHandler(url, data, options)`
- `api.getWithErrorHandler(url, options)`
- `api.putWithErrorHandler(url, data, options)`
- `api.deleteWithErrorHandler(url, options)`

### 7. 选项参数

```javascript
const options = {
  errorHandler: Function,  // 自定义错误处理函数
  fallbackKey: String,     // 国际化错误键
  // ...其他 axios 选项
};
```

## 迁移指南

### 从旧的 API 调用迁移

**旧方式：**
```javascript
try {
  const response = await this.$api.post('/users/login', data);
  // 成功处理
} catch (error) {
  console.error('登录失败:', error);
  this.$messageHandler.showError(error, 'login.error.loginFailed');
}
```

**新方式：**
```javascript
try {
  const response = await this.$api.postWithErrorHandler('/users/login', data, {
    fallbackKey: 'login.error.loginFailed'
  });
  // 成功处理
} catch (error) {
  // 错误已自动处理，这里只需要做业务逻辑
}
```

## 优势

1. **解耦错误处理**：后端只需要返回错误信息，不需要考虑前端的语言设置
2. **灵活的错误控制**：前端可以选择显示、隐藏或自定义错误处理
3. **国际化支持**：自动将后端错误信息翻译为用户语言
4. **一致的用户体验**：统一的错误显示样式和交互
5. **更好的代码维护性**：减少重复的错误处理代码

## 注意事项

1. 新的错误处理方法会自动处理和显示错误，但仍然会抛出错误供调用方进一步处理
2. 如果不想显示错误，请提供空的 `errorHandler` 函数
3. 原有的 `api.post`、`api.get` 等方法仍然可用，但不会自动处理错误显示
4. 建议逐步迁移到新的错误处理方式，以获得更好的用户体验