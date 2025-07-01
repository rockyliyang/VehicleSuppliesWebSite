// background.js - 后台服务工作者

class BackgroundService {
  constructor() {
    this.init();
  }

  init() {
    // 监听插件安装
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstalled(details);
    });

    // 监听来自content script的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // 保持消息通道开放
    });

    // 监听标签页更新
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab);
    });

    console.log('1688产品导入助手后台服务已启动');
  }

  // 处理插件安装
  handleInstalled(details) {
    if (details.reason === 'install') {
      console.log('插件首次安装');
      this.setDefaultConfig();
    } else if (details.reason === 'update') {
      console.log('插件已更新');
    }
  }

  // 设置默认配置
  async setDefaultConfig() {
    try {
      await chrome.storage.sync.set({
        apiUrl: 'http://localhost:3000',
        apiToken: '',
        autoExtract: false,
        showNotifications: true
      });
      console.log('默认配置已设置');
    } catch (error) {
      console.error('设置默认配置失败:', error);
    }
  }

  // 处理消息
  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'uploadProduct':
          await this.uploadProduct(request.data, sendResponse);
          break;
        case 'downloadImage':
          // downloadImage功能已迁移到popup.js，不再使用background.js
          console.log('Background script received message:', request.action);
          sendResponse({ success: false, error: 'This functionality has been moved to popup.js' });
          break;
        case 'checkApiStatus':
          await this.checkApiStatus(sendResponse);
          break;
        case 'showNotification':
          this.showNotification(request.message, request.type);
          sendResponse({ success: true });
          break;
        default:
          sendResponse({ success: false, error: '未知操作' });
      }
    } catch (error) {
      console.error('处理消息失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 处理标签页更新
  handleTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('detail.1688.com')) {
      // 1688产品页面加载完成，可以进行一些初始化操作
      console.log('1688产品页面加载完成:', tab.url);
    }
  }

  // 上传产品到API
  async uploadProduct(productData, sendResponse) {
    try {
      const config = await chrome.storage.sync.get(['apiUrl', 'apiToken']);
      
      if (!config.apiUrl || !config.apiToken) {
        throw new Error('API配置不完整');
      }

      const response = await fetch(`${config.apiUrl}/api/products/import-from-1688`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiToken}`
        },
        body: JSON.stringify(productData)
      });

      const result = await response.json();

      if (response.ok) {
        sendResponse({ success: true, data: result });
        this.showNotification('产品上传成功', 'success');
      } else {
        throw new Error(result.message || '上传失败');
      }
    } catch (error) {
      console.error('上传产品失败:', error);
      sendResponse({ success: false, error: error.message });
      this.showNotification(`上传失败: ${error.message}`, 'error');
    }
  }

  // 下载图片并上传到服务器
  async downloadImage(imageUrl, config, sendResponse) {
    try {
      // 1. 从1688下载图片
      const response = await fetch(imageUrl, {
        mode: 'cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`图片下载失败: ${response.status}`);
      }

      const blob = await response.blob();
      
      // 2. 创建FormData上传到后端
      const formData = new FormData();
      
      // 生成文件名
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const originalName = pathParts[pathParts.length - 1] || 'image.jpg';
      const fileName = `1688_${Date.now()}_${originalName}`;
      
      formData.append('images', blob, fileName);
      formData.append('image_type', '0'); // 默认为主图类型
      formData.append('product_id', 'undefined'); // 临时产品ID
      formData.append('session_id', `1688_import_${Date.now()}`);
      
      // 3. 上传到后端服务器
      const uploadResponse = await fetch(`${config.apiUrl}/api/product-images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`
        },
        body: formData
      });
      
      const uploadResult = await uploadResponse.json();
      
      if (uploadResponse.ok && uploadResult.success) {
        const localUrl = uploadResult.data.images[0].path;
        sendResponse({ 
          success: true, 
          localUrl: `${config.apiUrl}${localUrl}`,
          originalUrl: imageUrl
        });
      } else {
        throw new Error(uploadResult.message || '图片上传失败');
      }
    } catch (error) {
      console.error('下载图片失败:', error);
      sendResponse({ 
        success: false, 
        error: error.message,
        originalUrl: imageUrl
      });
    }
  }

  // 检查API状态
  async checkApiStatus(sendResponse) {
    try {
      const config = await chrome.storage.sync.get(['apiUrl', 'apiToken']);
      
      if (!config.apiUrl) {
        throw new Error('API地址未配置');
      }

      const response = await fetch(`${config.apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Authorization': config.apiToken ? `Bearer ${config.apiToken}` : ''
        }
      });

      const result = await response.json();
      
      sendResponse({ 
        success: response.ok, 
        data: result,
        status: response.status
      });
    } catch (error) {
      console.error('检查API状态失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 显示通知
  async showNotification(message, type = 'info') {
    try {
      const config = await chrome.storage.sync.get(['showNotifications']);
      
      if (!config.showNotifications) {
        return;
      }

      const iconMap = {
        success: 'icons/icon48.png',
        error: 'icons/icon48.png',
        warning: 'icons/icon48.png',
        info: 'icons/icon48.png'
      };

      await chrome.notifications.create({
        type: 'basic',
        iconUrl: iconMap[type] || iconMap.info,
        title: '1688产品导入助手',
        message: message
      });
    } catch (error) {
      console.error('显示通知失败:', error);
    }
  }

  // 获取当前活动标签页
  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab;
    } catch (error) {
      console.error('获取当前标签页失败:', error);
      return null;
    }
  }

  // 注入脚本到标签页
  async injectScript(tabId, files) {
    try {
      for (const file of files) {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: [file]
        });
      }
    } catch (error) {
      console.error('注入脚本失败:', error);
    }
  }
}

// 初始化后台服务
new BackgroundService();