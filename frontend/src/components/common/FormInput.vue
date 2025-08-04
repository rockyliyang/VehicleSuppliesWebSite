<template>
  <el-input :model-value="modelValue" :type="type" :placeholder="placeholder" :disabled="disabled" :readonly="readonly"
    :clearable="clearable" :show-password="computedShowPassword" :maxlength="maxlength" :minlength="minlength" :size="size"
    :autocomplete="autocomplete" :name="randomName" :class="['form-input', inputClass]" @input="handleInput" @change="handleChange" @focus="handleFocus"
    @blur="handleBlur" @clear="handleClear" @keyup.enter="handleEnter">
    <template #prefix v-if="computedPrefixIcon">
      <el-icon>
        <component :is="computedPrefixIcon" />
      </el-icon>
    </template>
    <template #suffix v-if="computedSuffixIcon">
      <el-icon>
        <component :is="computedSuffixIcon" />
      </el-icon>
    </template>
    <template #prepend v-if="$slots.prepend">
      <slot name="prepend"></slot>
    </template>
    <template #append v-if="$slots.append">
      <slot name="append"></slot>
    </template>
  </el-input>
</template>

<script>
export default {
  name: 'FormInput',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    placeholder: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'large'
    },
    showPassword: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    maxlength: {
      type: [String, Number],
      default: undefined
    },
    minlength: {
      type: [String, Number],
      default: undefined
    },
    clearable: {
      type: Boolean,
      default: false
    },
    prefixIcon: {
      type: [String, Object],
      default: null
    },
    suffixIcon: {
      type: [String, Object],
      default: null
    },
    inputClass: {
      type: String,
      default: ''
    },
    // 支持kebab-case属性名
    'prefix-icon': {
      type: [String, Object],
      default: null
    },
    'suffix-icon': {
      type: [String, Object],
      default: null
    },
    'show-password': {
      type: Boolean,
      default: false
    },
    autocomplete: {
      type: String,
      default: 'on'
    }
  },
  emits: ['update:modelValue', 'input', 'change', 'blur', 'focus', 'enter'],
  computed: {
    inputValue: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    },
    // 兼容camelCase和kebab-case属性名
    computedPrefixIcon() {
      return this['prefix-icon'] || this.prefixIcon;
    },
    computedSuffixIcon() {
      return this['suffix-icon'] || this.suffixIcon;
    },
    computedShowPassword() {
      return this['show-password'] || this.showPassword;
    },
    randomName() {
      // 生成随机name属性，防止浏览器自动填充
      return 'field_' + Math.random().toString(36).substr(2, 9);
    }
  },
  methods: {
    handleInput(value) {
      this.$emit('update:modelValue', value);
      this.$emit('input', value);
    },
    handleChange(value) {
      this.$emit('change', value);
    },
    handleFocus(event) {
      this.$emit('focus', event);
    },
    handleBlur(event) {
      this.$emit('blur', event);
    },
    handleClear() {
      this.$emit('update:modelValue', '');
      this.$emit('clear');
    },
    handleEnter(event) {
      this.$emit('enter', event);
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

/* 统一的输入框样式 */
.form-input {
  width: 100%;
  border-radius: $border-radius-md;

  :deep(.el-input__wrapper) {
    width: 100% !important;
    height: 48px; /* 使用固定高度，保持与原设计一致 */
    border-radius: $border-radius-md;
    border: $border-width-sm solid $border-light;
    background-color: $white;
    transition: $transition-base;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    padding: 0 $spacing-md;

    &:hover {
      border-color: $primary-color;
    }

    &.is-focus {
      border-color: $primary-color;
      box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
    }
  }

  :deep(.el-input__inner) {
    width: 100% !important;
    height: 100%;
    border: none;
    border-radius: 0;
    font-family: $font-family-base;
    font-size: $font-size-lg; /* 使用项目标准字体大小 */
    color: $text-primary;
    padding: 0;
    background-color: transparent;
    transition: none;
    line-height: 48px; /* 与wrapper高度保持一致 */
    box-sizing: border-box;
    outline: none;
    text-align: left;

    &::placeholder {
      color: $text-muted;
    }

    &:focus {
      border: none;
      box-shadow: none;
      background-color: transparent;
    }

    /* 处理浏览器自动填充样式 - 解决蓝色背景问题和字体大小问题 */
    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus,
    &:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 1000px $white inset !important;
      -webkit-text-fill-color: $text-primary !important;
      background-color: $white !important;
      font-size: $font-size-lg !important; /* 强制保持字体大小 */
      transition: background-color 5000s ease-in-out 0s;
    }

    /* 处理Firefox自动填充样式 */
    &:-moz-autofill {
      background-color: $white !important;
      color: $text-primary !important;
      font-size: $font-size-lg !important; /* 强制保持字体大小 */
    }

    /* 处理其他浏览器自动填充样式 */
    &:autofill {
      background-color: $white !important;
      color: $text-primary !important;
      font-size: $font-size-lg !important; /* 强制保持字体大小 */
    }
  }

  :deep(.el-input__prefix) {
    position: relative;
    left: 0;
    margin-right: $spacing-sm;
    color: $text-muted;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    .el-icon {
      font-size: $font-size-lg;
    }
  }

  :deep(.el-input__suffix) {
    position: relative;
    right: 0;
    margin-left: $spacing-sm;
    color: $text-muted;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    .el-icon {
      font-size: $font-size-lg;
    }
  }

  /* 密码显示/隐藏按钮样式 */
  :deep(.el-input__password) {
    color: $text-muted;
    cursor: pointer;
    transition: $transition-base;

    &:hover {
      color: $primary-color;
    }
  }

  /* 清除按钮样式 */
  :deep(.el-input__clear) {
    color: $text-muted;
    cursor: pointer;
    transition: $transition-base;

    &:hover {
      color: $primary-color;
    }
  }

  /* 禁用状态 */
  :deep(.el-input.is-disabled) {
    .el-input__wrapper {
      background-color: $gray-100;
      border-color: $gray-300;
      color: $text-disabled;
      cursor: not-allowed;
    }

    .el-input__inner {
      color: $text-disabled;
      cursor: not-allowed;
    }
  }

  /* 只读状态 */
  :deep(.el-input.is-readonly) {
    .el-input__wrapper {
      background-color: $background-light;
      border-color: $border-light;
    }

    .el-input__inner {
      cursor: default;
    }
  }
}

/* 移动端适配 */
@media (max-width: 767px) {
  .form-input {
    :deep(.el-input__wrapper) {
      height: 52px; /* 增加触摸区域 */
      padding: 0 16px;
    }

    :deep(.el-input__inner) {
      font-size: 16px; /* 防止iOS缩放 */
      line-height: 52px;
    }

    :deep(.el-input__prefix) {
      margin-right: 10px;
      
      .el-icon {
        font-size: 20px;
      }
    }

    :deep(.el-input__suffix) {
      margin-left: 10px;
      
      .el-icon {
        font-size: 20px;
      }
    }
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .form-input {
    :deep(.el-input__wrapper) {
      height: 48px;
      padding: 0 14px;
    }

    :deep(.el-input__inner) {
      font-size: 16px;
      line-height: 48px;
    }

    :deep(.el-input__prefix) {
      margin-right: 8px;
      
      .el-icon {
        font-size: 18px;
      }
    }

    :deep(.el-input__suffix) {
      margin-left: 8px;
      
      .el-icon {
        font-size: 18px;
      }
    }
  }
}
</style>