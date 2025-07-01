# 1688产品导入插件故障排除指南

## 当前修复的问题

### 问题描述
错误信息：`Could not establish connection. Receiving end does not exist.`

### 问题原因
1. `manifest.json` 中存在重复和错误的 `content_scripts` 配置
2. 第二个配置项包含无效的匹配模式 `"\u003Call_urls>"`
3. 导致 content script 无法正确注入到1688页面

### 修复内容
1. **清理了重复的 content_scripts 配置**
2. **移除了无效的匹配模式**
3. **简化为单一、正确的配置**

修复后的配置：
```json
"content_scripts": [
  {
    "matches": [
      "https://detail.1688.com/*"
    ],
    "js": [
      "content.js"
    ],
    "css": [
      "content.css"
    ],
    "run_at": "document_end"
  }
]
```

## 测试步骤

### 1. 重新加载插件
1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 找到 "1688产品导入助手" 插件
4. 点击刷新按钮 🔄 重新加载插件

### 2. 测试功能
1. 访问任意1688产品详情页面（如：`https://detail.1688.com/offer/xxx.html`）
2. 点击浏览器工具栏中的插件图标
3. 在弹出窗口中点击 "提取产品信息" 按钮
4. 确认不再出现连接错误

### 3. 验证成功标志
- ✅ 点击 "提取产品信息" 后显示加载动画
- ✅ 成功提取产品信息并显示在弹窗中
- ✅ "上传到系统" 按钮变为可用状态
- ✅ 控制台不再显示连接错误

## 常见问题

### Q: 重新加载插件后仍然报错？
A: 
1. 确保完全关闭并重新打开1688页面
2. 检查浏览器控制台是否有其他错误信息
3. 确认插件权限已正确授予

### Q: 插件图标显示但点击无反应？
A:
1. 检查 `popup.html` 和 `popup.js` 文件是否存在
2. 查看浏览器控制台的错误信息
3. 确认所有文件路径正确

### Q: 提取信息成功但上传失败？
A:
1. 检查后端服务是否正常运行
2. 确认API接口地址配置正确
3. 查看网络请求是否被阻止

## 技术说明

### Content Script 注入机制
- Chrome扩展通过 `content_scripts` 配置将脚本注入到匹配的网页中
- `matches` 字段定义了脚本注入的URL模式
- `run_at: "document_end"` 确保在DOM加载完成后执行

### 消息通信机制
- Popup 通过 `chrome.tabs.sendMessage` 向 content script 发送消息
- Content script 通过 `chrome.runtime.onMessage` 监听消息
- 使用 `sendResponse` 回调返回处理结果

---

**注意**: 如果问题仍然存在，请检查浏览器控制台的详细错误信息，并确保所有文件完整且语法正确。