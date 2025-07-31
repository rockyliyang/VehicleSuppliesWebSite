import { createStore } from 'vuex'
import languageModule from './modules/language.js'
import api from '../utils/api.js'

export default createStore({
  state: {
    admin: null,
    user: null,
    isLoggedIn: false,
    isAdminLoggedIn: false,
    categories: [],
    // 购物车状态
    cartItems: [],
    // 登录对话框状态
    showLoginDialog: false
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
    // 购物车相关mutations
    addToCart(state, item) {
      const existingItem = state.cartItems.find(cartItem => cartItem.id === item.id)
      if (existingItem) {
        existingItem.quantity += item.quantity || 1
      } else {
        state.cartItems.push({ ...item, quantity: item.quantity || 1 })
      }
    },
    removeFromCart(state, itemId) {
      state.cartItems = state.cartItems.filter(item => item.id !== itemId)
    },
    updateCartItemQuantity(state, { itemId, quantity }) {
      const item = state.cartItems.find(cartItem => cartItem.id === itemId)
      if (item) {
        item.quantity = quantity
      }
    },
    clearCart(state) {
      state.cartItems = []
    },
    // 登录对话框相关mutations
    setShowLoginDialog(state, show) {
      state.showLoginDialog = show
    }
    

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
      // 登出时清空购物车
      commit('clearCart')
    },
    // 显示登录对话框
    showLoginDialog({ commit }) {
      commit('setShowLoginDialog', true)
    },
    // 隐藏登录对话框
    hideLoginDialog({ commit }) {
      commit('setShowLoginDialog', false)
    },
    // 购物车相关actions
    addToCart({ commit }, item) {
      commit('addToCart', item)
    },
    removeFromCart({ commit }, itemId) {
      commit('removeFromCart', itemId)
    },
    updateCartItemQuantity({ commit }, payload) {
      commit('updateCartItemQuantity', payload)
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
    user: state => state.user,
    // 购物车相关getters
    cartItems: state => state.cartItems,
    cartItemCount: state => state.cartItems.reduce((total, item) => total + item.quantity, 0),
    cartTotal: state => state.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0),
    // 登录对话框状态
    showLoginDialog: state => state.showLoginDialog
  },
  modules: {
    language: languageModule
  }
})