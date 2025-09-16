import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

export const useMainStore = defineStore('main', () => {
  // State
  const admin = ref(null)
  const user = ref(null)
  const userCurrency = ref('USD') // 用户货币设置
  const isLoggedIn = ref(false)
  const isAdminLoggedIn = ref(false)
  const isBusinessLoggedIn = ref(false)

  // Getters

  // 获取当前用户的货币符号
  const currencySymbol = computed(() => {
    return currencySymbols[userCurrency.value] || '$'
  })

  // 格式化价格显示
  const formatPrice = computed(() => {
    return (price) => {
      if (price === null || price === undefined) return ''
      const symbol = currencySymbol.value
      const formattedPrice = parseFloat(price).toFixed(2)
      return `${symbol}${formattedPrice}`
    }
  })

  // 格式化价格范围显示
  const formatPriceRange = computed(() => {
    return (priceRanges) => {
      if (!Array.isArray(priceRanges) || priceRanges.length === 0) {
        return ''
      }

      const symbol = currencySymbol.value
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
    }
  })

  // 根据数量获取对应的价格
  const getPriceByQuantity = computed(() => {
    return (priceRanges, quantity) => {
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
    }
  })

  // 获取所有支持的货币列表
  const supportedCurrencies = computed(() => {
    return Object.keys(currencySymbols).map(code => ({
      code,
      symbol: currencySymbols[code],
      name: getCurrencyName(code)
    }))
  })

  // Actions
  const setUser = (userData) => {
    user.value = userData
    isAdminLoggedIn.value = false
    isBusinessLoggedIn.value = false
    isLoggedIn.value = false
    if (userData) {
      // 如果用户数据包含currency字段，则更新userCurrency
      if (userData.currency) {
        userCurrency.value = userData.currency
      }
      if (userData.role === 'admin') {
        isAdminLoggedIn.value = true
      } else if (userData.role === 'business') {
        isBusinessLoggedIn.value = true
      } else {
        isLoggedIn.value = true
      }
    }
  }

  const setUserCurrency = (currency) => {
    userCurrency.value = currency
  }



  // 初始化应用
  const initApp = async () => {
    try {
      // 首先尝试恢复登录状态
      await restoreLoginState()

    } catch (error) {
      console.error('初始化应用失败:', error)
    }
  }

  // 从cookie恢复登录状态
  const restoreLoginState = async () => {
    try {
      // 调用check-token接口，如果cookie中有有效token，后端会验证并返回用户信息
      const { $api } = useNuxtApp()
      const response = await $api.post('/users/check-token')
      if (response.success) {
        setUser(response.data.user)
      }
    } catch (error) {
      // token无效或不存在，保持未登录状态
      console.log('未找到有效的登录状态')
    }
  }

  const logout = () => {
    setUser(null)
    // 登出时重置货币为默认值
    setUserCurrency('USD')
  }




  return {
    // State
    admin,
    user,
    userCurrency,
    isLoggedIn,
    isAdminLoggedIn,
    isBusinessLoggedIn,
    
    // Getters
    currencySymbol,
    formatPrice,
    formatPriceRange,
    getPriceByQuantity,
    supportedCurrencies,
    
    // Actions
    setUser,
    setUserCurrency,
    initApp,
    restoreLoginState,
    logout
  }
})