<template>
  <div class="admin-products">
    <div class="page-header">
      <h2>产品管理</h2>
      <el-button type="primary" @click="handleAdd">添加产品</el-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-container">
      <el-input v-model="filters.keyword" placeholder="产品名称/编号" style="width: 200px;" class="filter-item"
        @keyup.enter="handleFilter" />
      <el-select v-model="filters.category" placeholder="产品分类" clearable style="width: 200px" class="filter-item">
        <el-option v-for="item in categoryOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px" class="filter-item">
        <el-option label="上架" value="1" />
        <el-option label="下架" value="0" />
      </el-select>
      <el-select v-model="filters.product_type" placeholder="产品类型" clearable style="width: 120px" class="filter-item">
        <el-option label="代销" value="consignment" />
        <el-option label="自营" value="self_operated" />
      </el-select>
      <el-button type="primary" @click="handleFilter">
        <el-icon>
          <Search />
        </el-icon>
        搜索
      </el-button>
      <el-button @click="resetFilter">
        <el-icon>
          <Refresh />
        </el-icon>
        重置
      </el-button>
    </div>

    <!-- 产品表格 -->
    <el-table v-loading="loading" :data="productList" border style="width: 100%" @sort-change="handleSortChange">
      <el-table-column prop="id" label="ID" width="80" sortable="custom" />
      <el-table-column label="产品图片" width="120">
        <template #default="{row}">
          <el-image :src="row.thumbnail_url" :preview-src-list="[row.thumbnail_url]" fit="cover" class="product-image"
            v-if="row.thumbnail_url" @error="handleImageError">
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
            {{ row.product_type === 'self_operated' ? '自营' : '代销' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="价格" width="120" sortable="custom">
        <template #default="{row}">
          <span>{{ row.price ? '¥' + row.price : '面议' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="100" sortable="custom" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160" sortable="custom">
        <template #default="{row}">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{row}">
          <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
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
    <el-dialog :title="dialogStatus === 'create' ? '添加产品' : '编辑产品'" v-model="dialogVisible" width="800px">
      <el-form :model="productForm" :rules="rules" ref="productFormRef" label-width="100px">
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="productForm.name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="产品编号" prop="product_code">
          <el-input v-model="productForm.product_code" placeholder="请输入产品编号" maxlength="64" show-word-limit>
            <template #append>
              <el-button @click="generateProductCode">生成编号</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="产品分类" prop="category_id">
          <el-select v-model="productForm.category_id" placeholder="请选择产品分类" style="width: 100%">
            <el-option v-for="item in categoryOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品类型" prop="product_type">
          <el-radio-group v-model="productForm.product_type">
            <el-radio label="consignment">代销</el-radio>
            <el-radio label="self_operated">自营</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="产品价格" prop="price">
          <el-input v-model.number="productForm.price" placeholder="请输入产品价格">
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="产品库存" prop="stock">
          <el-input-number v-model="productForm.stock" :min="0" :max="999999" />
        </el-form-item>
        <el-form-item label="产品图片" prop="images">
          <el-upload class="product-image-uploader" action="/api/product-images/upload" :headers="uploadHeaders"
            :data="{ product_id: productForm.id, image_type: 0, session_id: sessionId }" :file-list="thumbnailList"
            list-type="picture-card" :on-preview="handlePictureCardPreview" :on-remove="handleRemove"
            :on-success="handleUploadSuccess" :before-upload="beforeImageUpload" :name="'images'" :limit="1"
            :multiple="false" :show-file-list="true">
            <template v-if="thumbnailList.length < 1">
              <el-icon>
                <Plus />
              </el-icon>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="轮播图片" prop="carousel_images">
          <el-upload class="product-image-uploader" action="/api/product-images/upload" :headers="uploadHeaders"
            :data="{ product_id: productForm.id, image_type: 1, session_id: sessionId }" :file-list="carouselList"
            list-type="picture-card" :on-preview="handlePictureCardPreview" :on-remove="handleRemove"
            :on-success="handleUploadSuccess" :before-upload="beforeImageUpload" :name="'images'" :limit="10"
            :multiple="true" :show-file-list="true">
            <el-icon>
              <Plus />
            </el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="产品简介" prop="short_description">
          <el-input type="textarea" v-model="productForm.short_description" :rows="4" placeholder="请输入产品简介" />
        </el-form-item>
        <el-form-item label="产品详情" prop="full_description">
          <quill-editor ref="quillEditor" v-model="productForm.full_description" :options="quillOptions" :key="quillKey"
            style="height: 300px" @change="onQuillChange" @ready="onQuillReady" />
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
  </div>
</template>

<script>
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/format'
import { quillEditor } from 'vue3-quill'
import { getAuthToken } from '@/utils/api'

export default {
  name: 'AdminProducts',
  components: {
    Plus,
    Search,
    Refresh,
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
        stock: 0,
        short_description: '',
        full_description: '',
        status: 'on_shelf'
      },
      rules: {
        name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
        product_code: [
          { required: true, message: '请输入产品编号', trigger: 'blur' },
          { max: 64, message: '产品编号不能超过64个字符', trigger: 'blur' }
        ],
        category_id: [{ required: true, message: '请选择产品分类', trigger: 'change' }],
        product_type: [{ required: true, message: '请选择产品类型', trigger: 'change' }],
        price: [
          { required: true, message: '请输入产品价格', trigger: 'blur' },
          { type: 'number', message: '价格必须为数字', trigger: 'blur' }
        ]
      },
      sessionId: localStorage.getItem('session_id') || (Date.now() + '-' + Math.random().toString(36).substr(2, 9)),
      quillOptions: {
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean']
          ]
        }
      },
      quillKey: 0
    }
  },
  computed: {
    uploadHeaders() {
      const token = getAuthToken(true); // true 表示这是管理员请求
      return {
        Authorization: token ? `Bearer ${token}` : ''
      }
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
    // 配置quill图片上传钩子
    this.$nextTick(() => {
      if (this.$refs.quillEditor && this.$refs.quillEditor.getQuill) {
        const quill = this.$refs.quillEditor.getQuill();
        quill.getModule('toolbar').addHandler('image', () => {
          this.handleQuillImageUpload(quill);
        });
      }
    });
  },
  methods: {
    formatDate,
    
    // 获取产品分类列表
    async fetchCategories() {
      try {
        const response = await this.$api.get('categories')
        this.categoryOptions = response.data || []
      } catch (error) {
        console.error('获取分类失败:', error)
        this.$messageHandler.showError(error, 'admin.products.error.fetchCategoriesFailed')
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
        
        const response = await this.$api.get('products', { params })
        this.productList = response.data?.items || []
        this.pagination.total = response.data?.total || 0
      } catch (error) {
        console.error('获取产品列表失败:', error)
        this.$messageHandler.showError(error, 'admin.products.error.fetchProductsFailed')
      } finally {
        this.loading = false
      }
    },
    
    // 生成产品编号
    async generateProductCode() {
      if (!this.productForm.category_id) {
        this.$message.warning('请先选择产品分类')
        return
      }
      
      try {
        const response = await this.$api.get(`products/generate-code?category_id=${this.productForm.category_id}`)
        this.productForm.product_code = response.data
      } catch (error) {
        console.error('生成产品编号失败:', error)
        this.$messageHandler.showError(error, 'admin.products.error.generateCodeFailed')
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
    
    // 处理图片上传成功
    handleUploadSuccess(response, file) {
      if (response.success) {
        this.$messageHandler.showSuccess('图片上传成功', 'product.success.imageUploadSuccess')
        // 根据图片类型更新对应的列表
        if (file && file.status === 'success') {
          if (file.response && file.response.data && file.response.data.images) {
            const img = file.response.data.images[0];
            // 只根据 image_type 精确更新对应的图片列表
            if (file.raw && typeof file.raw.image_type !== 'undefined') {
              if (file.raw.image_type === 0) {
                this.thumbnailList = [{
                  name: img.filename,
                  url: img.path
                }];
              } else if (file.raw.image_type === 1) {
                this.carouselList.push({
                  name: img.filename,
                  url: img.path
                });
              }
            }
          }
        }
      } else {
        this.$messageHandler.showError(response.message, 'admin.products.error.imageUploadFailed')
      }
    },
    
    // 处理图片移除
    async handleRemove(file) {
      try {
        await this.$api.delete(`product-images/${file.id}`)
        this.$messageHandler.showSuccess('图片删除成功', 'product.success.imageDeleteSuccess')
      } catch (error) {
        console.error('删除图片失败:', error)
        this.$messageHandler.showError(error, 'admin.products.error.imageDeleteFailed')
      }
    },
    
    // 处理图片预览
    handlePictureCardPreview(file) {
      this.previewUrl = file.url
      this.previewVisible = true
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
        stock: 0,
        short_description: '',
        full_description: '',
        status: 'on_shelf'
      }
      this.thumbnailList = []
      this.carouselList = []
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
        full_description: row.full_description || ''
      })
      this.quillKey++;
      
      // 获取产品图片
      try {
        const [thumbnailResponse, carouselResponse] = await Promise.all([
          this.$api.get(`product-images?product_id=${row.id}&image_type=0`),
          this.$api.get(`product-images?product_id=${row.id}&image_type=1`)
        ])
        
        this.thumbnailList = thumbnailResponse.data.map(img => ({
          id: img.id,
          name: img.image_url.split('/').pop(),
          url: img.image_url
        }))
        
        this.carouselList = carouselResponse.data.map(img => ({
          id: img.id,
          name: img.image_url.split('/').pop(),
          url: img.image_url
        }))
      } catch (error) {
        console.error('获取产品图片失败:', error)
        this.$messageHandler.showError(error, 'admin.products.error.fetchImagesFailed')
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
          const response = await this.$api.delete(`products/${row.id}`)
          this.$messageHandler.showSuccess(response.message || '删除成功', 'product.success.deleteSuccess')
          this.fetchProducts()
        } catch (error) {
          console.error('删除产品失败:', error)
          this.$messageHandler.showError(error, 'admin.products.error.deleteProductFailed')
        }
      }).catch(() => {})
    },
    
    // 提交表单
    async submitForm() {
      this.$refs.productFormRef.validate(async valid => {
        if (valid) {
          console.log('full_description:', this.productForm.full_description);
          this.submitLoading = true
          try {
            let response
            if (this.dialogStatus === 'create') {
              response = await this.$api.postWithErrorHandler('products', this.productForm)
              // 新建产品后，关联图片
              await this.$api.postWithErrorHandler('product-images/assign', {
                product_id: response.data.id,
                session_id: this.sessionId
              })
            } else {
              response = await this.$api.put(`products/${this.productForm.id}`, this.productForm)
            }
            this.$messageHandler.showSuccess(response.message || (this.dialogStatus === 'create' ? '添加成功' : '更新成功'), this.dialogStatus === 'create' ? 'product.success.createSuccess' : 'product.success.updateSuccess')
            this.dialogVisible = false
            this.fetchProducts()
          } catch (error) {
            console.error(this.dialogStatus === 'create' ? '添加产品失败:' : '更新产品失败:', error)
            this.$messageHandler.showError(error, this.dialogStatus === 'create' ? 'admin.products.error.createProductFailed' : 'admin.products.error.updateProductFailed')
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
            }
          });
          if (res.success && res.data && res.data.images && res.data.images[0]) {
            const url = res.data.images[0].path;
            const range = quill.getSelection();
            quill.insertEmbed(range ? range.index : 0, 'image', url);
          } else {
            this.$messageHandler.showError(res.message, 'admin.products.error.imageUploadFailed');
          }
        } catch (err) {
          this.$messageHandler.showError(err, 'admin.products.error.imageUploadFailed');
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
      // 强制设置内容，兼容v-model不生效的情况
      if (quill && this.productForm.full_description) {
        quill.root.innerHTML = this.productForm.full_description;
      }
      if (quill && quill.getModule('toolbar')) {
        quill.getModule('toolbar').addHandler('image', () => {
          this.handleQuillImageUpload(quill);
        });
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

.filter-container {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
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
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.product-image-uploader :deep(.el-upload:hover) {
  border-color: var(--el-color-primary);
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>