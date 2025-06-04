<template>
  <div class="admin-banners">
    <div class="page-header">
      <h2>Banner管理</h2>
      <el-button type="primary" @click="handleAdd">添加Banner</el-button>
    </div>

    <!-- Banner列表 -->
    <el-table v-loading="loading" :data="bannerList" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="Banner图片" width="200">
        <template #default="{row}">
          <img :src="row.image" alt="Banner图片" class="banner-image" v-if="row.image">
          <span v-else>无图片</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip />
      <el-table-column prop="url" label="链接" min-width="150" show-overflow-tooltip />
      <el-table-column prop="sort_order" label="排序" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{row}">
          <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Banner表单对话框 -->
    <el-dialog :title="dialogStatus === 'create' ? '添加Banner' : '编辑Banner'" v-model="dialogVisible" width="600px">
      <el-form :model="bannerForm" :rules="rules" ref="bannerForm" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="bannerForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="Banner图片" prop="image">
          <el-upload class="banner-uploader" action="upload" :show-file-list="false" :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload">
            <img v-if="bannerForm.image" :src="bannerForm.image" class="banner-preview">
            <el-icon v-else class="banner-uploader-icon">
              <Plus />
            </el-icon>
          </el-upload>
          <div class="image-tip">建议尺寸: 1920px × 500px</div>
        </el-form-item>
        <el-form-item label="链接" prop="url">
          <el-input v-model="bannerForm.url" placeholder="请输入链接地址" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="bannerForm.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="bannerForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="bannerForm.description" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Plus } from '@element-plus/icons-vue'

export default {
  components: {
    Plus
  },
  name: 'AdminBanners',
  data() {
    return {
      loading: false,
      submitLoading: false,
      dialogVisible: false,
      dialogStatus: 'create',
      bannerList: [],
      bannerForm: {
        id: undefined,
        title: '',
        image: '',
        url: '',
        sort_order: 0,
        description: '',
        status: 1
      },
      rules: {
        title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
        image: [{ required: true, message: '请上传Banner图片', trigger: 'change' }],
        sort_order: [{ required: true, message: '请输入排序值', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.fetchBanners()
  },
  methods: {
    // 获取Banner列表
    async fetchBanners() {
      this.loading = true
      try {
        const response = await this.$api.get('banners')
        if (response.success) {
          this.bannerList = response.data
        } else {
          this.$errorHandler.showError(response.message, 'admin.banners.error.fetchFailed')
        }
      } catch (error) {
        console.error('获取Banner列表失败:', error)
        this.$errorHandler.showError(error, 'admin.banners.error.fetchFailed')
      } finally {
        this.loading = false
      }
    },
    
    // 添加Banner
    handleAdd() {
      this.dialogStatus = 'create'
      this.bannerForm = {
        id: undefined,
        title: '',
        image: '',
        url: '',
        sort_order: 0,
        description: '',
        status: 1
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.bannerForm.clearValidate()
      })
    },
    
    // 编辑Banner
    handleEdit(row) {
      this.dialogStatus = 'update'
      this.bannerForm = Object.assign({}, row)
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.bannerForm.clearValidate()
      })
    },
    
    // 删除Banner
    handleDelete(row) {
      this.$confirm('确认删除该Banner吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await this.$api.delete(`banners/${row.id}`)
          if (response.success) {
            this.$errorHandler.showSuccess('删除成功', 'banner.success.deleteSuccess')
            this.fetchBanners()
          } else {
            this.$errorHandler.showError(response.message, 'admin.banners.error.deleteFailed')
          }
        } catch (error) {
          console.error('删除Banner失败:', error)
          this.$errorHandler.showError(error, 'admin.banners.error.deleteFailed')
        }
      }).catch(() => {})
    },
    
    // 提交表单
    submitForm() {
      this.$refs.bannerForm.validate(async valid => {
        if (valid) {
          this.submitLoading = true
          try {
            let response
            if (this.dialogStatus === 'create') {
              response = await this.$api.postWithErrorHandler('banners', this.bannerForm)
            } else {
              response = await this.$api.put(`banners/${this.bannerForm.id}`, this.bannerForm)
            }
            
            if (response.success) {
              this.$errorHandler.showSuccess(this.dialogStatus === 'create' ? '添加成功' : '更新成功', this.dialogStatus === 'create' ? 'banner.success.createSuccess' : 'banner.success.updateSuccess')
              this.dialogVisible = false
              this.fetchBanners()
            } else {
              this.$errorHandler.showError(response.message, this.dialogStatus === 'create' ? 'admin.banners.error.createFailed' : 'admin.banners.error.updateFailed')
            }
          } catch (error) {
            console.error(this.dialogStatus === 'create' ? '添加Banner失败:' : '更新Banner失败:', error)
            this.$errorHandler.showError(error, this.dialogStatus === 'create' ? 'admin.banners.error.createFailed' : 'admin.banners.error.updateFailed')
          } finally {
            this.submitLoading = false
          }
        }
      })
    },
    
    // 图片上传成功回调
    handleImageSuccess(res) {
      if (res.success) {
        this.bannerForm.image = res.data.url
      } else {
        this.$errorHandler.showError(res.message, 'admin.banners.error.uploadFailed')
      }
    },
    
    // 图片上传前验证
    beforeImageUpload(file) { // eslint-disable-line no-unused-vars
      const isJPG = file.type === 'image/jpeg'
      const isPNG = file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isJPG && !isPNG) {
        this.$errorHandler.showError('上传图片只能是 JPG 或 PNG 格式!', 'admin.banners.error.invalidFormat')
      }
      if (!isLt2M) {
        this.$errorHandler.showError('上传图片大小不能超过 2MB!', 'admin.banners.error.fileTooLarge')
      }
      return (isJPG || isPNG) && isLt2M
    }
  }
}
</script>

<style scoped>
.admin-banners {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.banner-image {
  width: 180px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.banner-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.banner-uploader .el-upload:hover {
  border-color: #409EFF;
}

.banner-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 360px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.banner-preview {
  width: 360px;
  height: 120px;
  display: block;
  object-fit: cover;
}

.image-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>