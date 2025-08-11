<template>
  <div id="app">
    <SiteHeader v-if="!isAdminRoute " />
    <router-view />
    <SiteFooter v-if="!isAdminRoute " />
    <!-- 浮动功能栏 - 在非管理员页面显示 -->
    <FloatingActionBar v-if="!isAdminRoute" />
  </div>
</template>

<script>
import SiteHeader from './components/common/Header.vue'
import SiteFooter from './components/common/Footer.vue'
import FloatingActionBar from './components/common/FloatingActionBar.vue'

export default {
  name: 'App',
  components: {
    SiteHeader,
    SiteFooter,
    FloatingActionBar
  },
  computed: {
    isAdminRoute() {
      return this.$route.path.startsWith('/admin')
    },
    isAuthRoute() {
      return ['/login'].includes(this.$route.path)
    }
  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Microsoft YaHei', Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
}
</style>
