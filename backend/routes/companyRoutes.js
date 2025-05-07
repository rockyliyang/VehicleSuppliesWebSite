const express = require('express');
const router = express.Router();

// 模拟公司信息数据
const companyInfo = {
  id: 1,
  company_name: 'AUTO EASE EXPERT CO., LTD',
  address: '123 Auto Street, Vehicle City',
  phone: '+86 123 4567 8910',
  email: 'contact@autoease.com',
  wechat_qrcode: '/static/images/qrcode.png',
  business_hours: '周一至周五: 9:00 - 18:00',
  description: '我们是一家专业从事汽车用品研发、生产和销售的公司，拥有多年的行业经验和专业技术。我们致力于为客户提供高品质、高性能的汽车用品，包括汽车吸尘器、车载充电器和汽车应急启动电源等产品。'
};

// 获取公司信息
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: companyInfo
  });
});

// 管理员路由 - 更新公司信息
router.put('/', (req, res) => {
  // 实际项目中会更新数据库中的数据
  const updatedInfo = {
    ...companyInfo,
    ...req.body
  };
  
  res.json({
    success: true,
    message: '公司信息更新成功',
    data: updatedInfo
  });
});

module.exports = router;