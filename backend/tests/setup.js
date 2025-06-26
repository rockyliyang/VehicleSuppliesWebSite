// Mock数据库连接，避免连接真实数据库
const mockPool = {
  execute: jest.fn(),
  query: jest.fn(),
  end: jest.fn().mockResolvedValue(undefined),
  getConnection: jest.fn()
};

// 全局Mock设置
jest.mock('../db/db', () => ({
  pool: mockPool
}));

// Mock其他常用模块
jest.mock('../config/messages', () => ({
  getMessage: jest.fn().mockReturnValue('Mock message')
}));

jest.mock('../utils/uuid', () => ({
  uuidToBinary: jest.fn().mockReturnValue(Buffer.from('mock-uuid-binary')),
  binaryToUuid: jest.fn().mockReturnValue('mock-uuid-string')
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-v4')
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('mock-hashed-password'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock SSE Handler - 修复内存泄漏问题
jest.mock('../utils/sseHandler', () => {
  return jest.fn().mockImplementation(() => {
    const mockInstance = {
      addConnection: jest.fn(),
      removeConnection: jest.fn(),
      broadcast: jest.fn(),
      sendToUser: jest.fn(),
      getConnectionCount: jest.fn().mockReturnValue(0),
      startHeartbeat: jest.fn(),
      stopHeartbeat: jest.fn(),
      cleanup: jest.fn()
    };
    return mockInstance;
  });
});

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' })
  })
}));

// Mock multer
jest.mock('multer', () => {
  const multer = () => ({
    single: jest.fn().mockReturnValue((req, res, next) => next()),
    array: jest.fn().mockReturnValue((req, res, next) => next()),
    fields: jest.fn().mockReturnValue((req, res, next) => next())
  });
  multer.memoryStorage = jest.fn();
  return multer;
});

// 测试数据存储
const testData = {
  users: [],
  products: [],
  orders: [],
  cart: []
};

// Mock数据库操作
const setupMockDatabase = () => {
  // 重置所有mock
  jest.clearAllMocks();
  
  // 清空测试数据
  Object.keys(testData).forEach(key => {
    testData[key] = [];
  });
  
  // Mock execute方法
  mockPool.execute.mockImplementation(async (sql, params = []) => {
    return mockDatabaseOperation(sql, params);
  });
  
  // Mock query方法
  mockPool.query.mockImplementation(async (sql, params = []) => {
    return mockDatabaseOperation(sql, params);
  });
  
  // Mock getConnection方法
  mockPool.getConnection.mockImplementation(() => {
    return Promise.resolve({
      execute: mockPool.execute,
      query: mockPool.query,
      release: jest.fn(),
      rollback: jest.fn(),
      commit: jest.fn(),
      beginTransaction: jest.fn()
    });
  });
};

// 统一的数据库操作Mock函数
const mockDatabaseOperation = async (sql, params = []) => {
  // Mock TRUNCATE操作
  if (sql.includes('TRUNCATE')) {
    const tableName = sql.match(/TRUNCATE TABLE (\w+)/)?.[1];
    if (tableName && testData[tableName]) {
      testData[tableName] = [];
    }
    return [{ affectedRows: 0 }];
  }
  
  // Mock INSERT操作
  if (sql.includes('INSERT INTO users')) {
    const newUser = {
      id: testData.users.length + 1,
      guid: params[0],
      username: params[1],
      email: params[2],
      password: params[3],
      user_role: params[4],
      language: params[5],
      is_active: params[6]
    };
    testData.users.push(newUser);
    return [{ insertId: newUser.id, affectedRows: 1 }];
  }
  
  // Mock SELECT操作
  if (sql.includes('SELECT') && sql.includes('FROM users')) {
    if (sql.includes('WHERE')) {
      // 简单的WHERE条件处理
      const user = testData.users[0] || null;
      return [user ? [user] : [], []];
    }
    return [testData.users, []];
  }
  
  // Mock UPDATE操作
  if (sql.includes('UPDATE users')) {
    return [{ affectedRows: 1, changedRows: 1 }];
  }
  
  // Mock DELETE操作
  if (sql.includes('DELETE FROM users')) {
    return [{ affectedRows: 1 }];
  }
  
  // Mock其他操作
  return [{ affectedRows: 1 }];
};

const testPool = mockPool;

// 测试前的设置
const setupTests = async () => {
  try {
    // 初始化Mock数据库
    setupMockDatabase();
    
    // 清理测试数据
    await mockPool.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // 清理用户表
    await mockPool.execute('TRUNCATE TABLE users');
    
    // 重新启用外键检查
    await mockPool.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Mock测试数据库已清理');
  } catch (error) {
    console.error('测试设置失败:', error);
    throw error;
  }
};

// 测试后的清理
const teardownTests = async () => {
  try {
    await mockPool.end();
    // 清空所有测试数据
    Object.keys(testData).forEach(key => {
      testData[key] = [];
    });
    console.log('Mock测试数据库连接已关闭');
  } catch (error) {
    console.error('测试清理失败:', error);
  }
};

// 创建测试用户
const createTestUser = async (userData = {}) => {
  const bcrypt = require('bcrypt');
  const { uuidToBinary } = require('../utils/uuid');
  const { v4: uuidv4 } = require('uuid');
  
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    user_role: 'user',
    language: 'en',
    is_active: 1
  };
  
  const user = { ...defaultUser, ...userData };
  const hashedPassword = await bcrypt.hash(user.password, 10);
  const guid = uuidToBinary(uuidv4());
  
  const [result] = await mockPool.execute(
    `INSERT INTO users (guid, username, email, password, user_role, language, is_active, created_by, updated_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
    [guid, user.username, user.email, hashedPassword, user.user_role, user.language, user.is_active]
  );
  
  return {
    id: result.insertId,
    ...user,
    password: hashedPassword
  };
};

// Jest全局设置和清理
beforeEach(async () => {
  setupMockDatabase();
});

afterEach(async () => {
  jest.clearAllMocks();
  // 清空测试数据
  Object.keys(testData).forEach(key => {
    testData[key] = [];
  });
});

afterAll(async () => {
  await teardownTests();
});

module.exports = {
  testPool: mockPool,
  mockPool,
  testData,
  setupTests,
  teardownTests,
  createTestUser,
  setupMockDatabase
};