/**
 * 测试工具函数
 * 提供通用的测试功能和配置
 */

const BASE_URL = 'http://localhost:3000';

// 测试配置
const TEST_CONFIG = {
  timeout: 10000, // 10秒超时
  retries: 2,     // 重试次数
};

// 通用测试函数
async function testEndpoint(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    expectedStatus = 200,
    description = `测试 ${method} ${endpoint}`,
    validateResponse = null
  } = options;

  console.log(`\n🧪 ${description}`);
  
  try {
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(body && { body: JSON.stringify(body) })
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
    const responseData = await response.json();

    console.log(`   📡 状态码: ${response.status}`);
    console.log(`   📊 响应数据:`, JSON.stringify(responseData, null, 2));

    // 验证状态码
    if (response.status !== expectedStatus) {
      console.log(`   ❌ 状态码不匹配: 期望 ${expectedStatus}, 实际 ${response.status}`);
      return false;
    }

    // 验证响应数据
    if (validateResponse && !validateResponse(responseData)) {
      console.log(`   ❌ 响应数据验证失败`);
      return false;
    }

    console.log(`   ✅ 测试通过`);
    return true;

  } catch (error) {
    console.log(`   ❌ 测试失败: ${error.message}`);
    return false;
  }
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试结果统计
class TestResults {
  constructor() {
    this.total = 0;
    this.passed = 0;
    this.failed = 0;
  }

  addResult(passed) {
    this.total++;
    if (passed) {
      this.passed++;
    } else {
      this.failed++;
    }
  }

  printSummary() {
    console.log('\n📊 测试结果汇总:');
    console.log(`   总计: ${this.total}`);
    console.log(`   通过: ${this.passed} ✅`);
    console.log(`   失败: ${this.failed} ❌`);
    console.log(`   成功率: ${((this.passed / this.total) * 100).toFixed(1)}%`);
  }
}

module.exports = {
  BASE_URL,
  TEST_CONFIG,
  testEndpoint,
  delay,
  TestResults
};
