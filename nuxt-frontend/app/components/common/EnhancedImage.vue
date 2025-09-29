<template>
  <div class="enhanced-image-wrapper" :class="wrapperClass">
    <!-- 尝试使用 NuxtImg -->
    <NuxtImg
      v-if="!useFallback"
      :src="processedSrc"
      :alt="alt"
      :class="imageClass"
      :loading="loading"
      :sizes="sizes"
      :fetchpriority="fetchpriority"
      :placeholder="placeholder"
      :quality="quality"
      :format="format"
      :preset="preset"
      @error="handleNuxtImageError"
      @load="handleImageLoad"
    />
    
    <!-- 降级到标准 img 标签 -->
    <img
      v-else
      :src="fallbackSrc"
      :alt="alt"
      :class="imageClass"
      :loading="loading"
      @error="handleStandardImageError"
      @load="handleImageLoad"
    />
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="image-loading-placeholder" :class="imageClass">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EnhancedImage',
  props: {
    src: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    imageClass: {
      type: String,
      default: ''
    },
    wrapperClass: {
      type: String,
      default: ''
    },
    loading: {
      type: String,
      default: 'lazy'
    },
    sizes: {
      type: String,
      default: ''
    },
    fetchpriority: {
      type: String,
      default: 'auto'
    },
    placeholder: {
      type: Boolean,
      default: true
    },
    quality: {
      type: Number,
      default: 80
    },
    format: {
      type: String,
      default: 'webp'
    },
    preset: {
      type: String,
      default: ''
    },
    fallbackImage: {
      type: String,
      default: '/images/default-image.svg'
    }
  },
  data() {
    return {
      useFallback: false,
      isLoading: true,
      hasError: false,
      retryCount: 0,
      maxRetries: 2
    };
  },
  computed: {
    processedSrc() {
      return this.processSrc(this.src);
    },
    fallbackSrc() {
      if (this.hasError) {
        return this.fallbackImage;
      }
      return this.processSrc(this.src);
    }
  },
  methods: {
    processSrc(url) {
      if (!url) {
        return this.fallbackImage;
      }
      
      // 如果是完整的URL，直接返回
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      // 确保路径以/开头
      if (!url.startsWith('/')) {
        url = '/' + url;
      }
      
      // 处理后端静态文件路径
      if (url.startsWith('/static/')) {
        const config = useRuntimeConfig();
        const baseURL = config.public.apiBase?.replace('/api', '') || 'http://localhost:3000';
        return `${baseURL}${url}`;
      }
      
      return url;
    },
    
    handleNuxtImageError(event) {
      console.warn('NuxtImg failed to load:', this.src, event);
      
      // 如果还没有重试过，先尝试重试
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        // 添加时间戳强制重新加载
        const timestamp = Date.now();
        if (event.target) {
          event.target.src = `${this.processedSrc}?t=${timestamp}`;
        }
        return;
      }
      
      // 重试失败，切换到标准img标签
      this.useFallback = true;
      this.isLoading = false;
    },
    
    handleStandardImageError(event) {
      console.warn('Standard img failed to load:', this.src, event);
      this.hasError = true;
      this.isLoading = false;
      
      // 最后的降级：使用默认图片
      if (event.target) {
        event.target.src = this.fallbackImage;
      }
    },
    
    handleImageLoad() {
      this.isLoading = false;
      this.$emit('load');
    }
  },
  
  watch: {
    src: {
      handler() {
        // 当src改变时，重置状态
        this.useFallback = false;
        this.isLoading = true;
        this.hasError = false;
        this.retryCount = 0;
      },
      immediate: true
    }
  }
}
</script>

<style lang="scss" scoped>
.enhanced-image-wrapper {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 强制确保图片正确适应容器 */
.enhanced-image-wrapper :deep(img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  object-position: center !important;
  display: block;
}

/* 针对 NuxtImg 组件的特殊处理 */
.enhanced-image-wrapper :deep(.nuxt-img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  object-position: center !important;
  display: block;
}

.image-loading-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>