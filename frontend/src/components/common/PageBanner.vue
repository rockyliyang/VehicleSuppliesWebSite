<template>
  <div class="page-banner">
    <div class="banner-content">
      <h1 class="banner-title">{{ title }}</h1>
      <p v-if="subtitle" class="banner-subtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageBanner',
  props: {
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    backgroundImage: {
      type: String,
      default: require('@/assets/images/banner1.jpg')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';
@import '@/assets/styles/mixins';

/* Modern Banner */
.page-banner {
  height: $banner-height;
  background: v-bind('`url(${backgroundImage}) center/cover`');
  @include flex-center;
  color: $white;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.page-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
}

.banner-content {
  @include container;
  position: relative;
  z-index: 1;
}

.banner-title {
  @include heading-1;
  color: $white;
  margin: 0 0 $spacing-lg 0;
  font-size: $font-size-4xl;
  font-weight: $font-weight-bold;
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.5),
    0 4px 8px rgba(0, 0, 0, 0.3),
    0 8px 16px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 50%, rgba(255, 255, 255, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  letter-spacing: 0.5px;
}

.banner-subtitle {
  font-size: $font-size-lg;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}
</style>