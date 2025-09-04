const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置路径
const FRONTEND_DIR = path.join(__dirname, '../../frontend/src');
const BACKEND_MESSAGES_FILE = path.join(__dirname, '../config/messages.js');
const SQL_FILE = path.join(__dirname, '../../db/main/postgresql/insert_message_translations_postgresql.sql');
const OUTPUT_DIR = path.join(__dirname, '../../db/main/postgresql');

// 存储找到的所有key
const foundKeys = new Set();

/**
 * 递归扫描目录中的所有文件
 */
function scanDirectory(dir, extensions = ['.vue', '.js']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过node_modules等目录
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          traverse(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * 从文件内容中提取$t函数的key
 */
function extractTKeys(content) {
  const keys = new Set();
  
  // 匹配 $t('key') 或 $t("key") 或 $t(`key`)
  const tFunctionRegex = /\$t\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  let match;
  
  while ((match = tFunctionRegex.exec(content)) !== null) {
    keys.add(match[1]);
  }
  
  return keys;
}

/**
 * 从文件内容中提取API调用的fallbackKey
 */
function extractFallbackKeys(content) {
  const keys = new Set();
  
  // 匹配 getWithErrorHandler, postWithErrorHandler, putWithErrorHandler, patchWithErrorHandler, deleteWithErrorHandler
  // 查找 fallbackKey: 'key' 或 fallbackKey: "key" 或 fallbackKey: `key`
  const fallbackKeyRegex = /(?:getWithErrorHandler|postWithErrorHandler|putWithErrorHandler|patchWithErrorHandler|deleteWithErrorHandler)[\s\S]*?fallbackKey\s*:\s*['"`]([^'"`]+)['"`]/g;
  let match;
  
  while ((match = fallbackKeyRegex.exec(content)) !== null) {
    keys.add(match[1]);
  }
  
  return keys;
}

/**
 * 从后端messages.js文件中提取所有key
 */
function extractBackendKeys() {
  const keys = new Set();
  
  try {
    const content = fs.readFileSync(BACKEND_MESSAGES_FILE, 'utf8');
    
    // 递归提取对象中的所有key路径
    function extractKeysFromObject(obj, prefix = '') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            extractKeysFromObject(obj[key], fullKey);
          } else if (typeof obj[key] === 'string') {
            keys.add(fullKey);
          }
        }
      }
    }
    
    // 使用eval来解析MESSAGES对象（注意：这在生产环境中不安全，但对于工具脚本可以接受）
    const messagesMatch = content.match(/const MESSAGES = ({[\s\S]*?});\s*module\.exports/);;
    if (messagesMatch) {
      try {
        // 创建一个安全的执行环境
        const messagesCode = messagesMatch[1];
        const MESSAGES = eval(`(${messagesCode})`);
        extractKeysFromObject(MESSAGES);
      } catch (error) {
        console.error('解析MESSAGES对象失败:', error.message);
        
        // 备用方案：使用正则表达式提取key
        const keyRegex = /([A-Z_]+(?:\.[A-Z_]+)*?)\s*:/g;
        let match;
        while ((match = keyRegex.exec(content)) !== null) {
          keys.add(match[1]);
        }
      }
    }
  } catch (error) {
    console.error('读取后端messages.js文件失败:', error.message);
  }
  
  return keys;
}

/**
 * 从SQL文件中提取已有的翻译key
 */
function extractSqlKeys() {
  const keys = new Set();
  
  try {
    const content = fs.readFileSync(SQL_FILE, 'utf8');
    
    // 匹配 INSERT 语句中的 code 字段
    const insertRegex = /INSERT INTO language_translations[\s\S]*?VALUES[\s\S]*?\([^,]*,[^,]*['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = insertRegex.exec(content)) !== null) {
      keys.add(match[1]);
    }
  } catch (error) {
    console.error('读取SQL文件失败:', error.message);
  }
  
  return keys;
}

/**
 * 生成缺失key的SQL插入语句
 */
function generateMissingKeySql(missingKeys) {
  if (missingKeys.size === 0) {
    return '';
  }
  
  let sql = '-- 缺失的翻译key\n';
  sql += 'INSERT INTO language_translations (guid, code, lang, value) VALUES\n';
  
  const values = [];
  for (const key of missingKeys) {
    values.push(`(gen_random_uuid(), '${key}', 'en', '${key}'),`);
    values.push(`(gen_random_uuid(), '${key}', 'zh-CN', '${key}')`);
  }
  
  // 移除最后一个逗号
  if (values.length > 0) {
    values[values.length - 1] = values[values.length - 1].slice(0, -1);
  }
  
  sql += values.join('\n');
  sql += ';\n';
  
  return sql;
}

/**
 * 生成多余key的SQL删除语句
 */
function generateExtraKeySql(extraKeys) {
  if (extraKeys.size === 0) {
    return '';
  }
  
  let sql = '-- 多余的翻译key\n';
  
  for (const key of extraKeys) {
    sql += `DELETE FROM language_translations WHERE code = '${key}';\n`;
  }
  
  return sql;
}

/**
 * 从原SQL文件中移除多余的key
 */
function removeExtraKeysFromSql(extraKeys) {
  try {
    let content = fs.readFileSync(SQL_FILE, 'utf8');
    
    for (const key of extraKeys) {
      // 移除包含该key的所有INSERT语句行
      const regex = new RegExp(`.*'${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'.*\n`, 'g');
      content = content.replace(regex, '');
    }
    
    // 清理多余的逗号和空行
    content = content.replace(/,\s*\n\s*;/g, '\n;');
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync(SQL_FILE, content, 'utf8');
    console.log(`已从原SQL文件中移除 ${extraKeys.size} 个多余的key`);
  } catch (error) {
    console.error('更新原SQL文件失败:', error.message);
  }
}

/**
 * 主函数
 */
function main() {
  console.log('开始扫描翻译key...');
  
  // 1. 扫描前端文件
  console.log('扫描前端文件...');
  const frontendFiles = scanDirectory(FRONTEND_DIR);
  
  for (const file of frontendFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // 提取$t函数的key
      const tKeys = extractTKeys(content);
      tKeys.forEach(key => foundKeys.add(key));
      
      // 提取fallbackKey
      const fallbackKeys = extractFallbackKeys(content);
      fallbackKeys.forEach(key => foundKeys.add(key));
      
    } catch (error) {
      console.error(`读取文件失败 ${file}:`, error.message);
    }
  }
  
  console.log(`前端文件中找到 ${foundKeys.size} 个翻译key`);
  
  // 2. 扫描后端messages.js
  console.log('扫描后端messages.js...');
  const backendKeys = extractBackendKeys();
  backendKeys.forEach(key => foundKeys.add(key));
  
  console.log(`后端messages.js中找到 ${backendKeys.size} 个key`);
  console.log(`总共找到 ${foundKeys.size} 个唯一key`);
  
  // 3. 读取现有SQL文件中的key
  console.log('读取现有SQL文件...');
  const sqlKeys = extractSqlKeys();
  console.log(`SQL文件中找到 ${sqlKeys.size} 个key`);
  
  // 4. 对比找出缺失和多余的key
  const missingKeys = new Set([...foundKeys].filter(key => !sqlKeys.has(key)));
  const extraKeys = new Set([...sqlKeys].filter(key => !foundKeys.has(key)));
  
  console.log(`\n分析结果:`);
  console.log(`缺失的key: ${missingKeys.size} 个`);
  console.log(`多余的key: ${extraKeys.size} 个`);
  
  // 5. 生成缺失key的SQL文件
  if (missingKeys.size > 0) {
    const missingSql = generateMissingKeySql(missingKeys);
    const missingFile = path.join(OUTPUT_DIR, 'missing_translations.sql');
    fs.writeFileSync(missingFile, missingSql, 'utf8');
    console.log(`\n缺失的翻译已生成到: ${missingFile}`);
    
    console.log('\n缺失的key列表:');
    [...missingKeys].sort().forEach(key => console.log(`  - ${key}`));
  }
  
  // 6. 生成多余key的SQL文件
  if (extraKeys.size > 0) {
    const extraSql = generateExtraKeySql(extraKeys);
    const extraFile = path.join(OUTPUT_DIR, 'extra_translations.sql');
    fs.writeFileSync(extraFile, extraSql, 'utf8');
    console.log(`\n多余的翻译已生成到: ${extraFile}`);
    
    console.log('\n多余的key列表:');
    [...extraKeys].sort().forEach(key => console.log(`  - ${key}`));
    
    // 7. 从原SQL文件中移除多余的key
    console.log('\n正在从原SQL文件中移除多余的key...');
    removeExtraKeysFromSql(extraKeys);
  }
  
  console.log('\n扫描完成!');
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  scanDirectory,
  extractTKeys,
  extractFallbackKeys,
  extractBackendKeys,
  extractSqlKeys
};