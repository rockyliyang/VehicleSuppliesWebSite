<template>
  <div class="contact-page">
    <PageBanner :title="$t('contact.page.title')" />
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="container">
      <!-- Contact Information 区域 -->
      <div class="contact-info-section">
        <div class="section-title">
          <h2>{{ $t('contact.contactInfo') }}</h2>
          <div class="title-underline"></div>
        </div>

        <div class="contact-info-main">
          <!-- 左侧：公司信息和关注我们 -->
          <div class="company-details">
            <!-- 公司信息 -->
            <div class="company-info">
              <div class="info-item">
                <div class="info-icon">
                  <i class="el-icon-location-information"></i>
                </div>
                <div class="info-content">
                  <h3>{{ $t('contact.address') }}</h3>
                  <p>{{ companyInfo.address || '123 Auto Street, Vehicle City' }}</p>
                </div>
              </div>

              <div class="info-item">
                <div class="info-icon">
                  <i class="el-icon-phone"></i>
                </div>
                <div class="info-content">
                  <h3>{{ $t('contact.phone') }}</h3>
                  <p>{{ companyInfo.phone || '+86 123 4567 8910' }}</p>
                </div>
              </div>

              <div class="info-item">
                <div class="info-icon">
                  <i class="el-icon-message"></i>
                </div>
                <div class="info-content">
                  <h3>{{ $t('contact.email') }}</h3>
                  <p>{{ companyInfo.email || 'contact@autoease.com' }}</p>
                </div>
              </div>

              <div class="info-item">
                <div class="info-icon">
                  <i class="el-icon-time"></i>
                </div>
                <div class="info-content">
                  <h3>{{ $t('contact.businessHours') }}</h3>
                  <p>{{ companyInfo.business_hours || '周一至周五: 9:00 - 18:00' }}</p>
                </div>
              </div>
            </div>

            <!-- 关注我们 -->
            <div class="follow-us">
              <h3>{{ $t('contact.followUs') }}</h3>
              <div class="qrcode-container">
                <div class="qrcode-item">
                  <div class="qrcode-image">
                    <img :src="companyInfo.wechat_qr_code || '../assets/images/qrcode.png'"
                      :alt="$t('contact.wechatQrCode')" @error="handleImageError">
                  </div>
                  <p>{{ $t('contact.scanQrCode') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：公司位置 -->
          <div class="company-location">
            <h3>{{ $t('contact.companyLocation') }}</h3>
            <div class="map-container">
              <img src="../assets/images/map.jpg" :alt="$t('contact.companyMap')" @error="handleImageError">
            </div>
          </div>
        </div>
      </div>

      <!-- Message Board 区域 -->
      <div class="message-board-section">
        <!-- 联系表单 -->
        <div class="contact-form-card">
          <div class="section-title">
            <h2>{{ $t('contact.messageBoard') }}</h2>
            <div class="title-underline"></div>
          </div>



          <div class="contact-form">
            <el-form ref="contactFormRef" :model="contactForm" :rules="contactRules" label-width="0px"
              @submit.prevent="submitForm">
              <div class="form-row">
                <div class="form-col">
                  <el-form-item prop="name">
                    <FormInput v-model="contactForm.name" :placeholder="getPlaceholderWithRequired('contact.name')"
                      :disabled="isLoggedIn" maxlength="50" show-word-limit />
                  </el-form-item>
                </div>
                <div class="form-col">
                  <el-form-item prop="email">
                    <FormInput v-model="contactForm.email" :placeholder="getPlaceholderWithRequired('contact.email')"
                      :disabled="isLoggedIn" maxlength="100" />
                  </el-form-item>
                </div>
              </div>
              <div class="form-row">
                <div class="form-col">
                  <el-form-item prop="phone">
                    <FormInput v-model="contactForm.phone" :placeholder="getPlaceholderWithRequired('contact.phone')"
                      :disabled="isLoggedIn" maxlength="20" />
                  </el-form-item>
                </div>
                <div class="form-col">
                  <el-form-item prop="captcha">
                    <div class="captcha-container">
                      <FormInput v-model="contactForm.captcha"
                        :placeholder="getPlaceholderWithRequired('contact.captcha')" class="captcha-input" />
                      <img :src="captchaUrl" @click="refreshCaptcha" class="captcha-img"
                        :alt="$t('contact.captcha.alt')" :title="$t('contact.captcha.refresh')" />
                    </div>
                  </el-form-item>
                </div>
              </div>
              <div class="form-row">
                <div class="form-col-full">
                  <el-form-item prop="subject">
                    <FormInput v-model="contactForm.subject"
                      :placeholder="getPlaceholderWithRequired('contact.subject')" maxlength="128" show-word-limit />
                  </el-form-item>
                </div>
              </div>
              <el-form-item prop="message">
                <FormInput v-model="contactForm.message" type="textarea" :rows="6"
                  :placeholder="getPlaceholderWithRequired('contact.message')" maxlength="2000" show-word-limit />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="submitForm" :loading="isSubmitting" class="submit-btn">
                  {{ isSubmitting ? $t('contact.submitting') : $t('contact.submit.message') }}
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { handleImageError } from '../utils/imageUtils'
import PageBanner from '@/components/common/PageBanner.vue'
import NavigationMenu from '@/components/common/NavigationMenu.vue'
import FormInput from '@/components/common/FormInput.vue'

export default {
  name: 'ContactPage',
  components: {
    PageBanner,
    NavigationMenu,
    FormInput
  },
  data() {
    return {
      companyInfo: {},
      isSubmitting: false,
      captchaUrl: '/api/users/captcha?' + Date.now(),
      contactForm: {
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        captcha: ''
      },
      contactRules: {
        name: [
          { required: true, message: this.$t('contact.name.required'), trigger: 'blur' },
          { max: 50, message: this.$t('contact.name.tooLong'), trigger: 'blur' }
        ],
        email: [
          { required: true, message: this.$t('contact.email.required'), trigger: 'blur' },
          { type: 'email', message: this.$t('contact.email.invalid'), trigger: 'blur' },
          { max: 100, message: this.$t('contact.email.tooLong'), trigger: 'blur' }
        ],
        phone: [
          { required: true, message: this.$t('contact.phone.required'), trigger: 'blur' },
          { pattern: /^[\d\s\-+()]+$/, message: this.$t('contact.phone.invalid'), trigger: 'blur' },
          { max: 20, message: this.$t('contact.phone.tooLong'), trigger: 'blur' }
        ],
        subject: [
          { required: true, message: this.$t('contact.subject.required'), trigger: 'blur' },
          { max: 128, message: this.$t('contact.subject.tooLong'), trigger: 'blur' }
        ],
        message: [
          { required: true, message: this.$t('contact.message.required'), trigger: 'blur' },
          { max: 2000, message: this.$t('contact.message.tooLong'), trigger: 'blur' }
        ],
        captcha: [
          { required: true, message: this.$t('contact.captcha.required'), trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    breadcrumbItems() {
      return [
        { text: this.$t('contact.page.title') }
      ];
    },
    isLoggedIn() {
      return this.$store.getters.isLoggedIn;
    },
    userInfo() {
      return this.$store.getters.user || {};
    }
  },
  watch: {
    isLoggedIn: {
      immediate: true,
      handler(newVal) {
        if (newVal && this.userInfo) {
          this.fillUserInfo();
        } else if (!newVal) {
          this.clearUserInfo();
        }
      }
    },
    userInfo: {
      immediate: true,
      handler(newVal) {
        if (this.isLoggedIn && newVal) {
          this.fillUserInfo();
        }
      }
    }
  },
  created() {
    this.fetchCompanyInfo();
    this.refreshCaptcha();
  },

  methods: {
    handleImageError,
    getPlaceholderWithRequired(key) {
      // 获取字段名（去掉contact.前缀）
      const fieldName = key.replace('contact.', '');
      // 检查该字段是否在验证规则中标记为必填
      const isRequired = this.contactRules[fieldName] && 
        this.contactRules[fieldName].some(rule => rule.required === true);
      
      const fieldText = this.$t(key);
      return isRequired ? `* ${fieldText}` : fieldText;
    },
    async fetchCompanyInfo() {
      try {
        const response = await this.$api.get('company')
        // response已经是标准格式，直接使用response.data
        this.companyInfo = response.data
      } catch (error) {
        // 错误已在api.js中统一处理
        console.error('Failed to fetch company info')
      }
    },
    fillUserInfo() {
      if (this.userInfo) {
        this.contactForm.name = this.userInfo.name || '';
        this.contactForm.email = this.userInfo.email || '';
        this.contactForm.phone = this.userInfo.phone || '';
      }
    },
    
    clearUserInfo() {
      this.contactForm.name = '';
      this.contactForm.email = '';
      this.contactForm.phone = '';
    },
    
    refreshCaptcha() {
      this.captchaUrl = '/api/users/captcha?' + Date.now();
      this.contactForm.captcha = ''; // 清空验证码输入框
    },
    
    async submitForm() {
      this.$refs.contactFormRef.validate(async (valid) => {
        if (valid) {
          this.isSubmitting = true;
          try {
            const submitData = {
              name: this.contactForm.name,
              email: this.contactForm.email,
              phone: this.contactForm.phone,
              subject: this.contactForm.subject,
              message: this.contactForm.message,
              captcha: this.contactForm.captcha
            };
            await this.$api.postWithErrorHandler('contact/messages', submitData);
            
            
            this.$messageHandler.showSuccess(
              this.$t('contact.success.messageSubmitted'), 
              'contact.success.messageSubmitted'
            );
            // 重置表单，但保留用户信息（如果已登录）
            this.contactForm.subject = '';
            this.contactForm.message = '';
            this.contactForm.captcha = '';
            this.refreshCaptcha(); // 重置后刷新验证码
            if (!this.isLoggedIn) {
              this.clearUserInfo();
            }
            this.$refs.contactFormRef.clearValidate();
          
          } catch (error) {
            // postWithErrorHandler 已经处理了错误显示，这里只需要处理一些特殊逻辑
            console.error('Submit contact form error:', error);
          } finally {
            this.isSubmitting = false;
          }
        } else {
          this.$messageHandler.showError(
            this.$t('contact.error.formIncomplete'), 
            'contact.error.formIncomplete'
          );
        }
      });
    },
    resetForm() {
      this.$refs.contactFormRef.resetFields()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';
@import '@/assets/styles/mixins';

.contact-page {
  min-height: 100vh;
  background: linear-gradient(135deg, $background-light 0%, $background-secondary 100%);
  padding: 0 0 $spacing-lg 0;
}

.container {
  @include container;
  padding: 0 $spacing-lg;
}

.contact-info-section {
  margin-bottom: $spacing-xl;

  .contact-info-main {
    @include flex-start;
    gap: $spacing-xl;
    align-items: flex-start;
  }
}

.company-details {
  flex: 1;
  max-width: 45%;
}

.company-location {
  flex: 1;
  max-width: 50%;
}

.message-board-section {
  width: 100%;
}

.contact-info-section,
.contact-form-card {
  @include card;
  margin-bottom: $spacing-lg;
  padding: $spacing-lg;
}

.section-title {
  text-align: center;
  margin-bottom: $spacing-md;

  h2 {
    color: $text-primary;
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    margin-bottom: $spacing-sm;
  }
}

.title-underline {
  width: $contact-title-underline-width;
  height: $contact-title-underline-height;
  background: linear-gradient(90deg, $primary-color, $secondary-color);
  margin: 0 auto;
  border-radius: $contact-title-underline-height;
}

// 公司信息样式
.company-info {
  margin-bottom: $spacing-lg;

  .info-item {
    @include flex-start;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
    padding: $spacing-sm;
    background: $background-light;
    border-radius: $border-radius-md;
    border-left: $border-width-lg solid $primary-color;
    transition: all $transition-base;

    &:hover {
      @include card-hover;
      transform: translateX($contact-transform-hover);
    }
  }
}

// 关注我们样式
.follow-us {
  h3 {
    color: $text-primary;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    margin-bottom: $spacing-sm;
  }

  .qrcode-container {
    @include flex-center;

    .qrcode-item {
      text-align: center;

      .qrcode-image {
        width: $contact-qrcode-width;
        height: $contact-qrcode-height;
        margin-bottom: $spacing-xs;

        img {
          width: 100%;
          height: 100%;
          border-radius: $border-radius-sm;
          box-shadow: $shadow-sm;
        }
      }

      p {
        color: $text-secondary;
        font-size: $font-size-sm;
        margin: 0;
      }
    }
  }
}

// 公司位置样式
.company-location {
  h3 {
    color: $text-primary;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    margin-bottom: $spacing-sm;
  }

  .map-container {
    width: 100%;
    height: $contact-map-height;
    border-radius: $border-radius-md;
    overflow: hidden;
    box-shadow: $shadow-sm;
    background: $background-light;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}

.info-icon {
  @include flex-center;
  width: $contact-info-icon-width;
  height: $contact-info-icon-height;
  background: linear-gradient(135deg, $primary-color, $secondary-color);
  border-radius: 50%;
  color: $white;
  font-size: $font-size-lg;
  flex-shrink: 0;
}

.info-content {
  flex: 1;

  h3 {
    color: $text-primary;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    margin-bottom: $spacing-xs;
  }

  p {
    color: $text-secondary;
    font-size: $font-size-sm;
    line-height: $line-height-normal;
    margin: 0;
  }
}

.contact-form {
  .form-row {
    display: flex;
    gap: $spacing-md;


    .form-col {
      flex: 1;
      min-width: 0;
    }

    .form-col-full {
      width: 100%;
    }
  }

  .el-form-item {
    margin-bottom: $spacing-md;
  }

  /* Captcha Container */
  .captcha-container {
    display: flex;
    gap: $spacing-sm;
    align-items: center;
    width: 100%;
    height: $contact-captcha-height;
    flex-wrap: nowrap;
  }

  .captcha-input {
    flex: 1;
    height: $contact-captcha-height;

    :deep(.el-input__inner) {
      height: $contact-captcha-height;
      line-height: $contact-captcha-height;
    }
  }

  .captcha-img {
    height: $contact-captcha-height;
    width: $contact-captcha-width;
    cursor: pointer;
    border-radius: $border-radius-sm;
    border: 1px solid $border-light;
    transition: all $transition-base;
    background-color: $white;
    object-fit: cover;
    flex-shrink: 0;
    display: block;
  }

  .captcha-img:hover {
    border-color: $primary-color;
    transform: scale(1.02);
  }

  .el-input__inner,
  .el-textarea__inner {
    &::placeholder {
      color: $text-secondary;
      font-weight: $font-weight-normal;
    }
  }

  // 必填字段placeholder样式 - 红色星号
  :deep(.el-input__inner::placeholder),
  :deep(.el-textarea__inner::placeholder) {
    color: $text-secondary;

    // 如果placeholder以*开头，将星号设为红色
    &[placeholder^="*"] {
      color: $text-secondary;
    }
  }

  // 为包含星号的placeholder添加特殊样式
  :deep(.el-input__inner),
  :deep(.el-textarea__inner) {
    &::placeholder {
      // 使用CSS来处理星号颜色
      background: linear-gradient(to right, #ef4444 0%, #ef4444 8px, $text-secondary 8px);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;

      // 回退方案
      @supports not (-webkit-background-clip: text) {
        color: $text-secondary;
      }
    }

    // 对于不以*开头的placeholder，使用正常颜色
    &[placeholder]:not([placeholder^="*"])::placeholder {
      background: none;
      -webkit-text-fill-color: $text-secondary;
      color: $text-secondary;
    }
  }

  .verification-code-input {
    flex: 1;
  }

  .get-code-btn {
    flex-shrink: 0;
    min-width: 100px;
    height: 40px;
    font-size: $font-size-sm;

    &:disabled {
      background-color: $background-secondary;
      color: $text-muted;
      border-color: $border-light;
      cursor: not-allowed;
    }
  }
}

:deep(.el-form) {
  .el-form-item {
    margin-bottom: $spacing-md;

    .el-form-item__label {
      color: $text-primary;
      font-weight: $font-weight-medium;
      font-size: $font-size-sm;
    }
  }


  .el-textarea {
    .el-textarea__inner {
      @include input-base;
      border: 1px solid $border-light;
      border-radius: $border-radius-sm;
      padding: $spacing-xs $spacing-sm;
      font-size: $font-size-sm;
      transition: all $transition-base;

      &:focus {
        border-color: $primary-color;
        box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
      }

      &::placeholder {
        color: $text-muted;
      }
    }
  }

  .el-button {
    @include button-primary;
    width: 100%;
    padding: $spacing-sm $spacing-lg;
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    border-radius: $border-radius-sm;
    margin-top: $spacing-sm;

    &:hover {
      transform: translateY(-1px);
      box-shadow: $shadow-md;
    }
  }
}


.login-actions {
  margin-top: $spacing-lg;
  display: flex;
  gap: $spacing-md;
  justify-content: center;
}



.submit-btn {
  width: 100%;
  height: $contact-form-button-height;
  font-size: $font-size-base;
  font-weight: 600;
  border-radius: $border-radius-md;
}


// 地图和二维码区域
.map-qr-section {
  @include flex-start;
  gap: $spacing-lg;
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: $border-width-sm solid $border-light;
}

.map-area {
  flex: 2;

  h3 {
    color: $text-primary;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    margin-bottom: $spacing-sm;
  }
}

.qr-area {
  flex: 1;

  h3 {
    color: $text-primary;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    margin-bottom: $spacing-sm;
  }
}

.map-container {
    width: 100%;
    height: $contact-map-mobile-height;
    border-radius: $border-radius-md;
    overflow: hidden;
    box-shadow: $shadow-sm;
    background: $background-light;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform $transition-base;

    &:hover {
      transform: scale(1.02);
    }
  }
}

.qrcode-container {
  @include flex-center;
}

.qrcode-item {
  @include flex-column;
  @include flex-center;
  text-align: center;

  .qrcode-image {
    width: 100px;
    height: 100px;
    margin-bottom: $spacing-sm;
    border-radius: $border-radius-md;
    overflow: hidden;
    box-shadow: $shadow-sm;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  p {
    color: $text-secondary;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    margin: 0;
  }
}



// 响应式设计
@include mobile {
  .contact-page {
    padding: $spacing-md 0;
  }

  .container {
    padding: 0 $spacing-sm;
    width: 100%;
  }

  .contact-info-main {
    flex-direction: column;
    gap: $spacing-lg;
  }

  .company-details,
  .company-location {
    max-width: 100%;
    flex: none;
  }

  .contact-info-section,
  .contact-form-card {
    margin-bottom: $spacing-lg;
    padding: $spacing-lg;
    border-radius: $border-radius-md;
  }

  .section-title {
    margin-bottom: $spacing-lg;

    h2 {
      font-size: $font-size-xl;
      margin-bottom: $spacing-md;
    }
  }

  .title-underline {
    width: 60px;
    height: 2px;
  }

  .company-info {
    margin-bottom: $spacing-xl;

    .info-item {
      padding: $spacing-lg;
      margin-bottom: $spacing-lg;
      border-radius: $border-radius-md;
      border-left-width: 3px;

      &:hover {
        transform: none;
        box-shadow: $shadow-lg;
      }

      .info-icon {
        width: $contact-info-icon-mobile-width;
        height: $contact-info-icon-mobile-height;
        font-size: $font-size-lg;
        flex-shrink: 0;
      }

      .info-content {
        h3 {
          font-size: $font-size-lg;
          margin-bottom: $spacing-sm;
          font-weight: $font-weight-semibold;
        }

        p {
          font-size: $font-size-base;
          line-height: $line-height-relaxed;
          word-break: break-word;
        }
      }
    }
  }

  .follow-us {
    text-align: center;

    h3 {
      font-size: $font-size-lg;
      margin-bottom: $spacing-lg;
    }

    .qrcode-container {
      justify-content: center;
    }

    .qrcode-item {
      .qrcode-image {
        width: $contact-qrcode-mobile-width;
        height: $contact-qrcode-mobile-height;
        margin: 0 auto $spacing-md;
      }

      p {
        font-size: $font-size-sm;
        color: $text-secondary;
      }
    }
  }

  .company-location {
    h3 {
      font-size: $font-size-lg;
      margin-bottom: $spacing-lg;
      text-align: center;
    }

    .map-container {
      height: $contact-map-mobile-height;
      border-radius: $border-radius-md;
    }
  }

  .contact-form {
    .form-row {
      flex-direction: column;
      gap: 0;
      margin-bottom: $spacing-sm;
    }

    .form-col {
      width: 100%;
      margin-bottom: $spacing-md;
    }

    .form-col-full {
      width: 100%;
      margin-bottom: $spacing-md;
    }

    .el-form-item {
      margin-bottom: $spacing-lg;
    }

    .captcha-container {
      flex-direction: row;
      gap: $spacing-md;
      align-items: stretch;
    }

    .captcha-input {
      flex: 1;
      min-width: 0;
    }

    .captcha-img {
      width: $contact-captcha-width;
      height: $contact-captcha-height;
      flex-shrink: 0;
    }

    .submit-btn {
      width: 100%;
      height: $contact-form-button-height;
      font-size: $font-size-lg;
      margin-top: $spacing-lg;
    }
  }


}

@include tablet {
  .contact-info-main {
    gap: $spacing-xl;
  }

  .company-details {
    max-width: 55%;
  }

  .company-location {
    max-width: 40%;
  }

  .contact-form {
    .form-row {
      gap: $spacing-lg;
    }
  }
}

// 小屏手机适配 (480px以下)
@media (max-width: 480px) {
  .contact-page {
    padding: $spacing-sm 0;
  }

  .container {
    padding: 0 $spacing-xs;
  }

  .contact-info-section,
  .contact-form-card {
    margin-bottom: $spacing-md;
    padding: $spacing-md;
    border-radius: $border-radius-sm;
  }

  .section-title {
    margin-bottom: $spacing-md;

    h2 {
      font-size: $font-size-lg;
      margin-bottom: $spacing-sm;
    }
  }

  .title-underline {
    width: 50px;
    height: 2px;
  }

  .company-info {
    margin-bottom: $spacing-lg;

    .info-item {
      padding: $spacing-md;
      margin-bottom: $spacing-md;
      border-radius: $border-radius-sm;

      .info-icon {
        width: 28px;
        height: 28px;
        font-size: $font-size-base;
      }

      .info-content {
        h3 {
          font-size: $font-size-base;
          margin-bottom: $spacing-xs;
        }

        p {
          font-size: $font-size-sm;
          line-height: $line-height-normal;
        }
      }
    }
  }

  .follow-us {
    h3 {
      font-size: $font-size-base;
      margin-bottom: $spacing-md;
    }

    .qrcode-item {
      .qrcode-image {
        width: $contact-qrcode-small-width;
        height: $contact-qrcode-small-height;
        margin-bottom: $spacing-sm;
      }

      p {
        font-size: $font-size-xs;
      }
    }
  }

  .company-location {
    h3 {
      font-size: $font-size-base;
      margin-bottom: $spacing-md;
    }

    .map-container {
      height: $contact-map-small-height;
      border-radius: $border-radius-sm;
    }
  }

  .contact-form {
    .el-form-item {
      margin-bottom: $spacing-md;
    }

    .captcha-container {
      flex-direction: column;
      gap: $spacing-sm;
    }

    .captcha-img {
      width: 100%;
      max-width: $contact-captcha-width;
      height: $contact-captcha-height;
      align-self: center;
    }

    .submit-btn {
      height: 44px;
      font-size: $font-size-base;
      margin-top: $spacing-md;
    }
  }


}

// 超小屏适配 (360px以下)
@media (max-width: 360px) {
  .container {
    padding: 0 $spacing-xs;
  }

  .contact-info-section,
  .contact-form-card {
    padding: $spacing-sm;
  }

  .section-title {
    h2 {
      font-size: $font-size-base;
    }
  }

  .company-info {
    .info-item {
      padding: $spacing-sm;
      gap: $spacing-xs;

      .info-icon {
        width: 24px;
        height: 24px;
        font-size: $font-size-sm;
      }

      .info-content {
        h3 {
          font-size: $font-size-sm;
        }

        p {
          font-size: $font-size-xs;
        }
      }
    }
  }

  .follow-us {
    .qrcode-item {
      .qrcode-image {
        width: 60px;
        height: 60px;
      }
    }
  }

  .company-location {
    .map-container {
      height: 100px;
    }
  }
}
</style>