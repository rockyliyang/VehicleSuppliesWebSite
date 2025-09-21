/**
 * Sitemap生成器
 * 用于动态生成网站的sitemap.xml文件
 * 可以在构建过程中或通过定时任务运行
 */

// 检查是否在Node.js环境中运行
if (typeof window !== 'undefined') {
  console.error('Sitemap生成器只能在Node.js环境中运行');
  process.exit(1);
}

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 手动加载环境变量
if (process.env.NODE_ENV === 'production') {
  try {
    const envPath = path.resolve(__dirname, '../../.env.production');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
      console.log('✅ 已加载生产环境变量文件');
    }
  } catch (error) {
    console.warn('⚠️  加载环境变量文件失败:', error.message);
  }
}

// 根据环境动态导入模块
let api;

// 初始化API客户端
async function initApi() {
  if (api) return api;
  
  try {
    const apiModule = await import('./api.js');
    api = apiModule.default;
  } catch (error) {
    // 如果在构建环境中无法导入api，使用axios
    console.warn('无法导入api模块，将使用axios替代');
    // 确保使用完整的API基础URL
    process.env.NODE_ENV = 'production';
    const apiBaseUrl = process.env.NUXT_PUBLIC_API_BASE || 'https://v.autoeasetechx.com';
    api = axios.create({
      baseURL: apiBaseUrl,
      timeout: 10000
    });
  }
  
  return api;
}

console.log('环境变量 NUXT_PUBLIC_API_BASE:', process.env.NUXT_PUBLIC_API_BASE);
console.log('环境变量 NUXT_PUBLIC_BASE_URL:', process.env.NUXT_PUBLIC_BASE_URL);
// 基础URL
const BASE_URL = process.env.NUXT_PUBLIC_BASE_URL || 'https://v.autoeasetechx.com';
// API基础URL
const API_BASE_URL = process.env.NUXT_PUBLIC_API_BASE || 'https://v.autoeasetechx.com';
// API路径前缀
const API_PREFIX = process.env.NUXT_PUBLIC_API_PREFIX || '/api';

// 静态页面配置
const STATIC_PAGES = [
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/products', changefreq: 'daily', priority: 0.9 },
  { url: '/about', changefreq: 'monthly', priority: 0.8 },
  { url: '/news', changefreq: 'weekly', priority: 0.8 },
  { url: '/contact', changefreq: 'monthly', priority: 0.8 },
  { url: '/login', changefreq: 'monthly', priority: 0.7 },
  { url: '/register', changefreq: 'monthly', priority: 0.7 }
];

/**
 * XML编码函数，将特殊字符转换为XML实体
 * @param {string} str 需要编码的字符串
 * @returns {string} 编码后的字符串
 */
function xmlEncode(str) {
  if (typeof str !== 'string') {
    return str;
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 生成XML格式的URL条目
 * @param {string} loc URL地址
 * @param {string} lastmod 最后修改日期 (YYYY-MM-DD)
 * @param {string} changefreq 更新频率
 * @param {number} priority 优先级 (0.0 - 1.0)
 * @returns {string} XML格式的URL条目
 */
function generateUrlXml(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${xmlEncode(loc)}</loc>
    <lastmod>${xmlEncode(lastmod)}</lastmod>
    <changefreq>${xmlEncode(changefreq)}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

/**
 * 获取当前日期，格式为YYYY-MM-DD
 * @returns {string} 格式化的日期字符串
 */
function getCurrentDate() {
  const date = new Date();
  return date.toISOString().split('T')[0];
}

/**
 * 获取所有产品ID
 * @returns {Promise<Array>} 产品ID数组
 */
async function fetchProductIds() {
  try {
    const apiClient = await initApi();
    // 判断是否使用axios实例（构建环境）或api模块
    const isAxiosInstance = apiClient.defaults && apiClient.defaults.baseURL;
    // 使用新的basic API端点获取所有产品的基本信息
    const url = isAxiosInstance ? '/products/basic' : '/products/basic';
    console.log(`请求产品数据URL: ${isAxiosInstance ? API_BASE_URL + url : url}`);
    const response = await apiClient.get(url);
    
    // 检查响应数据格式
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      const ids = response.data.data.map(product => product.id);
      console.log(`成功获取${ids.length}个产品ID`);
      return ids;
    } else {
      // 尝试其他可能的响应格式
      if (response.data && Array.isArray(response.data)) {
        const ids = response.data.map(product => product.id).filter(id => id);
        console.log(`使用备选格式获取${ids.length}个产品ID`);
        return ids;
      }
      console.warn('产品数据格式不正确:', response.data);
      // 返回一些静态产品ID作为备选
      return ['1', '2', '3'];
    }
  } catch (error) {
    //console.error('获取产品ID失败:', error);
    // 返回一些静态产品ID作为备选
    return ['1', '2', '3'];
  }
}

/**
 * 获取所有新闻内容和导航ID
 * @returns {Promise<Array>} 新闻内容和导航ID数组
 */
async function fetchNewsIds() {
  try {
    const apiClient = await initApi();
    // 判断是否使用axios实例（构建环境）或api模块
    const isAxiosInstance = apiClient.defaults && apiClient.defaults.baseURL;
    // 首先获取新闻导航列表
    const navUrl = isAxiosInstance ? '/common-content/nav/news?lang=en' : '/common-content/nav/news?lang=en';
    console.log(`请求新闻导航数据URL: ${isAxiosInstance ? API_BASE_URL + navUrl : navUrl}`);
    const navResponse = await apiClient.get(navUrl);
    
    let navData;
    if (isAxiosInstance)
    {
      navData = navResponse.data;
    }
    else
    {
      navData = navResponse.data?.data;
    }
    // 检查导航响应数据格式
    if (navData && navData.navList && Array.isArray(navData.navList)) {
      const navList = navData.navList;
      console.log(`成功获取${navList.length}个新闻导航`);
      
      // 存储所有新闻内容项
      let allNewsItems = [];
      
      // 对每个导航获取其内容列表
      for (const nav of navList) {
        try {
          const contentUrl = isAxiosInstance ? 
            `/common-content/content/${nav.name_key}/en` : 
            `/common-content/content/${nav.name_key}/en`;
          console.log(`请求新闻内容数据URL: ${isAxiosInstance ? API_BASE_URL + contentUrl : contentUrl}`);
          const contentResponse = await apiClient.get(contentUrl);
          
          // 检查不同的可能的响应格式
          if (contentResponse.data && contentResponse.data.contentList && Array.isArray(contentResponse.data.contentList)) {
            const newsItems = contentResponse.data.contentList.map(item => ({
              contentId: item.id,
              navId: nav.id
            }));
            allNewsItems = [...allNewsItems, ...newsItems];
            console.log(`成功获取${newsItems.length}个新闻内容，导航ID: ${nav.id}`);
          } else if (contentResponse.data && contentResponse.data.data && contentResponse.data.data.contentList && Array.isArray(contentResponse.data.data.contentList)) {
            // 尝试另一种可能的响应格式
            const newsItems = contentResponse.data.data.contentList.map(item => ({
              contentId: item.id,
              navId: nav.id
            }));
            allNewsItems = [...allNewsItems, ...newsItems];
            console.log(`使用备选格式获取${newsItems.length}个新闻内容，导航ID: ${nav.id}`);
          } else {
            console.warn(`导航 ${nav.name_key} 的内容数据格式不正确:`, contentResponse.data);
          }
        } catch (contentError) {
          console.error(`获取导航 ${nav.name_key} 的内容失败:`, contentError);
        }
      }
      
      console.log(`总共获取${allNewsItems.length}个新闻内容项`);
      return allNewsItems;
    } else {
      console.warn('新闻导航数据格式不正确:', navResponse.data);
      return [];
    }
  } catch (error) {
   // console.error('获取新闻数据失败:', error);
    // 返回一些静态新闻ID作为备选
    return [];
  }
}

/**
 * 生成动态页面的URL条目
 * @returns {Promise<string>} 动态页面的XML字符串
 */
async function generateDynamicUrls() {
  const currentDate = getCurrentDate();
  let dynamicUrls = '';

  try {
    // 获取产品页面
    const productIds = await fetchProductIds();
    productIds.forEach(id => {
      dynamicUrls += '\n' + generateUrlXml(
        `${BASE_URL}/product/${id}`,
        currentDate,
        'weekly',
        0.8
      );
    });
    console.log(`成功添加${productIds.length}个产品页面到sitemap`);
  } catch (error) {
    //console.warn('获取产品页面失败，跳过产品页面生成:', error.message);
  }

  try {
    // 获取新闻页面
    const newsItems = await fetchNewsIds();
    newsItems.forEach(item => {
      dynamicUrls += '\n' + generateUrlXml(
        `${BASE_URL}/NewsDetail?navId=${item.navId}&contentId=${item.contentId}`,
        currentDate,
        'weekly',
        0.7
      );
    });
    console.log(`成功添加${newsItems.length}个新闻页面到sitemap`);
  } catch (error) {
   // console.warn('获取新闻页面失败，跳过新闻页面生成:', error.message);
  }

  return dynamicUrls;
}

/**
 * 生成完整的sitemap.xml文件
 */
async function generateSitemap() {
  const currentDate = getCurrentDate();
  let sitemapContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemapContent += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // 添加静态页面
  STATIC_PAGES.forEach(page => {
    sitemapContent += generateUrlXml(
      `${BASE_URL}${page.url}`,
      currentDate,
      page.changefreq,
      page.priority
    ) + '\n';
  });

  // 添加动态页面
  const dynamicUrls = await generateDynamicUrls();
  sitemapContent += dynamicUrls;

  sitemapContent += '\n</urlset>';

  // 写入文件
  try {
    const outputPath = path.resolve(__dirname, '../public/sitemap.xml');
    console.log(`准备写入sitemap到: ${outputPath}`);
    
    // 确保目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`创建目录: ${outputDir}`);
    }
    
    fs.writeFileSync(outputPath, sitemapContent, 'utf8');
    console.log(`Sitemap生成成功: ${outputPath}`);
    console.log(`Sitemap包含${STATIC_PAGES.length}个静态页面`);
  } catch (error) {
    console.error('写入sitemap.xml文件失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本，则生成sitemap
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  console.log('开始生成sitemap...');
  generateSitemap().catch(error => {
    console.error('生成Sitemap失败:', error);
    process.exit(1);
  });
}

/**
 * 预热页面 - 发送HTTP请求预加载页面
 * @param {string} url 要预热的URL
 * @returns {Promise<boolean>} 预热是否成功
 */
async function warmupPage(url) {
  try {
    const apiClient = await initApi();
    const response = await apiClient.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Sitemap-Warmup-Bot/1.0'
      }
    });
    console.log(`预热成功: ${url} (状态码: ${response.status})`);
    return true;
  } catch (error) {
    console.warn(`预热失败: ${url} - ${error.message}`);
    return false;
  }
}

/**
 * 批量预热页面
 * @param {Array<string>} urls 要预热的URL列表
 * @param {number} concurrency 并发数量，默认为3
 * @returns {Promise<Object>} 预热结果统计
 */
async function warmupPages(urls, concurrency = 3) {
  const results = {
    total: urls.length,
    success: 0,
    failed: 0,
    details: []
  };

  console.log(`开始预热${urls.length}个页面，并发数: ${concurrency}`);

  // 分批处理，控制并发数
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const promises = batch.map(async (url) => {
      const success = await warmupPage(url);
      results.details.push({ url, success });
      if (success) {
        results.success++;
      } else {
        results.failed++;
      }
      return success;
    });

    await Promise.all(promises);
    
    // 批次间稍作延迟，避免过于频繁的请求
    if (i + concurrency < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`预热完成: 成功 ${results.success}/${results.total}, 失败 ${results.failed}`);
  return results;
}

/**
 * 从sitemap.xml文件读取URL列表并转换为localhost
 * @param {number} port localhost端口号，默认为3000
 * @returns {Promise<Array<string>>} 从sitemap读取的URL列表
 */
async function getUrlsFromSitemap(port = 3000) {
  try {
    const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
    
    if (!fs.existsSync(sitemapPath)) {
      console.warn('sitemap.xml文件不存在，将使用默认URL列表');
      return getDefaultWarmupUrls(port);
    }

    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    const urls = [];
    
    // 使用正则表达式提取所有<loc>标签中的URL
    const locRegex = /<loc>([^<]+)<\/loc>/g;
    let match;
    
    while ((match = locRegex.exec(sitemapContent)) !== null) {
      let url = match[1];
      
      // 将URL中的域名替换为指定的localhost端口
      // 支持各种域名格式的替换
      url = url.replace(/https?:\/\/[^/]+/, `http://localhost:${port}`);
      
      urls.push(url);
    }
    
    console.log(`从sitemap.xml读取到${urls.length}个URL，目标端口: ${port}`);
    return urls;
  } catch (error) {
    console.warn('读取sitemap.xml失败:', error.message);
    console.log('将使用默认URL列表');
    return getDefaultWarmupUrls(port);
  }
}

/**
 * 获取默认的预热URL列表（备用方案）
 * @param {number} port localhost端口号，默认为3000
 * @returns {Promise<Array<string>>} 默认预热页面URL列表
 */
async function getDefaultWarmupUrls(port = 3000) {
  const urls = [];
  const localhostBase = `http://localhost:${port}`;

  // 1. 主页 - 最高优先级
  urls.push(`${localhostBase}/`);

  // 2. 重要静态页面
  const importantPages = ['/products', '/about', '/news', '/contact'];
  importantPages.forEach(page => {
    urls.push(`${localhostBase}${page}`);
  });

  // 3. Header/Footer相关的API端点（如果有独立的API）
  // 这些通常在页面加载时会被调用，预热可以提升用户体验
  try {
    // 预热公司信息API（通常用于Header/Footer）
    urls.push(`${API_BASE_URL}${API_PREFIX}/company`);
    
    // 预热导航菜单API
    urls.push(`${API_BASE_URL}${API_PREFIX}/common-content/nav/news?lang=en`);
  } catch (error) {
    console.warn('添加API预热URL时出错:', error.message);
  }

  // 4. 产品页面 - 获取前10个最重要的产品
  try {
    const productIds = await fetchProductIds();
    const topProducts = productIds.slice(0, 10); // 只预热前10个产品
    topProducts.forEach(id => {
      urls.push(`${localhostBase}/product/${id}`);
    });
    console.log(`添加${topProducts.length}个产品页面到预热列表`);
  } catch (error) {
    console.warn('获取产品页面预热URL时出错:', error.message);
  }

  console.log(`总共准备预热${urls.length}个页面`);
  return urls;
}

/**
 * 获取需要预热的页面URL列表
 * @param {number} port localhost端口号，默认为3000
 * @returns {Promise<Array<string>>} 预热页面URL列表
 */
async function getWarmupUrls(port = 3000) {
  // 优先从sitemap.xml读取URL列表
  return await getUrlsFromSitemap(port);
}

/**
 * 执行完整的预热流程
 * @param {Object} options 预热选项
 * @param {number} options.concurrency 并发数量，默认为3
 * @param {boolean} options.skipProducts 是否跳过产品页面预热，默认为false
 * @param {number} options.port localhost端口号，默认为3000
 * @returns {Promise<Object>} 预热结果
 */
async function performWarmup(options = {}) {
  const { concurrency = 3, skipProducts = false, port = 3000 } = options;
  
  console.log('开始执行页面预热...');
  
  try {
    let urls = await getWarmupUrls(port);
    
    // 如果选择跳过产品页面
    if (skipProducts) {
      urls = urls.filter(url => !url.includes('/product/'));
      console.log('跳过产品页面预热');
    }
    
    const results = await warmupPages(urls, concurrency);
    
    console.log('预热流程完成!');
    console.log(`总结: ${results.success}个成功, ${results.failed}个失败`);
    
    return results;
  } catch (error) {
    console.error('预热流程执行失败:', error);
    throw error;
  }
}

export {
  generateSitemap,
  performWarmup,
  warmupPages,
  getWarmupUrls,
  getUrlsFromSitemap,
  getDefaultWarmupUrls
};