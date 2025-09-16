// 客户端插件 - 在页面加载时恢复登录状态
export default defineNuxtPlugin(async (nuxtApp) => {
  // 确保只在客户端执行
  if (process.client) {
    try {
      // 获取主store管理器
      const mainStore = useMainStore()
      console.log('checking main store');
      // 恢复登录状态
      if (mainStore && mainStore.restoreLoginState) {
        console.log('restoring login state');
        await mainStore.restoreLoginState()
        console.log('Login state restored successfully')
      }
    } catch (error) {
      console.error('Failed to restore login state:', error)
    }
  }
})