const bcrypt = require('bcrypt');

// Mock dependencies
const mockPool = {
  query: jest.fn(),
  getConnection: jest.fn()
};

const mockGetMessage = jest.fn();
const mockUuidToBinary = jest.fn();
const mockUuidv4 = jest.fn();

jest.mock('../../db/db', () => ({
  pool: mockPool
}));

jest.mock('../../config/messages', () => ({
  getMessage: mockGetMessage
}));

const mockBinaryToUuid = jest.fn();

jest.mock('../../utils/uuid', () => ({
  uuidToBinary: mockUuidToBinary,
  binaryToUuid: mockBinaryToUuid
}));

jest.mock('uuid', () => ({
  v4: mockUuidv4
}));

jest.mock('bcrypt');

const userManagementController = require('../../controllers/userManagementController');
const { createMockRequest, createMockResponse } = require('../utils/mockUtils');


describe('UserManagementController', () => {
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 设置默认模拟返回值
    mockGetMessage.mockImplementation((key) => {
      const messages = {
        'USER_MANAGEMENT.REQUIRED_FIELDS_MISSING': 'Mock message for REQUIRED_FIELDS_MISSING',
        'USER_MANAGEMENT.INVALID_ROLE': 'Mock message for INVALID_ROLE',
        'USER_MANAGEMENT.USERNAME_EXISTS': 'Mock message for USERNAME_EXISTS',
        'USER_MANAGEMENT.EMAIL_EXISTS': 'Mock message for EMAIL_EXISTS',
        'USER_MANAGEMENT.USER_CREATE_SUCCESS': 'Mock message for USER_CREATE_SUCCESS',
        'USER_MANAGEMENT.USER_CREATE_FAILED': 'Mock message for USER_CREATE_FAILED',
        'USER_MANAGEMENT.ROLE_UPDATE_SUCCESS': 'Mock message for ROLE_UPDATE_SUCCESS',
        'USER_MANAGEMENT.ROLE_UPDATE_FAILED': 'Mock message for ROLE_UPDATE_FAILED',
        'USER_MANAGEMENT.USER_NOT_FOUND': 'Mock message for USER_NOT_FOUND',
        'USER_MANAGEMENT.CANNOT_MODIFY_SELF': 'Mock message for CANNOT_MODIFY_SELF'
      };
      return messages[key] || 'Mock message';
    });
    mockUuidToBinary.mockReturnValue(Buffer.from('mock-uuid'));
    mockBinaryToUuid.mockReturnValue('mock-uuid-string');
    mockUuidv4.mockReturnValue('mock-uuid-string');
    bcrypt.hash.mockResolvedValue('hashed-password');
  });
  
  describe('createUser', () => {
    it('应该成功创建用户', async () => {
      const req = createMockRequest({
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          user_role: 'user',
          language: 'en'
        },
        userId: 1
      });
      const res = createMockResponse();
      
      // 模拟数据库查询结果
      mockPool.query = jest.fn()
        .mockResolvedValueOnce([[]]) // 用户名不存在
        .mockResolvedValueOnce([[]]) // 邮箱不存在
        .mockResolvedValueOnce([{ insertId: 123 }]); // 插入成功
      
      await userManagementController.createUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mock message for USER_CREATE_SUCCESS',
        data: {
          id: 123,
          username: 'testuser',
          email: 'test@example.com',
          phone: undefined,
          user_role: 'user',
          language: 'en'
        }
      });
    });
    
    it('应该在缺少必填字段时返回400错误', async () => {
      const req = createMockRequest({
        body: { username: 'testuser' } // 缺少其他必填字段
      });
      const res = createMockResponse();

      await userManagementController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for REQUIRED_FIELDS_MISSING',
        data: null
      });
    });

    it('应该在无效角色时返回400错误', async () => {
      const req = createMockRequest({
        body: {
          username: 'testuser',
          email: 'test@example.com',
          phone: '1234567890',
          password: 'password123',
          user_role: 'invalid_role',
          language: 'zh'
        }
      });
      const res = createMockResponse();

      await userManagementController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for INVALID_ROLE',
        data: null
      });
    });

    it('应该在用户名已存在时返回409错误', async () => {
      const req = createMockRequest({
        body: {
          username: 'existinguser',
          email: 'test@example.com',
          phone: '1234567890',
          password: 'password123',
          user_role: 'admin',
          language: 'zh'
        }
      });
      const res = createMockResponse();

      // 模拟用户名已存在
      mockPool.query.mockResolvedValueOnce([[{ id: 1 }]]);

      await userManagementController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for USERNAME_EXISTS',
        data: null
      });
    });

    it('应该在邮箱已存在时返回409错误', async () => {
      const req = createMockRequest({
        body: {
          username: 'testuser',
          email: 'existing@example.com',
          phone: '1234567890',
          password: 'password123',
          user_role: 'admin',
          language: 'zh'
        }
      });
      const res = createMockResponse();

      // 模拟邮箱已存在
      mockPool.query
        .mockResolvedValueOnce([[]]) // 用户名不存在
        .mockResolvedValueOnce([[{ id: 1 }]]); // 邮箱已存在

      await userManagementController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for EMAIL_EXISTS',
        data: null
      });
    });

    it('应该在数据库错误时返回500错误', async () => {
      const req = createMockRequest({
        body: {
          username: 'testuser',
          email: 'test@example.com',
          phone: '1234567890',
          password: 'password123',
          user_role: 'admin',
          language: 'zh'
        }
      });
      const res = createMockResponse();

      // 模拟数据库错误
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      await userManagementController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for USER_CREATE_FAILED',
        data: null
      });
    });
  });
  
  describe('updateUserRole', () => {
    it('应该成功更新用户角色', async () => {
      const req = createMockRequest({
        params: { id: '1' },
        body: { user_role: 'admin' },
        userId: 2
      });
      const res = createMockResponse();

      // 模拟数据库查询
      mockPool.query
        .mockResolvedValueOnce([[{ id: 1, user_role: 'user', email: 'test@example.com' }]]) // 用户存在
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // 更新成功

      await userManagementController.updateUserRole(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mock message for ROLE_UPDATE_SUCCESS',
        data: {
          id: 1,
          user_role: 'admin',
          email: 'test@example.com',
          previous_role: 'user'
        }
      });
    });

    it('应该在无效角色时返回400错误', async () => {
      const req = createMockRequest({
        params: { id: '1' },
        body: { user_role: 'invalid_role' },
        userId: 2
      });
      const res = createMockResponse();

      await userManagementController.updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for INVALID_ROLE',
        data: null
      });
    });

    it('应该在用户不存在时返回404错误', async () => {
      const req = createMockRequest({
        params: { id: '999' },
        body: { user_role: 'admin' },
        userId: 2
      });
      const res = createMockResponse();

      // 模拟用户存在但更新失败（用户不存在或已删除）
      mockPool.query
        .mockResolvedValueOnce([[{ id: 999, user_role: 'user' }]]) // 用户存在
        .mockResolvedValueOnce([{ affectedRows: 0 }]); // 更新失败

      await userManagementController.updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for USER_NOT_FOUND',
        data: null
      });
    });

    it('应该在尝试修改自身角色时返回400错误', async () => {
      const req = createMockRequest({
        params: { id: '1' },
        body: { user_role: 'user' },
        userId: 1
      });
      const res = createMockResponse();

      // 模拟用户存在
      mockPool.query.mockResolvedValueOnce([[{ id: 1, user_role: 'admin' }]]);

      await userManagementController.updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for CANNOT_MODIFY_SELF',
        data: null
      });
    });

    it('应该在数据库错误时返回500错误', async () => {
      const req = createMockRequest({
        params: { id: '1' },
        body: { user_role: 'admin' },
        userId: 2
      });
      const res = createMockResponse();

      // 模拟数据库错误
      mockPool.query
        .mockResolvedValueOnce([[{ id: 1, user_role: 'user' }]]) // 用户存在
        .mockRejectedValueOnce(new Error('Database error')); // 更新时出错

      await userManagementController.updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for ROLE_UPDATE_FAILED',
        data: null
      });
    });
  });
});