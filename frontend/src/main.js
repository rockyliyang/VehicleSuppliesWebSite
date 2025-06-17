import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/css/global.css'
import './assets/styles/elegant-messages.scss'
import api from './utils/api'
import MessageHandler from './utils/messageHandler'
import mitt from 'mitt'

const app = createApp(App)

// 全局注册API工具，替换axios
app.config.globalProperties.$api = api
app.config.globalProperties.$axios = api

// 添加翻译函数 - 使用响应式实现
app.config.globalProperties.$t = function(key, defaultValue = key) {
  // 通过this访问当前组件实例，确保响应式更新
  return this.$store.getters['language/translate'](key) || defaultValue
}

// 全局注册消息处理器
app.config.globalProperties.$messageHandler = MessageHandler
window.addEventListener('error', (e) => {
  console.error("捕获到全局错误:", e.message, e.error);
});


// 创建事件总线用于组件间通信
const emitter = mitt()
app.config.globalProperties.$bus = emitter

app.use(store)
app.use(ElementPlus)

// 初始化应用（包括语言设置）
store.dispatch('initApp').then(() => {
  app.use(router)
  app.mount('#app')

})