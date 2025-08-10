<template>
  <div class="floating-action-bar" :class="{ 'expanded': isExpanded }">
    <!-- 主按钮 -->
    <div class="main-button" @click="toggleExpanded">
      <i class="fas fa-bars"></i>
    </div>
    
    <!-- 向上弹出的菜单 -->
    <div class="action-menu" :class="{ 'show': isExpanded }">
      <div class="action-item" @click="openWhatsApp">
        <div class="action-icon whatsapp">
          <i class="fab fa-whatsapp"></i>
        </div>
      </div>
      
      <div class="action-item" @click="goToOrders">
        <div class="action-icon">
          <i class="fas fa-list-alt"></i>
        </div>
      </div>
      
      <div class="action-item" @click="goToCart">
        <div class="action-icon">
          <i class="fas fa-shopping-cart"></i>
          <span v-if="cartItemCount > 0" class="badge">{{ cartItemCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'FloatingActionBar',
  data() {
    return {
      isExpanded: true // 默认展开，完全由点击控制
    }
  },
  computed: {
    ...mapGetters(['cartItemCount'])
  },
  methods: {
    toggleExpanded() {
      this.isExpanded = !this.isExpanded
    },
    
    goToCart() {
      this.$router.push('/cart')
    },
    
    goToOrders() {
      // 直接跳转到订单页面，让路由守卫处理登录验证
      this.$router.push('/user/orders')
    },
    
    openWhatsApp() {
      // WhatsApp 客服号码，请根据实际情况修改
      const phoneNumber = '1234567890' // 替换为实际的WhatsApp号码
      // 使用多语言翻译获取消息内容
      const message = this.$t('FLOATING_ACTION_BAR.WHATSAPP_MESSAGE')
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';
@import '@/assets/styles/mixins';

.floating-action-bar {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  
  // 主按钮 - 紧贴右边框
  .main-button {
    width: 50px;
    height: 50px;
    background: $primary-color;
    border-radius: 25px 0 0 25px; // 左侧圆角，右侧直角贴边
    @include flex-center;
    color: $white;
    font-size: $font-size-lg;
    cursor: pointer;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    position: relative;

    &:hover {
      background: $primary-dark;
      box-shadow: -4px 0 12px rgba(0, 0, 0, 0.2);
    }

    @media (max-width: $breakpoint-mobile) {
      width: 45px;
      height: 45px;
      font-size: $font-size-md;
    }
  }

  // 向上弹出的菜单
  .action-menu {
    position: absolute;
    right: 0;
    bottom: 60px; // 在主按钮上方
    @include flex-column;
    gap: $spacing-xs;
    opacity: 0;
    visibility: hidden;
    transform: translateY(20px);
    transition: all 0.3s ease;

    @media (max-width: $breakpoint-mobile) {
      bottom: 55px;
      gap: 6px;
    }

    // 显示菜单
    &.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
  }

  .action-item {
    width: 50px;
    height: 50px;
    background: $white;
    border-radius: 25px 0 0 25px; // 与主按钮保持一致的样式
    @include flex-center;
    cursor: pointer;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    position: relative;

    &:hover {
      background: $gray-50;
      box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
      transform: translateX(-8px);
    }

    @media (max-width: $breakpoint-mobile) {
      width: 45px;
      height: 45px;
    }

    .action-icon {
      position: relative;
      font-size: $font-size-lg;
      color: $gray-600;
      transition: color 0.3s ease;

      @media (max-width: $breakpoint-mobile) {
        font-size: $font-size-md;
      }

      &.whatsapp {
        color: #25d366;
      }



      .badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: $error-color;
        color: $white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        @include flex-center;
        font-size: $font-size-xs;
        font-weight: $font-weight-bold;

        @media (max-width: $breakpoint-mobile) {
          width: 16px;
          height: 16px;
          font-size: 10px;
          top: -6px;
          right: -6px;
        }
      }
    }

    &:hover {
      .action-icon {
        color: $primary-color;

        &.whatsapp {
          color: #25d366;
        }

        &.wechat {
          color: #07c160;
        }
      }
    }
  }
}

// 确保在所有页面都显示
.floating-action-bar {
  // 在管理员页面隐藏
  body.admin-page & {
    display: none;
  }
}
</style>