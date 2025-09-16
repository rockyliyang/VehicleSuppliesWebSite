import { defineNuxtPlugin } from '#app'
// 按需导入常用图标，避免全量导入导致性能问题
import {
  Search,
  Edit,
  Delete,
  Plus,
  Close,
  ArrowRight,
  ArrowLeft,
  Star,
  StarFilled,
  ShoppingCart,
  User,
  Setting,
  Menu,
  Phone,
  Message,
  Location,
  View,
  Hide,
  Check,
  Warning,
  InfoFilled,
  SuccessFilled,
  CircleClose
} from '@element-plus/icons-vue'

export default defineNuxtPlugin((nuxtApp) => {
  // 只注册项目中实际使用的图标
  const icons = {
    Search,
    Edit,
    Delete,
    Plus,
    Close,
    ArrowRight,
    ArrowLeft,
    Star,
    StarFilled,
    ShoppingCart,
    User,
    Setting,
    Menu,
    Phone,
    Message,
    Location,
    View,
    Hide,
    Check,
    Warning,
    InfoFilled,
    SuccessFilled,
    CircleClose
  }
  
  // 注册选定的图标
  for (const [key, component] of Object.entries(icons)) {
    nuxtApp.vueApp.component(key, component)
  }
})