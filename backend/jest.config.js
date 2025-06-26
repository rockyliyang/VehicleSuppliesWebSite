module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'utils/**/*.js',
    'middleware/**/*.js',
    '!controllers/index.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // 设置测试超时时间
  testTimeout: 10000,
  // 设置文件路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  // 测试设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  // 全局变量
  globals: {
    'NODE_ENV': 'test'
  },
  // 调试配置
  detectOpenHandles: true,
  detectLeaks: true,
  // 忽略的文件模式
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ],
  // 转换配置
  transform: {},
  // 模块文件扩展名
  moduleFileExtensions: ['js', 'json'],
  // 收集覆盖率的阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};