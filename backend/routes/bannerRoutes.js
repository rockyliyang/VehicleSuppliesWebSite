const express = require('express');
const router = express.Router();

// 模拟Banner数据
const banners = [
  { 
    id: 1, 
    image_url: '/static/images/banners/banner1.jpg', 
    title: 'CAR VACUUM CLEANER', 
    description: 'STRONG SUCTION, EASY TO CLEAN ALL KINDS OF GARBAGE',
    link: '/products/category/1',
    sort_order: 1,
    is_active: 1
  },
  { 
    id: 2, 
    image_url: '/static/images/banners/banner2.jpg', 
    title: 'CAR JUMP STARTER', 
    description: 'EMERGENCY POWER SUPPLY FOR YOUR VEHICLE',
    link: '/products/category/3',
    sort_order: 2,
    is_active: 1
  },
  { 
    id: 3, 
    image_url: '/static/images/banners/banner3.jpg', 
    title: 'CAR ACCESSORIES', 
    description: 'EVERYTHING YOU NEED FOR YOUR CAR',
    link: '/products',
    sort_order: 3,
    is_active: 1
  }
];

// 获取所有Banner
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: banners
  });
});

// 获取单个Banner
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const banner = banners.find(b => b.id === parseInt(id));
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner不存在',
        data: null
      });
    }
    res.json({
      success: true,
      message: '获取Banner成功',
      data: banner
    });
  } catch (error) {
    console.error('获取Banner失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      data: null
    });
  }
});

// 管理员路由 - 创建Banner
router.post('/', (req, res) => {
  // 实际项目中会将数据保存到数据库
  res.status(201).json({
    success: true,
    message: 'Banner创建成功',
    data: {
      id: banners.length + 1,
      ...req.body
    }
  });
});

// 管理员路由 - 更新Banner
router.put('/:id', (req, res) => {
  const { id } = req.params;
  
  // 实际项目中会更新数据库中的数据
  res.json({
    success: true,
    message: 'Banner更新成功',
    data: {
      id: parseInt(id),
      ...req.body
    }
  });
});

// 管理员路由 - 删除Banner
router.delete('/:id', (req, res) => {
  // 实际项目中会从数据库中删除数据（软删除）
  res.json({
    success: true,
    message: 'Banner删除成功'
  });
});

module.exports = router;