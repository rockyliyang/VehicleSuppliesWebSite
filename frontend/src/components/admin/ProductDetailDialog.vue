<template>
  <el-dialog
    title="产品详情"
    v-model="visible"
    width="80%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="loading" class="loading-container">
      <el-loading-directive v-loading="true" text="加载产品详情中..." />
    </div>

    <div v-else-if="productDetail" class="product-detail">
      <!-- 产品基本信息 -->
      <div class="product-header">
        <div class="product-images">
          <!-- 主图 -->
          <div class="main-image">
            <el-image 
              :src="currentImage" 
              fit="contain"
              :preview-src-list="allImages"
              style="width: 100%; height: 400px;"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><PictureIcon /></el-icon>
                </div>
              </template>
            </el-image>
          </div>
          
          <!-- 轮播图缩略图 -->
          <div v-if="productDetail.carouselImages && productDetail.carouselImages.length > 0" class="thumbnail-list">
            <div 
              v-for="(image, index) in productDetail.carouselImages" 
              :key="index"
              class="thumbnail-item"
              :class="{ active: currentImage === image }"
              @click="currentImage = image"
            >
              <el-image :src="image" fit="cover">
                <template #error>
                  <div class="image-slot-small">
                  <el-icon><PictureIcon /></el-icon>
                </div>
                </template>
              </el-image>
            </div>
          </div>
        </div>

        <div class="product-info">
          <h2 class="product-title">{{ productDetail.title }}</h2>
          <div class="product-price">
            <span class="price-label">价格：</span>
            <span class="price-value">{{ productDetail.price }}</span>
          </div>
          <div class="product-meta">
            <p><strong>供应商：</strong>{{ productDetail.supplierName }}</p>
            <p><strong>所在地：</strong>{{ productDetail.supplierLocation }}</p>
            <p><strong>起订量：</strong>{{ productDetail.minOrderQuantity }} {{ productDetail.unit }}</p>
            <p v-if="productDetail.brand"><strong>品牌：</strong>{{ productDetail.brand }}</p>
            <p v-if="productDetail.model"><strong>型号：</strong>{{ productDetail.model }}</p>
          </div>
          
          <!-- 产品属性 -->
          <div v-if="productDetail.attributes && productDetail.attributes.length > 0" class="product-attributes">
            <h4>产品属性</h4>
            <el-table :data="productDetail.attributes" size="small" border>
              <el-table-column prop="name" label="属性名" width="120" />
              <el-table-column prop="value" label="属性值" />
            </el-table>
          </div>
        </div>
      </div>

      <!-- 产品详情描述 -->
      <div class="product-description">
        <h3>产品详情</h3>
        <div class="description-content" v-html="productDetail.description"></div>
      </div>

      <!-- 编辑产品信息表单 -->
      <div class="product-form">
        <h3>确认产品信息</h3>
        <el-form :model="productForm" :rules="rules" ref="productFormRef" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="产品名称" prop="name">
                <el-input v-model="productForm.name" placeholder="请输入产品名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="产品编号" prop="productNumber">
                <el-input v-model="productForm.productNumber" placeholder="自动生成" readonly>
                  <template #append>
                    <el-button @click="generateProductNumber">重新生成</el-button>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="产品分类" prop="categoryId">
                <el-select v-model="productForm.categoryId" placeholder="请选择分类" style="width: 100%">
                  <el-option
                    v-for="category in categories"
                    :key="category.id"
                    :label="category.name"
                    :value="category.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="产品类型" prop="type">
                <el-select v-model="productForm.type" placeholder="请选择类型" style="width: 100%">
                  <el-option label="实物产品" value="physical" />
                  <el-option label="数字产品" value="digital" />
                  <el-option label="服务产品" value="service" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="销售价格" prop="price">
                <el-input-number 
                  v-model="productForm.price" 
                  :min="0" 
                  :precision="2" 
                  style="width: 100%"
                  placeholder="请输入价格"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="库存数量" prop="stock">
                <el-input-number 
                  v-model="productForm.stock" 
                  :min="0" 
                  style="width: 100%"
                  placeholder="请输入库存"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="产品状态" prop="status">
                <el-select v-model="productForm.status" style="width: 100%">
                  <el-option label="上架" value="active" />
                  <el-option label="下架" value="inactive" />
                  <el-option label="草稿" value="draft" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="产品简介" prop="description">
            <el-input 
              v-model="productForm.description" 
              type="textarea" 
              :rows="3"
              placeholder="请输入产品简介"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div v-else class="error-state">
      <el-result icon="error" title="加载失败" sub-title="无法获取产品详情，请稍后重试">
        <template #extra>
          <el-button type="primary" @click="fetchProductDetail">重新加载</el-button>
        </template>
      </el-result>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleConfirm" 
          :loading="saving"
          :disabled="!productDetail"
        >
          确认选择
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { Picture as PictureIcon } from '@element-plus/icons-vue'

export default {
  name: 'ProductDetailDialog',
  components: {
    PictureIcon
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    productId: {
      type: [String, Number],
      required: true
    },
    useMock: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'confirm'],
  data() {
    return {
      loading: false,
      saving: false,
      productDetail: null,
      currentImage: '',
      categories: [],
      productForm: {
        name: '',
        productNumber: '',
        categoryId: '',
        type: 'physical',
        price: 0,
        stock: 0,
        status: 'draft',
        description: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入产品名称', trigger: 'blur' }
        ],
        categoryId: [
          { required: true, message: '请选择产品分类', trigger: 'change' }
        ],
        type: [
          { required: true, message: '请选择产品类型', trigger: 'change' }
        ],
        price: [
          { required: true, message: '请输入销售价格', trigger: 'blur' },
          { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
        ],
        stock: [
          { required: true, message: '请输入库存数量', trigger: 'blur' },
          { type: 'number', min: 0, message: '库存不能小于0', trigger: 'blur' }
        ]
      }
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
    },
    allImages() {
      if (!this.productDetail) return []
      const images = []
      if (this.productDetail.mainImage) {
        images.push(this.productDetail.mainImage)
      }
      if (this.productDetail.carouselImages) {
        images.push(...this.productDetail.carouselImages)
      }
      return [...new Set(images)] // 去重
    }
  },
  watch: {
    visible(newVal) {
      if (newVal && this.productId) {
        this.fetchProductDetail()
        this.fetchCategories()
      }
    },
    productId(newVal) {
      if (newVal && this.visible) {
        this.fetchProductDetail()
      }
    }
  },
  methods: {
    async fetchProductDetail() {
      if (!this.productId) return
      
      this.loading = true
      try {
        const endpoint = this.useMock 
          ? `/alibaba1688/mock/product/${this.productId}`
          : `/alibaba1688/product/${this.productId}`
          
        const response = await this.$api.get(endpoint)
        
        if (response.success) {
          this.productDetail = response.data
          this.currentImage = this.productDetail.mainImage || 
                             (this.productDetail.carouselImages && this.productDetail.carouselImages[0]) || ''
          
          // 填充表单
          this.fillProductForm()
          
          // 生成产品编号
          await this.generateProductNumber()
        } else {
          this.$message.error(response.message || '获取产品详情失败')
        }
      } catch (error) {
        console.error('获取产品详情失败:', error)
        this.$message.error('获取产品详情失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    async fetchCategories() {
      try {
        const response = await this.$api.get('/categories')
        if (response.success) {
          this.categories = response.data
        }
      } catch (error) {
        console.error('获取分类失败:', error)
      }
    },

    fillProductForm() {
      if (!this.productDetail) return
      
      this.productForm.name = this.productDetail.title || ''
      this.productForm.description = this.productDetail.shortDescription || ''
      
      // 尝试从1688价格中提取数字作为参考价格
      if (this.productDetail.price) {
        const priceMatch = this.productDetail.price.match(/([\d.]+)/)
        if (priceMatch) {
          this.productForm.price = parseFloat(priceMatch[1])
        }
      }
    },

    async generateProductNumber() {
      try {
        const response = await this.$api.get('/products/generate-number')
        if (response.success) {
          this.productForm.productNumber = response.data.productNumber
        }
      } catch (error) {
        console.error('生成产品编号失败:', error)
        this.$message.error('生成产品编号失败')
      }
    },

    async handleConfirm() {
      if (!this.$refs.productFormRef) return
      
      try {
        await this.$refs.productFormRef.validate()
        
        this.saving = true
        
        // 构建完整的产品数据
        const productData = {
          ...this.productForm,
          // 1688产品信息
          alibaba1688: {
            productId: this.productId,
            originalTitle: this.productDetail.title,
            originalPrice: this.productDetail.price,
            supplierName: this.productDetail.supplierName,
            supplierLocation: this.productDetail.supplierLocation,
            minOrderQuantity: this.productDetail.minOrderQuantity,
            unit: this.productDetail.unit
          },
          // 图片信息
          mainImage: this.productDetail.mainImage,
          carouselImages: this.productDetail.carouselImages || [],
          // 详情信息
          detailContent: this.productDetail.description,
          // 产品属性
          attributes: this.productDetail.attributes || []
        }
        
        this.$emit('confirm', productData)
        
      } catch (error) {
        console.error('表单验证失败:', error)
      } finally {
        this.saving = false
      }
    },

    handleClose() {
      this.visible = false
      this.resetForm()
    },

    resetForm() {
      this.productDetail = null
      this.currentImage = ''
      this.productForm = {
        name: '',
        productNumber: '',
        categoryId: '',
        type: 'physical',
        price: 0,
        stock: 0,
        status: 'draft',
        description: ''
      }
      if (this.$refs.productFormRef) {
        this.$refs.productFormRef.resetFields()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.loading-container {
  height: 400px;
  position: relative;
}

.product-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.product-header {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
}

.product-images {
  flex: 1;
  max-width: 500px;
}

.main-image {
  margin-bottom: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.thumbnail-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.thumbnail-item {
  width: 80px;
  height: 80px;
  border: 2px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.3s;
}

.thumbnail-item:hover,
.thumbnail-item.active {
  border-color: #409eff;
}

.thumbnail-item .el-image {
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
  font-size: 50px;
}

.image-slot-small {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 20px;
}

.product-info {
  flex: 1;
}

.product-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.product-price {
  margin-bottom: 20px;
}

.price-label {
  font-size: 16px;
  color: #666;
}

.price-value {
  font-size: 24px;
  font-weight: bold;
  color: #e6a23c;
  margin-left: 10px;
}

.product-meta {
  margin-bottom: 20px;
}

.product-meta p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.product-attributes {
  margin-top: 20px;
}

.product-attributes h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.product-description {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.product-description h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.description-content {
  line-height: 1.6;
  color: #666;
}

.description-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 10px 0;
}

.product-form {
  padding: 20px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.product-form h3 {
  margin: 0 0 20px 0;
  color: #333;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.error-state {
  text-align: center;
  padding: 60px 0;
}

.dialog-footer {
  text-align: right;
}
</style>