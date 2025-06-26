// Mock dependencies
const mockPool = {
  query: jest.fn(),
  getConnection: jest.fn()
};

const mockGetMessage = jest.fn();

jest.mock('../../db/db', () => ({
  pool: mockPool
}));

jest.mock('../../config/messages', () => ({
  getMessage: mockGetMessage
}));

const cartController = require('../../controllers/cartController');
const { createMockRequest, createMockResponse } = require('../utils/mockUtils');

describe('CartController', () => {
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 设置默认模拟返回值
    mockGetMessage.mockImplementation((key) => `Mock message for ${key}`);
  });
  
  describe('getUserCart', () => {
    it('应该成功获取用户购物车', async () => {
      const req = createMockRequest({ userId: 1 });
      const res = createMockResponse();
      
      const mockCartItems = [
        {
          id: 1,
          guid: Buffer.from('item1'),
          quantity: 2,
          product_id: 101,
          name: '测试商品1',
          product_code: 'TEST001',
          price: 100.00,
          stock: 10,
          image_url: 'test1.jpg'
        },
        {
          id: 2,
          guid: Buffer.from('item2'),
          quantity: 1,
          product_id: 102,
          name: '测试商品2',
          product_code: 'TEST002',
          price: 200.00,
          stock: 5,
          image_url: 'test2.jpg'
        }
      ];
      
      mockPool.query = jest.fn().mockResolvedValue([mockCartItems]);
      
      await cartController.getUserCart(req, res);
      
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT ci.id, ci.guid, ci.quantity'),
        [1]
      );
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items: mockCartItems,
          totalPrice: 400.00 // 2*100 + 1*200
        }
      });
    });
    
    it('应该在购物车为空时返回404', async () => {
      const req = createMockRequest({ userId: 1 });
      const res = createMockResponse();
      
      mockPool.query = jest.fn().mockResolvedValue([[]]); // 空购物车
      
      await cartController.getUserCart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for CART.EMPTY'
      });
    });
    
    it('应该在数据库错误时返回500', async () => {
      const req = createMockRequest({ userId: 1 });
      const res = createMockResponse();
      
      mockPool.query = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await cartController.getUserCart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for CART.GET_FAILED'
      });
    });
  });
  
  describe('addToCart', () => {
    it('应该成功添加新商品到购物车', async () => {
      const req = createMockRequest({
        userId: 1,
        body: { productId: 101, quantity: 2 }
      });
      const res = createMockResponse();
      
      // 模拟商品存在且有库存
      mockPool.query = jest.fn()
        .mockResolvedValueOnce([[{ id: 101, stock: 10 }]]) // 商品查询
        .mockResolvedValueOnce([[]]) // 购物车中不存在该商品
        .mockResolvedValueOnce([{ insertId: 123 }]); // 插入成功
      
      await cartController.addToCart(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mock message for CART.ADD_SUCCESS',
        data: { id: 123, quantity: 2 }
      });
    });
    
    it('应该成功更新购物车中已存在商品的数量', async () => {
      const req = createMockRequest({
        userId: 1,
        body: { productId: 101, quantity: 1 }
      });
      const res = createMockResponse();
      
      // 模拟商品存在且有库存，购物车中已有该商品
      mockPool.query = jest.fn()
        .mockResolvedValueOnce([[{ id: 101, stock: 10 }]]) // 商品查询
        .mockResolvedValueOnce([[{ id: 1, quantity: 2 }]]) // 购物车中已存在
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // 更新成功
      
      await cartController.addToCart(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mock message for CART.UPDATE_SUCCESS',
        data: { id: 1, quantity: 3 } // 原有2 + 新增1
      });
    });
    
    it('应该在缺少productId时返回400错误', async () => {
      const req = createMockRequest({
        userId: 1,
        body: { quantity: 1 } // 缺少productId
      });
      const res = createMockResponse();
      
      await cartController.addToCart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for CART.PRODUCT_ID_REQUIRED'
      });
    });
    
    it('应该在商品不存在时返回404错误', async () => {
      const req = createMockRequest({
        userId: 1,
        body: { productId: 999, quantity: 1 }
      });
      const res = createMockResponse();
      
      // 模拟商品不存在
      mockPool.query = jest.fn().mockResolvedValueOnce([]);
      
      await cartController.addToCart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for CART.PRODUCT_NOT_FOUND'
      });
    });
    
    it('应该在库存不足时返回400错误', async () => {
      const req = createMockRequest({
        userId: 1,
        body: { productId: 101, quantity: 15 }
      });
      const res = createMockResponse();
      
      // 模拟商品存在但库存不足
      mockPool.query = jest.fn().mockResolvedValueOnce([{ id: 101, stock: 10 }]);
      
      await cartController.addToCart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for CART.INSUFFICIENT_STOCK'
      });
    });
    
    it('应该在数据库错误时返回500错误', async () => {
      const req = createMockRequest({
        userId: 1,
        body: { productId: 101, quantity: 1 }
      });
      const res = createMockResponse();
      
      mockPool.query = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await cartController.addToCart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for CART.ADD_FAILED'
      });
    });
    
    it('应该使用默认数量1当quantity未提供时', async () => {
      const req = createMockRequest({
        userId: 1,
        body: { productId: 101 } // 没有quantity
      });
      const res = createMockResponse();
      
      // 模拟商品存在且有库存
      mockPool.query = jest.fn()
        .mockResolvedValueOnce([[{ id: 101, stock: 10 }]]) // 商品查询
        .mockResolvedValueOnce([[]]) // 购物车中不存在该商品
        .mockResolvedValueOnce([{ insertId: 123 }]); // 插入成功
      
      await cartController.addToCart(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mock message for CART.ADD_SUCCESS',
        data: { id: 123, quantity: 1 } // 默认数量为1
      });
    });
  });
});