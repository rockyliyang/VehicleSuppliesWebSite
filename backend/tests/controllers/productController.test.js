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

const productController = require('../../controllers/productController');
const { createMockRequest, createMockResponse } = require('../utils/mockUtils');

describe('ProductController', () => {
  let mockConnection;
  
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 设置默认模拟返回值
    mockGetMessage.mockImplementation((key) => `Mock message for ${key}`);
    mockUuidToBinary.mockReturnValue(Buffer.from('mock-uuid'));
    mockBinaryToUuid.mockReturnValue('mock-uuid-string');
    mockUuidv4.mockReturnValue('mock-uuid-string');
    
    // 模拟数据库连接
    mockConnection = {
      query: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    
    mockPool.getConnection = jest.fn().mockResolvedValue(mockConnection);
  });
  
  describe('generateProductCode', () => {
    it('应该成功生成产品编号', async () => {
      const req = createMockRequest({
        query: { category_id: 1 }
      });
      const res = createMockResponse();
      
      // 模拟分类存在
      mockPool.query = jest.fn()
        .mockResolvedValueOnce([[{ code: 'CAT' }]]) // 分类查询
        .mockResolvedValueOnce([[{ count: 5 }]]); // 产品数量查询
      
      await productController.generateProductCode(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mock message for PRODUCT.CODE_GENERATED',
        data: 'CAT0006' // CAT + (5+1).padStart(4, '0')
      });
    });
    
    it('应该在分类不存在时返回404错误', async () => {
      const req = createMockRequest({
        params: { categoryId: '999' }
      });
      const res = createMockResponse();

      // 模拟分类不存在
      mockPool.query = jest.fn().mockResolvedValueOnce([[]]);

      await productController.generateProductCode(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for PRODUCT.CATEGORY_NOT_FOUND'
      });
    });

    it('应该在数据库错误时返回500错误', async () => {
      const req = createMockRequest({
        params: { categoryId: '1' }
      });
      const res = createMockResponse();

      // 模拟数据库错误
      mockPool.query = jest.fn().mockRejectedValue(new Error('Database error'));

      await productController.generateProductCode(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for PRODUCT.CODE_GENERATION_FAILED'
      });
    });
  });
  
  describe('createProduct', () => {
    beforeEach(() => {
      // 重置mockPool.query模拟，避免被其他测试影响
      mockPool.query.mockReset();
    });
    
    it('应该成功创建产品', async () => {
      const req = createMockRequest({
        body: {
          name: '测试产品',
          product_code: 'TEST001',
          category_id: 1,
          price: 100.00,
          stock: 10,
          status: 1,
          product_type: 'consignment',
          thumbnail_url: 'test.jpg',
          short_description: '简短描述',
          full_description: '详细描述'
        },
        userId: 1
      });
      const res = createMockResponse();
      
      // 模拟产品编号不存在，创建成功
      mockConnection.query = jest.fn()
        .mockResolvedValueOnce([[]]) // 产品编号不存在
        .mockResolvedValueOnce([{ insertId: 123 }]); // 插入成功
      
      await productController.createProduct(req, res);
      
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mock message for PRODUCT.CREATE_SUCCESS',
        data: expect.objectContaining({
          id: 123,
          name: '测试产品'
        })
      });
    });
    
    it('应该在产品类型无效时返回400错误', async () => {
      const req = createMockRequest({
        body: {
          name: '测试产品',
          product_code: 'TEST001',
          category_id: 1,
          price: 100.00,
          product_type: 'invalid_type' // 无效类型
        },
        userId: 1
      });
      const res = createMockResponse();
      
      await productController.createProduct(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for PRODUCT.INVALID_TYPE'
      });
    });
    
    it('应该在产品编号已存在时返回400错误', async () => {
      const req = createMockRequest({
        body: {
          name: '测试产品',
          product_code: 'EXISTING001',
          category_id: 1,
          price: 100.00,
          product_type: 'consignment'
        },
        userId: 1
      });
      const res = createMockResponse();
      
      // 模拟产品编号已存在
      mockConnection.query = jest.fn()
        .mockResolvedValueOnce([[{ id: 1 }]]); // 产品编号存在
      
      await productController.createProduct(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for PRODUCT.CODE_EXISTS'
      });
    });
    
    it('应该使用默认值当可选字段未提供时', async () => {
      const req = createMockRequest({
        body: {
          name: '测试产品',
          product_code: 'TEST001',
          category_id: 1,
          price: 100.00
          // 其他字段使用默认值
        },
        userId: 1
      });
      const res = createMockResponse();
      
      // 模拟产品编号不存在，创建成功
      mockConnection.query = jest.fn()
        .mockResolvedValueOnce([[]]) // 产品编号不存在
        .mockResolvedValueOnce([{ insertId: 123 }]); // 插入成功
      
      await productController.createProduct(req, res);
      
      // 验证使用了默认值
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products'),
        expect.arrayContaining([
          '测试产品',
          'TEST001',
          1,
          100.00,
          0, // 默认stock
          1, // 默认status
          'consignment', // 默认product_type
          null, // 默认thumbnail_url
          '', // 默认short_description
          '', // 默认full_description
          expect.any(Buffer), // guid
          1, // created_by
          1  // updated_by
        ])
      );
    });
    
    it('应该在数据库错误时回滚事务并返回500错误', async () => {
      const req = createMockRequest({
        body: {
          name: '测试产品',
          product_code: 'TEST001',
          category_id: 1,
          price: 100.00,
          product_type: 'consignment'
        },
        userId: 1
      });
      const res = createMockResponse();
      
      // 模拟数据库错误
      mockConnection.query = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await productController.createProduct(req, res);
      
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});