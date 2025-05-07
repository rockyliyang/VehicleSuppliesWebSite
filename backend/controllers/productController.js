const db = require('../config/database');

// 获取所有产品
exports.getAllProducts = async (req, res) => {
  try {
    // 实际项目中会从数据库获取数据
    // 这里使用模拟数据
    const products = [
      { 
        id: 1, 
        category_id: 1, 
        name: 'XWC-001 Car Vacuum Cleaner', 
        thumbnail_url: '/static/images/products/product1.jpg',
        short_description: '强力吸尘，便携设计',
        price: 299.00,
        stock: 100
      },
      { 
        id: 2, 
        category_id: 1, 
        name: 'XWC-002 Vacuum Cleaner', 
        thumbnail_url: '/static/images/products/product2.jpg',
        short_description: '无线设计，长效续航',
        price: 359.00,
        stock: 85
      },
      { 
        id: 3, 
        category_id: 1, 
        name: 'XWC-003 Car Vacuum Cleaner', 
        thumbnail_url: '/static/images/products/product3.jpg',
        short_description: '多功能吸尘器，适用多种场景',
        price: 399.00,
        stock: 50
      },
      { 
        id: 4, 
        category_id: 1, 
        name: 'XWC-004 Car Vacuum Cleaner', 
        thumbnail_url: '/static/images/products/product4.jpg',
        short_description: '大功率吸尘，快速清洁',
        price: 459.00,
        stock: 30
      },
      { 
        id: 5, 
        category_id: 3, 
        name: 'F-39 4000A 12V&24V Jump Starter', 
        thumbnail_url: '/static/images/products/product5.jpg',
        short_description: '4000A峰值电流，适用12V/24V车辆',
        price: 899.00,
        stock: 20
      },
      { 
        id: 6, 
        category_id: 3, 
        name: 'F-25 2000A Jump Starter', 
        thumbnail_url: '/static/images/products/product6.jpg',
        short_description: '2000A峰值电流，紧急启动电源',
        price: 599.00,
        stock: 40
      },
      { 
        id: 7, 
        category_id: 3, 
        name: 'F-18 Wireless Charger Jump Starter', 
        thumbnail_url: '/static/images/products/product7.jpg',
        short_description: '无线充电功能，多功能应急电源',
        price: 699.00,
        stock: 25
      },
      { 
        id: 8, 
        category_id: 3, 
        name: 'F-8 12V Jump Starter', 
        thumbnail_url: '/static/images/products/product8.jpg',
        short_description: '小巧便携，12V应急启动',
        price: 499.00,
        stock: 60
      }
    ];
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('获取产品列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品列表失败'
    });
  }
};

// 获取单个产品详情
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 实际项目中会从数据库获取数据
    // 这里使用模拟数据
    const product = {
      id: parseInt(id),
      category_id: id <= 4 ? 1 : 3,
      name: id <= 4 ? `XWC-00${id} Car Vacuum Cleaner` : `F-${39 - (8 - parseInt(id))} ${id === '5' ? '4000A 12V&24V' : id === '6' ? '2000A' : id === '7' ? 'Wireless Charger' : '12V'} Jump Starter`,
      thumbnail_url: `/static/images/products/product${id}.jpg`,
      images: [
        `/static/images/products/product${id}_1.jpg`,
        `/static/images/products/product${id}_2.jpg`,
        `/static/images/products/product${id}_3.jpg`
      ],
      short_description: id <= 4 ? '高效吸尘，便携设计' : '应急启动电源，多功能设计',
      full_description: id <= 4 ? 
        '<p>这款车载吸尘器采用强力电机，提供强大吸力，轻松清理汽车内的灰尘、碎屑和宠物毛发。便携式设计，可轻松存放在车内，随时使用。配备多种吸头，适用于不同清洁需求。</p><p>产品特点：</p><ul><li>强力吸尘</li><li>便携设计</li><li>多种吸头</li><li>长效电池</li></ul>' : 
        '<p>这款汽车应急启动电源采用高品质电芯，提供强大启动电流，可轻松启动12V/24V汽车、摩托车、船舶等。内置多重保护系统，使用安全可靠。同时配备LED照明灯，具备SOS紧急求救功能。</p><p>产品特点：</p><ul><li>强大启动电流</li><li>多重保护系统</li><li>LED照明</li><li>USB充电输出</li></ul>',
      price: id <= 4 ? 299 + (parseInt(id) - 1) * 60 : 499 + (parseInt(id) - 5) * 100,
      stock: 100 - parseInt(id) * 10,
      specifications: id <= 4 ? [
        { name: '电池容量', value: '2000mAh' },
        { name: '吸力', value: '8000Pa' },
        { name: '噪音', value: '≤75dB' },
        { name: '重量', value: '0.8kg' },
        { name: '电源', value: 'DC 12V' }
      ] : [
        { name: '峰值电流', value: id === '5' ? '4000A' : id === '6' ? '2000A' : id === '7' ? '1500A' : '1000A' },
        { name: '电池容量', value: id === '5' ? '24000mAh' : id === '6' ? '18000mAh' : id === '7' ? '12000mAh' : '8000mAh' },
        { name: '输入', value: '5V/2A' },
        { name: '输出', value: '5V/2.1A, 12V/10A' },
        { name: '重量', value: `${parseInt(id) * 0.2 + 0.5}kg` }
      ]
    };
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('获取产品详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品详情失败'
    });
  }
};

// 按分类获取产品
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // 实际项目中会从数据库获取数据
    // 这里使用模拟数据
    const allProducts = [
      { 
        id: 1, 
        category_id: 1, 
        name: 'XWC-001 Car Vacuum Cleaner', 
        thumbnail_url: '/static/images/products/product1.jpg',
        short_description: '强力吸尘，便携设计',
        price: 299.00,
        stock: 100
      },
      { 
        id: 2, 
        category_id: 1, 
        name: 'XWC-002 Vacuum Cleaner', 
        thumbnail_url: '/static/images/products/product2.jpg',
        short_description: '无线设计，长效续航',
        price: 359.00,
        stock: 85
      },
      { 
        id: 3, 
        category_id: 1, 
        name: 'XWC-003 Car Vacuum Cleaner', 
        thumbnail_url: '/static/images/products/product3.jpg',
        short_description: '多功能吸尘器，适用多种场景',
        price: 399.00,
        stock: 50
      },
      { 
        id: 4, 
        category_id: 1, 
        name: 'XWC-004 Car Vacuum Cleaner', 
        thumbnail_url: '/static/images/products/product4.jpg',
        short_description: '大功率吸尘，快速清洁',
        price: 459.00,
        stock: 30
      },
      { 
        id: 5, 
        category_id: 3, 
        name: 'F-39 4000A 12V&24V Jump Starter', 
        thumbnail_url: '/static/images/products/product5.jpg',
        short_description: '4000A峰值电流，适用12V/24V车辆',
        price: 899.00,
        stock: 20
      },
      { 
        id: 6, 
        category_id: 3, 
        name: 'F-25 2000A Jump Starter', 
        thumbnail_url: '/static/images/products/product6.jpg',
        short_description: '2000A峰值电流，紧急启动电源',
        price: 599.00,
        stock: 40
      },
      { 
        id: 7, 
        category_id: 3, 
        name: 'F-18 Wireless Charger Jump Starter', 
        thumbnail_url: '/static/images/products/product7.jpg',
        short_description: '无线充电功能，多功能应急电源',
        price: 699.00,
        stock: 25
      },
      { 
        id: 8, 
        category_id: 3, 
        name: 'F-8 12V Jump Starter', 
        thumbnail_url: '/static/images/products/product8.jpg',
        short_description: '小巧便携，12V应急启动',
        price: 499.00,
        stock: 60
      }
    ];
    
    const products = allProducts.filter(product => product.category_id === parseInt(categoryId));
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('按分类获取产品失败:', error);
    res.status(500).json({
      success: false,
      message: '按分类获取产品失败'
    });
  }
};

// 创建产品
exports.createProduct = async (req, res) => {
  try {
    // 实际项目中会将数据保存到数据库
    res.status(201).json({
      success: true,
      message: '产品创建成功',
      data: {
        id: 9,
        ...req.body
      }
    });
  } catch (error) {
    console.error('创建产品失败:', error);
    res.status(500).json({
      success: false,
      message: '创建产品失败'
    });
  }
};

// 更新产品
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 实际项目中会更新数据库中的数据
    res.json({
      success: true,
      message: '产品更新成功',
      data: {
        id: parseInt(id),
        ...req.body
      }
    });
  } catch (error) {
    console.error('更新产品失败:', error);
    res.status(500).json({
      success: false,
      message: '更新产品失败'
    });
  }
};

// 删除产品
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 实际项目中会从数据库中删除数据（软删除）
    res.json({
      success: true,
      message: '产品删除成功'
    });
  } catch (error) {
    console.error('删除产品失败:', error);
    res.status(500).json({
      success: false,
      message: '删除产品失败'
    });
  }
};