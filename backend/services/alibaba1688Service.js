const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class Alibaba1688Service {
  constructor() {
    this.baseURL = 'https://gw.open.1688.com/openapi';
    this.appKey = process.env.ALIBABA_APP_KEY;
    this.appSecret = process.env.ALIBABA_APP_SECRET;
    this.accessToken = process.env.ALIBABA_ACCESS_TOKEN;
    
    if (!this.appKey || !this.appSecret) {
      console.warn('1688 API credentials not configured');
    }
  }

  /**
   * 生成API签名
   * @param {Object} params - 请求参数
   * @param {string} secret - 应用密钥
   * @returns {string} 签名
   */
  generateSignature(params, secret) {
    // 按字典序排序参数
    const sortedKeys = Object.keys(params).sort();
    let signString = secret;
    
    sortedKeys.forEach(key => {
      signString += key + params[key];
    });
    signString += secret;
    
    // 使用MD5加密并转为大写
    const crypto = require('crypto');
    return crypto.createHash('md5').update(signString).digest('hex').toUpperCase();
  }

  /**
   * 构建请求参数
   * @param {string} method - API方法名
   * @param {Object} bizParams - 业务参数
   * @returns {Object} 完整的请求参数
   */
  buildParams(method, bizParams = {}) {
    const timestamp = Date.now();
    const params = {
      method,
      app_key: this.appKey,
      timestamp,
      format: 'json',
      v: '1',
      sign_method: 'md5',
      access_token: this.accessToken,
      ...bizParams
    };
    
    // 生成签名
    params.sign = this.generateSignature(params, this.appSecret);
    return params;
  }

  /**
   * 发送API请求
   * @param {string} method - API方法名
   * @param {Object} bizParams - 业务参数
   * @returns {Promise} API响应
   */
  async request(method, bizParams = {}) {
    try {
      const params = this.buildParams(method, bizParams);
      
      const response = await axios.post(this.baseURL, null, {
        params,
        timeout: 30000
      });
      
      return response.data;
    } catch (error) {
      console.error('1688 API请求失败:', error.message);
      throw new Error(`1688 API请求失败: ${error.message}`);
    }
  }

  /**
   * 根据关键词搜索产品
   * @param {string} keyword - 搜索关键词
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise} 搜索结果
   */
  async searchProducts(keyword, page = 1, pageSize = 20) {
    const bizParams = {
      keywords: keyword,
      pageIndex: page,
      pageSize: pageSize,
      status: 'published', // 只搜索已发布的产品
      orderBy: 'gmv_desc' // 按销量排序
    };
    
    return await this.request('alibaba.product.search', bizParams);
  }

  /**
   * 根据图片搜索产品
   * @param {string} imageUrl - 图片URL或本地路径
   * @returns {Promise} 搜索结果
   */
  async searchByImage(imageUrl) {
    try {
      let imageData;
      
      if (imageUrl.startsWith('http')) {
        // 网络图片，先下载
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        imageData = Buffer.from(response.data);
      } else {
        // 本地图片
        imageData = fs.readFileSync(imageUrl);
      }
      
      const formData = new FormData();
      formData.append('image', imageData, 'search.jpg');
      
      const bizParams = {
        imageContent: imageData.toString('base64')
      };
      
      return await this.request('alibaba.product.imageSearch', bizParams);
    } catch (error) {
      console.error('图片搜索失败:', error.message);
      throw new Error(`图片搜索失败: ${error.message}`);
    }
  }

  /**
   * 获取产品详情
   * @param {string} productId - 产品ID
   * @returns {Promise} 产品详情
   */
  async getProductDetail(productId) {
    const bizParams = {
      productId: productId,
      webSite: '1688' // 指定站点
    };
    
    return await this.request('alibaba.product.get', bizParams);
  }

  /**
   * 获取产品图片信息
   * @param {string} productId - 产品ID
   * @returns {Promise} 图片信息
   */
  async getProductImages(productId) {
    const bizParams = {
      productId: productId
    };
    
    return await this.request('alibaba.product.images.get', bizParams);
  }

  /**
   * 格式化搜索结果
   * @param {Object} rawData - 原始API响应
   * @returns {Object} 格式化后的数据
   */
  formatSearchResults(rawData) {
    if (!rawData || !rawData.result || !rawData.result.products) {
      return {
        success: false,
        message: '搜索结果为空',
        data: {
          products: [],
          total: 0,
          page: 1,
          pageSize: 20
        }
      };
    }
    
    const products = rawData.result.products.map(product => ({
      id: product.productId,
      title: product.subject,
      price: product.priceRange,
      image: product.image,
      supplierName: product.supplierName,
      supplierLocation: product.supplierLocation,
      minOrderQuantity: product.minOrderQuantity,
      unit: product.unit,
      productUrl: `https://detail.1688.com/offer/${product.productId}.html`
    }));
    
    return {
      success: true,
      data: {
        products,
        total: rawData.result.total || 0,
        page: rawData.result.pageIndex || 1,
        pageSize: rawData.result.pageSize || 20
      }
    };
  }

  /**
   * 格式化产品详情
   * @param {Object} rawData - 原始API响应
   * @returns {Object} 格式化后的产品详情
   */
  formatProductDetail(rawData) {
    if (!rawData || !rawData.result) {
      return {
        success: false,
        message: '获取产品详情失败'
      };
    }
    
    const product = rawData.result;
    
    return {
      success: true,
      data: {
        id: product.productId,
        title: product.subject,
        description: product.description,
        price: product.priceRange,
        images: {
          main: product.image,
          carousel: product.images || [],
          detail: product.detailImages || []
        },
        specifications: product.attributes || [],
        supplier: {
          name: product.supplierName,
          location: product.supplierLocation,
          memberId: product.memberId
        },
        minOrderQuantity: product.minOrderQuantity,
        unit: product.unit,
        category: product.categoryName,
        keywords: product.keywords
      }
    };
  }
}

module.exports = new Alibaba1688Service();