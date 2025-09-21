// 构建API URL，避免重复的斜杠
function buildApiUrl(baseUrl, endpoint) {
  if (!baseUrl || !endpoint) return '';
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  return cleanBaseUrl + cleanEndpoint;
}

// 判断是否为视频URL
function isVideoUrl(url) {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
}

// 将图片转换为WebP格式
async function convertToWebP(blob, quality = 0.8) {
  return new Promise((resolve, reject) => {
    // 检查是否为图片类型
    if (!blob.type.startsWith('image/')) {
      resolve(blob); // 非图片直接返回原blob
      return;
    }
    
    // 检查是否为JPEG或PNG
    if (!blob.type.includes('jpeg') && !blob.type.includes('jpg') && !blob.type.includes('png')) {
      resolve(blob); // 非JPEG/PNG直接返回原blob
      return;
    }
    
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 创建图片URL
    const url = URL.createObjectURL(blob);
    
    img.onload = function() {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 绘制图片到canvas
      ctx.drawImage(img, 0, 0);
      
      // 转换为WebP格式
      canvas.toBlob((webpBlob) => {
        // 清理URL
        URL.revokeObjectURL(url);
        
        if (webpBlob) {
          resolve(webpBlob);
        } else {
          // 如果转换失败，返回原blob
          resolve(blob);
        }
      }, 'image/webp', quality);
    };
    
    img.onerror = function() {
      // 清理URL
      URL.revokeObjectURL(url);
      // 图片加载失败，返回原blob
      resolve(blob);
    };
    
    img.src = url;
  });
}

// 检查是否启用WebP转换
function isWebPConversionEnabled() {
  const checkbox = document.getElementById('convert-to-webp-checkbox');
  return checkbox ? checkbox.checked : true; // 默认启用
}

// 保存图片到临时目录
async function saveImageToTemp(uint8Array, fileName) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([uint8Array], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: `temp/${fileName}`,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      
      // 获取下载文件的完整路径
      chrome.downloads.search({ id: downloadId }, (items) => {
        if (items && items[0]) {
          resolve(items[0].filename);
        } else {
          reject(new Error('无法获取下载文件路径'));
        }
      });
    });
  });
}

// 调用本地图片处理工具
async function callImageProcessingTool(inputPath, outputPath, apiKey) {
  try {
    // 使用Native Messaging或其他方式调用本地工具
    // 这里需要根据实际情况实现与本地工具的通信
    const response = await fetch('http://localhost:3001/process-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputPath: inputPath,
        outputPath: outputPath,
        apiKey: apiKey
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('调用本地工具失败:', error);
    return false;
  }
}

// 从临时目录读取处理后的图片
async function loadImageFromTemp(filePath) {
  try {
    const response = await fetch(`file://${filePath}`);
    if (response.ok) {
      return await response.blob();
    }
    return null;
  } catch (error) {
    console.error('读取处理后的图片失败:', error);
    return null;
  }
}

// 清理临时文件
async function cleanupTempFiles(filePaths) {
  for (const filePath of filePaths) {
    try {
      // 使用Chrome API删除文件
      await new Promise((resolve) => {
        chrome.downloads.search({ filename: filePath }, (items) => {
          if (items && items[0]) {
            chrome.downloads.removeFile(items[0].id, resolve);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('清理临时文件失败:', filePath, error);
    }
  }
}

// 使用Gemini API处理图片中的汉字转英文
async function processImageWithGemini(blob) {
  try {
    // 获取Gemini API配置
    const config = await chrome.storage.sync.get(['geminiApiKey', 'geminiProcessImage']);

    // 检查是否启用Gemini处理
    if (!config.geminiProcessImage) {
      return blob;
    }
    
    if (!config.geminiApiKey) {
      console.warn('Gemini API Key未配置，跳过图片文字处理');
      return blob;
    }

    // 检查是否为图片类型
    if (!blob.type.startsWith('image/')) {
      return blob;
    }

    console.log('开始使用本地工具处理图片文字...');
    
    // 生成临时文件名
    const timestamp = Date.now();
    const inputFileName = `temp_input_${timestamp}.jpg`;
    const outputFileName = `temp_output_${timestamp}.png`;
    
    try {
      // 将blob保存为临时文件
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // 使用Chrome的downloads API保存文件到临时目录
      const inputFilePath = await saveImageToTemp(uint8Array, inputFileName);
      const outputFilePath = inputFilePath.replace(inputFileName, outputFileName);
      
      console.log('临时文件路径:', inputFilePath);
      
      // 调用本地工具处理图片
      const success = await callImageProcessingTool(inputFilePath, outputFilePath, config.geminiApiKey);
      
      if (success) {
        // 读取处理后的图片
        const processedBlob = await loadImageFromTemp(outputFilePath);
        
        // 清理临时文件
        await cleanupTempFiles([inputFilePath, outputFilePath]);
        
        if (processedBlob) {
          console.log('图片文字处理完成');
          return processedBlob;
        }
      }
      
      // 如果处理失败，清理临时文件并返回原图片
      await cleanupTempFiles([inputFilePath, outputFilePath]);
      console.log('图片文字处理失败，使用原图片');
      return blob;
      
    } catch (error) {
      console.error('图片处理过程中出错:', error);
      return blob;
    }
    
  } catch (error) {
    console.error('图片文字处理失败:', error);
    return blob;
  }
}

// 在图片中替换文字
async function replaceTextInImage(blob, geminiResponse) {
  try {
    console.log('开始在图片中替换文字...');
    // 解析Gemini响应，提取文字替换信息
    const textReplacements = parseGeminiResponse(geminiResponse);
    
    if (!textReplacements || textReplacements.length === 0) {
      console.log('没有找到需要替换的文字，返回原图片');
      return blob;
    }

    // 创建图片对象
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    return new Promise((resolve) => {
       // 创建图片URL
       const url = URL.createObjectURL(blob);
       
       img.onload = function() {
         // 清理URL
         URL.revokeObjectURL(url);
         
         canvas.width = img.width;
         canvas.height = img.height;
         
         // 绘制原始图片
         ctx.drawImage(img, 0, 0);
         console.log('原图片已绘制到Canvas');
         
         // 设置字体样式
         ctx.font = '16px Arial, sans-serif';
         ctx.fillStyle = '#000000';
         ctx.strokeStyle = '#ffffff';
         ctx.lineWidth = 2;
         
         // 替换文字
         console.log(`开始替换 ${textReplacements.length} 个文字项...`);
         textReplacements.forEach((replacement, index) => {
           if (replacement.chineseText && replacement.englishText) {
             console.log(`[${index + 1}/${textReplacements.length}] 替换文字: ${replacement.chineseText} -> ${replacement.englishText}`);
             // 简单的文字覆盖策略：在图片底部添加英文翻译
             const textY = canvas.height - 30 - (textReplacements.indexOf(replacement) * 25);
             
             // 绘制白色背景
             const textWidth = ctx.measureText(replacement.englishText).width;
             ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
             ctx.fillRect(10, textY - 20, textWidth + 20, 25);
             
             // 绘制英文文字
             ctx.fillStyle = '#000000';
             ctx.fillText(replacement.englishText, 20, textY);
           }
         });
         console.log('文字替换处理完成');
         
         // 转换为Blob
         console.log('开始将Canvas转换为Blob...');
         canvas.toBlob((processedBlob) => {
           if (processedBlob) {
             console.log('Canvas转换为Blob成功，大小:', processedBlob.size, 'bytes');
           } else {
             console.error('Canvas转换为Blob失败');
           }
           resolve(processedBlob);
         }, blob.type, 0.9);
       };
       
       img.onerror = function() {
         console.error('图片加载失败');
         URL.revokeObjectURL(url);
         resolve(blob);
       };
       
       img.src = url;
     });
  } catch (error) {
    console.error('图片文字替换失败:', error);
    return blob;
  }
}

// 解析Gemini响应，提取文字替换信息
 function parseGeminiResponse(response) {
   try {
     const textReplacements = [];
     console.log('开始解析Gemini响应，提取文字替换信息...');
     console.log('原始响应内容:', response);
     
     // 使用正则表达式匹配中文和对应的英文翻译
     const lines = response.split('\n');
     console.log('响应行数:', lines.length);
    
    let currentChinese = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      console.log(`处理第${i+1}行:`, line);
      
      // 匹配 "Chinese: [中文文字]" 格式
      const chineseMatch = line.match(/Chinese:\s*(.+)/i);
      if (chineseMatch) {
        currentChinese = chineseMatch[1].trim();
        console.log('找到中文文字:', currentChinese);
        continue;
      }
      
      // 匹配 "English: [英文翻译]" 格式
      const englishMatch = line.match(/English:\s*(.+)/i);
      if (englishMatch && currentChinese) {
        const englishText = englishMatch[1].trim();
        const replacement = {
          chineseText: currentChinese,
          englishText: englishText
        };
        textReplacements.push(replacement);
        console.log('匹配到文字替换对:', replacement);
        currentChinese = null; // 重置
        continue;
      }
      
      // 备用匹配格式："中文文字" -> "English text"
      const arrowMatch = line.match(/["']?([^"']*[\u4e00-\u9fff][^"']*)["']?\s*->\s*["']?([^"']*)["']?/i);
      if (arrowMatch) {
         const replacement = {
           chineseText: arrowMatch[1].trim(),
           englishText: arrowMatch[2].trim()
         };
         textReplacements.push(replacement);
         console.log('匹配到文字替换(箭头格式):', replacement);
      }
      
      // 备用匹配格式：中文: 英文 (同一行)
      const colonMatch = line.match(/([^:]*[\u4e00-\u9fff][^:]*):?\s*([A-Za-z][^\n]*)/i);
      if (colonMatch && !chineseMatch && !englishMatch) {
         const replacement = {
           chineseText: colonMatch[1].trim(),
           englishText: colonMatch[2].trim()
         };
         textReplacements.push(replacement);
         console.log('匹配到文字替换(冒号格式):', replacement);
      }
    }
     
     console.log(`解析完成，共找到 ${textReplacements.length} 个文字替换项:`, textReplacements);
     return textReplacements;
   } catch (error) {
     console.error('解析Gemini响应失败:', error);
     return [];
   }
 }

// Gemini API配置现在统一在popup.html中管理
  
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
      
      let blob = await imageResponse.blob();
      
      // 使用Gemini API处理图片中的汉字转英文
      try {
        blob = await processImageWithGemini(blob);
      } catch (error) {
        console.warn('Gemini图片处理失败，使用原图片:', error);
      }
      
      // 检查是否需要转换为WebP格式
      if (isWebPConversionEnabled()) {
        blob = await convertToWebP(blob);
      }
      
      // 2. 创建FormData上传到后端
      const formData = new FormData();
      
      // 生成文件名
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      let originalName = pathParts[pathParts.length - 1] || 'image.jpg';
      
      // 如果转换为WebP，更新文件扩展名
      if (isWebPConversionEnabled() && blob.type === 'image/webp') {
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
        originalName = `${nameWithoutExt}.webp`;
      }
      
      const fileName = `1688_${Date.now()}_${originalName}`;
      
      formData.append('images', blob, fileName);
      formData.append('image_type', imageType.toString());
      formData.append('product_id', 'undefined'); // 临时产品ID
      formData.append('session_id', sessionId);
      
      // 3. 上传到后端服务器
      const uploadResponse = await fetch(`${buildApiUrl(config.apiUrl, '/api/product-images/upload')}?image_type=${imageType}`, {
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
    
    const response = await fetch(buildApiUrl(config.apiUrl, '/api/categories'), {
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

// 构建分类树结构
function buildCategoryTree(categories) {
  const categoryMap = new Map();
  const rootCategories = [];
  
  // 创建分类映射
  categories.forEach(category => {
    categoryMap.set(category.id, {
      ...category,
      children: []
    });
  });
  
  // 构建树结构
  categories.forEach(category => {
    if (category.parent_id && categoryMap.has(category.parent_id)) {
      categoryMap.get(category.parent_id).children.push(categoryMap.get(category.id));
    } else {
      rootCategories.push(categoryMap.get(category.id));
    }
  });
  
  return rootCategories;
}

// 渲染树节点
function renderTreeNode(category, level = 0) {
  const hasChildren = category.children && category.children.length > 0;
  
  const nodeHtml = `
    <div class="tree-node" data-category-id="${category.id}">
      <div class="tree-item" data-category-id="${category.id}">
        <span class="tree-toggle ${hasChildren ? '' : 'leaf'}" data-category-id="${category.id}"></span>
        <span class="tree-label">${category.name}</span>
      </div>
      ${hasChildren ? `<div class="tree-children expanded" data-parent-id="${category.id}"></div>` : ''}
    </div>
  `;
  
  return nodeHtml;
}

// 渲染完整的分类树
function renderCategoryTree(categories, container) {
  const tree = buildCategoryTree(categories);
  let html = '';
  
  function renderLevel(nodes) {
    return nodes.map(node => {
      const nodeHtml = renderTreeNode(node);
      const childrenHtml = node.children && node.children.length > 0 ? 
        renderLevel(node.children) : '';
      
      return nodeHtml.replace(
        `<div class="tree-children expanded" data-parent-id="${node.id}"></div>`,
        `<div class="tree-children expanded" data-parent-id="${node.id}">${childrenHtml}</div>`
      );
    }).join('');
  }
  
  html = renderLevel(tree);
  container.innerHTML = html;
  
  // 添加事件监听器
  addTreeEventListeners(container);
}

// 添加树形控件事件监听器
function addTreeEventListeners(container) {
  // 切换展开/折叠
  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('tree-toggle') && !e.target.classList.contains('leaf')) {
      const categoryId = e.target.getAttribute('data-category-id');
      const childrenContainer = container.querySelector(`[data-parent-id="${categoryId}"]`);
      
      if (childrenContainer) {
        childrenContainer.classList.toggle('expanded');
        e.target.classList.toggle('expanded');
      }
    }
    
    // 选择分类
    if (e.target.classList.contains('tree-label') || e.target.classList.contains('tree-item')) {
      const categoryId = e.target.getAttribute('data-category-id') || 
                        e.target.closest('[data-category-id]').getAttribute('data-category-id');
      
      // 移除之前的选中状态
      container.querySelectorAll('.tree-item.selected').forEach(item => {
        item.classList.remove('selected');
      });
      
      // 添加新的选中状态
      const treeItem = e.target.classList.contains('tree-item') ? e.target : 
                      e.target.closest('.tree-item');
      treeItem.classList.add('selected');
      
      // 存储选中的分类ID
      container.setAttribute('data-selected-category', categoryId);
    }
  });
}

// 获取选中的分类ID
function getSelectedCategoryId() {
  const categoryTree = document.getElementById('category-tree');
  return categoryTree ? categoryTree.getAttribute('data-selected-category') : null;
}

// 填充分类树
async function populateCategoryTree() {
  const categoryTree = document.getElementById('category-tree');
  if (!categoryTree) return;
  
  // 显示加载状态
  categoryTree.innerHTML = '<div class="tree-loading">正在加载分类...</div>';
  
  try {
    const categories = await loadCategories();
    
    if (categories.length === 0) {
      categoryTree.innerHTML = '<div class="tree-loading">暂无分类数据</div>';
      return;
    }
    
    // 渲染分类树
    renderCategoryTree(categories, categoryTree);
    
    showMessage('分类列表已更新', 'success');
  } catch (error) {
    console.error('填充分类树失败:', error);
    categoryTree.innerHTML = '<div class="tree-loading">加载分类失败</div>';
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
    const selectedCategoryId = getSelectedCategoryId();
    
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
    
    const response = await fetch(buildApiUrl(config.apiUrl, '/api/products/import-from-1688'), {
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
        const assignResponse = await fetch(buildApiUrl(config.apiUrl, '/api/product-images/assign'), {
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
    refreshCategoriesBtn.addEventListener('click', populateCategoryTree);
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
    
    // 初始化分类树
    populateCategoryTree();
    
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