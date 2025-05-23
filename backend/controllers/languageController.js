const {pool} = require('../db/db');
const { v4: uuidv4 } = require('uuid');
const { Buffer } = require('buffer');

/**
 * 获取所有语言翻译
 */
exports.getAllTranslations = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, BIN_TO_UUID(guid) as guid, code, lang, value FROM language_translations WHERE deleted = 0'
    );
    
    return res.json({
      success: true,
      message: '获取翻译成功',
      data: rows
    });
  } catch (error) {
    console.error('获取翻译失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取翻译失败',
      data: null
    });
  }
};

/**
 * 根据语言获取翻译
 */
exports.getTranslationsByLang = async (req, res) => {
  try {
    const { lang } = req.params;
    
    const [rows] = await pool.query(
      'SELECT id, BIN_TO_UUID(guid) as guid, code, lang, value FROM language_translations WHERE lang = ? AND deleted = 0',
      [lang]
    );
    
    // 将结果转换为 {code: value} 格式的对象
    const translations = {};
    rows.forEach(row => {
      translations[row.code] = row.value;
    });
    
    return res.json({
      success: true,
      message: '获取翻译成功',
      data: translations
    });
  } catch (error) {
    console.error(`获取${req.params.lang}翻译失败:`, error);
    return res.status(500).json({
      success: false,
      message: `获取${req.params.lang}翻译失败`,
      data: null
    });
  }
};

/**
 * 添加翻译
 */
exports.addTranslation = async (req, res) => {
  try {
    const { code, lang, value } = req.body;
    
    if (!code || !lang || !value) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
        data: null
      });
    }
    
    // 检查是否已存在相同的code和lang组合
    const [existing] = await pool.query(
      'SELECT id FROM language_translations WHERE code = ? AND lang = ? AND deleted = 0',
      [code, lang]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该语言的翻译键已存在',
        data: null
      });
    }
    
    const uuid = uuidv4();
    const guidBuffer = Buffer.from(uuid.replace(/-/g, ''), 'hex');
    
    await pool.query(
      'INSERT INTO language_translations (guid, code, lang, value) VALUES (?, ?, ?, ?)',
      [guidBuffer, code, lang, value]
    );
    
    return res.status(201).json({
      success: true,
      message: '添加翻译成功',
      data: { code, lang, value }
    });
  } catch (error) {
    console.error('添加翻译失败:', error);
    return res.status(500).json({
      success: false,
      message: '添加翻译失败',
      data: null
    });
  }
};

/**
 * 更新翻译
 */
exports.updateTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body;
    
    if (!value) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
        data: null
      });
    }
    
    const [result] = await pool.query(
      'UPDATE language_translations SET value = ? WHERE id = ? AND deleted = 0',
      [value, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '翻译不存在',
        data: null
      });
    }
    
    return res.json({
      success: true,
      message: '更新翻译成功',
      data: { id, value }
    });
  } catch (error) {
    console.error('更新翻译失败:', error);
    return res.status(500).json({
      success: false,
      message: '更新翻译失败',
      data: null
    });
  }
};

/**
 * 删除翻译（软删除）
 */
exports.deleteTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query(
      'UPDATE language_translations SET deleted = 1 WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '翻译不存在',
        data: null
      });
    }
    
    return res.json({
      success: true,
      message: '删除翻译成功',
      data: null
    });
  } catch (error) {
    console.error('删除翻译失败:', error);
    return res.status(500).json({
      success: false,
      message: '删除翻译失败',
      data: null
    });
  }
};

/**
 * 获取支持的语言列表
 */
exports.getSupportedLanguages = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT lang FROM language_translations WHERE deleted = 0'
    );
    
    const languages = rows.map(row => row.lang);
    
    return res.json({
      success: true,
      message: '获取支持的语言列表成功',
      data: languages
    });
  } catch (error) {
    console.error('获取支持的语言列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取支持的语言列表失败',
      data: null
    });
  }
};

/**
 * 根据IP获取默认语言
 */
exports.getLanguageByIp = async (req, res) => {
  try {
    // 获取客户端IP地址
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // 这里可以使用第三方服务如GeoIP来获取IP所在国家/地区
    // 简化实现，这里根据IP的第一个字节来模拟不同地区
    // 实际项目中应该使用专业的IP地理位置服务
    const ipFirstByte = ip.split('.')[0];
    let defaultLang = 'en'; // 默认英语
    
    // 简单示例：根据IP范围判断语言
    if (ipFirstByte >= 1 && ipFirstByte <= 126) {
      defaultLang = 'en'; // 北美地区，使用英语
    } else if (ipFirstByte >= 220 && ipFirstByte <= 223) {
      defaultLang = 'zh-CN'; // 中国地区，使用中文
    }
    
    // 检查该语言是否在我们的翻译表中
    const [langExists] = await pool.query(
      'SELECT COUNT(*) as count FROM language_translations WHERE lang = ? AND deleted = 0 LIMIT 1',
      [defaultLang]
    );
    
    // 如果该语言不存在翻译，则使用英语
    if (langExists[0].count === 0) {
      defaultLang = 'en';
    }
    
    return res.json({
      success: true,
      message: '获取默认语言成功',
      data: { lang: defaultLang }
    });
  } catch (error) {
    console.error('获取默认语言失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取默认语言失败',
      data: { lang: 'en' } // 出错时默认返回英语
    });
  }
};