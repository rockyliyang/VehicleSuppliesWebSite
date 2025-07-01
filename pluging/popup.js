// popup.js - 弹出窗口逻辑

class PopupManager {
  constructor() {
    this.apiUrl = '';
    this.apiToken = '';
    this.productData = null;
    this.init();
  }

  async init() {
    await this.loadConfig();
    this.bindEvents();
    await this.checkCurrentPage();
  }

  // 加载保存的配置
  async loadConfig() {
    try {
      const result = await chrome.storage.sync.get(['apiUrl', 'apiToken']);
      this.apiUrl = result.apiUrl || 'http://localhost:3000';
      this.apiToken = result.apiToken || '';
      
      document.getElementById('api-url').value = this.apiUrl;
      document.getElementById('api-token').value = this.apiToken;
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  }

  // 绑定事件
  bindEvents() {
    document.getElementById('save-config').addEventListener('click', () => this.saveConfig());
    document.getElementById('extract-product').addEventListener('click', () => this.extractProduct());
    document.getElementById('upload-product').addEventListener('click', () => this.uploadProduct());
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
      
      if (!this.apiUrl) {
        this.showStatus('请输入API地址', 'error');
        return;
      }
      
      await chrome.storage.sync.set({
        apiUrl: this.apiUrl,
        apiToken: this.apiToken
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
      
      if (!tab.url.includes('detail.1688.com')) {
        this.showStatus('请在1688产品详情页使用此插件', 'warning');
        return;
      }
      
      document.getElementById('product-section').style.display = 'block';
      this.showStatus('检测到1688产品页面，可以开始提取', 'success');
    } catch (error) {
      console.error('检查页面失败:', error);
      this.showStatus('检查页面失败', 'error');
    }
  }

  // 提取产品信息
  async extractProduct() {
    try {
      this.showLoading(true);
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 向content script发送提取命令
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractProduct'
      });
      
      if (response && response.success) {
        this.productData = response.data;
        this.displayProductInfo(this.productData);
        document.getElementById('upload-product').disabled = false;
        this.showStatus('产品信息提取成功', 'success');
      } else {
        this.showStatus(response?.error || '提取产品信息失败', 'error');
      }
    } catch (error) {
      console.error('提取产品失败:', error);
      this.showStatus('提取产品信息失败', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // 上传图片到服务器
  async uploadImages(imageUrls, imageType = 0, sessionId) {
    if (!imageUrls || imageUrls.length === 0) {
      return [];
    }
    
    const uploadedImages = [];
    if (!sessionId) {
      sessionId = `1688_import_${Date.now()}`;
    }
    
    for (const imageUrl of imageUrls) {
      try {
        // 1. 下载图片
        const imageResponse = await fetch(imageUrl, {
          mode: 'cors',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!imageResponse.ok) {
          console.warn('图片下载失败:', imageUrl, imageResponse.status);
          continue;
        }
        
        const blob = await imageResponse.blob();
        
        // 2. 创建FormData上传到后端
        const formData = new FormData();
        
        // 生成文件名
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split('/');
        const originalName = pathParts[pathParts.length - 1] || 'image.jpg';
        const fileName = `1688_${Date.now()}_${originalName}`;
        
        formData.append('images', blob, fileName);
        formData.append('image_type', imageType.toString());
        formData.append('product_id', 'undefined'); // 临时产品ID
        formData.append('session_id', sessionId);
        
        // 3. 上传到后端服务器
        const uploadResponse = await fetch(`${this.apiUrl}/api/product-images/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`
          },
          body: formData
        });
        
        const uploadResult = await uploadResponse.json();
        
        if (uploadResponse.ok && uploadResult.success) {
          const localUrl = uploadResult.data.images[0].path;
          uploadedImages.push(`${this.apiUrl}${localUrl}`);
        } else {
          console.warn('图片上传失败:', imageUrl, uploadResult.message);
          uploadedImages.push(imageUrl); // 保留原始URL作为备选
        }
      } catch (error) {
        console.warn('图片处理异常:', imageUrl, error);
        uploadedImages.push(imageUrl); // 保留原始URL作为备选
      }
    }
    
    return uploadedImages;
  }

  // 上传产品到系统
  async uploadProduct() {
    try {
      if (!this.productData) {
        this.showStatus('请先提取产品信息', 'error');
        return;
      }
      
      if (!this.apiUrl || !this.apiToken) {
        this.showStatus('请先配置API地址和令牌', 'error');
        return;
      }
      
      this.showLoading(true);
      this.showStatus('正在上传图片...', 'info');
      
      // 生成会话ID用于关联图片
      const sessionId = `1688_import_${Date.now()}`;
      
      // 上传图片到服务器
      const uploadedMainImage = this.productData.mainImage ? 
        (await this.uploadImages([this.productData.mainImage], 0, sessionId))[0] : null; // 主图类型为0
      
      const uploadedCarouselImages = await this.uploadImages(
        this.productData.carouselImages || [], 0, sessionId // 轮播图也是类型0
      );
      
      const uploadedDetailImages = await this.uploadImages(
        this.productData.detailImages || [], 1, sessionId // 详情图类型为1
      );
      
      // 准备上传数据（不包含图片URL，因为图片已经单独上传）
      const uploadData = {
        title: this.productData.title,
        price: this.productData.price,
        productId: this.productData.productId,
        url: this.productData.url,
        supplierName: this.productData.supplierName,
        supplierUrl: this.productData.supplierUrl,
        description: this.productData.description,
        minOrderQuantity: this.productData.minOrderQuantity,
        unit: this.productData.unit,
        category: this.productData.category,
        // 不包含图片URL，因为图片已经通过/api/product-images/upload上传
      };
      
      this.showStatus('正在上传产品...', 'info');
      
      const response = await fetch(`${this.apiUrl}/api/products/import-from-1688`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        body: JSON.stringify(uploadData)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // 关联图片到产品
        try {
          const assignResponse = await fetch(`${this.apiUrl}/api/product-images/assign`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiToken}`
            },
            body: JSON.stringify({
              product_id: result.data.id,
              session_id: sessionId
            })
          });
          
          const assignResult = await assignResponse.json();
          if (!assignResponse.ok || !assignResult.success) {
            console.warn('图片关联失败:', assignResult.message);
          }
        } catch (error) {
          console.warn('图片关联异常:', error);
        }
        
        this.showStatus('产品上传成功', 'success');
        document.getElementById('upload-product').disabled = true;
        
        // 显示上传结果
        this.displayUploadResult(result.data);
      } else {
        this.showStatus(result.message || '上传失败', 'error');
      }
    } catch (error) {
      console.error('上传产品失败:', error);
      this.showStatus('上传产品失败: ' + error.message, 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // 显示产品信息预览// 显示产品信息
  displayProductInfo(product) {
    console.log('🔍 开始显示产品信息预览:', product);
    
    // 保存当前产品数据
    this.currentProductData = product;
    
    const previewDiv = document.getElementById('product-preview');
    if (!previewDiv) {
      console.error('找不到product-preview元素');
      return;
    }
    
    console.log('显示预览区域');
    previewDiv.style.display = 'block';
    
    // 更新基本信息
    this.updatePreviewField('preview-title', product.title);
    this.updatePreviewField('preview-product-id', product.productId);
    // 处理价格字段，避免重复¥符号
    let priceText = '';
    if (product.price) {
      const priceStr = String(product.price);
      priceText = priceStr.startsWith('¥') ? priceStr : `¥${priceStr}`;
    }
    this.updatePreviewField('preview-price', priceText || null);
    this.updatePreviewField('preview-min-order', product.minOrderQuantity);
    this.updatePreviewField('preview-unit', product.unit);
    
    // 更新供应商信息
    this.updatePreviewField('preview-supplier', product.supplierName);
    this.updatePreviewField('preview-location', product.supplierLocation);
    
    // 更新图片信息
    this.updateImagePreview('preview-main-image', product.mainImage, 'single');
    this.updateImagePreview('preview-carousel-images', product.carouselImages, 'gallery');
    this.updateImagePreview('preview-detail-images', product.detailImages, 'gallery');
    
    // 更新图片计数
    document.getElementById('carousel-count').textContent = product.carouselImages?.length || 0;
    document.getElementById('detail-count').textContent = product.detailImages?.length || 0;
    
    // 更新其他信息
    this.updatePreviewField('preview-category', product.category);
    this.updatePreviewField('preview-description', product.description, true);
    this.updatePreviewField('preview-specifications', product.specifications, true);
    
    // 更新提取状态统计
    this.updateExtractionStats(product);
  }
  
  // 更新预览字段
  updatePreviewField(elementId, value, isLongText = false) {
    const element = document.getElementById(elementId);
    if (element) {
      // 确保value是字符串类型
      const stringValue = value != null ? String(value) : '';
      if (stringValue && stringValue.trim() !== '') {
        element.textContent = isLongText ? this.truncateText(stringValue, 200) : stringValue;
        element.title = isLongText ? stringValue : '';
        element.style.color = '#212529';
        console.log(`✅ 更新字段 ${elementId}:`, stringValue);
      } else {
        element.textContent = '-';
        element.style.color = '#6c757d';
        console.log(`⚠️ 字段 ${elementId} 为空，设置为 -`);
      }
    } else {
      console.error(`找不到元素: ${elementId}`);
    }
  }
  
  // 更新图片预览
  updateImagePreview(elementId, images, type) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    if (type === 'single') {
      // 单张图片（主图）
      if (images && images.trim() !== '') {
        container.innerHTML = `<img src="${images}" alt="主图" title="点击查看大图" class="preview-image" data-image="${images}">`;
      } else {
        container.innerHTML = '<div class="no-image">未提取到主图</div>';
      }
    } else {
      // 图片画廊（轮播图、详情图）
      if (images && images.length > 0) {
        const imageHtml = images.map((img, index) => 
          `<img src="${img}" alt="图片${index + 1}" title="点击查看大图" class="preview-image" data-image="${img}">` 
        ).join('');
        container.innerHTML = imageHtml;
      } else {
        const noImageText = elementId.includes('carousel') ? '未提取到轮播图' : '未提取到详情图';
        container.innerHTML = `<div class="no-image">${noImageText}</div>`;
      }
    }
  }
  
  // 更新提取状态统计
  updateExtractionStats(product) {
    const fields = [
      product.title,
      product.productId,
      product.price,
      product.minOrderQuantity,
      product.unit,
      product.supplierName,
      product.supplierLocation,
      product.mainImage,
      product.carouselImages?.length > 0 ? 'has_images' : null,
      product.detailImages?.length > 0 ? 'has_images' : null,
      product.category,
      product.description,
      product.specifications
    ];
    
    const successCount = fields.filter(field => field && field.toString().trim() !== '').length;
    const totalCount = fields.length;
    const failedCount = totalCount - successCount;
    const completionRate = Math.round((successCount / totalCount) * 100);
    
    document.getElementById('success-count').textContent = successCount;
    document.getElementById('failed-count').textContent = failedCount;
    document.getElementById('completion-rate').textContent = `${completionRate}%`;
  }
  
  // 截断长文本
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // 显示上传结果
  displayUploadResult(result) {
    const uploadResultDiv = document.getElementById('upload-result');
    
    // 更新上传结果信息
    document.getElementById('result-product-id').textContent = result.id || '-';
    document.getElementById('result-product-code').textContent = result.product_code || '-';
    document.getElementById('result-price').textContent = result.price ? `¥${result.price}` : '-';
    document.getElementById('result-stock').textContent = result.stock || '-';
    
    // 显示上传结果区域
    uploadResultDiv.classList.add('show');
    uploadResultDiv.style.display = 'block';
  }

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
    document.getElementById('upload-product').disabled = show || !this.productData;
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
  
  // 绑定独立窗口按钮事件
  const openIndependentWindowBtn = document.getElementById('open-independent-window');
  if (openIndependentWindowBtn) {
    openIndependentWindowBtn.onclick = function() {
      const popupManager = window.popupManagerInstance;
      if (popupManager) {
        popupManager.openIndependentWindow();
      }
    };
  }
  
  // 添加图片点击事件委托
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('preview-image')) {
      const imageUrl = event.target.getAttribute('data-image');
      if (imageUrl) {
        showImageModal(imageUrl);
      }
    }
  });
});