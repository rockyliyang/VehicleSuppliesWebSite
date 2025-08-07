# 代理配置指南

## 问题描述

在中国大陆等地区，由于网络限制，直接访问Google、Facebook等外部API可能会失败，出现以下错误：

```
Google login error: DOMException [AbortError]: This operation was aborted
```

这通常是由于网络连接超时或被阻断导致的。

## 解决方案

### 1. 配置代理服务器

在后端项目中，我们已经添加了代理支持。您需要在环境变量中配置代理服务器：

#### 方法一：通过 .env 文件配置

1. 复制 `.env.example` 文件为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 在 `.env` 文件中添加代理配置：
   ```bash
   # 代理配置
   HTTPS_PROXY=http://127.0.0.1:7890
   HTTP_PROXY=http://127.0.0.1:7890
   ```

#### 方法二：通过系统环境变量配置

**Windows (PowerShell):**
```powershell
$env:HTTPS_PROXY="http://127.0.0.1:7890"
$env:HTTP_PROXY="http://127.0.0.1:7890"
```

**Windows (CMD):**
```cmd
set HTTPS_PROXY=http://127.0.0.1:7890
set HTTP_PROXY=http://127.0.0.1:7890
```

**macOS/Linux:**
```bash
export HTTPS_PROXY=http://127.0.0.1:7890
export HTTP_PROXY=http://127.0.0.1:7890
```

### 2. 常见代理软件端口

| 代理软件 | 默认端口 | 配置示例 |
|---------|---------|----------|
| Clash | 7890 | `http://127.0.0.1:7890` |
| V2Ray | 1080 | `http://127.0.0.1:1080` |
| Shadowsocks | 1080 | `http://127.0.0.1:1080` |
| 企业代理 | 8080 | `http://proxy.company.com:8080` |

### 3. 验证配置

配置完成后，重启后端服务：

```bash
npm run dev
```

如果配置正确，您会在控制台看到类似的日志：

```
Using proxy: http://127.0.0.1:7890
Using proxy for Facebook API: http://127.0.0.1:7890
```

## 故障排除

### 1. 代理连接失败

**错误信息：**
```
connect ECONNREFUSED 127.0.0.1:7890
```

**解决方法：**
- 确认代理软件正在运行
- 检查代理端口是否正确
- 确认代理软件允许本地连接

### 2. 代理认证失败

**错误信息：**
```
Proxy authentication required
```

**解决方法：**
如果代理需要认证，请使用以下格式：
```bash
HTTPS_PROXY=http://username:password@127.0.0.1:7890
```

### 3. 仍然无法访问外部API

**可能原因：**
- 代理服务器本身无法访问目标网站
- 代理配置不正确
- 防火墙阻止连接

**解决方法：**
1. 在浏览器中测试代理是否能访问 Google
2. 检查代理软件的日志
3. 尝试不同的代理服务器或端口

### 4. 测试代理连接

您可以使用以下命令测试代理是否工作：

```bash
# 测试HTTP代理
curl -x http://127.0.0.1:7890 https://www.google.com

# 测试HTTPS代理
curl -x http://127.0.0.1:7890 https://graph.facebook.com
```

## 生产环境配置

在生产环境中，如果服务器位于需要代理的网络环境中，请：

1. 在服务器上配置系统级代理
2. 或在应用程序级别配置代理环境变量
3. 确保代理服务器的稳定性和安全性

## 安全注意事项

1. **不要在代码中硬编码代理配置**
2. **使用环境变量管理代理设置**
3. **在生产环境中使用安全的代理服务器**
4. **定期检查代理服务器的安全性**
5. **避免在日志中输出敏感的代理信息**

## 相关文件

- `backend/controllers/thirdPartyAuthController.js` - 第三方认证控制器（包含代理配置）
- `backend/.env.example` - 环境变量示例文件
- `backend/env.production.example` - 生产环境配置示例

## 技术实现

项目使用了以下技术来支持代理：

- **https-proxy-agent**: 为 fetch 请求提供代理支持
- **axios**: 内置代理支持，通过 `httpsAgent` 配置
- **环境变量**: 通过 `HTTPS_PROXY` 和 `HTTP_PROXY` 控制代理设置

代理配置会自动应用到：
- Google OAuth API 调用
- Facebook Graph API 调用
- 其他外部 HTTPS 请求

如果您在配置过程中遇到问题，请检查代理软件的文档或联系系统管理员。