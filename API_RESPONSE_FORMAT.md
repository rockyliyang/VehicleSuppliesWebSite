# API响应格式统一规范

## 概述

根据项目规则要求，所有后端接口都需要使用统一的响应格式：

```json
{
  "success": boolean,  // 请求是否成功
  "message": string,   // 响应消息
  "data": object       // 响应数据
}
```

## 后端实现

### 响应处理中间件

我们创建了一个统一的响应处理中间件 `responseHandler.js`，该中间件会自动将所有API响应转换为规定格式。中间件的主要功能：

1. 重写了 `res.json()` 和 `res.send()` 方法，确保所有响应都符合统一格式
2. 根据HTTP状态码自动设置 `success` 字段的值
3. 如果响应已经是标准格式，则不做修改直接返回

### 使用方法

后端开发人员可以按照以下方式返回数据：

```javascript
// 方式1：直接返回数据，中间件会自动包装为标准格式
res.json(data);

// 方式2：手动构造标准格式
res.json({
  success: true,
  message: '操作成功',
  data: data
});

// 错误处理
res.status(400).json({
  success: false,
  message: '参数错误',
  data: null
});
```

## 前端实现

### API工具

我们创建了一个统一的API请求工具 `api.js`，该工具基于axios，并添加了请求和响应拦截器，用于处理统一的请求和响应格式。

主要功能：

1. 自动添加认证token到请求头
2. 统一处理API响应格式
3. 自动处理错误消息显示
4. 处理401未授权等特殊情况

### 使用方法

前端开发人员应该使用 `$api` 替代直接使用 `axios` 发起请求：

```javascript
// 获取数据
async fetchData() {
  try {
    const res = await this.$api.get('endpoint');
    // res已经是处理过的标准格式，可以直接使用res.data获取数据
    this.dataList = res.data;
  } catch (error) {
    // 错误已经被拦截器处理，显示了错误消息，这里可以做额外处理
    console.error('获取数据失败');
  }
}

// 提交数据
async submitForm() {
  try {
    const res = await this.$api.post('endpoint', this.form);
    // 成功消息可以通过res.message获取
    this.$message.success(res.message);
    return res.data;
  } catch (error) {
    // 错误处理
    return null;
  }
}
```

## 注意事项

1. 所有接口都必须遵循统一的响应格式
2. 前端代码应该使用 `$api` 而不是直接使用 `axios`
3. 错误处理已经在拦截器中统一处理，但特殊情况下可以在catch中进行额外处理
4. 成功的响应可以直接使用 `res.data` 获取数据