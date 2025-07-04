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
        <el-form-item label="排序" prop="sort_order">
          <el-input-number 
            v-model="productForm.sort_order" 
            :min="0" 
            placeholder="请输入排序值（数值越大越排前）"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="产品图片" prop="images">
          <el-upload class="product-image-uploader" action="/api/product-images/upload?image_type=0"
            :headers="uploadHeaders" :data="{ product_id: productForm.id, session_id: sessionId }"
            :file-list="thumbnailList" list-type="picture-card" :on-preview="handleMediaPreview"
            :on-remove="handleRemove" :on-success="handleUploadSuccess" :before-upload="beforeImageUpload"
            :name="'images'" :limit="1" :multiple="false" :show-file-list="true">
            <template v-if="thumbnailList.length < 1">
              <el-icon>
                <Plus />
              </el-icon>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="轮播媒体" prop="carousel_media">
          <el-upload ref="uploadRef" class="product-media-uploader" action="/api/product-images/upload?image_type=1"
            :headers="uploadHeaders" :data="{ product_id: productForm.id, session_id: sessionId }"
            :file-list="carouselList" list-type="picture-card" :on-preview="handleMediaPreview"
            :on-remove="handleRemove" :on-success="handleUploadSuccess" :before-upload="beforeMediaUpload"
            :name="'images'" :limit="10" :multiple="true" :show-file-list="true">
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
import { Plus, Search, Refresh, Document, Delete, ZoomIn, VideoPlay } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/format'
import { quillEditor } from 'vue3-quill'
import { getAuthToken } from '@/utils/api'

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
        sort_order: 0,
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
        this.$messageHandler.showWarning('请先选择产品分类', 'admin.products.warning.selectCategoryFirst')
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
        
        await this.$api.delete(`product-images/${file.id}`)
        
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
        this.$messageHandler.showError(error, 'admin.products.error.imageDeleteFailed')
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
        stock: 0,
        sort_order: 0,
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
      
      // 获取产品图片和视频
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
        
        this.carouselList = carouselResponse.data.map(media => ({
          id: media.id,
          name: media.image_url.split('/').pop(),
          url: media.image_url
        }))
      } catch (error) {
        console.error('获取产品媒体文件失败:', error)
        this.$messageHandler.showError(error, 'admin.products.error.fetchMediaFailed')
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
              // 新建产品后，关联图片和视频
              const productId = response.data.id
              
              // 关联所有上传的图片和视频到新创建的产品
              if (this.sessionId) {
                await this.$api.post('product-images/assign', {
                  product_id: productId,
                  session_id: this.sessionId
                })
              }
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
</style>