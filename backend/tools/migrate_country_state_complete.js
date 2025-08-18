/**
 * 国家和州/省数据完整迁移脚本
 * 包含建表和数据导入的完整流程
 * 创建时间: 2024年
 * 
 * 使用方法:
 * node migrate_country_state_complete.js
 * 
 * 或者分步执行:
 * node migrate_country_state_complete.js --schema-only  # 仅创建表结构
 * node migrate_country_state_complete.js --data-only    # 仅导入数据
 */

const fs = require('fs');
const path = require('path');
// 加载开发环境配置
require('dotenv').config({ path: require('path').join(__dirname, '../.env.development') });
const { getConnection, query } = require('../db/db');
const { importCountries, importStates, readJsonFile } = require('./import_country_state_data');

// 配置
const SCHEMA_FILE_PATH = path.join(__dirname, '../../db/main/postgresql/country_state_schema_postgresql.sql');
const COUNTRIES_JSON_PATH = path.join(__dirname, '../public/country_state/countries.json');
const STATES_JSON_PATH = path.join(__dirname, '../public/country_state/states.json');

/**
 * 执行SQL文件
 * @param {string} sqlFilePath SQL文件路径
 */
async function executeSqlFile(sqlFilePath) {
    try {
        console.log(`执行SQL文件: ${sqlFilePath}`);
        
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`SQL文件不存在: ${sqlFilePath}`);
        }
        
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        // 分割SQL语句（简单的分割，基于分号和换行）
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`找到 ${statements.length} 个SQL语句`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    await query(statement);
                    if ((i + 1) % 10 === 0) {
                        console.log(`已执行 ${i + 1}/${statements.length} 个SQL语句`);
                    }
                } catch (error) {
                    // 忽略一些常见的无害错误
                    if (error.message.includes('already exists') || 
                        error.message.includes('does not exist') ||
                        error.message.includes('duplicate key')) {
                        console.warn(`警告 (已忽略): ${error.message}`);
                        continue;
                    }
                    throw error;
                }
            }
        }
        
        console.log('SQL文件执行完成');
        
    } catch (error) {
        console.error('执行SQL文件失败:', error);
        throw error;
    }
}

/**
 * 检查表是否存在
 * @param {string} tableName 表名
 * @returns {boolean} 表是否存在
 */
async function tableExists(tableName) {
    try {
        const queryText = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            );
        `;
        const result = await query(queryText, [tableName]);
        return result.rows[0].exists;
    } catch (error) {
        console.error(`检查表 ${tableName} 是否存在时出错:`, error);
        return false;
    }
}

/**
 * 获取表中的记录数
 * @param {string} tableName 表名
 * @returns {number} 记录数
 */
async function getTableCount(tableName) {
    try {
        const queryText = `SELECT COUNT(*) as count FROM ${tableName} WHERE deleted = FALSE`;
        const result = await query(queryText);
        return parseInt(result.rows[0].count);
    } catch (error) {
        console.error(`获取表 ${tableName} 记录数时出错:`, error);
        return 0;
    }
}

/**
 * 创建数据库表结构
 */
async function createSchema() {
    console.log('\n=== 创建数据库表结构 ===');
    
    try {
        // 检查表是否已存在
        const countriesExists = await tableExists('countries');
        const statesExists = await tableExists('states');
        
        if (countriesExists && statesExists) {
            console.log('表已存在，跳过创建步骤');
            
            // 显示现有数据统计
            const countriesCount = await getTableCount('countries');
            const statesCount = await getTableCount('states');
            console.log(`现有数据: countries表 ${countriesCount} 条记录, states表 ${statesCount} 条记录`);
            
            return;
        }
        
        // 执行建表SQL
        await executeSqlFile(SCHEMA_FILE_PATH);
        
        // 验证表创建成功
        const countriesExistsAfter = await tableExists('countries');
        const statesExistsAfter = await tableExists('states');
        const timezonesExists = await tableExists('country_timezones');
        const translationsExists = await tableExists('country_translations');
        
        if (!countriesExistsAfter || !statesExistsAfter || !timezonesExists || !translationsExists) {
            throw new Error('部分表创建失败，请检查SQL脚本');
        }
        
        console.log('✓ 数据库表结构创建完成（包含countries、states、country_timezones、country_translations表）');
        
        console.log('数据库表结构创建完成');
        
    } catch (error) {
        console.error('创建数据库表结构失败:', error);
        throw error;
    }
}

/**
 * 导入数据
 */
async function importData() {
    console.log('\n=== 导入数据 ===');
    
    try {
        // 检查文件是否存在
        if (!fs.existsSync(COUNTRIES_JSON_PATH)) {
            throw new Error(`国家数据文件不存在: ${COUNTRIES_JSON_PATH}`);
        }
        
        if (!fs.existsSync(STATES_JSON_PATH)) {
            throw new Error(`州/省数据文件不存在: ${STATES_JSON_PATH}`);
        }
        
        // 检查是否已有数据
        const countriesCount = await getTableCount('countries');
        const statesCount = await getTableCount('states');
        
        if (countriesCount > 0 || statesCount > 0) {
            console.log(`检测到现有数据: countries表 ${countriesCount} 条, states表 ${statesCount} 条`);
            console.log('将执行数据更新/插入操作...');
        }
        
        // 读取JSON数据
        console.log('读取JSON文件...');
        const countries = readJsonFile(COUNTRIES_JSON_PATH);
        const states = readJsonFile(STATES_JSON_PATH);
        
        console.log(`准备导入: ${countries.length} 个国家, ${states.length} 个州/省`);
        
        // 导入国家数据（包含子表数据）
        const countryResult = await importCountries(countries);
        
        // 导入州/省数据
        const stateResult = await importStates(states);
        
        // 验证子表数据
        const timezonesCount = await getTableCount('country_timezones');
        const translationsCount = await getTableCount('country_translations');
        console.log(`子表数据统计: country_timezones ${timezonesCount} 条, country_translations ${translationsCount} 条`);
        
        console.log('\n数据导入完成');
        console.log(`国家: 成功 ${countryResult.successCount}, 失败 ${countryResult.errorCount}`);
        console.log(`州/省: 成功 ${stateResult.successCount}, 失败 ${stateResult.errorCount}, 跳过 ${stateResult.skippedCount}`);
        
        return {
            countries: countryResult,
            states: stateResult
        };
        
    } catch (error) {
        console.error('数据导入失败:', error);
        throw error;
    }
}

/**
 * 验证导入结果
 */
async function validateImport() {
    console.log('\n=== 验证导入结果 ===');
    
    try {
        // 检查表是否存在
        const countriesExists = await tableExists('countries');
        const statesExists = await tableExists('states');
        
        if (!countriesExists || !statesExists) {
            throw new Error('表不存在，导入可能失败');
        }
        
        // 获取记录数
        const countriesCount = await getTableCount('countries');
        const statesCount = await getTableCount('states');
        
        console.log(`最终统计: countries表 ${countriesCount} 条记录, states表 ${statesCount} 条记录`);
        
        // 检查一些示例数据
        const sampleCountriesQuery = `
            SELECT name, iso2, iso3, tax_rate, shipping_rate, shipping_rate_type 
            FROM countries 
            WHERE deleted = FALSE 
            ORDER BY name 
            LIMIT 5
        `;
        
        const sampleStatesQuery = `
            SELECT s.name, s.country_code, c.name as country_name, s.tax_rate, s.shipping_rate 
            FROM states s 
            JOIN countries c ON s.country_id = c.id 
            WHERE s.deleted = FALSE AND c.deleted = FALSE 
            ORDER BY s.name 
            LIMIT 5
        `;
        
        const countriesResult = await query(sampleCountriesQuery);
        const statesResult = await query(sampleStatesQuery);
        
        console.log('\n示例国家数据:');
        countriesResult.rows.forEach(row => {
            console.log(`- ${row.name} (${row.iso2}): 税率 ${(row.tax_rate * 100).toFixed(2)}%, 运费 ${row.shipping_rate} (${row.shipping_rate_type})`);
        });
        
        console.log('\n示例州/省数据:');
        statesResult.rows.forEach(row => {
            const taxRate = row.tax_rate ? `${(row.tax_rate * 100).toFixed(2)}%` : '使用国家税率';
            const shippingRate = row.shipping_rate ? row.shipping_rate : '使用国家运费';
            console.log(`- ${row.name}, ${row.country_name} (${row.country_code}): 税率 ${taxRate}, 运费 ${shippingRate}`);
        });
        
        // 检查视图是否工作正常
        const viewQuery = `
            SELECT state_name, country_name, effective_tax_rate, effective_shipping_rate, effective_shipping_rate_type
            FROM v_location_rates 
            ORDER BY country_name, state_name 
            LIMIT 5
        `;
        
        const viewResult = await query(viewQuery);
        
        console.log('\n示例地址费率视图数据:');
        viewResult.rows.forEach(row => {
            console.log(`- ${row.state_name}, ${row.country_name}: 有效税率 ${(row.effective_tax_rate * 100).toFixed(2)}%, 有效运费 ${row.effective_shipping_rate} (${row.effective_shipping_rate_type})`);
        });
        
        console.log('\n验证完成 ✓');
        
    } catch (error) {
        console.error('验证失败:', error);
        throw error;
    }
}

/**
 * 显示使用帮助
 */
function showHelp() {
    console.log(`
使用方法:
  node ${path.basename(__filename)}                    # 完整迁移（建表+导入数据）
  node ${path.basename(__filename)} --schema-only     # 仅创建表结构
  node ${path.basename(__filename)} --data-only       # 仅导入数据
  node ${path.basename(__filename)} --validate-only   # 仅验证现有数据
  node ${path.basename(__filename)} --help            # 显示帮助
`);
}

/**
 * 主函数
 */
async function main() {
    const args = process.argv.slice(2);
    
    try {
        console.log('=== 国家和州/省数据完整迁移脚本 ===');
        console.log(`执行时间: ${new Date().toLocaleString()}\n`);
        
        // 解析命令行参数
        if (args.includes('--help')) {
            showHelp();
            return;
        }
        
        const schemaOnly = args.includes('--schema-only');
        const dataOnly = args.includes('--data-only');
        const validateOnly = args.includes('--validate-only');
        
        if (validateOnly) {
            await validateImport();
            return;
        }
        
        // 获取数据库连接
        const connection = await getConnection();
        
        try {
            // 开始事务
            await connection.query('BEGIN');
            
            if (!dataOnly) {
                // 创建表结构
                await createSchema();
            }
            
            if (!schemaOnly) {
                // 导入数据
                await importData();
            }
            
            // 验证结果
            await validateImport();
            
            // 提交事务
            await connection.query('COMMIT');
            
            console.log('\n=== 迁移完成 ===');
            console.log('所有操作已成功完成！');
            
        } catch (error) {
            // 回滚事务
            await connection.query('ROLLBACK');
            throw error;
        } finally {
            // 释放连接
            connection.release();
        }
        
    } catch (error) {
        console.error('\n=== 迁移失败 ===');
        console.error('错误详情:', error);
        
        if (error.stack) {
            console.error('\n错误堆栈:');
            console.error(error.stack);
        }
        
        process.exit(1);
    } finally {
        // 数据库连接池会自动管理连接
    }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
    main();
}

/**
 * 获取国家默认运费费率
 * @param {string} countryCode - 国家代码
 * @returns {number} 运费费率
 */
function getCountryDefaultShippingRate(countryCode) {
    const shippingRates = {
        'US': 15.00,  // 美国
        'CA': 18.00,  // 加拿大
        'GB': 20.00,  // 英国
        'AU': 25.00,  // 澳大利亚
        'DE': 12.00,  // 德国
        'FR': 12.00,  // 法国
        'JP': 22.00,  // 日本
        'CN': 10.00,  // 中国
        'IN': 8.00,   // 印度
        'BR': 15.00,  // 巴西
        'MX': 12.00,  // 墨西哥
        'RU': 20.00,  // 俄罗斯
        'KR': 18.00,  // 韩国
        'IT': 14.00,  // 意大利
        'ES': 14.00,  // 西班牙
        'NL': 12.00,  // 荷兰
        'SE': 16.00,  // 瑞典
        'NO': 18.00,  // 挪威
        'DK': 16.00,  // 丹麦
        'FI': 16.00,  // 芬兰
        'CH': 20.00,  // 瑞士
        'AT': 14.00,  // 奥地利
        'BE': 12.00,  // 比利时
        'IE': 16.00,  // 爱尔兰
        'NZ': 25.00,  // 新西兰
        'SG': 15.00,  // 新加坡
        'HK': 12.00,  // 香港
        'TW': 15.00,  // 台湾
        'MY': 10.00,  // 马来西亚
        'TH': 8.00,   // 泰国
        'VN': 6.00,   // 越南
        'PH': 8.00,   // 菲律宾
        'ID': 7.00,   // 印度尼西亚
        'ZA': 12.00,  // 南非
        'EG': 8.00,   // 埃及
        'NG': 10.00,  // 尼日利亚
        'KE': 10.00,  // 肯尼亚
        'AR': 12.00,  // 阿根廷
        'CL': 15.00,  // 智利
        'CO': 10.00,  // 哥伦比亚
        'PE': 10.00,  // 秘鲁
        'VE': 8.00,   // 委内瑞拉
        'TR': 10.00,  // 土耳其
        'SA': 15.00,  // 沙特阿拉伯
        'AE': 12.00,  // 阿联酋
        'IL': 16.00,  // 以色列
        'PL': 10.00,  // 波兰
        'CZ': 10.00,  // 捷克
        'HU': 10.00,  // 匈牙利
        'RO': 8.00,   // 罗马尼亚
        'BG': 8.00,   // 保加利亚
        'HR': 10.00,  // 克罗地亚
        'SI': 12.00,  // 斯洛文尼亚
        'SK': 10.00,  // 斯洛伐克
        'LT': 10.00,  // 立陶宛
        'LV': 10.00,  // 拉脱维亚
        'EE': 10.00,  // 爱沙尼亚
        'GR': 12.00,  // 希腊
        'PT': 12.00,  // 葡萄牙
        'CY': 14.00,  // 塞浦路斯
        'MT': 14.00,  // 马耳他
        'LU': 12.00,  // 卢森堡
        'IS': 20.00,  // 冰岛
        'LI': 18.00,  // 列支敦士登
        'MC': 16.00,  // 摩纳哥
        'SM': 14.00,  // 圣马力诺
        'VA': 14.00,  // 梵蒂冈
        'AD': 14.00   // 安道尔
    };
    
    return shippingRates[countryCode] || 20.00; // 默认运费
}

/**
 * 导入国家时区数据到子表
 * @param {number} countryId - 国家ID
 * @param {Array} timezones - 时区数组
 */
async function importCountryTimezones(countryId, timezones) {
    if (!timezones || !Array.isArray(timezones) || timezones.length === 0) {
        return;
    }
    
    try {
        // 先删除该国家已有的时区数据
        await query('DELETE FROM country_timezones WHERE country_id = $1', [countryId]);
        
        // 批量插入新的时区数据
        for (const timezone of timezones) {
            if (timezone && typeof timezone === 'object') {
                await query(
                    `INSERT INTO country_timezones (country_id, zone_name, gmt_offset, gmt_offset_name, abbreviation, tz_name) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        countryId,
                        timezone.zoneName || null,
                        timezone.gmtOffset || null,
                        timezone.gmtOffsetName || null,
                        timezone.abbreviation || null,
                        timezone.tzName || null
                    ]
                );
            }
        }
    } catch (error) {
        console.error(`导入国家ID ${countryId} 的时区数据失败:`, error.message);
    }
}

/**
 * 导入国家翻译数据到子表
 * @param {number} countryId - 国家ID
 * @param {Object} translations - 翻译对象
 */
async function importCountryTranslations(countryId, translations) {
    if (!translations || typeof translations !== 'object') {
        return;
    }
    
    try {
        // 先删除该国家已有的翻译数据
        await query('DELETE FROM country_translations WHERE country_id = $1', [countryId]);
        
        // 批量插入新的翻译数据
        for (const [languageCode, translation] of Object.entries(translations)) {
            if (translation && typeof translation === 'object') {
                await query(
                    `INSERT INTO country_translations (country_id, language_code, official, common) 
                     VALUES ($1, $2, $3, $4)`,
                    [
                        countryId,
                        languageCode,
                        translation.official || null,
                        translation.common || null
                    ]
                );
            }
        }
    } catch (error) {
        console.error(`导入国家ID ${countryId} 的翻译数据失败:`, error.message);
    }
}

module.exports = {
    createSchema,
    importData,
    validateImport,
    executeSqlFile,
    tableExists,
    getTableCount,
    getCountryDefaultShippingRate,
    importCountryTimezones,
    importCountryTranslations
};