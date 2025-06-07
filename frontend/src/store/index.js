import { createStore } from 'vuex'
import languageModule from './modules/language.js'
import api from '../utils/api.js'

export default createStore({
  state: {
    admin: null,
    user: null,
    isLoggedIn: false,
    isAdminLoggedIn: false,
    categories: []
  },
  mutations: {
    
    setUser(state, user) {
      state.user = user
      state.isAdminLoggedIn = false
      state.isLoggedIn = false
      if (user)
      {
        if (user.role === 'admin') {
          state.isAdminLoggedIn = true
        }else {
          state.isLoggedIn = true
        }
      }

    },
    setCategories(state, categories) {
      state.categories = categories
    },
    

  },
  actions: {
    // 初始化应用
    async initApp({ dispatch }) {
      try {
        // 首先尝试恢复登录状态
        await dispatch('restoreLoginState')
        
        // 初始化语言设置
        await dispatch('language/initLanguage', null, { root: true })
        
        // 获取分类数据
        await dispatch('fetchCategories')
      } catch (error) {
        console.error('初始化应用失败:', error)
      }
    },
    
    // 从cookie恢复登录状态
    async restoreLoginState({ commit }) {
      try {
        // 调用check-token接口，如果cookie中有有效token，后端会验证并返回用户信息
        const response = await api.post('/users/check-token')
        if (response.success) {
            commit('setUser', response.data)
        }
      } catch (error) {
        // token无效或不存在，保持未登录状态
        console.log('未找到有效的登录状态')
      }
    },
 
    logout({ commit }) {
      commit('setUser', null)
    },
    fetchCategories({ commit }) {
      // 实际项目中这里会调用API
      return new Promise((resolve) => {
        setTimeout(() => {
          const categories = [
            { id: 1, name: '汽车吸尘器' },
            { id: 2, name: '车载充电器' },
            { id: 3, name: '汽车应急启动电源' },
            { id: 4, name: '其他' }
          ]
          commit('setCategories', categories)
          resolve(categories)
        }, 500)
      })
    },

  },
  getters: {
    isLoggedIn: state => state.isLoggedIn,
    user: state => state.user
  },
  modules: {
    language: languageModule
  }
})