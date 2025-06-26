/**
 * Mock测试环境使用示例
 * 展示如何使用新的Mock数据库和测试工具
 */

const { mockPool, testData, setupMockDatabase } = require('../setup');

describe('Mock测试环境示例', () => {
  // 每个测试前重置Mock环境
  beforeEach(() => {
    setupMockDatabase();
  });

  describe('数据库Mock操作', () => {
    test('应该能够插入用户数据', async () => {
      const [result] = await mockPool.execute(
        'INSERT INTO users (guid, username, email, password, user_role, language, is_active, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['mock-guid', 'testuser', 'test@example.com', 'hashedpassword', 'user', 'en', 1, 1, 1]
      );

      expect(result.insertId).toBe(1);
      expect(result.affectedRows).toBe(1);
      expect(testData.users).toHaveLength(1);
      expect(testData.users[0].username).toBe('testuser');
    });

    test('应该能够查询用户数据', async () => {
      // 先插入测试数据
      testData.users.push({
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      });

      const [rows] = await mockPool.query('SELECT * FROM users');
      
      expect(rows).toHaveLength(1);
      expect(rows[0].username).toBe('testuser');
    });

    test('应该能够更新用户数据', async () => {
      const [result] = await mockPool.execute(
        'UPDATE users SET username = ? WHERE id = ?',
        ['newusername', 1]
      );

      expect(result.affectedRows).toBe(1);
      expect(result.changedRows).toBe(1);
    });

    test('应该能够删除用户数据', async () => {
      const [result] = await mockPool.execute(
        'DELETE FROM users WHERE id = ?',
        [1]
      );

      expect(result.affectedRows).toBe(1);
    });

    test('应该能够清空表数据', async () => {
      // 先添加一些测试数据
      testData.users.push({ id: 1, username: 'user1' });
      testData.users.push({ id: 2, username: 'user2' });
      
      expect(testData.users).toHaveLength(2);

      await mockPool.execute('TRUNCATE TABLE users');
      
      expect(testData.users).toHaveLength(0);
    });
  });

  describe('连接池Mock操作', () => {
    test('应该能够获取数据库连接', async () => {
      const connection = await mockPool.getConnection();
      
      expect(connection).toBeDefined();
      expect(connection.execute).toBeDefined();
      expect(connection.query).toBeDefined();
      expect(connection.release).toBeDefined();
      expect(connection.rollback).toBeDefined();
      expect(connection.commit).toBeDefined();
      expect(connection.beginTransaction).toBeDefined();
    });

    test('应该能够使用连接执行查询', async () => {
      const connection = await mockPool.getConnection();
      
      const [result] = await connection.execute(
        'INSERT INTO users (guid, username, email, password, user_role, language, is_active, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['mock-guid', 'connuser', 'conn@example.com', 'hashedpassword', 'user', 'en', 1, 1, 1]
      );

      expect(result.insertId).toBe(1);
      expect(testData.users).toHaveLength(1);
      expect(testData.users[0].username).toBe('connuser');
      
      // 释放连接
      connection.release();
      expect(connection.release).toHaveBeenCalled();
    });
  });

  describe('测试数据管理', () => {
    test('应该能够直接操作测试数据', () => {
      // 直接添加测试数据
      testData.users.push({
        id: 1,
        username: 'directuser',
        email: 'direct@example.com'
      });

      expect(testData.users).toHaveLength(1);
      expect(testData.users[0].username).toBe('directuser');
    });

    test('应该在每个测试间隔离数据', () => {
      // 这个测试应该看不到上一个测试的数据
      expect(testData.users).toHaveLength(0);
      expect(testData.products).toHaveLength(0);
      expect(testData.orders).toHaveLength(0);
      expect(testData.cart).toHaveLength(0);
    });
  });

  describe('Mock函数验证', () => {
    test('应该能够验证Mock函数调用', async () => {
      await mockPool.execute('SELECT * FROM users');
      
      expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM users');
      expect(mockPool.execute).toHaveBeenCalledTimes(1);
    });

    test('应该能够重置Mock函数', () => {
      // setupMockDatabase 会重置所有Mock
      mockPool.execute('test');
      expect(mockPool.execute).toHaveBeenCalledTimes(1);
      
      setupMockDatabase();
      expect(mockPool.execute).toHaveBeenCalledTimes(0);
    });
  });
});