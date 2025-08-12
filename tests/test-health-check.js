/**
 * 健康检查接口测试脚本
 * 测试所有健康检查相关的接口
 */

const { testEndpoint, TestResults } = require('./test-utils');

async function testHealthCheckEndpoints() {
  console.log('🏥 开始测试健康检查接口...\n');
  
  const results = new TestResults();

  // 测试快速状态检查
  const statusResult = await testEndpoint('/api/health/status', {
    description: '快速状态检查',
    validateResponse: (data) => {
      return data.status && data.availableModels !== undefined && data.timestamp;
    }
  });
  results.addResult(statusResult);

  // 测试详细健康检查
  const modelsResult = await testEndpoint('/api/health/models', {
    description: '详细模型健康检查',
    validateResponse: (data) => {
      return data.overallStatus && 
             data.models && 
             data.models.openai && 
             data.models.anthropic && 
             data.models.google;
    }
  });
  results.addResult(modelsResult);

  // 测试支持的模型列表
  const supportedModelsResult = await testEndpoint('/api/health/supported-models', {
    description: '支持的模型列表',
    validateResponse: (data) => {
      return data.models && Array.isArray(data.models) && data.count !== undefined;
    }
  });
  results.addResult(supportedModelsResult);

  // 打印测试结果汇总
  results.printSummary();
}

// 运行测试
if (require.main === module) {
  testHealthCheckEndpoints().catch(console.error);
}

module.exports = { testHealthCheckEndpoints };
