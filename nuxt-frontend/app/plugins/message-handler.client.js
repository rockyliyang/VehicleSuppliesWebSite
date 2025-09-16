import { defineNuxtPlugin } from '#app'
import MessageHandler from '~/utils/messageHandler.js'

export default defineNuxtPlugin((nuxtApp) => {
  // 注册为全局属性，支持 this.$messageHandler 访问
  // MessageHandler 的方法都是静态方法，直接使用类本身
  nuxtApp.vueApp.config.globalProperties.$messageHandler = MessageHandler
  
  return {
    provide: {
      messageHandler: MessageHandler
    }
  }
})