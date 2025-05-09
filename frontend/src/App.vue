<template>
  <div id="app">
    <SiteHeader />
    <router-view/>
    <SiteFooter />
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
