<template>
  <div class="company-page">
    <div class="page-header">
      <h2>公司信息管理</h2>
    </div>

    <el-card class="company-form-card">
      <el-form :model="companyForm" :rules="rules" ref="companyForm" label-width="100px" label-position="left">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="公司名称" prop="company_name">
              <el-input v-model="companyForm.company_name" placeholder="请输入公司名称"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人姓名" prop="contact_name">
              <el-input v-model="companyForm.contact_name" placeholder="请输入联系人姓名"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="companyForm.phone" placeholder="请输入联系电话"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系邮箱" prop="email">
              <el-input v-model="companyForm.email" placeholder="请输入联系邮箱"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="营业时间" prop="business_hours">
              <el-input v-model="companyForm.business_hours" placeholder="例如：周一至周五 9:00-18:00"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公司地址" prop="address">
              <el-input v-model="companyForm.address" placeholder="请输入公司地址"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="公司简介" prop="description">
          <el-input type="textarea" v-model="companyForm.description" :rows="4" placeholder="请输入公司简介"></el-input>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="公司Logo" prop="logo_url">
              <el-upload class="logo-uploader" :action="logoUploadUrl" :show-file-list="false"
                :on-success="handleLogoSuccess" :before-upload="beforeLogoUpload" name="file">
                <img v-if="companyForm.logo_url" :src="companyForm.logo_url" class="logo-image">
                <i v-else class="el-icon-plus logo-uploader-icon"></i>
              </el-upload>
              <div class="logo-tip">建议尺寸: 200px × 200px，支持jpg、png格式</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信二维码" prop="wechat_qrcode">
              <el-upload class="qrcode-uploader" :action="wechatUploadUrl" :show-file-list="false"
                :on-success="handleQrcodeSuccess" :before-upload="beforeQrcodeUpload" name="file">
                <img v-if="companyForm.wechat_qrcode" :src="companyForm.wechat_qrcode" class="qrcode-image">
                <i v-else class="el-icon-plus qrcode-uploader-icon"></i>
              </el-upload>
              <div class="qrcode-tip">建议尺寸: 300px × 300px，支持jpg、png格式</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="submitForm('companyForm')" :loading="loading">保存修改</el-button>
          <el-button @click="resetForm('companyForm')">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>

export default {
  name: 'CompanyManagement',
  data() {
    return {
      loading: false,
      companyForm: {
        company_name: '',
        contact_name: '',
        address: '',
        phone: '',
        email: '',
        wechat_qrcode: '',
        business_hours: '',
        description: '',
        logo_url: ''
      },
      rules: {
        company_name: [
          { required: true, message: '请输入公司名称', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        contact_name: [
          { required: true, message: '请输入联系人姓名', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入联系邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        address: [
          { required: true, message: '请输入公司地址', trigger: 'blur' }
        ],
        description: [
          { required: true, message: '请输入公司简介', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.fetchCompanyInfo()
  },
  methods: {
    async fetchCompanyInfo() {
      try {
        const { success, message, data } = await this.$api.get('company')
        if (success) {
          this.companyForm = data
        } else {
          this.$messageHandler.showError(message, 'admin.company.error.fetchFailed')
        }
      } catch (error) {
        console.error('获取公司信息出错:', error)
        this.$messageHandler.showError(error, 'admin.company.error.fetchFailed')
      }
    },
    async submitForm(formName) {
      try {
        await this.$refs[formName].validate()
      } catch (error) {
        this.$messageHandler.showError('表单验证失败，请检查输入项', 'admin.company.error.validationFailed')
        return false
      }
      this.loading = true
      try {
        const { success, message } = await this.$api.put('company', this.companyForm)
        if (success) {
          this.$messageHandler.showSuccess('公司信息更新成功', 'company.success.updateSuccess')
        } else {
          this.$messageHandler.showError(message, 'admin.company.error.updateFailed')
        }
      } catch (error) {
        this.$messageHandler.showError(error, 'admin.company.error.updateFailed')
        console.error('更新公司信息出错:', error)
      } finally {
        this.loading = false
      }
    },
    resetForm(formName) {
      this.$refs[formName].resetFields()
      this.fetchCompanyInfo()
    },
    handleLogoSuccess(res) {
      if (res.success) {
        this.companyForm.logo_url = res.data.url
        this.$messageHandler.showSuccess('Logo上传成功', 'company.success.logoUploadSuccess')
      } else {
        this.$messageHandler.showError(res.message, 'admin.company.error.logoUploadFailed')
      }
    },
    beforeLogoUpload(file) {
      const isJPGOrPNG = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isJPGOrPNG) {
        this.$messageHandler.showError('Logo只能是JPG或PNG格式!', 'admin.company.error.logoFormatInvalid')
      }
      if (!isLt2M) {
        this.$messageHandler.showError('Logo大小不能超过2MB!', 'admin.company.error.logoTooLarge')
      }
      return isJPGOrPNG && isLt2M
    },
    handleQrcodeSuccess(res) {
      if (res.success) {
        this.companyForm.wechat_qrcode = res.data.url
        this.$messageHandler.showSuccess('二维码上传成功', 'company.success.qrUploadSuccess')
      } else {
        this.$messageHandler.showError(res.message, 'admin.company.error.qrcodeUploadFailed')
      }
    },
    beforeQrcodeUpload(file) {
      const isJPGOrPNG = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isJPGOrPNG) {
        this.$messageHandler.showError('二维码只能是JPG或PNG格式!', 'admin.company.error.qrcodeFormatInvalid')
      }
      if (!isLt2M) {
        this.$messageHandler.showError('二维码大小不能超过2MB!', 'admin.company.error.qrcodeTooLarge')
      }
      return isJPGOrPNG && isLt2M
    }
  },
  computed: {
    logoUploadUrl() {
      return '/api/company/upload/logo';
    },
    wechatUploadUrl() {
      return '/api/company/upload/wechat';
    }
  }
}
</script>

<style scoped>
.company-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.company-form-card {
  margin-bottom: 20px;
}

.logo-uploader,
.qrcode-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-uploader:hover,
.qrcode-uploader:hover {
  border-color: #409EFF;
}

.logo-uploader-icon,
.qrcode-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 200px;
  height: 200px;
  line-height: 200px;
  text-align: center;
}

.logo-image,
.qrcode-image {
  max-width: 100%;
  max-height: 100%;
}

.logo-tip,
.qrcode-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>