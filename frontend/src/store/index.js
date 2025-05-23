import { createStore } from 'vuex'
import languageModule from './modules/language.js'

export default createStore({
  state: {
    user: null,
    isLoggedIn: false,
    cart: [],
    categories: []
  },
  mutations: {
    setUser(state, user) {
      state.user = user
      state.isLoggedIn = !!user
    },
    setCategories(state, categories) {
      state.categories = categories
    },
    
    addToCart(state, product) {
      const existItem = state.cart.find(item => item.id === product.id)
      if (existItem) {
        existItem.quantity += 1
      } else {
        state.cart.push({
          ...product,
          quantity: 1
        })
      }
    },
    removeFromCart(state, productId) {
      state.cart = state.cart.filter(item => item.id !== productId)
    }
  },
  actions: {
    // 初始化应用
    initApp({ dispatch }) {
      // 返回Promise以支持then调用
      return new Promise((resolve) => {
        // 初始化语言设置
        dispatch('language/initLanguage', null, { root: true })
          .then(() => {
            // 获取分类数据
            return dispatch('fetchCategories')
          })
          .then(() => {
            // 初始化完成
            resolve()
          })
          .catch(error => {
            console.error('初始化应用失败:', error)
            // 即使出错也要resolve，确保应用能够挂载
            resolve()
          })
      })
    },
    login({ commit }, credentials) {
      // 实际项目中这里会调用登录API
      return new Promise((resolve) => {
        setTimeout(() => {
          const user = {
            id: 1,
            username: credentials.username,
            email: 'user@example.com'
          }
          commit('setUser', user)
          resolve(user)
        }, 1000)
      })
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
    user: state => state.user,
    cartItemCount: state => state.cart.reduce((total, item) => total + item.quantity, 0),
    cartTotalPrice: state => state.cart.reduce((total, item) => total + item.price * item.quantity, 0)
  },
  modules: {
    language: languageModule
  }
})