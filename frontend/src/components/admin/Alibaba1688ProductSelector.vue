<template>
  <el-dialog
    title="1688选品"
    v-model="visible"
    width="90%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="alibaba-selector">
      <!-- 搜索区域 -->
      <div class="search-section">
        <el-tabs v-model="searchType" @tab-change="handleTabChange">
          <el-tab-pane label="关键词搜索" name="keyword">
            <div class="keyword-search">
              <el-input
                v-model="searchKeyword"
                placeholder="请输入产品关键词"
                style="width: 300px; margin-right: 10px;"
                @keyup.enter="handleSearch"
              />
              <el-button type="primary" @click="handleSearch" :loading="searching">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </div>
          </el-tab-pane>
          <el-tab-pane label="图片搜索" name="image">
            <div class="image-search">
              <el-upload
                class="image-uploader"
                action="#"
                :show-file-list="false"
                :before-upload="handleImageUpload"
                accept="image/*"
              >
                <img v-if="searchImageUrl" :src="searchImageUrl" class="search-image" />
                <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
              </el-upload>
              <div class="image-search-tips">
                <p>支持 JPG、PNG、GIF、WEBP 格式，文件大小不超过 5MB</p>
                <el-button 
                  type="primary" 
                  @click="handleImageSearch" 
                  :loading="searching"
                  :disabled="!searchImageFile"
                >
                  <el-icon><Search /></el-icon>
                  图片搜索
                </el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- API状态提示 -->
      <div v-if="!apiConfigured" class="api-warning">
        <el-alert
          title="1688 API未配置"
          type="warning"
          description="请联系管理员配置1688 API密钥，或使用模拟数据进行测试"
          show-icon
          :closable="false"
        />
        <el-button type="warning" @click="useMockData = !useMockData" style="margin-top: 10px;">
          {{ useMockData ? '使用真实API' : '使用模拟数据' }}
        </el-button>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0" class="search-results">
        <div class="results-header">
          <h3>搜索结果 (共 {{ totalResults }} 个)</h3>
          <el-pagination
            v-if="totalResults > pageSize"
            background
            layout="prev, pager, next"
            :current-page="currentPage"
            :page-size="pageSize"
            :total="totalResults"
            @current-change="handlePageChange"
          />
        </div>
        
        <div class="products-grid">
          <div 
            v-for="product in searchResults" 
            :key="product.id"
            class="product-card"
            @click="selectProduct(product)"
          >
            <div class="product-image">
              <el-image 
                :src="product.image" 
                fit="cover"
                :preview-src-list="[product.image]"
                @error="handleImageError"
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><PictureIcon /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
            <div class="product-info">
              <h4 class="product-title" :title="product.title">{{ product.title }}</h4>
              <p class="product-price">{{ product.price }}</p>
              <p class="product-supplier">{{ product.supplierName }}</p>
              <p class="product-location">{{ product.supplierLocation }}</p>
              <p class="product-moq">起订量: {{ product.minOrderQuantity }} {{ product.unit }}</p>
            </div>
            <div class="product-actions">
              <el-button type="primary" size="small">选择此产品</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="hasSearched && !searching" class="empty-state">
        <el-empty description="暂无搜索结果" />
      </div>

      <!-- 加载状态 -->
      <div v-if="searching" class="loading-state">
        <el-loading-directive v-loading="true" text="搜索中..." />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 产品详情对话框 -->
  <ProductDetailDialog
    v-model="detailDialogVisible"
    :product-id="selectedProductId"
    :use-mock="useMockData"
    @confirm="handleProductConfirm"
  />
</template>

<script>
import { Search, Plus, Picture as PictureIcon } from '@element-plus/icons-vue'
import ProductDetailDialog from './ProductDetailDialog.vue'

export default {
  name: 'Alibaba1688ProductSelector',
  components: {
    Search,
    Plus,
    PictureIcon,
    ProductDetailDialog
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'product-selected'],
  data() {
    return {
      searchType: 'keyword',
      searchKeyword: '',
      searchImageFile: null,
      searchImageUrl: '',
      searching: false,
      hasSearched: false,
      searchResults: [],
      totalResults: 0,
      currentPage: 1,
      pageSize: 20,
      apiConfigured: true,
      useMockData: false,
      detailDialogVisible: false,
      selectedProductId: null
    }
  },
  computed: {
    visible: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    }
  },
  mounted() {
    this.checkApiStatus()
  },
  methods: {
    async checkApiStatus() {
      try {
        const response = await this.$api.get('/alibaba1688/status')
        this.apiConfigured = response.data.configured
        if (!this.apiConfigured) {
          this.useMockData = true
        }
      } catch (error) {
        console.error('检查API状态失败:', error)
        this.apiConfigured = false
        this.useMockData = true
      }
    },

    handleTabChange(tabName) {
      this.searchType = tabName
      this.resetSearch()
    },

    async handleSearch() {
      if (!this.searchKeyword.trim()) {
        this.$message.warning('请输入搜索关键词')
        return
      }

      this.searching = true
      this.hasSearched = true
      
      try {
        const endpoint = this.useMockData ? '/alibaba1688/mock/search' : '/alibaba1688/search'
        const response = await this.$api.get(endpoint, {
          params: {
            keyword: this.searchKeyword,
            page: this.currentPage,
            pageSize: this.pageSize
          }
        })
        
        if (response.success) {
          this.searchResults = response.data.products
          this.totalResults = response.data.total
          this.$message.success('搜索完成')
        } else {
          this.$message.error(response.message || '搜索失败')
        }
      } catch (error) {
        console.error('搜索失败:', error)
        this.$message.error('搜索失败，请稍后重试')
      } finally {
        this.searching = false
      }
    },

    handleImageUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt5M = file.size / 1024 / 1024 < 5

      if (!isImage) {
        this.$message.error('只能上传图片文件!')
        return false
      }
      if (!isLt5M) {
        this.$message.error('图片大小不能超过 5MB!')
        return false
      }

      this.searchImageFile = file
      
      // 预览图片
      const reader = new FileReader()
      reader.onload = (e) => {
        this.searchImageUrl = e.target.result
      }
      reader.readAsDataURL(file)
      
      return false // 阻止自动上传
    },

    async handleImageSearch() {
      if (!this.searchImageFile) {
        this.$message.warning('请先上传图片')
        return
      }

      this.searching = true
      this.hasSearched = true
      
      try {
        const formData = new FormData()
        formData.append('image', this.searchImageFile)
        
        const response = await this.$api.post('/alibaba1688/search/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        if (response.success) {
          this.searchResults = response.data.products
          this.totalResults = response.data.total
          this.$message.success('图片搜索完成')
        } else {
          this.$message.error(response.message || '图片搜索失败')
        }
      } catch (error) {
        console.error('图片搜索失败:', error)
        this.$message.error('图片搜索失败，请稍后重试')
      } finally {
        this.searching = false
      }
    },

    handlePageChange(page) {
      this.currentPage = page
      if (this.searchType === 'keyword') {
        this.handleSearch()
      }
    },

    selectProduct(product) {
      this.selectedProductId = product.id
      this.detailDialogVisible = true
    },

    handleProductConfirm(productData) {
      this.$emit('product-selected', productData)
      this.handleClose()
    },

    resetSearch() {
      this.searchResults = []
      this.totalResults = 0
      this.currentPage = 1
      this.hasSearched = false
      this.searchKeyword = ''
      this.searchImageFile = null
      this.searchImageUrl = ''
    },

    handleClose() {
      this.visible = false
      this.resetSearch()
    },

    handleImageError() {
      // 图片加载失败的处理
    }
  }
}
</script>

<style lang="scss" scoped>
.alibaba-selector {
  min-height: 400px;
}

.search-section {
  margin-bottom: 20px;
}

.keyword-search {
  padding: 20px 0;
}

.image-search {
  padding: 20px 0;
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.image-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.image-uploader:hover {
  border-color: #409eff;
}

.image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
  display: block;
}

.search-image {
  width: 120px;
  height: 120px;
  display: block;
  object-fit: cover;
}

.image-search-tips {
  flex: 1;
}

.image-search-tips p {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.api-warning {
  margin-bottom: 20px;
}

.search-results {
  margin-top: 20px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-header h3 {
  margin: 0;
  color: #333;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.product-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.product-image {
  height: 200px;
  overflow: hidden;
}

.product-image .el-image {
  width: 100%;
  height: 100%;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 30px;
}

.product-info {
  padding: 15px;
}

.product-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-price {
  font-size: 16px;
  font-weight: bold;
  color: #e6a23c;
  margin: 0 0 5px 0;
}

.product-supplier,
.product-location,
.product-moq {
  font-size: 12px;
  color: #666;
  margin: 0 0 3px 0;
}

.product-actions {
  padding: 0 15px 15px 15px;
}

.product-actions .el-button {
  width: 100%;
}

.empty-state,
.loading-state {
  text-align: center;
  padding: 60px 0;
}

.dialog-footer {
  text-align: right;
}
</style>