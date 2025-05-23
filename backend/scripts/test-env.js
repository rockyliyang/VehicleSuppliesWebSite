/**
 * 环境变量测试脚本
 * 用于验证不同环境下的配置加载是否正常
 */

// 加载环境变量配置
const env = require('../config/env');

console.log('===== 环境变量测试 =====');
console.log(`当前环境: ${process.env.NODE_ENV || 'development'}`);
console.log(`是否开发环境: ${env.isDevelopment}`);
console.log(`是否生产环境: ${env.isProduction}`);
console.log('\n===== 数据库配置 =====');
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_USER: ${process.env.DB_USER}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log('\n===== 支付配置 =====');
console.log(`PAYMENT_GATEWAY: ${process.env.PAYMENT_GATEWAY}`);
console.log(`STRIPE_PUBLIC_KEY: ${process.env.STRIPE_PUBLIC_KEY}`);
console.log(`PAYPAL_CLIENT_ID: ${process.env.PAYPAL_CLIENT_ID}`);
console.log('\n===== 服务器配置 =====');
console.log(`PORT: ${process.env.PORT}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '已设置' : '未设置'}`);

console.log('\n环境变量测试完成！');