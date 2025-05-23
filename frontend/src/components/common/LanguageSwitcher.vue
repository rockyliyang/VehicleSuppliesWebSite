<template>
    <div class="language-switcher">
        <el-dropdown trigger="click" @command="handleLanguageChange">
            <span class="language-btn">
                {{ currentLanguageDisplay }}
                <el-icon class="el-icon--right">
                    <arrow-down />
                </el-icon>
            </span>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item v-for="lang in supportedLanguages" :key="lang" :command="lang">
                        {{ getLanguageDisplay(lang) }}
                    </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>
    </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { ArrowDown } from '@element-plus/icons-vue'

export default {
  name: 'LanguageSwitcher',
  components: {
    ArrowDown
  },
  setup() {
    const store = useStore()
    
    // 获取当前语言
    const currentLanguage = computed(() => store.getters['language/currentLanguage'])
    
    // 获取支持的语言列表
    const supportedLanguages = computed(() => store.getters['language/supportedLanguages'])
    
    // 获取当前语言显示名称
    const currentLanguageDisplay = computed(() => getLanguageDisplay(currentLanguage.value))
    
    // 语言显示名称映射
    const languageDisplayMap = {
      'zh-CN': '中文',
      'en': 'English'
    }
    
    // 获取语言显示名称
    const getLanguageDisplay = (lang) => {
      return languageDisplayMap[lang] || lang
    }
    
    // 处理语言切换
    const handleLanguageChange = (lang) => {
      if (lang !== currentLanguage.value) {
        store.dispatch('language/changeLanguage', lang)
      }
    }
    
    return {
      currentLanguage,
      supportedLanguages,
      currentLanguageDisplay,
      getLanguageDisplay,
      handleLanguageChange
    }
  }
}
</script>

<style scoped>
.language-switcher {
    display: inline-block;
    margin-left: 15px;
}

.language-btn {
    cursor: pointer;
    display: flex;
    align-items: center;
    color: #333;
    font-size: 14px;
}

.language-btn:hover {
    color: #409EFF;
}
</style>