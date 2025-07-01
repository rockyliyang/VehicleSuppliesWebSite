// inject.js - 注入到页面中的脚本，可以访问页面的JavaScript变量

(function() {
  'use strict';
  
  // 创建一个全局对象来存储提取的数据
  window.VS_PRODUCT_EXTRACTOR = {
    // 从页面JavaScript变量中提取数据
    extractFromPageData: function() {
      const data = {};
      
      try {
        // 尝试从常见的全局变量中提取数据
        if (window.detailData) {
          data.detailData = window.detailData;
        }
        
        if (window.offerData) {
          data.offerData = window.offerData;
        }
        
        if (window.productData) {
          data.productData = window.productData;
        }
        
        // 从页面配置中提取
        if (window.__INITIAL_STATE__) {
          data.initialState = window.__INITIAL_STATE__;
        }
        
        if (window.pageConfig) {
          data.pageConfig = window.pageConfig;
        }
        
        // 从React/Vue组件数据中提取
        const reactRoot = document.querySelector('[data-reactroot]');
        if (reactRoot && reactRoot._reactInternalInstance) {
          try {
            data.reactData = this.extractReactData(reactRoot);
          } catch (e) {
            console.warn('提取React数据失败:', e);
          }
        }
        
        // 从Vue组件中提取
        const vueApp = document.querySelector('#app');
        if (vueApp && vueApp.__vue__) {
          try {
            data.vueData = this.extractVueData(vueApp.__vue__);
          } catch (e) {
            console.warn('提取Vue数据失败:', e);
          }
        }
        
      } catch (error) {
        console.error('从页面数据提取失败:', error);
      }
      
      return data;
    },
    
    // 提取React组件数据
    extractReactData: function(element) {
      const data = {};
      
      try {
        const instance = element._reactInternalInstance;
        if (instance && instance.memoizedProps) {
          data.props = instance.memoizedProps;
        }
        if (instance && instance.memoizedState) {
          data.state = instance.memoizedState;
        }
      } catch (error) {
        console.warn('提取React数据时出错:', error);
      }
      
      return data;
    },
    
    // 提取Vue组件数据
    extractVueData: function(vm) {
      const data = {};
      
      try {
        if (vm.$data) {
          data.data = vm.$data;
        }
        if (vm.$props) {
          data.props = vm.$props;
        }
        if (vm.$store && vm.$store.state) {
          data.store = vm.$store.state;
        }
      } catch (error) {
        console.warn('提取Vue数据时出错:', error);
      }
      
      return data;
    },
    
    // 从JSON-LD结构化数据中提取
    extractJsonLd: function() {
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      const jsonLdData = [];
      
      jsonLdScripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent);
          jsonLdData.push(data);
        } catch (error) {
          console.warn('解析JSON-LD失败:', error);
        }
      });
      
      return jsonLdData;
    },
    
    // 从meta标签中提取
    extractMetaData: function() {
      const metaData = {};
      
      // Open Graph数据
      const ogTags = document.querySelectorAll('meta[property^="og:"]');
      ogTags.forEach(tag => {
        const property = tag.getAttribute('property');
        const content = tag.getAttribute('content');
        if (property && content) {
          metaData[property] = content;
        }
      });
      
      // Twitter Card数据
      const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
      twitterTags.forEach(tag => {
        const name = tag.getAttribute('name');
        const content = tag.getAttribute('content');
        if (name && content) {
          metaData[name] = content;
        }
      });
      
      // 其他meta标签
      const metaTags = document.querySelectorAll('meta[name]');
      metaTags.forEach(tag => {
        const name = tag.getAttribute('name');
        const content = tag.getAttribute('content');
        if (name && content) {
          metaData[name] = content;
        }
      });
      
      return metaData;
    },
    
    // 监听页面数据变化
    observeDataChanges: function(callback) {
      // 监听DOM变化
      const observer = new MutationObserver((mutations) => {
        let hasRelevantChanges = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            // 检查是否有相关的DOM变化
            const addedNodes = Array.from(mutation.addedNodes);
            const hasRelevantNodes = addedNodes.some(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                return node.classList.contains('detail-gallery') ||
                       node.classList.contains('offer-detail') ||
                       node.classList.contains('price') ||
                       node.tagName === 'SCRIPT';
              }
              return false;
            });
            
            if (hasRelevantNodes) {
              hasRelevantChanges = true;
            }
          }
        });
        
        if (hasRelevantChanges) {
          callback();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      return observer;
    },
    
    // 获取完整的产品数据
    getCompleteProductData: function() {
      return {
        pageData: this.extractFromPageData(),
        jsonLd: this.extractJsonLd(),
        metaData: this.extractMetaData(),
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
    }
  };
  
  // 监听来自content script的消息
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    
    if (event.data.type === 'VS_GET_PAGE_DATA') {
      const data = window.VS_PRODUCT_EXTRACTOR.getCompleteProductData();
      window.postMessage({
        type: 'VS_PAGE_DATA_RESPONSE',
        data: data
      }, '*');
    }
  });
  
  console.log('1688产品提取器注入脚本已加载');
})();