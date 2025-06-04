import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/css/global.css'
import './assets/css/elegant-messages.css'
import api from './utils/api'
import ErrorHandler from './utils/errorHandler'

const app = createApp(App)

// 全局注册API工具，替换axios
app.config.globalProperties.$api = api
app.config.globalProperties.$axios = api

// 添加翻译函数
app.config.globalProperties.$t = (key) => {
  return store.getters['language/translate'](key)
}

// 全局注册错误处理器
app.config.globalProperties.$errorHandler = ErrorHandler

app.use(router)
app.use(store)
app.use(ElementPlus)

// 初始化应用（包括语言设置）
store.dispatch('initApp').then(() => {
  app.mount('#app')
})