import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: null,
    isLoggedIn: false,
    cart: [],
    categories: [],
    products: [],
    banners: []
  },
  mutations: {
    setUser(state, user) {
      state.user = user
      state.isLoggedIn = !!user
    },
    setCategories(state, categories) {
      state.categories = categories
    },
    setProducts(state, products) {
      state.products = products
    },
    setBanners(state, banners) {
      state.banners = banners
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
    fetchProducts({ commit }) {
      // 实际项目中这里会调用API
      return new Promise((resolve) => {
        setTimeout(() => {
          // 模拟数据
          const products = [
            // 产品数据会从后端获取
          ]
          commit('setProducts', products)
          resolve(products)
        }, 500)
      })
    },
    fetchBanners({ commit }) {
      // 实际项目中这里会调用API
      return new Promise((resolve) => {
        setTimeout(() => {
          // 模拟数据
          const banners = [
            // Banner数据会从后端获取
          ]
          commit('setBanners', banners)
          resolve(banners)
        }, 500)
      })
    }
  },
  getters: {
    isLoggedIn: state => state.isLoggedIn,
    user: state => state.user,
    cartItemCount: state => state.cart.reduce((total, item) => total + item.quantity, 0),
    cartTotalPrice: state => state.cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }
})