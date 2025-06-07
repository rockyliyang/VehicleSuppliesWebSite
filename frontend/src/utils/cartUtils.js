export const addToCart = async (product, context, quantity = 1) => {
  const { store, router, api, $t, messageHandler, $bus } = context
  
  // 检查用户是否已登录
  if (!store.getters.isLoggedIn) {
    try {
      await messageHandler.confirm({
        message: $t ? $t('cart.loginRequired', '请先登录后再添加商品到购物车') : '请先登录后再添加商品到购物车',
        options : {
          confirmButtonText: $t ? $t('cart.goLogin', '去登录') : '去登录',
          cancelButtonText: $t ? $t('common.cancel', '取消') : '取消',
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
      messageHandler.showSuccess(
        $t ? $t('cart.addSuccess', '商品已添加到购物车') : '商品已添加到购物车'
      )
      
      // 触发购物车更新事件，让Header组件重新获取购物车数量
      if ($bus) {
        $bus.emit('cart-updated')
      }
    }
  } catch (error) {
    console.error('添加到购物车失败:', error)
    // postWithErrorHandler 会自动处理错误显示
  }
}