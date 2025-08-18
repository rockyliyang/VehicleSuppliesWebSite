/**
 * 国家和州/省数据导入程序
 * 从JSON文件导入国家和州/省数据到PostgreSQL数据库
 * 包含税率和运费费率的配置
 */

const fs = require('fs');
const path = require('path');

// 加载开发环境配置
require('dotenv').config({ path: require('path').join(__dirname, '../.env.development') });

// 使用项目的数据库连接
const { getConnection, query } = require('../db/db');

// 配置文件路径
const COUNTRIES_JSON_PATH = path.join(__dirname, '../public/country_state/countries.json');
const STATES_JSON_PATH = path.join(__dirname, '../public/country_state/states.json');

/**
 * 读取JSON文件
 * @param {string} filePath 文件路径
 * @returns {Array} JSON数据数组
 */
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`读取文件失败: ${filePath}`, error);
        throw error;
    }
}

/**
 * 导入国家数据
 * @param {Array} countries 国家数据数组
 */
async function importCountries(countries) {
    console.log('开始导入国家数据...');
    
    const insertQuery = `
        INSERT INTO countries (
            name, iso3, iso2, numeric_code, phone_code, capital, 
            currency, currency_name, currency_symbol, tld, native, 
            region, region_id, subregion, subregion_id, nationality, 
            latitude, longitude, emoji, emoji_u,
            tax_rate, shipping_rate, shipping_rate_type, status, deleted
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
            $17, $18, $19, $20, $21, $22, $23, $24, $25
        )
        ON CONFLICT (iso2) WHERE deleted = false DO UPDATE SET
            name = EXCLUDED.name,
            iso3 = EXCLUDED.iso3,
            numeric_code = EXCLUDED.numeric_code,
            phone_code = EXCLUDED.phone_code,
            capital = EXCLUDED.capital,
            currency = EXCLUDED.currency,
            currency_name = EXCLUDED.currency_name,
            currency_symbol = EXCLUDED.currency_symbol,
            tld = EXCLUDED.tld,
            native = EXCLUDED.native,
            region = EXCLUDED.region,
            region_id = EXCLUDED.region_id,
            subregion = EXCLUDED.subregion,
            subregion_id = EXCLUDED.subregion_id,
            nationality = EXCLUDED.nationality,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            emoji = EXCLUDED.emoji,
            emoji_u = EXCLUDED.emoji_u,
            tax_rate = EXCLUDED.tax_rate,
            shipping_rate = EXCLUDED.shipping_rate,
            shipping_rate_type = EXCLUDED.shipping_rate_type,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id, name, iso2;
    `;

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const country of countries) {
        try {
            // 设置默认的税率和运费费率
            const defaultTaxRate = getDefaultTaxRate(country.iso2);
            const defaultShippingRate = getDefaultShippingRate(country.iso2);
            const defaultShippingRateType = 'fixed';

            const values = [
                country.name,
                country.iso3,
                country.iso2,
                country.numeric_code,
                country.phone_code,
                country.capital,
                country.currency,
                country.currency_name,
                country.currency_symbol,
                country.tld,
                country.native,
                country.region,
                country.region_id,
                country.subregion,
                country.subregion_id,
                country.nationality,
                parseFloat(country.latitude) || null,
                parseFloat(country.longitude) || null,
                country.emoji,
                country.emojiU,
                defaultTaxRate,
                defaultShippingRate,
                defaultShippingRateType,
                'active',
                false
            ];

            const result = await query(insertQuery, values);
            const countryId = result.rows[0].id;
            
            // 导入时区数据到子表
            if (country.timezones && Array.isArray(country.timezones)) {
                await importCountryTimezones(countryId, country.timezones);
            }
            
            // 导入翻译数据到子表
            if (country.translations && typeof country.translations === 'object') {
                await importCountryTranslations(countryId, country.translations);
            }
            
            successCount++;
            
            if (successCount % 50 === 0) {
                console.log(`已导入 ${successCount} 个国家...`);
            }
        } catch (error) {
            errorCount++;
            errors.push({
                country: country.name,
                iso2: country.iso2,
                error: error.message
            });
            console.error(`导入国家失败: ${country.name} (${country.iso2})`, error.message);
        }
    }

    console.log(`国家数据导入完成: 成功 ${successCount} 个, 失败 ${errorCount} 个`);
    
    if (errors.length > 0) {
        console.log('\n导入失败的国家:');
        errors.forEach(err => {
            console.log(`- ${err.country} (${err.iso2}): ${err.error}`);
        });
    }

    return { successCount, errorCount, errors };
}

/**
 * 导入州/省数据
 * @param {Array} states 州/省数据数组
 */
async function importStates(states) {
    console.log('\n开始导入州/省数据...');
    
    // 首先获取所有国家的ID映射
    const countryMapQuery = 'SELECT id, iso2, name FROM countries WHERE deleted = FALSE';
    const countryResult = await query(countryMapQuery);
    const countryMap = new Map();
    
    countryResult.rows.forEach(country => {
        countryMap.set(country.iso2, {
            id: country.id,
            name: country.name
        });
    });

    console.log(`找到 ${countryMap.size} 个国家用于州/省数据关联`);

    const insertQuery = `
        INSERT INTO states (
            name, country_id, country_code, country_name, state_code, 
            type, latitude, longitude, tax_rate, shipping_rate, 
            shipping_rate_type, status, deleted
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
        ON CONFLICT (country_id, name) WHERE deleted = false DO UPDATE SET
            country_code = EXCLUDED.country_code,
            country_name = EXCLUDED.country_name,
            state_code = EXCLUDED.state_code,
            type = EXCLUDED.type,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id, name, country_code;
    `;

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const state of states) {
        try {
            const countryInfo = countryMap.get(state.country_code);
            
            if (!countryInfo) {
                skippedCount++;
                if (skippedCount <= 10) { // 只显示前10个跳过的记录
                    console.warn(`跳过州/省 ${state.name}: 找不到国家 ${state.country_code}`);
                }
                continue;
            }

            // 获取特定州/省的税率和运费费率（如果有特殊设置）
            const stateTaxRate = getStateTaxRate(state.country_code, state.state_code);
            const stateShippingRate = getStateShippingRate(state.country_code, state.state_code);
            const stateShippingRateType = getStateShippingRateType(state.country_code, state.state_code);

            const values = [
                state.name,
                countryInfo.id,
                state.country_code,
                state.country_name,
                state.state_code,
                state.type,
                parseFloat(state.latitude) || null,
                parseFloat(state.longitude) || null,
                stateTaxRate, // 可能为null，使用国家默认值
                stateShippingRate, // 可能为null，使用国家默认值
                stateShippingRateType, // 可能为null，使用国家默认值
                'active',
                false
            ];

            await query(insertQuery, values);
            successCount++;
            
            if (successCount % 500 === 0) {
                console.log(`已导入 ${successCount} 个州/省...`);
            }
        } catch (error) {
            errorCount++;
            errors.push({
                state: state.name,
                country_code: state.country_code,
                error: error.message
            });
            
            if (errorCount <= 10) { // 只显示前10个错误
                console.error(`导入州/省失败: ${state.name} (${state.country_code})`, error.message);
            }
        }
    }

    console.log(`州/省数据导入完成: 成功 ${successCount} 个, 失败 ${errorCount} 个, 跳过 ${skippedCount} 个`);
    
    if (errors.length > 0 && errors.length <= 20) {
        console.log('\n导入失败的州/省:');
        errors.slice(0, 20).forEach(err => {
            console.log(`- ${err.state} (${err.country_code}): ${err.error}`);
        });
        if (errors.length > 20) {
            console.log(`... 还有 ${errors.length - 20} 个错误未显示`);
        }
    }

    return { successCount, errorCount, skippedCount, errors };
}

/**
 * 导入国家时区数据
 * @param {number} countryId 国家ID
 * @param {Array} timezones 时区数据数组
 */
async function importCountryTimezones(countryId, timezones) {
    if (!timezones || !Array.isArray(timezones) || timezones.length === 0) {
        return;
    }
    
    // 先删除该国家的现有时区数据
    await query('DELETE FROM country_timezones WHERE country_id = $1', [countryId]);
    
    for (const timezone of timezones) {
        try {
            const insertQuery = `
                INSERT INTO country_timezones (
                    country_id, zone_name, gmt_offset, gmt_offset_name, 
                    abbreviation, tz_name
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `;
            
            const values = [
                countryId,
                timezone.zoneName || timezone.zone_name || '',
                timezone.gmtOffset || timezone.gmt_offset || 0,
                timezone.gmtOffsetName || timezone.gmt_offset_name || '',
                timezone.abbreviation || '',
                timezone.tzName || timezone.tz_name || ''
            ];
            
            await query(insertQuery, values);
        } catch (error) {
            console.error(`导入时区数据失败:`, error.message);
        }
    }
}

/**
 * 导入国家翻译数据
 * @param {number} countryId 国家ID
 * @param {Object} translations 翻译数据对象
 */
async function importCountryTranslations(countryId, translations) {
    if (!translations || typeof translations !== 'object') {
        return;
    }
    
    // 先删除该国家的现有翻译数据
    await query('DELETE FROM country_translations WHERE country_id = $1', [countryId]);
    
    for (const [languageCode, countryName] of Object.entries(translations)) {
        try {
            if (countryName && typeof countryName === 'string') {
                const insertQuery = `
                    INSERT INTO country_translations (
                        country_id, language_code, country_name
                    ) VALUES ($1, $2, $3)
                `;
                
                const values = [countryId, languageCode, countryName];
                await query(insertQuery, values);
            }
        } catch (error) {
            console.error(`导入翻译数据失败 (${languageCode}):`, error.message);
        }
    }
}

/**
 * 获取国家默认税率
 * @param {string} countryCode 国家代码
 * @returns {number} 税率
 */
function getDefaultTaxRate(countryCode) {
    // 这里可以根据实际需求设置不同国家的默认税率
    const taxRates = {
        'US': 0.0000, // 美国各州税率不同，在州级别设置
        'CN': 0.1300, // 中国增值税13%
        'CA': 0.0500, // 加拿大GST 5%
        'GB': 0.2000, // 英国VAT 20%
        'DE': 0.1900, // 德国VAT 19%
        'FR': 0.2000, // 法国VAT 20%
        'JP': 0.1000, // 日本消费税10%
        'AU': 0.1000, // 澳大利亚GST 10%
        // 可以继续添加更多国家的税率
    };
    
    return taxRates[countryCode] || 0.0000; // 默认0%
}

/**
 * 获取国家默认运费费率
 * @param {string} countryCode 国家代码
 * @returns {number} 运费费率
 */
function getDefaultShippingRate(countryCode) {
    // 这里可以根据实际需求设置不同国家的默认运费费率
    const shippingRates = {
        'US': 10.00, // 美国国内运费$10
        'CN': 15.00, // 中国国内运费¥15
        'CA': 12.00, // 加拿大运费$12
        'GB': 8.00,  // 英国运费£8
        'DE': 9.00,  // 德国运费€9
        'FR': 9.50,  // 法国运费€9.5
        'JP': 800,   // 日本运费¥800
        'AU': 15.00, // 澳大利亚运费$15
        // 可以继续添加更多国家的运费费率
    };
    
    return shippingRates[countryCode] || 20.00; // 默认$20
}

/**
 * 获取州/省特定税率
 * @param {string} countryCode 国家代码
 * @param {string} stateCode 州/省代码
 * @returns {number|null} 税率，null表示使用国家默认值
 */
function getStateTaxRate(countryCode, stateCode) {
    // 美国各州税率设置示例
    if (countryCode === 'US') {
        const usTaxRates = {
            'AL': 0.0400, // Alabama 4%
            'AK': 0.0000, // Alaska 0%
            'AZ': 0.0560, // Arizona 5.6%
            'AR': 0.0650, // Arkansas 6.5%
            'CA': 0.0725, // California 7.25%
            'CO': 0.0290, // Colorado 2.9%
            'CT': 0.0635, // Connecticut 6.35%
            'DE': 0.0000, // Delaware 0%
            'FL': 0.0600, // Florida 6%
            'GA': 0.0400, // Georgia 4%
            'HI': 0.0400, // Hawaii 4%
            'ID': 0.0600, // Idaho 6%
            'IL': 0.0625, // Illinois 6.25%
            'IN': 0.0700, // Indiana 7%
            'IA': 0.0600, // Iowa 6%
            'KS': 0.0650, // Kansas 6.5%
            'KY': 0.0600, // Kentucky 6%
            'LA': 0.0445, // Louisiana 4.45%
            'ME': 0.0550, // Maine 5.5%
            'MD': 0.0600, // Maryland 6%
            'MA': 0.0625, // Massachusetts 6.25%
            'MI': 0.0600, // Michigan 6%
            'MN': 0.0688, // Minnesota 6.875%
            'MS': 0.0700, // Mississippi 7%
            'MO': 0.0423, // Missouri 4.225%
            'MT': 0.0000, // Montana 0%
            'NE': 0.0550, // Nebraska 5.5%
            'NV': 0.0685, // Nevada 6.85%
            'NH': 0.0000, // New Hampshire 0%
            'NJ': 0.0663, // New Jersey 6.625%
            'NM': 0.0513, // New Mexico 5.125%
            'NY': 0.0800, // New York 8%
            'NC': 0.0475, // North Carolina 4.75%
            'ND': 0.0500, // North Dakota 5%
            'OH': 0.0575, // Ohio 5.75%
            'OK': 0.0450, // Oklahoma 4.5%
            'OR': 0.0000, // Oregon 0%
            'PA': 0.0600, // Pennsylvania 6%
            'RI': 0.0700, // Rhode Island 7%
            'SC': 0.0600, // South Carolina 6%
            'SD': 0.0450, // South Dakota 4.5%
            'TN': 0.0700, // Tennessee 7%
            'TX': 0.0625, // Texas 6.25%
            'UT': 0.0485, // Utah 4.85%
            'VT': 0.0600, // Vermont 6%
            'VA': 0.0530, // Virginia 5.3%
            'WA': 0.0650, // Washington 6.5%
            'WV': 0.0600, // West Virginia 6%
            'WI': 0.0500, // Wisconsin 5%
            'WY': 0.0400, // Wyoming 4%
            'DC': 0.0600, // District of Columbia 6%
        };
        
        return usTaxRates[stateCode] || null;
    }
    
    // 加拿大各省税率设置示例
    if (countryCode === 'CA') {
        const caTaxRates = {
            'AB': 0.0500, // Alberta GST 5%
            'BC': 0.1200, // British Columbia GST+PST 12%
            'MB': 0.1200, // Manitoba GST+PST 12%
            'NB': 0.1500, // New Brunswick HST 15%
            'NL': 0.1500, // Newfoundland and Labrador HST 15%
            'NT': 0.0500, // Northwest Territories GST 5%
            'NS': 0.1500, // Nova Scotia HST 15%
            'NU': 0.0500, // Nunavut GST 5%
            'ON': 0.1300, // Ontario HST 13%
            'PE': 0.1500, // Prince Edward Island HST 15%
            'QC': 0.1498, // Quebec GST+QST 14.975%
            'SK': 0.1100, // Saskatchewan GST+PST 11%
            'YT': 0.0500, // Yukon GST 5%
        };
        
        return caTaxRates[stateCode] || null;
    }
    
    return null; // 其他国家暂不设置州/省级别税率
}

/**
 * 获取州/省特定运费费率
 * @param {string} countryCode 国家代码
 * @param {string} stateCode 州/省代码
 * @returns {number|null} 运费费率，null表示使用国家默认值
 */
function getStateShippingRate(countryCode, stateCode) {
    // 这里可以根据需要设置特定州/省的运费费率
    // 例如：偏远地区可能运费更高
    
    if (countryCode === 'US') {
        const remoteStates = ['AK', 'HI']; // 阿拉斯加和夏威夷运费较高
        if (remoteStates.includes(stateCode)) {
            return 25.00; // 偏远州运费$25
        }
    }
    
    if (countryCode === 'CA') {
        const remoteProvinces = ['NT', 'NU', 'YT']; // 加拿大北部地区运费较高
        if (remoteProvinces.includes(stateCode)) {
            return 30.00; // 偏远省份运费$30
        }
    }
    
    return null; // 使用国家默认运费费率
}

/**
 * 获取州/省特定运费计算方式
 * @param {string} countryCode 国家代码
 * @param {string} stateCode 州/省代码
 * @returns {string|null} 运费计算方式，null表示使用国家默认值
 */
function getStateShippingRateType(countryCode, stateCode) {
    // 大部分情况下使用国家默认设置
    return null;
}

/**
 * 主函数
 */
async function main() {
    try {
        console.log('=== 国家和州/省数据导入程序 ===\n');
        
        // 检查文件是否存在
        if (!fs.existsSync(COUNTRIES_JSON_PATH)) {
            throw new Error(`国家数据文件不存在: ${COUNTRIES_JSON_PATH}`);
        }
        
        if (!fs.existsSync(STATES_JSON_PATH)) {
            throw new Error(`州/省数据文件不存在: ${STATES_JSON_PATH}`);
        }
        
        // 读取JSON数据
        console.log('读取JSON文件...');
        const countries = readJsonFile(COUNTRIES_JSON_PATH);
        const states = readJsonFile(STATES_JSON_PATH);
        
        console.log(`找到 ${countries.length} 个国家`);
        console.log(`找到 ${states.length} 个州/省\n`);
        
        // 导入国家数据
        const countryResult = await importCountries(countries);
        
        // 导入州/省数据
        const stateResult = await importStates(states);
        
        console.log('\n=== 导入完成 ===');
        console.log(`国家: 成功 ${countryResult.successCount}, 失败 ${countryResult.errorCount}`);
        console.log(`州/省: 成功 ${stateResult.successCount}, 失败 ${stateResult.errorCount}, 跳过 ${stateResult.skippedCount}`);
        
    } catch (error) {
        console.error('导入失败:', error);
        process.exit(1);
    } finally {
        // 数据库连接由连接池管理，无需手动关闭
    }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
    main();
}

module.exports = {
    importCountries,
    importStates,
    readJsonFile,
    getDefaultTaxRate,
    getDefaultShippingRate,
    getStateTaxRate,
    getStateShippingRate
};