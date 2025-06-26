/**
 * 测试辅助工具 - 模拟请求和响应对象
 */

// 创建模拟请求对象
const createMockRequest = (options = {}) => {
  const { body = {}, params = {}, query = {}, headers = {}, userId = null, userRole = null } = options;
  
  return {
    body,
    params,
    query,
    headers,
    userId,
    userRole,
    get: (key) => headers[key]
  };
};

// 创建模拟响应对象
const createMockResponse = () => {
  const res = {};
  
  // 存储响应数据
  res.statusCode = 200;
  res.data = null;
  res.headers = {};
  
  // 模拟方法
  res.status = jest.fn().mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });
  
  res.json = jest.fn().mockImplementation((data) => {
    res.data = data;
    return res;
  });
  
  res.send = jest.fn().mockImplementation((data) => {
    res.data = data;
    return res;
  });
  
  res.setHeader = jest.fn().mockImplementation((key, value) => {
    res.headers[key] = value;
    return res;
  });
  
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  
  return res;
};

// 创建模拟数据库连接池
const createMockPool = (queryResults = {}) => {
  const mockPool = {
    query: jest.fn().mockImplementation((sql, params) => {
      // 根据SQL语句返回预设的结果
      for (const [pattern, result] of Object.entries(queryResults)) {
        if (sql.includes(pattern)) {
          return Array.isArray(result) ? result : [result, []];
        }
      }
      
      // 默认返回空结果
      return [[], []];
    }),
    execute: jest.fn().mockImplementation((sql, params) => {
      // 根据SQL语句返回预设的结果
      for (const [pattern, result] of Object.entries(queryResults)) {
        if (sql.includes(pattern)) {
          return Array.isArray(result) ? result : [result, []];
        }
      }
      
      // 默认返回空结果
      return [{ affectedRows: 0, insertId: 0 }, []];
    })
  };
  
  return mockPool;
};

module.exports = {
  createMockRequest,
  createMockResponse,
  createMockPool
};