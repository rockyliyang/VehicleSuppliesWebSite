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
import { ArrowDown } from '@element-plus/icons-vue'
import { useLanguageStore } from '~/stores/language'

export default {
  name: 'LanguageSwitcher',
  components: {
    ArrowDown
  },
  data() {
    return {
      // 语言显示名称映射
      languageDisplayMap: {
        'zh-CN': '中文',
        'en': 'English'
      },
      languageStore: null
    }
  },
  computed: {
    // 获取当前语言
    currentLanguage() {
      return this.languageStore?.currentLanguage || 'en'
    },
    
    // 获取支持的语言列表
    supportedLanguages() {
      return this.languageStore?.supportedLanguages || ['en', 'zh-CN']
    },
    
    // 获取当前语言显示名称
    currentLanguageDisplay() {
      return this.getLanguageDisplay(this.currentLanguage)
    }
  },
  created() {
    this.languageStore = useLanguageStore()
  },
  methods: {
    // 获取语言显示名称
    getLanguageDisplay(lang) {
      return this.languageDisplayMap[lang] || lang
    },
    
    // 处理语言切换
    handleLanguageChange(lang) {
      if (lang !== this.currentLanguage) {
        this.languageStore?.changeLanguage(lang)
        // 触发全局语言切换事件
        const { $bus } = useNuxtApp()
        $bus?.emit('language-changed', lang)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@use '~/assets/styles/_variables.scss' as *;

.language-switcher {
  display: inline-block;
  margin-left: $spacing-md;
}

.language-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: $text-secondary;
  font-size: $font-size-xl;
  transition: color 0.3s ease;

  &:hover {
    color: $primary-color;
  }
}

/* 下拉菜单项字体大小 - 与按钮字体大小保持一致 */
:deep(.el-dropdown-menu) {
  .el-dropdown-menu__item {
    font-size: $font-size-xl !important;
    line-height: $line-height-relaxed;
    padding: $spacing-xs $spacing-md;
  }
}
</style>