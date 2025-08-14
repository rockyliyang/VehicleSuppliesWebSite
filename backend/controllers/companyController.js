const { query } = require('../db/db');
const { getMessage } = require('../config/messages');
const path = require('path');
const fs = require('fs');

// 获取公司信息
exports.getCompanyInfo = async (req, res) => {
  try {
    const rows = await query('SELECT id, guid, company_name, contact_name, address, phone, email, description, logo_url, wechat_qrcode, created_at, updated_at FROM company_info WHERE deleted = false LIMIT 1');
    if (rows.getRowCount() === 0) {
      return res.json({ success: false, message: getMessage('COMPANY.NO_FILE_UPLOADED'), data: null });
    }
    res.json({ success: true, message: getMessage('COMPANY.GET_SUCCESS'), data: rows.getFirstRow() });
  } catch (error) {
    console.error('获取公司信息失败:', error);
    res.status(500).json({ success: false, message: getMessage('COMPANY.GET_FAILED'), data: null });
  }
};

// 更新公司信息
exports.updateCompanyInfo = async (req, res) => {
  try {
    const {
      company_name,
      contact_name,
      address,
      phone,
      email,
      description,
      logo_url,
      wechat_qrcode
    } = req.body;
    // 只更新第一条未删除的公司信息
    const rows = await query('SELECT id FROM company_info WHERE deleted = false LIMIT 1');
    if (rows.getRowCount() === 0) {
      return res.json({ success: false, message: getMessage('COMPANY.NO_FILE_UPLOADED'), data: null });
    }
    const id = rows.getFirstRow().id;
    await query(
      `UPDATE company_info SET company_name=$1, contact_name=$2, address=$3, phone=$4, email=$5, description=$6, logo_url=$7, wechat_qrcode=$8, updated_by=$9, updated_at=NOW() WHERE id=$10`,
      [company_name, contact_name, address, phone, email, description, logo_url, wechat_qrcode, req.userId, id]
    );
    res.json({ success: true, message: getMessage('COMPANY.UPDATE_SUCCESS'), data: null });
  } catch (error) {
    console.error('更新公司信息失败:', error);
    res.status(500).json({ success: false, message: getMessage('COMPANY.UPDATE_FAILED'), data: null });
  }
};

// 上传公司logo
exports.uploadLogo = async (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: getMessage('COMPANY.NO_FILE_UPLOADED'), data: null });
  }
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
    fs.unlinkSync(req.file.path);
    return res.json({ success: false, message: getMessage('COMPANY.INVALID_FILE_FORMAT'), data: null });
  }
  const destName = 'logo' + ext;
  // uploads目录上一层的public/static/images
  const destPath = path.join(process.cwd(), 'public', 'static', 'images', destName);
  try {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.renameSync(req.file.path, destPath);
    const url = '/static/images/' + destName;
    res.json({ success: true, message: getMessage('COMPANY.LOGO_UPLOAD_SUCCESS'), data: { url } });
  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('文件保存失败:', err);
    res.status(500).json({ success: false, message: getMessage('COMPANY.FILE_SAVE_FAILED'), data: null });
  }
};

// 上传微信二维码
exports.uploadWechat = async (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: getMessage('COMPANY.NO_FILE_UPLOADED'), data: null });
  }
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
    fs.unlinkSync(req.file.path);
    return res.json({ success: false, message: getMessage('COMPANY.INVALID_FILE_FORMAT'), data: null });
  }
  const destName = 'wechat' + ext;
  const destPath = path.join(process.cwd(), 'public', 'static', 'images', destName);
  try {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.renameSync(req.file.path, destPath);
    const url = '/static/images/' + destName;
    res.json({ success: true, message: getMessage('COMPANY.WECHAT_UPLOAD_SUCCESS'), data: { url } });
  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('文件保存失败:', err);
    res.status(500).json({ success: false, message: getMessage('COMPANY.FILE_SAVE_FAILED'), data: null });
  }
};