const { getConnection, query } = require('../db/db');
const { getMessage } = require('../config/messages');
const path = require('path');
const fs = require('fs');

// 获取前端导航菜单列表
exports.getNavList = async (req, res) => {
    try {
      const { language = 'zh-CN' } = req.query;
      const { contentType = 'about_us' } = req.params;

      const navList = await query(`
        SELECT 
          n.id,
          n.name_key,
          n.content_type,
          n.sort_order,
          n.status,
          COALESCE(lt.value, n.name_key) as title
        FROM common_content_nav n
        LEFT JOIN language_translations lt ON n.name_key = lt.code AND lt.lang = $1 AND lt.deleted = false
        WHERE n.deleted = false AND n.status = 1 AND n.content_type = $2
        ORDER BY n.sort_order ASC, n.id ASC
      `, [language, contentType]);

      res.json({
        success: true,
        message: getMessage('COMMON_CONTENT.NAV_LIST_SUCCESS'),
        data: { navList: navList.getRows() }
      });
    } catch (error) {
      console.error('获取导航菜单失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('COMMON_CONTENT.NAV_LIST_FAILED')
      });
    }
};

// 获取指定导航的内容
exports.getContent = async (req, res) => {
    try {
      const { nameKey, lang: language = 'zh-CN' } = req.params;
      
      if (!nameKey) {
        return res.status(400).json({
          success: false,
          message: getMessage('COMMON_CONTENT.NAME_KEY_REQUIRED')
        });
      }

      // 首先获取导航信息
      const navResult = await query(`
        SELECT 
          n.id,
          n.name_key,
          n.content_type,
          COALESCE(lt.value, n.name_key) as title
        FROM common_content_nav n
        LEFT JOIN language_translations lt ON n.name_key = lt.code AND lt.lang = $1 AND lt.deleted = false
        WHERE n.name_key = $2 AND n.deleted = false AND n.status = 1
      `, [language, nameKey]);

      if (navResult.getRowCount() === 0) {
        return res.status(404).json({
          success: false,
          message: getMessage('COMMON_CONTENT.NAV_NOT_FOUND')
        });
      }

      const nav = navResult.getFirstRow();

      // 获取该导航下的内容（按语言过滤）
      const contentList = await query(`
        SELECT 
          c.id,
          c.nav_id,
          c.language_code,
          c.title,
          c.content,
          c.status,
          c.created_at,
          c.updated_at,
          img.image_url as main_image
        FROM common_content c
        LEFT JOIN common_content_images img ON c.nav_id = img.nav_id AND c.id = img.content_id AND img.image_type = 'main' AND img.deleted = false
        WHERE c.nav_id = $1 AND c.language_code = $2 AND c.deleted = false AND c.status = 1
        ORDER BY c.created_at DESC
      `, [nav.id, language]);

      res.json({
        success: true,
        message: getMessage('COMMON_CONTENT.CONTENT_SUCCESS'),
        data: {
          nav: nav,
          contentList: contentList.getRows()
        }
      });
    } catch (error) {
      console.error('获取内容失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('COMMON_CONTENT.CONTENT_FAILED')
      });
    }
};

// 管理员：获取导航菜单列表
exports.getAdminNavList = async (req, res) => {
  try {
    const { contentType } = req.query;
    
    let queryStr = `
      SELECT 
        id,
        name_key,
        content_type,
        sort_order,
        status,
        created_at,
        updated_at
      FROM common_content_nav
      WHERE deleted = false`;
    
    let params = [];
    
    if (contentType) {
      queryStr += ` AND content_type = $1`;
      params.push(contentType);
    }
    
    queryStr += ` ORDER BY sort_order ASC, id ASC`;
    
    const navList = await query(queryStr, params);

      res.json({
        success: true,
        message: getMessage('COMMON_CONTENT.ADMIN_NAV_LIST_SUCCESS'),
        data: { navList: navList.getRows() }
      });
    } catch (error) {
      console.error('获取管理员导航菜单失败:', error);
      res.status(500).json({
        success: false,
        message: getMessage('COMMON_CONTENT.ADMIN_NAV_LIST_FAILED')
      });
    }
};

// 管理员：添加导航菜单
exports.addNav = async (req, res) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();
        
        const { name_key, content_type = 'about_us', sort_order = 0, status = 1 } = req.body;

        if (!name_key) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: getMessage('COMMON_CONTENT.NAME_KEY_REQUIRED')
            });
        }

        // 检查name_key是否已存在
        const existingNav = await connection.query(
            'SELECT id FROM common_content_nav WHERE name_key = $1 AND content_type = $2 AND deleted = false',
            [name_key, content_type]
        );

        if (existingNav.getRowCount() > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: getMessage('COMMON_CONTENT.NAME_KEY_EXISTS')
            });
        }

        // 插入导航菜单
        const result = await connection.query(
            `INSERT INTO common_content_nav (name_key, content_type, sort_order, status, created_by, updated_by) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [name_key, content_type, sort_order, status, req.userId, req.userId]
        );

        await connection.commit();

        res.json({
            success: true,
            message: getMessage('COMMON_CONTENT.NAV_ADD_SUCCESS'),
            data: {
                id: result.getFirstRow().id,
                name_key,
                content_type,
                sort_order,
                status
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('添加导航菜单失败:', error);
        res.status(500).json({
            success: false,
            message: getMessage('COMMON_CONTENT.NAV_ADD_FAILED')
        });
    } finally {
        connection.release();
    }
};

// 管理员：更新导航菜单
exports.updateNav = async (req, res) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const { name_key, content_type, sort_order, status } = req.body;

        // 检查导航是否存在
        const navCheck = await connection.query(
            'SELECT id FROM common_content_nav WHERE id = $1 AND deleted = false',
            [id]
        );

        if (navCheck.getRowCount() === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: getMessage('COMMON_CONTENT.NAV_NOT_FOUND')
            });
        }

        // 如果更新name_key，检查是否与其他记录冲突
        if (name_key) {
            const existingNav = await connection.query(
                'SELECT id FROM common_content_nav WHERE name_key = $1 AND content_type = $2 AND id != $3 AND deleted = false',
                [name_key, content_type || 'about_us', id]
            );

            if (existingNav.getRowCount() > 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: getMessage('COMMON_CONTENT.NAME_KEY_EXISTS')
                });
            }
        }

        // 构建更新字段
        const updateFields = [];
        const updateValues = [];

        if (name_key !== undefined) {
            updateFields.push(`name_key = $${updateValues.length + 1}`);
            updateValues.push(name_key);
        }
        if (content_type !== undefined) {
            updateFields.push(`content_type = $${updateValues.length + 1}`);
            updateValues.push(content_type);
        }

        if (status !== undefined) {
            updateFields.push(`status = $${updateValues.length + 1}`);
            updateValues.push(status);
        }

        if (updateFields.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: getMessage('COMMON_CONTENT.NO_UPDATE_FIELDS')
            });
        }

        updateFields.push('updated_at = NOW()');
        updateFields.push(`updated_by = $${updateValues.length + 1}`);
        updateValues.push(req.userId);
        updateValues.push(id);

        await connection.query(
            `UPDATE common_content_nav SET ${updateFields.join(', ')} WHERE id = $${updateValues.length}`,
            updateValues
        );

        await connection.commit();

        res.json({
            success: true,
            message: getMessage('COMMON_CONTENT.NAV_UPDATE_SUCCESS'),
            data: null
        });
    } catch (error) {
        await connection.rollback();
        console.error('更新导航菜单失败:', error);
        res.status(500).json({
            success: false,
            message: getMessage('COMMON_CONTENT.NAV_UPDATE_FAILED')
        });
    } finally {
        connection.release();
    }
};

// 管理员：删除导航菜单（软删除）
exports.deleteNav = async (req, res) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;

        // 检查导航是否存在
        const navCheck = await connection.query(
            'SELECT id FROM common_content_nav WHERE id = $1 AND deleted = false',
            [id]
        );

        if (navCheck.getRowCount() === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: getMessage('COMMON_CONTENT.NAV_NOT_FOUND')
            });
        }

        // 软删除导航菜单
        await connection.query(
            'UPDATE common_content_nav SET deleted = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [req.userId, id]
        );

        // 软删除相关的内容
        await connection.query(
            'UPDATE common_content SET deleted = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE nav_id = $2',
            [req.userId, id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: getMessage('COMMON_CONTENT.NAV_DELETE_SUCCESS'),
            data: null
        });
    } catch (error) {
        await connection.rollback();
        console.error('删除导航菜单失败:', error);
        res.status(500).json({
            success: false,
            message: getMessage('COMMON_CONTENT.NAV_DELETE_FAILED')
        });
    } finally {
        connection.release();
    }
};

// 管理员：获取指定导航的所有内容
exports.getAdminContentList = async (req, res) => {
    try {
        const { navId } = req.params;

        if (!navId) {
            return res.status(400).json({
                success: false,
                message: getMessage('COMMON_CONTENT.NAV_ID_REQUIRED')
            });
        }

        // 检查导航是否存在
        const navCheck = await query(
            'SELECT id, name_key FROM common_content_nav WHERE id = $1 AND deleted = false',
            [navId]
        );

        if (navCheck.getRowCount() === 0) {
            return res.status(404).json({
                success: false,
                message: getMessage('COMMON_CONTENT.NAV_NOT_FOUND')
            });
        }

        // 获取该导航下的所有内容
        const contentList = await query(`
            SELECT 
                c.id,
                c.nav_id,
                c.language_code,
                c.title,
                c.content,
                c.status,
                c.created_at,
                c.updated_at,
                img.image_url as main_image
            FROM common_content c
            LEFT JOIN common_content_images img ON c.nav_id = img.nav_id AND c.id=img.content_id AND img.image_type = 'main' AND img.deleted = false 
            WHERE c.nav_id = $1 AND c.deleted = false
            ORDER BY c.created_at DESC
        `, [navId]);

        res.json({
            success: true,
            message: getMessage('COMMON_CONTENT.ADMIN_CONTENT_LIST_SUCCESS'),
            data: {
                nav: navCheck.getFirstRow(),
                contentList: contentList.getRows()
            }
        });
    } catch (error) {
        console.error('获取管理员内容列表失败:', error);
        res.status(500).json({
            success: false,
            message: getMessage('COMMON_CONTENT.ADMIN_CONTENT_LIST_FAILED')
        });
    }
};

// 管理员：添加内容
exports.addContent = async (req, res) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();
        
        const { nav_id, language_code = 'zh-CN', title, content, status = 1 } = req.body;

        if (!nav_id || !title || !content) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: getMessage('COMMON_CONTENT.REQUIRED_FIELDS_MISSING')
            });
        }

        // 检查导航是否存在
        const navCheck = await connection.query(
            'SELECT id FROM common_content_nav WHERE id = $1 AND deleted = false',
            [nav_id]
        );

        if (navCheck.getRowCount() === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: getMessage('COMMON_CONTENT.NAV_NOT_FOUND')
            });
        }

        // 插入内容
        const result = await connection.query(
            `INSERT INTO common_content (nav_id, language_code, title, content, status, created_by, updated_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [nav_id, language_code, title, content, status, req.userId, req.userId]
        );

        await connection.commit();

        res.json({
            success: true,
            message: getMessage('COMMON_CONTENT.CONTENT_ADD_SUCCESS'),
            data: {
                id: result.getFirstRow().id,
                nav_id,
                language_code,
                title,
                content,
                status
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('添加内容失败:', error);
        res.status(500).json({
            success: false,
            message: getMessage('COMMON_CONTENT.CONTENT_ADD_FAILED')
        });
    } finally {
        connection.release();
    }
};

// 管理员：更新内容
exports.updateContent = async (req, res) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const { title, content, status,language_code } = req.body;

        // 检查内容是否存在
        const contentCheck = await connection.query(
            'SELECT id FROM common_content WHERE id = $1 AND deleted = false',
            [id]
        );

        if (contentCheck.getRowCount() === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: getMessage('COMMON_CONTENT.CONTENT_NOT_FOUND')
            });
        }

        // 构建更新字段
        const updateFields = [];
        const updateValues = [];

        if (title !== undefined) {
            updateFields.push(`title = $${updateValues.length + 1}`);
            updateValues.push(title);
        }
        if (content !== undefined) {
            updateFields.push(`content = $${updateValues.length + 1}`);
            updateValues.push(content);
        }

        if (status !== undefined) {
            updateFields.push(`status = $${updateValues.length + 1}`);
            updateValues.push(status);
        }

        if (language_code != undefined) {
            updateFields.push(`language_code = $${updateValues.length + 1}`);
            updateValues.push(language_code);
        }

        if (updateFields.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: getMessage('COMMON_CONTENT.NO_UPDATE_FIELDS')
            });
        }

        updateFields.push('updated_at = NOW()');
        updateFields.push(`updated_by = $${updateValues.length + 1}`);
        updateValues.push(req.userId);
        updateValues.push(id);

        await connection.query(
            `UPDATE common_content SET ${updateFields.join(', ')} WHERE id = $${updateValues.length}`,
            updateValues
        );

        await connection.commit();

        res.json({
            success: true,
            message: getMessage('COMMON_CONTENT.CONTENT_UPDATE_SUCCESS'),
            data: null
        });
    } catch (error) {
        await connection.rollback();
        console.error('更新内容失败:', error);
        res.status(500).json({
            success: false,
            message: getMessage('COMMON_CONTENT.CONTENT_UPDATE_FAILED')
        });
    } finally {
        connection.release();
    }
};

// 管理员：删除内容（软删除）
exports.deleteContent = async (req, res) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;

        // 检查内容是否存在
        const contentCheck = await connection.query(
            'SELECT id FROM common_content WHERE id = $1 AND deleted = false',
            [id]
        );

        if (contentCheck.getRowCount() === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: getMessage('COMMON_CONTENT.CONTENT_NOT_FOUND')
            });
        }

        // 软删除内容
        await connection.query(
            'UPDATE common_content SET deleted = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [req.userId, id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: getMessage('COMMON_CONTENT.CONTENT_DELETE_SUCCESS'),
            data: null
        });
    } catch (error) {
        await connection.rollback();
        console.error('删除内容失败:', error);
        res.status(500).json({
            success: false,
            message: getMessage('COMMON_CONTENT.CONTENT_DELETE_FAILED')
        });
    } finally {
        connection.release();
    }
};

// 图片上传
exports.uploadImages = async (req, res) => {
    const connection = await getConnection();
    try {
        const { nav_id, content_id, image_type = 'content', session_id } = req.body;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: getMessage('COMMON_CONTENT.NO_FILES_UPLOADED')
            });
        }

        // 验证参数
        if (image_type === 'main' && !content_id) {
            return res.status(400).json({
                success: false,
                message: '主图必须关联到具体的内容'
            });
        }

        const uploadedImages = [];
        const uploadDir = path.join(__dirname, '../public/static/images');
        
        // 确保上传目录存在
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        await connection.beginTransaction();

        // 如果是主图类型，先删除该内容的所有主图
        if (image_type === 'main' && content_id) {
            // 获取要删除的主图文件路径
            const existingMainImages = await connection.query(
                'SELECT image_url FROM common_content_images WHERE content_id = $1 AND image_type = $2 AND deleted = false',
                [content_id, 'main']
            );

            // 软删除数据库中的主图记录
            await connection.query(
                'UPDATE common_content_images SET deleted = true, updated_at = NOW(), updated_by = $1 WHERE content_id = $2 AND image_type = $3 AND deleted = false',
                [req.userId, content_id, 'main']
            );

            // 删除物理文件
            for (const img of existingMainImages.getRows()) {
                const imagePath = path.join(__dirname, '..', img.image_url);
                if (fs.existsSync(imagePath)) {
                    try {
                        await fs.promises.unlink(imagePath);
                    } catch (error) {
                        console.warn('删除旧主图文件失败:', error);
                    }
                }
            }
        }

        for (const file of files) {
            // 生成唯一文件名
            const fileExtension = path.extname(file.originalname);
            const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);
            const relativePath = `/public/static/images/${fileName}`;

            // 保存文件
            await fs.promises.writeFile(filePath, file.buffer);

            // 插入数据库记录
            const result = await connection.query(
                `INSERT INTO common_content_images 
                 (nav_id, content_id, image_type, image_url, alt_text, sort_order, status, created_by, updated_by) 
                 VALUES ($1, $2, $3, $4, $5, 0, 1, $6, $7) RETURNING id`,
                [nav_id || null, content_id || null, image_type, relativePath, file.originalname, req.userId, req.userId]
            );

            uploadedImages.push({
                id: result.getFirstRow().id,
                path: relativePath,
                alt_text: file.originalname,
                image_type: image_type
            });
        }

        await connection.commit();

        res.json({
            success: true,
            message: getMessage('COMMON_CONTENT.IMAGE_UPLOAD_SUCCESS'),
            data: {
                images: uploadedImages
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('图片上传失败:', error);
        res.status(500).json({
            success: false,
            message: getMessage('COMMON_CONTENT.IMAGE_UPLOAD_FAILED')
        });
    } finally {
        connection.release();
    }
};

// 获取图片列表（按导航ID）
exports.getImages = async (req, res) => {
    try {
        const { navId } = req.params;
        const { image_type } = req.query;

        let queryStr = `
            SELECT id, nav_id, content_id, image_type, image_url, alt_text, sort_order, status, created_at
            FROM common_content_images 
            WHERE nav_id = $1 AND deleted = false
        `;
        const params = [navId];

        if (image_type) {
            queryStr += ' AND image_type = $2';
            params.push(image_type);
        }

        queryStr += ' ORDER BY sort_order ASC, created_at DESC';

        const images = await query(queryStr, params);

        res.json({
            success: true,
            message: getMessage('COMMON_CONTENT.IMAGE_LIST_SUCCESS'),
            data: {
                images: images.getRows()
            }
        });
    } catch (error) {
        console.error('获取图片列表失败:', error);
        res.status(500).json({
            success: false,
            message: getMessage('COMMON_CONTENT.IMAGE_LIST_FAILED')
        });
    }
};

// 获取内容的图片列表
exports.getImagesByContentId = async (req, res) => {
    try {
        const { content_id } = req.params;
        const { image_type } = req.query;

        let queryStr = `
            SELECT id, nav_id, content_id, image_type, image_url, alt_text, sort_order, status, created_at
            FROM common_content_images 
            WHERE content_id = $1 AND deleted = false
        `;
        const params = [content_id];

        if (image_type) {
            queryStr += ' AND image_type = $2';
            params.push(image_type);
        }

        queryStr += ' ORDER BY sort_order ASC, created_at DESC';

        const images = await query(queryStr, params);

        res.json({
            success: true,
            message: getMessage('COMMON_CONTENT.IMAGE_LIST_SUCCESS'),
            data: {
                images: images.getRows()
            }
        });
    } catch (error) {
        console.error('获取内容图片列表失败:', error);
        res.status(500).json({
            success: false,
            message: getMessage('COMMON_CONTENT.IMAGE_LIST_FAILED')
        });
    }
};

// 删除图片
exports.deleteImage = async (req, res) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;

        // 检查图片是否存在
        const imageCheck = await connection.query(
            'SELECT image_url FROM common_content_images WHERE id = $1 AND deleted = false',
            [id]
        );

        if (imageCheck.getRowCount() === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: getMessage('COMMON_CONTENT.IMAGE_NOT_FOUND')
            });
        }

        // 软删除图片记录
        await connection.query(
            'UPDATE common_content_images SET deleted = true, updated_at = NOW(), updated_by = $1 WHERE id = $2',
            [req.userId, id]
        );

        // 删除物理文件
        const imagePath = path.join(__dirname, '..', imageCheck.getFirstRow().image_url);
        if (fs.existsSync(imagePath)) {
            await fs.promises.unlink(imagePath);
        }

        await connection.commit();

        res.json({
            success: true,
            message: getMessage('COMMON_CONTENT.IMAGE_DELETE_SUCCESS'),
            data: null
        });
    } catch (error) {
        await connection.rollback();
        console.error('删除图片失败:', error);
        res.status(500).json({
            success: false,
            message: getMessage('COMMON_CONTENT.IMAGE_DELETE_FAILED')
        });
    } finally {
        connection.release();
    }
};

// 获取内容的主图
exports.getMainImageByContentId = async (req, res) => {
    try {
        const { content_id } = req.params;
        
        const images = await query(
            `SELECT id, image_url, alt_text 
             FROM common_content_images 
             WHERE content_id = $1 AND image_type = 'main' AND deleted = false 
             ORDER BY created_at DESC 
             LIMIT 1`,
            [content_id]
        );
        
        res.json({
            success: true,
            data: images.getFirstRow() || null
        });
    } catch (error) {
        console.error('获取主图失败:', error);
        res.status(500).json({
            success: false,
            message: getMessage('COMMON_CONTENT.GET_MAIN_IMAGE_FAILED')
        });
    }
};

// 兼容旧接口：通过导航ID获取主图（返回该导航下第一个内容的主图）
exports.getMainImageByNavId = async (req, res) => {
    try {
        const { nav_id } = req.params;
        
        const images = await query(
            `SELECT img.id, img.image_url, img.alt_text 
             FROM common_content_images img
             INNER JOIN common_content c ON img.content_id = c.id
             WHERE c.nav_id = $1 AND img.image_type = 'main' AND img.deleted = false AND c.deleted = false
             ORDER BY c.id ASC, img.created_at DESC 
             LIMIT 1`,
            [nav_id]
        );
        
        res.json({
            success: true,
            data: images.getFirstRow() || null
        });
    } catch (error) {
        console.error('获取主图失败:', error);
        res.status(500).json({
            success: false,
            message: getMessage('COMMON_CONTENT.GET_MAIN_IMAGE_FAILED')
        });
    }
};