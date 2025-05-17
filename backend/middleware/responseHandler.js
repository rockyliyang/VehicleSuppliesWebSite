/**
 * 统一API响应格式中间件
 * 确保所有接口都使用 {success: boolean, message: string, data: object} 的格式返回数据
 */

const responseHandler = () => {
  return (req, res, next) => {
    // 保存原始的res.json方法
    const originalJson = res.json;
    const originalSend = res.send;
    const originalStatus = res.status;
    
    // 当前状态码
    let currentStatus = 200;
    
    // 重写status方法
    res.status = function(code) {
      currentStatus = code;
      return originalStatus.call(this, code);
    };
    
    // 重写json方法，确保返回格式统一
    res.json = function(data) {
      // 如果已经是标准格式，直接返回
      if (data && typeof data === 'object' && 'success' in data && 'message' in data && 'data' in data) {
        return originalJson.call(this, data);
      }
      
      // 根据状态码判断success
      const success = currentStatus >= 200 && currentStatus < 300;
      
      // 构造标准响应格式
      const response = {
        success: success,
        message: success ? '操作成功' : '操作失败',
        data: data
      };
      
      return originalJson.call(this, response);
    };
    
    // 重写send方法，确保返回格式统一
    res.send = function(data) {
      // 如果是字符串，尝试解析为JSON
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          // 如果已经是标准格式，直接返回
          if ('success' in parsed && 'message' in parsed && 'data' in parsed) {
            return originalSend.call(this, data);
          }
          // 否则构造标准响应
          const success = currentStatus >= 200 && currentStatus < 300;
          const response = {
            success: success,
            message: success ? '操作成功' : '操作失败',
            data: parsed
          };
          return originalSend.call(this, JSON.stringify(response));
        } catch (e) {
          // 不是JSON字符串，作为message返回
          const success = currentStatus >= 200 && currentStatus < 300;
          const response = {
            success: success,
            message: data,
            data: null
          };
          return originalSend.call(this, JSON.stringify(response));
        }
      }
      
      // 如果是对象但不是标准格式
      if (data && typeof data === 'object' && !('success' in data && 'message' in data && 'data' in data)) {
        const success = currentStatus >= 200 && currentStatus < 300;
        const response = {
          success: success,
          message: success ? '操作成功' : '操作失败',
          data: data
        };
        return originalSend.call(this, response);
      }
      
      // 其他情况直接返回
      return originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = responseHandler;