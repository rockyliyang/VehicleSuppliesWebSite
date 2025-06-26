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

jest.mock('stripe', () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: jest.fn()
    }
  }));
});

const orderController = require('../../controllers/orderController');
const { createMockRequest, createMockResponse } = require('../utils/mockUtils');
const { pool } = require('../../db/db');
const { getMessage } = require('../../config/messages');
const { binaryToUuid } = require('../../utils/uuid');
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')();

describe('OrderController', () => {
  let mockConnection;
  
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 设置默认模拟返回值
    mockGetMessage.mockImplementation((key) => `Mock message for ${key}`);
    mockUuidToBinary.mockReturnValue(Buffer.from('test-uuid'));
    mockBinaryToUuid.mockReturnValue('test-uuid-string');
    mockUuidv4.mockReturnValue('test-uuid-string');
    
    // 模拟数据库连接
     mockConnection = {
       beginTransaction: jest.fn(),
       commit: jest.fn(),
       rollback: jest.fn(),
       release: jest.fn(),
       query: jest.fn()
     };
     
     mockPool.getConnection = jest.fn().mockResolvedValue(mockConnection);
    
    // 模拟Stripe
    stripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_test123',
      client_secret: 'pi_test123_secret_test'
    });
  });
  
  // createOrder测试用例已删除 - 订单创建现在通过支付流程处理

  describe('getOrders', () => {
    it('应该成功获取订单列表', async () => {
      const req = createMockRequest({
        userId: 1,
        query: {
          page: '1',
          pageSize: '10'
        }
      });
      const res = createMockResponse();
      
      const mockOrders = [
        {
          id: 1,
          order_guid: Buffer.from('test-guid-1'),
          total_amount: 100.00,
          status: 'completed',
          payment_method: 'paypal',
          created_at: new Date(),
          updated_at: new Date(),
          shipping_name: '张三',
          shipping_phone: '13800138000'
        },
        {
          id: 2,
          order_guid: Buffer.from('test-guid-2'),
          total_amount: 200.00,
          status: 'pending',
          payment_method: 'stripe',
          created_at: new Date(),
          updated_at: new Date(),
          shipping_name: '李四',
          shipping_phone: '13900139000'
        }
      ];
      
      // 模拟数据库查询
      mockPool.query = jest.fn()
        .mockResolvedValueOnce([[{ total: 2 }]]) // 获取订单总数
        .mockResolvedValueOnce([mockOrders]); // 获取订单列表
      
      await orderController.getOrders(req, res);
      
      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mock message for ORDER.LIST_SUCCESS',
        data: {
          total: 2,
          page: 1,
          pageSize: 10,
          list: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              total_amount: 100.00,
              status: 'completed'
            }),
            expect.objectContaining({
              id: 2,
              total_amount: 200.00,
              status: 'pending'
            })
          ])
        }
      });
    });
    
    it('应该使用默认分页参数', async () => {
      const req = createMockRequest({
        userId: 1,
        query: {} // 没有分页参数
      });
      const res = createMockResponse();
      
      mockPool.query = jest.fn()
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[]]);
      
      await orderController.getOrders(req, res);
      
      // 验证使用了默认的分页参数
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ? OFFSET ?'),
        [1, 10, 0] // pageSize=10, offset=0
      );
    });
    
    it('应该在数据库错误时返回500错误', async () => {
      const req = createMockRequest({
        userId: 1,
        query: {}
      });
      const res = createMockResponse();
      
      mockPool.query = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await orderController.getOrders(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for ORDER.LIST_FAILED',
        error: 'Database error'
      });
    });
  });
  
  describe('getOrderDetail', () => {
    it('应该成功获取订单详情', async () => {
      const req = createMockRequest({
        userId: 1,
        params: {
          orderId: '123'
        }
      });
      const res = createMockResponse();
      
      const mockOrder = {
        id: 123,
        order_guid: Buffer.from('test-guid'),
        total_amount: 300.00,
        status: 'completed',
        payment_method: 'paypal',
        payment_id: 'pay_123',
        created_at: new Date(),
        updated_at: new Date(),
        shipping_name: '王五',
        shipping_phone: '13700137000',
        shipping_email: 'test@example.com',
        shipping_address: '北京市朝阳区测试地址',
        shipping_zip_code: '100000'
      };
      
      const mockOrderItems = [
        {
          id: 1,
          product_id: 101,
          quantity: 2,
          price: 100.00,
          product_name: '测试商品1',
          product_code: 'TEST001'
        },
        {
          id: 2,
          product_id: 102,
          quantity: 1,
          price: 100.00,
          product_name: '测试商品2',
          product_code: 'TEST002'
        }
      ];
      
      const mockLogistics = [
        {
          id: 1,
          tracking_number: 'TN123456789',
          carrier: '顺丰快递',
          status: 'delivered',
          location: '北京市',
          description: '已签收',
          created_at: new Date()
        }
      ];
      
      // 模拟数据库查询
      mockPool.query = jest.fn()
        .mockResolvedValueOnce([[mockOrder]]) // 获取订单信息
        .mockResolvedValueOnce([mockOrderItems]) // 获取订单项
        .mockResolvedValueOnce([mockLogistics]); // 获取物流信息
      
      await orderController.getOrderDetail(req, res);
      
      expect(mockPool.query).toHaveBeenCalledTimes(3);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mock message for ORDER.DETAIL_SUCCESS',
        data: {
          order: mockOrder,
          items: mockOrderItems,
          logistics: mockLogistics
        }
      });
    });
    
    it('应该在订单不存在时返回404错误', async () => {
      const req = createMockRequest({
        userId: 1,
        params: {
          orderId: '999'
        }
      });
      const res = createMockResponse();
      
      // 模拟订单不存在
      mockPool.query = jest.fn().mockResolvedValueOnce([[]]);
      
      await orderController.getOrderDetail(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for ORDER.NOT_FOUND'
      });
    });
    
    it('应该在数据库错误时返回500错误', async () => {
      const req = createMockRequest({
        userId: 1,
        params: {
          orderId: '123'
        }
      });
      const res = createMockResponse();
      
      mockPool.query = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await orderController.getOrderDetail(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for ORDER.DETAIL_FAILED',
        error: 'Database error'
      });
    });
    
    it('应该验证用户只能访问自己的订单', async () => {
      const req = createMockRequest({
        userId: 1,
        params: {
          orderId: '123'
        }
      });
      const res = createMockResponse();
      
      // 验证查询条件包含用户ID
      mockPool.query = jest.fn().mockResolvedValueOnce([[]]);
      
      await orderController.getOrderDetail(req, res);
      
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ? AND user_id = ? AND deleted = 0'),
        ['123', 1]
      );
    });
  });
});