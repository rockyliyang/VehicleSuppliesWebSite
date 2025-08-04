<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? $t('address.dialog.title.edit') : $t('address.dialog.title.add')"
    :width="isMobile ? '100%' : '600px'"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    @close="handleClose"
    class="address-dialog"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="0"
      class="address-form-content"
    >
      <el-form-item prop="recipient_name">
        <FormInput
          v-model="form.recipient_name"
          :placeholder="$t('address.dialog.recipientNamePlaceholder')"
          :prefix-icon="User"
          clearable
        />
      </el-form-item>
      
      <el-form-item prop="phone">
        <FormInput
          v-model="form.phone"
          :placeholder="$t('address.dialog.phonePlaceholder')"
          :prefix-icon="PhoneFilled"
          clearable
        />
      </el-form-item>
      
      <el-form-item prop="address">
        <el-input
          v-model="form.address"
          type="textarea"
          :rows="3"
          :placeholder="$t('address.dialog.addressPlaceholder')"
          class="address-textarea"
        />
      </el-form-item>
      
      <el-form-item prop="postal_code">
        <FormInput
          v-model="form.postal_code"
          :placeholder="$t('address.dialog.postalCodePlaceholder')"
          :prefix-icon="Location"
          clearable
        />
      </el-form-item>
      
      <el-form-item prop="label">
        <FormInput
          v-model="form.label"
          :placeholder="$t('address.dialog.labelPlaceholder')"
          :prefix-icon="CollectionTag"
          clearable
        />
        <!-- 预设标签按钮 -->
        <div class="preset-labels">
          <el-button
            v-for="label in presetLabels"
            :key="label.key"
            size="small"
            type="primary"
            plain
            @click="selectPresetLabel(label.key)"
            class="preset-label-btn"
          >
            <el-icon>
              <component :is="label.icon" />
            </el-icon>
            {{ $t(label.key) }}
          </el-button>
        </div>
      </el-form-item>
      
      <el-form-item class="checkbox-form-item">
        <el-checkbox v-model="form.is_default" class="default-checkbox">
          {{ $t('address.dialog.isDefault') }}
        </el-checkbox>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <button @click="handleClose" class="cancel-button">
          <el-icon><Close /></el-icon>
          {{ $t('address.dialog.cancel') }}
        </button>
        <button @click="submitForm" :disabled="loading" class="save-button">
          <el-icon v-if="loading"><Loading /></el-icon>
          <el-icon v-else><Check /></el-icon>
          {{ loading ? $t('address.dialog.saving') : $t('address.dialog.save') }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { User, PhoneFilled, Location, CollectionTag, Close, Check, Loading, HomeFilled, OfficeBuilding, School } from '@element-plus/icons-vue'
import FormInput from '@/components/common/FormInput.vue'

export default {
  name: 'AddressDialog',
  components: {
    FormInput,
    User,
    PhoneFilled,
    Location,
    CollectionTag,
    Close,
    Check,
    Loading,
    HomeFilled,
    OfficeBuilding,
    School
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    addressData: {
      type: Object,
      default: null
    }
  },
  emits: ['update:modelValue', 'success'],
  data() {
    return {
      form: {
        recipient_name: '',
        phone: '',
        address: '',
        postal_code: '',
        label: '',
        is_default: false
      },
      loading: false,
      // 预设标签
      presetLabels: [
        { key: 'address.dialog.home', icon: 'HomeFilled' },
        { key: 'address.dialog.company', icon: 'OfficeBuilding' },
        { key: 'address.dialog.school', icon: 'School' },
        { key: 'address.dialog.other', icon: 'CollectionTag' }
      ]
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
    isEdit() {
      return this.addressData && this.addressData.id
    },
    isMobile() {
      return window.innerWidth <= 768
    },
    rules() {
      return {
        recipient_name: [
          { required: true, message: this.$t('address.dialog.validation.recipientNameRequired'), trigger: 'blur' }
        ],
        phone: [
          { required: true, message: this.$t('address.dialog.validation.phoneRequired'), trigger: 'blur' },
          { 
            pattern: /^1[3-9]\d{9}$/, 
            message: this.$t('address.dialog.validation.phoneInvalid'), 
            trigger: 'blur' 
          }
        ],
        address: [
          { required: true, message: this.$t('address.dialog.validation.addressRequired'), trigger: 'blur' }
        ],
        postal_code: [
          { required: true, message: this.$t('address.dialog.validation.postalCodeRequired'), trigger: 'blur' },
          { 
            pattern: /^\d{6}$/, 
            message: this.$t('address.dialog.validation.postalCodeInvalid'), 
            trigger: 'blur' 
          }
        ]
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.initForm()
      } else {
        this.resetForm()
      }
    },
    addressData: {
      handler() {
        if (this.visible) {
          this.initForm()
        }
      },
      deep: true
    }
  },
  methods: {
    // 初始化表单
    initForm() {
      if (this.addressData && this.addressData.id) {
        // 编辑模式
        Object.assign(this.form, {
          recipient_name: this.addressData.recipient_name || '',
          phone: this.addressData.phone || '',
          address: this.addressData.address || '',
          postal_code: this.addressData.postal_code || '',
          label: this.addressData.label || '',
          is_default: this.addressData.is_default || false
        })
      } else {
        // 新增模式
        this.resetForm()
      }
    },
    
    // 重置表单
    resetForm() {
      this.form = {
        recipient_name: '',
        phone: '',
        address: '',
        postal_code: '',
        label: '',
        is_default: false
      }
      if (this.$refs.formRef) {
        this.$refs.formRef.clearValidate()
      }
    },
    
    // 提交表单
    async submitForm() {
      try {
        const valid = await this.$refs.formRef.validate()
        if (!valid) return
        
        this.loading = true
        
        const requestData = {
          recipient_name: this.form.recipient_name,
          phone: this.form.phone,
          address: this.form.address,
          postal_code: this.form.postal_code,
          label: this.form.label,
          is_default: this.form.is_default
        }
        
        if (this.isEdit) {
          await this.$api.putWithErrorHandler(`/addresses/${this.addressData.id}`, requestData, {
            fallbackKey: 'address.dialog.messages.updateFailed'
          })
          this.$message.success(this.$t('address.dialog.messages.updateSuccess'))
        } else {
          await this.$api.postWithErrorHandler('/addresses', requestData, {
            fallbackKey: 'address.dialog.messages.addFailed'
          })
          this.$message.success(this.$t('address.dialog.messages.addSuccess'))
        }
        
        this.$emit('success')
        this.handleClose()
      } catch (error) {
        console.error('Failed to submit form:', error)
      } finally {
        this.loading = false
      }
    },
    
    // 选择预设标签
    selectPresetLabel(labelKey) {
      this.form.label = this.$t(labelKey)
    },
    
    // 关闭对话框
    handleClose() {
      this.visible = false
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

/* Address Dialog */
.address-dialog {
  :deep(.el-dialog__header) {
    padding: $spacing-xl $spacing-xl $spacing-lg $spacing-xl;
    border-bottom: 1px solid #f0f0f0;
    
    .el-dialog__title {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      color: $text-primary;
    }
  }
  
  :deep(.el-dialog__body) {
    padding: $spacing-xl;
  }
  
  :deep(.el-dialog__footer) {
    padding: $spacing-lg $spacing-xl $spacing-xl $spacing-xl;
    border-top: 1px solid #f0f0f0;
  }
}

/* Address Form Content */
.address-form-content {
  max-width: 100%;
  
  :deep(.el-form-item) {
    margin-bottom: $spacing-lg;
    display: flex;
    align-items: center;
  }
  
  :deep(.el-form-item__content) {
    display: flex;
    justify-content: center;
    max-width: 100%;
    width: 100%;
  }
  
  // 地址文本域样式
  .address-textarea {
    width: 100%;
    
    :deep(.el-textarea__inner) {
      border-radius: $border-radius-md;
      border: 1px solid $border-light;
      background-color: #ffffff;
      transition: all 0.3s ease;
      font-family: inherit;
      font-size: $font-size-md;
      color: $text-primary;
      padding: $spacing-md;
      resize: vertical;
      min-height: 80px;
      
      &::placeholder {
        color: $text-muted;
      }
      
      &:hover {
        border-color: $primary-color;
      }
      
      &:focus {
        border-color: $primary-color;
        box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
        outline: none;
      }
    }
  }
  
  // 预设标签样式
  .preset-labels {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-top: $spacing-sm;
    
    .preset-label-btn {
      border-radius: 20px;
      font-size: $font-size-sm;
      padding: $spacing-xs $spacing-sm;
      height: 32px;
      
      .el-icon {
        margin-right: 4px;
        font-size: $font-size-sm;
      }
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba($primary-color, 0.3);
      }
    }
  }
  
  // 复选框样式
  .checkbox-form-item {
    @include flex-between;
    margin-bottom: $spacing-lg;
    
    :deep(.el-form-item__content) {
      justify-content: flex-start;
    }
  }
  
  .default-checkbox {
    line-height: $line-height-relaxed;
    font-size: $font-size-lg !important;
    color: $text-secondary;
    
    :deep(.el-checkbox__label) {
      font-size: $font-size-lg !important;
      color: $text-primary;
      font-weight: $font-weight-medium;
    }
  }
}



/* Dialog Footer */
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: $spacing-md;
  
  .cancel-button, .save-button {
    @include flex-center;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-lg;
    border-radius: $border-radius-lg;
    font-size: $font-size-md;
    font-weight: $font-weight-semibold;
    transition: $transition-base;
    cursor: pointer;
    border: none;
    min-width: 100px;
    height: 40px;
    
    .el-icon {
      font-size: $font-size-lg;
    }
  }
  
  .cancel-button {
    background: $gray-100;
    color: $text-secondary;
    
    &:hover {
      background: $gray-200;
      color: $text-primary;
      transform: translateY(-1px);
    }
  }
  
  .save-button {
    @include button-primary;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba($primary-color, 0.3);
    }
    
    &:disabled {
      background: $gray-400;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }
}

/* 移动端样式调整 */
@include mobile {
  .address-dialog {
    :deep(.el-dialog) {
      margin: 0;
      width: 100vw !important;
      height: 100vh !important;
      max-height: 100vh !important;
      border-radius: 0;
      display: flex;
      flex-direction: column;
    }
    
    :deep(.el-dialog__header) {
      padding: $spacing-md $spacing-lg;
      flex-shrink: 0;
      
      .el-dialog__title {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
      }
    }
    
    :deep(.el-dialog__body) {
      padding: $spacing-lg;
      flex: 1;
      overflow-y: auto;
    }
    
    :deep(.el-dialog__footer) {
      padding: $spacing-md $spacing-lg $spacing-lg $spacing-lg;
      flex-shrink: 0;
      position: sticky;
      bottom: 0;
      background: white;
      border-top: 1px solid $border-light;
    }
  }
  
  .address-form-content {
    :deep(.el-form-item) {
      margin-bottom: $spacing-lg;
    }
    
    :deep(.el-form-item__label) {
      font-size: $font-size-md;
      color: $text-primary;
      font-weight: $font-weight-medium;
    }
    
    :deep(.el-input__inner) {
      font-size: $font-size-md !important;
      border-radius: $border-radius-md !important;
      padding: $spacing-sm $spacing-md !important;
      height: 44px !important;
      box-shadow: none !important;
    }
    
    .address-textarea {
      :deep(.el-textarea__inner) {
        font-size: $font-size-md !important;
        padding: $spacing-md !important;
        min-height: 100px !important;
        box-shadow: none !important;
      }
    }
    
    .preset-labels {
      gap: $spacing-sm;
      
      .preset-label-btn {
        font-size: $font-size-sm;
        height: 36px;
        padding: $spacing-sm $spacing-md;
      }
    }
    
    .default-checkbox {
      font-size: $font-size-md !important;
      
      :deep(.el-checkbox__label) {
        font-size: $font-size-md !important;
      }
    }
  }
  
  .dialog-footer {
    justify-content: center;
    
    .cancel-button {
      display: none; // 隐藏取消按钮
    }
    
    .save-button {
      width: 100%;
      min-width: auto;
      height: 48px;
      font-size: $font-size-md;
      font-weight: $font-weight-semibold;
      border-radius: $border-radius-lg;
    }
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .address-dialog {
    :deep(.el-dialog__header) {
      padding: $spacing-sm $spacing-md;
      
      .el-dialog__title {
        font-size: $font-size-md;
      }
    }
    
    :deep(.el-dialog__body) {
      padding: $spacing-md;
    }
    
    :deep(.el-dialog__footer) {
      padding: $spacing-sm $spacing-md $spacing-md $spacing-md;
    }
  }
  
  .address-form-content {
    :deep(.el-form-item) {
      margin-bottom: $spacing-md;
    }
    
    :deep(.el-form-item__label) {
      font-size: $font-size-sm;
    }
    
    :deep(.el-input__inner) {
      font-size: $font-size-sm !important;
      height: 40px !important;
      box-shadow: none !important;
    }
    
    .address-textarea {
      :deep(.el-textarea__inner) {
        font-size: $font-size-sm !important;
        padding: $spacing-sm !important;
        min-height: 80px !important;
        box-shadow: none !important;
      }
    }
    
    .preset-labels {
      .preset-label-btn {
        font-size: $font-size-xs;
        height: 32px;
        padding: $spacing-xs $spacing-sm;
      }
    }
    
    .default-checkbox {
      font-size: $font-size-sm !important;
      
      :deep(.el-checkbox__label) {
        font-size: $font-size-sm !important;
      }
    }
  }
  
  .dialog-footer {
    .save-button {
      height: 44px;
      font-size: $font-size-sm;
    }
  }
}
</style>