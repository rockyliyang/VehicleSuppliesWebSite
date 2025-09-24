import { ref } from 'vue'

// 全局状态管理
const isLoaded = ref(false)
const isLoading = ref(false)

/**
 * Material Icons 按需加载 composable
 * 只有在实际使用 Material Icons 的组件中调用时才会加载字体和样式
 */
export function useMaterialIcons() {
  const loadMaterialIcons = async () => {
    // 如果已经加载或正在加载，直接返回
    if (isLoaded.value || isLoading.value) {
      return Promise.resolve()
    }

    isLoading.value = true

    try {
      // 检查是否已经有 Material Icons 的 link 标签
      const existingLink = document.querySelector('link[href*="material-icons"]')
      if (existingLink) {
        isLoaded.value = true
        isLoading.value = false
        return Promise.resolve()
      }

      // 创建并加载 Material Icons CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = '/css/material-icons.css'
      
      return new Promise((resolve, reject) => {
        link.onload = () => {
          isLoaded.value = true
          isLoading.value = false
          resolve()
        }
        
        link.onerror = () => {
          isLoading.value = false
          reject(new Error('Failed to load Material Icons CSS'))
        }
        
        document.head.appendChild(link)
      })
    } catch (error) {
      isLoading.value = false
      throw error
    }
  }

  return {
    isLoaded,
    isLoading,
    loadMaterialIcons
  }
}