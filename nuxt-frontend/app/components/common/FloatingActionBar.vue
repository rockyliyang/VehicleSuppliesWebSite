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
        <span class="action-text">{{ $t('FLOATING_ACTION_BAR.WHATSAPP') || 'WhatsApp' }}</span>
      </div>

      <div class="action-item" @click="goToInquiries">
        <div class="action-icon">
          <i class="fas fa-question-circle"></i>
        </div>
        <span class="action-text">{{ $t('FLOATING_ACTION_BAR.INQUIRIES') || 'Inquiries' }}</span>
      </div>

      <div class="action-item" @click="goToOrders">
        <div class="action-icon">
          <i class="fas fa-list-alt"></i>
        </div>
        <span class="action-text">{{ $t('FLOATING_ACTION_BAR.ORDERS') || 'Orders' }}</span>
      </div>

      <div class="action-item" @click="goToCart">
        <div class="action-icon">
          <i class="fas fa-shopping-cart"></i>
          <span v-if="cartItemCount > 0" class="badge">{{ cartItemCount }}</span>
        </div>
        <span class="action-text">{{ $t('FLOATING_ACTION_BAR.CART') || 'Cart' }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { useMainStore } from '~/stores/index'

export default {
  name: 'FloatingActionBar',
  setup() {
    const store = useMainStore()
    return {
      store
    }
  },
  data() {
    return {
      isExpanded: false, // 初始状态，将在mounted中根据屏幕尺寸设置
      isMobile: false,
      showScrollTop: false,
      isVisible: true,
      lastScrollY: 0
    }
  },
  computed: {
    cartItemCount() {
      return this.store.cartItemCount || 0
    }
  },
  mounted() {
    // 初始化时检测屏幕尺寸并设置默认状态
    this.checkScreenSize()
    // 监听窗口大小变化
    if (process.client) {
      window.addEventListener('resize', this.handleResize)
      window.addEventListener('scroll', this.handleScroll, { passive: true })
    }
  },
  beforeUnmount() {
    // 清理事件监听器
    if (process.client) {
      window.removeEventListener('resize', this.handleResize)
      window.removeEventListener('scroll', this.handleScroll)
    }
  },
  methods: {
    checkScreenSize() {
      // 检测是否为移动端（768px以下）
      this.isMobile = window.innerWidth <= 768
      // 电脑端默认展开，手机端默认收起
      this.isExpanded = !this.isMobile
    },
    
    handleResize() {
      // 窗口大小变化时重新检测并调整状态
      const wasMobile = this.isMobile
      this.checkScreenSize()
      
      // 如果从移动端切换到桌面端，自动展开
      // 如果从桌面端切换到移动端，自动收起
      if (wasMobile && !this.isMobile) {
        this.isExpanded = true
      } else if (!wasMobile && this.isMobile) {
        this.isExpanded = false
      }
    },
    
    handleScroll() {
      const currentScrollY = window.scrollY
      
      // 显示/隐藏回到顶部按钮
      this.showScrollTop = currentScrollY > 300
      
      // 根据滚动方向显示/隐藏浮动栏
      if (currentScrollY > this.lastScrollY && currentScrollY > 100) {
        this.isVisible = false
      } else {
        this.isVisible = true
      }
      
      this.lastScrollY = currentScrollY
    },
    
    toggleExpanded() {
      this.isExpanded = !this.isExpanded
    },
    
    goToCart() {
      navigateTo('/Cart')
    },
    
    goToInquiries() {
      // 跳转到询价单管理页面，让路由守卫处理登录验证
      navigateTo('/Inquiries')
    },
    
    goToOrders() {
      // 直接跳转到订单页面，让路由守卫处理登录验证
      navigateTo('/UserOrders')
    },
    
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    },
    
    openWhatsApp() {
      // WhatsApp 客服号码，请根据实际情况修改
      const phoneNumber = '1234567890' // 替换为实际的WhatsApp号码
      // 使用多语言翻译获取消息内容
      const message = this.$t('FLOATING_ACTION_BAR.WHATSAPP_MESSAGE') || 'Hello, I need help with your products.'
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
    }
  }
}
</script>

<style lang="scss" scoped>
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;
@use 'sass:color';

.floating-action-bar {
  position: fixed;
  right: 0;
  top: 80%;
  transform: translateY(-50%);
  z-index: 1000;

  // 主按钮 - 贴合右边缘的半圆形按钮
  .main-button {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, $primary-color 0%, color.adjust($primary-color, $lightness: -10%) 100%);
    border-radius: 28px 0 0 28px; // 左侧圆角，右侧直角贴边
    @include flex-center;
    color: $white;
    font-size: 20px;
    cursor: pointer;
    box-shadow: -4px 0 20px rgba($primary-color, 0.3), -2px 0 8px rgba(0, 0, 0, 0.15);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-right: none; // 移除右边框

    &:hover {
      transform: translateX(-4px);
      box-shadow: -6px 0 25px rgba($primary-color, 0.4), -4px 0 12px rgba(0, 0, 0, 0.2);
    }

    &:active {
      transform: translateX(-2px) scale(0.98);
    }

    @media (max-width: $breakpoint-mobile) {
      width: 50px;
      height: 50px;
      font-size: 18px;
    }
  }

  // 向上弹出的菜单
  .action-menu {
    position: absolute;
    right: 0;
    bottom: 70px;
    @include flex-column;
    gap: 12px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(30px) scale(0.8);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

    @media (max-width: $breakpoint-mobile) {
      bottom: 65px;
      gap: 10px;
    }

    // 显示菜单
    &.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }
  }

  .action-item {
    min-width: 140px;
    height: 48px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 24px 0 0 24px; // 左侧圆角，右侧直角贴边
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 16px 0 12px;
    cursor: pointer;
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1), -2px 0 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-right: none; // 移除右边框

    &:hover {
      background: rgba(255, 255, 255, 1);
      box-shadow: -6px 0 25px rgba(0, 0, 0, 0.15), -4px 0 12px rgba(0, 0, 0, 0.08);
      transform: translateX(-12px) translateY(-2px);
    }

    &:active {
      transform: translateX(-8px) scale(0.98);
    }

    @media (max-width: $breakpoint-mobile) {
      min-width: 120px;
      height: 44px;
      padding: 0 12px 0 10px;
      border-radius: 22px 0 0 22px; // 移动端也保持半圆设计
    }

    .action-icon {
      position: relative;
      font-size: 18px;
      color: $gray-600;
      transition: all 0.3s ease;
      margin-right: 10px;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      @include flex-center;
      border-radius: 50%;
      background: rgba($gray-100, 0.5);

      @media (max-width: $breakpoint-mobile) {
        font-size: 16px;
        margin-right: 8px;
        width: 22px;
        height: 22px;
      }

      &.whatsapp {
        color: #25d366;
        background: rgba(37, 211, 102, 0.1);
      }

      .badge {
        position: absolute;
        top: -6px;
        right: -6px;
        background: linear-gradient(135deg, $error-color 0%, color.adjust($error-color, $lightness: -10%) 100%);
        color: $white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        @include flex-center;
        font-size: 10px;
        font-weight: $font-weight-bold;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

        @media (max-width: $breakpoint-mobile) {
          width: 16px;
          height: 16px;
          font-size: 9px;
          top: -5px;
          right: -5px;
        }
      }
    }

    .action-text {
      font-size: 14px;
      color: $gray-700;
      font-weight: 500;
      white-space: nowrap;
      transition: color 0.3s ease;
      letter-spacing: 0.3px;

      @media (max-width: $breakpoint-mobile) {
        font-size: 13px;
      }
    }

    &:hover {
      .action-icon {
        color: $primary-color;
        background: rgba($primary-color, 0.1);
        transform: scale(1.1);

        &.whatsapp {
          color: #25d366;
          background: rgba(37, 211, 102, 0.15);
        }
      }

      .action-text {
        color: $primary-color;
        font-weight: 600;
      }
    }

    // 为每个按钮添加不同的延迟动画
    &:nth-child(1) {
      transition-delay: 0.1s;
    }

    &:nth-child(2) {
      transition-delay: 0.15s;
    }

    &:nth-child(3) {
      transition-delay: 0.2s;
    }

    &:nth-child(4) {
      transition-delay: 0.25s;
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