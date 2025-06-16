const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uuidToBinary, binaryToUuid } = require('../utils/uuid');
const { getMessage } = require('../config/messages');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/static/images';
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMain = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error(getMessage('PRODUCT_IMAGE.INVALID_FILE_TYPE')), false);
    }
    cb(null, true);
  }
}).single('images'); // 主图只能一张

const uploadCarousel = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error(getMessage('PRODUCT_IMAGE.INVALID_FILE_TYPE')), false);
    }
    cb(null, true);
  }
}).array('images', 10); // 轮播图多张

// 上传产品图片（主图/轮播图）
exports.uploadProductImages = async (req, res) => {
  const { image_type } = req.body;
  const uploadHandler = image_type == 0 ? uploadMain : uploadCarousel;
  uploadHandler(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message, data: null });
    }
    try {
      const { product_id, image_type, session_id } = req.body;
      const files = req.files || (req.file ? [req.file] : []);
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: getMessage('PRODUCT_IMAGE.NO_FILE_UPLOADED'), data: null });
      }
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      try {
        const guid = uuidToBinary(uuidv4());
        
        const imageValues = files.map((file, index) => [
          guid,
          product_id === 'undefined' ? null : product_id,
          `/static/images/${file.filename}`,
          image_type || 0,
          index,
          session_id || null
        ]);
        await connection.query(
          'INSERT INTO product_images (guid, product_id, image_url, image_type, sort_order, session_id, created_by, updated_by) VALUES ?',[imageValues.map(values => [...values, req.userId, req.userId])]
        );
        await connection.commit();
        res.json({
          success: true,
          message: getMessage('PRODUCT_IMAGE.UPLOAD_SUCCESS'),
          data: {
            images: files.map(file => ({ filename: file.filename, path: `/static/images/${file.filename}` }))
          }
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (err) {
      res.status(500).json({ success: false, message: getMessage('PRODUCT_IMAGE.UPLOAD_FAILED'), data: { error: err.message } });
    }
  });
};

// 获取产品图片
exports.getProductImages = async (req, res) => {
  try {
    const { product_id, image_type } = req.query;
    const [rows] = await pool.query(
      'SELECT * FROM product_images WHERE product_id = ? AND image_type = ? AND deleted = 0 ORDER BY sort_order ASC',
      [product_id, image_type]
    );
    res.json({
      success: true,
      message: getMessage('PRODUCT_IMAGE.GET_SUCCESS'),
      data: rows
    });
  } catch (err) {
    console.error('获取图片失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_IMAGE.GET_FAILED'),
      data: { error: err.message }
    });
  }
};

// 删除产品图片
exports.deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 获取图片信息
      const [rows] = await connection.query(
        'SELECT image_url FROM product_images WHERE id = ? AND deleted = 0',
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('PRODUCT_IMAGE.NOT_FOUND'),
          data: null
        });
      }

      // 软删除图片记录
      await connection.query(
        'UPDATE product_images SET deleted = 1, updated_by = ? WHERE id = ?',
        [req.userId, id]
      );

      // 删除物理文件
      const imagePath = path.join('public', rows[0].image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      await connection.commit();
      res.json({
        success: true,
        message: getMessage('PRODUCT_IMAGE.DELETE_SUCCESS'),
        data: null
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('删除图片失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_IMAGE.DELETE_FAILED'),
      data: { error: err.message }
    });
  }
};

// 更新图片排序
exports.updateImageOrder = async (req, res) => {
  try {
    const { images } = req.body; // [{id: 1, sort_order: 0}, {id: 2, sort_order: 1}]
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const image of images) {
        await connection.query(
          'UPDATE product_images SET sort_order = ?, updated_by = ? WHERE id = ? AND deleted = 0',
          [image.sort_order, req.userId, image.id]
        );
      }

      await connection.commit();
      res.json({
        success: true,
        message: getMessage('PRODUCT_IMAGE.ORDER_UPDATE_SUCCESS'),
        data: null
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('更新图片排序失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_IMAGE.ORDER_UPDATE_FAILED'),
      data: { error: err.message }
    });
  }
};

// 新建产品保存时，更新图片的 product_id
exports.assignProductImages = async (req, res) => {
  try {
    const { product_id, session_id } = req.body;
    if (!product_id || !session_id) {
      return res.status(400).json({ success: false, message: getMessage('PRODUCT_IMAGE.MISSING_PARAMS'), data: null });
    }
    await pool.query(
      'UPDATE product_images SET product_id = ? WHERE product_id IS NULL AND session_id = ?',
      [product_id, session_id]
    );
    res.json({ success: true, message: getMessage('PRODUCT_IMAGE.ASSIGN_SUCCESS') });
  } catch (err) {
    res.status(500).json({ success: false, message: getMessage('PRODUCT_IMAGE.ASSIGN_FAILED'), data: { error: err.message } });
  }
};