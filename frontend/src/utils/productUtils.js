/**
 * 产品操作相关的公共工具函数
 */

/**
 * 获取产品价格范围中的最小数量
 * @param {Object} product - 产品对象
 * @returns {number} 最小数量，默认为1
 */
export function getMinQuantityFromPriceRanges(product) {
  if (!product || !product.price_ranges || !Array.isArray(product.price_ranges) || product.price_ranges.length === 0) {
    return 1;
  }
  
  // 按最小数量排序，取第一个（最小的）
  const sortedRanges = [...product.price_ranges].sort((a, b) => a.min_quantity - b.min_quantity);
  return sortedRanges[0].min_quantity || 1;
}

/**
 * 创建询价单或打开现有询价单
 * @param {Object} product - 产品对象
 * @param {Object} context - Vue组件上下文对象，包含 $api, $messageHandler, $t 等
 * @returns {Promise<Object>} 返回询价单信息
 */
export async function createOrOpenInquiry(product, context) {
  try {
    // 第一步：查找是否存在只包含当前商品的询价单
    const findResponse = await context.$api.postWithErrorHandler(`/inquiries/product/${product.id}`, {
        inquiryType: 'single'
      },{
      fallbackKey: 'product.error.findInquiryFailed'
    });
    
    console.log(context.$t('product.log.findInquiryResponse') || '查询现有询价单响应:', findResponse.data);
    
    if (findResponse.success && findResponse.data && findResponse.data.inquiry) {
      // 找到现有询价单，直接使用
      const existingInquiry = findResponse.data.inquiry;
      const existingItems = findResponse.data.items || [];
      
      //context.$messageHandler.showSuccess(
        //context.$t('product.success.inquiryOpened') || 'Existing inquiry opened',
        //'product.success.inquiryOpened'
      //);
      
      return {
        inquiryId: existingInquiry.id,
        isNew: false,
        inquiry: existingInquiry,
        items: existingItems
      };
    } else {
      // 没有找到现有询价单，创建新的
      const titlePrefix = context.$t('cart.inquiryTitlePrefix') || 'Inquiry';
      const createInquiryResponse = await context.$api.postWithErrorHandler('/inquiries', {
        titlePrefix: titlePrefix,
        inquiryType: 'single'
      }, {
        fallbackKey: 'product.error.createInquiryFailed'
      });
      
      const inquiryId = createInquiryResponse.data.id;
      
      // 添加商品到询价单（不传递单价，由管理员后续设置）
      const minQuantity = getMinQuantityFromPriceRanges(product);
      await context.$api.postWithErrorHandler(`/inquiries/${inquiryId}/items`, {
        productId: product.id,
        quantity: minQuantity
      }, {
        fallbackKey: 'product.error.addItemToInquiryFailed'
      });
      
      // 刷新询价单详情
      //const inquiryResponse = await context.$api.getWithErrorHandler(`/inquiries/${inquiryId}`, {
      //  fallbackKey: 'product.error.refreshInquiryFailed'
     // });
      
      //context.$messageHandler.showSuccess(
        //context.$t('product.success.inquiryCreated') || 'Inquiry created successfully',
        //'product.success.inquiryCreated'
      //);
      
      return {
        inquiryId: inquiryId,
        isNew: true,
        //inquiry: createInquiryResponse.data,
        //items: inquiryResponse.data.items || []
      };
    }
  } catch (error) {
    console.error(context.$t('product.log.createInquiryFailed') || '创建询价单失败:', error);
    context.$messageHandler.showError(error, 'product.error.createInquiryFailed');
    throw error;
  }
}

/**
 * 加载询价单消息
 * @param {string} inquiryId - 询价单ID
 * @param {Object} context - Vue组件上下文对象
 * @returns {Promise<Array>} 返回消息列表
 */
export async function loadInquiryMessages(inquiryId, context) {
  try {
    const response = await context.$api.getWithErrorHandler(`/inquiries/${inquiryId}`, {
      fallbackKey: 'product.error.loadInquiryMessagesFailed'
    });
    if (response && response.data) {
      return {
        status: response.data.inquiry.status || 'inquiried'
      };
    }
    return { status: 'inquiried' };
  } catch (error) {
    console.error(context.$t('product.log.loadInquiryMessagesFailed') || '加载询价消息失败:', error);
    return {  status: 'inquiried' };
  }
}

/**
 * 处理Chat Now功能 - 检查登录状态并创建询价
 * @param {Object} product - 产品对象
 * @param {Object} context - Vue组件上下文对象
 * @param {Function} showLoginDialog - 显示登录对话框的回调函数
 * @param {Function} showInquiryDialog - 显示询价对话框的回调函数
 * @returns {Promise<boolean>} 返回是否成功处理
 */
export async function handleChatNow(product, context, showLoginDialog, showInquiryDialog) {
  // 检查用户是否已登录
  if (!context.$store.getters.isLoggedIn) {
    // 显示登录对话框
    showLoginDialog('inquiry');
    return false;
  }
  
  try {
    const result = await createOrOpenInquiry(product, context);
    console.log('createOrOpenInquiry result:', result);
    // 显示询价对话框
    showInquiryDialog({
      inquiryId: result.inquiryId,
    });
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 处理Add To Cart功能 - 检查登录状态并添加到购物车
 * @param {Object} product - 产品对象
 * @param {Object} context - Vue组件上下文对象
 * @param {Function} showLoginDialog - 显示登录对话框的回调函数
 * @param {Function} setAddingState - 设置添加状态的回调函数
 * @param {number} quantity - 添加数量，默认为1
 * @returns {Promise<boolean>} 返回是否成功添加
 */
export async function handleAddToCart(product, context, showLoginDialog, setAddingState, quantity = 1) {
  // 检查用户是否已登录
  if (!context.$store.getters.isLoggedIn) {
    // 显示登录对话框
    showLoginDialog('addToCart');
    return false;
  }
  
  if (setAddingState) setAddingState(true);
  
  try {
    // 使用现有的购物车工具函数
    const { handleAddToCart: cartHandleAddToCart } = await import('./cartUtils');
    
    await cartHandleAddToCart(product, {
      store: context.$store,
      router: context.$router,
      api: context.$api,
      messageHandler: context.$messageHandler,
      $bus: context.$bus
    }, quantity);
    
    return true;
  } catch (error) {
    console.error(context.$t('product.log.addToCartFailed') || '添加到购物车失败:', error);
    return false;
  } finally {
    if (setAddingState) setAddingState(false);
  }
}

/**
 * 处理登录成功后的待执行操作
 * @param {string} pendingAction - 待执行的操作类型
 * @param {Object} product - 产品对象
 * @param {Object} context - Vue组件上下文对象
 * @param {Function} showInquiryDialog - 显示询价对话框的回调函数
 * @param {Function} setAddingState - 设置添加状态的回调函数
 * @param {Object} additionalCallbacks - 其他回调函数对象
 * @returns {Promise<void>}
 */
export async function handleLoginSuccess(pendingAction, product, context, showInquiryDialog, setAddingState, additionalCallbacks = {}) {
  switch (pendingAction) {
    case 'inquiry':
      await handleChatNow(product, context, () => {}, showInquiryDialog);
      break;
    case 'addToCart':
      await handleAddToCart(product, context, () => {}, setAddingState);
      break;
    case 'email':
      if (additionalCallbacks.openEmailDialog) {
        additionalCallbacks.openEmailDialog();
      }
      break;
    case 'buyNow':
      if (additionalCallbacks.openBuyNowDialog) {
        additionalCallbacks.openBuyNowDialog();
      }
      break;
    case 'favorite':
      if (additionalCallbacks.toggleFavorite) {
        additionalCallbacks.toggleFavorite();
      }
      break;
    default:
      console.log(context.$t('product.log.unknownPendingAction') || '未知的待执行操作:', pendingAction);
  }
}

/**
 * 添加浏览历史
 * @param {Object} product - 产品对象
 * @param {Object} context - Vue组件上下文对象
 * @returns {Promise<void>}
 */
export async function addBrowsingHistory(product, context) {
  if (!context.$store.getters.isLoggedIn || !product.id) return;
  
  try {
    await context.$api.postWithErrorHandler('user-products', {
      product_id: product.id,
      type: 'viewed'
    }, {
      fallbackKey: 'product.error.addBrowsingHistoryFailed',
      showError: false // 浏览历史失败不影响用户体验，不显示错误消息
    });
  } catch (error) {
    console.error(context.$t('product.log.addBrowsingHistoryFailed') || '添加浏览历史失败:', error);
    // 浏览历史失败不影响用户体验，不显示错误消息
  }
}

/**
 * 检查收藏状态
 * @param {Object} product - 产品对象
 * @param {Object} context - Vue组件上下文对象
 * @returns {Promise<boolean>} 返回是否已收藏
 */
export async function checkFavoriteStatus(product, context) {
  if (!context.$store.getters.isLoggedIn || !product.id) return false;
  
  try {
    const response = await context.$api.getWithErrorHandler(`user-products/check/${product.id}`, {
      params: { type: 'favorite' },
      fallbackKey: 'product.error.checkFavoriteStatusFailed',
      showError: false // 检查收藏状态失败不显示错误消息
    });
    return response.data.exists;
  } catch (error) {
    console.error(context.$t('product.log.checkFavoriteStatusFailed') || '检查收藏状态失败:', error);
    return false;
  }
}