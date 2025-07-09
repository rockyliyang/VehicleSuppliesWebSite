<template>
  <div class="user-settings">
    <PageBanner 
      :title="$t('userSettings.title') || '账号设置'"
      :subtitle="$t('userSettings.subtitle') || '管理您的账号信息和第三方登录'"
    />
    
    <div class="settings-container">
      <div class="settings-wrapper">
        <el-card class="settings-card">
          <!-- 基本信息 -->
          <div class="section">
            <h3 class="section-title">{{ $t('userSettings.basicInfo') || '基本信息' }}</h3>
            <el-descriptions :column="1" border>
              <el-descriptions-item :label="$t('userSettings.username') || '用户名'">
                {{ userInfo.username }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('userSettings.email') || '邮箱'">
                {{ userInfo.email }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('userSettings.phone') || '手机号'">
                {{ userInfo.phone || $t('userSettings.notSet') || '未设置' }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('userSettings.registerTime') || '注册时间'">
                {{ formatDate(userInfo.created_at) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 第三方账号绑定 -->
          <div class="section">
            <h3 class="section-title">{{ $t('account.thirdPartyAccounts') || '第三方账号' }}</h3>
            <div class="third-party-accounts">
              <!-- Apple -->
              <div class="account-item">
                <div class="account-info">
                  <AppleIcon class="account-icon" />
                  <div class="account-details">
                    <span class="account-name">Apple</span>
                    <span class="account-status" :class="{ 'bound': thirdPartyStatus.apple }">
                      {{ thirdPartyStatus.apple ? ($t('account.bound') || '已绑定') : ($t('account.notBound') || '未绑定') }}
                    </span>
                  </div>
                </div>
                <el-button 
                  v-if="!thirdPartyStatus.apple"
                  @click="bindAccount('apple')"
                  :loading="bindingLoading.apple"
                  type="primary"
                  size="small"
                >
                  {{ $t('account.bindAccount') || '绑定账号' }}
                </el-button>
                <el-button 
                  v-else
                  @click="unbindAccount('apple')"
                  :loading="unbindingLoading.apple"
                  type="danger"
                  size="small"
                >
                  {{ $t('account.unbindAccount') || '解绑账号' }}
                </el-button>
              </div>

              <!-- Google -->
              <div class="account-item">
                <div class="account-info">
                  <GoogleIcon class="account-icon" />
                  <div class="account-details">
                    <span class="account-name">Google</span>
                    <span class="account-status" :class="{ 'bound': thirdPartyStatus.google }">
                      {{ thirdPartyStatus.google ? ($t('account.bound') || '已绑定') : ($t('account.notBound') || '未绑定') }}
                    </span>
                  </div>
                </div>
                <el-button 
                  v-if="!thirdPartyStatus.google"
                  @click="bindAccount('google')"
                  :loading="bindingLoading.google"
                  type="primary"
                  size="small"
                >
                  {{ $t('account.bindAccount') || '绑定账号' }}
                </el-button>
                <el-button 
                  v-else
                  @click="unbindAccount('google')"
                  :loading="unbindingLoading.google"
                  type="danger"
                  size="small"
                >
                  {{ $t('account.unbindAccount') || '解绑账号' }}
                </el-button>
              </div>

              <!-- Facebook -->
              <div class="account-item">
                <div class="account-info">
                  <FacebookIcon class="account-icon" />
                  <div class="account-details">
                    <span class="account-name">Facebook</span>
                    <span class="account-status" :class="{ 'bound': thirdPartyStatus.facebook }">
                      {{ thirdPartyStatus.facebook ? ($t('account.bound') || '已绑定') : ($t('account.notBound') || '未绑定') }}
                    </span>
                  </div>
                </div>
                <el-button 
                  v-if="!thirdPartyStatus.facebook"
                  @click="bindAccount('facebook')"
                  :loading="bindingLoading.facebook"
                  type="primary"
                  size="small"
                >
                  {{ $t('account.bindAccount') || '绑定账号' }}
                </el-button>
                <el-button 
                  v-else
                  @click="unbindAccount('facebook')"
                  :loading="unbindingLoading.facebook"
                  type="danger"
                  size="small"
                >
                  {{ $t('account.unbindAccount') || '解绑账号' }}
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
import PageBanner from '@/components/common/PageBanner.vue'
import AppleIcon from '@/components/icons/AppleIcon.vue'
import GoogleIcon from '@/components/icons/GoogleIcon.vue'
import FacebookIcon from '@/components/icons/FacebookIcon.vue'

export default {
  name: 'UserSettings',
  components: {
    PageBanner,
    AppleIcon,
    GoogleIcon,
    FacebookIcon
  },
  data() {
    return {
      userInfo: {},
      thirdPartyStatus: {
        apple: false,
        google: false,
        facebook: false
      },
      bindingLoading: {
        apple: false,
        google: false,
        facebook: false
      },
      unbindingLoading: {
        apple: false,
        google: false,
        facebook: false
      }
    }
  },
  created() {
    this.loadUserInfo();
    this.loadThirdPartyStatus();
    this.initThirdPartySDKs();
  },
  methods: {
    async loadUserInfo() {
      try {
        // 从store获取用户信息
        this.userInfo = this.$store.state.user || {};
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    },
    
    async loadThirdPartyStatus() {
      try {
        this.loading = true;
        const result = await this.$api.getWithErrorHandler('/auth/third-party-status', {
          fallbackKey: 'settings.loadStatusFailed'
        });
        
        this.thirdPartyStatus = result.data;
      } catch (error) {
        console.error('Failed to load third-party status:', error);
      } finally {
        this.loading = false;
      }
    },
    
    initThirdPartySDKs() {
      // 初始化Apple Sign In
      if (typeof AppleID !== 'undefined') {
        AppleID.auth.init({
          clientId: process.env.VUE_APP_APPLE_CLIENT_ID || 'your_apple_client_id',
          scope: 'name email',
          redirectURI: window.location.origin + '/user/settings',
          state: 'bind',
          usePopup: true
        });
      }
      
      // 初始化Google API
      if (typeof gapi !== 'undefined') {
        gapi.load('auth2', () => {
          gapi.auth2.init({
            client_id: process.env.VUE_APP_GOOGLE_CLIENT_ID || 'your_google_client_id'
          });
        });
      }
      
      // 初始化Facebook SDK
      if (typeof FB !== 'undefined') {
        FB.init({
          appId: process.env.VUE_APP_FACEBOOK_APP_ID || 'your_facebook_app_id',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
      }
    },
    
    async bindAccount(provider) {
      try {
        this.bindingLoading[provider] = true;
        
        let authData = null;
        
        if (provider === 'apple') {
          if (typeof AppleID === 'undefined') {
            throw new Error(this.$t('login.error.appleNotAvailable') || 'Apple Sign In not available');
          }
          
          const response = await AppleID.auth.signIn();
          
          // 验证Apple身份令牌并获取用户信息
          const providerUserId = response.authorization.id_token ? 
            JSON.parse(atob(response.authorization.id_token.split('.')[1])).sub : null;
          
          authData = {
            providerUserId: providerUserId,
            accessToken: response.authorization.code,
            refreshToken: null,
            email: response.user?.email || null,
            name: response.user?.name ? `${response.user.name.firstName} ${response.user.name.lastName}` : null,
            avatar: null
          };
        } else if (provider === 'google') {
          if (typeof gapi === 'undefined' || !gapi.auth2) {
            throw new Error(this.$t('login.error.googleNotAvailable') || 'Google Sign In not available');
          }
          
          const auth2 = gapi.auth2.getAuthInstance();
          const googleUser = await auth2.signIn();
          const authResponse = googleUser.getAuthResponse();
          const profile = googleUser.getBasicProfile();
          
          authData = {
            providerUserId: profile.getId(),
            accessToken: authResponse.access_token,
            refreshToken: null,
            email: profile.getEmail(),
            name: profile.getName(),
            avatar: profile.getImageUrl()
          };
        } else if (provider === 'facebook') {
          if (typeof FB === 'undefined') {
            throw new Error(this.$t('login.error.facebookNotAvailable') || 'Facebook Login not available');
          }
          
          const response = await new Promise((resolve, reject) => {
            FB.login((response) => {
              if (response.authResponse) {
                resolve(response);
              } else {
                reject(new Error(this.$t('login.error.facebookCancelled') || 'Facebook login cancelled'));
              }
            }, { scope: 'email,public_profile' });
          });
          
          // 获取Facebook用户信息
          const userInfo = await new Promise((resolve, reject) => {
            FB.api('/me', { fields: 'id,name,email,picture' }, (response) => {
              if (response && !response.error) {
                resolve(response);
              } else {
                reject(new Error('Failed to get Facebook user info'));
              }
            });
          });
          
          authData = {
            providerUserId: response.authResponse.userID,
            accessToken: response.authResponse.accessToken,
            refreshToken: null,
            email: userInfo.email || null,
            name: userInfo.name || null,
            avatar: userInfo.picture?.data?.url || null
          };
        }
        
        // 发送绑定请求到后端
        await this.$api.postWithErrorHandler('/auth/bind-third-party', {
          provider,
          providerUserId: authData.providerUserId,
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          email: authData.email,
          name: authData.name,
          avatar: authData.avatar
        }, {
          fallbackKey: 'login.error.bindFailed'
        });
        
        this.$messageHandler.showSuccess(
          this.$t('login.success.accountBound') || '账号绑定成功',
          'login.success.accountBound'
        );
        
        // 重新加载第三方账号状态
        await this.loadThirdPartyStatus();
      } catch (error) {
        console.error(`${provider} 绑定失败:`, error);
        this.$messageHandler.showError(
          error.message || this.$t('login.error.bindFailed') || '账号绑定失败',
          'login.error.bindFailed'
        );
      } finally {
        this.bindingLoading[provider] = false;
      }
    },
    
    async unbindAccount(provider) {
      try {
        await this.$confirm(
          this.$t('account.confirmUnbind') || '确定要解绑此账号吗？',
          this.$t('account.unbindAccount') || '解绑账号',
          {
            confirmButtonText: this.$t('common.confirm') || '确定',
            cancelButtonText: this.$t('common.cancel') || '取消',
            type: 'warning'
          }
        );
        
        this.unbindingLoading[provider] = true;
        
        await this.$api.deleteWithErrorHandler('/auth/unbind-third-party', {
          data: { provider },
          fallbackKey: 'login.error.unbindFailed'
        });
        
        this.$messageHandler.showSuccess(
          this.$t('login.success.accountUnbound') || '账号解绑成功',
          'login.success.accountUnbound'
        );
        
        // 重新加载第三方账号状态
        await this.loadThirdPartyStatus();
      } catch (error) {
        if (error !== 'cancel') {
          console.error(`${provider} 解绑失败:`, error);
          this.$messageHandler.showError(
            error.message || this.$t('login.error.unbindFailed') || '账号解绑失败',
            'login.error.unbindFailed'
          );
        }
      } finally {
        this.unbindingLoading[provider] = false;
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('zh-CN');
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

.user-settings {
  min-height: 100vh;
  background-color: $gray-100;
}

.settings-container {
  padding: $spacing-2xl;
  background-color: $gray-100;
  min-height: calc(100vh - 200px);
}

.settings-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.settings-card {
  @include card-hover;
  padding: $spacing-2xl;
}

.section {
  margin-bottom: $spacing-2xl;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-sm;
  border-bottom: 2px solid $primary-color;
}

.third-party-accounts {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  border: 1px solid $gray-300;
  border-radius: $border-radius-lg;
  background: white;
  transition: $transition-base;
  
  &:hover {
    border-color: $primary-color;
    box-shadow: 0 2px 8px rgba($primary-color, 0.1);
  }
}

.account-info {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.account-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.account-details {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.account-name {
  font-size: $font-size-lg;
  font-weight: $font-weight-medium;
  color: $text-primary;
}

.account-status {
  font-size: $font-size-sm;
  color: $text-secondary;
  
  &.bound {
    color: $success-color;
    font-weight: $font-weight-medium;
  }
}

/* 响应式设计 */
@include mobile {
  .settings-container {
    padding: $spacing-lg $spacing-md;
  }
  
  .settings-card {
    padding: $spacing-lg;
  }
  
  .account-item {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-md;
    
    .account-info {
      width: 100%;
    }
    
    .el-button {
      width: 100%;
    }
  }
}
</style>