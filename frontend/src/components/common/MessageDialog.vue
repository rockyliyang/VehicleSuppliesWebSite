<template>
  <el-dialog v-model="dialogVisible" :title="$t('productDetail.emailDialog.title')" width="800px" center @close="handleClose">
    <div class="email-dialog-content">
      <!-- 邮件表单 -->
      <el-form ref="emailFormRef" :model="emailForm" :rules="emailRules" label-width="0px">
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
        <el-form-item prop="message">
          <FormInput v-model="emailForm.message" type="textarea" :rows="6"
            :placeholder="getPlaceholderWithRequired('contact.message')" maxlength="2000" show-word-limit />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitEmailForm" :loading="isSubmittingEmail">
          {{ isSubmittingEmail ? $t('productDetail.emailDialog.sending') : $t('productDetail.emailDialog.send') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import FormInput from '@/components/common/FormInput.vue'

export default {
  name: 'MessageDialog',
  components: {
    FormInput
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
    dialogVisible: {
      get() {
        return this.visible
      },
      set(value) {
        this.$emit('update:visible', value)
      }
    },
    isLoggedIn() {
      return this.$store.getters.isLoggedIn || this.$store.state.isAdminLoggedIn
    },
    userInfo() {
      return this.$store.getters.user || {}
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
            
            this.$messageHandler.showSuccess(
              this.$t('productDetail.emailDialog.success'), 
              'productDetail.emailDialog.success'
            )
            
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
.email-dialog-content {
  .form-row {
    display: flex;
    gap: 16px;

    .form-col {
      flex: 1;
      min-width: 0;
    }

    .form-col-full {
      width: 100%;
    }
  }

  .captcha-container {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
  }

  .captcha-input {
    flex: 1;
  }

  .captcha-img {
    height: 40px;
    width: 120px;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
    transition: all 0.3s ease;
    background-color: #ffffff;
    object-fit: cover;
    flex-shrink: 0;
    display: block;
    
    &:hover {
      border-color: #409eff;
      transform: scale(1.02);
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

// 响应式设计
@media (max-width: 768px) {
  .email-dialog-content {
    .form-row {
      flex-direction: column;
      gap: 8px;
    }

    .captcha-container {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;

      .captcha-img {
        width: 100%;
        height: 60px;
      }
    }
  }
}
</style>