#!/usr/bin/env node

/**
 * 测试功能演示脚本
 * 展示改进后的测试工具的各种功能
 */

const { initializeTests, colorize, TestResults } = require('./test-utils');

async function demoTestFeatures() {
  console.log(colorize('bright', '🎭 测试功能演示'));
  console.log(colorize('blue', '   展示改进后的测试工具的各种功能'));
  console.log('');
  
  // 初始化测试环境
  initializeTests();
  
  // 创建测试结果对象
  const results = new TestResults();
  
  // 模拟一些测试结果
  console.log(colorize('cyan', '📋 模拟测试用例...'));
  
  // 成功的测试
  results.addResult({
    success: true,
    status: 200,
    responseTime: 150,
    responseData: { message: 'Success' }
  });
  
  // 失败的测试 - 状态码不匹配
  results.addResult({
    success: false,
    error: '状态码不匹配: 期望 200, 实际 404',
    details: '期望状态码: 200, 实际状态码: 404',
    status: 404,
    responseTime: 89
  });
  
  // 失败的测试 - 验证失败
  results.addResult({
    success: false,
    error: '响应数据验证失败',
    details: '自定义验证函数返回 false',
    status: 200,
    responseTime: 234
  });
  
  // 成功的测试
  results.addResult({
    success: true,
    status: 200,
    responseTime: 67,
    responseData: { data: 'Valid response' }
  });
  
  // 超时测试
  results.addResult({
    success: false,
    error: '请求超时 (10000ms)',
    details: '请求在 10000ms 内未完成，已重试 2 次',
    responseTime: 10000,
    attempt: 3
  });
  
  // 打印测试结果汇总
  console.log(colorize('cyan', '\n📊 测试结果汇总:'));
  results.printSummary();
  
  // 展示环境变量配置
  console.log(colorize('cyan', '\n🔧 环境变量配置示例:'));
  console.log('   TEST_ENV=local              # 测试环境 (local/staging/production)');
  console.log('   TEST_VERBOSE=true           # 详细输出');
  console.log('   TEST_LOG_LEVEL=debug        # 日志级别 (debug/info/warn/error)');
  console.log('   TEST_LOG_REQUESTS=true      # 显示请求数据');
  console.log('   TEST_LOG_RESPONSES=true     # 显示响应数据');
  console.log('   TEST_LOG_TIMING=true        # 显示时间信息');
  console.log('   TEST_PERFORMANCE=true       # 启用性能测试');
  console.log('   TEST_STRICT_VALIDATION=true # 严格数据验证');
  
  console.log(colorize('cyan', '\n🚀 运行测试的命令:'));
  console.log('   node tests/test-workflow-step1.js     # 运行单个测试');
  console.log('   node tests/run-all-tests.js          # 运行所有测试');
  console.log('   TEST_VERBOSE=true node tests/run-all-tests.js  # 详细模式');
  
  console.log(colorize('green', '\n✅ 演示完成！'));
}

// 运行演示
if (require.main === module) {
  demoTestFeatures().catch(error => {
    console.error(colorize('red', '💥 演示执行失败:'), error);
    process.exit(1);
  });
}

module.exports = { demoTestFeatures };
