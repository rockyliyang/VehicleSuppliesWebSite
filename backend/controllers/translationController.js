const axios = require('axios');
const { getMessage } = require('../config/messages');

/**
 * 翻译控制器
 * 使用Qwen-MT API进行文本翻译
 */

/**
 * 翻译文本
 * POST /api/translation/translate
 */
exports.translateText = async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    
    // 验证必需参数
    if (!text || !sourceLang || !targetLang) {
      return res.status(400).json({
        success: false,
        message: getMessage('TRANSLATION.MISSING_PARAMS'),
        data: null
      });
    }
    
    // 验证文本长度
    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        message: getMessage('TRANSLATION.TEXT_TOO_LONG'),
        data: null
      });
    }
    
    // 调用Qwen-MT API
    const translationResult = await callQwenMTAPI(text, sourceLang, targetLang);
    
    return res.json({
      success: true,
      message: getMessage('TRANSLATION.SUCCESS'),
      data: {
        originalText: text,
        translatedText: translationResult.translatedText,
        sourceLang: sourceLang,
        targetLang: targetLang,
        confidence: translationResult.confidence || null
      }
    });
    
  } catch (error) {
    console.error('Translation error:', error);
    
    // 处理API调用错误
    if (error.response) {
      return res.status(error.response.status || 500).json({
        success: false,
        message: error.message || getMessage('TRANSLATION.API_ERROR'),
        data: null
      });
    }
    
    return res.status(500).json({
      success: false,
      message: getMessage('TRANSLATION.INTERNAL_ERROR'),
      data: null
    });
  }
};

/**
 * 批量翻译文本
 * POST /api/translation/batch-translate
 */
exports.batchTranslateText = async (req, res) => {
  try {
    const { texts, sourceLang, targetLang } = req.body;
    
    // 验证必需参数
    if (!texts || !Array.isArray(texts) || !sourceLang || !targetLang) {
      return res.status(400).json({
        success: false,
        message: getMessage('TRANSLATION.MISSING_PARAMS'),
        data: null
      });
    }
    
    // 验证批量翻译数量限制
    if (texts.length > 100) {
      return res.status(400).json({
        success: false,
        message: getMessage('TRANSLATION.BATCH_LIMIT_EXCEEDED'),
        data: null
      });
    }
    
    // 验证每个文本的长度
    for (const text of texts) {
      if (text && text.length > 5000) {
        return res.status(400).json({
          success: false,
          message: getMessage('TRANSLATION.TEXT_TOO_LONG'),
          data: null
        });
      }
    }
    
    // 批量翻译
    const translationPromises = texts.map(text => 
      callQwenMTAPI(text, sourceLang, targetLang)
        .catch(error => ({ error: error.message, originalText: text }))
    );
    
    const results = await Promise.all(translationPromises);
    
    return res.json({
      success: true,
      message: getMessage('TRANSLATION.BATCH_SUCCESS'),
      data: {
        results: results.map((result, index) => ({
          originalText: texts[index],
          translatedText: result.error ? null : result.translatedText,
          error: result.error || null,
          confidence: result.confidence || null
        })),
        sourceLang: sourceLang,
        targetLang: targetLang
      }
    });
    
  } catch (error) {
    console.error('Batch translation error:', error);
    
    return res.status(500).json({
      success: false,
      message: getMessage('TRANSLATION.INTERNAL_ERROR'),
      data: null
    });
  }
};

/**
 * 获取支持的语言列表
 * GET /api/translation/languages
 */
exports.getSupportedLanguages = async (req, res) => {
  try {
    // 返回Qwen-MT支持的语言列表
    const supportedLanguages = [
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'th', name: 'Thai', nativeName: 'ไทย' },
      { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' }
    ];
    
    return res.json({
      success: true,
      message: getMessage('TRANSLATION.LANGUAGES_SUCCESS'),
      data: supportedLanguages
    });
    
  } catch (error) {
    console.error('Get supported languages error:', error);
    
    return res.status(500).json({
      success: false,
      message: getMessage('TRANSLATION.INTERNAL_ERROR'),
      data: null
    });
  }
};

/**
 * 调用Qwen-MT API进行翻译
 * @param {string} text - 要翻译的文本
 * @param {string} sourceLang - 源语言代码
 * @param {string} targetLang - 目标语言代码
 * @returns {Promise<Object>} 翻译结果
 */
async function callQwenMTAPI(text, sourceLang, targetLang) {
  try {
    // Qwen-MT API配置
    const apiUrl = process.env.QWEN_MT_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    const apiKey = process.env.QWEN_MT_API_KEY;
    
    if (!apiKey) {
      throw new Error('Qwen-MT API key not configured');
    }
    
    // 构建API请求
    const requestData = {
      model: 'qwen-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text without any additional explanation.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    };
    
    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30秒超时
    });
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const translatedText = response.data.choices[0]?.message?.content;
      
      if (!translatedText) {
        throw new Error('Invalid response from Qwen-MT API');
      }
      
      return {
        translatedText: translatedText.trim(),
        confidence: null // OpenAI兼容格式不提供confidence
      };
    } else {
      throw new Error('Invalid response format from Qwen-MT API');
    }
    
  } catch (error) {
    console.error('Qwen-MT API call error:', error);
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText;
      
      if (status === 401) {
        throw new Error('Invalid API key for Qwen-MT');
      } else if (status === 429) {
        throw new Error('Rate limit exceeded for Qwen-MT API');
      } else if (status >= 500) {
        throw new Error('Qwen-MT API server error');
      } else {
        throw new Error(`Qwen-MT API error: ${message}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Translation request timeout');
    } else {
      throw new Error(`Translation service error: ${error.message}`);
    }
  }
}

/**
 * 检测文本语言
 * POST /api/translation/detect-language
 */
exports.detectLanguage = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: getMessage('TRANSLATION.MISSING_TEXT'),
        data: null
      });
    }
    
    // 简单的语言检测逻辑（可以后续集成更专业的语言检测API）
    const detectedLang = detectTextLanguage(text);
    
    return res.json({
      success: true,
      message: getMessage('TRANSLATION.DETECT_SUCCESS'),
      data: {
        text: text,
        detectedLanguage: detectedLang,
        confidence: 0.8 // 模拟置信度
      }
    });
    
  } catch (error) {
    console.error('Language detection error:', error);
    
    return res.status(500).json({
      success: false,
      message: getMessage('TRANSLATION.INTERNAL_ERROR'),
      data: null
    });
  }
};

/**
 * 简单的语言检测函数
 * @param {string} text - 要检测的文本
 * @returns {string} 检测到的语言代码
 */
function detectTextLanguage(text) {
  // 中文检测
  if (/[\u4e00-\u9fff]/.test(text)) {
    return 'zh';
  }
  
  // 日文检测
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
    return 'ja';
  }
  
  // 韩文检测
  if (/[\uac00-\ud7af]/.test(text)) {
    return 'ko';
  }
  
  // 阿拉伯文检测
  if (/[\u0600-\u06ff]/.test(text)) {
    return 'ar';
  }
  
  // 俄文检测
  if (/[\u0400-\u04ff]/.test(text)) {
    return 'ru';
  }
  
  // 泰文检测
  if (/[\u0e00-\u0e7f]/.test(text)) {
    return 'th';
  }
  
  // 默认为英文
  return 'en';
}