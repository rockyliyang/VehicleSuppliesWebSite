// popup.js - 弹出窗口逻辑

class PopupManager {
  constructor() {
    this.apiUrl = '';
    this.apiToken = '';
    this.geminiApiKey = '';
    this.geminiProcessImage = false;
    this.productData = null;
    this.supportedSites = [
      {
        name: '1688',
        detailPagePattern: 'detail.1688.com',
        generalPattern: '1688.com',
        displayName: '1688产品页面'
      },
     {
        name: 'alibaba international',
        detailPagePattern: 'www.alibaba.com/product-detail',
        generalPattern: 'alibaba.com',
        displayName: 'alibaba国际站产品页面'
      }
      // 可以在这里添加更多支持的网站
      // {
      //   name: 'taobao',
      //   detailPagePattern: 'detail.tmall.com',
      //   generalPattern: 'tmall.com',
      //   displayName: '天猫产品页面'
      // }
    ];
    this.init();
  }

  async init() {
    await this.loadConfig();
    this.bindEvents();
    await this.checkCurrentPage();
  }

  // 检查URL是否匹配支持的网站
  isSupportedSite(url, checkType = 'general') {
    return this.supportedSites.find(site => {
      const pattern = checkType === 'detail' ? site.detailPagePattern : site.generalPattern;
      return url.includes(pattern);
    });
  }

  // 获取当前网站的显示名称
  getCurrentSiteDisplayName(url) {
    const site = this.isSupportedSite(url);
    return site ? site.displayName : '未知网站';
  }

  // 添加新的支持网站
  addSupportedSite(siteConfig) {
    // 检查是否已存在
    const exists = this.supportedSites.find(site => site.name === siteConfig.name);
    if (!exists) {
      this.supportedSites.push(siteConfig);
      console.log(`✅ 已添加支持网站: ${siteConfig.displayName}`);
    } else {
      console.log(`⚠️ 网站 ${siteConfig.name} 已存在`);
    }
  }

  // 加载保存的配置
  async loadConfig() {
    try {
      const result = await chrome.storage.sync.get(['apiUrl', 'apiToken', 'geminiApiKey', 'geminiProcessImage']);
      this.apiUrl = result.apiUrl || 'http://localhost:3000';
      this.apiToken = result.apiToken || '';
      this.geminiApiKey = result.geminiApiKey || '';
      this.geminiProcessImage = result.geminiProcessImage || false;
      
      document.getElementById('api-url').value = this.apiUrl;
      document.getElementById('api-token').value = this.apiToken;
      document.getElementById('gemini-api-key').value = this.geminiApiKey;
      document.getElementById('gemini-process-image').checked = this.geminiProcessImage;
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  }

  // 绑定事件
  bindEvents() {
    document.getElementById('save-config').addEventListener('click', () => this.saveConfig());
    document.getElementById('extract-product').addEventListener('click', () => this.openPreviewWindow());
    // 上传产品按钮事件已迁移到preview-window.js
  }

  // 打开独立预览窗口
  openIndependentWindow() {
    if (!this.currentProductData) {
      this.showStatus('没有可预览的产品数据', 'error');
      return;
    }

    try {
      // 将产品数据保存到localStorage，供新窗口使用
      localStorage.setItem('previewProductData', JSON.stringify(this.currentProductData));
      
      // 创建新的浏览器窗口
      chrome.windows.create({
        url: chrome.runtime.getURL('preview-window.html'),
        type: 'popup',
        width: 1200,
        height: 800,
        focused: true
      }, (window) => {
        if (chrome.runtime.lastError) {
          console.error('创建窗口失败:', chrome.runtime.lastError);
          this.showStatus('创建独立窗口失败', 'error');
        } else {
          console.log('✅ 独立预览窗口已打开');
          this.showStatus('独立预览窗口已打开', 'success');
        }
      });
    } catch (error) {
      console.error('打开独立窗口失败:', error);
      this.showStatus('打开独立窗口失败: ' + error.message, 'error');
    }
  }

  // 保存配置
  async saveConfig() {
    try {
      this.apiUrl = document.getElementById('api-url').value.trim();
      this.apiToken = document.getElementById('api-token').value.trim();
      this.geminiApiKey = document.getElementById('gemini-api-key').value.trim();
      this.geminiProcessImage = document.getElementById('gemini-process-image').checked;
      
      if (!this.apiUrl) {
        this.showStatus('请输入API地址', 'error');
        return;
      }
      
      await chrome.storage.sync.set({
        apiUrl: this.apiUrl,
        apiToken: this.apiToken,
        geminiApiKey: this.geminiApiKey,
        geminiProcessImage: this.geminiProcessImage
      });
      
      this.showStatus('配置保存成功', 'success');
    } catch (error) {
      console.error('保存配置失败:', error);
      this.showStatus('保存配置失败', 'error');
    }
  }

  // 检查当前页面
  async checkCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const supportedSite = this.isSupportedSite(tab.url, 'detail');
      if (!supportedSite) {
        const availableSites = this.supportedSites.map(site => site.displayName).join('、');
        this.showStatus(`请在支持的产品详情页使用此插件（支持：${availableSites}）`, 'warning');
        return;
      }
      
      document.getElementById('product-section').style.display = 'block';
      this.showStatus(`检测到${supportedSite.displayName}，可以开始提取`, 'success');
    } catch (error) {
      console.error('检查页面失败:', error);
      this.showStatus('检查页面失败', 'error');
    }
  }

  // 直接打开预览窗口
  async openPreviewWindow() {
    try {
      this.showLoading(true);
      this.showStatus('正在提取产品信息...', 'info');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const supportedSite = this.isSupportedSite(tab.url);
      if (!supportedSite) {
        const availableSites = this.supportedSites.map(site => site.displayName).join('、');
        this.showStatus(`请在支持的产品页面使用此插件（支持：${availableSites}）`, 'error');
        return;
      }
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractProduct'
      });
      
      if (response && response.success) {
        this.currentProductData = response.data;
        // 直接打开预览窗口
        this.openIndependentWindow();
        this.showStatus('正在打开预览窗口...', 'success');
      } else {
        this.showStatus(response?.message || '提取产品信息失败', 'error');
      }
    } catch (error) {
      console.error('提取产品信息失败:', error);
      this.showStatus('提取产品信息失败: ' + error.message, 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // 产品信息显示功能已迁移到preview-window.js

  // 上传结果显示功能已迁移到preview-window.js

  // 显示状态信息
  showStatus(message, type = 'success') {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type} show`;
    
    // 3秒后自动隐藏
    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 3000);
  }

  // 显示/隐藏加载状态
  showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
    document.getElementById('extract-product').disabled = show;
    // 上传按钮状态控制已迁移到preview-window.js
  }
}

// 图片模态框功能
function showImageModal(imageSrc) {
  const modal = document.getElementById('image-modal');
  const modalImage = document.getElementById('modal-image');
  
  modalImage.src = imageSrc;
  modal.style.display = 'block';
}

function hideImageModal() {
  const modal = document.getElementById('image-modal');
  modal.style.display = 'none';
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  window.popupManagerInstance = new PopupManager();
  
  // 绑定模态框关闭事件
  const modal = document.getElementById('image-modal');
  const closeBtn = document.querySelector('.close');
  
  // 点击关闭按钮
  if (closeBtn) {
    closeBtn.onclick = hideImageModal;
  }
  
  // 点击模态框背景
  if (modal) {
    modal.onclick = function(event) {
      if (event.target === modal) {
        hideImageModal();
      }
    };
  }
  
  // ESC键关闭
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      hideImageModal();
    }
  });
  
  // 独立窗口按钮事件已移除，现在通过extract-product按钮直接打开预览窗口
  
  // 添加图片点击事件委托
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('preview-image')) {
      const imageUrl = event.target.getAttribute('data-image');
      if (imageUrl) {
        showImageModal(imageUrl);
      }
    }
  });
  
  // 使用示例：添加新的支持网站
  // window.popupManagerInstance.addSupportedSite({
  //   name: 'taobao',
  //   detailPagePattern: 'item.taobao.com',
  //   generalPattern: 'taobao.com',
  //   displayName: '淘宝产品页面'
  // });
  // 
  // window.popupManagerInstance.addSupportedSite({
  //   name: 'tmall',
  //   detailPagePattern: 'detail.tmall.com',
  //   generalPattern: 'tmall.com',
  //   displayName: '天猫产品页面'
  // });
});

/*
使用说明：
1. 要添加新的支持网站，可以调用 addSupportedSite() 方法
2. 网站配置对象包含以下字段：
   - name: 网站标识符（唯一）
   - detailPagePattern: 产品详情页URL特征
   - generalPattern: 网站通用URL特征
   - displayName: 显示给用户的网站名称
3. 示例：支持淘宝
   popupManagerInstance.addSupportedSite({
     name: 'taobao',
     detailPagePattern: 'item.taobao.com',
     generalPattern: 'taobao.com',
     displayName: '淘宝产品页面'
   });
*/