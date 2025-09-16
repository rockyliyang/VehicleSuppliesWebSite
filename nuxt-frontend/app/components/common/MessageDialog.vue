<template>
  <el-dialog v-model="dialogVisible" :width="isMobile ? '100%' : '600px'" :fullscreen="isMobile"
    :close-on-click-modal="false" center @close="handleClose">
    <template #header>
      <div class="dialog-header">
        <el-icon style="margin-right: 8px;">
          <Message />
        </el-icon>
        <span>{{ $t('productDetail.emailDialog.title') }}</span>
      </div>
    </template>
    <div class="email-dialog-content">
      <!-- 邮件表单 -->
      <el-form ref="emailFormRef" :model="emailForm" :rules="emailRules" label-width="0px" class="email-form">
        <div class="form-row">
          <div class="form-col">
            <el-form-item prop="name">
              <FormInput v-model="emailForm.name" :placeholder="getPlaceholderWithRequired('contact.name')"
                :disabled="isLoggedIn" maxlength="50" show-word-limit />
            </el-form-item>
          </div>
          <div class="form-col">
            <el-form-item prop="email">
              <FormInput v-model="emailForm.email" :placeholder="getPlaceholderWithRequired('contact.email')"
                :disabled="isLoggedIn" maxlength="100" />
            </el-form-item>
          </div>
        </div>
        <div class="form-row">
          <div class="form-col">
            <el-form-item prop="phone">
              <FormInput v-model="emailForm.phone" :placeholder="getPlaceholderWithRequired('contact.phone')"
                :disabled="isLoggedIn" maxlength="20" />
            </el-form-item>
          </div>
          <div class="form-col">
            <el-form-item prop="captcha">
              <div class="captcha-container">
                <FormInput v-model="emailForm.captcha" :placeholder="getPlaceholderWithRequired('contact.captcha')"
                  class="captcha-input" />
                <img :src="captchaUrl" @click="refreshCaptcha" class="captcha-img" :alt="$t('contact.captcha.alt')"
                  :title="$t('contact.captcha.refresh')" />
              </div>
            </el-form-item>
          </div>
        </div>
        <div class="form-row">
          <div class="form-col-full">
            <el-form-item prop="subject">
              <FormInput v-model="emailForm.subject" :placeholder="getPlaceholderWithRequired('contact.subject')"
                maxlength="128" show-word-limit />
            </el-form-item>
          </div>
        </div>
        <el-form-item prop="message" class="message-form-item">
          <el-input v-model="emailForm.message" type="textarea" :rows="6"
            :placeholder="getPlaceholderWithRequired('contact.message')" maxlength="2000" show-word-limit />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <span class="dialog-footer">

        <el-button type="primary" @click="submitEmailForm" :loading="isSubmittingEmail">
          <el-icon style="margin-right: 8px;">
            <Message />
          </el-icon>
          {{ isSubmittingEmail ? $t('productDetail.emailDialog.sending') : $t('productDetail.emailDialog.send') }}
        </el-button>
        <el-button @click="handleClose">{{ $t('common.cancel') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import FormInput from '@/components/common/FormInput.vue'
import { Message } from '@element-plus/icons-vue'

export default {
  name: 'MessageDialog',
  components: {
    FormInput,
    Message
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    product: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:visible', 'email-sent'],
  data() {
    return {
      isSubmittingEmail: false,
      captchaUrl: '/api/users/captcha?' + Date.now(),
      emailForm: {
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        captcha: ''
      },
      emailRules: {
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
          { required: false, message: this.$t('contact.phone.required'), trigger: 'blur' },
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
    dialogVisible: {
      get() {
        return this.visible
      },
      set(value) {
        this.$emit('update:visible', value)
      }
    },
    isMobile() {
      if (process.client)
        return window.innerWidth <= 768
      return false;
    },
    isLoggedIn() {
      return this.$store.auth.isLoggedIn || this.$store.auth.isAdminLoggedIn
    },
    userInfo() {
      return this.$store.auth.user || {}
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.initializeDialog()
      }
    }
  },
  methods: {
    initializeDialog() {
      // 填充用户信息（如果已登录）
      if (this.isLoggedIn) {
        this.fillEmailUserInfo()
      } else {
        this.clearEmailUserInfo()
      }
      
      // 设置默认主题
      this.emailForm.subject = this.$t('productDetail.emailDialog.title')
      
      // 设置默认消息内容
      this.emailForm.message = ''
      
      this.refreshCaptcha()
    },
    fillEmailUserInfo() {
      if (this.userInfo && Object.keys(this.userInfo).length > 0) {
        this.emailForm.name = this.userInfo.username || ''
        this.emailForm.email = this.userInfo.email || ''
        this.emailForm.phone = this.userInfo.phone || ''
      }
    },
    clearEmailUserInfo() {
      this.emailForm.name = ''
      this.emailForm.email = ''
      this.emailForm.phone = ''
    },
    getPlaceholderWithRequired(key) {
      // 获取字段名（去掉contact.前缀）
      const fieldName = key.replace('contact.', '')
      // 检查该字段是否在验证规则中标记为必填
      const isRequired = this.emailRules[fieldName] && 
        this.emailRules[fieldName].some(rule => rule.required === true)
      
      const fieldText = this.$t(key)
      return isRequired ? `* ${fieldText}` : fieldText
    },
    refreshCaptcha() {
      this.captchaUrl = '/api/users/captcha?' + Date.now()
      this.emailForm.captcha = '' // 清空验证码输入框
    },
    async submitEmailForm() {
      this.$refs.emailFormRef.validate(async (valid) => {
        if (valid) {
          this.isSubmittingEmail = true
          try {
            const submitData = {
              name: this.emailForm.name,
              email: this.emailForm.email,
              phone: this.emailForm.phone,
              subject: this.emailForm.subject,
              message: this.emailForm.message,
              captcha: this.emailForm.captcha,
              // 添加产品相关信息
              productId: this.product.id,
              productName: this.product.name,
              productPrice: this.product.price
            }
            
            await this.$api.postWithErrorHandler('contact/messages', submitData)
            
            //this.$messageHandler.showSuccess(
              //this.$t('productDetail.emailDialog.success'), 
              //'productDetail.emailDialog.success'
            //)
            
            // 重置表单，但保留用户信息（如果已登录）
            this.emailForm.subject = ''
            this.emailForm.message = ''
            this.emailForm.captcha = ''
            this.refreshCaptcha() // 重置后刷新验证码
            if (!this.isLoggedIn) {
              this.clearEmailUserInfo()
            }
            this.$refs.emailFormRef.clearValidate()
            this.$emit('email-sent')
            this.handleClose()
          
          } catch (error) {
            // postWithErrorHandler 已经处理了错误显示，这里只需要处理一些特殊逻辑
            console.error('Submit email form error:', error)
            this.$messageHandler.showError(
              this.$t('productDetail.emailDialog.failed'), 
              'productDetail.emailDialog.failed'
            )
          } finally {
            this.isSubmittingEmail = false
          }
        } else {
          this.$messageHandler.showError(
            this.$t('contact.error.formIncomplete'), 
            'contact.error.formIncomplete'
          )
        }
      })
    },
    handleClose() {
      this.dialogVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
@use '~/assets/styles/_variables.scss' as *;
@use '~/assets/styles/_mixins.scss' as *;

.email-dialog-content {
  @include mobile {
    padding: 0;
    margin: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .email-form {
    @include mobile {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
  }

  .message-form-item {
    @include mobile {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-bottom: $spacing-sm !important;

      :deep(.el-form-item__content) {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      :deep(.el-textarea) {
        flex: 1;
        display: flex;
        flex-direction: column;

        .el-textarea__inner {
          flex: 1;
          min-height: 150px !important;
          max-height: calc(100vh - 300px) !important;
          resize: none;
        }
      }
    }
  }

  .form-row {
    display: flex;
    gap: $spacing-lg;

    .form-col {
      flex: 1;
      min-width: 0;
    }

    .form-col-full {
      width: 100%;
    }

    @include mobile {
      @include flex-column;
      gap: $spacing-sm;
      margin-bottom: $spacing-sm;
    }

    @include tablet {
      gap: $spacing-md;
    }
  }

  .captcha-container {
    @include flex-center;
    gap: $spacing-md;
    width: 100%;

    @include mobile {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: $spacing-sm;
    }
  }

  .captcha-input {
    flex: 1;

    @include mobile {
      width: 100%;
    }
  }

  .captcha-img {
    height: $contact-captcha-height;
    width: $contact-captcha-width;
    cursor: pointer;
    border-radius: $border-radius-md;
    border: 1px solid $border-color;
    transition: $transition-base;
    background-color: $white;
    object-fit: cover;
    flex-shrink: 0;
    display: block;

    &:hover {
      border-color: $primary-color;
      transform: scale(1.02);
    }

    @include mobile {
      width: 120px;
      height: 48px; // 与输入框高度保持一致
      flex-shrink: 0;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-start;
  gap: $spacing-md;

  @include mobile {
    flex-direction: column;
    gap: $spacing-md;
    position: sticky;
    bottom: 0;
    background: white;
    padding-top: $spacing-sm;
    margin-top: auto;

    .el-button {
      width: 100%;
      margin: 0;
    }
  }
}

// 对话框头部样式
.dialog-header {
  display: flex;
  align-items: center;
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  color: $text-primary;
}

// 全局对话框样式优化
:deep(.el-dialog) {
  z-index: 10001 !important;

  @include mobile {
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    top: 0 !important;
    left: 0 !important;
    transform: none !important;
    position: fixed !important;
    border-radius: 0 !important;

    .el-dialog__header {
      padding: $spacing-md $spacing-md $spacing-sm;

      .el-dialog__title {
        font-size: $font-size-base;
        font-weight: $font-weight-semibold;
      }

      .el-dialog__headerbtn {
        display: none !important; // 隐藏关闭按钮
      }
    }

    .el-dialog__body {
      padding: 0 $spacing-md;
      max-height: calc(100vh - 120px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      display: flex;
      flex-direction: column;
    }

    .el-dialog__footer {
      padding: $spacing-sm $spacing-md $spacing-md;
      margin-top: auto;
      flex-shrink: 0;
      position: sticky;
      bottom: 0;
      background: white;
      border-top: 1px solid $border-color;
    }
  }

  @include tablet {
    width: 85% !important;
    max-width: 600px;
  }
}

// 移动端对话框遮罩层优化
:deep(.el-overlay) {
  @include mobile {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 10000;
  }
}

// 表单元素样式优化
:deep(.el-form-item) {
  margin-bottom: $spacing-lg;

  @include mobile {
    margin-bottom: $spacing-md;
  }

  .el-form-item__label {
    font-weight: $font-weight-medium;
    color: $text-primary;
    line-height: $line-height-normal;

    @include mobile {
      font-size: $font-size-sm;
      line-height: $line-height-tight;
      margin-bottom: $spacing-xs;
    }
  }

  .el-form-item__content {
    line-height: $line-height-normal;
  }
}

:deep(.el-input) {
  .el-input__wrapper {
    border-radius: $border-radius-md;
    border: 1px solid $border-color;
    transition: $transition-base;

    @include mobile {
      min-height: 32px;
    }

    &:hover {
      border-color: $primary-light;
    }

    &.is-focus {
      border-color: $primary-color;
      box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
    }
  }

  .el-input__inner {
    font-size: $font-size-base;
    color: $text-primary;

    @include mobile {
      font-size: $font-size-sm;
      height: 32px;
      line-height: 32px;
    }

    &::placeholder {
      color: $text-muted;
    }
  }
}

:deep(.el-textarea) {
  .el-textarea__inner {
    border-radius: $border-radius-md;
    border: 1px solid $border-color;
    font-size: $font-size-base;
    color: $text-primary;
    transition: $transition-base;
    resize: vertical;
    min-height: 120px;

    @include mobile {
      font-size: $font-size-sm;
      min-height: 80px;
      line-height: $line-height-normal;
    }

    &:hover {
      border-color: $primary-light;
    }

    &:focus {
      border-color: $primary-color;
      box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
    }

    &::placeholder {
      color: $text-muted;
    }
  }
}

// 按钮样式优化
:deep(.el-button) {
  border-radius: $border-radius-md;
  font-weight: $font-weight-medium;
  transition: $transition-base;

  @include mobile {
    height: 42px;
    font-size: $font-size-sm;
    padding: 0 $spacing-lg;
    min-width: 80px;

    &.el-button--primary {
      font-weight: $font-weight-semibold;
    }

    &.el-button--default {
      border-color: $border-color;
      color: $text-secondary;

      &:hover {
        border-color: $primary-color;
        color: $primary-color;
      }
    }
  }

  @include tablet {
    height: 40px;
  }
}

// 对话框底部按钮区域优化
:deep(.el-dialog__footer) {
  @include mobile {
    display: flex;
    gap: $spacing-sm;
    justify-content: flex-end;

    .el-button {
      flex: 0 0 auto;
    }
  }
}
</style>