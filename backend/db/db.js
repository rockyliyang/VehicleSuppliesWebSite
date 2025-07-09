const mysql = require('mysql2/promise');
const { Pool } = require('pg');
// 环境变量已在应用启动时通过config/env.js加载

const DB_TYPE = process.env.DB_TYPE || 'mysql';
let pool;

if (DB_TYPE === 'postgresql') {
  // PostgreSQL连接池
  pool = new Pool({
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    user: process.env.PG_USER || 'vehicle_web_user',
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE || 'vehicle_supplies_db',
    ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 10, // 最大连接数
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // 连接超时时间增加到10秒
  });
} else {
  // MySQL连接池
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'VehicleWebUser',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'vehicle_supplies_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

// 统一的数据库连接封装
class DatabaseConnection {
  constructor(connection, dbType) {
    this.connection = connection;
    this.dbType = dbType;
  }

  async query(sql, params = []) {
    const result = await this.connection.query(sql, params);
    
    // 为结果添加统一的辅助方法
    if (this.dbType === 'postgresql') {
      // PostgreSQL 返回格式: { rows: [...], rowCount: n }
      result.getRows = () => result.rows;
      result.getRowCount = () => result.rowCount;
      result.getFirstRow = () => result.rows && result.rows.length > 0 ? result.rows[0] : null;
    } else {
      // MySQL 返回格式: [rows, fields] 或直接是 rows 数组
      const rows = Array.isArray(result[0]) ? result[0] : result;
      result.getRows = () => rows;
      result.getRowCount = () => rows.length;
      result.getFirstRow = () => rows && rows.length > 0 ? rows[0] : null;
      // 为了兼容，也添加 rows 和 rowCount 属性
      result.rows = rows;
      result.rowCount = rows.length;
    }
    
    return result;
  }

  async beginTransaction() {
    if (this.dbType === 'postgresql') {
      return await this.connection.query('BEGIN');
    } else {
      return await this.connection.beginTransaction();
    }
  }

  async commit() {
    if (this.dbType === 'postgresql') {
      return await this.connection.query('COMMIT');
    } else {
      return await this.connection.commit();
    }
  }

  async rollback() {
    if (this.dbType === 'postgresql') {
      return await this.connection.query('ROLLBACK');
    } else {
      return await this.connection.rollback();
    }
  }

  release() {
    this.connection.release();
  }
}

// 统一的连接获取方法
async function getConnection() {
  if (DB_TYPE === 'postgresql') {
    const client = await pool.connect();
    return new DatabaseConnection(client, 'postgresql');
  } else {
    const connection = await pool.getConnection();
    return new DatabaseConnection(connection, 'mysql');
  }
}

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await getConnection();
    console.log(`${DB_TYPE}数据库连接成功`);
    connection.release();
  } catch (error) {
    console.error(`${DB_TYPE}数据库连接失败:`, error);
  }
}

// 全局查询函数，用于简单查询
async function query(sql, params = []) {
  const connection = await getConnection();
  try {
    const result = await connection.query(sql, params);
    return result;
  } finally {
    connection.release();
  }
}

testConnection();

module.exports = { pool, DB_TYPE, getConnection, query };