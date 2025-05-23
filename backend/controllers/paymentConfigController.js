/**
 * 获取支付配置信息
 * 从环境变量中读取支付相关的配置参数，提供给前端使用
 * 环境变量已在应用启动时通过config/env.js加载
 */
exports.getPaymentConfig = async (req, res) => {
  try {
    // 从环境变量中获取支付配置
    const paymentConfig = {
      success: true,
      message: '获取支付配置成功',
      data: {
        stripeConfig: {
          publicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_your_stripe_public_key',
          scriptUrl: process.env.STRIPE_SCRIPT_URL || 'https://js.stripe.com/v3/'
        },
        paypalConfig: {
          clientId: process.env.PAYPAL_CLIENT_ID || 'test',
          currency: process.env.PAYPAL_CURRENCY || 'USD',
          scriptUrl: process.env.PAYPAL_SCRIPT_URL || 'https://www.paypal.com/sdk/js',
          intent: process.env.PAYPAL_INTENT || 'capture',
          // 启用的资金来源列表
          enableFunding: process.env.PAYPAL_ENABLE_FUNDING || 'paylater,card',
          // 禁用的资金来源列表
          disableFunding: process.env.PAYPAL_DISABLE_FUNDING || '',
          // 组件列表
          components: process.env.PAYPAL_COMPONENTS || 'buttons,funding-eligibility',
          // 是否在沙盒环境中
          isSandbox: process.env.NODE_ENV !== 'production'
        }
      }
    };

    return res.status(200).json(paymentConfig);
  } catch (error) {
    console.error('获取支付配置失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取支付配置失败',
      error: error.message
    });
  }
};