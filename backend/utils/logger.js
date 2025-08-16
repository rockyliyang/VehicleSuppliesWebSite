/**
 * 统一日志工具
 * 为所有console输出添加时间戳
 */

/**
 * 格式化时间戳
 * @returns {string} 格式化的时间字符串
 */
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * 带时间戳的日志对象
 */
const logger = {
  log: (...args) => {
    console.log(`[${getTimestamp()}]`, ...args);
  },
  
  info: (...args) => {
    console.info(`[${getTimestamp()}]`, ...args);
  },
  
  warn: (...args) => {
    console.warn(`[${getTimestamp()}]`, ...args);
  },
  
  error: (...args) => {
    console.error(`[${getTimestamp()}]`, ...args);
  },
  
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${getTimestamp()}]`, ...args);
    }
  }
};

/**
 * 重写全局console对象（可选）
 * 如果需要全局替换console，可以调用此函数
 */
function overrideConsole() {
  const originalConsole = { ...console };
  
  console.log = logger.log;
  console.info = logger.info;
  console.warn = logger.warn;
  console.error = logger.error;
  console.debug = logger.debug;
  
  // 保留原始console的引用，以防需要恢复
  console.original = originalConsole;
}

/**
 * 恢复原始console对象
 */
function restoreConsole() {
  if (console.original) {
    Object.assign(console, console.original);
    delete console.original;
  }
}

module.exports = {
  logger,
  overrideConsole,
  restoreConsole,
  getTimestamp
};