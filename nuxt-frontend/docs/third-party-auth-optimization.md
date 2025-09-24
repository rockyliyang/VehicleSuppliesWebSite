# 第三方登录脚本按需加载优化

## 概述

为了提高应用性能，特别是首页加载速度，我们将第三方登录脚本（Apple Sign In、Google Identity Services、Facebook SDK）从全局加载改为按需加载。这样可以避免在不需要登录功能的页面加载这些脚本，从而减少初始页面加载时间。

## 优化内容

### 1. 移除全局脚本加载

从 `nuxt.config.ts` 中移除了以下全局脚本：

```javascript
// 已移除的全局脚本
{ type: 'text/javascript', src: 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js' },
{ src: 'https://accounts.google.com/gsi/client', async: true, defer: true },
{ async: true, defer: true, crossorigin: 'anonymous', src: 'https://connect.facebook.net/en_US/sdk.js' }
```

### 2. 创建按需加载工具

创建了 `~/utils/thirdPartyAuth.js` 工具文件，提供以下功能：

- `loadAppleSignIn()` - 加载Apple Sign In脚本
- `loadGoogleSignIn()` - 加载Google Identity Services脚本
- `loadFacebookSDK()` - 加载Facebook SDK脚本
- `loadAllAuthScripts()` - 加载所有第三方登录脚本
- `isScriptLoaded(src)` - 检查脚本是否已加载
- `getLoadedScripts()` - 获取已加载的脚本列表

### 3. 更新登录组件

修改了 `LoginDialog.vue` 组件：

- 移除了 `mounted` 生命周期中的全局脚本初始化
- 更新了第三方登录方法，在点击登录按钮时按需加载相应脚本
- 添加了脚本加载状态处理和错误处理

## 使用方法

### 在组件中使用

```javascript
import { 
  loadAppleSignIn, 
  loadGoogleSignIn, 
  loadFacebookSDK 
} from '~/utils/thirdPartyAuth.js'

export default {
  methods: {
    async handleGoogleLogin() {
      try {
        // 按需加载Google脚本
        await loadGoogleSignIn()
        
        // 等待脚本加载完成
        if (typeof google !== 'undefined' && google.accounts) {
          // 执行Google登录逻辑
        }
      } catch (error) {
        console.error('Google脚本加载失败:', error)
      }
    }
  }
}
```

### 脚本加载流程

1. 用户点击第三方登录按钮
2. 检查相应脚本是否已加载
3. 如果未加载，动态加载脚本
4. 等待脚本加载完成
5. 初始化SDK（如需要）
6. 执行登录逻辑

## 性能优势

### 首页加载优化

- **减少初始加载时间**：首页不再加载第三方登录脚本
- **减少网络请求**：只在需要时才发起脚本请求
- **减少JavaScript执行时间**：避免不必要的SDK初始化

### 按需加载优势

- **智能缓存**：已加载的脚本会被缓存，避免重复加载
- **错误处理**：提供完善的加载失败处理机制
- **用户体验**：登录页面显示加载状态，提升用户体验

## 配置要求

确保在环境变量中正确配置第三方登录的客户端ID：

```env
# Apple Sign In
NUXT_PUBLIC_APPLE_CLIENT_ID=your_apple_client_id

# Google Identity Services
NUXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Facebook SDK
NUXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
```

## 注意事项

### 1. 脚本加载时间

- 第一次点击登录按钮时可能需要等待脚本加载
- 建议在登录按钮上显示加载状态

### 2. 错误处理

- 网络问题可能导致脚本加载失败
- 需要提供友好的错误提示和重试机制

### 3. 浏览器兼容性

- 确保目标浏览器支持动态脚本加载
- 考虑在旧浏览器中的降级处理

## 测试建议

### 1. 性能测试

- 使用浏览器开发者工具测量首页加载时间
- 对比优化前后的网络请求数量和大小

### 2. 功能测试

- 测试各个第三方登录功能是否正常工作
- 测试网络较慢情况下的用户体验
- 测试脚本加载失败时的错误处理

### 3. 用户体验测试

- 确保登录流程流畅
- 验证加载状态显示是否合适
- 测试错误提示是否友好

## 未来扩展

### 1. 预加载策略

可以考虑在用户悬停登录按钮时预加载脚本：

```javascript
// 鼠标悬停时预加载
@mouseenter="preloadGoogleScript"
```

### 2. 服务端渲染优化

考虑在服务端渲染时根据用户代理或其他条件决定是否预加载脚本。

### 3. 缓存策略

实现更智能的缓存策略，如本地存储脚本内容或使用Service Worker缓存。

## 总结

通过将第三方登录脚本改为按需加载，我们显著提高了应用的初始加载性能，特别是对于不需要登录功能的页面。这种优化在保持功能完整性的同时，提供了更好的用户体验。