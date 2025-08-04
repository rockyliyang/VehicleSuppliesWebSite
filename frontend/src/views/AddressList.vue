<template>
  <div class="address-list">
    <PageBanner :title="$t('address.list.title')" />

    <!-- 路径导航菜单 -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="container">
      <div class="header">
        <!-- 移除原来的页面标题，因为已经在PageBanner中显示 -->
        <el-button type="primary" @click="addAddress">
          <el-icon>
            <Plus />
          </el-icon>
          {{ $t('address.list.add') }}
        </el-button>
      </div>

      <div v-if="addresses.length === 0" class="empty-state">
        <el-empty :description="$t('address.list.empty')">
          <el-button type="primary" @click="addAddress">
            {{ $t('address.list.add') }}
          </el-button>
        </el-empty>
      </div>

      <div v-else class="address-cards">
        <div v-for="address in addresses" :key="address.id" class="address-card"
          :class="{ 'default-address': address.is_default }">
          <!-- Default标签 - 右上角 -->
          <el-tag v-if="address.is_default" type="success" size="small" class="default-tag">
            {{ $t('address.list.default') }}
          </el-tag>

          <!-- 地址信息区域 -->
          <div class="address-info">
            <div class="recipient-info">
              <span class="name">{{ address.recipient_name }}</span>
              <span class="phone">{{ address.phone }}</span>
            </div>
            <div class="address-content">
              <p class="address">{{ address.address }}</p>
              <div class="address-meta">
                <span v-if="address.postal_code" class="postal-code">
                  {{ address.postal_code }}
                </span>
                <span v-if="address.label" class="label">
                  {{ address.label }}
                </span>
              </div>
            </div>
          </div>

          <!-- 操作按钮区域 -->
          <div class="actions">
            <el-button v-if="!address.is_default" link type="primary" @click="setDefault(address.id)">
              {{ $t('address.list.setDefault') }}
            </el-button>
            <el-button link type="primary" @click="editAddress(address)">
              {{ $t('address.list.edit') }}
            </el-button>
            <el-button link type="danger" @click="deleteAddress(address.id)">
              {{ $t('address.list.delete') }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 地址对话框 -->
    <AddressDialog v-model="dialogVisible" :address-data="currentAddress" @success="handleDialogSuccess" />
  </div>
</template>

<script>
import { Plus } from '@element-plus/icons-vue'
import AddressDialog from '@/components/AddressDialog.vue'
import PageBanner from '@/components/common/PageBanner.vue'
import NavigationMenu from '@/components/common/NavigationMenu.vue'

export default {
  name: 'AddressList',
  components: {
    AddressDialog,
    PageBanner,
    NavigationMenu
  },
  data() {
    return {
      addresses: [],
      loading: false,
      dialogVisible: false,
      currentAddress: null,
      Plus
    }
  },
  computed: {
    breadcrumbItems() {
      return [
        {
          text: this.$t('userSettings.title') || '用户设置',
          to: '/user/settings'
        },
        {
          text: this.$t('address.list.title') || '地址管理',
          to: null // 当前页面，不需要链接
        }
      ]
    }
  },
  created() {
    this.fetchAddresses()
  },
  methods: {
    // 获取地址列表
    async fetchAddresses() {
      try {
        this.loading = true
        const result = await this.$api.getWithErrorHandler('/addresses', {
          fallbackKey: 'address.messages.loadFailed'
        })
        this.addresses = result.data
      } catch (error) {
        console.error('Failed to fetch addresses:', error)
      } finally {
        this.loading = false
      }
    },
    
    // 添加地址
    addAddress() {
      this.currentAddress = null
      this.dialogVisible = true
    },
    
    // 编辑地址
    editAddress(address) {
      this.currentAddress = address
      this.dialogVisible = true
    },
    
    // 对话框成功回调
    handleDialogSuccess() {
      this.fetchAddresses()
    },
    
    // 设置默认地址
    async setDefault(addressId) {
      try {
        await this.$api.putWithErrorHandler(`/addresses/${addressId}/default`, {}, {
          fallbackKey: 'address.messages.setDefaultFailed'
        })
        
        this.$message.success(this.$t('address.messages.setDefaultSuccess'))
        await this.fetchAddresses()
      } catch (error) {
        console.error('Failed to set default address:', error)
      }
    },
    
    // 删除地址
    async deleteAddress(addressId) {
      try {
        await this.$confirm(
          this.$t('address.messages.confirmDelete'),
          this.$t('common.confirm'),
          {
            confirmButtonText: this.$t('common.confirm'),
            cancelButtonText: this.$t('common.cancel'),
            type: 'warning'
          }
        )
        
        await this.$api.deleteWithErrorHandler(`/addresses/${addressId}`, {
          fallbackKey: 'address.messages.deleteFailed'
        })
        
        this.$message.success(this.$t('address.messages.deleteSuccess'))
        await this.fetchAddresses()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Failed to delete address:', error)
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

.address-list {
  min-height: 100vh;
  background-color: $gray-100;
}

.container {
  max-width: $container-max-width;
  margin: 0 auto;
  padding: $spacing-2xl;
}

.header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: $spacing-2xl;
}

.empty-state {
  text-align: center;
  padding: $spacing-6xl $spacing-lg;
}

.address-cards {
  display: grid;
  gap: $spacing-lg;
}

.address-card {
  @include card;
  position: relative;
  transition: $transition-base;

  &:hover {
    box-shadow: $shadow-xl;
    transform: translateY(-2px);
  }

  &.default-address {
    border: 2px solid $success-color;
    background: rgba($success-color, 0.05);
  }
}

.default-tag {
  position: absolute;
  top: $spacing-md;
  right: $spacing-md;
  z-index: 1;
}

.address-info {
  margin-bottom: $spacing-lg;
}

.recipient-info {
  @include flex-start;
  gap: $spacing-md;
  flex-wrap: wrap;
  margin-bottom: $spacing-md;

  .name {
    font-weight: $font-weight-semibold;
    color: $text-primary;
    font-size: $font-size-lg;
  }

  .phone {
    color: $text-secondary;
    font-size: $font-size-md;
  }
}

.address-content {
  .address {
    margin: 0 0 $spacing-sm 0;
    color: $text-primary;
    line-height: $line-height-relaxed;
    font-size: $font-size-md;
  }
}

.actions {
  @include flex-start;
  gap: $spacing-sm;
  flex-wrap: wrap;
  padding-top: $spacing-md;
  border-top: 1px solid $border-light;
}

.address-meta {
  @include flex-start;
  gap: $spacing-md;
  color: $text-muted;
  font-size: $font-size-sm;

  .postal-code,
  .label {
    &:before {
      content: '•';
      margin-right: $spacing-xs;
    }

    &:first-child:before {
      display: none;
    }
  }
}

/* 响应式设计 */
@include mobile {
  .container {
    padding: $spacing-md $spacing-sm;
  }

  .header {
    margin-bottom: $spacing-lg;

    .el-button {
      width: 100%;
      height: 44px;
      font-size: $font-size-md;
    }
  }

  .address-cards {
    gap: $spacing-md;
  }

  .address-card {
    padding: $spacing-md;
    border-radius: $border-radius-md;
    margin-bottom: 0;

    &.default-address {
      border-width: 1px;
    }
  }

  .address-info {
    margin-bottom: $spacing-md;
  }

  .default-tag {
    top: $spacing-sm;
    right: $spacing-sm;
    font-size: 10px;
    height: 18px;
    line-height: 16px;
    padding: 0 6px;
  }

  .recipient-info {
    flex-direction: column;
    gap: $spacing-xs;
    align-items: flex-start;
    margin-bottom: $spacing-md;

    .name {
      font-size: $font-size-md;
      font-weight: $font-weight-semibold;
    }

    .phone {
      font-size: $font-size-sm;
      color: $text-muted;
    }
  }

  .actions {
    display: flex;
    justify-content: space-between;
    gap: $spacing-xs;
    width: 100%;
    padding-top: $spacing-md;
    border-top: 1px solid $border-light;
    margin-top: $spacing-md;

    .el-button {
      flex: 1;
      font-size: $font-size-xs;
      padding: 8px 4px;
      height: auto;
      min-height: 36px;
      text-align: center;
      border-radius: $border-radius-sm;

      // 确保按钮文字不会换行
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      // 增强按钮的视觉效果
      &.el-button--primary {
        background-color: rgba($primary-color, 0.1);
        border-color: transparent;

        &:hover {
          background-color: rgba($primary-color, 0.2);
        }
      }

      &.el-button--danger {
        background-color: rgba($error-color, 0.1);
        border-color: transparent;

        &:hover {
          background-color: rgba($error-color, 0.2);
        }
      }
    }
  }

  .address-content {
    .address {
      font-size: $font-size-sm;
      line-height: $line-height-normal;
      margin-bottom: $spacing-xs;
      color: $text-primary;
    }
  }

  .address-meta {
    flex-direction: row;
    gap: $spacing-sm;
    font-size: $font-size-xs;

    .postal-code,
    .label {
      &:before {
        content: '•';
        margin-right: 4px;
        color: $text-muted;
      }

      &:first-child:before {
        display: none;
      }
    }
  }

  .empty-state {
    padding: $spacing-4xl $spacing-md;

    .el-empty {
      :deep(.el-empty__description) {
        font-size: $font-size-sm;
      }

      .el-button {
        width: 100%;
        height: 44px;
        font-size: $font-size-md;
      }
    }
  }
}
</style>