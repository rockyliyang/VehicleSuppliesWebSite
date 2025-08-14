const { v4: uuidv4 } = require('uuid');
const { getConnection, query } = require('../db/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// PostgreSQL 不需要 UUID 转换工具
const { getMessage } = require('../config/messages');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 根据文件类型选择不同的目录
    let uploadDir;
    if (file.mimetype.startsWith('video/')) {
      uploadDir = 'public/static/videos';
    } else {
      uploadDir = 'public/static/images';
    }
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
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new Error(getMessage('PRODUCT_IMAGE.INVALID_FILE_TYPE')), false);
    }
    cb(null, true);
  }
}).single('images'); // 主图只能一张

const uploadCarousel = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB限制，支持视频
  fileFilter: function (req, file, cb) {
    // 支持图片和视频格式
    const isImage = file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/);
    const isVideo = file.originalname.match(/\.(mp4|webm|ogg)$/);
    
    if (!isImage && !isVideo) {
      return cb(new Error(getMessage('PRODUCT_IMAGE.INVALID_FILE_TYPE')), false);
    }
    
    // 根据文件类型设置不同的大小限制
      if (isImage && file.size > 5 * 1024 * 1024) {
        return cb(new Error(getMessage('PRODUCT_IMAGE.IMAGE_TOO_LARGE')), false);
      }
      if (isVideo && file.size > 50 * 1024 * 1024) {
        return cb(new Error(getMessage('PRODUCT_IMAGE.VIDEO_TOO_LARGE')), false);
      }
    
    cb(null, true);
  }
}).array('images', 10); // 轮播媒体多张

// 创建一个动态multer中间件来处理不同的上传类型
const createDynamicUpload = (req, res, next) => {
  // 从查询参数或表单数据中获取image_type
  const image_type = parseInt(req.query.image_type || req.body?.image_type) || 0;
  console.log('image_type is :', image_type);
  
  let uploadHandler;
  if (image_type == 0) {
    uploadHandler = uploadMain; // 主图
  } else if (image_type == 1 || image_type == 2) { //轮播图和详情图
    uploadHandler = uploadCarousel; // 轮播媒体（图片和视频），多张
  } else {
    return res.status(400).json({ success: false, message: getMessage('PRODUCT_IMAGE.INVALID_FILE_TYPE'), data: null });
  }
 
  uploadHandler(req, res, next);
  console.log('写入文件成功:', req.files || (req.file ? [req.file] : []));
};

// 上传产品图片/视频（主图/轮播图/轮播视频）
exports.uploadProductImages = async (req, res) => {
  createDynamicUpload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message, data: null });
    }
    try {
      const image_type = parseInt(req.query.image_type || req.body?.image_type) ;
      const { product_id, session_id } = req.body;
      const files = req.files || (req.file ? [req.file] : []);
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: getMessage('PRODUCT_IMAGE.NO_FILE_UPLOADED'), data: null });
      }
      const connection = await getConnection();
       console.log('before transaction');
       await connection.beginTransaction();
      console.log('entre transaction');
      try {
        const uploadedImages = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const filePath = file.mimetype.startsWith('video/') 
            ? `/static/videos/${file.filename}` 
            : `/static/images/${file.filename}`;
          console.log('before insert file info to db');

          // 处理product_id的类型转换
          let processedProductId = null;
          if (product_id && product_id !== 'undefined' && product_id !== 'null') {
            // 尝试转换为数字，如果转换失败则设为null
            const numericProductId = parseInt(product_id);
            if (!isNaN(numericProductId)) {
              processedProductId = numericProductId;
            }
          }

          const result = await connection.query(
            'INSERT INTO product_images (product_id, image_url, image_type, sort_order, session_id, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [
              processedProductId,
              filePath,
              image_type,
              i,
              session_id || null,
              req.userId,
              req.userId
            ]
          );
          console.log('写入文件信息到数据库:', file.filename);
          uploadedImages.push({
            id: result.getFirstRow().id,
            filename: file.filename,
            path: filePath,
            name: file.originalname,
            url: filePath
          });
        }
        
        await connection.commit();
        console.log('提交数据库');
        res.json({
          success: true,
          message: getMessage('PRODUCT_IMAGE.UPLOAD_SUCCESS'),
          data: {
            images: uploadedImages,
            image_type: image_type
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
    const result = await query(
      'SELECT id, guid, product_id, image_url, image_type, sort_order, created_at, updated_at FROM product_images WHERE product_id = $1 AND image_type = $2 AND deleted = false ORDER BY sort_order ASC',
      [product_id, image_type]
    );
    const rows = result.getRows();
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
    const connection = await getConnection();
     await connection.beginTransaction();

    try {
      // 获取图片信息
      const result = await connection.query(
        'SELECT image_url FROM product_images WHERE id = $1 AND deleted = false',
        [id]
      );
      const rows = result.getRows();

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('PRODUCT_IMAGE.NOT_FOUND'),
          data: null
        });
      }

      // 软删除图片记录
      await connection.query(
        'UPDATE product_images SET deleted = true, updated_by = $1 WHERE id = $2',
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
    const connection = await getConnection();
     await connection.beginTransaction();

    try {
      for (const image of images) {
        await connection.query(
          'UPDATE product_images SET sort_order = $1, updated_by = $2 WHERE id = $3 AND deleted = false',
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
    await query(
      'UPDATE product_images SET product_id = $1 WHERE product_id IS NULL AND session_id = $2',
      [product_id, session_id]
    );
    res.json({ success: true, message: getMessage('PRODUCT_IMAGE.ASSIGN_SUCCESS') });
  } catch (err) {
    res.status(500).json({ success: false, message: getMessage('PRODUCT_IMAGE.ASSIGN_FAILED'), data: { error: err.message } });
  }
};