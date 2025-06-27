const alibaba1688Service = require('../services/alibaba1688Service');
const { getMessage } = require('../config/messages');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置multer用于图片上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'search-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片文件 (jpeg, jpg, png, gif, webp)'));
    }
  }
});

/**
 * 根据关键词搜索1688产品
 */
exports.searchProducts = async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 20 } = req.query;
    
    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({
        success: false,
        message: getMessage('ALIBABA1688.KEYWORD_REQUIRED')
      });
    }
    
    console.log(`搜索1688产品: ${keyword}, 页码: ${page}`);
    
    const rawResult = await alibaba1688Service.searchProducts(
      keyword.trim(), 
      parseInt(page), 
      parseInt(pageSize)
    );
    
    const formattedResult = alibaba1688Service.formatSearchResults(rawResult);
    
    res.json({
      success: true,
      message: getMessage('ALIBABA1688.SEARCH_SUCCESS'),
      ...formattedResult
    });
    
  } catch (error) {
    console.error('搜索1688产品失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('ALIBABA1688.SEARCH_FAILED'),
      error: {
        code: 'ALIBABA1688_SEARCH_ERROR',
        message: error.message
      }
    });
  }
};

/**
 * 根据图片搜索1688产品
 */
exports.searchByImage = [upload.single('image'), async (req, res) => {
  let tempFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: getMessage('ALIBABA1688.IMAGE_REQUIRED')
      });
    }
    
    tempFilePath = req.file.path;
    console.log(`图片搜索1688产品: ${tempFilePath}`);
    
    const rawResult = await alibaba1688Service.searchByImage(tempFilePath);
    const formattedResult = alibaba1688Service.formatSearchResults(rawResult);
    
    res.json({
      success: true,
      message: getMessage('ALIBABA1688.IMAGE_SEARCH_SUCCESS'),
      ...formattedResult
    });
    
  } catch (error) {
    console.error('图片搜索1688产品失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('ALIBABA1688.IMAGE_SEARCH_FAILED'),
      error: {
        code: 'ALIBABA1688_IMAGE_SEARCH_ERROR',
        message: error.message
      }
    });
  } finally {
    // 清理临时文件
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('清理临时文件失败:', cleanupError);
      }
    }
  }
}];

/**
 * 获取1688产品详情
 */
exports.getProductDetail = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: getMessage('ALIBABA1688.PRODUCT_ID_REQUIRED')
      });
    }
    
    console.log(`获取1688产品详情: ${productId}`);
    
    const rawResult = await alibaba1688Service.getProductDetail(productId);
    const formattedResult = alibaba1688Service.formatProductDetail(rawResult);
    
    if (!formattedResult.success) {
      return res.status(404).json(formattedResult);
    }
    
    res.json({
      success: true,
      message: getMessage('ALIBABA1688.DETAIL_GET_SUCCESS'),
      data: formattedResult.data
    });
    
  } catch (error) {
    console.error('获取1688产品详情失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('ALIBABA1688.DETAIL_GET_FAILED'),
      error: {
        code: 'ALIBABA1688_DETAIL_ERROR',
        message: error.message
      }
    });
  }
};

/**
 * 获取1688产品图片
 */
exports.getProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: getMessage('ALIBABA1688.PRODUCT_ID_REQUIRED')
      });
    }
    
    console.log(`获取1688产品图片: ${productId}`);
    
    const rawResult = await alibaba1688Service.getProductImages(productId);
    
    res.json({
      success: true,
      message: getMessage('ALIBABA1688.DETAIL_GET_SUCCESS'),
      data: rawResult.result || []
    });
    
  } catch (error) {
    console.error('获取1688产品图片失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('ALIBABA1688.DETAIL_GET_FAILED'),
      error: {
        code: 'ALIBABA1688_IMAGES_ERROR',
        message: error.message
      }
    });
  }
};

/**
 * 检查1688 API配置状态
 */
exports.checkApiStatus = async (req, res) => {
  try {
    const hasCredentials = !!(process.env.ALIBABA_APP_KEY && process.env.ALIBABA_APP_SECRET);
    const hasAccessToken = !!process.env.ALIBABA_ACCESS_TOKEN;
    
    res.json({
      success: true,
      message: getMessage('ALIBABA1688.STATUS_GET_SUCCESS'),
      data: {
        configured: hasCredentials && hasAccessToken,
        hasCredentials,
        hasAccessToken,
        message: hasCredentials && hasAccessToken 
          ? getMessage('ALIBABA1688.API_CONFIGURED') 
          : getMessage('ALIBABA1688.API_NOT_CONFIGURED')
      }
    });
    
  } catch (error) {
    console.error('检查1688 API状态失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('ALIBABA1688.STATUS_GET_FAILED'),
      error: {
        code: 'ALIBABA1688_STATUS_ERROR',
        message: error.message
      }
    });
  }
};

/**
 * 模拟搜索结果（用于开发测试）
 */
exports.mockSearchProducts = async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 20 } = req.query;
    
    // 模拟数据
    const mockProducts = [
      {
        id: '123456789',
        title: `${keyword} - 高品质汽车配件`,
        price: '¥50.00-¥200.00',
        image: 'https://via.placeholder.com/300x300?text=Product1',
        supplierName: '优质供应商A',
        supplierLocation: '广东 广州',
        minOrderQuantity: 10,
        unit: '件',
        productUrl: 'https://detail.1688.com/offer/123456789.html'
      },
      {
        id: '987654321',
        title: `${keyword} - 原厂品质配件`,
        price: '¥80.00-¥300.00',
        image: 'https://via.placeholder.com/300x300?text=Product2',
        supplierName: '优质供应商B',
        supplierLocation: '浙江 杭州',
        minOrderQuantity: 5,
        unit: '套',
        productUrl: 'https://detail.1688.com/offer/987654321.html'
      }
    ];
    
    res.json({
      success: true,
      message: getMessage('ALIBABA1688.SEARCH_SUCCESS'),
      data: {
        products: mockProducts,
        total: 100,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
    
  } catch (error) {
    console.error('模拟搜索失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('ALIBABA1688.SEARCH_FAILED'),
      error: {
        code: 'ALIBABA1688_MOCK_ERROR',
        message: error.message
      }
    });
  }
};

/**
 * 模拟产品详情（用于开发测试）
 */
exports.mockProductDetail = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const mockDetail = {
      id: productId,
      title: '高品质汽车配件 - 详细信息',
      description: '这是一个高品质的汽车配件，采用优质材料制造，经过严格的质量检测。',
      price: '¥50.00-¥200.00',
      images: {
        main: 'https://via.placeholder.com/600x600?text=MainImage',
        carousel: [
          'https://via.placeholder.com/600x600?text=Image1',
          'https://via.placeholder.com/600x600?text=Image2',
          'https://via.placeholder.com/600x600?text=Image3'
        ],
        detail: [
          'https://via.placeholder.com/800x600?text=DetailImage1',
          'https://via.placeholder.com/800x600?text=DetailImage2'
        ]
      },
      specifications: [
        { name: '材质', value: '优质钢材' },
        { name: '颜色', value: '黑色' },
        { name: '重量', value: '2.5kg' }
      ],
      supplier: {
        name: '优质供应商A',
        location: '广东 广州',
        memberId: 'supplier123'
      },
      minOrderQuantity: 10,
      unit: '件',
      category: '汽车配件',
      keywords: '汽车,配件,高品质'
    };
    
    res.json({
      success: true,
      message: getMessage('ALIBABA1688.DETAIL_GET_SUCCESS'),
      data: mockDetail
    });
    
  } catch (error) {
    console.error('模拟产品详情失败:', error);
    res.status(500).json({
      success: false,
      message: getMessage('ALIBABA1688.DETAIL_GET_FAILED'),
      error: {
        code: 'ALIBABA1688_MOCK_ERROR',
        message: error.message
      }
    });
  }
};