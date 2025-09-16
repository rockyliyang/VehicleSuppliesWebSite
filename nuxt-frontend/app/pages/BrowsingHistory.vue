<template>
  <div class="browsing-history">
    <PageBanner :title="$t('userSettings.features.browsingHistory.title')" />

    <!-- 路径导航菜单 -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="container">
      <div class="history-header">
        <div class="header-info">
          <h2 class="page-title">{{ $t('userSettings.browsingHistory') }}</h2>
          <p class="page-description">{{ $t('userSettings.features.browsingHistory.description') }}</p>
        </div>
        <div class="header-actions" v-if="browsingHistory.length > 0">
          <el-button type="danger" @click="clearHistory">
            <el-icon>
              <Delete />
            </el-icon>
            {{ $t('userSettings.clearHistory') }}
          </el-button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loadingHistory && browsingHistory.length === 0" class="loading-container">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        <span>{{ $t('userSettings.loadingHistory') }}</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="browsingHistory.length === 0" class="empty-state">
        <el-icon>
          <Clock />
        </el-icon>
        <h3>{{ $t('userSettings.noBrowsingHistory') }}</h3>
        <p>{{ $t('userSettings.noBrowsingHistoryDesc') }}</p>
        <el-button type="primary" @click="navigateTo('/Products')">
          {{ $t('userSettings.startBrowsing') }}
        </el-button>
      </div>

      <!-- 商品列表 -->
      <div v-else class="history-list">
        <div v-for="item in browsingHistory" :key="item.id" class="history-item">
          <div class="item-row">
            <div class="item-image">
              <img :src="item.thumbnail_url || '/images/placeholder.jpg'" :alt="item.product_name" />
            </div>
            <div class="item-details">
              <div class="item-name">{{ item.product_name }}</div>
              <div class="item-code">{{ $t('cart.productCode') }}: {{ item.product_id }}</div>
              <div class="item-category" v-if="item.category_name">{{ item.category_name }}</div>
              <div class="item-price">¥{{ item.price }}</div>
              <div class="view-time">
                <el-icon>
                  <Clock />
                </el-icon>
                {{ formatDate(item.updated_at) }}
              </div>
            </div>
            <div class="item-actions">
              <el-button type="danger" size="small" @click="removeFromHistory(item)">
                <el-icon>
                  <Delete />
                </el-icon>
                {{ $t('userSettings.removeFromHistory') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="historyHasMore" class="load-more">
        <el-button @click="loadMoreHistory" :loading="loadingHistory" size="large">
          {{ $t('common.loadMore') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { Clock, Delete, Loading } from '@element-plus/icons-vue'
import PageBanner from '@/components/common/PageBanner.vue'
import NavigationMenu from '@/components/common/NavigationMenu.vue'

export default {
  name: 'BrowsingHistory',
  components: {
    Clock,
    Delete,
    Loading,
    PageBanner,
    NavigationMenu
  },
  data() {
    return {
      browsingHistory: [],
      loadingHistory: false,
      historyPage: 1,
      historyLimit: 20,
      historyTotalPages: 0,
      historyHasMore: false
    }
  },
  computed: {
    breadcrumbItems() {
      return [
        {
          text: this.$t('userSettings.title'),
          to: '/UserSettings'
        },
        {
          text: this.$t('userSettings.features.browsingHistory.title'),
          to: null
        }
      ]
    }
  },
  created() {
    this.loadBrowsingHistory()
  },
  methods: {
    async loadBrowsingHistory() {
      try {
        this.loadingHistory = true
        const result = await this.$api.getWithErrorHandler('/user-products', {
          params: {
            type: 'viewed',
            page: this.historyPage,
            limit: this.historyLimit
          },
          fallbackKey: 'userSettings.loadingHistory'
        })
        
        if (this.historyPage === 1) {
          this.browsingHistory = result.data.items
        } else {
          this.browsingHistory.push(...result.data.items)
        }
        
        this.historyTotalPages = result.data.totalPages
        this.historyHasMore = this.historyPage < result.data.totalPages
      } catch (error) {
        console.error('Failed to load browsing history:', error)
        this.$message.error(this.$t('userSettings.loadHistoryFailed'))
      } finally {
        this.loadingHistory = false
      }
    },

    loadMoreHistory() {
      if (this.historyHasMore && !this.loadingHistory) {
        this.historyPage++
        this.loadBrowsingHistory()
      }
    },

    async clearHistory() {
      try {
        await this.$confirm(
          this.$t('userSettings.confirmClearHistory'),
          this.$t('common.confirm'),
          {
            confirmButtonText: this.$t('common.confirm'),
            cancelButtonText: this.$t('common.cancel'),
            type: 'warning'
          }
        )

        const historyIds = this.browsingHistory.map(item => item.id)
        await this.$api.deleteWithErrorHandler('/user-products', {
          data: {
            ids: historyIds,
            type: 'viewed'
          },
          fallbackKey: 'userSettings.deleteFailed'
        })

        this.browsingHistory = []
        this.historyPage = 1
        this.historyHasMore = false
        this.$message.success(this.$t('userSettings.clearHistorySuccess'))
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Failed to clear history:', error)
          this.$message.error(this.$t('userSettings.deleteFailed'))
        }
      }
    },

    async removeFromHistory(item) {
      try {
        await this.$confirm(
          this.$t('userSettings.confirmRemoveFromHistory'),
          this.$t('common.confirm'),
          {
            confirmButtonText: this.$t('common.confirm'),
            cancelButtonText: this.$t('common.cancel'),
            type: 'warning'
          }
        )

        await this.$api.deleteWithErrorHandler('/user-products', {
          data: {
            ids: [item.id],
            type: 'viewed'
          },
          fallbackKey: 'userSettings.deleteFailed'
        })

        // 从列表中移除该项
        const index = this.browsingHistory.findIndex(historyItem => historyItem.id === item.id)
        if (index > -1) {
          this.browsingHistory.splice(index, 1)
        }
        
        this.$message.success(this.$t('userSettings.removeFromHistorySuccess'))
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Failed to remove from history:', error)
          this.$message.error(this.$t('userSettings.deleteFailed'))
        }
      }
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        return this.$t('common.today')
      } else if (diffDays === 2) {
        return this.$t('common.yesterday')
      } else if (diffDays <= 7) {
        return this.$t('common.daysAgo', { days: diffDays - 1 })
      } else {
        return date.toLocaleDateString()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/_variables.scss' as *;
@use '@/assets/styles/_mixins.scss' as *;

.browsing-history {
  min-height: 100vh;
  background-color: $gray-100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: $spacing-2xl;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-2xl;
  background: white;
  padding: $spacing-2xl;
  border-radius: $border-radius-lg;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
  margin: 0 0 $spacing-sm 0;
}

.page-description {
  font-size: $font-size-md;
  color: $text-secondary;
  margin: 0;
}

.header-actions {
  flex-shrink: 0;
  margin-left: $spacing-lg;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-4xl;
  background: white;
  border-radius: $border-radius-lg;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: $text-secondary;

  .el-icon {
    font-size: $font-size-3xl;
    margin-bottom: $spacing-lg;
  }

  span {
    font-size: $font-size-lg;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-4xl;
  background: white;
  border-radius: $border-radius-lg;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;

  .el-icon {
    font-size: 80px;
    color: $gray-300;
    margin-bottom: $spacing-lg;
  }

  h3 {
    font-size: $font-size-xl;
    color: $text-primary;
    margin: 0 0 $spacing-md 0;
  }

  p {
    font-size: $font-size-md;
    color: $text-secondary;
    margin: 0 0 $spacing-xl 0;
    max-width: 400px;
  }
}

.history-list {
  background: white;
  border-radius: $border-radius-lg;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: $spacing-xl;
}

.history-item {
  border-bottom: 1px solid $gray-200;
  transition: $transition-base;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: $gray-50;
  }
}

.item-row {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
  padding: $spacing-lg;
}

.item-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: $border-radius-sm;
    border: 1px solid $gray-300;
  }
}

.item-details {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: $font-size-lg;
  font-weight: $font-weight-medium;
  color: $text-primary;
  margin-bottom: $spacing-xs;
  line-height: $line-height-tight;
}

.item-code {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
}

.item-category {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
}

.item-price {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $primary-color;
  margin-bottom: $spacing-xs;
}

.view-time {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-sm;
  color: $text-secondary;

  .el-icon {
    font-size: $font-size-sm;
  }
}

.item-actions {
  flex-shrink: 0;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: $spacing-xl 0;
}

/* 响应式设计 */
@include mobile {
  .container {
    padding: $spacing-lg $spacing-md;
  }

  .history-header {
    flex-direction: column;
    gap: $spacing-lg;
    padding: $spacing-lg;

    .header-actions {
      margin-left: 0;
      align-self: stretch;
    }
  }

  .item-row {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-md;
    padding: $spacing-md;
  }

  .item-image {
    width: 60px;
    height: 60px;
    align-self: center;
  }

  .item-details {
    text-align: center;
  }

  .item-actions {
    align-self: center;
  }

  .empty-state {
    padding: $spacing-2xl;

    .el-icon {
      font-size: 60px;
    }
  }
}

@include tablet {
  .item-row {
    gap: $spacing-md;
    padding: $spacing-md;
  }

  .item-image {
    width: 70px;
    height: 70px;
  }
}
</style>