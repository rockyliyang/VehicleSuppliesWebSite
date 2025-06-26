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

const inquiryController = require('../../controllers/inquiryController');
const { createMockRequest, createMockResponse } = require('../utils/mockUtils');
const sseHandler = require('../../utils/sseHandler');

// 模拟依赖
jest.mock('../../utils/uuid');
jest.mock('../../utils/sseHandler');
jest.mock('uuid');

describe('InquiryController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 设置默认的模拟返回值
    mockGetMessage.mockImplementation((key) => {
      const messages = {
        'INQUIRY.FETCH.SUCCESS': 'Mock message for INQUIRY.FETCH.SUCCESS',
        'INQUIRY.FETCH.FAILED': 'Mock message for INQUIRY.FETCH.FAILED'
      };
      return messages[key] || 'Mock message';
    });
  });
  
  describe('getUserInquiries', () => {
    it('应该成功获取用户询价列表', async () => {
      const req = createMockRequest({
        userId: 1,
        query: { page: 1, limit: 10 }
      });
      const res = createMockResponse();
      
      const mockInquiries = [
        {
          id: 1,
          guid: Buffer.from('inquiry1'),
          user_inquiry_id: 'INQ001',
          title: '询价单1',
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date(),
          item_count: 3,
          total_quoted_price: 500.00
        },
        {
          id: 2,
          guid: Buffer.from('inquiry2'),
          user_inquiry_id: 'INQ002',
          title: '询价单2',
          status: 'quoted',
          created_at: new Date(),
          updated_at: new Date(),
          item_count: 2,
          total_quoted_price: 300.00
        }
      ];
      
      const mockCount = [{ total: 2 }];
      
      mockPool.query = jest.fn()
        .mockResolvedValueOnce([mockInquiries]) // 询价列表查询
        .mockResolvedValueOnce([mockCount]); // 总数查询
      
      await inquiryController.getUserInquiries(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mock message for INQUIRY.FETCH.SUCCESS',
        data: {
          inquiries: mockInquiries,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1
          }
        }
      });
    });
    
    it('应该支持按状态筛选询价列表', async () => {
      const req = createMockRequest({
        userId: 1,
        query: { page: 1, limit: 10, status: 'pending' }
      });
      const res = createMockResponse();
      
      const mockInquiries = [
        {
          id: 1,
          guid: Buffer.from('inquiry1'),
          user_inquiry_id: 'INQ001',
          title: '询价单1',
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date(),
          item_count: 3,
          total_quoted_price: 0
        }
      ];
      
      const mockCount = [{ total: 1 }];
      
      mockPool.query = jest.fn()
        .mockResolvedValueOnce([mockInquiries])
        .mockResolvedValueOnce([mockCount]);
      
      await inquiryController.getUserInquiries(req, res);
      
      // 验证查询参数包含状态筛选
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND i.status = ?'),
        expect.arrayContaining([1, 'pending', 10, 0])
      );
    });
    
    it('应该正确处理分页参数', async () => {
      const req = createMockRequest({
        userId: 1,
        query: { page: 2, limit: 5 }
      });
      const res = createMockResponse();
      
      mockPool.query = jest.fn()
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ total: 0 }]]);
      
      await inquiryController.getUserInquiries(req, res);
      
      // 验证分页计算：offset = (2-1) * 5 = 5
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1, 5, 5]) // userId, limit, offset
      );
    });
    
    it('应该使用默认分页参数', async () => {
      const req = createMockRequest({
        userId: 1,
        query: {} // 没有分页参数
      });
      const res = createMockResponse();
      
      mockPool.query = jest.fn()
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ total: 0 }]]);
      
      await inquiryController.getUserInquiries(req, res);
      
      // 验证使用默认值：page=1, limit=10, offset=0
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1, 10, 0])
      );
    });
    
    it('应该在数据库错误时返回500错误', async () => {
      const req = createMockRequest({
        userId: 1,
        query: { page: 1, limit: 10 }
      });
      const res = createMockResponse();
      
      mockPool.query = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await inquiryController.getUserInquiries(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mock message for INQUIRY.FETCH.FAILED'
      });
    });
    
    it('应该正确计算总页数', async () => {
      const req = createMockRequest({
        userId: 1,
        query: { page: 1, limit: 3 }
      });
      const res = createMockResponse();
      
      const mockCount = [{ total: 10 }]; // 10条记录，每页3条，应该有4页
      
      mockPool.query = jest.fn()
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([mockCount]);
      
      await inquiryController.getUserInquiries(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mock message for INQUIRY.FETCH.SUCCESS',
        data: {
          inquiries: [],
          pagination: {
            page: 1,
            limit: 3,
            total: 10,
            totalPages: 4 // Math.ceil(10/3) = 4
          }
        }
      });
    });
  });
});