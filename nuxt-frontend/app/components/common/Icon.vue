<template>
  <i :class="iconClass" :style="iconStyle"></i>
</template>

<script>
export default {
  name: 'Icon',
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: [String, Number],
      default: '16'
    },
    color: {
      type: String,
      default: ''
    }
  },
  computed: {
    iconClass() {
      // Map common icon names to Element Plus icons
      const iconMap = {
        'shopping-cart': 'el-icon-shopping-cart-full',
        'user': 'el-icon-user',
        'chevron-down': 'el-icon-arrow-down',
        'menu': 'el-icon-menu',
        'close': 'el-icon-close',
        'search': 'el-icon-search',
        'home': 'el-icon-house',
        'settings': 'el-icon-setting',
        'logout': 'el-icon-switch-button',
        'orders': 'el-icon-document',
        'heart': 'el-icon-heart',
        'star': 'el-icon-star-filled',
        'plus': 'el-icon-plus',
        'minus': 'el-icon-minus',
        'edit': 'el-icon-edit',
        'delete': 'el-icon-delete',
        'check': 'el-icon-check',
        'arrow-left': 'el-icon-arrow-left',
        'arrow-right': 'el-icon-arrow-right',
        'arrow-up': 'el-icon-arrow-up',
        'arrow-down': 'el-icon-arrow-down'
      }
      
      return iconMap[this.name] || `el-icon-${this.name}`
    },
    iconStyle() {
      const style = {}
      
      if (this.size) {
        const sizeValue = typeof this.size === 'number' ? `${this.size}px` : this.size
        style.fontSize = sizeValue
      }
      
      if (this.color) {
        style.color = this.color
      }
      
      return style
    }
  }
}
</script>

<style scoped>
i {
  display: inline-block;
  line-height: 1;
}
</style>