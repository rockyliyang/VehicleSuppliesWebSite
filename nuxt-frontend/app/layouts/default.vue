<template>
  <div class="app-layout">
    <Header v-if="!isAdminRoute" />
    <main class="main-content">
      <slot />
    </main>
    <Footer v-if="!isAdminRoute" />
    <!-- 浮动功能栏 - 在非管理员页面显示 -->
    <FloatingActionBar v-if="!isAdminRoute" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Header from '~/components/common/Header.vue'
import Footer from '~/components/common/Footer.vue'
import FloatingActionBar from '~/components/common/FloatingActionBar.vue'

const route = useRoute()

const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin') || route.path.startsWith('/business')
})
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}
</style>