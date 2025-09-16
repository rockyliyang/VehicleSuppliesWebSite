// 处理添加到购物车的逻辑
export async function handleAddToCart(product, context, quantity = 1) {
  const { router, api, messageHandler, $bus, isLoggedIn } = context
  
  // 直接使用language store的translate功能
  const { useLanguageStore } = await import('../stores/language.js')
  const languageStore = useLanguageStore()
  const translate = languageStore.translate
  
  // 检查用户是否已登录
  const userLoggedIn = isLoggedIn || false
  if (!userLoggedIn) {
    try {
      await messageHandler.confirm({
        message: translate('cart.loginRequired', 'Please login first to add items to cart'),
        options : {
          confirmButtonText: translate('cart.goLogin', 'Go to Login'),
          cancelButtonText: translate('common.cancel', 'Cancel'),
          type: 'warning'
        }
      }
      )
      router.push(`/login?redirect=/product/${product.id}`);
    } catch {
      // 用户取消登录
    }
    return
  }

  try {
    // 调用后端API添加到购物车
    const response = await api.postWithErrorHandler('/cart/add', {
      productId: product.id,
      quantity: quantity
    }, {
      fallbackKey: 'cart.error.addFailed'
    })
    
    if (response.success) {
      // 使用messageHandler显示成功消息
      //messageHandler.showSuccess(
        //translate('cart.addSuccess', 'Item added to cart successfully')
      //)
      
      // 触发购物车更新事件，让Header组件重新获取购物车数量
      if ($bus) {
        $bus.emit('cart-updated')
      }
    }
  } catch (error) {
    console.error('Failed to add item to cart:', error)
    // postWithErrorHandler 会自动处理错误显示
  }
}