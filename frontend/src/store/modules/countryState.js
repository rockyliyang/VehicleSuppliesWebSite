import api from '../../utils/api.js'

const state = {
  countries: [],
  statesData: {},
  lastModified: {
    countries: null,
    states: null
  },
  loading: false,
  loaded: false
}

const mutations = {
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_COUNTRIES(state, countries) {
    state.countries = countries
  },
  SET_STATES_DATA(state, statesData) {
    state.statesData = statesData
  },
  SET_LAST_MODIFIED(state, lastModified) {
    state.lastModified = lastModified
  },
  SET_LOADED(state, loaded) {
    state.loaded = loaded
  }
}

const actions = {
  async loadCountryStateData({ commit, state }) {
    // 如果已经加载过且不是强制刷新，直接返回
    if (state.loaded && state.countries.length > 0) {
      return
    }

    try {
      commit('SET_LOADING', true)
      
      // 从localStorage获取缓存的数据和时间戳
      const cachedData = localStorage.getItem('countryStateData')
      const cachedLastModified = JSON.parse(localStorage.getItem('countryStateDataLastModified') || '{}')
      
      if (cachedData && cachedLastModified.countries && cachedLastModified.states) {
        // 使用缓存的数据
        const data = JSON.parse(cachedData)
        commit('SET_COUNTRIES', data.countries || [])
        commit('SET_STATES_DATA', buildStatesData(data.states || []))
        commit('SET_LAST_MODIFIED', cachedLastModified)
        commit('SET_LOADED', true)
      }
      
      // 向后端请求数据，带上最后修改时间
      const params = {}
      if (cachedLastModified.countries) {
        params.countries_last_modified = cachedLastModified.countries
      }
      if (cachedLastModified.states) {
        params.states_last_modified = cachedLastModified.states
      }
      
      const response = await api.get('/users/country-state-data', { params })
      
      if (response.data && response.success) {
        const responseData = response.data
        
        if (responseData && responseData.updated) {
          // 数据有更新，保存到store和localStorage
          const countries = responseData.countries || []
          const statesData = buildStatesData(responseData.states || [])
          
          commit('SET_COUNTRIES', countries)
          commit('SET_STATES_DATA', statesData)
          commit('SET_LAST_MODIFIED', responseData.last_modified)
          
          localStorage.setItem('countryStateData', JSON.stringify({
            countries: countries,
            states: responseData.states
          }))
          localStorage.setItem('countryStateDataLastModified', JSON.stringify(responseData.last_modified))
        }
        // 如果数据没有更新但store中没有数据，确保从缓存加载
        else if (state.countries.length === 0 && cachedData) {
          const data = JSON.parse(cachedData)
          commit('SET_COUNTRIES', data.countries || [])
          commit('SET_STATES_DATA', buildStatesData(data.states || []))
          commit('SET_LAST_MODIFIED', cachedLastModified)
        }
      }
      
      commit('SET_LOADED', true)
    } catch (error) {
      console.error('Failed to load country state data:', error)
      // 如果请求失败但有缓存数据，继续使用缓存
      if (state.countries.length === 0) {
        console.warn('No country data available')
      }
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // 强制刷新数据
  async refreshCountryStateData({ commit }) {
    commit('SET_LOADED', false)
    commit('SET_COUNTRIES', [])
    commit('SET_STATES_DATA', {})
    localStorage.removeItem('countryStateData')
    localStorage.removeItem('countryStateDataLastModified')
    await this.dispatch('countryState/loadCountryStateData')
  }
}

const getters = {
  countries: state => state.countries,
  statesData: state => state.statesData,
  loading: state => state.loading,
  loaded: state => state.loaded,
  
  // 根据国家代码获取省份列表
  getStatesByCountry: (state) => (countryCode) => {
    // 先根据国家代码找到国家ID
    const country = state.countries.find(c => c.iso3 === countryCode)
    if (!country) return []
    return state.statesData[country.id] || []
  },
  
  // 根据国家代码获取国家信息
  getCountryByCode: (state) => (countryCode) => {
    return state.countries.find(country => country.iso3 === countryCode)
  },
  
  // 根据国家代码获取国家名称
  getCountryName: (state) => (countryCode) => {
    const country = state.countries.find(c => c.iso3 === countryCode)
    return country ? country.name : countryCode
  }
}

// 构建省份数据结构的辅助函数
function buildStatesData(states) {
  const statesData = {}
  states.forEach(state => {
    if (!statesData[state.country_id]) {
      statesData[state.country_id] = []
    }
    statesData[state.country_id].push(state)
  })
  return statesData
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}