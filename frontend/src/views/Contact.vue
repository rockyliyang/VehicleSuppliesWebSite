<template>
  <div class="contact-page">
    <div class="page-banner">
      <div class="banner-content">
        <h1>联系我们</h1>
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>联系我们</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="contact-section">
        <div class="section-title">
          <h2>联系方式</h2>
          <div class="title-underline"></div>
        </div>
        
        <div class="contact-content">
          <div class="contact-info">
            <div class="info-item">
              <div class="info-icon">
                <i class="el-icon-location-information"></i>
              </div>
              <div class="info-content">
                <h3>公司地址</h3>
                <p>{{ companyInfo.address || '123 Auto Street, Vehicle City' }}</p>
              </div>
            </div>
            
            <div class="info-item">
              <div class="info-icon">
                <i class="el-icon-phone"></i>
              </div>
              <div class="info-content">
                <h3>联系电话</h3>
                <p>{{ companyInfo.phone || '+86 123 4567 8910' }}</p>
              </div>
            </div>
            
            <div class="info-item">
              <div class="info-icon">
                <i class="el-icon-message"></i>
              </div>
              <div class="info-content">
                <h3>电子邮箱</h3>
                <p>{{ companyInfo.email || 'contact@autoease.com' }}</p>
              </div>
            </div>
            
            <div class="info-item">
              <div class="info-icon">
                <i class="el-icon-time"></i>
              </div>
              <div class="info-content">
                <h3>营业时间</h3>
                <p>{{ companyInfo.business_hours || '周一至周五: 9:00 - 18:00' }}</p>
              </div>
            </div>
          </div>
          
          <div class="contact-form-container">
            <h3>给我们留言</h3>
            <el-form :model="contactForm" :rules="contactRules" ref="contactForm" label-width="80px">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="contactForm.name"></el-input>
              </el-form-item>
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="contactForm.email"></el-input>
              </el-form-item>
              <el-form-item label="电话" prop="phone">
                <el-input v-model="contactForm.phone"></el-input>
              </el-form-item>
              <el-form-item label="主题" prop="subject">
                <el-input v-model="contactForm.subject"></el-input>
              </el-form-item>
              <el-form-item label="留言" prop="message">
                <el-input type="textarea" v-model="contactForm.message" rows="5"></el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="submitForm">提交留言</el-button>
                <el-button @click="resetForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
      
      <div class="map-section">
        <div class="section-title">
          <h2>公司位置</h2>
          <div class="title-underline"></div>
        </div>
        
        <div class="map-container">
          <!-- 实际项目中会使用地图API，这里用图片代替 -->
          <img src="../assets/images/map.jpg" alt="公司地图">
        </div>
      </div>
      
      <div class="qrcode-section">
        <div class="section-title">
          <h2>关注我们</h2>
          <div class="title-underline"></div>
        </div>
        
        <div class="qrcode-container">
          <div class="qrcode-item">
            <div class="qrcode-image">
              <img :src="companyInfo.wechat_qrcode || '../assets/images/qrcode.png'" alt="微信二维码">
            </div>
            <p>扫描二维码关注我们的微信公众号</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Contact',
  data() {
    return {
      companyInfo: {},
      contactForm: {
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      },
      contactRules: {
        name: [
          { required: true, message: '请输入您的姓名', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入您的邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: '请输入您的电话', trigger: 'blur' }
        ],
        subject: [
          { required: true, message: '请输入留言主题', trigger: 'blur' }
        ],
        message: [
          { required: true, message: '请输入留言内容', trigger: 'blur' }
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
        const response = await axios.get('/api/company')
        this.companyInfo = response.data.data
      } catch (error) {
        console.error('获取公司信息失败:', error)
      }
    },
    submitForm() {
      this.$refs.contactForm.validate(valid => {
        if (valid) {
          // 实际项目中会发送到后端API
          this.$message.success('留言已提交，我们会尽快与您联系')
          this.resetForm()
        }
      })
    },
    resetForm() {
      this.$refs.contactForm.resetFields()
    }
  }
}
</script>

<style scoped>
.contact-page {
  min-height: 100vh;
}

.page-banner {
  height: 200px;
  background-color: #f5f5f5;
  background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('../assets/images/banner1.jpg');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  margin-bottom: 40px;
}

.banner-content h1 {
  font-size: 32px;
  margin-bottom: 10px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.contact-section, .map-section, .qrcode-section {
  margin-bottom: 60px;
}

.section-title {
  text-align: center;
  margin-bottom: 30px;
}

.section-title h2 {
  font-size: 28px;
  margin-bottom: 10px;
  position: relative;
  display: inline-block;
}

.title-underline {
  width: 80px;
  height: 3px;
  background-color: #409EFF;
  margin: 0 auto;
}

.contact-content {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}

.contact-info {
  flex: 1;
  min-width: 300px;
}

.info-item {
  display: flex;
  margin-bottom: 25px;
}

.info-icon {
  font-size: 24px;
  color: #409EFF;
  margin-right: 15px;
  width: 40px;
  height: 40px;
  background-color: #ecf5ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-content h3 {
  font-size: 18px;
  margin-bottom: 5px;
}

.info-content p {
  color: #666;
  line-height: 1.6;
}

.contact-form-container {
  flex: 1;
  min-width: 300px;
  background-color: #f9f9f9;
  padding: 25px;
  border-radius: 4px;
}

.contact-form-container h3 {
  font-size: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.map-container {
  height: 400px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.map-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qrcode-container {
  display: flex;
  justify-content: center;
}

.qrcode-item {
  text-align: center;
  max-width: 200px;
}

.qrcode-image {
  width: 200px;
  height: 200px;
  margin-bottom: 10px;
}

.qrcode-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qrcode-item p {
  color: #666;
}

@media (max-width: 768px) {
  .contact-content {
    flex-direction: column;
  }
  
  .map-container {
    height: 300px;
  }
}
</style>