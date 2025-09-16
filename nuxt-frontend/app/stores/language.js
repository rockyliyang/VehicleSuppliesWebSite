import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLanguageStore = defineStore('language', () => {
  // State
  const currentLanguage = ref('en')
  const supportedLanguages = ref([])
  const translations = ref({})
  const isLoading = ref(false)

  // Getters
  const translate = computed(() => {
    return (key, defaultText = '') => {
      if (!translations.value || Object.keys(translations.value).length === 0) {
        return defaultText || key
      }
      
      const translatedText = translations.value[key]
      if (translatedText) {
        return translatedText
      }
      
      return defaultText || key
    }
  })

  const getCurrentLanguage = computed(() => currentLanguage.value)
  const getSupportedLanguages = computed(() => supportedLanguages.value)
  const getTranslations = computed(() => translations.value)

  // 默认支持语言列表
  const getDefaultSupportedLanguages = () => {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'zh-CN', name: '中文', flag: '🇨🇳' }
    ]
  }


  // Actions
  const setLanguage = (language) => {
    currentLanguage.value = language
    if (process.client) {
      localStorage.setItem('language', language)
    }
  }

  const setTranslations = (translationData) => {
    translations.value = translationData
  }

  const setSupportedLanguages = (languages) => {
    supportedLanguages.value = languages
  }

  const setLoading = (loading) => {
    isLoading.value = loading
  }

  const initLanguage = async () => {
    try {
      setLoading(true)
      
      let language = 'en' // 默认语言
      
      // 客户端环境下从localStorage获取语言设置
      if (process.client) {
        const savedLanguage = localStorage.getItem('language')
        if (savedLanguage) {
          language = savedLanguage
        } else {
          // 如果没有保存的语言设置，尝试从IP检测
          try {
            const { $api } = useNuxtApp()
            if ($api) {
              const response = await $api.get('/language/detect-by-ip')
              if (response.success && response.data.language) {
                language = response.data.language
              }
            }
          } catch (error) {
            console.warn('Failed to detect language by IP:', error)
          }
        }
      }
      
      setLanguage(language)
      
      // 加载翻译数据和支持的语言列表
      await Promise.all([
        loadTranslations(language),
        loadSupportedLanguages()
      ])
    } catch (error) {
      console.error('Failed to initialize language:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTranslations = async (language) => {
    try {
      let response

        // 客户端使用 $api
        try {
          const nuxtApp = useNuxtApp()
          
          if (nuxtApp && nuxtApp.$api) {
            console.log('API service is Normal')
            response = await nuxtApp.$api.get(`/language/translations/${language}`)
          } else {
            console.warn('API service not available, using default translations')
            return
          }
        } catch (apiError) {
          console.warn('API service not available, using default translations')
          return
        }
      
      
      if (response && response.success && response.data) {
        setTranslations(response.data)
        return
      }
      
    } catch (error) {
      console.warn('Failed to load translations, using defaults:', error.message)
      // 使用默认翻译数据作为 fallback
    }
  }

  const loadSupportedLanguages = async () => {
    try {
      let response
      
        // 客户端使用 $api
        try {
          const nuxtApp = useNuxtApp()
          if (nuxtApp && nuxtApp.$api) {
            response = await nuxtApp.$api.get('/language/supported')
          } else {
            console.warn('API service not available, using default supported languages')
            return
          }
        } catch (apiError) {
          console.warn('API service not available, using default supported languages')
          return
        }

      
      if (response && response.success && response.data) {
        setSupportedLanguages(response.data)
        return
      }

    } catch (error) {
      console.warn('Failed to load supported languages, using defaults:', error.message)

    }
  }

  const changeLanguage = async (language) => {
    try {
      setLoading(true)
      setLanguage(language)
      await loadTranslations(language)
    } catch (error) {
      console.error('Failed to change language:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    // State
    currentLanguage,
    supportedLanguages,
    translations,
    isLoading,
    
    // Getters
    translate,
    getCurrentLanguage,
    getSupportedLanguages,
    getTranslations,
    
    // Actions
    setLanguage,
    setTranslations,
    setSupportedLanguages,
    setLoading,
    initLanguage,
    loadTranslations,
    loadSupportedLanguages,
    changeLanguage
  }
})