/**
 * 环境变量配置加载模块
 * 根据不同环境加载对应的环境变量配置
 */
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

/**
 * 加载环境变量配置
 * 优先级：
 * 1. .env.{NODE_ENV}.local (本地特定环境配置，不提交到版本控制)
 * 2. .env.{NODE_ENV} (特定环境配置)
 * 3. .env.local (本地通用配置，不提交到版本控制)
 * 4. .env (默认配置)
 */
function loadEnv() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const envFiles = [
    `.env.${NODE_ENV}.local`,
    `.env.${NODE_ENV}`,
    '.env.local',
    '.env'
  ];

  // 记录已加载的环境变量文件
  const loadedEnvFiles = [];

  // 从后往前加载，保证优先级
  for (const envFile of envFiles.reverse()) {
    const envPath = path.resolve(process.cwd(), envFile);
    
    if (fs.existsSync(envPath)) {
      // 加载环境变量
      const result = dotenv.config({ path: envPath });
      
      if (result.error) {
        console.error(`加载环境变量文件 ${envFile} 失败:`, result.error);
      } else {
        loadedEnvFiles.push(envFile);
      }
    }
  }

  // 输出加载信息
  console.log(`当前环境: ${NODE_ENV}`);
  if (loadedEnvFiles.length > 0) {
    console.log(`已加载环境变量文件: ${loadedEnvFiles.join(', ')}`);
  } else {
    console.warn('未找到任何环境变量配置文件');
  }

  // 新增支付宝和微信支付环境变量读取
  const ALIPAY_APP_ID = process.env.ALIPAY_APP_ID;
  const ALIPAY_PRIVATE_KEY = process.env.ALIPAY_PRIVATE_KEY;
  const ALIPAY_PUBLIC_KEY = process.env.ALIPAY_PUBLIC_KEY;
  const ALIPAY_GATEWAY = process.env.ALIPAY_GATEWAY;
  const WECHAT_APP_ID = process.env.WECHAT_APP_ID;
  const WECHAT_MCH_ID = process.env.WECHAT_MCH_ID;
  const WECHAT_API_KEY = process.env.WECHAT_API_KEY;
  const WECHAT_NOTIFY_URL = process.env.WECHAT_NOTIFY_URL;

  // 返回当前环境
  return {
    NODE_ENV,
    isDevelopment: NODE_ENV === 'development',
    isProduction: NODE_ENV === 'production',
    isTest: NODE_ENV === 'test',
    ALIPAY_APP_ID,
    ALIPAY_PRIVATE_KEY,
    ALIPAY_PUBLIC_KEY,
    ALIPAY_GATEWAY,
    WECHAT_APP_ID,
    WECHAT_MCH_ID,
    WECHAT_API_KEY,
    WECHAT_NOTIFY_URL
  };
}

module.exports = loadEnv();