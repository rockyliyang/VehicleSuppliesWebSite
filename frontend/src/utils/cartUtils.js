/**
 * 购物车相关工具函数
 */

/**
 * 添加商品到购物车
 * @param {Object} product - 要添加的商品对象
 * @param {Object} store - Vuex store实例
 * @param {Object} router - Vue Router实例
 * @param {Object} message - Element UI消息组件
 * @param {Object} api - API请求实例
 * @param {Number} quantity - 添加的数量，默认为1
 * @returns {Promise<void>}
 */
export async function addToCart(product, { router, message, api }, quantity = 1) {
  // 检查用户是否登录
  if (!localStorage.getItem('user_token')) {
    try {
      await message.confirm('请先登录后再添加商品到购物车', '提示', {
        confirmButtonText: '去登录',
        cancelButtonText: '取消',
        type: 'warning'
      });
      router.push(`/login?redirect=/product/${product.id}`);
    } catch (err) {
      // 用户取消登录
    }
    return;
  }
  
  try {
    // 调用API添加到购物车
    const response = await api.postWithErrorHandler('/cart/add', {
      productId: product.id,
      quantity: quantity
    });
    
    if (response.success) {
      message.success('商品已添加到购物车');
    }
  } catch (error) {
    console.error('添加到购物车失败:', error);
    message.error(error.response?.data?.message || '添加到购物车失败');
  }
}