<template>
  <div class="navigation-menu">
    <div class="nav-content">
      <el-breadcrumb separator=">" class="nav-breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">{{ $t('breadcrumb.home') || '首页' }}</el-breadcrumb-item>
        <el-breadcrumb-item v-for="(item, index) in filteredBreadcrumbItems" :key="index" :to="item.to">
          {{ item.text }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 获取 Nuxt 应用实例
const { $t } = useNuxtApp()

// 定义 props
const props = defineProps({
  breadcrumbItems: {
    type: Array,
    default: () => []
  }
})

// 计算属性
const filteredBreadcrumbItems = computed(() => {
  return props.breadcrumbItems.filter(item => item.text)
})
</script>

<style lang="scss" scoped>
@use '~/assets/styles/_variables.scss' as *;
@use '~/assets/styles/_mixins.scss' as *;

.navigation-menu {
  background-color: $white;
  padding: $spacing-md 0;
  margin-bottom: $spacing-md;
}

.nav-content {
  @include container;
  text-align: left;
}

.nav-breadcrumb {
  font-size: $font-size-lg;
  text-align: left;

  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      color: $text-secondary;
      font-weight: $font-weight-normal;

      &:hover {
        color: $primary-color;
      }
    }

    &:last-child .el-breadcrumb__inner {
      color: $text-primary;
      font-weight: $font-weight-medium;
    }
  }

  :deep(.el-breadcrumb__separator) {
    color: $text-secondary;
    margin: 0 $spacing-xs;
  }
}
</style>