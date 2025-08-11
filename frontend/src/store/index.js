import { createStore } from 'vuex'
import languageModule from './modules/language.js'
import api from '../utils/api.js'

// 货币符号映射
const currencySymbols = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'CNY': '¥',
  'CAD': 'C$',
  'AUD': 'A$',
  'CHF': 'CHF',
  'SEK': 'kr',
  'NOK': 'kr',
  'DKK': 'kr',
  'PLN': 'zł',
  'CZK': 'Kč',
  'HUF': 'Ft',
  'RUB': '₽',
  'BRL': 'R$',
  'MXN': '$',
  'INR': '₹',
  'KRW': '₩',
  'SGD': 'S$',
  'HKD': 'HK$',
  'TWD': 'NT$',
  'THB': '฿',
  'MYR': 'RM',
  'IDR': 'Rp',
  'PHP': '₱',
  'VND': '₫',
  'ZAR': 'R',
  'TRY': '₺',
  'ILS': '₪',
  'AED': 'د.إ',
  'SAR': 'ر.س'
}

// 货币名称映射
const currencyNames = {
  'USD': 'US Dollar',
  'EUR': 'Euro',
  'GBP': 'British Pound',
  'JPY': 'Japanese Yen',
  'CNY': 'Chinese Yuan',
  'CAD': 'Canadian Dollar',
  'AUD': 'Australian Dollar',
  'CHF': 'Swiss Franc',
  'SEK': 'Swedish Krona',
  'NOK': 'Norwegian Krone',
  'DKK': 'Danish Krone',
  'PLN': 'Polish Zloty',
  'CZK': 'Czech Koruna',
  'HUF': 'Hungarian Forint',
  'RUB': 'Russian Ruble',
  'BRL': 'Brazilian Real',
  'MXN': 'Mexican Peso',
  'INR': 'Indian Rupee',
  'KRW': 'South Korean Won',
  'SGD': 'Singapore Dollar',
  'HKD': 'Hong Kong Dollar',
  'TWD': 'Taiwan Dollar',
  'THB': 'Thai Baht',
  'MYR': 'Malaysian Ringgit',
  'IDR': 'Indonesian Rupiah',
  'PHP': 'Philippine Peso',
  'VND': 'Vietnamese Dong',
  'ZAR': 'South African Rand',
  'TRY': 'Turkish Lira',
  'ILS': 'Israeli Shekel',
  'AED': 'UAE Dirham',
  'SAR': 'Saudi Riyal'
}

// 获取货币名称
function getCurrencyName(code) {
  return currencyNames[code] || code
}

export default createStore({
  state: {
    admin: null,
    user: null,
    userCurrency: 'USD', // 用户货币设置
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
      if (user) {
        // 如果用户数据包含currency字段，则更新userCurrency
        if (user.currency) {
          state.userCurrency = user.currency
        }
        if (user.role === 'admin') {
          state.isAdminLoggedIn = true
        } else {
          state.isLoggedIn = true
        }
      }
    },
    setUserCurrency(state, currency) {
      state.userCurrency = currency
    },
    setCategories(state, categories) {
      state.categories = categories
    },
    addToCart(state, product) {
      const existingItem = state.cartItems.find(item => item.id === product.id)
      if (existingItem) {
        existingItem.quantity += product.quantity || 1
      } else {
        state.cartItems.push({
          ...product,
          quantity: product.quantity || 1
        })
      }
    },
    removeFromCart(state, productId) {
      state.cartItems = state.cartItems.filter(item => item.id !== productId)
    },
    updateCartItemQuantity(state, { productId, quantity }) {
      const item = state.cartItems.find(item => item.id === productId)
      if (item) {
        item.quantity = quantity
      }
    },
    clearCart(state) {
      state.cartItems = []
    },
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
            commit('setUser', response.data.user)
        }
      } catch (error) {
        // token无效或不存在，保持未登录状态
        console.log('未找到有效的登录状态')
      }
    },

 
    logout({ commit }) {
      commit('setUser', null)
      // 登出时重置货币为默认值
      commit('setUserCurrency', 'USD')
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
    cartItemCount: (state) => {
      return state.cartItems.reduce((total, item) => total + item.quantity, 0)
    },
    cartTotal: (state) => {
      return state.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
    },
    // 获取当前用户的货币符号
    currencySymbol: (state) => {
      return currencySymbols[state.userCurrency] || '$'
    },
    // 格式化价格显示
    formatPrice: (state, getters) => (price) => {
      if (price === null || price === undefined) return ''
      const symbol = getters.currencySymbol
      const formattedPrice = parseFloat(price).toFixed(2)
      return `${symbol}${formattedPrice}`
    },
    // 格式化价格范围显示
    formatPriceRange: (_state, getters) => (priceRanges) => {
      if (!Array.isArray(priceRanges) || priceRanges.length === 0) {
        return ''
      }

      const symbol = getters.currencySymbol
      const sortedRanges = [...priceRanges].sort((a, b) => a.min_quantity - b.min_quantity)
      
      return sortedRanges.map(range => {
        const price = `${symbol}${parseFloat(range.price).toFixed(2)}`
        if (range.max_quantity === null || range.max_quantity === undefined) {
          return `${range.min_quantity}+ pcs: ${price}`
        } else if (range.min_quantity === range.max_quantity) {
          return `${range.min_quantity} pc: ${price}`
        } else {
          return `${range.min_quantity}-${range.max_quantity} pcs: ${price}`
        }
      }).join('; ')
    },
    // 根据数量获取对应的价格
    getPriceByQuantity: () => (priceRanges, quantity) => {
      if (!Array.isArray(priceRanges) || priceRanges.length === 0) {
        return null
      }

      for (const range of priceRanges) {
        if (quantity >= range.min_quantity) {
          if (range.max_quantity === null || range.max_quantity === undefined || quantity <= range.max_quantity) {
            return range.price
          }
        }
      }
      
      return null
    },
    // 获取所有支持的货币列表
    supportedCurrencies: () => {
      return Object.keys(currencySymbols).map(code => ({
        code,
        symbol: currencySymbols[code],
        name: getCurrencyName(code)
      }))
    },
    // 登录对话框状态
    showLoginDialog: state => state.showLoginDialog
  },
  modules: {
    language: languageModule
  }
})