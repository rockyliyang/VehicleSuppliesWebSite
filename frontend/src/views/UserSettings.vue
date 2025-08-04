<template>
  <div class="user-settings">
    <PageBanner :title="$t('userSettings.title')" />
    
    <!-- 路径导航菜单 -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />
    
    <div class="container">
      <!-- 移除原来的页面标题，因为已经在PageBanner中显示 -->
      
      <!-- Account Information -->
      <div class="settings-card">
        <h2 class="section-title">{{ $t('userSettings.accountInfo.title') }}</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>{{ $t('userSettings.accountInfo.username') }}</label>
            <span>{{ userInfo.username || '-' }}</span>
          </div>
          <div class="info-item">
            <label>{{ $t('userSettings.accountInfo.email') }}</label>
            <span>{{ userInfo.email || '-' }}</span>
          </div>
          <div class="info-item">
            <label>{{ $t('userSettings.accountInfo.phone') }}</label>
            <div class="phone-edit">
              <span v-if="!editingPhone">{{ userInfo.phone || $t('userSettings.accountInfo.phoneNotSet') }}</span>
              <el-input 
                v-else
                v-model="editPhoneValue"
                size="small"
                :placeholder="$t('userSettings.accountInfo.phonePlaceholder')"
                style="width: 200px;"
              />
              <el-button 
                v-if="!editingPhone"
                type="text" 
                size="small"
                @click="startEditPhone"
              >
                {{ $t('userSettings.accountInfo.edit') }}
              </el-button>
              <div v-else class="phone-actions">
                <el-button 
                  type="primary" 
                  size="small"
                  :loading="savingPhone"
                  @click="savePhone"
                >
                  {{ $t('userSettings.accountInfo.save') }}
                </el-button>
                <el-button 
                  size="small"
                  @click="cancelEditPhone"
                >
                  {{ $t('userSettings.accountInfo.cancel') }}
                </el-button>
              </div>
            </div>
          </div>
          <div class="info-item">
            <label>{{ $t('userSettings.accountInfo.currency') }}</label>
            <span>{{ userInfo.currency || 'USD' }}</span>
          </div>
        </div>
      </div>

      <!-- Feature Modules -->
      <div class="settings-card">
        <h2 class="section-title">{{ $t('userSettings.features.title') }}</h2>
        <div class="function-grid">
          <div class="function-item" @click="goToAddressManagement">
            <div class="function-icon">
              <el-icon><Location /></el-icon>
            </div>
            <div class="function-info">
              <h3>{{ $t('userSettings.features.addressManagement.title') }}</h3>
              <p>{{ $t('userSettings.features.addressManagement.description') }}</p>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          
          <div class="function-item" @click="goToFavorites">
            <div class="function-icon">
              <el-icon><Star /></el-icon>
            </div>
            <div class="function-info">
              <h3>{{ $t('userSettings.features.favorites.title') }}</h3>
              <p>{{ $t('userSettings.features.favorites.description') }}</p>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          
          <div class="function-item" @click="goToBrowsingHistory">
            <div class="function-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="function-info">
              <h3>{{ $t('userSettings.features.browsingHistory.title') }}</h3>
              <p>{{ $t('userSettings.features.browsingHistory.description') }}</p>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script>
import { Location, Star, Clock, ArrowRight } from '@element-plus/icons-vue'
import PageBanner from '@/components/common/PageBanner.vue'
import NavigationMenu from '@/components/common/NavigationMenu.vue'

export default {
  name: 'UserSettings',
  components: {
    Location,
    Star,
    Clock,
    ArrowRight,
    PageBanner,
    NavigationMenu
  },
  data() {
    return {
      userInfo: {},
      editingPhone: false,
      editPhoneValue: '',
      savingPhone: false
    }
  },
  computed: {
    breadcrumbItems() {
      return [
        {
          text: this.$t('userSettings.title') || '用户设置',
          to: null // 当前页面，不需要链接
        }
      ]
    }
  },
  created() {
    this.loadUserInfo();
  },
  methods: {
    async loadUserInfo() {
      try {
        const result = await this.$api.getWithErrorHandler('/users/profile', {
          fallbackKey: 'settings.loadUserInfoFailed'
        });
        this.userInfo = result.data;
      } catch (error) {
        console.error('Failed to load user info:', error);
      }
    },
    
    startEditPhone() {
      this.editingPhone = true;
      this.editPhoneValue = this.userInfo.phone || '';
    },
    
    cancelEditPhone() {
      this.editingPhone = false;
      this.editPhoneValue = '';
    },
    
    async savePhone() {
      try {
        this.savingPhone = true;
        
        // Validate phone number format (support international format)
        const phoneRegex = /^[+]?[\d\s\-()]+$/;
        if (this.editPhoneValue && !phoneRegex.test(this.editPhoneValue)) {
          this.$message.error(this.$t('userSettings.messages.invalidPhoneFormat'));
          return;
        }
        
        // Call API to update phone number
        await this.$api.putWithErrorHandler('/users/profile', {
          phone: this.editPhoneValue
        }, {
          fallbackKey: 'userSettings.messages.updatePhoneFailed'
        });
        
        // Update local data
        this.userInfo.phone = this.editPhoneValue;
        
        this.$message.success(this.$t('userSettings.messages.phoneUpdateSuccess'));
        this.editingPhone = false;
      } catch (error) {
        console.error('Failed to update phone:', error);
        this.$message.error(this.$t('userSettings.messages.phoneUpdateFailed'));
      } finally {
        this.savingPhone = false;
      }
    },
    
    goToAddressManagement() {
      this.$router.push('/address');
    },
    
    goToFavorites() {
      this.$router.push('/favorites');
    },
    
    goToBrowsingHistory() {
      this.$router.push('/browsing-history');
    },


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

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: $spacing-2xl;
}



.settings-card {
  background: white;
  border-radius: $border-radius-lg;
  padding: $spacing-2xl;
  margin-bottom: $spacing-xl;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: $transition-base;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
}

.section-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-sm;
  border-bottom: 2px solid $primary-color;
}

.info-grid {
  display: grid;
  gap: $spacing-lg;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md 0;
  border-bottom: 1px solid $gray-200;
  
  &:last-child {
    border-bottom: none;
  }
  
  label {
    font-weight: $font-weight-medium;
    color: $text-secondary;
    min-width: 80px;
  }
  
  span {
    color: $text-primary;
    flex: 1;
    text-align: right;
  }
}

.phone-edit {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex: 1;
  justify-content: flex-end;
}

.phone-actions {
  display: flex;
  gap: $spacing-xs;
}

.function-grid {
  display: grid;
  gap: $spacing-md;
}

.function-item {
  display: flex;
  align-items: center;
  padding: $spacing-lg;
  border: 1px solid $gray-200;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: $transition-base;
  
  &:hover {
    border-color: $primary-color;
    background-color: rgba($primary-color, 0.05);
  }
}

.function-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba($primary-color, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: $spacing-md;
  
  .el-icon {
    font-size: $font-size-lg;
    color: $primary-color;
  }
}

.function-info {
  flex: 1;
  
  h3 {
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: $text-primary;
    margin: 0 0 $spacing-xs 0;
  }
  
  p {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin: 0;
  }
}

.function-item > .el-icon {
  color: $text-secondary;
  font-size: $font-size-lg;
}



/* 响应式设计 */
@include mobile {
  .container {
    padding: $spacing-lg $spacing-md;
  }
  
  .settings-card {
    padding: $spacing-lg;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-sm;
    
    span {
      text-align: left;
    }
  }
  
  .phone-edit {
    width: 100%;
    justify-content: flex-start;
  }
  
  .function-item {
    padding: $spacing-md;
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: $spacing-md;
  }
  
  .product-image {
    height: 160px;
  }
  
  .product-actions {
    flex-direction: column;
    
    .el-button {
      width: 100%;
    }
  }
}
</style>