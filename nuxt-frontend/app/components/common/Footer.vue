<template>
  <footer class="footer-container">
    <div class="footer-wrapper">
      <!-- 桌面端布局 -->
      <div class="footer-grid desktop-footer">
        <div>
          <img class="footer-logo h-8 w-auto mb-6" :src="companyInfo.logo_url"
            :alt="companyInfo.company_name || 'Auto Ease Tech X Logo'" />
          <p class="footer-intro mb-6">
            {{ companyInfo.description || defaultCompanyIntro }}
          </p>
          <div class="social-links">
            <a href="#" class="social-link" aria-label="Follow us on Facebook">
              <i class="fab fa-facebook-f" aria-hidden="true"></i>
              <span class="sr-only">Facebook</span>
            </a>
            <a href="#" class="social-link" aria-label="Follow us on Twitter">
              <i class="fab fa-twitter" aria-hidden="true"></i>
              <span class="sr-only">Twitter</span>
            </a>
            <a href="#" class="social-link" aria-label="Follow us on Instagram">
              <i class="fab fa-instagram" aria-hidden="true"></i>
              <span class="sr-only">Instagram</span>
            </a>
            <a href="#" class="social-link" aria-label="Follow us on LinkedIn">
              <i class="fab fa-linkedin-in" aria-hidden="true"></i>
              <span class="sr-only">LinkedIn</span>
            </a>
            <a href="#" class="social-link" aria-label="Follow us on YouTube">
              <i class="fab fa-youtube" aria-hidden="true"></i>
              <span class="sr-only">YouTube</span>
            </a>
          </div>
        </div>
        <div>
          <h3 class="text-xl font-semibold mb-6">{{$t('QuickLinks')}}</h3>
          <ul class="footer-list">
            <li>
              <NuxtLink to="/" class="footer-link">{{$t('home')}}</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/About" class="footer-link">{{$t('about')}}</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/Products" class="footer-link">{{$t('products')}}</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/News" class="footer-link">{{$t('news')}}</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/Contact" class="footer-link">{{$t('contact')}}</NuxtLink>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-xl font-semibold mb-6">{{$t('OurProducts')}}</h3>
          <ul class="footer-list">
            <li v-for="category in categories.slice(0, 7)" :key="category.id">
              <NuxtLink :to="`/Products?category=${category.id}`" class="footer-link">{{ category.name
                }}</NuxtLink>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-xl font-semibold mb-6">{{$t('ContactInfo')}}</h3>
          <ul class="footer-list contact-list">
            <li class="flex items-start">
              <i class="fas fa-map-marker-alt text-red-600 mt-1 mr-3"></i>
              <span class="contact-text">{{ companyInfo.address || defaultAddress }}</span>
            </li>
            <li class="flex items-center">
              <i class="fas fa-phone-alt text-red-600 mr-3"></i>
              <span class="contact-text">{{ companyInfo.phone || '+1 (800) 567-8901' }}</span>
            </li>
            <li class="flex items-center">
              <i class="fas fa-envelope text-red-600 mr-3"></i>
              <span class="contact-text">{{ companyInfo.email || 'info@autoeasexpert.com' }}</span>
            </li>
            <li class="flex items-center">
              <i class="fas fa-clock text-red-600 mr-3"></i>
              <span class="contact-text">{{ companyInfo.business_hours || 'Mon-Fri: 9:00 AM - 6:00 PM' }}</span>
            </li>
          </ul>
          <div class="mt-6" v-if="companyInfo.wechat_qrcode">
            <img :src="companyInfo.wechat_qrcode" alt="QR Code" class="w-24 h-24" />
          </div>
        </div>
      </div>

      <!-- 移动端可伸缩布局 -->
      <div class="mobile-footer">
        <!-- Quick Links 栏目 -->
        <div class="mobile-footer-section">
          <div class="mobile-footer-header" @click="toggleSection('quickLinks')">
            <h3 class="mobile-footer-title">{{$t('QuickLinks')}}</h3>
            <i class="fas fa-chevron-down mobile-footer-icon"
              :class="{ 'rotated': expandedSection === 'quickLinks' }"></i>
          </div>
          <div class="mobile-footer-content" :class="{ 'expanded': expandedSection === 'quickLinks' }">
            <ul class="footer-list">
              <li>
                <NuxtLink to="/" class="footer-link">{{$t('home')}}</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/About" class="footer-link">{{$t('about')}}</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/Products" class="footer-link">{{$t('products')}}</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/News" class="footer-link">{{$t('news')}}</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/Contact" class="footer-link">{{$t('contact')}}</NuxtLink>
              </li>
            </ul>
          </div>
        </div>

        <!-- Our Products 栏目 -->
        <div class="mobile-footer-section">
          <div class="mobile-footer-header" @click="toggleSection('ourProducts')">
            <h3 class="mobile-footer-title">{{$t('OurProducts')}}</h3>
            <i class="fas fa-chevron-down mobile-footer-icon"
              :class="{ 'rotated': expandedSection === 'ourProducts' }"></i>
          </div>
          <div class="mobile-footer-content" :class="{ 'expanded': expandedSection === 'ourProducts' }">
            <ul class="footer-list">
              <li v-for="category in categories.slice(0, 7)" :key="category.id">
                <NuxtLink :to="`/products?category=${category.id}`" class="footer-link">{{ category.name
                  }}</NuxtLink>
              </li>
            </ul>
          </div>
        </div>

        <!-- Contact Info 栏目 -->
        <div class="mobile-footer-section">
          <div class="mobile-footer-header" @click="toggleSection('contactInfo')">
            <h3 class="mobile-footer-title">{{$t('ContactInfo')}}</h3>
            <i class="fas fa-chevron-down mobile-footer-icon"
              :class="{ 'rotated': expandedSection === 'contactInfo' }"></i>
          </div>
          <div class="mobile-footer-content" :class="{ 'expanded': expandedSection === 'contactInfo' }">
            <ul class="footer-list contact-list">
              <li class="flex items-start">
                <i class="fas fa-map-marker-alt text-red-600 mt-1 mr-3"></i>
                <span class="contact-text">{{ companyInfo.address || defaultAddress }}</span>
              </li>
              <li class="flex items-center">
                <i class="fas fa-phone-alt text-red-600 mr-3"></i>
                <span class="contact-text">{{ companyInfo.phone || '+1 (800) 567-8901' }}</span>
              </li>
              <li class="flex items-center">
                <i class="fas fa-envelope text-red-600 mr-3"></i>
                <span class="contact-text">{{ companyInfo.email || 'info@autoeasexpert.com' }}</span>
              </li>
              <li class="flex items-center">
                <i class="fas fa-clock text-red-600 mr-3"></i>
                <span class="contact-text">{{ companyInfo.business_hours || 'Mon-Fri: 9:00 AM - 6:00 PM' }}</span>
              </li>
            </ul>
            <div class="mt-6" v-if="companyInfo.wechat_qrcode">
              <img :src="companyInfo.wechat_qrcode" alt="QR Code" class="w-24 h-24" />
            </div>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="copyright-text">
          © 2025 {{ companyInfo.company_name || 'Auto Ease Xpert Co., Ltd.' }} All Rights Reserved.
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Nuxt composables
const { $api, $t } = useNuxtApp()

// Reactive data
const companyInfo = ref({})
const categories = ref([])
const defaultAddress = ref('')
const defaultCompanyIntro = ref('Auto Ease Tecx Co., Ltd. is a leading manufacturer of high-quality automotive electronic products designed to make your driving experience more comfortable and convenient.')
const expandedSection = ref('quickLinks') // 默认展开第一个栏目

// Methods
const toggleSection = (sectionName) => {
  // 如果点击的是当前展开的栏目，则收起；否则展开点击的栏目
  expandedSection.value = expandedSection.value === sectionName ? null : sectionName
}

// Data fetching functions
const fetchCompanyInfo = async () => {
  try {
    const res = await $api.get('company')
    if (res.success && res.data) {
      companyInfo.value = res.data
    }
  } catch (e) {
    // ignore error
  }
}

const fetchCategories = async () => {
  try {
    const res = await $api.get('categories')
    if (res.success && res.data) {
      categories.value = res.data
    }
  } catch (e) {
    // ignore error
  }
}

// Lifecycle
onMounted(() => {
  const companyInfoStore = useCompanyStore();
  companyInfo.value = companyInfoStore.companyInfo;  
  if (!companyInfo.value || Object.keys(companyInfo.value).length === 0) {
    fetchCompanyInfo()
  }
  categories.value = companyInfoStore.categories;
  if (!categories.value || Object.keys(categories.value).length === 0) {
    fetchCategories()
  }
})
</script>

<style lang="scss" scoped>
@use '~/assets/styles/_variables.scss' as *;
@use '~/assets/styles/_mixins.scss' as *;

/* Footer 主容器 */
.footer-container {
  background-color: $gray-800;
  color: $white;
  padding: $spacing-4xl 0 $spacing-2xl;

  @include mobile {
    padding: $spacing-xl 0 $spacing-md;
  }
}

/* Footer 包装器 */
.footer-wrapper {
  @include container;
}

/* Footer 网格布局 - 桌面端 */
.desktop-footer {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: $spacing-2xl;
  margin-bottom: $spacing-2xl;

  /* 平板端：2列布局 */
  @include tablet {
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-xl;
  }

  /* 移动端：隐藏桌面端布局 */
  @include mobile {
    display: none;
  }

  /* 为每列添加一致的内边距 */
  >div {
    padding-right: $spacing-md;

    &:last-child {
      padding-right: 0;
    }
  }
}

/* 移动端可伸缩布局 */
.mobile-footer {
  display: none;

  @include mobile {
    display: block;
    margin-bottom: $spacing-lg;
  }
}

/* 移动端栏目容器 */
.mobile-footer-section {
  border-bottom: 1px solid $gray-700;

  &:last-child {
    border-bottom: none;
  }
}

/* 移动端栏目头部 */
.mobile-footer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg $spacing-sm;
  cursor: pointer;
  transition: background-color $transition-base;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

/* 移动端栏目标题 */
.mobile-footer-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $white;
  margin: 0;
  text-align: left;
  border: none;
  padding: 0;
  display: block;
}

/* 移动端栏目图标和内容 */
.mobile-footer-icon {
  color: $gray-400;
  font-size: $font-size-sm;
  transition: transform $transition-base;

  &.rotated {
    transform: rotate(180deg);
  }
}

.mobile-footer-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height $transition-slow, padding $transition-slow;
  padding: 0 $spacing-sm;

  &.expanded {
    max-height: $mobile-footer-max-height;
    padding: $spacing-md $spacing-sm $spacing-lg;
  }

  .footer-list {
    margin: 0;

    li {
      margin-bottom: $spacing-sm;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .contact-list {
    li {
      margin-bottom: $spacing-md;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

/* 公司介绍文本 */
.footer-intro {
  color: $gray-400;
  font-size: $font-size-sm;
  margin-bottom: $spacing-lg;
  line-height: $line-height-relaxed;

  @include mobile {
    margin-bottom: $spacing-md;
    font-size: $font-size-sm;
  }
}

/* 社交媒体链接容器 */
.social-links {
  @include flex-start;
  gap: $spacing-md;

  @include mobile {
    justify-content: center;
    margin-top: $spacing-sm;
    gap: $spacing-sm;
  }
}

/* 社交媒体链接 */
.social-link {
  color: $gray-400;
  transition: $transition-base;
  cursor: pointer;
  font-size: $font-size-xl;

  @include mobile {
    font-size: $font-size-lg;
  }

  &:hover {
    color: $primary-color;
    transform: translateY(-2px);
  }
}

/* Footer 列表和链接样式 - 合并相关样式 */
.footer-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  li {
    @include flex-start;
  }
}

.contact-list {
  gap: $spacing-md;

  i {
    color: $primary-color;
    margin-right: $spacing-sm;
    margin-top: $mobile-icon-margin;
  }
}

/* Footer 链接和文本样式 */
.footer-link,
.contact-text {
  color: $gray-400;
  font-size: $font-size-lg;
  transition: $transition-base;
}

.footer-link {
  &:hover {
    color: $white;
  }
}

/* 底部区域 */
.footer-bottom {
  padding-top: $spacing-md;
  border-top: 1px solid $gray-700;
  text-align: center;

  @include mobile {
    padding-top: $spacing-md;
  }
}

/* 版权文本 */
.copyright-text {
  color: $gray-700;
  /* 提高对比度 */
  font-size: $font-size-sm;

  @include mobile {
    font-size: $font-size-xs;
  }
}

/* 标题样式 */
h3 {
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  color: $white;
  margin-bottom: $spacing-lg;
  border-bottom: 2px solid $primary-color;
  padding-bottom: $spacing-xs;
  display: inline-block;

  @include mobile {
    font-size: $font-size-md;
    margin-bottom: $spacing-md;
  }
}

/* 基础样式重置和图片样式 - 合并相关样式 */
a {
  text-decoration: none;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  margin: 0;
}

img {
  &.h-8 {
    height: $spacing-lg + $spacing-sm;
    width: auto;
    max-width: 100%;
    margin-bottom: $spacing-lg;
  }

  &.w-24 {
    width: $spacing-4xl + $spacing-md;
    height: $spacing-4xl + $spacing-md;
    margin-top: $spacing-lg;
  }
}

/* 屏幕阅读器专用文本 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>