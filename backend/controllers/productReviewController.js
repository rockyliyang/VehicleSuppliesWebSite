const { getConnection, query } = require('../db/db');
const { getMessage } = require('../config/messages');

// 创建产品评论
exports.createReview = async (req, res) => {
  try {
    const { product_id, rating, review_content, is_anonymous = false, session_id } = req.body;
    const user_id = req.userId;

    // 验证必填字段
    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.PRODUCT_ID_REQUIRED'),
        data: null
      });
    }

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.RATING_REQUIRED'),
        data: null
      });
    }

    // 验证评分范围
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.INVALID_RATING'),
        data: null
      });
    }

    // 验证评论内容长度
    if (review_content && review_content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.REVIEW_CONTENT_TOO_LONG'),
        data: null
      });
    }

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // 检查用户是否已经评论过该产品
      const existingReview = await connection.query(
        'SELECT id FROM product_reviews WHERE user_id = $1 AND product_id = $2 AND deleted = false',
        [user_id, product_id]
      );

      if (existingReview.getRows().length > 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW.ALREADY_REVIEWED'),
          data: null
        });
      }

      // 验证产品是否存在
      const productResult = await connection.query(
        'SELECT id FROM products WHERE id = $1 AND deleted = false',
        [product_id]
      );

      if (productResult.getRows().length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('PRODUCT.NOT_FOUND'),
          data: null
        });
      }

      // 创建评论
      const result = await connection.query(
        `INSERT INTO product_reviews 
         (product_id, user_id, rating, review_content, is_anonymous, created_by, updated_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, guid, created_at`,
        [product_id, user_id, rating, review_content, is_anonymous, user_id, user_id]
      );

      await connection.commit();

      const reviewId = result.getFirstRow().id;

      // 如果有session_id，将相关的图片关联到这个评论
      if (session_id) {
        await connection.query(
          'UPDATE product_review_images SET review_id = $1 WHERE review_id IS NULL AND session_id = $2',
          [reviewId, session_id]
        );
      }

      const newReview = result.getFirstRow();
      res.status(201).json({
        success: true,
        message: getMessage('PRODUCT_REVIEW.CREATE_SUCCESS'),
        data: {
          id: newReview.id,
          guid: newReview.guid,
          product_id,
          rating,
          review_content,
          is_anonymous,
          created_at: newReview.created_at
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('创建评论失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW.CREATE_FAILED'),
      data: { error: err.message }
    });
  }
};

// 获取产品评论列表
exports.getProductReviews = async (req, res) => {
  try {
    const { product_id, page = 1, limit = 10, status = 'approved' } = req.query;
    const offset = (page - 1) * limit;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.PRODUCT_ID_REQUIRED'),
        data: null
      });
    }

    // 构建查询条件
    let whereClause = 'WHERE pr.product_id = $1 AND pr.deleted = false';
    let params = [product_id];
    let paramIndex = 2;

    // 非管理员只能看到已审核通过的评论
    if (req.userRole !== 'admin') {
      whereClause += ` AND pr.status = 'approved'`;
    } else if (status && status !== 'all') {
      whereClause += ` AND pr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // 获取评论列表
    const reviewsQuery = `
      SELECT 
        pr.id,
        pr.guid,
        pr.product_id,
        pr.user_id,
        pr.rating,
        pr.review_content,
        pr.is_anonymous,
        pr.status,
        pr.admin_reply,
        pr.admin_reply_at,
        pr.created_at,
        pr.updated_at,
        CASE 
          WHEN pr.is_anonymous = true THEN 'Anonymous'
          ELSE u.username
        END as reviewer_name,
        u.avatar_url as reviewer_avatar
      FROM product_reviews pr
      LEFT JOIN users u ON pr.user_id = u.id
      ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const reviewsResult = await query(reviewsQuery, params);
    const reviews = reviewsResult.getRows();

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM product_reviews pr
      ${whereClause}
    `;
    const countResult = await query(countQuery, params.slice(0, -2)); // 移除limit和offset参数
    const total = parseInt(countResult.getFirstRow().total);

    // 获取每个评论的图片
    for (let review of reviews) {
      const imagesResult = await query(
        'SELECT id, image_url, sort_order FROM product_review_images WHERE review_id = $1 AND deleted = false ORDER BY sort_order ASC',
        [review.id]
      );
      review.images = imagesResult.getRows();
    }

    res.json({
      success: true,
      message: getMessage('PRODUCT_REVIEW.LIST_GET_SUCCESS'),
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    console.error('获取评论列表失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW.LIST_GET_FAILED'),
      data: { error: err.message }
    });
  }
};

// 获取单个评论详情
exports.getReview = async (req, res) => {
  try {
    const { id } = req.params;

    const reviewQuery = `
      SELECT 
        pr.id,
        pr.guid,
        pr.product_id,
        pr.user_id,
        pr.rating,
        pr.review_content,
        pr.is_anonymous,
        pr.status,
        pr.admin_reply,
        pr.admin_reply_at,
        pr.admin_reply_by,
        pr.created_at,
        pr.updated_at,
        CASE 
          WHEN pr.is_anonymous = true THEN 'Anonymous'
          ELSE u.username
        END as reviewer_name,
        u.avatar_url as reviewer_avatar,
        p.name as product_name,
        admin_user.username as admin_reply_username
      FROM product_reviews pr
      LEFT JOIN users u ON pr.user_id = u.id
      LEFT JOIN products p ON pr.product_id = p.id
      LEFT JOIN users admin_user ON pr.admin_reply_by = admin_user.id
      WHERE pr.id = $1 AND pr.deleted = false
    `;

    const result = await query(reviewQuery, [id]);
    const rows = result.getRows();

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.NOT_FOUND'),
        data: null
      });
    }

    const review = rows[0];

    // 权限检查：普通用户只能查看已审核通过的评论或自己的评论
    if (req.userRole !== 'admin' && review.status !== 'approved' && review.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.PERMISSION_DENIED'),
        data: null
      });
    }

    // 获取评论图片
    const imagesResult = await query(
      'SELECT id, image_url, sort_order FROM product_review_images WHERE review_id = $1 AND deleted = false ORDER BY sort_order ASC',
      [id]
    );
    review.images = imagesResult.getRows();

    res.json({
      success: true,
      message: getMessage('PRODUCT_REVIEW.GET_SUCCESS'),
      data: review
    });
  } catch (err) {
    console.error('获取评论详情失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW.GET_FAILED'),
      data: { error: err.message }
    });
  }
};

// 更新评论（用户只能更新自己的评论）
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review_content, is_anonymous } = req.body;
    const user_id = req.userId;
    const session_id = req.sessionId;

    // 验证session_id
    if (!session_id) {
      return res.status(401).json({
        success: false,
        message: getMessage('AUTH.SESSION_REQUIRED'),
        data: null
      });
    }

    // 验证评分范围
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.INVALID_RATING'),
        data: null
      });
    }

    // 验证评论内容长度
    if (review_content && review_content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.REVIEW_CONTENT_TOO_LONG'),
        data: null
      });
    }

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // 检查评论是否存在且属于当前用户
      const existingReview = await connection.query(
        'SELECT id, user_id, status FROM product_reviews WHERE id = $1 AND deleted = false',
        [id]
      );

      if (existingReview.getRows().length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW.NOT_FOUND'),
          data: null
        });
      }

      const review = existingReview.getFirstRow();

      // 权限检查：只有评论作者可以修改
      if (review.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW.PERMISSION_DENIED'),
          data: null
        });
      }

      // 构建更新字段
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (rating !== undefined) {
        updateFields.push(`rating = $${paramIndex}`);
        updateValues.push(rating);
        paramIndex++;
      }

      if (review_content !== undefined) {
        updateFields.push(`review_content = $${paramIndex}`);
        updateValues.push(review_content);
        paramIndex++;
      }

      if (is_anonymous !== undefined) {
        updateFields.push(`is_anonymous = $${paramIndex}`);
        updateValues.push(is_anonymous);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: getMessage('USER_MANAGEMENT.NO_FIELDS_TO_UPDATE'),
          data: null
        });
      }

      updateFields.push(`updated_by = $${paramIndex}`);
      updateValues.push(user_id);
      paramIndex++;

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      updateValues.push(id);

      const updateQuery = `
        UPDATE product_reviews 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND deleted = false
        RETURNING id, rating, review_content, is_anonymous, updated_at
      `;

      const result = await connection.query(updateQuery, updateValues);
      await connection.commit();

      const updatedReview = result.getFirstRow();
      res.json({
        success: true,
        message: getMessage('PRODUCT_REVIEW.UPDATE_SUCCESS'),
        data: updatedReview
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('更新评论失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW.UPDATE_FAILED'),
      data: { error: err.message }
    });
  }
};

// 删除评论
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // 检查评论是否存在
      const checkResult = await connection.query(
        'SELECT id, user_id FROM product_reviews WHERE id = $1 AND deleted = false',
        [id]
      );

      if (checkResult.getRows().length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW.NOT_FOUND'),
          data: null
        });
      }

      const review = checkResult.getFirstRow();
      
      // 权限检查：用户只能删除自己的评论，管理员可以删除所有评论
      if (userRole !== 'admin' && review.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW.PERMISSION_DENIED'),
          data: null
        });
      }

      // 软删除评论
      await connection.query(
        'UPDATE product_reviews SET deleted = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [userId, id]
      );

      // 同时软删除相关的图片
      await connection.query(
        'UPDATE product_review_images SET deleted = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE review_id = $2',
        [userId, id]
      );

      await connection.commit();

      res.json({
        success: true,
        message: getMessage('PRODUCT_REVIEW.DELETE_SUCCESS'),
        data: null
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('删除评论失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW.DELETE_FAILED'),
      data: { error: err.message }
    });
  }
};

// 管理员回复评论
exports.adminReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_reply } = req.body;
    const admin_id = req.userId;

    if (!admin_reply || admin_reply.trim() === '') {
      return res.status(400).json({
        success: false,
        message: getMessage('INVALID_PARAMS'),
        data: null
      });
    }

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // 检查评论是否存在
      const existingReview = await connection.query(
        'SELECT id FROM product_reviews WHERE id = $1 AND deleted = false',
        [id]
      );

      if (existingReview.getRows().length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW.NOT_FOUND'),
          data: null
        });
      }

      // 更新管理员回复
      const result = await connection.query(
        `UPDATE product_reviews 
         SET admin_reply = $1, admin_reply_at = CURRENT_TIMESTAMP, admin_reply_by = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND deleted = false
         RETURNING admin_reply, admin_reply_at`,
        [admin_reply, admin_id, admin_id, id]
      );

      await connection.commit();

      const updatedReview = result.getFirstRow();
      res.json({
        success: true,
        message: getMessage('PRODUCT_REVIEW.ADMIN_REPLY_SUCCESS'),
        data: {
          admin_reply: updatedReview.admin_reply,
          admin_reply_at: updatedReview.admin_reply_at
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('管理员回复失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW.ADMIN_REPLY_FAILED'),
      data: { error: err.message }
    });
  }
};

// 管理员更新评论状态
exports.updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const admin_id = req.userId;

    // 验证状态值
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.INVALID_STATUS'),
        data: null
      });
    }

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // 检查评论是否存在
      const existingReview = await connection.query(
        'SELECT id FROM product_reviews WHERE id = $1 AND deleted = false',
        [id]
      );

      if (existingReview.getRows().length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW.NOT_FOUND'),
          data: null
        });
      }

      // 更新状态
      const result = await connection.query(
        `UPDATE product_reviews 
         SET status = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND deleted = false
         RETURNING status, updated_at`,
        [status, admin_id, id]
      );

      await connection.commit();

      const updatedReview = result.getFirstRow();
      res.json({
        success: true,
        message: getMessage('PRODUCT_REVIEW.STATUS_UPDATE_SUCCESS'),
        data: {
          status: updatedReview.status,
          updated_at: updatedReview.updated_at
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('更新评论状态失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW.STATUS_UPDATE_FAILED'),
      data: { error: err.message }
    });
  }
};

// 获取产品评论统计信息
exports.getReviewStats = async (req, res) => {
  try {
    const { product_id } = req.query;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.PRODUCT_ID_REQUIRED'),
        data: null
      });
    }

    // 获取评论统计
    const statsQuery = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM product_reviews 
      WHERE product_id = $1 AND status = 'approved' AND deleted = false
    `;

    const result = await query(statsQuery, [product_id]);
    const stats = result.getFirstRow();

    // 格式化平均评分
    stats.average_rating = stats.average_rating ? parseFloat(stats.average_rating).toFixed(1) : '0.0';
    stats.total_reviews = parseInt(stats.total_reviews);

    res.json({
      success: true,
      message: getMessage('PRODUCT_REVIEW.STATS_GET_SUCCESS'),
      data: stats
    });
  } catch (err) {
    console.error('获取评论统计失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW.STATS_GET_FAILED'),
      data: { error: err.message }
    });
  }
};

// 管理员获取所有评论列表（用于后台管理）
exports.getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, product_id, user_id } = req.query;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = 'WHERE pr.deleted = false';
    let params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      whereClause += ` AND pr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (product_id) {
      whereClause += ` AND pr.product_id = $${paramIndex}`;
      params.push(product_id);
      paramIndex++;
    }

    if (user_id) {
      whereClause += ` AND pr.user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    // 获取评论列表
    const reviewsQuery = `
      SELECT 
        pr.id,
        pr.guid,
        pr.product_id,
        pr.user_id,
        pr.rating,
        pr.review_content,
        pr.is_anonymous,
        pr.status,
        pr.admin_reply,
        pr.admin_reply_at,
        pr.created_at,
        pr.updated_at,
        u.username as reviewer_name,
        u.email as reviewer_email,
        p.name as product_name,
        p.product_code,
        admin_user.username as admin_reply_username
      FROM product_reviews pr
      LEFT JOIN users u ON pr.user_id = u.id
      LEFT JOIN products p ON pr.product_id = p.id
      LEFT JOIN users admin_user ON pr.admin_reply_by = admin_user.id
      ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const reviewsResult = await query(reviewsQuery, params);
    const reviews = reviewsResult.getRows();

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM product_reviews pr
      ${whereClause}
    `;
    const countResult = await query(countQuery, params.slice(0, -2)); // 移除limit和offset参数
    const total = parseInt(countResult.getFirstRow().total);

    res.json({
      success: true,
      message: getMessage('PRODUCT_REVIEW.LIST_GET_SUCCESS'),
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    console.error('获取所有评论列表失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW.LIST_GET_FAILED'),
      data: { error: err.message }
    });
  }
};

// 管理员审核评论
exports.approveReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' 或 'rejected'
    const admin_id = req.userId;

    // 验证状态值
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.INVALID_STATUS'),
        data: null
      });
    }

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // 检查评论是否存在
      const existingReview = await connection.query(
        'SELECT id, status FROM product_reviews WHERE id = $1 AND deleted = false',
        [id]
      );

      if (existingReview.getRows().length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW.NOT_FOUND'),
          data: null
        });
      }

      // 更新审核状态
      const result = await connection.query(
        `UPDATE product_reviews 
         SET status = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND deleted = false
         RETURNING id, status, updated_at`,
        [status, admin_id, id]
      );

      await connection.commit();

      const updatedReview = result.getFirstRow();
      res.json({
        success: true,
        message: getMessage('PRODUCT_REVIEW.APPROVE_SUCCESS'),
        data: {
          id: updatedReview.id,
          status: updatedReview.status,
          updated_at: updatedReview.updated_at
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('审核评论失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW.APPROVE_FAILED'),
      data: { error: err.message }
    });
  }
};

// 管理员回复评论
exports.replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_reply } = req.body;
    const admin_id = req.userId;

    // 验证回复内容
    if (!admin_reply || admin_reply.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.REPLY_REQUIRED'),
        data: null
      });
    }

    if (admin_reply.length > 1000) {
      return res.status(400).json({
        success: false,
        message: getMessage('PRODUCT_REVIEW.REPLY_TOO_LONG'),
        data: null
      });
    }

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // 检查评论是否存在
      const existingReview = await connection.query(
        'SELECT id, status FROM product_reviews WHERE id = $1 AND deleted = false',
        [id]
      );

      if (existingReview.getRows().length === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('PRODUCT_REVIEW.NOT_FOUND'),
          data: null
        });
      }

      // 添加管理员回复
      const result = await connection.query(
        `UPDATE product_reviews 
         SET admin_reply = $1, admin_reply_by = $2, admin_reply_at = CURRENT_TIMESTAMP, updated_by = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND deleted = false
         RETURNING id, admin_reply, admin_reply_at`,
        [admin_reply.trim(), admin_id, admin_id, id]
      );

      await connection.commit();

      const updatedReview = result.getFirstRow();
      res.json({
        success: true,
        message: getMessage('PRODUCT_REVIEW.REPLY_SUCCESS'),
        data: {
          id: updatedReview.id,
          admin_reply: updatedReview.admin_reply,
          admin_reply_at: updatedReview.admin_reply_at
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('回复评论失败:', err);
    res.status(500).json({
      success: false,
      message: getMessage('PRODUCT_REVIEW.REPLY_FAILED'),
      data: { error: err.message }
    });
  }
};