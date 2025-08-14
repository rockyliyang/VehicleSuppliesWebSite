// 语言模块 - Vuex Store

const state = {
  currentLang: 'zh-CN', // 默认语言
  supportedLanguages: ['zh-CN', 'en'], // 支持的语言列表
  translations: {}, // 翻译数据，格式: { zh-CN: { key: value }, en: { key: value } }
};

const mutations = {
  SET_CURRENT_LANGUAGE(state, lang) {
    state.currentLang = lang;
    // 保存到本地存储，以便刷新页面后保持语言设置
    localStorage.setItem('app_language', lang);
  },
  SET_SUPPORTED_LANGUAGES(state, languages) {
    state.supportedLanguages = languages;
  },
  SET_TRANSLATIONS(state, { lang, translations }) {
    state.translations = {
      ...state.translations,
      [lang]: translations
    };
  }
};

const actions = {
  // 初始化语言设置
  async initLanguage({ commit, dispatch }) {
    console.log('initLanguage start' );
    // 尝试从本地存储获取语言设置
    let savedLang = localStorage.getItem('app_language');
    savedLang = 'en'; //now we always use en, we will support other lang later

    if (savedLang) {
      // 如果有保存的语言设置，使用它
      commit('SET_CURRENT_LANGUAGE', savedLang);
      await dispatch('loadTranslations', savedLang);
    } else {
      // 根据IP地址检测用户所在国家/地区，设置默认语言
      await dispatch('detectLanguageByIP');
    }
    
    // 加载支持的语言列表
    dispatch('loadSupportedLanguages');
    console.log('initLanguage end' );
  },
  
  // 根据IP地址检测默认语言
  async detectLanguageByIP({ commit, dispatch }) {
    try {
      // 从后端API获取IP地理位置信息
      const api = await import('../../utils/api').then(m => m.default);
      const response = await api.get('/language/detect');
      
      if (response.success) {
        // 如果成功获取到语言设置，使用它
        const detectedLang = response.data;
        if (detectedLang && state.supportedLanguages.includes(detectedLang)) {
          commit('SET_CURRENT_LANGUAGE', detectedLang);
          await dispatch('loadTranslations', detectedLang);
          return;
        }
      }
      
      // 如果检测失败或返回的语言不受支持，使用默认语言
      await dispatch('loadTranslations', state.currentLang);
    } catch (error) {
      console.error('根据IP检测语言失败:', error);
      // 出错时使用默认语言
      await dispatch('loadTranslations', state.currentLang);
    }
  },
  
  // 切换语言
  async changeLanguage({ commit, dispatch }, lang) {
    commit('SET_CURRENT_LANGUAGE', lang);
    await dispatch('loadTranslations', lang);
  },
  
  // 加载指定语言的翻译
  async loadTranslations({ commit }, lang) {
    try {
      // 从后端API加载翻译数据
      const api = await import('../../utils/api').then(m => m.default);
      const response = await api.get(`/language/translations/${lang}`);
      
      if (response.success) {
        commit('SET_TRANSLATIONS', { 
          lang, 
          translations: response.data || {}
        });
      } else {
        throw new Error(response.message || '加载翻译数据失败');
      }
    
    } catch (error) {
      console.error(`加载${lang}翻译失败:`, error);
    }
  },
  
  // 加载支持的语言列表
  async loadSupportedLanguages({ commit }) {
    try {
      // 从后端API加载支持的语言列表
      const api = await import('../../utils/api').then(m => m.default);
      const response = await api.get('/language/supported');
      
      if (response.success) {
        commit('SET_SUPPORTED_LANGUAGES', response.data || ['zh-CN', 'en']);
      } else {
        throw new Error(response.message || '加载支持的语言列表失败');
      }
    } catch (error) {
      console.error('加载支持的语言列表失败:', error);
    }
  }
};

const getters = {
  // 获取当前语言
  currentLanguage: state => state.currentLang,
  
  // 获取支持的语言列表
  supportedLanguages: state => state.supportedLanguages,
  
  // 获取翻译函数
  translate: state => (key, defaultValue = key) => {
    const translations = state.translations[state.currentLang] || {};
    return translations[key] || defaultValue;
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};