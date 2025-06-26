const { mockPool, testData, setupMockDatabase } = require('../setup');

// Mock external dependencies
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,mockqrcode'))
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => 'mock-key-content')
}));

// Mock PayPal SDK
const mockCreateOrder = jest.fn();
const mockCaptureOrder = jest.fn();
jest.mock('@paypal/paypal-server-sdk', () => ({
  core: {
    PayPalHttpClient: jest.fn(() => ({
      execute: jest.fn()
    })),
    SandboxEnvironment: jest.fn(),
    LiveEnvironment: jest.fn()
  },
  orders: {
    OrdersCreateRequest: jest.fn(),
    OrdersCaptureRequest: jest.fn()
  }
}));

// Mock Alipay SDK
const mockAlipayExec = jest.fn();
const mockAlipayCheckSign = jest.fn();
jest.mock('alipay-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    exec: mockAlipayExec,
    checkNotifySign: mockAlipayCheckSign
  }));
});

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/'))
}));

// Mock getMessage function
jest.mock('../../config/messages', () => ({
  getMessage: jest.fn((key) => key)
}));

// 设置测试超时
jest.setTimeout(10000);

describe('PaymentController', () => {
  let mockReq, mockRes, paymentController;

  beforeAll(() => {
    // Import controller after all mocks are set up
    paymentController = require('../../controllers/paymentController');
  });

  beforeEach(() => {
    setupMockDatabase();
    
    mockReq = {
      userId: 1,
      body: {}
    };
    
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    // Reset all mocks
    jest.clearAllMocks();
    mockCreateOrder.mockClear();
    mockCaptureOrder.mockClear();
    mockAlipayExec.mockClear();
    mockAlipayCheckSign.mockClear();
  });

  afterEach(() => {
    // 清理所有定时器
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    // 清理所有mock
    jest.restoreAllMocks();
  });

  describe('createCommonOrder', () => {
    it('should create order successfully', async () => {
      const cartItems = [
        { product_id: 1, quantity: 2, price: 100 }
      ];
      
      mockReq.body = {
        cartItems,
        shippingInfo: {
          name: 'Test User',
          address: 'Test Address',
          phone: '1234567890'
        }
      };

      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce([{ stock: 10 }]) // Check stock
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insert order
        .mockResolvedValueOnce([]) // Insert order items
        .mockResolvedValueOnce([]) // Update stock
        .mockResolvedValueOnce([]) // Clear cart
        .mockResolvedValueOnce([{ id: 1, total_amount: 200 }]); // Get order

      await paymentController.createCommonOrder(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        orderId: 1,
        totalAmount: 200
      });
    });

    it('should handle insufficient stock', async () => {
      const cartItems = [
        { product_id: 1, quantity: 20, price: 100 }
      ];
      
      mockReq.body = {
        cartItems,
        shippingInfo: {
          name: 'Test User',
          address: 'Test Address',
          phone: '1234567890'
        }
      };

      // Mock insufficient stock
      mockPool.query.mockResolvedValueOnce([{ stock: 5 }]);

      await paymentController.createCommonOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('stock')
      });
    });
  });

});