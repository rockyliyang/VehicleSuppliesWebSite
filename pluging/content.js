
class ProductExtractor {
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
    
    // 检查并创建推荐的chromePlugin容器
    //this.ensureChromePluginContainer();
  }

  // 确保chromePlugin容器存在，提供插件运行环境
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
        console.log('已创建chromePlugin容器');
      } else {
        // 如果找不到合适位置，插入到body
        document.body.appendChild(chromePluginContainer);
        console.log('已在body中创建chromePlugin容器');
      }
    }
  }

  // 找到合适的插入位置，避免干扰页面布局
  findInsertionPoint() {
    console.log('查找插入点...');
    
    let selectors = [];
    
    if (window.location.href.includes('alibaba.com')) {
      // 阿里巴巴国际站容器选择器
      selectors = [
        '.product-detail',
        '.product-container',
        '.offer-container',
        '.pd-container',
        '.main-content',
        '.content-wrapper',
        '.detail-container',
        '.product-info',
        '.wrapper',
        '.container',
        '.content',
        '.main',
        'main',
        'body'
      ];
    } else {
      // 1688和其他网站的容器选择器
      selectors = [
        '#screen',           // 1688详情页主容器
        '#recyclerview',     // 1688列表页容器
        '.layout-right',     // 右侧布局容器
        '.detail-main',      // 详情主容器
        '.offer-detail',     // 商品详情容器
        '.product-detail',   // 产品详情容器
        '.main-content',     // 主内容区
        'main',              // HTML5主内容标签
        '.container',        // 通用容器
        '.wrapper'           // 包装容器
      ];
    }
    
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
      
      // 如果主图未提取到，使用轮播图的第一个非视频元素作为主图
      if (!productData.mainImage && productData.carouselImages && productData.carouselImages.length > 0) {
        for (const carouselImage of productData.carouselImages) {
          if (carouselImage && !this.isVideoUrl(carouselImage)) {
            productData.mainImage = carouselImage;
            console.log('使用轮播图作为主图:', carouselImage);
            break;
          }
        }
      }
      
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
    
    // 根据网站类型使用不同的选择器
    let selectors = [];
    
    if (window.location.href.includes('alibaba.com')) {
      // 阿里巴巴国际站选择器
      selectors = [
        '.product-title h1',
        '.product-name h1',
        '.pd-title h1',
        '.product-detail-title h1',
        '.detail-title h1',
        '.offer-title h1',
        'h1[data-role="product-title"]',
        '.main-title h1',
        '.product-info h1',
        'h1',
        'script[type="application/ld+json"]'
      ];
    } else {
      // 1688和其他网站的选择器
      selectors = [
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
    }
    
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
    
    // 根据网站类型使用不同的价格选择器
    let selectors = [];
    
    if (window.location.href.includes('alibaba.com')) {
      // 阿里巴巴国际站价格选择器
      selectors = [
        '.price-range',
        '.price-current',
        '.unit-price',
        '.product-price',
        '.price-info .price',
        '.price-section .price',
        '.pd-price',
        '.offer-price',
        '[class*="price"]',
        '[data-role="price"]',
        '.price-original',
        '.batch-price',
        '.min-price',
        '.max-price'
      ];
    } else {
      // 1688和其他网站的价格选择器
      selectors = [
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
    }
    
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
    // 根据网站类型从URL中提取产品ID
    if (window.location.href.includes('alibaba.com')) {
      // 阿里巴巴国际站URL格式: /product-detail/xxx_xxxxx.html
      const urlMatch = window.location.href.match(/product-detail\/[^_]+_(\d+)\.html/);
      if (urlMatch) {
        return urlMatch[1];
      }
      // 备用格式
      const altMatch = window.location.href.match(/\/product-detail\/.*_(\d+)/);
      if (altMatch) {
        return altMatch[1];
      }
    } else {
      // 1688网站URL格式: /offer/xxxxx.html
      const urlMatch = window.location.href.match(/offer\/(\d+)\.html/);
      if (urlMatch) {
        return urlMatch[1];
      }
    }
    
    // 从页面元素中提取
    const selectors = [
      '[data-offer-id]',
      '[data-product-id]',
      '[data-pid]',
      '#offerId',
      '#productId'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.getAttribute('data-offer-id') || 
               element.getAttribute('data-product-id') || 
               element.getAttribute('data-pid') ||
               element.value;
      }
    }
    
    return null;
  }

  // 提取供应商名称
  extractSupplierName() {
    let selectors = [];
    
    if (window.location.href.includes('alibaba.com')) {
      // 阿里巴巴国际站供应商选择器
      selectors = [
        '.supplier-name',
        '.company-name',
        '.supplier-info .name',
        '.supplier-detail .name',
        '.company-info .company-name',
        '.supplier-card .name',
        '.seller-name',
        '[data-role="supplier-name"]',
        '[class*="supplier"][class*="name"]',
        '[class*="company"][class*="name"]'
      ];
    } else {
      // 1688和其他网站的选择器
      selectors = [
        '.company-name a',
        '.company-name',
        '.supplier-name',
        '.company-info .name',
        '.mod-detail-supplier .company-name',
        '.seller-company-name',
        '[class*="company"][class*="name"]',
        '[data-role="company-name"]'
      ];
    }
    
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
    let selectors = [];
    
    if (window.location.href.includes('alibaba.com')) {
      // 阿里巴巴国际站位置选择器
      selectors = [
        '.supplier-location',
        '.company-location',
        '.supplier-info .location',
        '.supplier-detail .location',
        '.address',
        '.location-info',
        '[data-role="location"]',
        '[class*="location"]'
      ];
    } else {
      // 1688和其他网站的选择器
      selectors = [
        '.company-location',
        '.supplier-location',
        '.address',
        '[class*="location"]'
      ];
    }
    
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
    let selectors = [];
    
    if (window.location.href.includes('alibaba.com')) {
      // 阿里巴巴国际站描述选择器
      selectors = [
        '.product-description .content',
        '.product-detail-description',
        '.detail-description',
        '.product-overview',
        '.description-content',
        '[data-role="description"]',
        '.product-description',
        '.product-desc',
        '.description',
        '.detail-desc',
        '.offer-desc',
        '.product-detail-desc',
        '[class*="desc"]'
      ];
    } else {
      // 1688和其他网站的描述选择器
      selectors = [
        '.offer-detail-tab-panel .content',
        '.detail-description',
        '.product-description',
        '.description-content',
        '.detail-desc',
        '.product-desc',
        '.description',
        '[class*="desc"]'
      ];
    }
    
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
    let selectors = [];
    
    if (window.location.href.includes('alibaba.com')) {
      // 阿里巴巴国际站规格选择器
      selectors = [
        '.product-attr .attr-item',
        '.spec-list .spec-item',
        '.attr-list .attr-item',
        '.detail-attr-item',
        '.product-specs .spec-item',
        '.specifications .spec-item',
        '[data-role="attributes"] .attr-item',
        '[data-role="specifications"] .spec-item'
      ];
    } else {
      // 1688和其他网站的规格选择器
      selectors = [
        '.detail-attr-item',
        '.attr-list .attr-item',
        '.spec-list .spec-item',
        '.mod-detail-attributes .attr-item',
        '.product-attr .attr-item',
        '[data-role="attributes"] .attr-item'
      ];
    }
    
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
    
    let selectors = [];
    
    if (window.location.href.includes('alibaba.com')) {
      // 阿里巴巴国际站主图选择器
      selectors = [
        '.main-image img',
        '.product-image img',
        '.gallery-main img',
        '.image-gallery .main-img img',
        '.product-gallery .main-image img',
        '.preview-main img',
        '.pd-image img',
        '.offer-image img',
        '[data-role="main-image"] img',
        '.product-detail-image img',
        // 第一个产品图片
        '.product-gallery img:first-child',
        '.image-gallery img:first-child',
        '.gallery-list img:first-child'
      ];
    } else {
      // 1688和其他网站的主图选择器
      selectors = [
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
    }
    
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
    let selectors = [];
    
    if (window.location.href.includes('alibaba.com')) {
      // 阿里巴巴国际站轮播图选择器
      selectors = [
        '.module_product_specification [module-title="detailManyImage"] img',
        '.image-gallery img',
        '.product-gallery img',
        '.gallery-list img',
        '.thumb-list img',
        '.image-thumbs img',
        '.gallery-thumbs img',
        '.preview-list img',
        '.pd-gallery img',
        '.offer-gallery img',
        '.product-images img',
        '.carousel-images img',
        '.swiper-slide img',
        '[data-role="gallery"] img',
        '[data-role="thumb-list"] img',
        '.module_productImage [data-submodule="ProductImageMain"] img, .module_productImage [data-submodule="ProductImageMain"] video'
      ];
    } else {
      // 1688和其他网站的轮播图选择器
      selectors = [
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
        '#gallery .od-gallery-list-wapper img, #gallery .od-gallery-list-wapper video',
        // 通用轮播图选择器
        '.image-gallery img',
        '.product-gallery img',
        '.offer-gallery img',
        '.carousel-images img',
        '.swiper-slide img',
        '.detail-gallery-img',
      ];
    }
    
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

  // 在iframe中查找图片
  async findImagesInIframe(iframe, selectors) {
    const images = [];
    
    try {
      // 等待iframe加载完成
      await new Promise((resolve) => {
        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
          resolve();
        } else {
          iframe.onload = resolve;
          // 设置超时，避免无限等待
          setTimeout(resolve, 3000);
        }
      });
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) {
        console.log('无法访问iframe内容，可能存在跨域限制');
        return images;
      }
      
      console.log('开始在iframe中查找图片:', iframe.src);
      
      for (const selector of selectors) {
        try {
          const elements = iframeDoc.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`在iframe中通过选择器 ${selector} 找到 ${elements.length} 个图片元素`);
            elements.forEach((img, index) => {
              const url = this.getImageUrl(img);
              if (url && !images.includes(url)) {
                images.push(url);
                console.log(`从iframe添加图片 ${index + 1}:`, url);
              }
            });
          }
        } catch (error) {
          console.log(`iframe选择器 ${selector} 查询失败:`, error);
        }
      }
    } catch (error) {
      console.log('访问iframe时发生错误:', error);
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
    
    // iframe中的图片选择器
    const iframeSelectors = [
      '#container .module_product_specification [module-title="detailManyImage"] img, #container .module_product_specification [module-title="detailSingleImage"] img',
    ];
    
    // 根据网站类型定义普通DOM选择器
    let normalSelectors = [];
    
    if (window.location.href.includes('1688.com')) {
      // 1688网站详情页图片选择器
      normalSelectors = [
        '.detail-content img',
        '.offer-detail img',
        '.desc-content img',
        '.product-detail img',
        '.mod-detail-description img',
        '.detail-desc img',
        '[data-role="detail-content"] img',
        '.module_product_specification [module-title="detailManyImage"] img,.module_product_specification [module-title="detailSingleImage"] img',
        '.desc-img-loaded'
      ];
      
      // 1688网站优先从Shadow DOM提取
      const shadowContainers = this.findDetailShadowContainers();
      console.log(`找到 ${shadowContainers.length} 个详情页Shadow DOM容器`);
      
      for (const container of shadowContainers) {
        const shadowImages = this.findImagesInShadowContainer(container, shadowSelectors);
        images.push(...shadowImages);
        
        if (shadowImages.length > 0) {
          console.log(`从Shadow DOM容器找到 ${shadowImages.length} 张图片`);
        }
      }
      
      // 如果Shadow DOM中没有找到图片，尝试普通DOM
      if (images.length === 0) {
        console.log('1688 Shadow DOM中未找到图片，尝试普通DOM选择器');
        for (const selector of normalSelectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach((img, index) => {
            const url = this.getImageUrl(img);
            if (url && !images.includes(url)) {
              images.push(url);
              console.log(`从1688普通DOM添加图片 ${index + 1}:`, url);
            }
          });
          if (images.length > 0) break;
        }
      }
    } else if (window.location.href.includes('alibaba.com')) {
      // 阿里巴巴国际站详情页图片选择器
      normalSelectors = [
        '.module_product_specification [module-title="detailManyImage"] img,.module_product_specification [module-title="detailSingleImage"] img',
        '[module-title="detailManyImage"] img',
        '.module_product_specification img',
        '.product-overview img',
        '.description-content img',
        '[data-role="description"] img',
        '.product-description img',
        '.detail-content img'
      ];
      
      // 首先检查是否有iframe包含详情信息
      const iframes = document.querySelectorAll('iframe');
      console.log(`找到 ${iframes.length} 个iframe`);
      
      for (const iframe of iframes) {
        // 检查iframe的src或其他属性，判断是否包含详情信息
        const src = iframe.src || '';
        const id = iframe.id || '';
        const className = iframe.className || '';
        
        console.log(`检查iframe: src=${src}, id=${id}, class=${className}`);
        
        // 判断是否是详情页面的iframe
        if (src.includes('description') || src.includes('detail') || 
            id.includes('description') || id.includes('detail') ||
            className.includes('description') || className.includes('detail') ||
            src.includes('descIframe') || id.includes('descIframe')) {
          
          console.log('发现详情iframe，开始提取图片');
          const iframeImages = await this.findImagesInIframe(iframe, iframeSelectors);
          images.push(...iframeImages);
          
          if (iframeImages.length > 0) {
            console.log(`从iframe${iframe.src}通过${iframeSelectors}找到 ${iframeImages.length} 张图片`);
            break; // 找到图片后停止查找其他iframe
          }
        }
      }
      
      // 如果iframe中没有找到图片，尝试普通DOM
      if (images.length === 0) {
        console.log('iframe中未找到图片，尝试普通DOM选择器');
        for (const selector of normalSelectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach((img, index) => {
            const url = this.getImageUrl(img);
            if (url && !images.includes(url)) {
              images.push(url);
              console.log(`从阿里巴巴国际站普通DOM添加图片 ${index + 1}:`, url);
            }
          });
          if (images.length > 0) break;
        }
      }
    } else {
      // 其他网站的详情页图片选择器
      normalSelectors = [
        '.detail-content img',
        '.offer-detail img',
        '.desc-content img',
        '.product-detail img',
        '.mod-detail-description img',
        '.detail-desc img',
        '[data-role="detail-content"] img'
      ];
      
      // 先检查是否有Shadow DOM
      const shadowContainers = this.findDetailShadowContainers();
      if (shadowContainers.length > 0) {
        console.log(`找到 ${shadowContainers.length} 个详情页Shadow DOM容器`);
        
        for (const container of shadowContainers) {
          const shadowImages = this.findImagesInShadowContainer(container, shadowSelectors);
          images.push(...shadowImages);
          
          if (shadowImages.length > 0) {
            console.log(`从其他网站Shadow DOM容器找到 ${shadowImages.length} 张图片`);
          }
        }
      }
      
      // 如果Shadow DOM中没有找到图片，尝试普通DOM
      if (images.length === 0) {
        console.log('其他网站Shadow DOM中未找到图片，尝试普通DOM选择器');
        for (const selector of normalSelectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach((img, index) => {
            const url = this.getImageUrl(img);
            if (url && !images.includes(url)) {
              images.push(url);
              console.log(`从其他网站普通DOM添加图片 ${index + 1}:`, url);
            }
          });
          if (images.length > 0) break;
        }
      }
    }
    
    console.log(`详情图提取完成，共找到 ${images.length} 张图片:`, images);
    return images;
  }

  // 提取最小起订量
  extractMinOrderQuantity() {
    let selectors = [];
    
    if (window.location.href.includes('alibaba.com')) {
      // 阿里巴巴国际站最小起订量选择器
      selectors = [
        '.min-order',
        '.min-order-quantity',
        '.moq',
        '.minimum-order',
        '[data-role="min-order"]',
        '.order-info .quantity',
        '.product-moq',
        '.offer-moq'
      ];
    } else {
      // 1688和其他网站的最小起订量选择器
      selectors = [
        '.min-order-quantity',
        '.min-order',
        '.mod-detail-purchasing .min-order',
        '.purchase-info .min-order',
        '[class*="min"][class*="order"]',
        '[data-role="min-order"]'
      ];
    }
    
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
    let selectors = [];
    
    if (window.location.href.includes('alibaba.com')) {
      // 阿里巴巴国际站单位选择器
      selectors = [
        '.unit',
        '.price-unit',
        '.product-unit',
        '.offer-unit',
        '[data-role="unit"]',
        '.unit-info'
      ];
    } else {
      // 1688和其他网站的单位选择器
      selectors = [
        '.unit',
        '.price-unit',
        '[class*="unit"]'
      ];
    }
    
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
    let selectors = [];
    
    if (window.location.href.includes('alibaba.com')) {
      // 阿里巴巴国际站分类选择器
      selectors = [
        '.breadcrumb a:last-child',
        '.category-path a:last-child',
        '.nav-path a:last-child',
        '.product-category',
        '.category-nav',
        '[data-role="breadcrumb"] a:last-child',
        '[data-role="category"]'
      ];
    } else {
      // 1688和其他网站的分类选择器
      selectors = [
        '.breadcrumb a:last-child',
        '.category-path a:last-child',
        '.nav-path a:last-child',
        '.mod-detail-breadcrumb a:last-child',
        '.crumb a:last-child',
        '[data-role="breadcrumb"] a:last-child'
      ];
    }
    
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
      const cleanUrl = url.replace(/_\d+x\d+\.(jpg|jpeg|png|gif|mp4)/, '.$1')
                          .replace(/\.\d+x\d+\.(jpg|jpeg|png|gif|mp4)/, '.$1');
      console.log('getImageUrl: 清理后的URL', cleanUrl);
      return cleanUrl;
    }
    
    console.log('getImageUrl: 未找到有效的图片URL');
    return null;
  }

  // 判断是否为视频URL
  isVideoUrl(url) {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  }

  // 获取视频URL（用于处理视频元素）
  getVideoUrl(videoElement) {
    if (!videoElement) {
      console.log('getVideoUrl: 视频元素为空');
      return null;
    }
    
    console.log('getVideoUrl: 处理视频元素', videoElement);
    
    // 尝试多个属性
    const src = videoElement.src;
    const dataSrc = videoElement.getAttribute('data-src');
    const dataOriginal = videoElement.getAttribute('data-original');
    const dataLazy = videoElement.getAttribute('data-lazy');
    
    // 检查source子元素
    const sourceElement = videoElement.querySelector('source');
    const sourceSrc = sourceElement ? sourceElement.src : null;
    
    console.log('getVideoUrl: 视频属性检查', {
      src: src,
      'data-src': dataSrc,
      'data-original': dataOriginal,
      'data-lazy': dataLazy,
      sourceSrc: sourceSrc
    });
    
    const url = src || sourceSrc || dataSrc || dataOriginal || dataLazy;
    
    if (url && url.startsWith('http')) {
      console.log('getVideoUrl: 找到视频URL', url);
      return url;
    }
    
    console.log('getVideoUrl: 未找到有效的视频URL');
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

  // 等待详情页内容加载完成
  async waitForDetailContent() {
    console.log('等待详情页内容加载...');
    
    let detailSelectors = [];
    
    if (window.location.href.includes('alibaba.com')) {
      // 阿里巴巴国际站详情容器选择器
      detailSelectors = [
        '.product-detail',
        '.product-description',
        '.detail-content',
        '.offer-detail',
        '.pd-detail'
      ];
    } else {
      // 1688和其他网站的详情容器选择器
      detailSelectors = ['#detail1'];
    }
    
    for (const selector of detailSelectors) {
      const detailContainer = await this.waitForElement(selector, 5000);
      if (detailContainer) {
        console.log(`找到${selector}容器，等待内容加载...`);
        
        // 检查容器是否有内容
        return new Promise((resolve) => {
          const checkContent = () => {
            const hasImages = detailContainer.querySelectorAll('img').length > 0;
            const hasText = detailContainer.textContent?.trim().length > 100;
            
            if (hasImages || hasText) {
              console.log('详情页内容已加载');
              resolve(true);
            } else {
              setTimeout(checkContent, 500);
            }
          };
          
          checkContent();
          
          // 最多等待10秒
          setTimeout(() => {
            console.log('详情页内容加载超时');
            resolve(false);
          }, 10000);
        });
      }
    }
    
    console.log('未找到详情容器');
    return false;
  }
}

// 初始化提取器 - 支持所有网站
new ProductExtractor();

// 根据当前网站显示相应的加载信息
if (window.location.href.includes('1688.com')) {
  console.log('1688产品提取器已加载');
} else if (window.location.href.includes('taobao.com')) {
  console.log('淘宝产品提取器已加载');
} else if (window.location.href.includes('tmall.com')) {
  console.log('天猫产品提取器已加载');
} else {
  console.log('通用产品提取器已加载 - 当前网站:', window.location.hostname);
}