import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCountryStateStore = defineStore('countryState', () => {
  // State
  const countries = ref([])
  const statesData = ref({})
  const lastModified = ref({
    countries: null,
    states: null
  })
  const loading = ref(false)
  const loaded = ref(false)

  // Getters
  const getCountries = computed(() => countries.value)
  const getStatesData = computed(() => statesData.value)
  const isLoading = computed(() => loading.value)
  const isLoaded = computed(() => loaded.value)
  
  // 根据国家代码获取省份列表
  const getStatesByCountry = computed(() => {
    return (countryCode) => {
      // 先根据国家代码找到国家ID
      const country = countries.value.find(c => c.iso3 === countryCode)
      if (!country) return []
      return statesData.value[country.id] || []
    }
  })
  
  // 根据国家代码获取国家信息
  const getCountryByCode = computed(() => {
    return (countryCode) => {
      return countries.value.find(country => country.iso3 === countryCode)
    }
  })
  
  // 根据国家代码获取国家名称
  const getCountryName = computed(() => {
    return (countryCode) => {
      const country = countries.value.find(c => c.iso3 === countryCode)
      return country ? country.name : countryCode
    }
  })

  // Actions
  const setLoading = (isLoading) => {
    loading.value = isLoading
  }

  const setCountries = (countriesData) => {
    countries.value = countriesData
  }

  const setStatesData = (statesDataValue) => {
    statesData.value = statesDataValue
  }

  const setLastModified = (lastModifiedData) => {
    lastModified.value = lastModifiedData
  }

  const setLoaded = (isLoaded) => {
    loaded.value = isLoaded
  }

  // 构建省份数据结构的辅助函数
  const buildStatesData = (states) => {
    const statesDataResult = {}
    states.forEach(state => {
      if (!statesDataResult[state.country_id]) {
        statesDataResult[state.country_id] = []
      }
      statesDataResult[state.country_id].push(state)
    })
    return statesDataResult
  }

  const loadCountryStateData = async () => {
    // 如果已经加载过且不是强制刷新，直接返回
    if (loaded.value && countries.value.length > 0) {
      return
    }

    try {
      setLoading(true)
      
      // 从localStorage获取缓存的数据和时间戳
      let cachedData = null
      let cachedLastModified = {}
      
      if (process.client) {
        const cachedDataStr = localStorage.getItem('countryStateData')
        const cachedLastModifiedStr = localStorage.getItem('countryStateDataLastModified')
        
        if (cachedDataStr) {
          cachedData = JSON.parse(cachedDataStr)
        }
        if (cachedLastModifiedStr) {
          cachedLastModified = JSON.parse(cachedLastModifiedStr)
        }
      }
      
      if (cachedData && cachedLastModified.countries && cachedLastModified.states) {
        // 使用缓存的数据
        setCountries(cachedData.countries || [])
        setStatesData(buildStatesData(cachedData.states || []))
        setLastModified(cachedLastModified)
        setLoaded(true)
      }
      
      // 向后端请求数据，带上最后修改时间
      const params = {}
      if (cachedLastModified.countries) {
        params.countries_last_modified = cachedLastModified.countries
      }
      if (cachedLastModified.states) {
        params.states_last_modified = cachedLastModified.states
      }
      
      const { $api } = useNuxtApp()
      const response = await $api.get('/users/country-state-data', { params })
      
      if (response.data && response.success) {
        const responseData = response.data
        
        if (responseData && responseData.updated) {
          // 数据有更新，保存到store和localStorage
          const countriesData = responseData.countries || []
          const statesDataResult = buildStatesData(responseData.states || [])
          
          setCountries(countriesData)
          setStatesData(statesDataResult)
          setLastModified(responseData.last_modified)
          
          if (process.client) {
            localStorage.setItem('countryStateData', JSON.stringify({
              countries: countriesData,
              states: responseData.states
            }))
            localStorage.setItem('countryStateDataLastModified', JSON.stringify(responseData.last_modified))
          }
        }
        // 如果数据没有更新但store中没有数据，确保从缓存加载
        else if (countries.value.length === 0 && cachedData) {
          setCountries(cachedData.countries || [])
          setStatesData(buildStatesData(cachedData.states || []))
          setLastModified(cachedLastModified)
        }
      }
      
      setLoaded(true)
    } catch (error) {
      console.error('Failed to load country state data:', error)
      // 如果请求失败但有缓存数据，继续使用缓存
      if (countries.value.length === 0) {
        console.warn('No country data available')
      }
    } finally {
      setLoading(false)
    }
  }

  // 强制刷新数据
  const refreshCountryStateData = async () => {
    setLoaded(false)
    setCountries([])
    setStatesData({})
    
    if (process.client) {
      localStorage.removeItem('countryStateData')
      localStorage.removeItem('countryStateDataLastModified')
    }
    
    await loadCountryStateData()
  }

  return {
    // State
    countries,
    statesData,
    lastModified,
    loading,
    loaded,
    
    // Getters
    getCountries,
    getStatesData,
    isLoading,
    isLoaded,
    getStatesByCountry,
    getCountryByCode,
    getCountryName,
    
    // Actions
    setLoading,
    setCountries,
    setStatesData,
    setLastModified,
    setLoaded,
    loadCountryStateData,
    refreshCountryStateData
  }
})