<template>
  <div class="favorites-management">
    <PageBanner :title="$t('userSettings.features.favorites.title')" />

    <!-- 路径导航菜单 -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="container">
      <div class="favorites-header">
        <div class="header-info">
          <h2 class="page-title">{{ $t('userSettings.favoritesManagement') }}</h2>
          <p class="page-description">{{ $t('userSettings.features.favorites.description') }}</p>
        </div>
        <div class="header-stats" v-if="favorites.length > 0">
          <div class="stat-item">
            <span class="stat-number">{{ favorites.length }}</span>
            <span class="stat-label">{{ $t('userSettings.totalFavorites') }}</span>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loadingFavorites && favorites.length === 0" class="loading-container">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        <span>{{ $t('userSettings.loadingFavorites') }}</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="favorites.length === 0" class="empty-state">
        <el-icon>
          <Star />
        </el-icon>
        <h3>{{ $t('userSettings.noFavorites') }}</h3>
        <p>{{ $t('userSettings.noFavoritesDesc') }}</p>
        <el-button type="primary" @click="navigateTo('/Products')">
          <el-icon>
            <Search />
          </el-icon>
          {{ $t('userSettings.explorProducts') }}
        </el-button>
      </div>

      <!-- 商品列表 -->
      <div v-else class="favorites-list">
        <div v-for="item in favorites" :key="item.id" class="favorite-item">
          <!-- 第一行：图片和商品信息 -->
          <div class="item-row">
            <img :src="item.thumbnail_url || '/images/placeholder.jpg'" :alt="item.product_name" class="item-image">
            <div class="item-details">
              <h4 class="item-name">{{ item.product_name }}</h4>
              <p class="item-code">{{ $t('cart.productCode') }}: {{ item.product_id }}</p>
              <p class="item-category">{{ item.category_name }}</p>
              <div class="item-price">¥{{ item.price }}</div>
              <div class="favorite-time">
                <el-icon>
                  <Clock />
                </el-icon>
                {{ formatDate(item.created_at) }}
              </div>
            </div>
            <div class="item-actions">
              <el-button type="danger" size="small" @click="removeFavorite(item)" class="remove-btn">
                <el-icon>
                  <Delete />
                </el-icon>
                {{ $t('userSettings.removeFromFavorites') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="favoritesHasMore" class="load-more">
        <el-button @click="loadMoreFavorites" :loading="loadingFavorites" size="large">
          {{ $t('common.loadMore') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { Star, Delete, Loading, Clock, Search } from '@element-plus/icons-vue'
import PageBanner from '@/components/common/PageBanner.vue'
import NavigationMenu from '@/components/common/NavigationMenu.vue'

export default {
  name: 'FavoritesManagement',
  components: {
    Star,
    Delete,
    Loading,
    Clock,
    Search,
    PageBanner,
    NavigationMenu
  },
  data() {
    return {
      favorites: [],
      loadingFavorites: false,
      favoritesPage: 1,
      favoritesLimit: 20,
      favoritesTotalPages: 0,
      favoritesHasMore: false
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
          text: this.$t('userSettings.features.favorites.title'),
          to: null
        }
      ]
    }
  },
  created() {
    this.loadFavorites()
  },
  methods: {
    async loadFavorites() {
      try {
        this.loadingFavorites = true
        const result = await this.$api.getWithErrorHandler('/user-products', {
          params: {
            type: 'favorite',
            page: this.favoritesPage,
            limit: this.favoritesLimit
          },
          fallbackKey: 'userSettings.loadingFavorites'
        })
        
        if (this.favoritesPage === 1) {
          this.favorites = result.data.items
        } else {
          this.favorites.push(...result.data.items)
        }
        
        this.favoritesTotalPages = result.data.totalPages
        this.favoritesHasMore = this.favoritesPage < result.data.totalPages
      } catch (error) {
        console.error('Failed to load favorites:', error)
        this.$message.error(this.$t('userSettings.loadFavoritesFailed'))
      } finally {
        this.loadingFavorites = false
      }
    },

    loadMoreFavorites() {
      if (this.favoritesHasMore && !this.loadingFavorites) {
        this.favoritesPage++
        this.loadFavorites()
      }
    },

    async removeFavorite(item) {
      try {
        await this.$confirm(
          this.$t('userSettings.confirmRemoveFavorite'),
          this.$t('common.confirm'),
          {
            confirmButtonText: this.$t('common.confirm'),
            cancelButtonText: this.$t('common.cancel'),
            type: 'warning'
          }
        )

        await this.$api.deleteWithErrorHandler(`/user-products/${item.id}`, {
          fallbackKey: 'userSettings.deleteFailed'
        })

        this.favorites = this.favorites.filter(fav => fav.id !== item.id)
        this.$message.success(this.$t('userSettings.removeFromFavoritesSuccess'))
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Failed to remove favorite:', error)
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

.favorites-management {
  min-height: 100vh;
  background-color: $gray-100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: $spacing-2xl;
}

.favorites-header {
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

.header-stats {
  flex-shrink: 0;
  margin-left: $spacing-lg;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-number {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $primary-color;
  line-height: 1;
}

.stat-label {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-top: $spacing-xs;
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

.favorites-list {
  background: white;
  border-radius: $border-radius-lg;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: $spacing-xl;
}

.favorite-item {
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
  padding: $spacing-lg;
  gap: $spacing-lg;
}

.item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: $border-radius-md;
  flex-shrink: 0;
  border: 1px solid $gray-200;
}

.item-details {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: $font-size-lg;
  font-weight: $font-weight-medium;
  color: $text-primary;
  margin: 0 0 $spacing-xs 0;
  line-height: $line-height-tight;

  // 限制显示行数，避免过长
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-code {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin: 0 0 $spacing-xs 0;
}

.item-category {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin: 0 0 $spacing-xs 0;
  font-style: italic;
}

.item-price {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $primary-color;
  margin-bottom: $spacing-xs;
}

.favorite-time {
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

  .remove-btn {
    min-width: 120px;
  }
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

  .favorites-header {
    flex-direction: column;
    gap: $spacing-lg;
    padding: $spacing-lg;

    .header-stats {
      margin-left: 0;
      align-self: center;
    }
  }

  .item-row {
    flex-direction: column;
    align-items: flex-start;
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

    .remove-btn {
      min-width: 100px;
      font-size: $font-size-sm;
    }
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
    padding: $spacing-lg $spacing-md;
  }

  .item-image {
    width: 70px;
    height: 70px;
  }
}
</style>