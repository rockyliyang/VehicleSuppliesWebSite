// 判断是否为视频URL
function isVideoUrl(url) {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
}

// 从URL参数获取产品数据
function getProductDataFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const productData = urlParams.get('data');
  if (productData) {
    try {
      return JSON.parse(decodeURIComponent(productData));
    } catch (e) {
      console.error('解析产品数据失败:', e);
      return null;
    }
  }
  return null;
}

// 从localStorage获取产品数据
function getProductDataFromStorage() {
  try {
    const data = localStorage.getItem('previewProductData');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('从localStorage获取数据失败:', e);
    return null;
  }
}

// 生成预览内容
function generatePreviewContent(product) {
  if (!product) return '<p>没有可预览的产品数据</p>';

  let html = '';

  // 基本信息
  html += `
    <div class="preview-section">
      <h3>🏷️ 基本信息</h3>
      <div class="preview-field">
        <label>产品标题:</label>
        <div class="value">${product.title || '-'}</div>
      </div>
      <div class="preview-field">
        <label>产品ID:</label>
        <div class="value">${product.productId || '-'}</div>
      </div>
      <div class="preview-field">
        <label>价格:</label>
        <div class="value">${product.price || '-'}</div>
      </div>
      <div class="preview-field">
        <label>最小起订量:</label>
        <div class="value">${product.minOrderQuantity || '-'}</div>
      </div>
      <div class="preview-field">
        <label>单位:</label>
        <div class="value">${product.unit || '-'}</div>
      </div>
      <div class="preview-field">
        <label>产品链接:</label>
        <div class="value">
          ${product.productUrl ? `<a href="${product.productUrl}" target="_blank">${product.productUrl}</a>` : '-'}
        </div>
      </div>
    </div>
  `;

  // 供应商信息
  html += `
    <div class="preview-section">
      <h3>🏢 供应商信息</h3>
      <div class="preview-field">
        <label>供应商名称:</label>
        <div class="value">${product.supplierName || '-'}</div>
      </div>
      <div class="preview-field">
        <label>供应商链接:</label>
        <div class="value">
          ${product.supplierUrl ? `<a href="${product.supplierUrl}" target="_blank">${product.supplierUrl}</a>` : '-'}
        </div>
      </div>
    </div>
  `;

  // 图片信息 - 按类型分类显示
  let totalImages = 0;
  
  // 主图
  if (product.mainImage && product.mainImage.trim() !== '') {
    totalImages++;
    const isVideo = isVideoUrl(product.mainImage);
    html += `
      <div class="preview-section">
        <h3>${isVideo ? '🎬' : '🖼️'} 主图 (1${isVideo ? '个视频' : '张'})</h3>
        <div class="image-grid">
          <div class="image-item ${isVideo ? 'video-item' : ''} selected" data-image-src="${product.mainImage}">
            ${isVideo ? 
              `<video src="${product.mainImage}" alt="主图视频" data-image-src="${product.mainImage}" class="preview-video" controls preload="metadata">
                 您的浏览器不支持视频播放
               </video>` :
              `<img src="${product.mainImage}" alt="主图" data-image-src="${product.mainImage}" class="preview-image">`
            }
            <div class="image-info">
              <div class="image-resolution">${isVideo ? '视频文件' : '加载中...'}</div>
              <label class="image-checkbox">
                <input type="checkbox" data-image-type="main" data-image-src="${product.mainImage}" checked>
                选中
              </label>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // 轮播图
  if (product.carouselImages && product.carouselImages.length > 0) {
    const validCarouselImages = product.carouselImages.filter(img => img && img.trim() !== '');
    if (validCarouselImages.length > 0) {
      totalImages += validCarouselImages.length;
      html += `
        <div class="preview-section">
          <h3>🎠 轮播图 (${validCarouselImages.length}张)</h3>
          <div class="image-grid">
      `;
      
      validCarouselImages.forEach((img, index) => {
        const isVideo = isVideoUrl(img);
        html += `
          <div class="image-item ${isVideo ? 'video-item' : ''}" data-image-src="${img}">
            ${isVideo ? 
              `<video src="${img}" alt="轮播视频${index + 1}" data-image-src="${img}" class="preview-video" controls preload="metadata">
                 您的浏览器不支持视频播放
               </video>` :
              `<img src="${img}" alt="轮播图${index + 1}" data-image-src="${img}" class="preview-image">`
            }
            <div class="image-resolution">${isVideo ? '视频文件' : '加载中...'}</div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    }
  }
  
  // 详情图
  if (product.detailImages && product.detailImages.length > 0) {
    const validDetailImages = product.detailImages.filter(img => img && img.trim() !== '');
    if (validDetailImages.length > 0) {
      totalImages += validDetailImages.length;
      html += `
        <div class="preview-section">
          <h3>📋 详情图 (${validDetailImages.length}张)</h3>
          <div class="image-grid">
      `;
      
      validDetailImages.forEach((img, index) => {
        const isVideo = isVideoUrl(img);
        html += `
          <div class="image-item ${isVideo ? 'video-item' : ''}" data-image-src="${img}">
            ${isVideo ? 
              `<video src="${img}" alt="详情视频${index + 1}" data-image-src="${img}" class="preview-video" controls preload="metadata">
                 您的浏览器不支持视频播放
               </video>` :
              `<img src="${img}" alt="详情图${index + 1}" data-image-src="${img}" class="preview-image">`
            }
            <div class="image-resolution">${isVideo ? '视频文件' : '加载中...'}</div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    }
  }
  
  // 兼容旧的images字段
  if (product.images && product.images.length > 0) {
    const validImages = product.images.filter(img => img && img.trim() !== '');
    if (validImages.length > 0) {
      totalImages += validImages.length;
      html += `
        <div class="preview-section">
          <h3>🖼️ 其他图片 (${validImages.length}张)</h3>
          <div class="image-grid">
      `;
      
      validImages.forEach((img, index) => {
        const isVideo = isVideoUrl(img);
        html += `
          <div class="image-item ${isVideo ? 'video-item' : ''}" data-image-src="${img}">
            ${isVideo ? 
              `<video src="${img}" alt="视频${index + 1}" data-image-src="${img}" class="preview-video" controls preload="metadata">
                 您的浏览器不支持视频播放
               </video>` :
              `<img src="${img}" alt="图片${index + 1}" data-image-src="${img}" class="preview-image">`
            }
            <div class="image-resolution">${isVideo ? '视频文件' : '加载中...'}</div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    }
  }
  
  // 如果没有图片
  if (totalImages === 0) {
    html += `
      <div class="preview-section">
        <h3>🖼️ 产品图片</h3>
        <div class="no-image">未提取到产品图片</div>
      </div>
    `;
  }

  // 其他信息
  if (product.description || product.specifications || product.features) {
    html += `
      <div class="preview-section">
        <h3>📝 其他信息</h3>
    `;
    
    if (product.description) {
      html += `
        <div class="preview-field">
          <label>产品描述:</label>
          <div class="value description">${product.description}</div>
        </div>
      `;
    }
    
    if (product.specifications) {
      html += `
        <div class="preview-field">
          <label>产品规格:</label>
          <div class="value">${product.specifications}</div>
        </div>
      `;
    }
    
    if (product.features) {
      html += `
        <div class="preview-field">
          <label>产品特性:</label>
          <div class="value">${product.features}</div>
        </div>
      `;
    }
    
    html += `
      </div>
    `;
  }

  // 提取统计
  html += `
    <div class="preview-section">
      <h3>📊 提取统计</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${product.images ? product.images.length : 0}</div>
          <div class="stat-label">图片数量</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${product.extractTime || '未知'}</div>
          <div class="stat-label">提取时间</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${product.dataSource || '1688'}</div>
          <div class="stat-label">数据来源</div>
        </div>
      </div>
    </div>
  `;

  return html;
}

// 显示图片/视频模态框
function showImageModal(mediaSrc) {
  const modal = document.getElementById('image-modal');
  const modalImage = document.getElementById('modal-image');
  const modalVideo = document.getElementById('modal-video');
  
  if (isVideoUrl(mediaSrc)) {
    // 显示视频
    if (modalVideo) {
      modalVideo.src = mediaSrc;
      modalVideo.style.display = 'block';
      modalImage.style.display = 'none';
    } else {
      // 如果没有video元素，创建一个
      const videoElement = document.createElement('video');
      videoElement.id = 'modal-video';
      videoElement.src = mediaSrc;
      videoElement.controls = true;
      videoElement.style.maxWidth = '90%';
      videoElement.style.maxHeight = '90%';
      modalImage.parentNode.insertBefore(videoElement, modalImage.nextSibling);
      modalImage.style.display = 'none';
    }
  } else {
    // 显示图片
    modalImage.src = mediaSrc;
    modalImage.style.display = 'block';
    if (modalVideo) {
      modalVideo.style.display = 'none';
    }
  }
  
  modal.style.display = 'block';
}

// 隐藏图片/视频模态框
function hideImageModal() {
  const modal = document.getElementById('image-modal');
  const modalVideo = document.getElementById('modal-video');
  
  // 暂停视频播放
  if (modalVideo) {
    modalVideo.pause();
  }
  
  modal.style.display = 'none';
}

// 更新图片分辨率显示
function updateImageResolution(img) {
  const resolutionDiv = img.parentElement.querySelector('.image-resolution');
  if (resolutionDiv && img.naturalWidth && img.naturalHeight) {
    resolutionDiv.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
  }
}

// 更新视频信息显示
function updateVideoInfo(video) {
  const resolutionDiv = video.parentElement.querySelector('.image-resolution');
  if (resolutionDiv) {
    video.addEventListener('loadedmetadata', () => {
      if (video.videoWidth && video.videoHeight) {
        const duration = video.duration ? ` (${Math.round(video.duration)}s)` : '';
        resolutionDiv.textContent = `${video.videoWidth} × ${video.videoHeight}${duration}`;
      }
    });
  }
}

// 获取选中的图片
function getSelectedImages() {
  const selectedItems = document.querySelectorAll('.image-item.selected[data-image-src],.image-item.video-item.selected[data-image-src]');
  const selectedImages = {
    mainImage: null,
    carouselImages: [],
    detailImages: [],
    otherImages: []
  };
  
  selectedItems.forEach(item => {
    const src = item.getAttribute('data-image-src');
    const img = item.querySelector('img');
    const video = item.querySelector('video');
    const alt = img ? img.getAttribute('alt') : video ? video.getAttribute('alt') : '';
    
    // 根据alt属性判断图片类型
    if (alt.includes('轮播图') || alt.includes('轮播视频')) {
      selectedImages.carouselImages.push(src);
    } else if (alt.includes('详情图')) {
      selectedImages.detailImages.push(src);
    } else if (alt.includes('主图')) {
      selectedImages.mainImage = src;
    } else {
      selectedImages.otherImages.push(src);
    }
  });
  
  return selectedImages;
}

// 关闭窗口
function closeWindow() {
  window.close();
}

// 上传图片到服务器
async function uploadImages(imageUrls, imageType = 0, sessionId) {
  if (!imageUrls || imageUrls.length === 0) {
    return [];
  }
  
  const uploadedImages = [];
  if (!sessionId) {
    sessionId = `1688_import_${Date.now()}`;
  }
  
  // 获取API配置
  const config = await chrome.storage.sync.get(['apiUrl', 'apiToken']);
  if (!config.apiUrl || !config.apiToken) {
    console.error('API配置不完整，无法上传');
    return [];
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
      const uploadResponse = await fetch(`${config.apiUrl}/api/product-images/upload?image_type=${imageType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`
        },
        body: formData
      });
      
      const uploadResult = await uploadResponse.json();
      
      if (uploadResponse.ok && uploadResult.success) {
        const localUrl = uploadResult.data.images[0].path;
        uploadedImages.push(`${config.apiUrl}${localUrl}`);
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

// 获取分类列表
async function loadCategories() {
  try {
    const config = await chrome.storage.sync.get(['apiUrl', 'apiToken']);
    if (!config.apiUrl || !config.apiToken) {
      console.error('API配置不完整，无法获取分类');
      return [];
    }
    
    const response = await fetch(`${config.apiUrl}/api/categories`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`
      }
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      return result.data || [];
    } else {
      console.error('获取分类失败:', result.message);
      return [];
    }
  } catch (error) {
    console.error('获取分类异常:', error);
    return [];
  }
}

// 填充分类选择框
async function populateCategorySelect() {
  const categorySelect = document.getElementById('category-select');
  if (!categorySelect) return;
  
  // 清空现有选项
  categorySelect.innerHTML = '<option value="">请选择分类</option>';
  
  try {
    const categories = await loadCategories();
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
    
    showMessage('分类列表已更新', 'success');
  } catch (error) {
    console.error('填充分类选择框失败:', error);
    showMessage('获取分类列表失败', 'error');
  }
}

// 上传产品到系统
async function uploadProduct(productData, selectedImages) {
  try {
    if (!productData) {
      console.error('没有产品数据，无法上传');
      return;
    }
    
    // 获取API配置
    const config = await chrome.storage.sync.get(['apiUrl', 'apiToken']);
    if (!config.apiUrl || !config.apiToken) {
      console.error('API配置不完整，无法上传');
      return;
    }
    
    // 获取选中的分类
    const categorySelect = document.getElementById('category-select');
    const selectedCategoryId = categorySelect ? categorySelect.value : null;
    
    console.log('正在上传图片...');
    
    // 生成会话ID用于关联图片
    const sessionId = `1688_import_${Date.now()}`;
    
    let mainImage = selectedImages.mainImage ?? selectedImages.carouselImages[0];
    // 上传图片到服务器
    const uploadedMainImage = mainImage ? 
      (await uploadImages([mainImage], 0, sessionId))[0] : null; // 主图类型为0
    
    const uploadedCarouselImages = await uploadImages(
      selectedImages.carouselImages || [], 1, sessionId // 轮播图也是类型0
    );
    
    const uploadedDetailImages = await uploadImages(
      selectedImages.detailImages || [], 2, sessionId // 详情图类型为1
    );
    
    // 生成富文本格式的description，使用上传后的详情图片URL
    let richTextDescription = productData.description || '';
    if (uploadedDetailImages && uploadedDetailImages.length > 0) {
      const imageHtml = await Promise.all(uploadedDetailImages.map(async (imageUrl) => {
        // 提取相对路径用于富文本
        const relativePath = imageUrl.replace(config.apiUrl, '');
        
        // 获取图片实际尺寸
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          const dimensions = await new Promise((resolve) => {
            img.onload = () => {
              resolve({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.onerror = () => {
              resolve({ width: 750, height: 750 }); // 默认尺寸
            };
            img.src = imageUrl;
          });
          
          return `<p class="ql-align-center"><img src="${relativePath}" data-size="${dimensions.width},${dimensions.height}" width="750"></p>`;
        } catch (error) {
          // 如果获取尺寸失败，使用默认值
          return `<p class="ql-align-center"><img src="${relativePath}" data-size="750,750" width="750"></p>`;
        }
      }));
      
      const imageHtmlString = (await Promise.all(imageHtml)).join('\n');
      
      // 如果原有描述存在，在描述后添加图片；否则只使用图片
      richTextDescription = richTextDescription ? 
        `${richTextDescription}\n${imageHtmlString}` : 
        imageHtmlString;
    }
    
    // 检查是否导入价格
    const importPriceCheckbox = document.getElementById('import-price-checkbox');
    const shouldImportPrice = importPriceCheckbox && importPriceCheckbox.checked;
    
    // 准备上传数据（不包含图片URL，因为图片已经单独上传）
    const uploadData = {
      title: productData.title,
      productId: productData.productId,
      url: productData.url,
      supplierName: productData.supplierName,
      supplierUrl: productData.supplierUrl,
      description: richTextDescription, // 使用富文本格式的描述
      minOrderQuantity: productData.minOrderQuantity,
      unit: productData.unit,
      category: productData.category,
      category_id: selectedCategoryId, // 添加选中的分类ID
      // 不包含图片URL，因为图片已经通过/api/product-images/upload上传
    };
    
    // 根据用户选择决定是否包含价格信息
    if (shouldImportPrice) {
      uploadData.price = productData.price;
    }
    
    console.log('正在上传产品...');
    
    const response = await fetch(`${config.apiUrl}/api/products/import-from-1688`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiToken}`
      },
      body: JSON.stringify(uploadData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      // 关联图片到产品
      try {
        const assignResponse = await fetch(`${config.apiUrl}/api/product-images/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiToken}`
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
      
      console.log('✅ 产品上传成功:', result.data);
      return result.data;
    } else {
      console.error('产品上传失败:', result.message);
      return null;
    }
  } catch (error) {
    console.error('上传产品失败:', error);
    return null;
  }
}

// 显示提示消息
function showMessage(message, type = 'info') {
  // 创建消息元素
  const messageEl = document.createElement('div');
  messageEl.className = `message-toast message-${type}`;
  messageEl.textContent = message;
  
  // 添加样式
  messageEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  // 根据类型设置背景色
  switch (type) {
    case 'success':
      messageEl.style.backgroundColor = '#67C23A';
      break;
    case 'error':
      messageEl.style.backgroundColor = '#F56C6C';
      break;
    case 'warning':
      messageEl.style.backgroundColor = '#E6A23C';
      break;
    default:
      messageEl.style.backgroundColor = '#409EFF';
  }
  
  // 添加到页面
  document.body.appendChild(messageEl);
  
  // 3秒后自动移除
  setTimeout(() => {
    if (messageEl.parentNode) {
      messageEl.style.opacity = '0';
      messageEl.style.transform = 'translateX(100%)';
      setTimeout(() => {
        messageEl.parentNode.removeChild(messageEl);
      }, 300);
    }
  }, 3000);
}

// 上传选中的图片和产品
async function uploadSelectedImages() {
  const selectedImages = getSelectedImages();
  const totalSelected = (selectedImages.mainImage ? 1 : 0) + 
                       selectedImages.carouselImages.length + 
                       selectedImages.detailImages.length + 
                       selectedImages.otherImages.length;
  
  if (totalSelected === 0) {
    showMessage('请至少选择一张图片', 'warning');
    return;
  }
  
  // 显示上传中提示
  showMessage('正在上传产品和图片，请稍候...', 'info');
  
  // 禁用上传按钮
  const uploadBtn = document.getElementById('upload-selected-btn');
  if (uploadBtn) {
    uploadBtn.disabled = true;
    uploadBtn.textContent = '上传中...';
  }
  
  try {
    // 获取原始产品数据
    let productData = getProductDataFromStorage() || getProductDataFromUrl();
    if (!productData) {
      showMessage('没有产品数据，无法上传', 'error');
      return;
    }
    
    console.log('开始上传选中的图片和产品...', selectedImages);
    
    // 上传产品和图片
    const result = await uploadProduct(productData, selectedImages);
    
    if (result) {
      console.log('✅ 产品和图片上传成功');
      showMessage(`产品"${productData.title}"上传成功！`, 'success');
    } else {
      console.error('❌ 产品和图片上传失败');
      showMessage('产品上传失败，请检查网络连接和API配置', 'error');
    }
    
  } catch (error) {
    console.error('上传过程中发生错误:', error);
    showMessage('上传过程中发生错误：' + error.message, 'error');
  } finally {
    // 恢复上传按钮
    if (uploadBtn) {
      uploadBtn.disabled = false;
      uploadBtn.textContent = '上传选中的图片';
    }
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  const loading = document.getElementById('loading');
  const content = document.getElementById('preview-content');
  const modal = document.getElementById('image-modal');
  const closeBtn = modal.querySelector('.modal-close');
  const windowCloseBtn = document.querySelector('.close-btn');
  const uploadBtn = document.getElementById('upload-selected-btn');

  // 绑定关闭窗口按钮事件
  if (windowCloseBtn) {
    windowCloseBtn.addEventListener('click', closeWindow);
  }
  
  // 绑定头部关闭按钮事件
  const headerCloseBtn = document.getElementById('header-close-btn');
  if (headerCloseBtn) {
    headerCloseBtn.addEventListener('click', closeWindow);
  }

  // 绑定上传按钮事件
  if (uploadBtn) {
    uploadBtn.addEventListener('click', uploadSelectedImages);
  }
  
  // 绑定刷新分类按钮事件
  const refreshCategoriesBtn = document.getElementById('refresh-categories');
  if (refreshCategoriesBtn) {
    refreshCategoriesBtn.addEventListener('click', populateCategorySelect);
  }

  // 绑定模态框关闭事件
  closeBtn.addEventListener('click', hideImageModal);
  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
      hideImageModal();
    }
  });
  
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      hideImageModal();
    }
  });

  // 获取产品数据并显示
  setTimeout(() => {
    let productData = getProductDataFromStorage() || getProductDataFromUrl();
    
    loading.style.display = 'none';
    content.style.display = 'block';
    
    // 将动态内容放到dynamic-content容器中，而不是替换整个content
    const dynamicContent = document.getElementById('dynamic-content');
    if (dynamicContent) {
      dynamicContent.innerHTML = generatePreviewContent(productData);
    }
    
    // 初始化分类选择框
    populateCategorySelect();
    
    // 绑定图片/视频项点击事件（切换选中状态）
    if (dynamicContent) {
      dynamicContent.addEventListener('click', function(event) {
        const imageItem = event.target.closest('.image-item');
        if (imageItem && imageItem.hasAttribute('data-image-src')) {
          // 如果点击的是图片预览（用于放大），不切换选中状态
          if (event.target.classList.contains('preview-image')) {
            const imageSrc = event.target.getAttribute('data-image-src');
            if (imageSrc) {
              showImageModal(imageSrc);
            }
          } else if (event.target.classList.contains('preview-video')) {
            // 如果点击的是视频预览，显示模态框
            const videoSrc = event.target.getAttribute('data-image-src');
            if (videoSrc) {
              showImageModal(videoSrc);
            }
          } else {
            // 切换选中状态
            imageItem.classList.toggle('selected');
          }
        }
      });
    }
    
    // 绑定图片加载事件（事件委托）
     if (dynamicContent) {
       dynamicContent.addEventListener('load', function(event) {
         if (event.target.classList.contains('preview-image')) {
           updateImageResolution(event.target);
         }
       }, true);
       
       // 绑定视频加载事件（事件委托）
       dynamicContent.addEventListener('loadedmetadata', function(event) {
         if (event.target.classList.contains('preview-video')) {
           updateVideoInfo(event.target);
         }
       }, true);
       
       // 初始化所有图片为选中状态
       setTimeout(() => {
         const imageItems = dynamicContent.querySelectorAll('.image-item[data-image-src]');
         imageItems.forEach(item => {
           item.classList.add('selected');
         });
       }, 100);
     }
  }, 500);
});