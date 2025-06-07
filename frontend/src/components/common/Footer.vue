<template>
  <footer class="footer-container">
    <div class="footer-wrapper">
      <div class="footer-grid">
        <div>
          <img
            :src="companyInfo.logo_url || 'https://static.readdy.ai/image/01b5af88fa941f59119e27a41ea4862d/63b7adac1fa1c8b6813bfaf6742a426b.png'"
            :alt="companyInfo.company_name || 'Auto Ease Tech X Logo'" class="h-8 w-auto mb-6" />
          <p class="footer-intro mb-6">
            {{ companyInfo.company_intro || defaultCompanyIntro }}
          </p>
          <div class="social-links">
            <a href="#" class="social-link">
              <i class="fab fa-facebook-f"></i>
            </a>
            <a href="#" class="social-link">
              <i class="fab fa-twitter"></i>
            </a>
            <a href="#" class="social-link">
              <i class="fab fa-instagram"></i>
            </a>
            <a href="#" class="social-link">
              <i class="fab fa-linkedin-in"></i>
            </a>
            <a href="#" class="social-link">
              <i class="fab fa-youtube"></i>
            </a>
          </div>
        </div>
        <div>
          <h3 class="text-xl font-semibold mb-6">{{$t('QuickLinks')}}</h3>
          <ul class="footer-list">
            <li>
              <router-link to="/" class="footer-link">{{$t('home')}}</router-link>
            </li>
            <li>
              <router-link to="/about" class="footer-link">{{$t('about')}}</router-link>
            </li>
            <li>
              <router-link to="/products" class="footer-link">{{$t('products')}}</router-link>
            </li>
            <li>
              <router-link to="/news" class="footer-link">{{$t('news')}}</router-link>
            </li>
            <li>
              <router-link to="/contact" class="footer-link">{{$t('contact')}}</router-link>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-xl font-semibold mb-6">{{$t('OurProducts')}}</h3>
          <ul class="footer-list">
            <li v-for="category in categories.slice(0, 7)" :key="category.id">
              <router-link :to="`/products?category=${category.id}`" class="footer-link">{{ category.name }}</router-link>
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
      <div class="footer-bottom">
        <p class="copyright-text">
          © 2025 {{ companyInfo.company_name || 'Auto Ease Xpert Co., Ltd.' }} All Rights Reserved.
        </p>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'SiteFooter',
  data() {
    return {
      companyInfo: {},
      categories: [],
      defaultAddress: '123 Innovation Drive, Tech Park,  CA 94103, United States',
      defaultCompanyIntro: 'Auto Ease Xpert Co., Ltd. is a leading manufacturer of high-quality automotive electronic products designed to make your driving experience more comfortable and convenient.'
    };
  },
  async created() {
    // 获取公司信息
    try {
      const res = await this.$api.get('company');
      if (res.success && res.data) {
        this.companyInfo = res.data;
      }
    } catch (e) {
      // ignore error
    }
    // 获取产品分类
    try {
      const res = await this.$api.get('categories');
      if (res.success && res.data) {
        this.categories = res.data;
      }
    } catch (e) {
      // ignore error
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';
/* Footer 主容器 */
.footer-container {
  background-color: $gray-800;
  color: $white;
  padding: $spacing-4xl 0 $spacing-2xl;
}

/* Footer 包装器 */
.footer-wrapper {
  max-width: $container-max-width;
  margin: 0 auto;
  padding: 0 $container-padding;
}

/* Footer 网格布局 */
.footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-xl;
  margin-bottom: $spacing-3xl;

  @media (min-width: $breakpoint-tablet) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: $breakpoint-desktop) {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 公司介绍文本 */
.footer-intro {
  color: $gray-400;
  font-size: $font-size-sm;
  margin-bottom: $spacing-lg;
  line-height: $line-height-relaxed;
}

/* 社交媒体链接容器 */
.social-links {
  @include flex-start;
  gap: $spacing-md;
}

/* 社交媒体链接 */
.social-link {
  color: $gray-400;
  transition: $transition-base;
  cursor: pointer;

  &:hover {
    color: $primary-light;
  }
}

/* Footer 列表 */
.footer-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  li {
    @include flex-start;
  }
}

/* 联系人列表 */
.contact-list {
  gap: $spacing-md;

  i {
    color: $primary-color;
    margin-right: $spacing-sm;
    margin-top: 2px;
  }
}

/* Footer 内部链接 */
.footer-link {
  color: $gray-400;
  font-size: 1.125rem; /* text-lg */
  transition: $transition-base;

  &:hover {
    color: $white;
  }
}



/* 联系信息文本 */
.contact-text {
  color: $gray-400;
  font-size: 1.125rem; /* text-lg */
}

/* 底部区域 */
.footer-bottom {
  padding-top: $spacing-md;
  border-top: 1px solid $gray-700;
  text-align: center;
}

/* 版权文本 */
.copyright-text {
  color: $gray-500;
  font-size: $font-size-sm;
}

/* 标题样式 */
h3 {
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  color: $white;
  margin-bottom: $spacing-lg;
}

/* 图片样式 */
img {
  &.h-8 {
    height: 2rem;
    width: auto;
    max-width: 100%;
    margin-bottom: $spacing-lg;
  }

  &.w-24 {
    width: 6rem;
    height: 6rem;
    margin-top: $spacing-lg;
  }
}

/* 确保链接样式正确 */
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
</style>