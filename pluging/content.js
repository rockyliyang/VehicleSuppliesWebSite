
class Product1688Extractor {
  constructor() {
    this.init();
  }

  init() {
    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'extractProduct') {
        this.extractProductInfo()
          .then(data => sendResponse({ success: true, data }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // 保持消息通道开放
      }
    });
    
    // 检查并创建1688推荐的chromePlugin容器
    //this.ensureChromePluginContainer();
    
    console.log('1688产品提取器已加载');
  }

  // 确保chromePlugin容器存在，遵循1688网站建议
  ensureChromePluginContainer() {
    // 检查是否已存在chromePlugin容器
    let chromePluginContainer = document.getElementById('chromePlugin');
    
    if (!chromePluginContainer) {
      // 创建chromePlugin容器
      chromePluginContainer = document.createElement('div');
      chromePluginContainer.id = 'chromePlugin';
      chromePluginContainer.style.cssText = `
        position: relative;
        z-index: 1000;
        pointer-events: none;
      `;
      
      // 尝试找到合适的插入位置
      const insertionPoint = this.findInsertionPoint();
      if (insertionPoint) {
        insertionPoint.appendChild(chromePluginContainer);
        console.log('已创建chromePlugin容器，遵循1688网站建议');
      } else {
        // 如果找不到合适位置，插入到body
        document.body.appendChild(chromePluginContainer);
        console.log('已在body中创建chromePlugin容器');
      }
    }
  }

  // 找到合适的插入位置，避免SKU面板
  findInsertionPoint() {
    // 优先查找1688页面的特定容器
    const selectors = [
      '#screen',           // 1688详情页主容器
      '#recyclerview',     // 1688列表页容器
      '.layout-right',     // 右侧布局容器
      '.detail-main',      // 详情主容器
      '.offer-detail',     // 商品详情容器
      'main',              // 主内容区
      '.container'         // 通用容器
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }
    
    return null;
  }

  // 提取产品信息
  async extractProductInfo() {
    try {
      console.log('开始提取产品信息...', window.location.href);
      
      // 提取基本信息并记录调试信息
      const title = this.extractTitle();
      console.log('提取到的标题:', title);
      
      const price = this.extractPrice();
      console.log('提取到的价格:', price);
      
      const productId = this.extractProductId();
      console.log('提取到的产品ID:', productId);
      
      const mainImage = this.extractMainImage();
      console.log('提取到的主图:', mainImage);
      
      const carouselImages = this.extractCarouselImages();
      console.log('提取到的轮播图数量:', carouselImages.length, carouselImages);
      
      const productData = {
        // 基本信息
        title: title,
        price: price,
        productId: productId,
        url: window.location.href,
        
        // 供应商信息
        supplierName: this.extractSupplierName(),
        supplierLocation: this.extractSupplierLocation(),
        
        // 产品详情
        description: this.extractDescription(),
        specifications: this.extractSpecifications(),
        
        // 图片信息
        mainImage: mainImage,
        carouselImages: carouselImages,
        detailImages: await this.extractDetailImages(),
        
        // 其他信息
        minOrderQuantity: this.extractMinOrderQuantity(),
        unit: this.extractUnit(),
        category: this.extractCategory(),
        
        // 提取时间
        extractedAt: new Date().toISOString()
      };
      
      console.log('产品信息提取完成:', productData);
      return productData;
    } catch (error) {
      console.error('提取产品信息失败:', error);
      throw error;
    }
  }

  // 提取产品标题
  extractTitle() {
    console.log('开始提取标题...');
    
    // 现代1688页面的标题选择器
    const selectors = [
      // 新版1688页面结构
      '[data-testid="offer-title"]',
      '.offer-title',
      '.d-title',
      '.detail-hd-title',
      '.mod-detail-title h1',
      '.detail-title h1',
      '.offer-title h1',
      '.product-title',
      'h1[class*="title"]',
      '.main-title',
      '[data-role="title"]',
      'h1[data-title]',
      '.detail-title',
      // 通用标题选择器
      'h1',
      // 从JSON-LD结构化数据中提取
      'script[type="application/ld+json"]'
    ];
    
    // 首先尝试从DOM元素中提取
    console.log('尝试使用选择器提取标题...');
    for (const selector of selectors) {
      if (selector === 'script[type="application/ld+json"]') {
        // 尝试从结构化数据中提取
        console.log('尝试从JSON-LD提取标题...');
        const scripts = document.querySelectorAll(selector);
        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent);
            if (data.name) {
              console.log('从JSON-LD提取到标题:', data.name);
              return data.name.trim();
            }
          } catch (e) {
            console.log('JSON-LD解析失败:', e);
          }
        }
      } else {
        const element = document.querySelector(selector);
        if (element && element.textContent?.trim()) {
          const title = element.textContent.trim() || element.getAttribute('data-title')?.trim();
          console.log(`从选择器 ${selector} 提取到标题:`, title);
          return title;
        }
      }
    }
    
    // 最后从页面标题中提取
    console.log('尝试从页面标题提取...');
    const pageTitle = document.title;
    console.log('页面标题:', pageTitle);
    const title = pageTitle.split('-')[0]?.trim() || pageTitle.split('_')[0]?.trim();
    console.log('从页面标题提取到:', title);
    return title || '未知产品';
  }

  // 提取价格信息
  extractPrice() {
    console.log('开始提取价格...');
    
    // 现代1688页面的价格选择器
    const selectors = [
      // 新版1688页面结构
      '[data-testid="offer-price"]',
      '.offer-price',
      '.d-price',
      '.detail-price .price',
      '.price-range',
      '.mod-detail-price .price',
      '.price-now',
      '.unit-price',
      '[class*="price"]',
      '[data-role="price"]',
      '.offer-price .price',
      // 价格区间选择器
      '.price-original',
      '.price-current',
      '.batch-price'
    ];
    
    // 首先尝试从DOM元素中提取
    console.log('尝试使用选择器提取价格...');
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        const priceText = element.textContent.trim();
        console.log(`找到价格元素 ${selector}:`, element);
        console.log(`价格文本:`, priceText);
        // 检查是否包含价格标识符
        if (priceText.match(/[¥￥$]|元|价格|起批/) || priceText.match(/\d+\.?\d*/)) {
          console.log(`从选择器 ${selector} 提取到价格:`, priceText);
          return priceText;
        }
      }
    }
    
    // 尝试从页面中查找包含数字和货币符号的文本
    console.log('尝试从页面文本中提取价格...');
    const priceRegex = /[¥￥$]\s*\d+(?:\.\d+)?(?:\s*[-~]\s*[¥￥$]?\s*\d+(?:\.\d+)?)?/;
    const bodyText = document.body.textContent;
    const priceMatch = bodyText.match(priceRegex);
    if (priceMatch) {
      console.log('从页面文本提取到价格:', priceMatch[0]);
      return priceMatch[0].trim();
    }
    
    console.log('未能提取到价格，返回默认值');
    return '价格面议';
  }

  // 提取产品ID
  extractProductId() {
    // 从URL中提取
    const urlMatch = window.location.href.match(/offer\/(\d+)\.html/);
    if (urlMatch) {
      return urlMatch[1];
    }
    
    // 从页面元素中提取
    const selectors = [
      '[data-offer-id]',
      '[data-product-id]',
      '#offerId'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.getAttribute('data-offer-id') || 
               element.getAttribute('data-product-id') || 
               element.value;
      }
    }
    
    return null;
  }

  // 提取供应商名称
  extractSupplierName() {
    const selectors = [
      '.company-name a',
      '.company-name',
      '.supplier-name',
      '.company-info .name',
      '.mod-detail-supplier .company-name',
      '.seller-company-name',
      '[class*="company"][class*="name"]',
      '[data-role="company-name"]'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    
    return '未知供应商';
  }

  // 提取供应商位置
  extractSupplierLocation() {
    const selectors = [
      '.company-location',
      '.supplier-location',
      '.address',
      '[class*="location"]'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    
    return '未知地区';
  }

  // 提取产品描述
  extractDescription() {
    const selectors = [
      '.detail-desc',
      '.product-desc',
      '.description',
      '[class*="desc"]'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    
    return '';
  }

  // 提取产品规格
  extractSpecifications() {
    const specs = [];
    const selectors = [
      '.detail-attr-item',
      '.attr-list .attr-item',
      '.spec-list .spec-item',
      '.mod-detail-attributes .attr-item',
      '.product-attr .attr-item',
      '[data-role="attributes"] .attr-item'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const label = element.querySelector('.attr-name, .spec-name, .attr-key')?.textContent?.trim();
        const value = element.querySelector('.attr-value, .spec-value, .attr-val')?.textContent?.trim();
        
        if (label && value) {
          specs.push({ label, value });
        }
      });
    }
    
    return specs;
  }

  // 提取主图
  extractMainImage() {
    console.log('开始提取主图...');
    
    const selectors = [
      // 新版1688页面结构
      '[data-testid="main-image"] img',
      '.d-img img',
      '.detail-gallery .main-img img',
      '.offer-img .main-img img',
      '.gallery-main img',
      '.main-image img',
      '.mod-detail-gallery .main-pic img',
      '.preview-img img',
      '[data-role="main-image"] img',
      // 通用图片选择器
      '.product-image img',
      '.offer-image img',
      // 第一个产品图片
      '.product-gallery img:first-child',
      '.image-gallery img:first-child'
    ];
    
    console.log('尝试使用选择器提取主图...');
    for (const selector of selectors) {
      console.log(`尝试选择器: ${selector}`);
      const element = document.querySelector(selector);
      if (element) {
        console.log(`找到主图元素:`, element);
        const imageUrl = this.getImageUrl(element);
        console.log(`提取到的图片URL:`, imageUrl);
        if (imageUrl) {
          console.log(`成功从选择器 ${selector} 提取到主图:`, imageUrl);
          return imageUrl;
        }
      } else {
        console.log(`选择器 ${selector} 未找到元素`);
      }
    }
    
    console.log('未能提取到主图');
    return null;
  }

  // 提取轮播图
  extractCarouselImages() {
    console.log('开始提取轮播图...');
    
    const images = [];
    const selectors = [
      // 新版1688页面结构
      '[data-testid="image-gallery"] img',
      '.d-img .thumb-list img',
      '.detail-gallery .thumb-list img',
      '.offer-img .thumb-list img',
      '.gallery-thumbs img',
      '.image-thumbs img',
      '.mod-detail-gallery .thumb-list img',
      '.preview-list img',
      '[data-role="thumb-list"] img',
      // 简化的轮播图选择器
      '#gallery .od-gallery-preview img',
      '#gallery .od-gallery-list-wapper img',
      // 通用轮播图选择器
      '.image-gallery img',
      '.product-gallery img',
      '.offer-gallery img',
      '.carousel-images img',
      '.swiper-slide img'
    ];
    
    console.log('尝试使用选择器提取轮播图...');
    for (const selector of selectors) {
      console.log(`尝试轮播图选择器: ${selector}`);
      const elements = document.querySelectorAll(selector);
      console.log(`找到 ${elements.length} 个轮播图元素`);
      
      elements.forEach((img, index) => {
        console.log(`处理第 ${index + 1} 个图片元素:`, img);
        const url = this.getImageUrl(img);
        console.log(`提取到的图片URL:`, url);
        if (url && !images.includes(url)) {
          images.push(url);
          console.log(`添加图片到轮播图列表:`, url);
        }
      });
      
      // 如果找到了图片，就不再继续查找
      if (images.length > 0) {
        console.log(`从选择器 ${selector} 找到 ${images.length} 张轮播图，停止查找`);
        break;
      }
    }
    
    console.log(`轮播图提取完成，共找到 ${images.length} 张图片:`, images);
    return images;
  }

  // 查找所有带有html-description class的Shadow DOM容器
  findDetailShadowContainers() {
    const containers = [];
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
      if (element.shadowRoot && element.classList.contains('html-description')) {
        console.log('发现详情页Shadow DOM容器:', element.tagName, element.className);
        containers.push(element);
      }
    });
    
    return containers;
  }
  
  // 在指定的Shadow DOM容器中查找图片
  findImagesInShadowContainer(container, selectors) {
    const images = [];
    
    if (!container.shadowRoot) {
      return images;
    }
    
    console.log('在Shadow DOM容器中查找图片:', container.tagName);
    
    for (const selector of selectors) {
      try {
        const elements = container.shadowRoot.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`在Shadow DOM中通过选择器 ${selector} 找到 ${elements.length} 个图片元素`);
          elements.forEach((img, index) => {
            const url = this.getImageUrl(img);
            if (url && !images.includes(url)) {
              images.push(url);
              console.log(`从Shadow DOM添加图片 ${index + 1}:`, url);
            }
          });
        }
      } catch (error) {
        console.log(`Shadow DOM选择器 ${selector} 查询失败:`, error);
      }
    }
    
    return images;
  }

  // 提取详情页图片
  async extractDetailImages() {
    const images = [];
    console.log('开始提取详情图...');
    
    // 等待页面基本加载
    await this.waitForElement('body');
    
    // 等待一下确保Shadow DOM内容加载
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Shadow DOM中的图片选择器
    const shadowSelectors = [
      '#detail img', 
      '#detail1 img',
      'img[src*="1688"]',
      'img[src*="alicdn"]',
      '.detail-content img',
      '.offer-detail img',
      '.desc-content img',
      '.product-detail img',
      '.mod-detail-description img',
      '.detail-desc img',
      'img'
    ];
    
    // 普通DOM选择器作为备用
    const normalSelectors = [
      '.detail-content img',
      '.offer-detail img',
      '.desc-content img',
      '.product-detail img',
      '.mod-detail-description img',
      '.detail-desc img',
      '[data-role="detail-content"] img'
    ];
    
    // 1. 首先查找所有带有html-description class的Shadow DOM容器
    const shadowContainers = this.findDetailShadowContainers();
    console.log(`找到 ${shadowContainers.length} 个详情页Shadow DOM容器`);
    
    // 2. 在每个Shadow DOM容器中查找图片
    for (const container of shadowContainers) {
      const shadowImages = this.findImagesInShadowContainer(container, shadowSelectors);
      images.push(...shadowImages);
      
      if (shadowImages.length > 0) {
        console.log(`从Shadow DOM容器找到 ${shadowImages.length} 张图片`);
      }
    }
    
    // 3. 如果Shadow DOM中没有找到图片，尝试普通DOM
    if (images.length === 0) {
      console.log('Shadow DOM中未找到图片，尝试普通DOM选择器');
      
      for (const selector of normalSelectors) {
        console.log(`尝试普通DOM选择器: ${selector}`);
        const elements = document.querySelectorAll(selector);
        console.log(`找到 ${elements.length} 个元素`);
        
        elements.forEach((img, index) => {
          const url = this.getImageUrl(img);
          if (url && !images.includes(url)) {
            images.push(url);
            console.log(`从普通DOM添加图片 ${index + 1}:`, url);
          }
        });
        
        if (images.length > 0) {
          console.log(`从普通DOM选择器 ${selector} 找到 ${images.length} 张图片`);
          break;
        }
      }
    }
    
    console.log(`详情图提取完成，共找到 ${images.length} 张图片:`, images);
    return images;
  }

  // 提取最小起订量
  extractMinOrderQuantity() {
    const selectors = [
      '.min-order-quantity',
      '.min-order',
      '.mod-detail-purchasing .min-order',
      '.purchase-info .min-order',
      '[class*="min"][class*="order"]',
      '[data-role="min-order"]'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        const match = element.textContent.match(/\d+/);
        if (match) {
          return parseInt(match[0]);
        }
      }
    }
    
    return 1;
  }

  // 提取单位
  extractUnit() {
    const selectors = [
      '.unit',
      '.price-unit',
      '[class*="unit"]'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    
    return '件';
  }

  // 提取分类
  extractCategory() {
    const selectors = [
      '.breadcrumb a:last-child',
      '.category-path a:last-child',
      '.nav-path a:last-child',
      '.mod-detail-breadcrumb a:last-child',
      '.crumb a:last-child',
      '[data-role="breadcrumb"] a:last-child'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    
    return '未分类';
  }

  // 获取图片URL
  getImageUrl(imgElement) {
    if (!imgElement) {
      console.log('getImageUrl: 图片元素为空');
      return null;
    }
    
    console.log('getImageUrl: 处理图片元素', imgElement);
    
    // 尝试多个属性
    const src = imgElement.src;
    const dataSrc = imgElement.getAttribute('data-src');
    const dataOriginal = imgElement.getAttribute('data-original');
    const dataLazy = imgElement.getAttribute('data-lazy');
    
    console.log('getImageUrl: 图片属性检查', {
      src: src,
      'data-src': dataSrc,
      'data-original': dataOriginal,
      'data-lazy': dataLazy
    });
    
    const url = src || dataSrc || dataOriginal || dataLazy;
    
    if (url && url.startsWith('http')) {
      // 移除尺寸参数，获取原图
      const cleanUrl = url.replace(/_\d+x\d+\.(jpg|jpeg|png|gif)/, '.$1')
                          .replace(/\.\d+x\d+\.(jpg|jpeg|png|gif)/, '.$1');
      console.log('getImageUrl: 清理后的URL', cleanUrl);
      return cleanUrl;
    }
    
    console.log('getImageUrl: 未找到有效的图片URL');
    return null;
  }

  // 等待元素出现
  waitForElement(selector, timeout = 10000) {
    console.log(`等待元素: ${selector}`);
    return new Promise((resolve) => {
      const checkElement = () => {
        const element = document.querySelector(selector);
        console.log(`检查元素 ${selector}:`, element);
        if (element) {
          // 如果是detail1容器，还要检查其内容是否加载
          if (selector === '#detail1') {
            const hasContent = element.innerHTML.length > 100;
            const hasImages = element.querySelectorAll('img').length > 0;
            console.log(`detail1容器内容检查 - 内容长度: ${element.innerHTML.length}, 图片数量: ${element.querySelectorAll('img').length}`);
            if (hasContent || hasImages) {
              console.log('detail1容器内容已加载');
              resolve(element);
              return true;
            }
            return false;
          } else {
            resolve(element);
            return true;
          }
        }
        return false;
      };
      
      // 立即检查一次
      if (checkElement()) {
        return;
      }
      
      const observer = new MutationObserver(() => {
        if (checkElement()) {
          observer.disconnect();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // 超时处理
      setTimeout(() => {
        observer.disconnect();
        console.log(`等待元素 ${selector} 超时`);
        resolve(null);
      }, timeout);
    });
  }
}

// 初始化提取器
if (window.location.href.includes('detail.1688.com')) {
  new Product1688Extractor();
}