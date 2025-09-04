#!/usr/bin/env node

/**
 * 清理未使用的媒体文件工具
 * 扫描 public/static/images 和 public/static/videos 目录下的文件
 * 检查哪些文件不在数据库表中，并移动到备份目录
 * 
 * 检查的表包括：
 * - product_images (image_url)
 * - common_content_images (image_url)
 * - banners (image_url)
 * - product_review_images (image_url)
 * - company_info (logo_url, wechat_qrcode)
 */

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// 数据库连接配置
const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'vehicle_supplies_db',
  password: process.env.PG_PASSWORD || 'password',
  port: process.env.PG_PORT || 5432,
});

// 配置
const config = {
  
  staticDir: path.join(__dirname, '../public/static'),
  backupDir: path.join(__dirname, '../public/static_backup'),
  scanDirs: ['images', 'videos'],
  supportedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', 'avif','.svg', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
};

/**
 * 获取数据库中所有使用的媒体文件路径
 */
async function getUsedMediaFiles() {
  const client = await pool.connect();
  const usedFiles = new Set();
  
  try {
    console.log('正在查询数据库中使用的媒体文件...');
    console.log('direname is :',__dirname);
    // 查询 product_images 表 - 关联 products 表确保产品未被删除
    const productImagesQuery = `
      SELECT pi.image_url FROM product_images pi
      INNER JOIN products p ON pi.product_id = p.id
      WHERE pi.deleted = FALSE AND p.deleted = FALSE 
        AND pi.image_url IS NOT NULL AND pi.image_url != ''
    `;
    const productImagesResult = await client.query(productImagesQuery);
    productImagesResult.rows.forEach(row => {
      if (row.image_url) {
        usedFiles.add(row.image_url);
      }
    });
    console.log(`从 product_images 表找到 ${productImagesResult.rows.length} 个文件`);
    
    // 查询 common_content_images 表 - 关联 common_content 表确保内容未被删除
    const commonContentImagesQuery = `
      SELECT cci.image_url FROM common_content_images cci
      INNER JOIN common_content cc ON cci.content_id = cc.id
      WHERE cci.deleted = FALSE AND cc.deleted = FALSE 
        AND cci.image_url IS NOT NULL AND cci.image_url != ''
    `;
    const commonContentImagesResult = await client.query(commonContentImagesQuery);
    commonContentImagesResult.rows.forEach(row => {
      if (row.image_url) {
        usedFiles.add(row.image_url);
      }
    });
    console.log(`从 common_content_images 表找到 ${commonContentImagesResult.rows.length} 个文件`);
    
    // 查询 banners 表
    const bannersQuery = `
      SELECT image_url FROM banners 
      WHERE deleted = FALSE AND image_url IS NOT NULL AND image_url != ''
    `;
    const bannersResult = await client.query(bannersQuery);
    bannersResult.rows.forEach(row => {
      if (row.image_url) {
        usedFiles.add(row.image_url);
      }
    });
    console.log(`从 banners 表找到 ${bannersResult.rows.length} 个文件`);
    
    // 查询 product_review_images 表 - 关联 product_reviews 表确保评论未被删除
    const productReviewImagesQuery = `
      SELECT pri.image_url FROM product_review_images pri
      INNER JOIN product_reviews pr ON pri.review_id = pr.id
      WHERE pri.deleted = FALSE AND pr.deleted = FALSE 
        AND pri.image_url IS NOT NULL AND pri.image_url != ''
    `;
    const productReviewImagesResult = await client.query(productReviewImagesQuery);
    productReviewImagesResult.rows.forEach(row => {
      if (row.image_url) {
        usedFiles.add(row.image_url);
      }
    });
    console.log(`从 product_review_images 表找到 ${productReviewImagesResult.rows.length} 个文件`);
    
    // 查询 company_info 表的 logo_url 和 wechat_qrcode
    const companyInfoQuery = `
      SELECT logo_url, wechat_qrcode FROM company_info 
      WHERE deleted = FALSE
    `;
    const companyInfoResult = await client.query(companyInfoQuery);
    companyInfoResult.rows.forEach(row => {
      if (row.logo_url) {
        usedFiles.add(row.logo_url);
      }
      if (row.wechat_qrcode) {
        usedFiles.add(row.wechat_qrcode);
      }
    });
    console.log(`从 company_info 表找到 ${companyInfoResult.rows.length * 2} 个可能的文件`);
    
    console.log(`数据库中总共使用了 ${usedFiles.size} 个唯一的媒体文件`);
    return usedFiles;
    
  } catch (error) {
    console.error('查询数据库时出错:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 递归扫描目录获取所有媒体文件
 */
async function scanDirectory(dirPath, relativePath = '') {
  const files = [];
  
  try {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativeFilePath = path.join(relativePath, item).replace(/\\/g, '/');
      
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        // 递归扫描子目录
        const subFiles = await scanDirectory(fullPath, relativeFilePath);
        files.push(...subFiles);
      } else if (stat.isFile()) {
        // 检查文件扩展名
        const ext = path.extname(item).toLowerCase();
        if (config.supportedExtensions.includes(ext)) {
          files.push({
            fullPath,
            relativePath: relativeFilePath,
            fileName: item,
            size: stat.size
          });
        }
      }
    }
  } catch (error) {
    console.error(`扫描目录 ${dirPath} 时出错:`, error.message);
  }
  
  return files;
}

/**
 * 检查文件是否在数据库中被使用
 */
function isFileUsed(filePath, usedFiles) {
  // 检查完整路径
  if (usedFiles.has(filePath)) {
    return true;
  }
  
  // 检查以 /static/ 开头的路径
  const staticPath = `/static/${filePath}`;
  if (usedFiles.has(staticPath)) {
    return true;
  }
  
  // 检查以 /public/static/ 开头的路径
  const publicStaticPath = `/public/static/${filePath}`;
  if (usedFiles.has(publicStaticPath)) {
    return true;
  }
  
  // 检查绝对URL路径（可能包含域名）
  for (const usedFile of usedFiles) {
    if (usedFile.includes(filePath)) {
      return true;
    }
  }
  
  return false;
}

/**
 * 创建备份目录
 */
async function ensureBackupDirectory() {
  try {
    await fs.access(config.backupDir);
  } catch (error) {
    console.log(`创建备份目录: ${config.backupDir}`);
    await fs.mkdir(config.backupDir, { recursive: true });
  }
}

/**
 * 移动文件到备份目录
 */
async function moveFileToBackup(file) {
  const backupPath = path.join(config.backupDir, file.relativePath);
  const backupDir = path.dirname(backupPath);
  
  // 确保备份目录存在
  await fs.mkdir(backupDir, { recursive: true });
  
  // 移动文件
  await fs.rename(file.fullPath, backupPath);
  
  return backupPath;
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 主函数
 */
async function main() {
  console.log('开始清理未使用的媒体文件...');
  console.log('='.repeat(50));
  
  try {
    // 获取数据库中使用的文件
    const usedFiles = await getUsedMediaFiles();
    
    // 确保备份目录存在
    await ensureBackupDirectory();
    
    let totalScannedFiles = 0;
    let totalUnusedFiles = 0;
    let totalSavedSpace = 0;
    
    // 扫描每个目录
    for (const scanDir of config.scanDirs) {
      const fullScanPath = path.join(config.staticDir, scanDir);
      
      console.log(`\n正在扫描目录: ${fullScanPath}`);
      
      try {
        await fs.access(fullScanPath);
      } catch (error) {
        console.log(`目录不存在，跳过: ${fullScanPath}`);
        continue;
      }
      
      const files = await scanDirectory(fullScanPath, scanDir);
      totalScannedFiles += files.length;
      
      console.log(`找到 ${files.length} 个媒体文件`);
      
      const unusedFiles = [];
      
      // 检查每个文件是否被使用
      for (const file of files) {
        if (!isFileUsed(file.relativePath, usedFiles)) {
          unusedFiles.push(file);
        }
      }
      
      console.log(`发现 ${unusedFiles.length} 个未使用的文件`);
      
      // 移动未使用的文件
      if (unusedFiles.length > 0) {
        console.log('\n移动未使用的文件到备份目录:');
        
        for (const file of unusedFiles) {
          try {
            const backupPath = await moveFileToBackup(file);
            totalSavedSpace += file.size;
            console.log(`✓ ${file.relativePath} -> ${path.relative(process.cwd(), backupPath)} (${formatFileSize(file.size)})`);
          } catch (error) {
            console.error(`✗ 移动文件失败 ${file.relativePath}:`, error.message);
          }
        }
        
        totalUnusedFiles += unusedFiles.length;
      }
    }
    
    // 输出统计信息
    console.log('\n' + '='.repeat(50));
    console.log('清理完成！统计信息:');
    console.log(`扫描文件总数: ${totalScannedFiles}`);
    console.log(`未使用文件数: ${totalUnusedFiles}`);
    console.log(`节省空间: ${formatFileSize(totalSavedSpace)}`);
    console.log(`备份目录: ${config.backupDir}`);
    
    if (totalUnusedFiles === 0) {
      console.log('\n🎉 没有发现未使用的文件，所有媒体文件都在使用中！');
    } else {
      console.log(`\n📦 已将 ${totalUnusedFiles} 个未使用的文件移动到备份目录`);
      console.log('如果确认这些文件不需要，可以手动删除备份目录');
    }
    
  } catch (error) {
    console.error('执行过程中出错:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  getUsedMediaFiles,
  scanDirectory,
  isFileUsed
};