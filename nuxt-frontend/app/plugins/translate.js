import { defineNuxtPlugin } from '#app'
import { nextTick } from 'vue'
import { useLanguageStore } from '~/stores/language'

export default defineNuxtPlugin(async (nuxtApp) => {
  const languageStore = useLanguageStore()
  
  // 等待api插件初始化完成
  await nuxtApp.hooks.callHook('app:created')
  
  const translate = (key, defaultText = '') => {
    try {
      const translateFn = languageStore.translate
      if (typeof translateFn === 'function') {
        return translateFn(key, defaultText) || defaultText
      }
      return defaultText
    } catch (error) {
      console.warn('Translation error for key:', key, error)
      return defaultText
    }
  }
  
  // 延迟初始化语言数据，避免循环依赖
  if (process.client) {
    // 客户端环境下在下一个tick初始化
    await nextTick()
    try {
      await languageStore.initLanguage()
    } catch (error) {
      console.warn('Language initialization failed:', error)
    }
  } else {
    // 服务端环境下直接初始化
    try {
      await languageStore.initLanguage()
    } catch (error) {
      console.warn('Language initialization failed:', error)
    }
  }
  
  return {
    provide: {
      t: translate
    }
  }
})