<template>
  <div class="cart-page">
    <div class="page-banner">
      <div class="banner-content">
        <h1>购物车</h1>
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>购物车</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="cart-content" v-loading="loading">
        <div v-if="cartItems.length > 0" class="cart-items">
          <el-table :data="cartItems" style="width: 100%">
            <el-table-column label="商品" width="400">
              <template #default="{row}">
                <div class="product-info">
                  <div class="product-image">
                    <img :src="row.image_url || require('@/assets/images/default-image.svg')" :alt="row.name"
                      @error="handleImageError">
                  </div>
                  <div class="product-details">
                    <router-link :to="`/product/${row.product_id}`" class="product-name">{{ row.name
                      }}</router-link>
                    <div class="product-code">产品编号: {{ row.product_code }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="单价" width="120">
              <template #default="{row}">¥{{ formatPrice(row.price) }}</template>
            </el-table-column>
            <el-table-column label="数量" width="150">
              <template #default="{row}">
                <el-input-number v-model="row.quantity" :min="1" :max="row.stock" size="small"
                  @change="(value) => updateQuantity(row.id, value)"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column label="小计" width="120">
              <template #default="{row}">¥{{ formatPrice(row.price * row.quantity) }}</template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="{row}">
                <el-button type="danger" size="small" @click="removeItem(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="cart-summary">
            <div class="cart-total">
              <span>总计:</span>
              <span class="total-price">¥{{ formatPrice(totalPrice) }}</span>
            </div>
            <div class="cart-actions">
              <el-button @click="$router.push('/products')">继续购物</el-button>
              <el-button type="danger" @click="clearCart">清空购物车</el-button>
              <el-button type="primary" @click="checkout">结算</el-button>
            </div>
          </div>
        </div>

        <div v-else class="empty-cart">
          <el-empty description="您的购物车是空的">
            <el-button type="primary" @click="$router.push('/products')">去购物</el-button>
          </el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { handleImageError } from '../utils/imageUtils';
import { formatPrice } from '../utils/format';

export default {
  name: 'CartPage',
  data() {
    return {
      cartItems: [],
      loading: false,
      totalPrice: 0
    };
  },
  created() {
    this.fetchCart();
  },
  methods: {
    handleImageError,
    // 移除本地 formatPrice 方法，import utils/format.js 的 formatPrice，并统一调用。
    formatPrice,
    async fetchCart() {
      if (!localStorage.getItem('user_token')) {
        this.$router.push('/login?redirect=/cart');
        return;
      }

      this.loading = true;
      try {
        const response = await this.$api.get('/cart');
        if (response.success) {
          this.cartItems = response.data.items;
          this.totalPrice = response.data.totalPrice;
        }
      } catch (error) {
        console.error('获取购物车失败:', error);
        this.$message.error(error.response?.data?.message || '获取购物车失败');
      } finally {
        this.loading = false;
      }
    },
    async updateQuantity(cartItemId, quantity) {
      try {
        const response = await this.$api.put(`/cart/item/${cartItemId}`, { quantity });
        if (response.success) {
          this.$message.success('数量已更新');
          // 更新总价
          this.calculateTotal();
        }
      } catch (error) {
        console.error('更新数量失败:', error);
        this.$message.error(error.response?.data?.message || '更新数量失败');
        // 刷新购物车
        this.fetchCart();
      }
    },
    async removeItem(cartItemId) {
      try {
        const response = await this.$api.delete(`/cart/item/${cartItemId}`);
        if (response.success) {
          this.$message.success('商品已从购物车中移除');
          // 从列表中移除
          this.cartItems = this.cartItems.filter(item => item.id !== cartItemId);
          // 更新总价
          this.calculateTotal();
        }
      } catch (error) {
        console.error('移除商品失败:', error);
        this.$message.error(error.response?.data?.message || '移除商品失败');
      }
    },
    async clearCart() {
      this.$confirm('确定要清空购物车吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await this.$api.delete('/cart/clear');
          if (response.success) {
            this.$message.success('购物车已清空');
            this.cartItems = [];
            this.totalPrice = 0;
          }
        } catch (error) {
          console.error('清空购物车失败:', error);
          this.$message.error(error.response?.data?.message || '清空购物车失败');
        }
      }).catch(() => {});
    },
    calculateTotal() {
      this.totalPrice = this.cartItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    },
    checkout() {
      // 跳转到结算页面
      this.$router.push('/checkout');
    }
  }
};
</script>

<style scoped>
.cart-page {
  min-height: 70vh;
}

.page-banner {
  background-color: #f5f5f5;
  padding: 30px 0;
  margin-bottom: 30px;
}

.banner-content {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.banner-content h1 {
  margin: 0 0 10px;
  font-size: 28px;
  color: #333;
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 0;
}

.cart-content {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.product-info {
  display: flex;
  align-items: center;
}

.product-image {
  width: 80px;
  height: 80px;
  margin-right: 15px;
  border: 1px solid #eee;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
}

.product-name {
  display: block;
  font-size: 16px;
  color: #333;
  margin-bottom: 5px;
  text-decoration: none;
}

.product-name:hover {
  color: #e60012;
}

.product-code {
  font-size: 12px;
  color: #999;
}

.price,
.subtotal {
  font-weight: bold;
  color: #e60012;
}

.cart-summary {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.cart-total {
  margin-right: 20px;
  font-size: 16px;
}

.total-price {
  font-weight: bold;
  color: #e60012;
  font-size: 20px;
  margin-left: 10px;
}

.cart-actions .el-button {
  margin-left: 10px;
}

.empty-cart {
  padding: 50px 0;
  text-align: center;
}

@media (max-width: 768px) {
  .cart-summary {
    flex-direction: column;
    align-items: flex-end;
  }

  .cart-total {
    margin-right: 0;
    margin-bottom: 15px;
  }

  .cart-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .cart-actions .el-button {
    margin: 5px;
  }
}
</style>