const express = require('express');
const router = express.Router();

// 模拟分类数据
const categories = [
  { id: 1, name: '汽车吸尘器', description: '高效清洁汽车内饰的吸尘设备', image_url: '/static/images/categories/vacuum.jpg' },
  { id: 2, name: '车载充电器', description: '为车内设备提供电力的充电设备', image_url: '/static/images/categories/charger.jpg' },
  { id: 3, name: '汽车应急启动电源', description: '紧急情况下为汽车提供启动电源的设备', image_url: '/static/images/categories/jumpstarter.jpg' },
  { id: 4, name: '其他', description: '其他汽车用品和配件', image_url: '/static/images/categories/other.jpg' }
];

// 获取所有分类
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: categories
  });
});

// 获取单个分类
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const category = categories.find(cat => cat.id === parseInt(id));
  
  if (!category) {
    return res.status(404).json({
      success: false,
      message: '分类不存在'
    });
  }
  
  res.json({
    success: true,
    data: category
  });
});

// 管理员路由 - 创建分类
router.post('/', (req, res) => {
  // 实际项目中会将数据保存到数据库
  res.status(201).json({
    success: true,
    message: '分类创建成功',
    data: {
      id: categories.length + 1,
      ...req.body
    }
  });
});

// 管理员路由 - 更新分类
router.put('/:id', (req, res) => {
  const { id } = req.params;
  
  // 实际项目中会更新数据库中的数据
  res.json({
    success: true,
    message: '分类更新成功',
    data: {
      id: parseInt(id),
      ...req.body
    }
  });
});

// 管理员路由 - 删除分类
router.delete('/:id', (req, res) => {
  // 实际项目中会从数据库中删除数据（软删除）
  res.json({
    success: true,
    message: '分类删除成功'
  });
});

module.exports = router;