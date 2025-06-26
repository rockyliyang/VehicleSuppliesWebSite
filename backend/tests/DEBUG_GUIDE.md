# 单元测试调试指南

## 概述

本项目已配置完整的单元测试调试环境，支持多种调试方式。测试环境使用Mock数据库，避免连接真实数据库。

## 测试环境特性

### Mock数据库
- ✅ 不连接真实数据库
- ✅ 使用内存中的Mock数据
- ✅ 支持基本的CRUD操作模拟
- ✅ 自动清理测试数据

### 调试支持
- ✅ VSCode调试配置
- ✅ 命令行调试
- ✅ 单个测试文件调试
- ✅ 特定测试用例调试

## 使用方法

### 1. 基本测试命令

```bash
# 运行所有测试
npm test

# 监视模式运行测试
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 2. 调试命令

```bash
# 调试模式运行所有测试
npm run test:debug

# 调试模式监视运行
npm run test:debug:watch

# 运行特定测试文件
npm run test:file -- userManagementController.test.js

# 运行特定测试用例
npm run test:single -- "should create user"
```

### 3. VSCode调试

#### 方式一：调试所有测试
1. 打开VSCode
2. 按 `F5` 或点击调试面板
3. 选择 "Debug Jest Tests"
4. 设置断点后开始调试

#### 方式二：调试当前文件
1. 打开要调试的测试文件
2. 选择 "Debug Current Jest Test"
3. 设置断点后开始调试

#### 方式三：调试特定测试用例
1. 选择 "Debug Jest Test by Name"
2. 输入测试用例名称模式
3. 设置断点后开始调试

### 4. 浏览器调试

```bash
# 启动调试模式
npm run test:debug

# 然后在Chrome中打开
chrome://inspect
```

## Mock数据库使用

### 基本用法

```javascript
const { mockPool, testData, setupMockDatabase } = require('./setup');

describe('测试示例', () => {
  beforeEach(() => {
    // 重置Mock数据库
    setupMockDatabase();
  });

  test('应该创建用户', async () => {
    // 使用mockPool进行数据库操作
    const [result] = await mockPool.execute(
      'INSERT INTO users (username, email) VALUES (?, ?)',
      ['testuser', 'test@example.com']
    );
    
    // 验证结果
    expect(result.insertId).toBeDefined();
    expect(testData.users).toHaveLength(1);
  });
});
```

### 可用的测试数据

```javascript
// 访问测试数据
testData.users      // 用户数据
testData.products   // 产品数据
testData.orders     // 订单数据
testData.cart       // 购物车数据
```

## 调试技巧

### 1. 设置断点
- 在代码行号左侧点击设置断点
- 使用 `debugger;` 语句设置代码断点

### 2. 查看变量
- 在调试面板查看变量值
- 使用调试控制台执行表达式

### 3. 步进调试
- `F10`: 单步跳过
- `F11`: 单步进入
- `Shift+F11`: 单步跳出
- `F5`: 继续执行

### 4. 条件断点
- 右键断点设置条件
- 只在满足条件时暂停

## 常见问题

### Q: 测试运行缓慢
A: 使用 `--runInBand` 参数串行运行测试，避免并发问题

### Q: 调试器无法连接
A: 确保端口9230未被占用，或修改launch.json中的端口

### Q: Mock数据不正确
A: 检查setupMockDatabase()是否在beforeEach中调用

### Q: 覆盖率报告不准确
A: 确保测试文件覆盖了所有代码路径

## 最佳实践

1. **测试隔离**: 每个测试用例都应该独立，不依赖其他测试
2. **数据清理**: 使用beforeEach清理测试数据
3. **Mock外部依赖**: 对外部API和服务进行Mock
4. **断言明确**: 使用具体的断言，避免模糊的测试
5. **测试命名**: 使用描述性的测试名称

## 配置文件说明

- `jest.config.js`: Jest测试配置
- `tests/setup.js`: 测试环境设置
- `.vscode/launch.json`: VSCode调试配置
- `package.json`: 测试脚本定义

## 扩展Mock功能

如需添加更多Mock功能，可以在 `tests/setup.js` 中扩展 `mockPool.execute` 的实现：

```javascript
mockPool.execute.mockImplementation(async (sql, params = []) => {
  // 添加新的SQL操作Mock
  if (sql.includes('SELECT * FROM products')) {
    return [testData.products, []];
  }
  
  // 现有的Mock逻辑...
});
```