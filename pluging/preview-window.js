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
    html += `
      <div class="preview-section">
        <h3>🖼️ 主图 (1张)</h3>
        <div class="image-grid">
          <div class="image-item">
            <img src="${product.mainImage}" alt="主图" data-image-src="${product.mainImage}" class="preview-image">
            <div class="image-info">
              <div class="image-resolution">加载中...</div>
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
        html += `
          <div class="image-item" data-image-src="${img}">
            <img src="${img}" alt="轮播图${index + 1}" data-image-src="${img}" class="preview-image">
            <div class="image-resolution">加载中...</div>
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
        html += `
          <div class="image-item" data-image-src="${img}">
            <img src="${img}" alt="详情图${index + 1}" data-image-src="${img}" class="preview-image">
            <div class="image-resolution">加载中...</div>
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
        html += `
          <div class="image-item" data-image-src="${img}">
            <img src="${img}" alt="图片${index + 1}" data-image-src="${img}" class="preview-image">
            <div class="image-resolution">加载中...</div>
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

// 显示图片模态框
function showImageModal(imageSrc) {
  const modal = document.getElementById('image-modal');
  const modalImage = document.getElementById('modal-image');
  modalImage.src = imageSrc;
  modal.style.display = 'block';
}

// 隐藏图片模态框
function hideImageModal() {
  const modal = document.getElementById('image-modal');
  modal.style.display = 'none';
}

// 更新图片分辨率显示
function updateImageResolution(img) {
  const resolutionDiv = img.parentElement.querySelector('.image-resolution');
  if (resolutionDiv && img.naturalWidth && img.naturalHeight) {
    resolutionDiv.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
  }
}

// 获取选中的图片
function getSelectedImages() {
  const selectedItems = document.querySelectorAll('.image-item.selected[data-image-src]');
  const selectedImages = {
    mainImage: null,
    carouselImages: [],
    detailImages: [],
    otherImages: []
  };
  
  selectedItems.forEach(item => {
    const src = item.getAttribute('data-image-src');
    const img = item.querySelector('img');
    const alt = img ? img.getAttribute('alt') : '';
    
    // 根据alt属性判断图片类型
    if (alt.includes('轮播图')) {
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

// 上传选中的图片
function uploadSelectedImages() {
  const selectedImages = getSelectedImages();
  const totalSelected = (selectedImages.mainImage ? 1 : 0) + 
                       selectedImages.carouselImages.length + 
                       selectedImages.detailImages.length + 
                       selectedImages.otherImages.length;
  
  if (totalSelected === 0) {
    alert('请至少选择一张图片进行上传');
    return;
  }
  
  // 这里可以添加实际的上传逻辑
  console.log('选中的图片:', selectedImages);
  alert(`已选择 ${totalSelected} 张图片，准备上传...\n\n主图: ${selectedImages.mainImage ? '1张' : '0张'}\n轮播图: ${selectedImages.carouselImages.length}张\n详情图: ${selectedImages.detailImages.length}张\n其他图片: ${selectedImages.otherImages.length}张`);
  
  // 将选中的图片数据传回父窗口或保存到localStorage
  try {
    // 获取原始产品数据
    let productData = getProductDataFromStorage() || getProductDataFromUrl();
    if (productData) {
      // 更新产品数据中的图片
      productData.mainImage = selectedImages.mainImage;
      productData.carouselImages = selectedImages.carouselImages;
      productData.detailImages = selectedImages.detailImages;
      if (selectedImages.otherImages.length > 0) {
        productData.images = selectedImages.otherImages;
      }
      
      // 保存更新后的数据
      localStorage.setItem('selectedProductData', JSON.stringify(productData));
      console.log('✅ 选中的产品数据已保存到localStorage');
    }
  } catch (error) {
    console.error('保存选中数据失败:', error);
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
    content.innerHTML = generatePreviewContent(productData);
    

    
    // 绑定图片项点击事件（切换选中状态）
    content.addEventListener('click', function(event) {
      const imageItem = event.target.closest('.image-item');
      if (imageItem && imageItem.hasAttribute('data-image-src')) {
        // 如果点击的是图片预览（用于放大），不切换选中状态
        if (event.target.classList.contains('preview-image')) {
          const imageSrc = event.target.getAttribute('data-image-src');
          if (imageSrc) {
            showImageModal(imageSrc);
          }
        } else {
          // 切换选中状态
          imageItem.classList.toggle('selected');
        }
      }
    });
    
    // 绑定图片加载事件（事件委托）
     content.addEventListener('load', function(event) {
       if (event.target.classList.contains('preview-image')) {
         updateImageResolution(event.target);
       }
     }, true);
     
     // 初始化所有图片为选中状态
     setTimeout(() => {
       const imageItems = content.querySelectorAll('.image-item[data-image-src]');
       imageItems.forEach(item => {
         item.classList.add('selected');
       });
     }, 100);
  }, 500);
});