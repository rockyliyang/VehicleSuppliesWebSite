<template>
  <footer class="bg-gray-900 text-white pt-16 pb-8">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div>
          <img
            :src="companyInfo.logo_url || 'https://static.readdy.ai/image/01b5af88fa941f59119e27a41ea4862d/63b7adac1fa1c8b6813bfaf6742a426b.png'"
            :alt="companyInfo.company_name || 'Auto Ease Tech X Logo'" class="h-8 w-auto mb-6" />
          <p class="text-gray-400 mb-6">
            {{ companyInfo.company_intro || defaultCompanyIntro }}
          </p>
          <div class="flex space-x-4">
            <a href="#" class="text-gray-400 hover:text-white transition duration-300 cursor-pointer">
              <i class="fab fa-facebook-f"></i>
            </a>
            <a href="#" class="text-gray-400 hover:text-white transition duration-300 cursor-pointer">
              <i class="fab fa-twitter"></i>
            </a>
            <a href="#" class="text-gray-400 hover:text-white transition duration-300 cursor-pointer">
              <i class="fab fa-instagram"></i>
            </a>
            <a href="#" class="text-gray-400 hover:text-white transition duration-300 cursor-pointer">
              <i class="fab fa-linkedin-in"></i>
            </a>
            <a href="#" class="text-gray-400 hover:text-white transition duration-300 cursor-pointer">
              <i class="fab fa-youtube"></i>
            </a>
          </div>
        </div>
        <div>
          <h3 class="text-xl font-semibold mb-6">{{$t('QuickLinks')}}</h3>
          <ul class="space-y-3">
            <li>
              <router-link to="/"
                class="text-gray-400 hover:text-white transition duration-300">{{$t('home')}}</router-link>
            </li>
            <li>
              <router-link to="/about"
                class="text-gray-400 hover:text-white transition duration-300">{{$t('about')}}</router-link>
            </li>
            <li>
              <router-link to="/products"
                class="text-gray-400 hover:text-white transition duration-300">{{$t('products')}}</router-link>
            </li>
            <li>
              <router-link to="/news"
                class="text-gray-400 hover:text-white transition duration-300">{{$t('news')}}</router-link>
            </li>
            <li>
              <router-link to="/contact"
                class="text-gray-400 hover:text-white transition duration-300">{{$t('contact')}}</router-link>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-xl font-semibold mb-6">{{$t('OurProducts')}}</h3>
          <ul class="space-y-3">
            <li v-for="category in categories.slice(0, 7)" :key="category.id">
              <router-link :to="`/products?category=${category.id}`"
                class="text-gray-400 hover:text-white transition duration-300">{{ category.name }}</router-link>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-xl font-semibold mb-6">{{$t('ContactInfo')}}</h3>
          <ul class="space-y-4">
            <li class="flex items-start">
              <i class="fas fa-map-marker-alt text-red-600 mt-1 mr-3"></i>
              <span class="text-gray-400">{{ companyInfo.address || defaultAddress }}</span>
            </li>
            <li class="flex items-center">
              <i class="fas fa-phone-alt text-red-600 mr-3"></i>
              <span class="text-gray-400">{{ companyInfo.phone || '+1 (800) 567-8901' }}</span>
            </li>
            <li class="flex items-center">
              <i class="fas fa-envelope text-red-600 mr-3"></i>
              <span class="text-gray-400">{{ companyInfo.email || 'info@autoeasexpert.com' }}</span>
            </li>
            <li class="flex items-center">
              <i class="fas fa-clock text-red-600 mr-3"></i>
              <span class="text-gray-400">{{ companyInfo.business_hours || 'Mon-Fri: 9:00 AM - 6:00 PM' }}</span>
            </li>
          </ul>
          <div class="mt-6" v-if="companyInfo.wechat_qrcode">
            <img :src="companyInfo.wechat_qrcode" alt="QR Code" class="w-24 h-24" />
          </div>
        </div>
      </div>
      <div class="pt-4 border-t border-gray-800 text-center">
        <p class="text-gray-500">
          © 2025 {{ companyInfo.company_name || 'Auto Ease Xpert Co., Ltd.' }} All Rights Reserved.
        </p>
      </div>
    </div>
  </footer>
</template>

<script>
//import { LocationInformation, PhoneFilled, Message } from '@element-plus/icons-vue';
export default {
  name: 'SiteFooter',
  //components: { LocationInformation, PhoneFilled, Message },
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

<style scoped>
/* 完整的Tailwind CSS类定义 */
.bg-gray-900 {
  background-color: #111827;
}

.text-white {
  color: #ffffff;
}

.pt-16 {
  padding-top: 4rem;
}

.pb-8 {
  padding-bottom: 2rem;
}

.container {
  max-width: 1280px;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.grid {
  display: grid;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.gap-8 {
  gap: 2rem;
}

.mb-12 {
  margin-bottom: 3rem;
}

.h-8 {
  height: 2rem;
}

.h-12 {
  height: 3rem;
}

.w-auto {
  width: auto;
  max-width: 100%;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.text-gray-400 {
  color: #9ca3af;
}

.flex {
  display: flex;
}

.space-x-4> :not([hidden])~ :not([hidden]) {
  margin-left: 1rem;
}

.text-xl {
  font-size: 1.25rem;
  line-height: 1.75rem;
}

.font-semibold {
  font-weight: 600;
}

.space-y-3> :not([hidden])~ :not([hidden]) {
  margin-top: 0.75rem;
}

.space-y-4> :not([hidden])~ :not([hidden]) {
  margin-top: 1rem;
}

.items-start {
  align-items: flex-start;
}

.items-center {
  align-items: center;
}

.text-red-600 {
  color: #dc2626;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mr-3 {
  margin-right: 0.75rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.mt-6 {
  margin-top: 1.5rem;
}

.w-24 {
  width: 6rem;
}

.h-24 {
  height: 6rem;
}

.pt-8 {
  padding-top: 2rem;
}

.border-t {
  border-top-width: 1px;
}

.border-gray-800 {
  border-color: #1f2937;
}

.text-center {
  text-align: center;
}

.flex-wrap {
  flex-wrap: wrap;
}

.justify-center {
  justify-content: center;
}

.gap-4 {
  gap: 1rem;
}

.text-2xl {
  font-size: 1.5rem;
  line-height: 2rem;
}

.text-gray-500 {
  color: #6b7280;
}

.hover\:text-white:hover {
  color: #ffffff;
}

.transition {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.duration-300 {
  transition-duration: 300ms;
}

.cursor-pointer {
  cursor: pointer;
}

/* 响应式设计 */
@media (min-width: 768px) {
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
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