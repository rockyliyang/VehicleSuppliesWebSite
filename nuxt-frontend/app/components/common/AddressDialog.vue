<template>
  <el-dialog v-model="visible" :width="isMobile ? '100%' : '600px'" :fullscreen="isMobile" :close-on-click-modal="false"
    @close="handleClose" class="address-dialog">
    <template #header>
      <div class="dialog-header">
        <el-icon class="dialog-icon">
          <Location />
        </el-icon>
        <span class="dialog-title">{{ isEdit ? $t('address.dialog.title.edit') : $t('address.dialog.title.add')
          }}</span>
      </div>
    </template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="0" class="address-form-content">
      <el-form-item prop="recipient_name">
        <FormInput v-model="form.recipient_name" :placeholder="$t('address.dialog.recipientNamePlaceholder')"
          :prefix-icon="User" clearable />
      </el-form-item>

      <!-- 国家选择 -->
      <el-form-item prop="country">
        <el-select v-model="form.country" :placeholder="$t('address.dialog.countryPlaceholder')" filterable clearable
          @change="handleCountryChange" class="country-select">
          <el-option v-for="country in countries" :key="country.iso3" :label="country.name" :value="country.name">
            <span class="country-option">
              <span class="country-name">{{ country.name }}</span>
            </span>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 省份/州选择 -->
      <el-form-item prop="state">
        <el-select v-if="currentStates.length > 0" v-model="form.state"
          :placeholder="$t('address.dialog.statePlaceholder')" filterable clearable @change="handleStateChange"
          class="state-select">
          <el-option v-for="state in currentStates" :key="state.id" :label="state.name" :value="state.name" />
        </el-select>
        <FormInput v-else v-model="form.state" :placeholder="$t('address.dialog.statePlaceholder')"
          :prefix-icon="Location" clearable />
      </el-form-item>

      <!-- 城市输入 -->
      <el-form-item prop="city">
        <FormInput v-model="form.city" :placeholder="$t('address.dialog.cityPlaceholder')" :prefix-icon="Location"
          clearable />
      </el-form-item>

      <!-- 电话号码（带国家区号） -->
      <el-form-item prop="phone">
        <div class="phone-input-group">
          <el-select v-model="form.phone_country_code" :placeholder="$t('address.dialog.countryCodePlaceholder')"
            filterable class="country-code-select">
            <el-option v-for="country in countries" :key="country.code" :label="`${country.phone_code}`"
              :value="country.phone_code">
              <span class="country-code-option">
                <span class="country-dial-code">{{ country.phone_code }}</span>
              </span>
            </el-option>
          </el-select>
          <FormInput v-model="form.phone" :placeholder="$t('address.dialog.phonePlaceholder')"
            :prefix-icon="PhoneFilled" clearable class="phone-number-input" />
        </div>
      </el-form-item>

      <el-form-item prop="address">
        <el-input v-model="form.address" type="textarea" :rows="3"
          :placeholder="$t('address.dialog.addressPlaceholder')" class="address-textarea" />
      </el-form-item>

      <el-form-item prop="postal_code">
        <FormInput v-model="form.postal_code" :placeholder="$t('address.dialog.postalCodePlaceholder')"
          :prefix-icon="Location" clearable />
      </el-form-item>

      <el-form-item prop="label">
        <FormInput v-model="form.label" :placeholder="$t('address.dialog.labelPlaceholder')"
          :prefix-icon="CollectionTag" clearable />
        <!-- 预设标签按钮 -->
        <div class="preset-labels">
          <el-button v-for="label in presetLabels" :key="label.key" size="small" type="primary" plain
            @click="selectPresetLabel(label.key)" class="preset-label-btn">
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
          <el-icon>
            <Close />
          </el-icon>
          {{ $t('address.dialog.cancel') }}
        </button>
        <button @click="submitForm" :disabled="loading" class="save-button">
          <el-icon v-if="loading">
            <Loading />
          </el-icon>
          <el-icon v-else>
            <Check />
          </el-icon>
          {{ loading ? $t('address.dialog.saving') : $t('address.dialog.save') }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { User, PhoneFilled, Location, CollectionTag, Close, Check, Loading, HomeFilled, OfficeBuilding, School } from '@element-plus/icons-vue'
import FormInput from '@/components/common/FormInput.vue'
// import { mapGetters } from 'vuex' // 移除vuex导入

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
    },
    countries: {
      type: Array,
      default: () => []
    },
    statesData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'success'],
  data() {
    return {
      form: {
        recipient_name: '',
        phone: '',
        phone_country_code: '',
        address: '',
        postal_code: '',
        country: '',
        state: '',
        city: '',
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
      ],
      // 移除本地的countries和statesData，改为使用store
    }
  },
  computed: {

    
    // 当前选择国家的省份列表
    currentStates() {
      if (!this.form.country || !this.statesData) return []
      // 先根据名字找到国家ID
      const country = this.countries.find(c => c.name === this.form.country)
      if (!country) return []
      return this.statesData[country.id] || []
    },
    // 当前选择的国家信息
    selectedCountry() {
      return this.countries.find(country => country.name === this.form.country)
    },
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
          { required: true, message: this.$t('address.dialog.validation.phoneRequired'), trigger: 'blur' }
        ],
        address: [
          { required: true, message: this.$t('address.dialog.validation.addressRequired'), trigger: 'blur' }
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
  mounted() {
    // 不需要在这里加载数据，因为父组件AddressList已经加载过了
    // 如果store中没有数据，会在需要时自动加载
  },
  methods: {
    // 初始化表单
    initForm() {
      if (this.addressData && this.addressData.id) {
        // 编辑模式
        Object.assign(this.form, {
          recipient_name: this.addressData.recipient_name || '',
          phone: this.addressData.phone || '',
          phone_country_code: this.addressData.phone_country_code || '',
          address: this.addressData.address || '',
          postal_code: this.addressData.postal_code || '',
          country: this.addressData.country || '',
          state: this.addressData.state || '',
          city: this.addressData.city || '',
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
        phone_country_code: '',
        address: '',
        postal_code: '',
        country: '',
        state: '',
        city: '',
        label: '',
        is_default: false
      }
      if (this.$refs.formRef) {
        this.$refs.formRef.clearValidate()
      }
    },

    // 处理国家选择变化
      handleCountryChange(countryName) {
        const country = this.countries.find(c => c.name === countryName)
        if (country) {
          // 自动设置电话区号
          this.form.phone_country_code = country.phone_code
          // 清空省份和城市选择
          this.form.state = ''
          this.form.city = ''
        }
      },

    // 处理省份选择变化
    handleStateChange() {
      // 清空城市选择
      this.form.city = ''
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
          phone_country_code: this.form.phone_country_code,
          address: this.form.address,
          postal_code: this.form.postal_code,
          country: this.form.country,
          state: this.form.state,
          city: this.form.city,
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
@use '@/assets/styles/_variables.scss' as *;
@use '@/assets/styles/_mixins.scss' as *;

/* Address Dialog */
.address-dialog {
  :deep(.el-dialog) {
    margin-top: 15vh !important;
  }

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

  // 国家选择器样式
  .country-select {
    width: 100%;

    :deep(.el-select__wrapper) {
      height: 48px;
      border-radius: $border-radius-md;
      border: 1px solid $border-light;
      transition: all 0.3s ease;

      &:hover {
        border-color: $primary-color;
      }

      &.is-focused {
        border-color: $primary-color;
        box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
      }
    }
  }

  .country-option {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    .country-flag {
      font-size: $font-size-lg;
    }

    .country-name {
      flex: 1;
      font-size: $font-size-md;
    }
  }

  // 省份选择器样式
  .state-select {
    width: 100%;

    :deep(.el-select__wrapper) {
      height: 48px;
      border-radius: $border-radius-md;
      border: 1px solid $border-light;
      transition: all 0.3s ease;

      &:hover {
        border-color: $primary-color;
      }

      &.is-focused {
        border-color: $primary-color;
        box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
      }
    }
  }

  // 电话输入组样式
  .phone-input-group {
    display: flex;
    gap: $spacing-sm;
    width: 100%;

    .country-code-select {
      flex: 0 0 140px;

      :deep(.el-select__wrapper) {
        height: 48px;
        border-radius: $border-radius-md;
        border: 1px solid $border-light;
        transition: all 0.3s ease;

        &:hover {
          border-color: $primary-color;
        }

        &.is-focused {
          border-color: $primary-color;
          box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
        }
      }
    }

    .phone-number-input {
      flex: 1;
    }
  }

  .country-code-option {
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    .country-flag {
      font-size: $font-size-md;
    }

    .country-dial-code {
      font-weight: $font-weight-medium;
      color: $primary-color;
    }

    .country-name-short {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-left: auto;
    }
  }

  // 预设标签样式
  .preset-labels {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-top: $spacing-sm;
    justify-content: flex-start;

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

  .cancel-button,
  .save-button {
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
    flex-direction: column;
    gap: $spacing-sm;
    justify-content: center;

    .save-button,
    .cancel-button {
      width: 100%;
      min-width: auto;
      height: 48px;
      font-size: $font-size-md;
      font-weight: $font-weight-semibold;
      border-radius: $border-radius-lg;
    }
  }
}

// 对话框标题样式
.dialog-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .dialog-icon {
    color: $primary-color;
    font-size: $font-size-lg;
  }

  .dialog-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;
  }
}

// 全局对话框样式优化
:deep(.el-dialog) {
  @include mobile {
    .el-dialog__header {
      .el-dialog__headerbtn {
        display: none !important; // 隐藏关闭按钮
      }
    }
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .address-dialog {
    :deep(.el-dialog__header) {
      padding: $spacing-sm $spacing-md;
    }

    .dialog-header {
      .dialog-title {
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
      font-size: $font-size-lg;
    }

    :deep(.el-input__inner) {
      font-size: $font-size-lg !important;
      height: 40px !important;
      box-shadow: none !important;
    }

    .address-textarea {
      :deep(.el-textarea__inner) {
        font-size: $font-size-lg !important;
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