# SiteForge AI 测试套件

这是一个功能强大的测试套件，用于测试 SiteForge AI 系统的各个组件和接口。

## ✨ 主要特性

- 🎨 **彩色输出**: 使用 ANSI 颜色代码提供清晰的测试结果展示
- 📊 **详细统计**: 提供测试通过率、响应时间等详细统计信息
- 🔄 **自动重试**: 支持失败测试的自动重试机制
- ⚡ **性能监控**: 监控响应时间和性能指标
- 🌍 **环境管理**: 支持本地、预发布和生产环境的配置
- 📝 **详细日志**: 可配置的请求/响应数据记录
- 🚀 **灵活配置**: 通过环境变量轻松配置测试行为

## 🚀 快速开始

### 1. 运行单个测试

```bash
# 测试工作流步骤1
node tests/test-workflow-step1.js

# 测试工作流步骤2
node tests/test-workflow-step2.js

# 测试健康检查
node tests/test-health-check.js
```

### 2. 运行所有测试

```bash
# 运行完整测试套件
node tests/run-all-tests.js
```

### 3. 查看功能演示

```bash
# 运行演示脚本
node tests/demo-test.js
```

## ⚙️ 环境配置

### 测试环境

通过 `TEST_ENV` 环境变量设置测试环境：

```bash
# 本地开发环境 (默认)
TEST_ENV=local node tests/run-all-tests.js

# 预发布环境
TEST_ENV=staging node tests/run-all-tests.js

# 生产环境
TEST_ENV=production node tests/run-all-tests.js
```

### 详细配置选项

```bash
# 详细输出模式
TEST_VERBOSE=true node tests/run-all-tests.js

# 设置日志级别
TEST_LOG_LEVEL=debug node tests/run-all-tests.js

# 显示请求和响应数据
TEST_LOG_REQUESTS=true TEST_LOG_RESPONSES=true node tests/run-all-tests.js

# 启用性能测试
TEST_PERFORMANCE=true node tests/run-all-tests.js

# 严格数据验证
TEST_STRICT_VALIDATION=true node tests/run-all-tests.js
```

## 📊 测试结果解读

### 成功测试示例

```
🧪 正常输入测试 - 工业LED照明公司
   📍 端点: POST /api/workflow/1-structure-data
   📡 状态码: 200 (156ms)
   📊 响应数据: {...}
   ✅ 测试通过
```

### 失败测试示例

```
🧪 缺少必需字段测试
   📍 端点: POST /api/workflow/1-structure-data
   📡 状态码: 400 (89ms)
   📊 响应数据: {...}
   ❌ 状态码不匹配: 期望 200, 实际 400
```

### 测试结果汇总

```
============================================================
📊 测试结果汇总
============================================================
   总计: 5
   通过: 3 ✅
   失败: 2 ❌
   成功率: 60.0%
   总耗时: 1234ms

   ⚡ 性能统计:
     平均响应时间: 156.80ms
     最快响应时间: 89ms
     最慢响应时间: 234ms

❌ 失败详情:

   测试 2:
     错误: 状态码不匹配: 期望 200, 实际 400
     详情: 期望状态码: 200, 实际状态码: 400
     状态码: 400
     响应时间: 89ms

   测试 5:
     错误: 请求超时 (10000ms)
     详情: 请求在 10000ms 内未完成，已重试 2 次
     响应时间: 10000ms
     重试次数: 2
============================================================
```

## 🛠️ 自定义测试

### 创建新的测试文件

```javascript
const { testEndpoint, TestResults, colorize } = require('./test-utils');

async function testCustomEndpoint() {
  console.log(colorize('bright', '🔍 开始自定义测试...'));
  
  const results = new TestResults();

  const result = await testEndpoint('/api/custom', {
    method: 'POST',
    body: { key: 'value' },
    description: '自定义接口测试',
    validateResponse: (data) => {
      // 自定义验证逻辑
      return data.success === true && data.data;
    }
  });
  
  results.addResult(result);
  results.printSummary();
  
  return results;
}

module.exports = { testCustomEndpoint };
```

### 使用测试数据配置

```javascript
const { getTestData } = require('./test-config');

const testData = getTestData();
const companyData = testData.companies.industrial;

// 使用预定义的测试数据
const result = await testEndpoint('/api/workflow/1-structure-data', {
  method: 'POST',
  body: { rawInput: companyData.description },
  description: '使用预定义测试数据'
});
```

## 🔧 高级功能

### 性能测试

```bash
# 启用性能测试
TEST_PERFORMANCE=true node tests/run-all-tests.js
```

性能测试会监控：
- 响应时间阈值
- 吞吐量
- 性能趋势

### 重试机制

测试失败时会自动重试，重试次数可通过环境变量配置：

```bash
# 设置重试次数
TEST_RETRIES=3 node tests/run-all-tests.js
```

### 超时配置

```bash
# 设置请求超时时间 (毫秒)
TEST_TIMEOUT=15000 node tests/run-all-tests.js
```

## 📁 文件结构

```
tests/
├── README.md                 # 本文档
├── test-config.js           # 测试配置文件
├── test-utils.js            # 测试工具函数
├── demo-test.js             # 功能演示脚本
├── run-all-tests.js         # 主测试运行器
├── test-health-check.js     # 健康检查测试
├── test-workflow-step1.js   # 工作流步骤1测试
├── test-workflow-step2.js   # 工作流步骤2测试
├── test-workflow-step3.js   # 工作流步骤3测试
├── test-workflow-step4.js   # 工作流步骤4测试
├── test-workflow-step5.js   # 工作流步骤5测试
├── test-workflow-step6.js   # 工作流步骤6测试
└── test-complete-workflow.js # 完整工作流测试
```

## 🚨 故障排除

### 常见问题

1. **测试超时**
   - 检查服务器是否正常运行
   - 调整 `TEST_TIMEOUT` 环境变量
   - 检查网络连接

2. **测试失败**
   - 查看详细的错误信息和响应数据
   - 检查API端点是否正确
   - 验证请求数据格式

3. **环境配置问题**
   - 确认 `TEST_ENV` 环境变量设置正确
   - 检查配置文件中的URL和端口

### 调试模式

```bash
# 启用调试模式
TEST_LOG_LEVEL=debug TEST_VERBOSE=true node tests/run-all-tests.js
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进测试套件！

## 📄 许可证

本项目采用 MIT 许可证。
