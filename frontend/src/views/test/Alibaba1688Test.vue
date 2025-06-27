<template>
  <div class="alibaba-test">
    <div class="test-header">
      <h2>1688选品功能测试</h2>
      <p>此页面用于测试1688选品功能的各个组件</p>
    </div>

    <div class="test-section">
      <h3>1. 选品对话框测试</h3>
      <el-button type="primary" @click="showSelector">
        打开1688选品对话框
      </el-button>
    </div>

    <div class="test-section">
      <h3>2. API状态测试</h3>
      <el-button type="info" @click="checkApiStatus" :loading="checkingApi">
        检查1688 API状态
      </el-button>
      <div v-if="apiStatus" class="api-status">
        <el-tag :type="apiStatus.configured ? 'success' : 'warning'">
          {{ apiStatus.configured ? 'API已配置' : 'API未配置' }}
        </el-tag>
        <p>{{ apiStatus.message }}</p>
      </div>
    </div>

    <div class="test-section">
      <h3>3. 模拟搜索测试</h3>
      <el-input 
        v-model="searchKeyword" 
        placeholder="输入搜索关键词" 
        style="width: 300px; margin-right: 10px;"
      />
      <el-button type="success" @click="testSearch" :loading="searching">
        测试搜索
      </el-button>
      
      <div v-if="searchResults.length > 0" class="search-results">
        <h4>搜索结果 ({{ searchResults.length }} 个)</h4>
        <div class="results-grid">
          <div 
            v-for="product in searchResults" 
            :key="product.id"
            class="result-card"
          >
            <img :src="product.image" :alt="product.title" class="product-img" />
            <h5>{{ product.title }}</h5>
            <p class="price">{{ product.price }}</p>
            <p class="supplier">{{ product.supplierName }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>4. 选中产品信息</h3>
      <div v-if="selectedProduct" class="selected-product">
        <h4>已选择产品:</h4>
        <pre>{{ JSON.stringify(selectedProduct, null, 2) }}</pre>
      </div>
      <div v-else class="no-selection">
        <p>暂未选择产品</p>
      </div>
    </div>

    <!-- 1688选品对话框 -->
    <Alibaba1688ProductSelector
      v-model="selectorVisible"
      @product-selected="handleProductSelected"
    />
  </div>
</template>

<script>
import Alibaba1688ProductSelector from '@/components/Alibaba1688ProductSelector.vue'

export default {
  name: 'Alibaba1688Test',
  components: {
    Alibaba1688ProductSelector
  },
  data() {
    return {
      selectorVisible: false,
      checkingApi: false,
      searching: false,
      apiStatus: null,
      searchKeyword: '汽车配件',
      searchResults: [],
      selectedProduct: null
    }
  },
  methods: {
    showSelector() {
      this.selectorVisible = true
    },

    async checkApiStatus() {
      this.checkingApi = true
      try {
        const response = await this.$api.get('/alibaba1688/status')
        this.apiStatus = response.data
        this.$message.success('API状态检查完成')
      } catch (error) {
        console.error('检查API状态失败:', error)
        this.$message.error('检查API状态失败')
        this.apiStatus = {
          configured: false,
          message: '检查失败，可能是网络问题或服务器未启动'
        }
      } finally {
        this.checkingApi = false
      }
    },

    async testSearch() {
      if (!this.searchKeyword.trim()) {
        this.$message.warning('请输入搜索关键词')
        return
      }

      this.searching = true
      try {
        // 使用模拟接口进行测试
        const response = await this.$api.get('/alibaba1688/mock/search', {
          params: {
            keyword: this.searchKeyword,
            page: 1,
            pageSize: 10
          }
        })
        
        if (response.success) {
          this.searchResults = response.data.products || []
          this.$message.success(`搜索完成，找到 ${this.searchResults.length} 个产品`)
        } else {
          this.$message.error(response.message || '搜索失败')
        }
      } catch (error) {
        console.error('搜索失败:', error)
        this.$message.error('搜索失败，请检查网络连接')
      } finally {
        this.searching = false
      }
    },

    handleProductSelected(productData) {
      this.selectedProduct = productData
      this.$message.success('产品选择成功！')
      console.log('选中的产品数据:', productData)
    }
  },

  mounted() {
    // 页面加载时自动检查API状态
    this.checkApiStatus()
  }
}
</script>

<style scoped>
.alibaba-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.test-header h2 {
  color: #333;
  margin: 0 0 10px 0;
}

.test-header p {
  color: #666;
  margin: 0;
}

.test-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: white;
}

.test-section h3 {
  margin: 0 0 20px 0;
  color: #333;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

.api-status {
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.api-status p {
  margin: 10px 0 0 0;
  color: #666;
}

.search-results {
  margin-top: 20px;
}

.search-results h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.result-card {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 15px;
  text-align: center;
  background: white;
  transition: box-shadow 0.3s;
}

.result-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.product-img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 10px;
}

.result-card h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
  height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.price {
  font-weight: bold;
  color: #e6a23c;
  margin: 0 0 5px 0;
}

.supplier {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.selected-product {
  background: #f0f9ff;
  border: 1px solid #409eff;
  border-radius: 6px;
  padding: 15px;
}

.selected-product h4 {
  margin: 0 0 10px 0;
  color: #409eff;
}

.selected-product pre {
  background: white;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  margin: 0;
}

.no-selection {
  text-align: center;
  padding: 40px;
  color: #999;
  background: #f8f9fa;
  border-radius: 6px;
}

.no-selection p {
  margin: 0;
}
</style>