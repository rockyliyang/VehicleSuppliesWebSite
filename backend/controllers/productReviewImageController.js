const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { getConnection, query } = require('../db/db');
const { getMessage } = require('../config/messages');

// 配置multer存储
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const userId = req.userId;
      const uploadDir = path.join(process.cwd(), 'public', 'static', 'user', userId.toString());
      
      // 确保目录存在
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `review-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查文件类型
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'));
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB限制
    files: 5 // 最多5个文件
  },
  fileFilter: fileFilter
});

// 上传评论图片
exports.uploadReviewImages = async (req, res) => {
  try {
    const uploadMiddleware = upload.array('images', 5);
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: getMessage('PRODUCT_REVIEW_IMAGE.FILE_TOO_LARGE'),
              data: null
            });
          } else if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              message: getMessage('PRODUCT_REVIEW_IMAGE.TOO_MANY_FILES'),
              data: null
            });
          }
        }
        return res.status(400).json({
          success: false,
          message: err.message || getMessage('PRODUCT_REVIEW_IMAGE.UPLOAD_FAILED'),
          data: null
        });
      }

      try {
        const { review_id, session_id } = req.body;
        const user_id = req.userId;

        // review_id 和 session_id 至少需要一个
        if (!review_id && !session_id) {
          // 清理已上传的文件
          if (req.files) {
            for (const file of req.files) {
              try {
                await fs.unlink(file.path);
              } catch (unlinkErr) {
                console.error('删除文件失败:', unlinkErr);
              }
            }
          }
          return res.status(400).json({
            success: false,
            message: getMessage('PRODUCT_REVIEW_IMAGE.REVIEW_ID_OR_SESSION_ID_REQUIRED'),
            data: null
          });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            message: getMessage('PRODUCT_REVIEW_IMAGE.NO_FILES'),
            data: null
          });
        }

        const connection = await getConnection();
        await connection.beginTransaction();

        try {
          let currentSort = 0;
          
          // 如果有review_id，验证评论是否存在且属于当前用户
          if (review_id) {
            const reviewResult = await connection.query(
              'SELECT id, user_id FROM product_reviews WHERE id = $1 AND deleted = false',
              [review_id]
            );

            if (reviewResult.getRows().length === 0) {
              // 清理已上传的文件
              for (const file of req.files) {
                try {
                  await fs.unlink(file.path);
                } catch (unlinkErr) {
                  console.error('删除文件失败:', unlinkErr);
                }
              }
              return res.status(404).json({
                success: false,
                message: getMessage('PRODUCT_REVIEW.NOT_FOUND'),
                data: null
              });
            }

            const review = reviewResult.getFirstRow();
            if (review.user_id !== user_id) {
              // 清理已上传的文件
              for (const file of req.files) {
                try {
                  await fs.unlink(file.path);
                } catch (unlinkErr) {
                  console.error('删除文件失败:', unlinkErr);
                }
              }
              return res.status(403).json({
                success: false,
                message: getMessage('PRODUCT_REVIEW.PERMISSION_DENIED'),
                data: null
              });
            }

            // 检查该评论已有的图片数量
            const existingImagesResult = await connection.query(
              'SELECT COUNT(*) as count FROM product_review_images WHERE review_id = $1 AND deleted = false',
              [review_id]
            );
            const existingCount = parseInt(existingImagesResult.getFirstRow().count);

            if (existingCount + req.files.length > 5) {
              // 清理已上传的文件
              for (const file of req.files) {
                try {
                  await fs.unlink(file.path);
                } catch (unlinkErr) {
                  console.error('删除文件失败:', unlinkErr);
                }
              }
              return res.status(400).json({
                success: false,
                message: getMessage('PRODUCT_REVIEW_IMAGE.TOO_MANY_IMAGES'),
                data: null
              });
            }

            // 获取当前最大排序号
            const maxSortResult = await connection.query(
              'SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM product_review_images WHERE review_id = $1 AND deleted = false',
              [review_id]
            );
            currentSort = parseInt(maxSortResult.getFirstRow().max_sort);
          } else if (session_id) {
            // 如果只有session_id，检查该session已有的图片数量
            const existingImagesResult = await connection.query(
              'SELECT COUNT(*) as count FROM product_review_images WHERE session_id = $1 AND review_id IS NULL AND deleted = false',
              [session_id]
            );
            const existingCount = parseInt(existingImagesResult.getFirstRow().count);

            if (existingCount + req.files.length > 5) {
              // 清理已上传的文件
              for (const file of req.files) {
                try {
                  await fs.unlink(file.path);
                } catch (unlinkErr) {
                  console.error('删除文件失败:', unlinkErr);
                }
              }
              return res.status(400).json({
                success: false,
                message: getMessage('PRODUCT_REVIEW_IMAGE.TOO_MANY_IMAGES'),
                data: null
              });
            }

            // 获取当前最大排序号
            const maxSortResult = await connection.query(
              'SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM product_review_images WHERE session_id = $1 AND review_id IS NULL AND deleted = false',
              [session_id]
            );
            currentSort = parseInt(maxSortResult.getFirstRow().max_sort);
          }

          const uploadedImages = [];

          // 保存图片信息到数据库
          for (const file of req.files) {
            currentSort++;
            const relativePath = `/static/user/${user_id}/${file.filename}`;
            
            const result = await connection.query(
              `INSERT INTO product_review_images 
               (review_id, session_id, image_url, sort_order, created_by, updated_by) 
               VALUES ($1, $2, $3, $4, $5, $6) 
               RETURNING id, guid, image_url, sort_order, created_at`,
              [review_id || null, session_id || null, relativePath, currentSort, user_id, user_id]
            );

            const newImage = result.getFirstRow();
            uploadedImages.push({
              id: newImage.id,
              guid: newImage.guid,
              image_url: newImage.image_url,
              sort_order: newImage.sort_order,
              created_at: newImage.created_at
            });
          }

          await connection.commit();

          res.status(201).json({
            success: true,
            message: getMessage('PRODUCT_REVIEW_IMAGE.UPLOAD_SUCCESS'),
            data: {
              images: uploadedImages,
              total_uploaded: uploadedImages.length
            }
          });
        } catch (error) {
          await connection.rollback();
          // 清理已上传的文件
          for (const file of req.files) {
            try {
              await fs.unlink(file.path);
            } catch (unlinkErr) {
              console.error('删除文件失败:', unlinkErr);
            }
          }
          throw error;
        } finally {
          connection.release();
        }
      } catch (err) {
        console.error('上传评论图片失败:', err);
        res.status(500).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW_IMAGE.UPLOAD_FAILED'),
          data: { error: err.message }
        });
      }
    });
  } catch (err) {
    console.error('上传评论图片失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW_IMAGE.UPLOAD_FAILED'),
      data: { error: err.message }
    });
  }
};

// 获取评论图片列表
exports.getReviewImages = async (req, res) => {
  try {
    const { review_id } = req.params;

    if (!review_id) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW_IMAGE.REVIEW_ID_REQUIRED'),
        data: null
      });
    }

    // 验证评论是否存在
    const reviewResult = await query(
      'SELECT id, user_id, status FROM product_reviews WHERE id = $1 AND deleted = false',
      [review_id]
    );

    if (reviewResult.getRows().length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.NOT_FOUND'),
        data: null
      });
    }

    const review = reviewResult.getFirstRow();

    // 权限检查：普通用户只能查看已审核通过的评论图片或自己的评论图片
    if (req.userRole !== 'admin' && review.status !== 'approved' && review.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.PERMISSION_DENIED'),
        data: null
      });
    }

    // 获取图片列表
    const imagesResult = await query(
      `SELECT id, guid, image_url, sort_order, created_at, updated_at
       FROM product_review_images 
       WHERE review_id = $1 AND deleted = false 
       ORDER BY sort_order ASC`,
      [review_id]
    );

    const images = imagesResult.getRows();

    res.json({
      success: true,
      message: getMessage('PRODUCT_REVIEW_IMAGE.LIST_GET_SUCCESS'),
      data: {
        review_id: parseInt(review_id),
        images,
        total: images.length
      }
    });
  } catch (err) {
    console.error('获取评论图片列表失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW_IMAGE.LIST_GET_FAILED'),
      data: { error: err.message }
    });
  }
};

// 更新图片排序
exports.updateImageOrder = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { image_orders } = req.body; // [{ id: 1, sort_order: 1 }, { id: 2, sort_order: 2 }]
    const user_id = req.userId;

    if (!review_id) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW_IMAGE.REVIEW_ID_REQUIRED'),
        data: null
      });
    }

    if (!image_orders || !Array.isArray(image_orders) || image_orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('INVALID_PARAMS'),
        data: null
      });
    }

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // 验证评论是否存在且属于当前用户
      const reviewResult = await connection.query(
        'SELECT id, user_id FROM product_reviews WHERE id = $1 AND deleted = false',
        [review_id]
      );

      if (reviewResult.getRows().length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW.NOT_FOUND'),
          data: null
        });
      }

      const review = reviewResult.getFirstRow();
      if (review.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW.PERMISSION_DENIED'),
          data: null
        });
      }

      // 验证所有图片都属于该评论
      const imageIds = image_orders.map(item => item.id);
      const existingImagesResult = await connection.query(
        'SELECT id FROM product_review_images WHERE id = ANY($1) AND review_id = $2 AND deleted = false',
        [imageIds, review_id]
      );

      if (existingImagesResult.getRows().length !== imageIds.length) {
        return res.status(400).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW_IMAGE.INVALID_IMAGE_IDS'),
          data: null
        });
      }

      // 更新排序
      for (const item of image_orders) {
        await connection.query(
          'UPDATE product_review_images SET sort_order = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [item.sort_order, user_id, item.id]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: getMessage('PRODUCT_REVIEW_IMAGE.ORDER_UPDATE_SUCCESS'),
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
      message: getMessage('PRODUCT_REVIEW_IMAGE.ORDER_UPDATE_FAILED'),
      data: { error: err.message }
    });
  }
};

// 分配评论图片（将session_id关联的图片分配给评论）
exports.assignReviewImages = async (req, res) => {
  try {
    const { review_id, session_id } = req.body;
    
    if (!review_id || !session_id) {
      return res.status(400).json({ 
        success: false, 
        message: getMessage('PRODUCT_REVIEW_IMAGE.MISSING_PARAMS'), 
        data: null 
      });
    }

    await query(
      'UPDATE product_review_images SET review_id = $1 WHERE review_id IS NULL AND session_id = $2',
      [review_id, session_id]
    );

    res.json({ 
      success: true, 
      message: getMessage('PRODUCT_REVIEW_IMAGE.ASSIGN_SUCCESS') 
    });
  } catch (err) {
    console.error('分配评论图片失败:', err);
    res.status(500).json({ 
      success: false, 
      message: getMessage('PRODUCT_REVIEW_IMAGE.ASSIGN_FAILED'), 
      data: { error: err.message } 
    });
  }
};

// 删除评论图片
exports.deleteReviewImage = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.userId;
    const user_role = req.userRole;

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // 获取图片信息
      const imageResult = await connection.query(
        `SELECT pri.id, pri.image_url, pri.review_id, pr.user_id
         FROM product_review_images pri
         JOIN product_reviews pr ON pri.review_id = pr.id
         WHERE pri.id = $1 AND pri.deleted = false AND pr.deleted = false`,
        [id]
      );

      if (imageResult.getRows().length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW_IMAGE.NOT_FOUND'),
          data: null
        });
      }

      const image = imageResult.getFirstRow();

      // 权限检查：只有图片所属评论的作者或管理员可以删除
      if (image.user_id !== user_id && user_role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW.PERMISSION_DENIED'),
          data: null
        });
      }

      // 软删除图片记录
      await connection.query(
        'UPDATE product_review_images SET deleted = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [user_id, id]
      );

      await connection.commit();

      // 尝试删除物理文件
      try {
        const filePath = path.join(process.cwd(), 'public', image.image_url);
        await fs.unlink(filePath);
      } catch (fileErr) {
        console.error('删除物理文件失败:', fileErr);
        // 不影响接口返回，只记录错误
      }

      res.json({
        success: true,
        message: getMessage('PRODUCT_REVIEW_IMAGE.DELETE_SUCCESS'),
        data: null
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('删除评论图片失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW_IMAGE.DELETE_FAILED'),
      data: { error: err.message }
    });
  }
};

// 获取单个图片详情
exports.getReviewImage = async (req, res) => {
  try {
    const { id } = req.params;

    const imageResult = await query(
      `SELECT pri.id, pri.guid, pri.image_url, pri.sort_order, pri.created_at, pri.updated_at,
              pri.review_id, pr.user_id, pr.status
       FROM product_review_images pri
       JOIN product_reviews pr ON pri.review_id = pr.id
       WHERE pri.id = $1 AND pri.deleted = false AND pr.deleted = false`,
      [id]
    );

    if (imageResult.getRows().length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW_IMAGE.NOT_FOUND'),
        data: null
      });
    }

    const image = imageResult.getFirstRow();

    // 权限检查：普通用户只能查看已审核通过的评论图片或自己的评论图片
    if (req.userRole !== 'admin' && image.status !== 'approved' && image.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.PERMISSION_DENIED'),
        data: null
      });
    }

    res.json({
      success: true,
      message: getMessage('PRODUCT_REVIEW_IMAGE.GET_SUCCESS'),
      data: {
        id: image.id,
        guid: image.guid,
        image_url: image.image_url,
        sort_order: image.sort_order,
        review_id: image.review_id,
        created_at: image.created_at,
        updated_at: image.updated_at
      }
    });
  } catch (err) {
    console.error('获取评论图片详情失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW_IMAGE.GET_FAILED'),
      data: { error: err.message }
    });
  }
};

// 批量删除评论图片
exports.batchDeleteReviewImages = async (req, res) => {
  try {
    const { image_ids } = req.body;
    const user_id = req.userId;
    const user_role = req.userRole;

    if (!image_ids || !Array.isArray(image_ids) || image_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('INVALID_PARAMS'),
        data: null
      });
    }

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // 获取所有图片信息
      const imagesResult = await connection.query(
        `SELECT pri.id, pri.image_url, pri.review_id, pr.user_id
         FROM product_review_images pri
         JOIN product_reviews pr ON pri.review_id = pr.id
         WHERE pri.id = ANY($1) AND pri.deleted = false AND pr.deleted = false`,
        [image_ids]
      );

      const images = imagesResult.getRows();

      if (images.length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW_IMAGE.NOT_FOUND'),
          data: null
        });
      }

      // 权限检查：只有图片所属评论的作者或管理员可以删除
      for (const image of images) {
        if (image.user_id !== user_id && user_role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: getMessage('PRODUCT_REVIEW.PERMISSION_DENIED'),
            data: null
          });
        }
      }

      // 批量软删除图片记录
      await connection.query(
        'UPDATE product_review_images SET deleted = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2)',
        [user_id, image_ids]
      );

      await connection.commit();

      // 尝试删除物理文件
      for (const image of images) {
        try {
          const filePath = path.join(process.cwd(), 'public', image.image_url);
          await fs.unlink(filePath);
        } catch (fileErr) {
          console.error('删除物理文件失败:', fileErr);
          // 不影响接口返回，只记录错误
        }
      }

      res.json({
        success: true,
        message: getMessage('PRODUCT_REVIEW_IMAGE.BATCH_DELETE_SUCCESS'),
        data: {
          deleted_count: images.length
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('批量删除评论图片失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW_IMAGE.BATCH_DELETE_FAILED'),
      data: { error: err.message }
    });
  }
};