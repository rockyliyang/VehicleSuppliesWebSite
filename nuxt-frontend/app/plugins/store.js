// Store Plugin - 封装所有store的使用
import { useMainStore } from '~/stores'
import { useCompanyStore } from '~/stores/companyInfo'
import { useCountryStateStore } from '~/stores/countryState'
import { useLanguageStore } from '~/stores/language'

export default defineNuxtPlugin(() => {
  // 创建store实例
  const mainStore = useMainStore()
  const companyStore = useCompanyStore()
  const languangeStore = useLanguageStore()
  const countryStateStore = useCountryStateStore()

  // 统一的store接口
  const storeManager = {
    formatPrice: (price) => mainStore.formatPrice(price),
    formatPriceRange: (price) => mainStore.formatPriceRange(price),
    // 认证相关
    auth: {
      get isLoggedIn() { return mainStore.isLoggedIn },
      get user() { return mainStore.user },
      get userInfo() { return mainStore.userInfo },
      setUser: (user) => mainStore.setUser(user),
      logout: () => mainStore.logout(),
      checkAuth: () => mainStore.checkAuth(),
      restoreLoginState: ()=>mainStore.restoreLoginState()
    },

    language: {
      get currentLanguage() {return languangeStore.getCurrentLanguage},
      get supportedLanguages() {return languangeStore.getSupportedLanguages},
      setLanguage: (lang) => languangeStore.setLanguage(lang)
    },
    // 公司信息相关
    company: {
      get info() { return companyStore.companyInfo },
      get categories() { return companyStore.categories },
      get banners() { return companyStore.banners },
      fetchInfo: () => companyStore.fetchCompanyInfo(),
      fetchCategories: () => companyStore.fetchCategories(),
      fetchBanners: () => companyStore.fetchBanners(),
      init: () => companyStore.init()
    },

    // 地理位置相关
    location: {
      get countries() { return countryStateStore.getCountries },
      get statesData() { return countryStateStore.getStatesData },

      getStatesByCountry: (countryCode) => countryStateStore.getStatesByCountry(countryCode),
      getCountryByCode: (countryCode) => countryStateStore.getCountryByCode(countryCode),
      getCountryName: (countryCode) => countryStateStore.getCountryName(countryCode),
      loadCountryStateData:() => countryStateStore.loadCountryStateData()
    },

    // 初始化所有store
    async initAll() {
      await Promise.all([
        companyStore.fetchCompanyInfo(),
        companyStore.fetchCategories(),
        countryStateStore.fetchCountries()
      ])
    },

    // 获取原始store实例（如果需要直接访问）
    getRawStores() {
      return {
        main: mainStore,
        company: companyStore,
        countryState: countryStateStore
      }
    }
  }

  // 将store管理器注入到Nuxt应用中
  return {
    provide: {
      store: storeManager
    }
  }
})