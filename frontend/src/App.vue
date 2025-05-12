<template>
  <div id="app">
    <SiteHeader v-if="!isAdminRoute && !isAuthRoute" />
    <router-view />
    <SiteFooter v-if="!isAdminRoute && !isAuthRoute" />
  </div>
</template>

<script>
import SiteHeader from './components/common/Header.vue'
import SiteFooter from './components/common/Footer.vue'

export default {
  name: 'App',
  components: {
    SiteHeader,
    SiteFooter
  },
  computed: {
    isAdminRoute() {
      return this.$route.path.startsWith('/admin')
    },
    isAuthRoute() {
      return ['/login', '/register'].includes(this.$route.path)
    }
  }
}
</script>

<style>
#app {
  font-family: 'Microsoft YaHei', Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
}
</style>
