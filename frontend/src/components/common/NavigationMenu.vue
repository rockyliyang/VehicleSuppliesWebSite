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

<script>
export default {
  name: 'NavigationMenu',
  props: {
    breadcrumbItems: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    filteredBreadcrumbItems() {
      return this.breadcrumbItems.filter(item => item.text)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables';
@import '@/assets/styles/_mixins';

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
  font-size: $font-size-md;
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