#!/usr/bin/env node

/**
 * 测试工具使用示例
 * 展示如何使用改进后的测试工具进行API测试
 */

const { testEndpoint, TestResults, colorize, initializeTests } = require('./test-utils');

async function runExampleTests() {
  console.log(colorize('bright', '🧪 测试工具使用示例'));
  console.log(colorize('blue', '   展示如何使用改进后的测试工具进行API测试'));
  console.log('');
  
  // 初始化测试环境
  initializeTests();
  
  const results = new TestResults();

  // 示例1: 测试健康检查端点
  console.log(colorize('cyan', '📋 示例1: 健康检查测试'));
  const healthResult = await testEndpoint('/api/health/status', {
    method: 'GET',
    description: '健康检查状态测试',
    validateResponse: (data) => {
      console.log(`      ${colorize('blue', '🔍')} 验证健康检查响应...`);
      
      if (data.status !== 'healthy') {
        console.log(`      ${colorize('red', '❌')} 状态不是 healthy: ${data.status}`);
        return false;
      }
      
      if (!data.timestamp) {
        console.log(`      ${colorize('red', '❌')} 缺少时间戳字段`);
        return false;
      }
      
      console.log(`      ${colorize('green', '✅')} 健康检查响应验证通过`);
      return true;
    }
  });
  results.addResult(healthResult);

  // 示例2: 测试POST端点（模拟）
  console.log(colorize('cyan', '\n📋 示例2: POST请求测试'));
  const postResult = await testEndpoint('/api/test/post', {
    method: 'POST',
    body: { message: 'Hello World', timestamp: Date.now() },
    description: 'POST请求测试',
    expectedStatus: 200,
    validateResponse: (data) => {
      console.log(`      ${colorize('blue', '🔍')} 验证POST响应...`);
      
      if (!data.success) {
        console.log(`      ${colorize('red', '❌')} success 字段为 false`);
        return false;
      }
      
      if (!data.message) {
        console.log(`      ${colorize('red', '❌')} 缺少 message 字段`);
        return false;
      }
      
      console.log(`      ${colorize('green', '✅')} POST响应验证通过`);
      return true;
    }
  });
  results.addResult(postResult);

  // 示例3: 测试错误处理
  console.log(colorize('cyan', '\n📋 示例3: 错误处理测试'));
  const errorResult = await testEndpoint('/api/test/error', {
    method: 'GET',
    description: '错误处理测试',
    expectedStatus: 404,
    validateResponse: (data) => {
      console.log(`      ${colorize('blue', '🔍')} 验证错误响应...`);
      
      if (data.success !== false) {
        console.log(`      ${colorize('red', '❌')} 期望 success 为 false，实际为 ${data.success}`);
        return false;
      }
      
      if (!data.error) {
        console.log(`      ${colorize('red', '❌')} 缺少 error 字段`);
        return false;
      }
      
      console.log(`      ${colorize('green', '✅')} 错误响应验证通过`);
      return true;
    }
  });
  results.addResult(errorResult);

  // 示例4: 测试超时处理
  console.log(colorize('cyan', '\n📋 示例4: 超时处理测试'));
  const timeoutResult = await testEndpoint('/api/test/timeout', {
    method: 'GET',
    description: '超时处理测试',
    timeout: 1000, // 1秒超时
    validateResponse: (data) => {
      // 这个测试预期会超时，所以不会到达这里
      return true;
    }
  });
  results.addResult(timeoutResult);

  // 打印测试结果汇总
  console.log(colorize('cyan', '\n📊 测试结果汇总:'));
  results.printSummary();
  
  // 展示如何使用测试结果
  console.log(colorize('cyan', '\n🔍 测试结果使用示例:'));
  const detailedResults = results.getDetailedResults();
  const performanceStats = results.getPerformanceStats();
  
  console.log(`   详细结果数量: ${detailedResults.length}`);
  console.log(`   性能统计: 平均响应时间 ${performanceStats.avgResponseTime.toFixed(2)}ms`);
  
  // 分析失败原因
  const failedTests = detailedResults.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log(colorize('yellow', '\n⚠️  失败测试分析:'));
    failedTests.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.error}`);
      if (test.details) {
        console.log(`      原因: ${test.details}`);
      }
    });
  }
  
  console.log(colorize('green', '\n✅ 示例测试完成！'));
  return results;
}

// 运行示例测试
if (require.main === module) {
  runExampleTests().catch(error => {
    console.error(colorize('red', '💥 示例测试执行失败:'), error);
    process.exit(1);
  });
}

module.exports = { runExampleTests };
