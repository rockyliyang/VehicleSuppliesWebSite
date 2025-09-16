# Store Plugin 使用指南

## 概述

新的 Store Plugin 提供了一个统一的接口来访问核心的 Pinia stores，简化了在组件中使用多个 store 的复杂性。目前主要封装了认证、公司信息和地理位置相关的 store。

## 基本用法

### 在组件中使用

```vue
<template>
  <div>
    <!-- 显示用户信息 -->
    <div v-if="$store.auth.isLoggedIn">
      欢迎，{{ $store.auth.user.name }}！
    </div>
    
    <!-- 显示公司信息 -->
    <div>{{ $store.company.info.name }}</div>
    
    <!-- 显示国家信息 -->
    <div>{{ $store.location.getCountryName('US') }}</div>
  </div>
</template>

<script>
export default {
  async mounted() {
    // 初始化所有store
    await this.$store.initAll()
  },
  
  methods: {
    // 登录
    handleLogin(user) {
      this.$store.auth.setUser(user)
    },
    
    // 获取国家列表
    async loadCountries() {
      await this.$store.location.fetchCountries()
    }
  }
}
</script>
```

### 在 Composition API 中使用

```vue
<script setup>
const { $store } = useNuxtApp()

// 响应式数据
const isLoggedIn = computed(() => $store.auth.isLoggedIn)
const countries = computed(() => $store.location.countries)

// 方法
const login = (user) => {
  $store.auth.setUser(user)
}

const loadCountries = async () => {
  await $store.location.fetchCountries()
}

// 初始化
onMounted(async () => {
  await $store.initAll()
})
</script>
```

## API 参考

### 认证相关 (`$store.auth`)

- `isLoggedIn`: 是否已登录
- `user`: 当前用户信息
- `setUser(user)`: 设置用户信息
- `logout()`: 登出
- `checkAuth()`: 检查认证状态

### 公司信息相关 (`$store.company`)

- `info`: 公司信息
- `categories`: 商品分类
- `banners`: 轮播图数据
- `fetchInfo()`: 获取公司信息
- `fetchCategories()`: 获取商品分类
- `fetchBanners()`: 获取轮播图
- `init()`: 初始化公司数据

### 地理位置相关 (`$store.location`)

- `countries`: 国家列表
- `statesData`: 省份数据
- `isLoading`: 是否正在加载
- `isLoaded`: 是否已加载
- `getStatesByCountry(countryCode)`: 根据国家代码获取省份
- `getCountryByCode(countryCode)`: 根据代码获取国家信息
- `getCountryName(countryCode)`: 根据代码获取国家名称
- `fetchCountries()`: 获取国家列表
- `fetchStates(countryId)`: 获取省份列表
- `init()`: 初始化地理数据

### 全局方法

- `initAll()`: 初始化所有store
- `getRawStores()`: 获取原始store实例（高级用法）

## 迁移指南

### 从直接使用store迁移

**之前:**
```javascript
import { useMainStore } from '~/stores'
import { useCompanyStore } from '~/stores/companyInfo'
import { useCountryStateStore } from '~/stores/countryState'

const mainStore = useMainStore()
const companyStore = useCompanyStore()
const countryStateStore = useCountryStateStore()

// 使用
if (mainStore.isLoggedIn) {
  // ...
}
companyStore.fetchCompanyInfo()
countryStateStore.fetchCountries()
```

**现在:**
```javascript
const { $store } = useNuxtApp()

// 使用
if ($store.auth.isLoggedIn) {
  // ...
}
$store.company.fetchInfo()
$store.location.fetchCountries()
```

## 优势

1. **统一接口**: 所有store通过一个统一的接口访问
2. **简化导入**: 不需要在每个组件中导入多个store
3. **类型安全**: 提供清晰的API结构
4. **易于维护**: 集中管理store的使用方式
5. **向后兼容**: 仍可通过`getRawStores()`访问原始store实例

## 注意事项

1. 插件支持前后端使用，在 SSR 和客户端都可以正常工作
2. 建议在应用启动时调用`$store.initAll()`进行初始化
3. 如需使用购物车、对话框或多语言功能，请直接使用对应的原始 store