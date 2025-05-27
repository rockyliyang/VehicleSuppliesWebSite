# 支付系统配置指南

## 环境变量设置

系统需要两个环境配置文件: `.env.development` 和 `.env.production`，分别用于开发和生产环境。
这些文件需要放置在后端的根目录下（即 `backend/` 文件夹）。

### 开发环境配置 (.env.development)

复制以下内容到 `backend/.env.development` 文件:

```
# 后端服务配置
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_for_development
CORS_ORIGIN=http://localhost:3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vehicle_supplies_dev
DB_USER=root
DB_PASSWORD=password

# 前端URL（用于PayPal回调）
FRONTEND_URL=http://localhost:3000

# PayPal配置
PAYPAL_CLIENT_ID=test
PAYPAL_SECRET=test
PAYPAL_CURRENCY=USD
PAYPAL_SCRIPT_URL=https://www.paypal.com/sdk/js
PAYPAL_INTENT=capture
PAYPAL_ENABLE_FUNDING=paylater,card
PAYPAL_DISABLE_FUNDING=
PAYPAL_COMPONENTS=buttons,funding-eligibility
PAYPAL_API_URL=https://api-m.sandbox.paypal.com

# 支付宝配置
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_alipay_private_key
ALIPAY_PUBLIC_KEY=your_alipay_public_key
ALIPAY_GATEWAY=https://openapi.alipaydev.com/gateway.do

# 微信支付配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_MCH_ID=your_wechat_mch_id
WECHAT_API_KEY=your_wechat_api_key
WECHAT_NOTIFY_URL=http://localhost:5000/api/payment/wechat/notify
```

### 生产环境配置 (.env.production)

复制以下内容到 `backend/.env.production` 文件:

```
# 后端服务配置
PORT=5000
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_key_for_production
CORS_ORIGIN=https://your-production-domain.com

# 数据库配置
DB_HOST=production_db_host
DB_PORT=3306
DB_NAME=vehicle_supplies_prod
DB_USER=db_user
DB_PASSWORD=secure_password

# 前端URL（用于PayPal回调）
FRONTEND_URL=https://your-production-domain.com

# PayPal配置
PAYPAL_CLIENT_ID=your_live_paypal_client_id
PAYPAL_SECRET=your_live_paypal_secret
PAYPAL_CURRENCY=USD
PAYPAL_SCRIPT_URL=https://www.paypal.com/sdk/js
PAYPAL_INTENT=capture
PAYPAL_ENABLE_FUNDING=paylater,card
PAYPAL_DISABLE_FUNDING=
PAYPAL_COMPONENTS=buttons,funding-eligibility
PAYPAL_API_URL=https://api-m.paypal.com

# 支付宝配置
ALIPAY_APP_ID=your_live_alipay_app_id
ALIPAY_PRIVATE_KEY=your_live_alipay_private_key
ALIPAY_PUBLIC_KEY=your_live_alipay_public_key
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do

# 微信支付配置
WECHAT_APP_ID=your_live_wechat_app_id
WECHAT_MCH_ID=your_live_wechat_mch_id
WECHAT_API_KEY=your_live_wechat_api_key
WECHAT_NOTIFY_URL=https://your-production-domain.com/api/payment/wechat/notify
```

## 重要提示

1. 请确保将示例中的占位符替换为实际的值
2. 生产环境的密钥和凭据必须妥善保存，不要提交到版本控制系统中
3. `FRONTEND_URL` 配置对于PayPal回调至关重要，必须设置为前端应用的实际URL
4. 如果没有实际的PayPal开发者账号，可以使用PayPal沙盒账号进行测试

## 问题排查

如果PayPal按钮未正确显示，或支付流程中出现错误：

1. 检查浏览器控制台是否有错误信息
2. 确认环境变量已正确设置，特别是 `FRONTEND_URL` 和 PayPal 凭据
3. 确认前端PayPal按钮的配置中 `enableFunding` 参数设置为 `paylater,card`

### 常见 PayPal 错误与解决方案

#### 1. 支付选项未全部显示（如缺少Pay Later选项）
问题原因：
- 地区限制或 SDK 配置不正确
- 某些选项在当前国家/货币不可用

解决方案：
- 在 SDK 链接中设置 `buyer-country=US` 以启用所有支付方式
- 使用 `label: 'pay'` 而不是 `label: 'paypal'` 显示更多选项
- 确保 `enableFunding` 参数包含 `paylater,card`

#### 2. 点击PayPal按钮后出现 "No ack for postMessage" 错误
问题原因：
- 跨域通信问题
- PayPal 弹窗被拦截
- iframe 通信被浏览器安全策略限制

解决方案：
- 为 PayPal SDK 脚本添加 `crossOrigin="anonymous"` 属性
- 使用 `actions.order.capture()` 在前端完成捕获，避免后端跨域问题
- 确保网站没有添加可能干扰 iframe 通信的安全头部

#### 3. PayPal SDK 加载失败
问题原因：
- 脚本 URL 无效或网络问题
- 客户端 ID 不正确

解决方案：
- 使用正确的 SDK URL: `https://www.paypal.com/sdk/js`
- 检查沙箱模式下的客户端 ID 是否有效
- 在加载 SDK 时添加错误处理并重试
#### 4. Paypal 后端SDK
Paypal 后端应该使用@paypal/paypal-server-sdk，而不是使用@paypal/checkout-server-sdk

## PayPal 最佳实践
- 使用前端 capture 而不是后端 capture 可以避免很多跨域通信问题
- 添加 `data-namespace` 属性以避免全局命名冲突
- 使用 `setTimeout` 确保 SDK 完全加载后再渲染按钮
- 尽量使用简单的按钮样式配置，避免不必要的样式参数

## PayPal 集成实现对比

### Checkout.vue vs Checkout3.vue

#### Checkout.vue 实现
- 直接在 Vue 组件中加载 PayPal SDK
- 缺少完整的消息处理机制，特别是对 PayPal 的 `postMessage` 请求的确认
- 在组件卸载时可能存在资源清理不完整的问题
- 容易受到 Vue 生命周期的干扰，导致 SDK 操作异常

#### Checkout3.vue 实现
- 实现了完整的消息处理机制，包括对 `getPageUrl` 和 `get(__confirm_paypal_payload__)` 请求的确认
- 添加了 Content-Security-Policy (CSP) meta 标签和 `crossOrigin="anonymous"` 属性以确保安全的跨域通信
- 实现了全局错误处理、详细的调试日志和 SDK 加载超时处理
- 在组件挂载和卸载时正确管理监听器和 SDK 资源
- 提供了订单摘要、PayPal 按钮容器、错误消息显示和调试日志区域等完整的 UI 组件

#### CheckoutV2.vue 实现
- 通过重定向到独立的 `paypal-checkout.html` 页面处理支付
- 避免了在 Vue 组件中直接加载 SDK 的问题
- 通过 URL 参数传递订单详情
- 虽然避免了 Vue 生命周期的干扰，但用户体验不如直接集成方案

### 浏览器状态问题

在同一浏览器窗口中，如果 `Checkout.vue` 出现错误后访问 `Checkout3.vue` 也会失败，这是由于：
- PayPal SDK 的全局状态持续存在
- 错误状态未被正确清理
- 浏览器缓存了相关资源

解决方案：
- 重新打开浏览器窗口可以清除这些状态
- 在组件卸载时确保完全清理 SDK 资源
- 实现更完善的错误恢复机制

### 最终建议

推荐使用 `Checkout3.vue` 的实现方案，因为它：
1. 提供了最完整的消息处理和确认机制
2. 实现了健壮的错误处理和资源管理
3. 保持了良好的用户体验
4. 提供了完整的调试支持

在实现 PayPal 集成时，应特别注意：
1. 正确处理所有 `postMessage` 请求的确认
2. 实现完整的资源清理机制
3. 添加必要的安全配置
4. 提供充分的错误处理和调试支持