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
/* 统一的输入框样式 */
.form-input {
  width: 100%;
  border-radius: 8px;

  :deep(.el-input__wrapper) {
    width: 100% !important;
    height: 48px;
    border-radius: 8px;
    border: 2px solid #e1e8ed;
    background-color: #ffffff;
    transition: all 0.3s ease;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    padding: 0 16px;

    &:hover {
      border-color: #667eea;
    }

    &.is-focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }

  :deep(.el-input__inner) {
    width: 100% !important;
    height: 100%;
    border: none;
    border-radius: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 18px; /* 使用与Login.vue一致的大字体 */
    color: #2c3e50;
    padding: 0;
    background-color: transparent;
    transition: none;
    line-height: 48px;
    box-sizing: border-box;
    outline: none;
    text-align: left;

    &::placeholder {
      color: #bdc3c7;
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
      -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
      -webkit-text-fill-color: #2c3e50 !important;
      background-color: #ffffff !important;
      font-size: 18px !important; /* 强制保持18px字体大小 */
      transition: background-color 5000s ease-in-out 0s;
    }

    /* 处理Firefox自动填充样式 */
    &:-moz-autofill {
      background-color: #ffffff !important;
      color: #2c3e50 !important;
      font-size: 18px !important; /* 强制保持18px字体大小 */
    }

    /* 处理其他浏览器自动填充样式 */
    &:autofill {
      background-color: #ffffff !important;
      color: #2c3e50 !important;
      font-size: 18px !important; /* 强制保持18px字体大小 */
    }
  }

  :deep(.el-input__prefix) {
    position: relative;
    left: 0;
    margin-right: 12px;
    color: #7f8c8d;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    .el-icon {
      font-size: 18px;
    }
  }

  :deep(.el-input__suffix) {
    position: relative;
    right: 0;
    margin-left: 12px;
    color: #7f8c8d;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    .el-icon {
      font-size: 18px;
    }
  }

  /* 密码显示/隐藏按钮样式 */
  :deep(.el-input__password) {
    color: #7f8c8d;
    cursor: pointer;
    transition: color 0.3s ease;

    &:hover {
      color: #667eea;
    }
  }

  /* 清除按钮样式 */
  :deep(.el-input__clear) {
    color: #7f8c8d;
    cursor: pointer;
    transition: color 0.3s ease;

    &:hover {
      color: #667eea;
    }
  }

  /* 禁用状态 */
  :deep(.el-input.is-disabled) {
    .el-input__wrapper {
      background-color: #f5f7fa;
      border-color: #e4e7ed;
      color: #c0c4cc;
      cursor: not-allowed;
    }

    .el-input__inner {
      color: #c0c4cc;
      cursor: not-allowed;
    }
  }

  /* 只读状态 */
  :deep(.el-input.is-readonly) {
    .el-input__wrapper {
      background-color: #f8f9fa;
      border-color: #e1e8ed;
    }

    .el-input__inner {
      cursor: default;
    }
  }
}
</style>