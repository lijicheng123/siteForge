/**
 * 测试工具函数
 * 提供通用的测试功能和配置
 */

const { getTestConfig, getCurrentEnvironment, validateEnvironment, validateConfig } = require('./test-config');

// 获取当前配置
const config = getTestConfig();
const BASE_URL = config.baseUrl;

// 测试配置
const TEST_CONFIG = {
  timeout: config.timeout,
  retries: config.retries,
};

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

// 日志工具
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const levelColors = {
    debug: 'white',
    info: 'blue',
    warn: 'yellow',
    error: 'red'
  };
  
  const color = levelColors[level] || 'white';
  const icon = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌'
  }[level] || 'ℹ️';
  
  console.log(`${colorize(color, `${icon} [${timestamp}] ${level.toUpperCase()}:`)} ${message}`);
  
  if (data && config.logging.includeResponseData) {
    console.log(colorize('cyan', '   数据:'), JSON.stringify(data, null, 2));
  }
}

// 通用测试函数
async function testEndpoint(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    expectedStatus = 200,
    description = `测试 ${method} ${endpoint}`,
    validateResponse = null,
    timeout = config.timeout,
    retries = config.retries
  } = options;

  console.log(`\n${colorize('cyan', '🧪')} ${colorize('bright', description)}`);
  console.log(`   ${colorize('blue', '📍')} 端点: ${colorize('yellow', method)} ${colorize('yellow', endpoint)}`);
  
  if (body && config.logging.includeRequestData) {
    console.log(`   ${colorize('blue', '📤')} 请求数据:`, JSON.stringify(body, null, 2));
  }

  const startTime = Date.now();
  let attempt = 0;
  
  while (attempt <= retries) {
    attempt++;
    if (attempt > 1) {
      console.log(`   ${colorize('yellow', '🔄')} 重试第 ${attempt - 1} 次...`);
    }
    
    try {
      // 设置超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        ...(body && { body: JSON.stringify(body) })
      };

      if (config.logging.level === 'debug') {
        console.log(`   ${colorize('blue', '📡')} 发送请求... (尝试 ${attempt}/${retries + 1})`);
      }
      
      const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      
      if (config.logging.includeTiming) {
        console.log(`   ${colorize('blue', '📡')} 状态码: ${colorize('yellow', response.status)} (${responseTime}ms)`);
      } else {
        console.log(`   ${colorize('blue', '📡')} 状态码: ${colorize('yellow', response.status)}`);
      }
      
      let responseData;
      try {
        responseData = await response.json();
        if (config.logging.includeResponseData) {
          console.log(`   ${colorize('blue', '📊')} 响应数据:`, JSON.stringify(responseData, null, 2));
        }
      } catch (parseError) {
        console.log(`   ${colorize('red', '❌')} 响应数据解析失败: ${parseError.message}`);
        return {
          success: false,
          error: '响应数据解析失败',
          details: parseError.message,
          status: response.status,
          responseTime,
          attempt
        };
      }

      // 验证状态码
      if (response.status !== expectedStatus) {
        const errorMsg = `状态码不匹配: 期望 ${expectedStatus}, 实际 ${response.status}`;
        console.log(`   ${colorize('red', '❌')} ${errorMsg}`);
        return {
          success: false,
          error: errorMsg,
          details: `期望状态码: ${expectedStatus}, 实际状态码: ${response.status}`,
          status: response.status,
          responseTime,
          responseData,
          attempt
        };
      }

      // 验证响应数据
      if (validateResponse) {
        try {
          const validationResult = validateResponse(responseData);
          if (!validationResult) {
            const errorMsg = '响应数据验证失败';
            console.log(`   ${colorize('red', '❌')} ${errorMsg}`);
            return {
              success: false,
              error: errorMsg,
              details: '自定义验证函数返回 false',
              status: response.status,
              responseTime,
              responseData,
              attempt
            };
          }
        } catch (validationError) {
          const errorMsg = '响应数据验证过程中发生错误';
          console.log(`   ${colorize('red', '❌')} ${errorMsg}: ${validationError.message}`);
          return {
            success: false,
            error: errorMsg,
            details: validationError.message,
            status: response.status,
            responseTime,
            responseData,
            attempt
          };
        }
      }

      // 性能检查
      if (config.performance.enabled && responseTime > config.performance.threshold.responseTime) {
        console.log(`   ${colorize('yellow', '⚠️')} 响应时间过长: ${responseTime}ms (阈值: ${config.performance.threshold.responseTime}ms)`);
      }

      console.log(`   ${colorize('green', '✅')} 测试通过`);
      return {
        success: true,
        status: response.status,
        responseTime,
        responseData,
        attempt
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        const errorMsg = `请求超时 (${timeout}ms)`;
        console.log(`   ${colorize('red', '❌')} ${errorMsg}`);
        
        if (attempt <= retries) {
          continue; // 重试
        }
        
        return {
          success: false,
          error: errorMsg,
          details: `请求在 ${timeout}ms 内未完成，已重试 ${retries} 次`,
          responseTime,
          attempt
        };
      }
      
      const errorMsg = `请求失败: ${error.message}`;
      console.log(`   ${colorize('red', '❌')} ${errorMsg}`);
      
      if (attempt <= retries) {
        continue; // 重试
      }
      
      return {
        success: false,
        error: errorMsg,
        details: error.stack || error.message,
        responseTime,
        attempt
      };
    }
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
    this.results = [];
    this.startTime = Date.now();
    this.performance = {
      totalResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      avgResponseTime: 0
    };
  }

  addResult(result) {
    this.total++;
    this.results.push(result);
    
    if (result.success) {
      this.passed++;
    } else {
      this.failed++;
    }
    
    // 更新性能统计
    if (result.responseTime) {
      this.performance.totalResponseTime += result.responseTime;
      this.performance.minResponseTime = Math.min(this.performance.minResponseTime, result.responseTime);
      this.performance.maxResponseTime = Math.max(this.performance.maxResponseTime, result.responseTime);
      this.performance.avgResponseTime = this.performance.totalResponseTime / this.total;
    }
  }

  printSummary() {
    const totalTime = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log(`${colorize('bright', '📊 测试结果汇总')}`);
    console.log('='.repeat(80));
    console.log(`   总计: ${colorize('yellow', this.total)}`);
    console.log(`   通过: ${colorize('green', this.passed)} ✅`);
    console.log(`   失败: ${colorize('red', this.failed)} ❌`);
    console.log(`   成功率: ${colorize('yellow', ((this.passed / this.total) * 100).toFixed(1))}%`);
    console.log(`   总耗时: ${colorize('yellow', totalTime)}ms`);
    
    // 性能统计
    if (this.performance.totalResponseTime > 0) {
      console.log(`\n   ${colorize('cyan', '⚡ 性能统计:')}`);
      console.log(`     平均响应时间: ${colorize('yellow', this.performance.avgResponseTime.toFixed(2))}ms`);
      console.log(`     最快响应时间: ${colorize('green', this.performance.minResponseTime)}ms`);
      console.log(`     最慢响应时间: ${colorize('red', this.performance.maxResponseTime)}ms`);
    }
    
    if (this.failed > 0) {
      console.log('\n' + colorize('red', '❌ 失败详情:'));
      this.results.forEach((result, index) => {
        if (!result.success) {
          console.log(`\n   ${colorize('red', `测试 ${index + 1}:`)}`);
          console.log(`     错误: ${result.error}`);
          console.log(`     详情: ${result.details}`);
          if (result.status) {
            console.log(`     状态码: ${result.status}`);
          }
          if (result.responseTime) {
            console.log(`     响应时间: ${result.responseTime}ms`);
          }
          if (result.attempt && result.attempt > 1) {
            console.log(`     重试次数: ${result.attempt - 1}`);
          }
        }
      });
    }
    
    console.log('\n' + '='.repeat(80));
  }

  getDetailedResults() {
    return this.results;
  }
  
  getPerformanceStats() {
    return this.performance;
  }
}

// 初始化函数
function initializeTests() {
  console.log(colorize('bright', '🚀 初始化测试环境...'));
  validateEnvironment();
  
  if (!validateConfig()) {
    console.log(colorize('yellow', '⚠️  配置验证失败，但测试将继续进行'));
  }
  
  console.log('');
}

module.exports = {
  BASE_URL,
  TEST_CONFIG,
  testEndpoint,
  delay,
  TestResults,
  colors,
  colorize,
  log,
  initializeTests
};
