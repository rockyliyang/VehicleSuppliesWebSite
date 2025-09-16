<template>
  <div class="login-page" :class="{ 'page-ready': pageReady }">
    <!-- Page Banner -->
    <PageBanner :title="$t('login.title') || '用户登录'" />

    <!-- Login Form Section -->
    <div class="login-container">
      <div class="form-wrapper" ref="formWrapper">
        <ClientOnly>
          <LoginDialog
            :show-close-button="false"
            :auto-redirect="true"
            @login-success="handleLoginSuccess"
          />
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<script>
import PageBanner from '~/components/common/PageBanner.vue'
import LoginDialog from '~/components/common/LoginDialog.vue'
import { useMainStore } from '~/stores'

export default {
  name: 'UserLogin',
  components: {
    PageBanner,
    LoginDialog
  },
  data() {
    return {
      // 页面级别的数据
      pageReady: false
    }
  },
  mounted() {
    // 立即计算并设置初始滚动位置，避免闪烁
    this.$nextTick(() => {
      this.setInitialPosition();
    });
  },
  methods: {
    handleLoginSuccess(data) {
      // 登录成功处理 - 使用Pinia store
      if (data && data.user) {
        const mainStore = useMainStore()
        mainStore.setUser(data.user)
      }
      // 页面跳转由LoginDialog组件处理（autoRedirect=true）
    },
    setInitialPosition() {
      try {
        // 等待DOM完全渲染
        setTimeout(() => {
          const formWrapper = this.$refs.formWrapper;
          
          if (formWrapper) {
            // 计算表单位置
            const formRect = formWrapper.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const formHeight = formRect.height;
            
            // 计算目标滚动位置
            let targetScrollTop;
            
            if (window.innerWidth <= 767) {
              // 移动端：滚动到表单顶部，留出一些空间
              targetScrollTop = window.pageYOffset + formRect.top - 50;
            } else {
              // 桌面端：让表单在视窗中居中
              targetScrollTop = window.pageYOffset + formRect.top - (viewportHeight - formHeight) / 2;
            }
            
            // 确保滚动位置在有效范围内
            const maxScrollTop = document.documentElement.scrollHeight - viewportHeight;
            targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));
            
            // 立即设置滚动位置（无动画）
            window.scrollTo(0, targetScrollTop);
            
            // 显示页面内容
            this.pageReady = true;
          }
        }, 100); // 减少延迟时间
      } catch (error) {
        console.warn('设置初始位置失败:', error);
        // 即使失败也要显示页面
        this.pageReady = true;
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/_variables.scss' as *;
@use '@/assets/styles/_mixins.scss' as *;

/* Login Page */
.login-page {
  min-height: $auth-page-min-height;
  background-color: $gray-100;
  @include flex-column;
  
  /* 防闪烁：初始状态隐藏内容 */
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  
  /* 页面就绪后显示内容 */
  &.page-ready {
    opacity: 1;
  }
}

.login-container {
  padding: $auth-container-padding;
  background-color: $gray-100;
  min-height: $auth-container-min-height;
  width: 100%;
}

.form-wrapper {
  max-width: $auth-form-max-width;
  margin: 0 auto;
  padding: $auth-form-padding;
  @include flex-center;
}

/* 登录对话框样式已移至 LoginDialog.vue 组件 */

/* Responsive Design */
@include mobile {
  .login-page {
    min-height: 100vh;
  }

  .login-container {
    padding: $spacing-lg $spacing-sm;
    min-height: calc(100vh - 200px);
  }

  .form-wrapper {
    padding: 0;
    max-width: 100%;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .login-container {
    padding: $spacing-md $spacing-xs;
  }
  
  .form-wrapper {
    margin: 0;
  }
}
</style>