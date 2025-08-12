# SiteForge AI 接口测试套件

这个目录包含了 SiteForge AI 项目的所有接口测试脚本，用于验证各个工作流步骤和健康检查接口的功能。

## 📁 文件结构

```
tests/
├── README.md                 # 本文件
├── test-utils.js            # 通用测试工具函数
├── test-health-check.js     # 健康检查接口测试
├── test-workflow-step1.js   # 工作流步骤1测试（需求解析与结构化）
├── test-workflow-step2.js   # 工作流步骤2测试（品牌视觉设计）
├── test-workflow-step3.js   # 工作流步骤3测试（网站信息架构）
├── test-workflow-step4.js   # 工作流步骤4测试（页面内容策划）
├── test-workflow-step5.js   # 工作流步骤5测试（区块布局设计）
├── test-workflow-step6.js   # 工作流步骤6测试（确定性代码生成）
├── test-complete-workflow.js # 完整工作流测试（串联所有步骤）
└── run-all-tests.js         # 主测试运行器
```

## 🚀 使用方法

### 前置条件

1. 确保 SiteForge AI 服务器正在运行（默认端口 3000）
2. 安装 Node.js 依赖：`npm install`

### 运行单个测试

```bash
# 健康检查接口测试
node tests/test-health-check.js

# 工作流步骤1测试
node tests/test-workflow-step1.js

# 工作流步骤2测试
node tests/test-workflow-step2.js

# 工作流步骤3测试
node tests/test-workflow-step3.js

# 工作流步骤4测试
node tests/test-workflow-step4.js

# 工作流步骤5测试
node tests/test-workflow-step5.js

# 工作流步骤6测试
node tests/test-workflow-step6.js

# 完整工作流测试
node tests/test-complete-workflow.js
```

### 运行所有测试

```bash
# 运行完整的测试套件
node tests/run-all-tests.js
```

## 🧪 测试内容

### 健康检查接口 (`/api/health/*`)

- **GET `/api/health/status`** - 快速状态检查
- **GET `/api/health/models`** - 详细模型健康检查
- **GET `/api/health/supported-models`** - 支持的模型列表

### 工作流接口 (`/api/workflow/*`)

#### 步骤1: 需求解析与结构化 (`/api/workflow/1-structure-data`)
- 入参：`{ rawInput: string }`
- 出参：结构化的公司数据，包含公司信息、产品、卖点、目标受众、资产和SEO信息

#### 步骤2: 品牌视觉设计 (`/api/workflow/2-design-system`)
- 入参：`{ industry: string, preference: string, brandPersonality?: string, targetMarket?: string }`
- 出参：设计系统配置，包含调色板、字体、间距、圆角和阴影

#### 步骤3: 网站信息架构 (`/api/workflow/3-website-architecture`)
- 入参：`{ companyName: string, products: Array, industry?: string, targetMarket?: string }`
- 出参：网站架构信息，包含全局元素和页面结构

#### 步骤4: 页面内容策划 (`/api/workflow/4-plan-content`)
- 入参：完整的蓝图V1（包含结构化数据、设计系统、全局元素和页面）
- 出参：蓝图V2（每个页面包含SEO信息和内容大纲）

#### 步骤5: 区块布局设计 (`/api/workflow/5-design-layout`)
- 入参：`{ blueprintV2: WebsiteBlueprintV2, blockLibrary: BlockLibrary }`
- 出参：蓝图V3（每个页面的outline转换为结构化的区块布局）

#### 步骤6: 确定性代码生成 (`/api/workflow/6-generate-html`)
- 入参：完整的蓝图V4（包含所有页面和区块信息）
- 出参：`{ html: string }` - 完整的古腾堡HTML代码

#### 完整工作流 (`/api/workflow/complete-workflow`)
- 入参：`{ rawInput: string, options?: object }` - 用户原始输入和可选配置
- 出参：包含所有6个步骤结果的完整工作流数据，以及最终生成的HTML代码

## 🔍 测试用例类型

每个测试脚本都包含以下类型的测试用例：

1. **正常输入测试** - 使用完整的有效数据进行测试
2. **边界测试** - 测试最小必需字段和最大输入长度
3. **错误处理测试** - 验证缺少必需字段、无效数据等错误情况
4. **复杂场景测试** - 测试多产品、多页面等复杂情况

## 📊 测试结果

每个测试都会显示：
- 测试描述
- HTTP状态码
- 响应数据
- 验证结果（通过/失败）
- 测试结果汇总（总数、通过数、失败数、成功率）

## 🛠️ 自定义测试

### 修改测试配置

在 `test-utils.js` 中可以修改：
- `BASE_URL` - 服务器地址
- `TEST_CONFIG.timeout` - 超时时间
- `TEST_CONFIG.retries` - 重试次数

### 添加新的测试用例

在每个测试脚本中添加新的测试用例：

```javascript
const newTestResult = await testEndpoint('/api/endpoint', {
  method: 'POST',
  body: testData,
  description: '测试描述',
  validateResponse: (data) => {
    // 自定义验证逻辑
    return data.success === true && data.data;
  }
});
results.addResult(newTestResult);
```

## 🚨 注意事项

1. **服务器状态** - 确保服务器正在运行且可访问
2. **API密钥** - 某些接口可能需要有效的API密钥
3. **网络环境** - 确保网络连接正常，能够访问外部AI服务
4. **测试数据** - 测试数据是模拟数据，不会影响生产环境

## 📝 故障排除

### 常见问题

1. **连接被拒绝** - 检查服务器是否运行在正确的端口
2. **超时错误** - 检查网络连接和服务器响应时间
3. **验证失败** - 检查响应数据结构是否符合预期
4. **权限错误** - 检查API密钥和访问权限

### 调试技巧

- 查看详细的响应数据
- 检查HTTP状态码
- 验证请求参数格式
- 确认服务器日志信息
