import { defineStore } from 'pinia'

export const useCompanyStore = defineStore('companyInfo', {
  state: () => ({
    companyInfo: {},
    categories: [],
    banners :[] // Banner 数据    
  }),
  actions: {
    async fetchCompanyInfo() {
      try {
         if (!this.companyInfo || Object.keys(this.companyInfo).length === 0) {
          const { $api } = useNuxtApp()
          const response = await $api.get('/company')
          this.companyInfo = response.data || {}
        }
      } catch (error) {
        console.error('获取公司信息失败:', error)
        this.companyInfo = {}
      }
    },
    // 获取分类数据
    async fetchCategories()  {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get('categories')
        if (response.success) {
          this.categories = response.data;
        }
      } catch (error) {
        console.error('获取分类失败:', error)
      }
    },

    // 获取 Banner 数据
    async fetchBanners ()  {
      try {
        console.log('fetch banners');
        const { $api } = useNuxtApp()
        const response = await $api.get('banners/active')
        if (response.success) {
          this.banners = response.data;
        }
      } catch (error) {
        console.error('获取 Banner 失败:', error)
      }
    },
    async init() {
      if (process.server) {
        await Promise.all([
        this.fetchCategories(),
        this.fetchBanners(),
        this.fetchCompanyInfo(),
        ])        
      }

    },
  },
})