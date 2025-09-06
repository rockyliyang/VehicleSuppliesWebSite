/**
 * Sitemap生成器
 * 用于动态生成网站的sitemap.xml文件
 * 可以在构建过程中或通过定时任务运行
 */

// 根据环境动态导入模块
let fs, path, api;

// 检查是否在Node.js环境中
if (typeof require !== 'undefined') {
  fs = require('fs');
  path = require('path');
  // 在Node.js环境中导入api
  try {
    api = require('./api').default;
  } catch (error) {
    // 如果在构建环境中无法导入api，使用axios
    console.warn('无法导入api模块，将使用axios替代');
    // 确保使用完整的API基础URL
    const axios = require('axios');
    // 强制设置NODE_ENV为production，确保生成正确的URL
    process.env.NODE_ENV = 'production';
    const apiBaseUrl = process.env.VUE_APP_API_URL || 'https://v.autoeasetechx.com';
    api = axios.create({
      baseURL: apiBaseUrl,
      timeout: 10000
    });
  }
} else {
  // 浏览器环境
  console.error('Sitemap生成器只能在Node.js环境中运行');
}

// 基础URL
const BASE_URL = 'https://v.autoeasetechx.com';
// API基础URL
const API_BASE_URL = 'https://v.autoeasetechx.com';
// API路径前缀
const API_PREFIX = '/api';

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
 * 生成XML格式的URL条目
 * @param {string} loc URL地址
 * @param {string} lastmod 最后修改日期 (YYYY-MM-DD)
 * @param {string} changefreq 更新频率
 * @param {number} priority 优先级 (0.0 - 1.0)
 * @returns {string} XML格式的URL条目
 */
function generateUrlXml(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
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
    // 判断是否使用axios实例（构建环境）或api模块
    const isAxiosInstance = api.defaults && api.defaults.baseURL;
    // 使用新的basic API端点获取所有产品的基本信息
    const url = isAxiosInstance ? `${API_BASE_URL}${API_PREFIX}/products/basic` : '/products/basic';
    console.log(`请求产品数据URL: ${url}`);
    const response = await api.get(url);
    
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
    // 判断是否使用axios实例（构建环境）或api模块
    const isAxiosInstance = api.defaults && api.defaults.baseURL;
    // 首先获取新闻导航列表
    const navUrl = isAxiosInstance ? `${API_BASE_URL}${API_PREFIX}/common-content/nav/news?lang=en` : '/common-content/nav/news?lang=en';
    console.log(`请求新闻导航数据URL: ${navUrl}`);
    const navResponse = await api.get(navUrl);
    
    // 检查导航响应数据格式
    if (navResponse.data && navResponse.data.data && navResponse.data.data.navList && Array.isArray(navResponse.data.data.navList)) {
      const navList = navResponse.data.data.navList;
      console.log(`成功获取${navList.length}个新闻导航`);
      
      // 存储所有新闻内容项
      let allNewsItems = [];
      
      // 对每个导航获取其内容列表
      for (const nav of navList) {
        try {
          const contentUrl = isAxiosInstance ? 
            `${API_BASE_URL}${API_PREFIX}/common-content/content/${nav.name_key}/en` : 
            `/common-content/content/${nav.name_key}/en`;
          console.log(`请求新闻内容数据URL: ${contentUrl}`);
          const contentResponse = await api.get(contentUrl);
          
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
        `${BASE_URL}/news/${item.contentId}?navId=${item.navId}`,
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
    const outputPath = path.resolve(__dirname, '../../public/sitemap.xml');
    fs.writeFileSync(outputPath, sitemapContent, 'utf8');
    console.log(`Sitemap生成成功: ${outputPath}`);
  } catch (error) {
    console.error('写入sitemap.xml文件失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本，则生成sitemap
if (require.main === module) {
  generateSitemap().catch(error => {
    console.error('生成Sitemap失败:', error);
    process.exit(1);
  });
}

module.exports = {
  generateSitemap
};