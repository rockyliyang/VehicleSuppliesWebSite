<template>
  <div class="page-banner" :style="{ backgroundImage: `url(${bannerImage})` }">
    <div class="banner-content">
      <!--<h1 class="banner-title">{{ title }}</h1>
      <p v-if="subtitle" class="banner-subtitle">{{ subtitle }}</p>-->
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 定义props
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  backgroundImage: {
    type: String,
    default: '/images/banner1.jpg'
  }
})

// 获取Nuxt应用实例
const { $t } = useNuxtApp()

// 计算属性 - banner图片
const bannerImage = computed(() => {
  try {
    // 获取 company store 实例
    const companyStore = useCompanyStore()
    const banners = companyStore.banners
    
    console.log('banners', banners)
    
    // 如果有banner数据且第一个banner有图片URL，则使用它
    if (banners && banners.length > 0 && banners[0].image_url) {
       return banners[0].image_url
    }
  } catch (error) {
    console.error('获取banner数据失败:', error)
  }
  
  // 回退到默认背景图片
  return props.backgroundImage
})
</script>

<style lang="scss" scoped>
@use '~/assets/styles/_variables.scss' as *;
@use '~/assets/styles/_mixins.scss' as *;

/* Modern Banner */
.page-banner {
  height: $banner-height-desktop;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  @include flex-center;
  color: $white;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.page-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
}

.banner-content {
  @include container;
  position: relative;
  z-index: 1;
}

.banner-title {
  @include heading-1;
  color: $white;
  margin: 0 0 $spacing-lg 0;
  font-size: $font-size-4xl;
  font-weight: $font-weight-bold;
  text-shadow:
    0 2px 4px rgba(0, 0, 0, 0.5),
    0 4px 8px rgba(0, 0, 0, 0.3),
    0 8px 16px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 50%, rgba(255, 255, 255, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  letter-spacing: 0.5px;
}

.banner-subtitle {
  font-size: $font-size-lg;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

/* 移动端适配 */
@media (max-width: $mobile-breakpoint-md) {
  .page-banner {
    height: $mobile-banner-height-md;
  }

  .banner-title {
    font-size: $font-size-2xl;
    margin: 0 0 $spacing-md 0;
    line-height: 1.2;
  }

  .banner-subtitle {
    font-size: $font-size-base;
    line-height: 1.4;
  }
}

@media (max-width: $mobile-breakpoint-sm) {
  .page-banner {
    height: $mobile-banner-height-sm;
  }

  .banner-title {
    font-size: $font-size-xl;
    margin: 0 0 $spacing-sm 0;
  }

  .banner-subtitle {
    font-size: $font-size-sm;
  }
}
</style>