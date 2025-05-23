const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
// 加载环境变量配置
const env = require('../config/env');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vehicle_supplies',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function runMigration() {
  const connection = await pool.getConnection();
  try {
    // 开始事务
    await connection.beginTransaction();

    // 读取并执行迁移文件
    const migrationFiles = [
      '001_update_tables.sql',
      '002_update_guid_length.sql'
    ];

    for (const file of migrationFiles) {
      console.log(`执行迁移文件: ${file}`);
      const filePath = path.join(__dirname, 'migrations', file);
      const sql = await fs.readFile(filePath, 'utf8');
      
      // 分割SQL语句（按分号分割）
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      // 执行每个SQL语句
      for (const statement of statements) {
        if (statement.trim()) {
          await connection.query(statement);
        }
      }
    }

    // 提交事务
    await connection.commit();
    console.log('数据库迁移完成');
  } catch (error) {
    // 如果出错，回滚事务
    await connection.rollback();
    console.error('数据库迁移失败:', error);
    throw error;
  } finally {
    // 释放连接
    connection.release();
    // 关闭连接池
    await pool.end();
  }
}

// 执行迁移
runMigration().catch(console.error);