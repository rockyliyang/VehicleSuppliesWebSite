# 后端单元测试说明

## 测试框架

本项目使用 Jest 作为测试框架，对后端 Controller 进行单元测试。

## 目录结构

```
tests/
├── controllers/         # Controller 单元测试
├── utils/              # 测试工具函数
├── setup.js            # 测试环境设置
└── README.md           # 测试说明文档
```

## 运行测试

### 安装依赖

确保已安装所有依赖：

```bash
npm install
```

### 运行所有测试

```bash
npm test
```

### 运行特定测试文件

```bash
npm test -- tests/controllers/userManagementController.test.js
```

### 运行测试并查看覆盖率

```bash
npm run test:coverage
```

## 测试数据库

测试使用独立的测试数据库，避免影响生产数据。测试数据库名称为 `{原数据库名}_test`。

在运行测试前，请确保测试数据库已创建并包含必要的表结构。

## 模拟（Mock）

测试中使用了以下模拟：

1. **数据库连接**：模拟 `pool.query` 和事务相关方法
2. **UUID 生成**：模拟 `uuidv4` 和 `uuidToBinary`
3. **消息获取**：模拟 `getMessage` 函数
4. **第三方服务**：模拟支付网关等外部服务

## 编写新测试

1. 在 `tests/controllers` 目录下创建与 Controller 对应的测试文件
2. 使用 `createMockRequest` 和 `createMockResponse` 创建请求和响应对象
3. 模拟数据库查询结果
4. 调用 Controller 方法并验证结果

## 测试覆盖率目标

- 语句覆盖率（Statements）：≥ 80%
- 分支覆盖率（Branches）：≥ 70%
- 函数覆盖率（Functions）：≥ 80%
- 行覆盖率（Lines）：≥ 80%