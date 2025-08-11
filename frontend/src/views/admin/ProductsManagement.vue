<template>
  <div class="admin-products">
    <div class="page-header">
      <h2>产品管理</h2>
      <el-button type="primary" @click="handleAdd">添加产品</el-button>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item :label="$t('admin.products.filter.keyword') || '关键词'">
          <el-input v-model="filters.keyword"
            :placeholder="$t('admin.products.filter.keyword_placeholder') || '产品名称/编号'" style="width: 200px;"
            @keyup.enter="handleFilter" />
        </el-form-item>
        <el-form-item :label="$t('admin.products.filter.category') || '产品分类'">
          <el-select v-model="filters.category"
            :placeholder="$t('admin.products.filter.category_placeholder') || '选择产品分类'" clearable style="width: 200px">
            <el-option v-for="item in categoryOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.products.filter.status') || '状态'">
          <el-select v-model="filters.status" :placeholder="$t('admin.products.filter.status_placeholder') || '选择状态'"
            clearable style="width: 120px">
            <el-option :label="$t('admin.products.status.on_shelf') || '上架'" value="1" />
            <el-option :label="$t('admin.products.status.off_shelf') || '下架'" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.products.filter.type') || '产品类型'">
          <el-select v-model="filters.product_type"
            :placeholder="$t('admin.products.filter.type_placeholder') || '选择产品类型'" clearable style="width: 120px">
            <el-option :label="$t('admin.products.type.consignment') || '代销'" value="consignment" />
            <el-option :label="$t('admin.products.type.self_operated') || '自营'" value="self_operated" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">
            <el-icon>
              <Search />
            </el-icon>
            {{ $t('common.search') || '搜索' }}
          </el-button>
          <el-button @click="resetFilter">
            <el-icon>
              <Refresh />
            </el-icon>
            {{ $t('common.reset') || '重置' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 产品表格 -->
    <el-table v-loading="loading" :data="productList" border style="width: 100%" @sort-change="handleSortChange">
      <el-table-column prop="id" label="ID" width="80" sortable="custom" />
      <el-table-column label="产品图片" width="120">
        <template #default="{row}">
          <el-image :src="row.thumbnail_url" fit="cover" class="product-image" v-if="row.thumbnail_url"
            @error="handleImageError">
          </el-image>
          <span v-else>无图片</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="产品名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="product_code" label="产品编号" width="120" />
      <el-table-column prop="category_name" label="分类" width="120" />
      <el-table-column prop="product_type" label="产品类型" width="100">
        <template #default="{row}">
          <el-tag :type="row.product_type === 'self_operated' ? 'success' : 'warning'">
            {{ row.product_type === 'self_operated' ? "自营" : "代销" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="价格" width="120" sortable="custom">
        <template #default="{row}">
          <span>{{ row.price ? "¥" + row.price : "面议" }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="100" sortable="custom" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{row}">
          <el-tag :type="row.status === 'on_shelf' ? 'success' : 'info'">
            {{ row.status === 'on_shelf' ? "上架" : "下架" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160" sortable="custom">
        <template #default="{row}">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{row}">
          <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="success" size="small" @click="handleManageLinks(row)">关联产品</el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination background @size-change="handleSizeChange" @current-change="handleCurrentChange"
        :current-page="pagination.current" :page-sizes="[10, 20, 30, 50]" :page-size="pagination.size"
        layout="total, sizes, prev, pager, next, jumper" :total="pagination.total" />
    </div>

    <!-- 产品表单对话框 -->
    <el-dialog v-model="dialogVisible" fullscreen :close-on-click-modal="false" :show-close="false">
      <template #header>
        <div class="dialog-header">
          <h4>{{ dialogStatus === 'create' ? '添加产品' : '编辑产品' }}</h4>
          <el-button type="primary" @click="dialogVisible = false" class="return-btn-circle" circle>
            <el-icon>
              <ArrowLeft />
            </el-icon>
          </el-button>
        </div>
      </template>
      <el-form :model="productForm" :rules="rules" ref="productFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品名称" prop="name">
              <el-input v-model="productForm.name" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品编号" prop="product_code">
              <el-input v-model="productForm.product_code" placeholder="请输入产品编号" maxlength="64" show-word-limit>
                <template #append>
                  <el-button @click="generateProductCode">生成编号</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品分类" prop="category_id">
              <el-select v-model="productForm.category_id" placeholder="请选择产品分类" style="width: 100%">
                <el-option v-for="item in categoryOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort_order">
              <el-input-number v-model="productForm.sort_order" :min="0" placeholder="请输入排序值（数值越大越排前）"
                style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品类型" prop="product_type">
              <el-radio-group v-model="productForm.product_type">
                <el-radio label="consignment">代销</el-radio>
                <el-radio label="self_operated">自营</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品库存" prop="stock">
              <el-input-number v-model="productForm.stock" :min="0" :max="999999" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="阶梯价格" prop="price_ranges">
          <div class="price-ranges-container">
            <div v-for="(range, index) in productForm.price_ranges" :key="index" class="price-range-item">
              <el-input-number v-model="range.min_quantity" :min="1" placeholder="最小数量" style="width: 120px"
                :disabled="index > 0" />
              <span class="range-separator">-</span>
              <el-input-number v-model="range.max_quantity" :min="range.min_quantity || 1" placeholder="最大数量"
                style="width: 120px" @change="handleMaxQuantityChange(index)" />
              <span class="range-separator">件</span>
              <el-input-number v-model="range.price" :min="0" :precision="2" placeholder="单价" style="width: 120px" />
              <span class="range-separator">元</span>
              <el-button type="danger" size="small" @click="removePriceRange(index)"
                :disabled="productForm.price_ranges.length <= 1">
                删除
              </el-button>
            </div>
            <el-button type="primary" size="small" @click="addPriceRange" style="margin-top: 10px;">
              添加价格区间
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="产品图片" prop="images">
          <el-upload class="product-image-uploader" action="/api/product-images/upload?image_type=0"
            :headers="uploadHeaders" :data="uploadData" :file-list="thumbnailList" list-type="picture-card"
            :on-preview="handleMediaPreview" :on-remove="handleRemove" :on-success="handleUploadSuccess"
            :before-upload="beforeImageUpload" :name="'images'" :limit="10" :multiple="true" :show-file-list="true">
            <template v-if="thumbnailList.length < 10">
              <el-icon>
                <Plus />
              </el-icon>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="轮播媒体" prop="carousel_media">
          <el-upload ref="uploadRef" class="product-media-uploader" action="/api/product-images/upload?image_type=1"
            :headers="uploadHeaders" :data="uploadData" :file-list="carouselList" list-type="picture-card"
            :on-preview="handleMediaPreview" :on-remove="handleRemove" :on-success="handleUploadSuccess"
            :before-upload="beforeMediaUpload" :name="'images'" :limit="10" :multiple="true" :show-file-list="true">
            <el-icon>
              <Plus />
            </el-icon>
            <template #file="{ file }">
              <div class="upload-file-item">
                <img v-if="isImageFile(file.name)" :src="file.url" alt="预览图" class="upload-file-preview" />
                <div v-else-if="isVideoFile(file.name)" class="upload-video-preview">
                  <video :src="file.url" class="upload-file-preview" preload="metadata" muted>
                    您的浏览器不支持视频播放
                  </video>
                  <!-- 视频标识 -->
                  <div class="video-indicator">视频</div>
                  <!-- 视频播放图标 -->
                  <el-icon class="video-play-overlay">
                    <VideoPlay />
                  </el-icon>
                </div>
                <div v-else class="upload-unknown-file">
                  <el-icon>
                    <Document />
                  </el-icon>
                  <span>{{ file.name }}</span>
                </div>
                <div class="upload-file-actions">
                  <el-icon class="preview-icon" @click="handleMediaPreview(file)">
                    <ZoomIn />
                  </el-icon>
                  <el-icon class="delete-icon" @click="handleCustomRemove(file)">
                    <Delete />
                  </el-icon>
                </div>
              </div>
            </template>
            <template #tip>
              <div class="el-upload__tip">支持图片(jpg, jpeg, png, gif)和视频(mp4, webm, ogg)格式，图片不超过5MB，视频不超过50MB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="产品简介" prop="short_description">
          <el-input type="textarea" v-model="productForm.short_description" :rows="4" placeholder="请输入产品简介" />
        </el-form-item>
        <el-form-item label="产品详情" prop="full_description">
          <div class="quill-editor-container">
            <quill-editor ref="quillEditor" v-model="productForm.full_description" :options="quillOptions"
              :key="quillKey" @change="onQuillChange" @ready="onQuillReady" />
          </div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="productForm.status">
            <el-radio :label="'on_shelf'">上架</el-radio>
            <el-radio :label="'off_shelf'">下架</el-radio>
          </el-radio-group>
        </el-form-item>

      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 图片预览 -->
    <el-dialog v-model="previewVisible">
      <img :src="previewUrl" alt="Preview" style="width: 100%">
    </el-dialog>

    <!-- 关联产品管理对话框 -->
    <el-dialog v-model="linkManageVisible" title="关联产品管理" width="1000px" :close-on-click-modal="false">
      <div class="link-manage-dialog">
        <!-- 当前产品信息 -->
        <div class="current-product-info">
          <h4>当前产品: {{ currentManageProduct.name }} ({{ currentManageProduct.product_code }})</h4>
        </div>
        
        <!-- 已关联产品列表 -->
        <div class="linked-products-section">
          <div class="section-header">
            <h5>已关联产品 ({{ linkedProducts.length }})</h5>
          </div>
          <div class="linked-products-list" v-if="linkedProducts.length > 0">
            <div v-for="(product, index) in linkedProducts" :key="product.link_id" class="linked-product-item">
              <el-image 
                :src="product.link_product_thumbnail" 
                fit="cover" 
                class="linked-product-image"
                v-if="product.link_product_thumbnail">
              </el-image>
              <div v-else class="linked-product-no-image">无图片</div>
              <div class="linked-product-info">
                <div class="linked-product-name">{{ product.link_product_name }}</div>
                <div class="linked-product-code">编号: {{ product.link_product_code }}</div>
                <div class="linked-product-price">价格: ¥{{ product.link_product_price }}</div>
              </div>
              <div class="linked-product-actions">
                <el-button type="danger" size="small" @click="removeLinkedProduct(index)">
                  <el-icon><Delete /></el-icon>
                  移除
                </el-button>
              </div>
            </div>
          </div>
          <div v-else class="linked-products-empty">
            暂无关联商品
          </div>
        </div>
        
        <!-- 添加新关联产品 -->
        <div class="add-linked-section">
          <div class="section-header">
            <h5>添加关联产品</h5>
          </div>
          <el-form :model="linkedProductSearch" inline>
            <el-form-item label="搜索商品">
              <el-input 
                v-model="linkedProductSearch.keyword" 
                placeholder="输入商品名称或编号搜索"
                style="width: 300px"
                @keyup.enter="searchLinkedProducts"
                clearable>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="searchLinkedProducts" :loading="searchingProducts">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        
        <div class="search-results" v-if="searchResults.length > 0">
          <div class="search-results-header">
            <span>搜索结果 ({{ searchResults.length }})</span>
          </div>
          <div class="search-results-list">
            <div 
              v-for="product in searchResults" 
              :key="product.id" 
              class="search-result-item"
              :class="{ 'selected': selectedProducts.includes(product.id) }"
              @click="toggleProductSelection(product)">
              <el-checkbox 
                :model-value="selectedProducts.includes(product.id)"
                @change="toggleProductSelection(product)">
              </el-checkbox>
              <el-image 
                :src="product.thumbnail_url" 
                fit="cover" 
                class="search-result-image"
                v-if="product.thumbnail_url">
              </el-image>
              <div v-else class="search-result-no-image">无图片</div>
              <div class="search-result-info">
                <div class="search-result-name">{{ product.name }}</div>
                <div class="search-result-code">编号: {{ product.product_code }}</div>
                <div class="search-result-price">价格: ¥{{ product.price }}</div>
                <div class="search-result-category">分类: {{ product.category_name }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else-if="linkedProductSearch.keyword && !searchingProducts" class="no-search-results">
          未找到相关商品
        </div>
        
        <div v-else-if="!linkedProductSearch.keyword" class="search-placeholder">
          请输入关键词搜索商品
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeLinkManageDialog">关闭</el-button>
          <el-button 
            type="primary" 
            @click="confirmAddLinkedProducts" 
            :disabled="selectedProducts.length === 0"
            v-if="selectedProducts.length > 0">
            添加选中商品 ({{ selectedProducts.length }})
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Plus, Search, Refresh, Document, Delete, ZoomIn, VideoPlay, ArrowLeft } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/format'
import { quillEditor } from 'vue3-quill'
import { getAuthToken } from '@/utils/api'
import { Quill } from 'vue3-quill'
import ImageResize from 'quill-resize-module'

// 注册Quill模块
Quill.register('modules/resize', ImageResize)

export default {
  name: 'AdminProducts',
  components: {
    Plus,
    Search,
    Refresh,
    Document,
    Delete,
    ZoomIn,
    VideoPlay,
    ArrowLeft,
    quillEditor
  },
  data() {
    return {
      loading: false,
      submitLoading: false,
      dialogVisible: false,
      dialogStatus: 'create',
      previewVisible: false,
      previewUrl: '',
      productList: [],
      categoryOptions: [],
      thumbnailList: [],
      carouselList: [],
      filters: {
        keyword: '',
        category: '',
        status: '',
        product_type: ''
      },
      pagination: {
        current: 1,
        size: 10,
        total: 0
      },
      sort: {
        prop: 'id',
        order: 'descending'
      },
      productForm: {
        id: undefined,
        name: '',
        product_code: '',
        category_id: '',
        product_type: 'consignment',
        price: '',
        price_ranges: [
          { min_quantity: 1, max_quantity: null, price: 0 }
        ],
        stock: 0,
        sort_order: 0,
        short_description: '',
        full_description: '',
        status: 'on_shelf'
      },
      rules: {
        name: [{ required: true, message: "请输入产品名称", trigger: "blur" }],
        product_code: [
          { required: true, message: "请输入产品编号", trigger: "blur" },
          { max: 64, message: "产品编号不能超过64个字符", trigger: "blur" }
        ],
        category_id: [{ required: true, message: "请选择产品分类", trigger: "change" }],
        product_type: [{ required: true, message: "请选择产品类型", trigger: "change" }],
        price: [
          { type: "number", min: 0, message: "价格必须大于等于0", trigger: "blur" }
        ],
        price_ranges: [
          { required: true, message: "请设置阶梯价格", trigger: "blur" },
          { validator: this.validatePriceRanges, trigger: "blur" }
        ]
      },
      sessionId: localStorage.getItem("session_id") || (Date.now() + "-" + Math.random().toString(36).substr(2, 9)),
      quillOptions: {
        theme: 'snow',
        modules: {
          toolbar: {
            container: [
              ["bold", "italic", "underline", "strike"],
              ["blockquote", "code-block"],
              [{ "header": 1 }, { "header": 2 }],
              [{ "list": "ordered" }, { "list": "bullet" }],
              [{ "script": "sub" }, { "script": "super" }],
              [{ "indent": "-1" }, { "indent": "+1" }],
              [{ "direction": "rtl" }],
              [{ "size": ["small", false, "large", "huge"] }],
              [{ "header": [1, 2, 3, 4, 5, 6, false] }],
              [{ "color": [] }, { "background": [] }],
              [{ "font": [] }],
              [{ "align": [] }],
              ["link", "image", "video"],
              ["clean"]
            ]
          },
          resize: {
            locale: {
              altTip: '按住Alt键拖拽可等比例缩放',
              floatLeft: '左浮动',
              floatRight: '右浮动',
              center: '居中',
              restore: '恢复默认'
            }
          }
        },
        placeholder: '请输入产品详情...'
      },
      quillKey: 0,
      // 关联商品相关数据
      linkedProducts: [], // 当前产品的关联商品列表
      linkManageVisible: false, // 关联产品管理对话框显示状态
      currentManageProduct: {}, // 当前管理关联产品的产品信息
      linkedProductSearch: {
        keyword: ''
      },
      searchResults: [], // 搜索结果
      selectedProducts: [], // 选中的商品ID列表
      searchingProducts: false // 搜索加载状态
    }
  },
  computed: {
    uploadHeaders() {
      const token = getAuthToken(true); // true 表示这是管理员请求
      return {
        Authorization: token ? `Bearer ${token}` : ''
      }
    },
    uploadData() {
      // 只有在编辑现有产品时才传递product_id，新建产品时只传递session_id
      const data = { session_id: this.sessionId }
      if (this.dialogStatus === 'edit' && this.productForm.id) {
        data.product_id = this.productForm.id
      }
      return data
    }
  },
  created() {
    this.fetchCategories()
    this.fetchProducts()
    if (!localStorage.getItem('session_id')) {
      localStorage.setItem('session_id', this.sessionId)
    }
  },
  mounted() {
    // 检查是否有编辑产品的查询参数
    const editProductId = this.$route.query.edit;
    if (editProductId) {
      // 等待产品列表加载完成后自动打开编辑对话框
      this.$nextTick(() => {
        const product = this.productList.find(p => p.id == editProductId);
        if (product) {
          this.handleEdit(product);
        } else {
          // 如果在当前页面没找到产品，可能需要搜索或加载更多数据
          console.warn('未找到指定的产品ID:', editProductId);
        }
      });
    }
  },
  methods: {
    formatDate,
    
    // 获取产品分类列表
    async fetchCategories() {
      try {
        const response = await this.$api.getWithErrorHandler('categories', {
          fallbackKey: 'admin.products.error.fetchCategoriesFailed'
        })
        this.categoryOptions = response.data || []
      } catch (error) {
        console.error('获取分类失败:', error)
        // 错误已由getWithErrorHandler处理，这里不需要再次显示
      }
    },
    
    // 获取产品列表
    async fetchProducts() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.current,
          limit: this.pagination.size,
          sort_by: this.sort.prop,
          sort_order: this.sort.order === 'ascending' ? 'asc' : 'desc'
        }
        
        // 添加筛选条件
        if (this.filters.keyword) params.keyword = this.filters.keyword
        if (this.filters.category) params.category_id = this.filters.category
        if (this.filters.status !== '') params.status = this.filters.status
        if (this.filters.product_type !== '') params.product_type = this.filters.product_type
        
        const response = await this.$api.getWithErrorHandler('products', { 
          params,
          fallbackKey: 'admin.products.error.fetchProductsFailed'
        })
        this.productList = response.data?.items || []
        this.pagination.total = response.data?.total || 0
      } catch (error) {
        console.error('获取产品列表失败:', error)
        // 错误已由getWithErrorHandler处理，这里不需要再次显示
      } finally {
        this.loading = false
      }
    },
    
    // 生成产品编号
    async generateProductCode() {
      if (!this.productForm.category_id) {
        this.$messageHandler.showWarning('请先选择产品分类', 'admin.products.warning.selectCategoryFirst')
        return
      }
      
      try {
        const response = await this.$api.postWithErrorHandler('products/generate-code', {
          category_id: this.productForm.category_id
        }, {
          fallbackKey: 'admin.products.error.generateCodeFailed'
        })
        this.productForm.product_code = response.data
      } catch (error) {
        console.error('生成产品编号失败:', error)
        // 错误已由postWithErrorHandler处理，这里不需要再次显示
      }
    },
    
    // 处理图片上传前的验证
    beforeImageUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt5M = file.size / 1024 / 1024 < 5

      if (!isImage) {
        this.$messageHandler.showError('只能上传图片文件!', 'admin.products.error.invalidImageFormat')
        return false
      }
      if (!isLt5M) {
        this.$messageHandler.showError('图片大小不能超过 5MB!', 'admin.products.error.imageTooLarge')
        return false
      }
      return true
    },
    
    // 媒体文件上传前的验证
    beforeMediaUpload(file) {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/jpg'
      const isVideo = file.type === 'video/mp4' || file.type === 'video/webm' || file.type === 'video/ogg'
      
      if (isImage) {
        const isLt5M = file.size / 1024 / 1024 < 5
        if (!isLt5M) {
          this.$messageHandler.showError('上传图片大小不能超过 5MB!', 'admin.products.error.imageTooLarge')
          return false
        }
        return true
      } else if (isVideo) {
        const isLt50M = file.size / 1024 / 1024 < 50
        if (!isLt50M) {
          this.$messageHandler.showError('上传视频大小不能超过 50MB!', 'admin.products.error.videoTooLarge')
          return false
        }
        return true
      } else {
        this.$messageHandler.showError('只能上传图片(JPG/PNG/GIF)或视频(MP4/WEBM/OGG)格式的文件!', 'admin.products.error.invalidMediaFormat')
        return false
      }
    },
    
    // 处理媒体文件上传成功
    handleUploadSuccess(response, file) {
      if (response.success) {
        const isVideo = file.raw && file.raw.type && file.raw.type.startsWith('video/')
        const successMessage = isVideo ? '视频上传成功' : '图片上传成功'
        this.$messageHandler.showSuccess(successMessage, 'product.success.mediaUploadSuccess')
        
        // 根据媒体类型更新对应的列表
        if (file && file.status === 'success') {
          if (file.response && file.response.data && file.response.data.images) {
            const media = file.response.data.images[0];

            const image_type = file.response.data.image_type;
            
            // 将ID信息同步到file对象中，以便删除时使用
            file.id = media.id
            file.name = media.filename
            file.url = media.path
            
            // 恢复手动操作thumbnailList和carouselList的逻辑
            // 因为el-upload组件不会自动同步这些数据到我们的列表中
            
            // 根据图片类型添加到对应列表
            if (image_type === 0) {
              // 缩略图：替换现有的缩略图
              this.thumbnailList = [{
                id: media.id,
                name: media.filename,
                url: media.path
              }]
            } else if (image_type === 1) {
              // 轮播图：添加到轮播图列表
              // 先检查是否已存在相同uid的文件，如果存在则更新，否则添加
              const existingIndex = this.carouselList.findIndex(item => item.id === file.id)
              if (existingIndex !== -1) {
                // 更新现有文件
                this.$set(this.carouselList, existingIndex, {
                  id: media.id,
                  name: media.filename,
                  url: media.path
                })
              } else {
                // 添加新文件
                this.carouselList.push({
                  id: media.id,
                  name: media.filename,
                  url: media.path

                })
              }
            }
          }
        }
      } else {
        this.$messageHandler.showError(response.message, 'admin.products.error.mediaUploadFailed')
      }
    },
    
    // 处理图片移除
    async handleRemove(file) {
      try {
        // 检查file.id是否存在
        if (!file.id) {
          console.error('文件ID不存在:', file)
          this.$messageHandler.showError('文件ID不存在，无法删除', 'admin.products.error.fileIdMissing')
          return false // 返回false阻止el-upload组件删除文件
        }
        
        await this.$api.deleteWithErrorHandler(`product-images/${file.id}`, {
          fallbackKey: 'admin.products.error.imageDeleteFailed'
        })
        
        // 恢复手动操作thumbnailList和carouselList的逻辑
        // 从缩略图列表中移除
        this.thumbnailList = this.thumbnailList.filter(item => item.id !== file.id )
        console.debug(`file: ${file}`)
        console.debug('删除前的carouselList:')
        this.carouselList.forEach((item, index) => {
            console.debug(`对象 ${index}:`, item); // 直接打印整个对象
        });
        // 从轮播图列表中移除
        this.carouselList = this.carouselList.filter(item => item.id !== file.id)

        console.debug('删除后的carouselList:')
         this.carouselList.forEach((item, index) => {
            console.debug(`对象 ${index}:`, item); // 直接打印整个对象
        });
        this.$messageHandler.showSuccess('图片删除成功', 'product.success.imageDeleteSuccess')
        return true // 返回true允许el-upload组件删除文件
      } catch (error) {
        console.error('删除图片失败:', error)
        // 错误已由deleteWithErrorHandler处理，这里不需要再次显示
        return false // 返回false阻止el-upload组件删除文件
      }
    },
    
    // 处理自定义删除按钮点击
    async handleCustomRemove(file) {
      this.$refs.uploadRef.handleRemove(file);
    },
    
    // 处理媒体预览
    handleMediaPreview(file) {
      // 判断文件类型
      const isVideo = file.name && (file.name.toLowerCase().endsWith('.mp4') || 
                                   file.name.toLowerCase().endsWith('.webm') || 
                                   file.name.toLowerCase().endsWith('.ogg'))
      
      if (isVideo) {
        // 对于视频文件，在新窗口打开
        window.open(file.url, '_blank')
      } else {
        // 对于图片文件，使用预览弹窗
        this.previewUrl = file.url
        this.previewVisible = true
      }
    },
    
    // 判断是否为图片文件
    isImageFile(filename) {
      if (!filename) return false
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
      return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext))
    },
    
    // 判断是否为视频文件
    isVideoFile(filename) {
      if (!filename) return false
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov']
      return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext))
    },
    
    // 处理筛选
    handleFilter() {
      this.pagination.current = 1
      this.fetchProducts()
    },
    
    // 重置筛选
    resetFilter() {
      this.filters = {
        keyword: '',
        category: '',
        status: '',
        product_type: ''
      }
      this.pagination.current = 1
      this.fetchProducts()
    },
    
    // 处理排序变化
    handleSortChange(val) {
      if (val.prop) {
        this.sort.prop = val.prop
        this.sort.order = val.order
        this.fetchProducts()
      }
    },
    
    // 处理分页大小变化
    handleSizeChange(val) {
      this.pagination.size = val
      this.fetchProducts()
    },
    
    // 处理页码变化
    handleCurrentChange(val) {
      this.pagination.current = val
      this.fetchProducts()
    },
    
    // 添加产品
    handleAdd() {
      this.dialogStatus = 'create'
      this.productForm = {
        id: undefined,
        name: '',
        product_code: '',
        category_id: '',
        product_type: 'consignment',
        price: '',
        price_ranges: [{ min_quantity: 1, max_quantity: null, price: 0 }],
        stock: 0,
        sort_order: 0,
        short_description: '',
        full_description: '',
        status: 'on_shelf'
      }
      this.thumbnailList = []
      this.carouselList = []
      this.linkedProducts = [] // 清空关联商品列表
      this.dialogVisible = true
      this.quillKey++;
      this.$nextTick(() => {
        this.$refs.productFormRef.clearValidate()
      })
    },
    
    // 编辑产品
    async handleEdit(row) {
      this.dialogStatus = 'update'
      this.productForm = Object.assign({}, row, {
        price: Number(row.price),
        status: row.status || 'on_shelf',
        full_description: row.full_description || '',
        price_ranges: row.price_ranges && row.price_ranges.length > 0 
          ? row.price_ranges 
          : [{ min_quantity: 1, max_quantity: null, price: Number(row.price) || 0 }]
      })
      this.quillKey++;
      
      // 获取产品图片、视频和关联商品
      try {
        const [thumbnailResponse, carouselResponse] = await Promise.all([
          this.$api.getWithErrorHandler(`product-images?product_id=${row.id}&image_type=0`, {
            fallbackKey: 'admin.products.error.fetchMediaFailed'
          }),
          this.$api.getWithErrorHandler(`product-images?product_id=${row.id}&image_type=1`, {
            fallbackKey: 'admin.products.error.fetchMediaFailed'
          })
        ])
        
        this.thumbnailList = thumbnailResponse.data.map(img => ({
          id: img.id,
          name: img.image_url.split('/').pop(),
          url: img.image_url
        }))
        
        this.carouselList = carouselResponse.data.map(media => ({
          id: media.id,
          name: media.image_url.split('/').pop(),
          url: media.image_url
        }))
        
        // 获取关联商品
        await this.fetchLinkedProducts()
      } catch (error) {
        console.error('获取产品媒体文件失败:', error)
        // 错误已由getWithErrorHandler处理，这里不需要再次显示
      }
      
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.productFormRef.clearValidate()
      })
    },
    
    // 删除产品
    handleDelete(row) {
      this.$confirm('确认删除该产品吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await this.$api.deleteWithErrorHandler(`products/${row.id}`, {
            fallbackKey: 'admin.products.error.deleteProductFailed'
          })
          this.$messageHandler.showSuccess(response.message || '删除成功', 'product.success.deleteSuccess')
          this.fetchProducts()
        } catch (error) {
          console.error('删除产品失败:', error)
          // 错误已由deleteWithErrorHandler处理，这里不需要再次显示
        }
      }).catch(() => {})
    },
    
    // 管理关联产品
    async handleManageLinks(row) {
      this.currentManageProduct = { ...row }
      this.linkedProducts = []
      this.searchResults = []
      this.selectedProducts = []
      this.linkedProductSearch.keyword = ''
      
      // 获取当前产品的关联产品列表
      try {
        const response = await this.$api.getWithErrorHandler(`products/${row.id}/links`, {
          fallbackKey: 'admin.products.error.fetchLinkedProductsFailed'
        })
        this.linkedProducts = response.data || []
      } catch (error) {
        console.error('获取关联商品失败:', error)
        // 错误已由getWithErrorHandler处理，这里不需要再次显示
      }
      
      this.linkManageVisible = true
    },
    
    // 关闭关联产品管理对话框
    closeLinkManageDialog() {
      this.linkManageVisible = false
      this.currentManageProduct = {}
      this.linkedProducts = []
      this.searchResults = []
      this.selectedProducts = []
      this.linkedProductSearch.keyword = ''
    },
    
    // 阶梯价格验证
    validatePriceRanges(rule, value, callback) {
      if (!value || value.length === 0) {
        callback(new Error('请设置阶梯价格'))
        return
      }
      
      // 检查是否有多个无穷大值（max_quantity为null）
      let infinityCount = 0
      for (let i = 0; i < value.length; i++) {
        const range = value[i]
        if (!range.min_quantity || range.min_quantity < 1) {
          callback(new Error(`第${i + 1}个阶梯的最小数量必须大于0`))
          return
        }
        if (range.max_quantity !== null && range.max_quantity < range.min_quantity) {
          callback(new Error(`第${i + 1}个阶梯的最大数量不能小于最小数量`))
          return
        }
        if (range.max_quantity === null || range.max_quantity === undefined) {
          infinityCount++
        }
      }
      
      // 只能有一个无穷大值，且必须是最后一个
      if (infinityCount > 1) {
        callback(new Error('只能有一个价格阶梯的最大数量为无穷大'))
        return
      }
      
      if (infinityCount === 1) {
        const lastRange = value[value.length - 1]
        if (lastRange.max_quantity !== null && lastRange.max_quantity !== undefined) {
          callback(new Error('无穷大的价格阶梯必须是最后一个'))
          return
        }
      }
      
      callback()
    },
    
    // 验证阶梯价格范围的客户端函数
    validatePriceRangesOld(priceRanges) {
      if (!Array.isArray(priceRanges) || priceRanges.length === 0) {
        return { valid: false, message: '价格范围必须是非空数组' };
      }

      // 按最小数量排序
      const sortedRanges = [...priceRanges].sort((a, b) => a.min_quantity - b.min_quantity);

      // 检查第一个范围是否从1开始
      if (sortedRanges[0].min_quantity !== 1) {
        return { valid: false, message: '第一个价格范围必须从数量1开始' };
      }

      // 检查范围是否连续，没有间隔
      for (let i = 0; i < sortedRanges.length; i++) {
        const current = sortedRanges[i];
        
        // 验证基本字段
        if (!current.min_quantity || current.min_quantity <= 0) {
          return { valid: false, message: `第${i + 1}个范围的最小数量无效` };
        }
        
        if (!current.price || current.price <= 0) {
          return { valid: false, message: `第${i + 1}个范围的价格无效` };
        }

        // 检查与下一个范围的连续性
        if (i < sortedRanges.length - 1) {
          const next = sortedRanges[i + 1];
          
          // 当前范围必须有max_quantity（除了最后一个）
          if (current.max_quantity === null || current.max_quantity === undefined) {
            return { valid: false, message: `第${i + 1}个范围必须有最大数量（除了最后一个范围）` };
          }
          
          // 验证max_quantity（如果存在）
          if (current.max_quantity < current.min_quantity) {
            return { valid: false, message: `第${i + 1}个范围的最大数量必须大于等于最小数量` };
          }
          
          // 下一个范围的min_quantity必须等于当前范围的max_quantity + 1
          if (next.min_quantity !== current.max_quantity + 1) {
            return { valid: false, message: `第${i + 1}个范围和第${i + 2}个范围之间存在间隔。第${i + 2}个范围应该从${current.max_quantity + 1}开始` };
          }
        } else {
          // 最后一个范围的max_quantity可以是null（表示无上限）或者是一个有效数字
          if (current.max_quantity !== null && current.max_quantity !== undefined) {
            if (current.max_quantity < current.min_quantity) {
              return { valid: false, message: `第${i + 1}个范围的最大数量必须大于等于最小数量` };
            }
          }
        }
      }

      return { valid: true, sortedRanges };
    },

    // 提交表单
    async submitForm() {
      this.$refs.productFormRef.validate(async valid => {
        if (valid) {
          // 验证阶梯价格（如果提供）
          if (this.productForm.price_ranges && this.productForm.price_ranges.length > 0) {
            const validation = this.validatePriceRangesOld(this.productForm.price_ranges);
            if (!validation.valid) {
              this.$messageHandler.showError(`价格范围验证失败: ${validation.message}`, 'admin.products.error.priceRangeValidationFailed');
              return;
            }
          }

          console.log('full_description:', this.productForm.full_description);
          this.submitLoading = true
          try {
            let response
            if (this.dialogStatus === 'create') {
              response = await this.$api.postWithErrorHandler('products', this.productForm, {
                fallbackKey: 'admin.products.error.createProductFailed'
              })
              // 新建产品后，关联图片和视频
              const productId = response.data.id
              
              // 关联所有上传的图片和视频到新创建的产品
              if (this.sessionId) {
                await this.$api.postWithErrorHandler('product-images/assign', {
                  product_id: productId,
                  session_id: this.sessionId
                }, {
                  fallbackKey: 'admin.products.error.assignImagesFailed'
                })
              }
              
              // 保存关联商品
              if (this.linkedProducts.length > 0) {
                const linkData = this.linkedProducts.map(product => ({
                  link_product_id: product.link_product_id,
                  link_type: 'buy_together'
                }))
                
                await this.$api.postWithErrorHandler(`products/${productId}/links`, { links: linkData }, {
                  fallbackKey: 'admin.products.error.addLinkedProductsFailed'
                })
              }
            } else {
              response = await this.$api.putWithErrorHandler(`products/${this.productForm.id}`, this.productForm, {
                fallbackKey: 'admin.products.error.updateProductFailed'
              })
            }
            this.$messageHandler.showSuccess(response.message || (this.dialogStatus === 'create' ? '添加成功' : '更新成功'), this.dialogStatus === 'create' ? 'product.success.createSuccess' : 'product.success.updateSuccess')
            this.dialogVisible = false
            this.fetchProducts()
          } catch (error) {
            console.error(this.dialogStatus === 'create' ? '添加产品失败:' : '更新产品失败:', error)
            // 错误已由相应的WithErrorHandler方法处理，这里不需要再次显示
          } finally {
            this.submitLoading = false
          }
        }
      })
    },
    
    // 图片加载错误处理
    handleImageError(e) {
      e.target.src = require('@/assets/images/default-image.svg')
    },
    
    async handleQuillImageUpload(quill) {
      // 创建input选择图片
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        // 构造FormData
        const formData = new FormData();
        formData.append('images', file);
        formData.append('product_id', this.productForm.id || '');
        formData.append('image_type', 2);
        formData.append('session_id', this.sessionId);
        try {
          const res = await this.$api.postWithErrorHandler('/product-images/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              ...this.uploadHeaders
            },
            fallbackKey: 'admin.products.error.imageUploadFailed'
          });
          if (res.success && res.data && res.data.images && res.data.images[0]) {
            const url = res.data.images[0].path;
            const range = quill.getSelection();
            const index = range ? range.index : 0;
            
            // 插入图片
            quill.insertEmbed(index, 'image', url);
            
            // 设置图片居中样式
            quill.setSelection(index + 1);
            quill.format('align', 'center');
            
            // 移动光标到图片后面
            quill.setSelection(index + 1);
          } else {
            this.$messageHandler.showError(res.message, 'admin.products.error.imageUploadFailed');
          }
        } catch (err) {
          // 错误已由postWithErrorHandler处理，这里不需要再次显示
        }
      };
    },
    onQuillChange(content) {
      // 保证full_description始终为字符串，避免循环引用
      if (typeof content === 'object' && content.html) {
        this.productForm.full_description = content.html;
      } else if (typeof content === 'string') {
        this.productForm.full_description = content;
      } else {
        this.productForm.full_description = '';
      }
    },
    onQuillReady(quill) {
      console.log('QuillEditor ready:', quill);
      
      // 确保工具栏存在
      const toolbar = quill.getModule('toolbar');
      if (!toolbar) {
        console.error('QuillEditor toolbar not found');
        return;
      }
      
      // 强制设置内容，兼容v-model不生效的情况
      if (this.productForm.full_description) {
        quill.root.innerHTML = this.productForm.full_description;
      }
      
      // 设置图片上传处理器
      toolbar.addHandler('image', () => {
        this.handleQuillImageUpload(quill);
      });
      
      // 确保工具栏可见
      this.$nextTick(() => {
        const toolbarElement = quill.container.querySelector('.ql-toolbar');
        if (toolbarElement) {
          toolbarElement.style.display = 'block';
          toolbarElement.style.visibility = 'visible';
        }
      });
    },
    
    // 处理最大数量变化
    handleMaxQuantityChange(index) {
      const currentRange = this.productForm.price_ranges[index]
      if (currentRange.max_quantity !== null && currentRange.max_quantity > 0) {
        // 检查是否已经有下一个阶梯
        if (index === this.productForm.price_ranges.length - 1) {
          // 自动添加下一个阶梯
          this.productForm.price_ranges.push({
            min_quantity: currentRange.max_quantity + 1,
            max_quantity: null,
            price: 0
          })
        } else {
          // 更新下一个阶梯的最小数量
          this.productForm.price_ranges[index + 1].min_quantity = currentRange.max_quantity + 1
        }
      }
    },
    
    // 添加价格区间
    addPriceRange() {
      const lastRange = this.productForm.price_ranges[this.productForm.price_ranges.length - 1]
      const newMinQuantity = lastRange.max_quantity ? lastRange.max_quantity + 1 : 100
      
      this.productForm.price_ranges.push({
        min_quantity: newMinQuantity,
        max_quantity: null,
        price: 0
      })
    },
    
    // 删除价格区间
    removePriceRange(index) {
      if (this.productForm.price_ranges.length > 1) {
        this.productForm.price_ranges.splice(index, 1);
        
        // 重新调整后续阶梯的min_quantity
        for (let i = index; i < this.productForm.price_ranges.length; i++) {
          if (i === 0) {
            // 第一个阶梯的min_quantity始终为1
            this.productForm.price_ranges[i].min_quantity = 1;
          } else {
            // 后续阶梯的min_quantity基于前一个阶梯的max_quantity
            const prevRange = this.productForm.price_ranges[i - 1];
            if (prevRange.max_quantity !== null && prevRange.max_quantity > 0) {
              this.productForm.price_ranges[i].min_quantity = prevRange.max_quantity + 1;
            }
          }
        }
      }
    },
    
    // 关联商品相关方法
    // 显示添加关联商品对话框
    showAddLinkedProductDialog() {
      this.addLinkedProductVisible = true
      this.linkedProductSearch.keyword = ''
      this.searchResults = []
      this.selectedProducts = []
    },
    
    // 搜索关联商品
    async searchLinkedProducts() {
      if (!this.linkedProductSearch.keyword.trim()) {
        this.$messageHandler.showError('请输入搜索关键词', 'admin.products.error.searchKeywordRequired')
        return
      }
      
      this.searchingProducts = true
      try {
        const response = await this.$api.getWithErrorHandler('products', {
          params: {
            keyword: this.linkedProductSearch.keyword,
            page: 1,
            limit: 20,
            status: 'on_shelf'
          },
          fallbackKey: 'admin.products.error.searchProductsFailed'
        })
        
        // 过滤掉当前管理的商品和已关联的商品
        const currentProductId = this.currentManageProduct.id || this.productForm.id
        const linkedProductIds = this.linkedProducts.map(p => p.link_product_id)
        
        // 修正数据访问路径：response.data.items
        const products = response.data.items || []
        this.searchResults = products.filter(product => 
          product.id !== currentProductId && !linkedProductIds.includes(product.id)
        )
        
        if (this.searchResults.length === 0) {
          this.$messageHandler.showInfo('未找到符合条件的商品', 'admin.products.info.noSearchResults')
        }
      } catch (error) {
        console.error('搜索商品失败:', error)
        // 错误已由getWithErrorHandler处理，这里不需要再次显示
      } finally {
        this.searchingProducts = false
      }
    },
    
    // 切换商品选择状态
    toggleProductSelection(product) {
      const index = this.selectedProducts.indexOf(product.id)
      if (index > -1) {
        this.selectedProducts.splice(index, 1)
      } else {
        this.selectedProducts.push(product.id)
      }
    },
    

    
    // 确认添加关联商品
    async confirmAddLinkedProducts() {
      if (this.selectedProducts.length === 0) {
        this.$messageHandler.showError('请选择要关联的商品', 'admin.products.error.noProductsSelected')
        return
      }
      
      try {
        const productId = this.currentManageProduct.id
        const linkData = this.selectedProducts.map(productId => ({
          link_product_id: productId,
          link_type: 'buy_together'
        }))
        
        await this.$api.postWithErrorHandler(`products/${productId}/links`, { links: linkData }, {
          fallbackKey: 'admin.products.error.addLinkedProductsFailed'
        })
        
        // 重新获取关联商品列表
        const response = await this.$api.getWithErrorHandler(`products/${productId}/links`, {
          fallbackKey: 'admin.products.error.fetchLinkedProductsFailed'
        })
        this.linkedProducts = response.data || []
        
        // 清空搜索结果和选中状态
        this.searchResults = []
        this.selectedProducts = []
        this.linkedProductSearch.keyword = ''
        
        this.$messageHandler.showSuccess('关联商品添加成功', 'admin.products.success.linkedProductsAdded')
      } catch (error) {
        console.error('添加关联商品失败:', error)
        // 错误已由postWithErrorHandler处理，这里不需要再次显示
      }
    },
    
    // 移除关联商品
    async removeLinkedProduct(index) {
      const linkedProduct = this.linkedProducts[index]
      
      try {
        const productId = this.currentManageProduct.id
        await this.$api.deleteWithErrorHandler(`products/${productId}/links/${linkedProduct.id}`, {
          fallbackKey: 'admin.products.error.removeLinkedProductFailed'
        })
        
        // 重新获取关联商品列表
        const response = await this.$api.getWithErrorHandler(`products/${productId}/links`, {
          fallbackKey: 'admin.products.error.fetchLinkedProductsFailed'
        })
        this.linkedProducts = response.data || []
        
        this.$messageHandler.showSuccess('关联商品移除成功', 'admin.products.success.linkedProductRemoved')
      } catch (error) {
        console.error('移除关联商品失败:', error)
        // 错误已由deleteWithErrorHandler处理，这里不需要再次显示
      }
    },
    
    // 获取关联商品列表
    async fetchLinkedProducts() {
      if (!this.productForm.id) return
      
      try {
        const response = await this.$api.getWithErrorHandler(`products/${this.productForm.id}/links`, {
          fallbackKey: 'admin.products.error.fetchLinkedProductsFailed'
        })
        this.linkedProducts = response.data || []
      } catch (error) {
        console.error('获取关联商品失败:', error)
        // 错误已由getWithErrorHandler处理，这里不需要再次显示
      }
    }
  }
}
</script>

<style scoped>
.admin-products {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;

  .el-form {
    margin-bottom: 0;
  }
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
}

.product-image-uploader :deep(.el-upload) {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
}

/* 自定义文件项样式 */
.upload-file-item {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
}

.upload-file-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-video-preview {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}



.upload-unknown-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 10px;
  width: 100%;
  height: 100%;
}

.upload-unknown-file .el-icon {
  font-size: 32px;
  color: #909399;
  margin-bottom: 8px;
}

.upload-unknown-file span {
  font-size: 12px;
  color: #666;
  word-break: break-all;
  line-height: 1.2;
}

.upload-file-actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.3s;
}

.upload-file-item:hover .upload-file-actions {
  opacity: 1;
}

/* 轮播图自定义按钮样式 */
.product-media-uploader :deep(.el-upload-list__item-actions) {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  cursor: pointer;
  text-align: center;
  color: #fff;
  opacity: 0;
  font-size: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.product-media-uploader :deep(.el-upload-list__item:hover .el-upload-list__item-actions) {
  opacity: 1;
}

.product-media-uploader :deep(.el-upload-list__item-preview),
.product-media-uploader :deep(.el-upload-list__item-delete) {
  font-size: 20px;
  color: #fff;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.product-media-uploader :deep(.el-upload-list__item-preview:hover),
.product-media-uploader :deep(.el-upload-list__item-delete:hover) {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

.upload-file-actions .el-icon {
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
  background-color: rgba(0, 0, 0, 0.5);
}

.upload-file-actions .el-icon:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 预览和删除图标样式 */
.preview-icon,
.delete-icon {
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.7);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.preview-icon:hover,
.delete-icon:hover {
  background-color: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

/* 视频标识样式 */
.video-indicator {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  z-index: 2;
}

.video-play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.8);
  font-size: 32px;
  z-index: 1;
  pointer-events: none;
}


.product-image-uploader :deep(.el-upload:hover) {
  border-color: var(--el-color-primary);
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 阶梯价格样式 */
.price-ranges-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  background-color: #fafafa;
}

.infinity-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 32px;
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
  background-color: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
}

.price-range-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.price-range-item:last-of-type {
  margin-bottom: 0;
}

.range-separator {
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
}

/* 关联商品样式 */
.linked-products-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  background-color: #fafafa;
  min-height: 100px;
}

.linked-products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.linked-products-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.linked-products-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.linked-product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  transition: all 0.3s;
}

.linked-product-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
}

.linked-product-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.linked-product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.linked-product-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  line-height: 1.2;
}

.linked-product-code {
  font-size: 12px;
  color: #909399;
}

.linked-product-price {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 500;
}

.linked-products-empty {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 20px;
}

/* 搜索商品对话框样式 */
.search-products-container {
  padding: 20px 0;
}

.search-form {
  margin-bottom: 20px;
}

.search-results-container {
  max-height: 400px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 8px;
  transition: all 0.3s;
  cursor: pointer;
}

.search-result-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.search-result-item.selected {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.search-result-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.search-result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.search-result-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  line-height: 1.2;
}

.search-result-code {
  font-size: 12px;
  color: #909399;
}

.search-result-price {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 500;
}

.search-result-category {
  font-size: 12px;
  color: #606266;
}

.search-no-results {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 40px 20px;
}

/* 对话框样式 */
:deep(.el-dialog) {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

:deep(.el-dialog__header) {
  flex-shrink: 0;
  padding: 12px 20px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

:deep(.el-dialog__footer) {
  flex-shrink: 0;
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
}

/* 对话框头部样式 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.dialog-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.return-btn-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  border: none;
  background: linear-gradient(135deg, #409eff 0%, #66b3ff 100%);
}

.return-btn-circle:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
  background: linear-gradient(135deg, #66b3ff 0%, #409eff 100%);
}

.return-btn-circle .el-icon {
  font-size: 18px;
  color: #fff;
}

/* Quill编辑器样式 */
.quill-editor-container {
  height: 800px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.quill-editor-container :deep(.ql-toolbar) {
  border: none;
  border-bottom: 1px solid #dcdfe6;
  background-color: #fafafa;
  padding: 8px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.quill-editor-container :deep(.ql-container) {
  flex: 1;
  border: none;
  font-family: inherit;
  display: flex;
  flex-direction: column;
}

.quill-editor-container :deep(.ql-editor) {
  flex: 1;
  padding: 15px;
  line-height: 1.6;
  font-size: 14px;
  overflow-y: auto;
  border: none;
  min-height: 0;
}

.quill-editor-container :deep(.ql-editor.ql-blank::before) {
  color: #c0c4cc;
  font-style: normal;
}

/* Quill图片调整大小样式 */
.quill-editor-container :deep(.ql-image-resize) {
  border: 2px solid #409eff;
}

.quill-editor-container :deep(.ql-image-resize-handle) {
  width: 8px;
  height: 8px;
  background: #409eff;
  border: 1px solid #fff;
  border-radius: 50%;
}

.quill-editor-container :deep(.ql-image-resize-toolbar) {
  background: #409eff;
  border-radius: 4px;
  padding: 4px;
}

.quill-editor-container :deep(.ql-image-resize-toolbar button) {
  color: #fff;
  border: none;
  background: transparent;
  padding: 4px 8px;
  border-radius: 2px;
  cursor: pointer;
}

.quill-editor-container :deep(.ql-image-resize-toolbar button:hover) {
  background: rgba(255, 255, 255, 0.2);
}

/* 关联产品管理对话框样式 */
.link-manage-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.current-product-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.current-product-info h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h5 {
  margin: 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.linked-products-section {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
}

.linked-products-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.linked-product-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
  transition: all 0.3s;
}

.linked-product-item:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.linked-product-image {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  object-fit: cover;
}

.linked-product-no-image {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #909399;
  border: 1px solid #e4e7ed;
}

.linked-product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.linked-product-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  line-height: 1.2;
}

.linked-product-code {
  font-size: 12px;
  color: #909399;
}

.linked-product-price {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 500;
}

.linked-product-actions {
  flex-shrink: 0;
}

.linked-products-empty {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 40px 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.add-linked-section {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
}
</style>