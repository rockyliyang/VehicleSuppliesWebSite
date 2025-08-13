import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
// Element Plus 现在通过按需引入自动处理
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './assets/css/global.css'
import './assets/styles/elegant-messages.scss'
// Material Icons
import 'material-icons/iconfont/material-icons.css'
// Font Awesome
import '@fortawesome/fontawesome-free/css/all.css'
import api from './utils/api'
import MessageHandler from './utils/messageHandler'
import { createTranslateFunction } from './utils/cartUtils'
import mitt from 'mitt'

const app = createApp(App)

// 全局注册API工具，替换axios
app.config.globalProperties.$api = api
app.config.globalProperties.$axios = api

// 添加翻译函数 - 使用公共翻译函数实现
app.config.globalProperties.$t = function(key, defaultValue = key) {
  // 使用公共翻译函数，确保一致性
  const translate = createTranslateFunction(this.$store)
  return translate(key, defaultValue)
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
// Element Plus 组件现在通过按需引入自动注册

// 注册所有Element Plus图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 初始化应用（包括语言设置）
store.dispatch('initApp').then(() => {
  app.use(router)
  app.mount('#app')

})