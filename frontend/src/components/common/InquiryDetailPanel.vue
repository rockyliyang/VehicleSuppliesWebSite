<template>
  <div class="inquiry-detail-panel" :class="{ 'mobile-layout': isMobile }">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-content">
        <i class="material-icons spinning">refresh</i>
        <p>{{ $t('common.loading') || '加载中...' }}</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-content">
        <i class="material-icons">error</i>
        <p>{{ error }}</p>
        <button @click="fetchInquiryDetails()" class="retry-btn">
          {{ $t('common.retry') || '重试' }}
        </button>
      </div>
    </div>

    <div v-else-if="inquiry" class="inquiry-detail-content" :class="{ 'mobile-content': isMobile }">
      <!-- 手机端：聊天窗口在上面 -->
      <template v-if="isMobile">
        <!-- Sales Communication -->
        <CommunicationSection :messages="inquiry.messages" :inquiry-id="inquiry.id" :items-count="inquiry.items.length"
          :status="inquiry.status" :initial-message="newMessage" :is-mobile="isMobile"
          :is-checkout-mode="isCheckoutMode" @update-message="updateMessage" @checkout="handleCheckout"
          @new-messages="handleNewMessages" />

        <!-- Products Section -->
        <div class="inquiry-items-section">
          <div class="section-header">
            <h4 class="section-title">{{ $t('products.products') || 'Products' }}</h4>
            <!-- 添加产品按钮 - 移到标题旁边，single类型的询价不允许添加商品，checkout模式下隐藏 -->
            <button
              v-if="!isCheckoutMode && inquiry.status === 'inquiried' && !showAddProduct && inquiry.inquiry_type !== 'single'"
              @click="showAddProduct = true" class="add-product-btn-header">
              <i class="material-icons">add</i>
              {{ $t('inquiry.addProduct') || '添加产品' }}
            </button>
          </div>

          <div class="inquiry-items">
            <!-- 现有商品 -->
            <div v-for="item in inquiry.items" :key="item.productId" class="inquiry-item"
              :data-product-id="item.productId">
              <!-- 第一行：图片和商品名 -->
              <div class="item-row-1">
                <img :src="item.image_url || item.imageUrl" :alt="item.product_name || item.name" class="item-image">
                <div class="item-details">
                  <p class="item-name">{{ item.product_name || item.name }}</p>
                  <p class="item-code">{{ $t('cart.productType') || '产品类型' }}: {{ item.category_name }}
                  </p>
                </div>
              </div>
              <!-- 第二行：数量、单价和删除按钮 -->
              <div class="item-row-2">
                <div class="item-controls">
                  <div class="control-group">
                    <label class="control-label">{{ $t('cart.quantity') || '数量' }}</label>
                    <input type="number" class="control-input" v-model="item.quantity" min="1"
                      @change="updateItemQuantity(item)" :readonly="isCheckoutMode || inquiry.status !== 'inquiried'">
                  </div>
                  <div class="control-group">
                    <label class="control-label">{{ $t('cart.unitPrice') || '期望价格' }}</label>
                    <div class="control-text">{{ getPriceRangeDisplay(item) || '价格待定' }}</div>
                  </div>
                </div>
                <div class="item-actions">
                  <!-- single类型的询价不允许删除商品，checkout模式下隐藏删除按钮 -->
                  <button v-if="!isCheckoutMode && inquiry.inquiry_type !== 'single'"
                    class="remove-item-btn remove-inquiry-item-btn"
                    @click="removeItem(item)"
                    :data-product-id="item.product_id || item.productId"
                    :title="$t('cart.removeFromInquiry') || '从询价单中移除'">
                    <i class="material-icons">remove_circle_outline</i>
                  </button>
                </div>
              </div>
            </div>

            <!-- 新增商品行 -->
            <div v-if="showAddProduct" class="inquiry-item new-item">
              <div class="item-row-1">
                <div class="item-image-placeholder">
                  <i class="material-icons">image</i>
                </div>
                <div class="item-details">
                  <div class="product-search-input-container">
                    <input type="text" v-model="searchKeyword" @input="searchProducts" @focus="showSearchResults = true"
                      @blur="hideSearchResults" :placeholder="$t('inquiry.searchProductPlaceholder') || '输入商品名称搜索...'"
                      class="product-search-input" ref="productSearchInput" />
                    <!-- 浮动搜索结果 -->
                    <div v-if="searchResults.length > 0 && showSearchResults" class="floating-search-results">
                      <div v-for="product in searchResults" :key="product.id" class="floating-result-item"
                        @click="selectProduct(product)">
                        <div class="result-image">
                          <img :src="product.thumbnail_url || '/images/placeholder.jpg'" :alt="product.name" />
                        </div>
                        <div class="result-details">
                          <h5>{{ product.name }}</h5>
                          <p class="result-code">{{ product.product_code }}</p>
                          <p class="result-price">${{ product.price }}</p>
                        </div>
                      </div>
                    </div>
                    <!-- 搜索状态 -->
                    <div v-if="searching" class="search-loading">
                      <i class="material-icons spinning">refresh</i>
                      {{ $t('inquiry.searching') || '搜索中...' }}
                    </div>
                    <!-- 无搜索结果 -->
                    <div v-if="showSearchResults && !searching && searchKeyword && searchResults.length === 0"
                      class="no-search-results">
                      {{ $t('inquiry.noSearchResults') || '未找到相关商品' }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="item-row-2">
                <div class="item-controls">
                  <div class="control-group">
                    <label class="control-label">{{ $t('cart.quantity') || '数量' }}</label>
                    <input type="number" class="control-input" value="1" readonly>
                  </div>
                  <div class="control-group">
                    <label class="control-label">{{ $t('cart.unitPrice') || '期望价格' }}</label>
                    <input type="number" class="control-input" placeholder="0.00" readonly>
                  </div>
                </div>
                <div class="item-actions">
                  <button class="remove-item-btn cancel-add-btn" @click="cancelAddProduct"
                    :title="$t('common.cancel') || '取消'">
                    <i class="material-icons">close</i>
                  </button>
                </div>
              </div>
            </div>

            <p v-if="inquiry.items.length === 0 && !showAddProduct" class="no-items-message">
              {{ $t('cart.noItemsInInquiry') || '此询价单中没有商品，请从购物车添加商品。' }}
            </p>
          </div>
        </div>
      </template>

      <!-- 桌面端：保持原有布局 -->
      <template v-else>
        <!-- Products Section -->
        <div class="inquiry-items-section">
          <div class="section-header">
            <h4 class="section-title">{{ $t('products.products') || 'Products' }}</h4>
            <!-- 添加产品按钮 - 移到标题旁边，single类型的询价不允许添加商品，checkout模式下隐藏 -->
            <button
              v-if="!isCheckoutMode && inquiry.status === 'inquiried' && !showAddProduct && inquiry.inquiry_type !== 'single'"
              @click="showAddProduct = true" class="add-product-btn-header">
              <i class="material-icons">add</i>
              {{ $t('inquiry.addProduct') || '添加产品' }}
            </button>
          </div>

          <div class="inquiry-items">
            <!-- 现有商品 -->
            <div v-for="item in inquiry.items" :key="item.productId" class="inquiry-item"
              :data-product-id="item.productId">
              <!-- 第一行：图片和商品名 -->
              <div class="item-row-1">
                <img :src="item.image_url || item.imageUrl" :alt="item.product_name || item.name" class="item-image">
                <div class="item-details">
                  <p class="item-name">{{ item.product_name || item.name }}</p>
                  <p class="item-code">{{ $t('cart.productType') || '产品类型' }}: {{ item.category_name }}
                  </p>
                </div>
              </div>
              <!-- 第二行：数量、单价和删除按钮 -->
              <div class="item-row-2">
                <div class="item-controls">
                  <div class="control-group">
                    <label class="control-label">{{ $t('cart.quantity') || '数量' }}</label>
                    <input type="number" class="control-input" v-model="item.quantity" min="1"
                      @change="updateItemQuantity(item)" :readonly="isCheckoutMode || inquiry.status !== 'inquiried'">
                  </div>
                  <div class="control-group">
                    <label class="control-label">{{ $t('cart.unitPrice') || '期望价格' }}</label>
                    <div class="control-text">{{ getPriceRangeDisplay(item) || '价格待定' }}</div>
                  </div>
                </div>
                <div class="item-actions">
                  <!-- single类型的询价不允许删除商品，checkout模式下隐藏删除按钮 -->
                  <button v-if="!isCheckoutMode && inquiry.inquiry_type !== 'single'"
                    class="remove-item-btn remove-inquiry-item-btn"
                    @click="removeItem(item)"
                    :data-product-id="item.product_id || item.productId"
                    :title="$t('cart.removeFromInquiry') || '从询价单中移除'">
                    <i class="material-icons">remove_circle_outline</i>
                  </button>
                </div>
              </div>
            </div>

            <!-- 新增商品行 -->
            <div v-if="showAddProduct" class="inquiry-item new-item">
              <div class="item-row-1">
                <div class="item-image-placeholder">
                  <i class="material-icons">image</i>
                </div>
                <div class="item-details">
                  <div class="product-search-input-container">
                    <input type="text" v-model="searchKeyword" @input="searchProducts" @focus="showSearchResults = true"
                      @blur="hideSearchResults" :placeholder="$t('inquiry.searchProductPlaceholder') || '输入商品名称搜索...'"
                      class="product-search-input" ref="productSearchInput" />
                    <!-- 浮动搜索结果 -->
                    <div v-if="searchResults.length > 0 && showSearchResults" class="floating-search-results">
                      <div v-for="product in searchResults" :key="product.id" class="floating-result-item"
                        @click="selectProduct(product)">
                        <div class="result-image">
                          <img :src="product.thumbnail_url || '/images/placeholder.jpg'" :alt="product.name" />
                        </div>
                        <div class="result-details">
                          <h5>{{ product.name }}</h5>
                          <p class="result-code">{{ product.product_code }}</p>
                          <p class="result-price">${{ product.price }}</p>
                        </div>
                      </div>
                    </div>
                    <!-- 搜索状态 -->
                    <div v-if="searching" class="search-loading">
                      <i class="material-icons spinning">refresh</i>
                      {{ $t('inquiry.searching') || '搜索中...' }}
                    </div>
                    <!-- 无搜索结果 -->
                    <div v-if="showSearchResults && !searching && searchKeyword && searchResults.length === 0"
                      class="no-search-results">
                      {{ $t('inquiry.noSearchResults') || '未找到相关商品' }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="item-row-2">
                <div class="item-controls">
                  <div class="control-group">
                    <label class="control-label">{{ $t('cart.quantity') || '数量' }}</label>
                    <input type="number" class="control-input" value="1" readonly>
                  </div>
                  <div class="control-group">
                    <label class="control-label">{{ $t('cart.unitPrice') || '期望价格' }}</label>
                    <input type="number" class="control-input" placeholder="0.00" readonly>
                  </div>
                </div>
                <div class="item-actions">
                  <button class="remove-item-btn cancel-add-btn" @click="cancelAddProduct"
                    :title="$t('common.cancel') || '取消'">
                    <i class="material-icons">close</i>
                  </button>
                </div>
              </div>
            </div>

            <p v-if="inquiry.items.length === 0 && !showAddProduct" class="no-items-message">
              {{ $t('cart.noItemsInInquiry') || '此询价单中没有商品，请从购物车添加商品。' }}
            </p>
          </div>
        </div>

        <!-- Sales Communication -->
        <CommunicationSection v-if="inquiry.id" :messages="inquiry.messages" :inquiry-id="inquiry.id"
          :items-count="inquiry.items.length" :status="inquiry.status" :initial-message="newMessage"
          :is-mobile="isMobile" :is-checkout-mode="isCheckoutMode" @update-message="updateMessage"
          @checkout="handleCheckout" />
      </template>
    </div>

    <div v-else class="no-inquiry-selected">
      <div class="no-inquiry-content">
        <i class="material-icons">assignment</i>
        <p>{{ $t('cart.selectInquiry') || '请选择一个询价单查看详情' }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import CommunicationSection from './CommunicationSection.vue';
import { calculatePriceByQuantity, getPriceRangeDisplayUtil } from '@/utils/priceUtils';
import { getMinQuantityFromPriceRanges } from '@/utils/productUtils';

export default {
  name: 'InquiryDetailPanel',
  components: {
    CommunicationSection
  },
  props: {
    inquiryId: {
      type: [String, Number],
      default: null
    },
    isMobile: {
      type: Boolean,
      default: false
    },
    isCheckoutMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['remove-item', 'update-message', 'checkout-inquiry', 'item-added', 'new-messages-received'],
  data() {
    return {
      inquiry: null,
      loading: false,
      error: null,
      newMessage: '',
      showAddProduct: false,
      searchKeyword: '',
      searchResults: [],
      searching: false,
      searchTimeout: null,
      showSearchResults: false
    };
  },
  watch: {
    inquiryId: {
      handler(newInquiryId) {
        if (newInquiryId) {
          this.fetchInquiryDetails();
        } else {
          this.inquiry = null;
        }
      },
      immediate: true
    },
    inquiry: {
      handler(newInquiry) {
        console.log('newInquiry:', newInquiry);
        console.log('isCheckoutMode:',this.isCheckoutMode);
        if (newInquiry && newInquiry.newMessage !== undefined) {
          this.newMessage = newInquiry.newMessage;
        }
      }
    }
  },

  computed: {
    // 计算总价
    totalPrice() {
      if (!this.inquiry || !this.inquiry.items) return 0;
      return this.inquiry.items.reduce((total, item) => {
        const price = this.getCalculatedPrice(item);
        return total + (price * item.quantity);
      }, 0);
    }
  },
  methods: {
    // 获取询价详情数据
    async fetchInquiryDetails() {
      if (!this.inquiryId) return;
      
      this.loading = true;
      this.error = null;
      
      try {
        const response = await this.$api.getWithErrorHandler(`/inquiries/${this.inquiryId}`, {}, {
          fallbackKey: 'INQUIRY.FETCH.FAILED'
        });
        
        this.inquiry = response.data.inquiry;
        this.inquiry.items = response.data.items;
      } catch (error) {
        console.error('获取询价详情失败:', error);
        this.error = '获取询价详情失败';
        this.inquiry = null;
      } finally {
        this.loading = false;
      }
    },
    
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    // 获取价格范围显示文本
    getPriceRangeDisplay(item) {
      if (item.unit_price) {
        return this.$store.getters.formatPrice(item.unit_price);
      } else {
        const formatPrice = this.$store.getters.formatPrice;
        return getPriceRangeDisplayUtil(item, formatPrice);
      }
    },

    updateMessage(inquiryId, value) {
      this.newMessage = value;
      this.$emit('update-message', inquiryId, value);
    },
    
    // 处理新消息事件（简化版本，消息显示由 CommunicationSection 直接处理）
    handleNewMessages() {
      /*if (!eventData || !eventData.messages || eventData.messages.length === 0) return;
      
      const { messages } = eventData;
      
      if (messages.length > 0) {
        // 显示新消息提示
        messages.forEach(newMessage => {
          if (this.$messageHandler) {
            this.$messageHandler.showInfo(`收到新消息: ${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}`);
          }
        });
        
        //console.log(`InquiryDetailPanel: 收到 ${messages.length} 条新消息提示`);
      }*/
    },
    handleCheckout() {

      if (this.inquiry && this.inquiry.items.length > 0) {
        // 将询价单商品转换为购物车格式，确保字段名称与UnifiedCheckout期望的格式一致
        const cartItems = this.inquiry.items.map(item => ({
          id: item.id,
          product_id: item.product_id,
          category_name: item.category_name || '',
          product_name: item.product_name,
          image_url: item.imageUrl || item.image_url || require('@/assets/images/default-image.svg'),
          quantity: item.quantity,
          price: this.getCalculatedPrice(item), // 使用calculatedPrice
          length: item.product_length,
          width: item.product_width,
          height: item.product_height,
          weight: item.product_weight,
          selected: true,
          inquiry_id: this.inquiry.id
        }));
        
        console.log('cartItemsWithInquiry:', cartItems);
        // 将商品数据存储到sessionStorage，供UnifiedCheckout页面使用
        sessionStorage.setItem('selectedCartItems', JSON.stringify(cartItems));
        
        // 发出checkout事件，更新询价单状态为Checkouted
        this.$emit('checkout-inquiry', this.inquiry.id);
        
        // 跳转到UnifiedCheckout页面，并传递inquiryId参数
        this.$router.push({
          name: 'UnifiedCheckout',
          query: { inquiryId: this.inquiry.id }
        });
      }
    },
    
    // 产品搜索方法
    searchProducts() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      this.searchTimeout = setTimeout(async () => {
        if (!this.searchKeyword.trim()) {
          this.searchResults = [];
          return;
        }
        
        this.searching = true;
        try {
          const response = await this.$api.getWithErrorHandler('/products/search', {
            params: {
              keyword: this.searchKeyword.trim(),
              limit: 10
            }
          }, {
            fallbackKey: 'PRODUCT.SEARCH.FAILED'
          });
          
          if (response.success) {
            // 先过滤掉已在询价单中的产品，再设置到 searchResults
            const existingProductIds = new Set(
              this.inquiry.items.map(item => item.product_id || item.productId)
            );
            
            const filteredResults = (response.data || []).filter(product => 
              !existingProductIds.has(product.id)
            );
            
            // 一次性设置过滤后的结果，避免闪烁
            this.searchResults = filteredResults;
            
            if (filteredResults.length > 0) {
              this.showSearchResults = true;
            }
          } else {
            this.searchResults = [];
          }
        } catch (error) {
          console.error('搜索产品失败:', error);
          this.searchResults = [];
        } finally {
          this.searching = false;
        }
      }, 300);
    },
    
    // 选择产品
    async selectProduct(product) {
      // 立即隐藏搜索结果
      this.showSearchResults = false;
      
      // 检查产品是否已在询价单中
      const existingItem = this.inquiry.items.find(item => 
        (item.product_id || item.productId) === product.id
      );
      
      if (existingItem) {
        this.$messageHandler.showWarning(`产品 "${product.name}" 已在询价单中`);
        this.cancelAddProduct();
        return;
      }
      
      try {
        // 获取产品的最小数量
        const minQuantity = this.getMinQuantityFromPriceRanges(product);
        
        const response = await this.$api.postWithErrorHandler(`/inquiries/${this.inquiry.id}/items`, {
          productId: product.id,
          quantity: minQuantity,
          unitPrice: product.price
        }, {
          fallbackKey: 'INQUIRY.ADD_ITEM.FAILED'
        });
        
        if (response.success) {
          // 添加新商品到询价单，确保数据格式正确
          const newItem = {
            id: response.data.id,
            productId: response.data.product_id,
            product_id: response.data.product_id,
            name: response.data.product_name,
            product_name: response.data.product_name,
            imageUrl: response.data.image_url || require('@/assets/images/default-image.svg'),
            image_url: response.data.image_url,
            quantity: response.data.quantity,
            unit_price: response.data.unit_price || product.price,
            price: response.data.price || response.data.unit_price || product.price
          };
          
          // 更新本地询价单列表
          this.inquiry.items.push(newItem);
          
          this.$emit('item-added', newItem);
          this.cancelAddProduct();
        }
      } catch (error) {
        console.error('添加产品失败:', error);
      }
    },
    
    // 取消添加产品
    cancelAddProduct() {
      this.showAddProduct = false;
      this.searchKeyword = '';
      this.searchResults = [];
      this.searching = false;
      this.showSearchResults = false;
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
    },
    
    // 隐藏搜索结果
    hideSearchResults() {
      setTimeout(() => {
        this.showSearchResults = false;
      }, 300);
    },
    
    // 更新商品数量
    async updateItemQuantity(item) {
      if (!item.quantity || item.quantity < 1) {
        item.quantity = 1;
        return;
      }
      
      // 使用本地价格范围数据验证最小数量
      if (item.price_ranges && item.price_ranges.length > 0) {
        const minQuantity = this.getMinQuantityFromPriceRanges({ price_ranges: item.price_ranges });
        if (item.quantity < minQuantity) {
          this.$messageHandler.showWarning(`数量不能小于最小起订量 ${minQuantity}`);
          item.quantity = minQuantity;
          return;
        }
      }
      
      try {
        const response = await this.$api.putWithErrorHandler(`/inquiries/${this.inquiry.id}/items/${item.id}`, {
          quantity: item.quantity
        }, {
          fallbackKey: 'INQUIRY.UPDATE_ITEM.FAILED'
        });
        
        if (response.success) {
          // 成功消息由 putWithErrorHandler 自动处理
        }
      } catch (error) {
        console.error('更新数量失败:', error);
      }
    },
    
    // 移除商品
    async removeItem(item) {
      try {
        await this.$api.deleteWithErrorHandler(`/inquiries/${this.inquiry.id}/items/${item.id}`, {
          fallbackKey: 'INQUIRY.ITEM.DELETE.FAILED'
        });
        
        // 直接从本地数据中移除商品
        const itemIndex = this.inquiry.items.findIndex(i => i.id === item.id);
        if (itemIndex !== -1) {
          this.inquiry.items.splice(itemIndex, 1);
        }
        
        // 通知父组件更新已询价商品ID集合
        this.$emit('remove-item', this.inquiry.id, item.id, item.product_id || item.productId);
        
      } catch (error) {
        console.error('删除询价商品失败:', error);
        this.$messageHandler.showError(this.$t('cart.removeFromInquiryFailed') || '删除询价商品失败', 'INQUIRY.ITEM.DELETE.FAILED');
      }
    },
    
    // 显示添加产品表单
    showAddProductForm() {
      this.showAddProduct = true;
      this.$nextTick(() => {
        if (this.$refs.productSearchInput) {
          this.$refs.productSearchInput.focus();
        }
      });
    },
    

    
    // 计算商品的calculatedPrice
    getCalculatedPrice(item) {
      // 如果有unit_price，优先使用
      if (item.unit_price) {
        return item.unit_price;
      }
      
      // 否则使用价格范围计算
      if (item.price_ranges && item.price_ranges.length > 0) {
        return calculatePriceByQuantity(item.price_ranges, item.quantity);
      }
      
      // 如果没有价格范围，返回原始价格或默认价格
      return item.original_price || item.price || 0;
    },
    
    // 获取产品的最小数量
    getMinQuantityFromPriceRanges(product) {
      return getMinQuantityFromPriceRanges(product);
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';

/* 询价详情面板 */
.inquiry-detail-panel {
  flex: 1;
  background: $white;
  border-radius: $border-radius-md;
  box-shadow: $shadow-md;
  display: flex;
  flex-direction: column;
}

.inquiry-detail-content {
  padding: $spacing-lg;
  height: 100%;
  display: flex;
  flex-direction: row;
  gap: $spacing-lg;
}

.section-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin: 0;
}

/* 询价商品区域 */
.inquiry-items-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: $spacing-lg;
  min-height: 0;
  height: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-sm;
  border-bottom: $border-width-md solid $primary-color;
}

.add-product-btn-header {
  padding: $spacing-sm $spacing-md;
  background: $primary-color;
  color: $white;
  border: none;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  transition: $transition-base;
  min-height: 36px;
}

.add-product-btn-header:hover {
  background: $primary-dark;
  transform: translateY($hover-transform-sm);
}

.add-product-btn-header .material-icons {
  font-size: $font-size-md;
}

.inquiry-items {
  flex: 1;
  overflow-y: auto;
  border: $border-width-sm solid $border-light;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  background: $gray-50;
  min-height: 0;
  margin-top: $spacing-sm;
}

.inquiry-item {
  background: $background-light;
  border: $border-width-sm solid $border-light;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-sm;
  transition: $transition-slow;
}

.inquiry-item:hover {
  box-shadow: $shadow-md;
}

.item-row-1 {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;
}

.item-image {
  width: $product-thumbnail-size;
  height: $product-thumbnail-size;
  object-fit: cover;
  border-radius: $border-radius-sm;
  border: $border-width-sm solid $gray-300;
}

.item-details {
  flex: 1;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: $text-primary;
  margin: 0 0 $spacing-xs 0;
  line-height: $line-height-tight;
}

.item-code {
  font-size: $font-size-xs;
  color: $text-secondary;
  margin: 0;
}

.item-row-2 {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.item-controls {
  display: flex;
  gap: $spacing-md;
  flex: 1;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.control-label {
  font-size: $font-size-xs;
  color: $text-secondary;
  font-weight: $font-weight-medium;
}

.control-input {
  width: 80px;
  padding: $spacing-sm $spacing-sm;
  border: $border-width-sm solid $gray-300;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  background: $background-light;
}

.control-text {
  width: 120px;
  padding: $spacing-sm 0;
  font-size: $font-size-sm;
  text-align: left;
  color: $text-primary;
  min-height: 20px;
  display: flex;
  align-items: center;
}

.item-actions {
  display: flex;
  align-items: center;
}

.remove-item-btn {
  background: none;
  border: none;
  color: $error-color;
  cursor: pointer;
  padding: $spacing-sm;
  border-radius: $border-radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-base;
}

.remove-item-btn:hover {
  background: rgba($error-color, 0.1);
}

.remove-item-btn .material-icons {
  font-size: $font-size-xl;
}

.no-items-message {
  text-align: center;
  color: $text-secondary;
  font-style: italic;
  padding: $spacing-4xl $spacing-lg;
  margin: 0;
}

/* 新增商品行样式 */
.new-item {
  border: 2px dashed $primary-color;
  background: rgba($primary-color, 0.05);
}

.item-image-placeholder {
  width: $product-thumbnail-size;
  height: $product-thumbnail-size;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $gray-200;
  border-radius: $border-radius-sm;
  color: $gray-500;
}

.item-image-placeholder .material-icons {
  font-size: 24px;
}

.product-search-input-container {
  position: relative;
  flex: 1;
}

.product-search-input {
  width: 100%;
  padding: $spacing-sm;
  border: $border-width-sm solid $gray-300;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  background: $white;
  transition: $transition-base;
}

.product-search-input:focus {
  outline: none;
  border-color: $primary-color;
  box-shadow: 0 0 0 2px rgba($primary-color, 0.2);
}

/* 浮动搜索结果 */
.floating-search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: $white;
  border: $border-width-sm solid $border-light;
  border-radius: $border-radius-sm;
  box-shadow: $shadow-lg;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 2px;
}

.floating-result-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border-bottom: $border-width-sm solid $border-light;
  cursor: pointer;
  transition: $transition-base;
}

.floating-result-item:last-child {
  border-bottom: none;
}

.floating-result-item:hover {
  background: $background-light;
}

.floating-result-item .result-image {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.floating-result-item .result-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: $border-radius-sm;
  border: $border-width-sm solid $border-light;
}

.floating-result-item .result-details {
  flex: 1;
  min-width: 0;
}

.floating-result-item .result-details h5 {
  margin: 0 0 2px 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $text-primary;
  line-height: $line-height-tight;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.floating-result-item .result-code {
  margin: 0 0 2px 0;
  font-size: $font-size-xs;
  color: $text-secondary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.floating-result-item .result-price {
  margin: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $primary-color;
}

/* 搜索状态和无结果提示 */
.search-loading {
  padding: $spacing-md;
  text-align: center;
  color: $text-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  font-size: $font-size-sm;
}

.search-loading .material-icons {
  font-size: $font-size-md;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.no-search-results {
  padding: $spacing-md;
  text-align: center;
  color: $text-secondary;
  font-size: $font-size-sm;
  font-style: italic;
}

.cancel-add-btn {
  background: $gray-500;
  color: $white;
  border: none;
  border-radius: $border-radius-full;
  padding: $spacing-sm;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-base;
}

.cancel-add-btn:hover {
  background: $gray-600;
}

.cancel-add-btn .material-icons {
  font-size: $font-size-lg;
}

/* 添加产品功能样式 */
.add-product-section {
  margin-top: $spacing-md;
  padding-top: $spacing-md;
  border-top: $border-width-sm solid $border-light;
}

.add-product-btn {
  width: 100%;
  padding: $spacing-md;
  background: $primary-color;
  color: $white;
  border: none;
  border-radius: $border-radius-md;
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  transition: $transition-base;
  min-height: 44px;
}

.add-product-btn:hover {
  background: $primary-dark;
  transform: translateY($hover-transform-sm);
}

.add-product-btn .material-icons {
  font-size: $font-size-lg;
}

.product-search-section {
  background: $background-light;
  border: $border-width-sm solid $border-light;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
}

.search-input-container {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
}

.product-search-input {
  flex: 1;
  padding: $spacing-md;
  border: $border-width-sm solid $gray-300;
  border-radius: $border-radius-sm;
  font-size: $font-size-md;
  background: $white;
  transition: $transition-base;
}

.product-search-input:focus {
  outline: none;
  border-color: $primary-color;
  box-shadow: 0 0 0 2px rgba($primary-color, 0.2);
}

.cancel-search-btn {
  background: $gray-500;
  color: $white;
  border: none;
  border-radius: $border-radius-sm;
  padding: $spacing-sm;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-base;
  min-width: 40px;
  min-height: 40px;
}

.cancel-search-btn:hover {
  background: $gray-600;
}

.cancel-search-btn .material-icons {
  font-size: $font-size-lg;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  border: $border-width-sm solid $border-light;
  border-radius: $border-radius-sm;
  background: $white;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  border-bottom: $border-width-sm solid $border-light;
  cursor: pointer;
  transition: $transition-base;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: $background-light;
}

.result-image {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
}

.result-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: $border-radius-sm;
  border: $border-width-sm solid $border-light;
}

.result-details {
  flex: 1;
  min-width: 0;
}

.result-details h5 {
  margin: 0 0 $spacing-xs 0;
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
  color: $text-primary;
  line-height: $line-height-tight;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-code {
  margin: 0 0 $spacing-xs 0;
  font-size: $font-size-sm;
  color: $text-secondary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-price {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  color: $primary-color;
}

.no-results {
  padding: $spacing-lg;
  text-align: center;
  color: $text-secondary;
  font-style: italic;
  border: $border-width-sm solid $border-light;
  border-radius: $border-radius-sm;
  background: $white;
}

.search-loading {
  padding: $spacing-lg;
  text-align: center;
  color: $text-secondary;
  border: $border-width-sm solid $border-light;
  border-radius: $border-radius-sm;
  background: $white;
}

/* Action按钮区域 */
.action-buttons-section {
  display: flex;
  gap: $spacing-sm;
  align-items: center;
  padding: $spacing-sm 0;
  border-top: $border-width-sm solid $border-light;
  margin-top: $spacing-sm;
}

.checkout-btn {
  padding: $spacing-md $spacing-lg;
  background: $success-color;
  color: $white;
  border: none;
  border-radius: $border-radius-sm;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  transition: $transition-base;
  min-height: 44px;
  flex: 1;
}

.checkout-btn:hover:not(:disabled) {
  background: $success-dark;
  transform: translateY($hover-transform-sm);
}

.checkout-btn:disabled {
  background: $gray-500;
  cursor: not-allowed;
  transform: none;
}

.checkout-btn.checkouted {
  background: $info-color;
  color: $white;
}

.checkout-btn.checkouted:disabled {
  background: $info-color;
  opacity: 0.8;
}

.checkout-btn .material-icons {
  font-size: $font-size-xl;
}



/* 无选中询价单状态 */
.no-inquiry-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-secondary;
}

.no-inquiry-content {
  text-align: center;
}

.no-inquiry-content .material-icons {
  font-size: $spacing-5xl;
  color: $gray-300;
  margin-bottom: $spacing-sm;
}

.no-inquiry-content p {
  font-size: $font-size-xl;
  margin: 0;
}

/* 手机端上下布局 */
.mobile-layout {
  .inquiry-detail-content.mobile-content {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 0;
  }

  /* CommunicationSection 在手机端占据上半部分 - 限制最大高度 */
  .communication-section {
    flex: 0 0 50vh;
    max-height: 50vh;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: $background-light;
    border-bottom: 2px solid $border-light;
  }

  .inquiry-items-section {
    flex: 1;
    padding: $spacing-md;
    background: $white;
    overflow-y: auto;
    max-height: 50vh;
  }

  .section-header {
    background: $white;
    padding-bottom: $spacing-sm;
    margin-bottom: $spacing-md;
    border-bottom: $border-width-md solid $primary-color;
  }

  .inquiry-items {
    overflow: visible;
    max-height: none;
    height: auto;
  }
}

/* 响应式设计 */
@media (max-width: $breakpoint-mobile) {
  .inquiry-detail-content {
    padding: $spacing-md;
  }

  .item-row-2 {
    flex-direction: column;
    gap: $spacing-sm;
    align-items: stretch;
  }

  .item-controls {
    justify-content: space-between;
  }

  .control-input {
    width: 100px;
  }

  /* 产品搜索手机端适配 */
  .search-results {
    max-height: 250px;
  }

  .search-result-item {
    padding: $spacing-sm;
    gap: $spacing-sm;
  }

  .result-image {
    width: 40px;
    height: 40px;
  }

  .result-details h5 {
    font-size: $font-size-sm;
  }

  .result-code {
    font-size: $font-size-xs;
  }

  .result-price {
    font-size: $font-size-sm;
  }

  .product-search-input {
    padding: $spacing-sm;
    font-size: $font-size-sm;
  }

  .cancel-search-btn {
    min-width: 36px;
    min-height: 36px;
    padding: $spacing-xs;
  }

  .add-product-btn {
    padding: $spacing-sm;
    font-size: $font-size-sm;
    min-height: 40px;
  }

  .product-search-section {
    padding: $spacing-sm;
  }

  .search-input-container {
    margin-bottom: $spacing-sm;
  }
}
</style>