# Vue 2 到 Vue 3 升级指南

## 概述

本文档提供了将本项目从 Vue 2 升级到 Vue 3 的详细步骤和注意事项。Vue 3 带来了许多新特性和性能改进，但也有一些破坏性变更需要注意。

## 升级步骤

### 1. 更新依赖

首先需要更新 `package.json` 中的依赖：

```json
{
  "dependencies": {
    "axios": "^1.6.7",
    "core-js": "^3.36.0",
    "element-plus": "^2.5.6", // 替换 element-ui
    "swiper": "^11.0.5",
    "vue": "^3.4.19", // 升级到 Vue 3
    "vue-router": "^4.2.5", // 升级到 Vue Router 4
    "vuex": "^4.1.0" // 升级到 Vuex 4 (或考虑使用 Pinia)
  },
  "devDependencies": {
    "@vue/cli-plugin-babel": "~5.0.8",
    "@vue/cli-plugin-eslint": "~5.0.8",
    "@vue/cli-plugin-router": "~5.0.8",
    "@vue/cli-plugin-vuex": "~5.0.8",
    "@vue/cli-service": "~5.0.8",
    "@vue/compiler-sfc": "^3.4.19", // 替换 vue-template-compiler
    "eslint": "^8.57.0",
    "eslint-plugin-vue": "^9.22.0",
    "sass": "^1.71.1",
    "sass-loader": "^14.1.1"
  }
}
```

执行以下命令更新依赖：

```bash
npm install
```

### 2. 更新入口文件 (main.js)

Vue 3 中应用实例的创建方式发生了变化：

```js
// 旧版 (Vue 2)
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(ElementUI)
Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

// 新版 (Vue 3)
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/css/global.css'

const app = createApp(App)

app.use(router)
app.use(store)
app.use(ElementPlus)
app.mount('#app')
```

### 3. 更新路由 (router/index.js)

Vue Router 4 的配置方式有所变化：

```js
// 旧版 (Vue Router 3)
import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  // 路由配置...
]

const router = new VueRouter({
  routes
})

export default router

// 新版 (Vue Router 4)
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  // 路由配置保持不变...
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
```

### 4. 更新状态管理 (store/index.js)

Vuex 4 的配置方式也有所变化：

```js
// 旧版 (Vuex 3)
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  // 状态配置...
})

// 新版 (Vuex 4)
import { createStore } from 'vuex'

export default createStore({
  // 状态配置保持不变...
})
```

### 5. 组件语法更新

#### 5.1 模板语法变更

- `v-model` 用法变更：
  - Vue 2: `v-model="value"`
  - Vue 3: `v-model="value"` (默认属性从 `value` 变为 `modelValue`，事件从 `input` 变为 `update:modelValue`)

- 插槽语法：
  - Vue 2: `<template slot="name">` 或 `<template slot-scope="scope">`
  - Vue 3: `<template v-slot:name>` 或 `<template #name="scope">`

#### 5.2 生命周期钩子变更

- `beforeDestroy` → `beforeUnmount`
- `destroyed` → `unmounted`

#### 5.3 Element UI 升级到 Element Plus

- 组件前缀从 `el-` 保持不变，但导入方式和配置有变化
- 图标类名变更，从 `el-icon-xxx` 变为使用 `@element-plus/icons-vue` 包中的组件

### 6. 其他重要变更

- 移除了 `Vue.prototype` 设置全局属性的方式，改为使用 `app.config.globalProperties`
- 移除了过滤器 (filters)，建议使用计算属性或方法代替
- 移除了 `$listeners`
- 事件 API 变更：`$on`, `$off` 和 `$once` 方法已被移除，建议使用外部库如 mitt
- 多根节点组件：Vue 3 支持多个根节点的组件模板

## 迁移策略

建议采用渐进式迁移策略：

1. 先更新基础架构 (Vue, Vue Router, Vuex, Element Plus)
2. 修改入口文件和主要配置
3. 逐个更新组件，优先处理共享组件
4. 全面测试确保功能正常

## 常见问题

### 渲染函数变更

Vue 3 中的渲染函数不再接收 `h` 作为参数，需要显式导入：

```js
// Vue 2
export default {
  render(h) {
    return h('div')
  }
}

// Vue 3
import { h } from 'vue'
export default {
  render() {
    return h('div')
  }
}
```

### 全局 API 变更

Vue 3 中的许多全局 API 都被移动到了应用实例上：

```js
// Vue 2
Vue.component('my-component', { /* ... */ })

// Vue 3
const app = createApp(App)
app.component('my-component', { /* ... */ })
```

## 参考资源

- [Vue 3 官方文档](https://v3.cn.vuejs.org/)
- [Vue 3 迁移指南](https://v3.cn.vuejs.org/guide/migration/introduction.html)
- [Element Plus 文档](https://element-plus.org/zh-CN/)
- [Vue Router 4 文档](https://router.vuejs.org/zh/)
- [Vuex 4 文档](https://vuex.vuejs.org/zh/)