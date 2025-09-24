// 统一的 company store 初始化插件
export default defineNuxtPlugin(async (nuxtApp) => {
  try {
    // 获取 company store 实例
    const companyStore = useCompanyStore()
    
      // 客户端：检查数据是否存在，避免重复请求
      if (!companyStore.banners.length || !companyStore.categories.length) {
        await companyStore.init()
        console.log('✅ Company store 初始化完成')
      } else {
        console.log('✅ Company store 数据已存在，跳过初始化')
      }
    
  } catch (error) {
    const env = process.server ? 'SSR' : '客户端'
    console.error(`❌ Company store ${env}初始化失败:`, error)
  }
})