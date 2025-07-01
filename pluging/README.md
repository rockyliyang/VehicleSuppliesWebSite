# 1688产品导入Chrome插件

这是一个用于从1688网站自动提取产品信息并上传到系统的Chrome浏览器插件。

## 功能特性

- 🔍 自动识别1688产品详情页
- 📦 一键提取产品信息（标题、价格、图片、规格等）
- 🚀 快速上传产品到系统
- 🔧 可配置API地址和访问令牌
- 📱 友好的用户界面
- 🔔 实时状态通知

## 安装方法

### 开发者模式安装

1. 打开Chrome浏览器
2. 在地址栏输入 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本插件的文件夹（pluging目录）
6. 插件安装完成

## 使用方法

### 1. 配置API设置

首次使用需要配置API连接：

1. 点击浏览器工具栏中的插件图标
2. 在弹出窗口中设置：
   - **API地址**：您的系统API地址（如：http://localhost:3000）
   - **访问令牌**：用于API认证的令牌
3. 点击"保存配置"

### 2. 提取产品信息

1. 访问任意1688产品详情页（如：https://detail.1688.com/offer/xxx.html）
2. 点击插件图标打开弹出窗口
3. 点击"提取产品信息"按钮
4. 插件会自动提取页面上的产品信息

### 3. 上传产品

1. 确认提取的产品信息无误
2. 点击"上传产品"按钮
3. 等待上传完成的通知

## 提取的信息包括

- ✅ 产品标题
- ✅ 产品价格
- ✅ 产品ID
- ✅ 产品URL
- ✅ 供应商名称
- ✅ 供应商位置
- ✅ 产品描述
- ✅ 产品规格
- ✅ 主图
- ✅ 轮播图
- ✅ 详情页图片
- ✅ 最小起订量
- ✅ 单位
- ✅ 产品分类

## 技术架构

### 文件结构

```
pluing/
├── manifest.json          # 插件配置文件
├── popup.html            # 弹出窗口界面
├── popup.js              # 弹出窗口逻辑
├── content.js            # 内容脚本（页面注入）
├── content.css           # 内容脚本样式
├── background.js         # 后台服务
├── inject.js             # 页面注入脚本
└── icons/                # 插件图标
```

### 核心组件

1. **Content Script** (`content.js`)
   - 注入到1688页面
   - 负责提取产品信息
   - 使用多种CSS选择器确保兼容性

2. **Popup Interface** (`popup.html` + `popup.js`)
   - 用户交互界面
   - API配置管理
   - 产品信息展示

3. **Background Service** (`background.js`)
   - 处理API请求
   - 管理插件配置
   - 显示通知

4. **Page Injection** (`inject.js`)
   - 访问页面JavaScript变量
   - 提取动态加载的数据

## API接口

插件会向配置的API地址发送POST请求：

```
POST /api/products/import-from-1688
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "产品标题",
  "price": "价格信息",
  "productId": "产品ID",
  "url": "产品链接",
  "supplier": {
    "name": "供应商名称",
    "location": "供应商位置"
  },
  "description": "产品描述",
  "specifications": [...],
  "images": {
    "main": "主图URL",
    "carousel": [...],
    "detail": [...]
  },
  "minOrderQuantity": 1,
  "unit": "件",
  "category": "产品分类"
}
```

## 故障排除

### 常见问题

1. **插件无法提取信息**
   - 确保在1688产品详情页使用
   - 等待页面完全加载后再操作
   - 检查浏览器控制台是否有错误信息

2. **上传失败**
   - 检查API地址是否正确
   - 确认访问令牌有效
   - 检查网络连接

3. **插件无法加载**
   - 确保开启了开发者模式
   - 检查插件文件完整性
   - 重新加载插件

### 调试方法

1. 打开Chrome开发者工具（F12）
2. 查看Console标签页的错误信息
3. 在Extensions页面点击插件的"检查视图"链接

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的产品信息提取
- 支持图片提取和上传
- 支持API配置管理

## 许可证

本项目采用MIT许可证。

## 贡献

欢迎提交Issue和Pull Request来改进这个插件。

## 联系方式

如有问题或建议，请通过以下方式联系：
- 项目Issues页面
- 邮箱：[您的邮箱]