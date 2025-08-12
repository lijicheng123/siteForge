/**
 * 测试配置文件
 * 管理测试环境、配置选项和测试参数
 */

// 测试环境配置
const TEST_ENVIRONMENTS = {
  local: {
    baseUrl: 'http://localhost:3000',
    timeout: 10000,
    retries: 2,
    description: '本地开发环境'
  },
  staging: {
    baseUrl: 'https://staging.siteforge-ai.com',
    timeout: 15000,
    retries: 1,
    description: '预发布环境'
  },
  production: {
    baseUrl: 'https://siteforge-ai.com',
    timeout: 20000,
    retries: 0,
    description: '生产环境'
  }
};

// 当前测试环境
const CURRENT_ENV = process.env.TEST_ENV || 'local';

// 测试配置
const TEST_CONFIG = {
  // 基础配置
  baseUrl: TEST_ENVIRONMENTS[CURRENT_ENV].baseUrl,
  timeout: TEST_ENVIRONMENTS[CURRENT_ENV].timeout,
  retries: TEST_ENVIRONMENTS[CURRENT_ENV].retries,
  
  // 测试选项
  verbose: process.env.TEST_VERBOSE === 'true',
  parallel: process.env.TEST_PARALLEL === 'true',
  stopOnFailure: process.env.TEST_STOP_ON_FAILURE === 'true',
  
  // 性能测试配置
  performance: {
    enabled: process.env.TEST_PERFORMANCE === 'true',
    threshold: {
      responseTime: 2000, // 响应时间阈值 (ms)
      throughput: 100     // 吞吐量阈值 (req/s)
    }
  },
  
  // 数据验证配置
  validation: {
    strict: process.env.TEST_STRICT_VALIDATION === 'true',
    ignoreOptionalFields: process.env.TEST_IGNORE_OPTIONAL === 'true'
  },
  
  // 日志配置
  logging: {
    level: process.env.TEST_LOG_LEVEL || 'info',
    includeRequestData: process.env.TEST_LOG_REQUESTS === 'true',
    includeResponseData: process.env.TEST_LOG_RESPONSES === 'true',
    includeTiming: process.env.TEST_LOG_TIMING === 'true'
  }
};

// 测试数据配置
const TEST_DATA = {
  // 公司信息测试数据
  companies: {
    industrial: {
      name: "工业LED照明公司",
      industry: "工业LED照明",
      description: "专注于工业LED照明解决方案，主要产品包括高亮度LED灯具、智能控制系统和节能照明方案。目标客户是制造业企业，关注节能效果、产品可靠性和售后服务。"
    },
    software: {
      name: "企业软件服务公司",
      industry: "软件服务",
      description: "提供企业级软件解决方案，包括ERP系统、客户关系管理和业务流程自动化。服务中小型企业和大型企业，注重用户体验和系统稳定性。"
    },
    creative: {
      name: "创意设计工作室",
      industry: "创意设计",
      description: "专注于品牌设计、UI/UX设计和创意营销。服务创意行业客户，追求独特性和创新性，使用丰富的色彩和独特的视觉元素。"
    },
    luxury: {
      name: "奢侈品零售品牌",
      industry: "奢侈品零售",
      description: "高端奢侈品零售，包括珠宝、手表和配饰。目标客户是高净值人群，注重品质感和奢华体验，使用金色和黑色等高端色彩。"
    }
  },
  
  // 设计偏好测试数据
  designPreferences: {
    professional: "简洁明了的设计，突出专业性和可靠性，使用蓝色和灰色为主色调",
    modern: "现代简约风格，注重用户体验和可读性，使用清晰的层次结构",
    creative: "充满活力和创意的设计，使用丰富的色彩和独特的字体",
    luxury: "高端奢华的设计，使用金色和黑色，体现品质感和尊贵感"
  },
  
  // 品牌个性测试数据
  brandPersonalities: {
    professional: "专业、可靠、值得信赖",
    modern: "现代、创新、用户友好",
    creative: "创意、活力、独特",
    luxury: "奢华、高端、品质"
  }
};

// 测试工具函数
function getTestConfig() {
  return { ...TEST_CONFIG };
}

function getTestData() {
  return { ...TEST_DATA };
}

function getCurrentEnvironment() {
  return {
    name: CURRENT_ENV,
    ...TEST_ENVIRONMENTS[CURRENT_ENV]
  };
}

function isLocalEnvironment() {
  return CURRENT_ENV === 'local';
}

function isStagingEnvironment() {
  return CURRENT_ENV === 'staging';
}

function isProductionEnvironment() {
  return CURRENT_ENV === 'production';
}

// 环境检查函数
function validateEnvironment() {
  const env = getCurrentEnvironment();
  console.log(`🌍 测试环境: ${env.description} (${env.baseUrl})`);
  console.log(`⏱️  超时设置: ${env.timeout}ms`);
  console.log(`🔄 重试次数: ${env.retries}`);
  
  if (isProductionEnvironment()) {
    console.log('⚠️  警告: 正在生产环境中运行测试');
  }
  
  return env;
}

// 配置验证函数
function validateConfig() {
  const config = getTestConfig();
  const issues = [];
  
  if (config.timeout < 1000) {
    issues.push('超时时间过短 (< 1000ms)');
  }
  
  if (config.retries > 5) {
    issues.push('重试次数过多 (> 5)');
  }
  
  if (issues.length > 0) {
    console.log('⚠️  配置警告:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  return issues.length === 0;
}

module.exports = {
  TEST_CONFIG,
  TEST_DATA,
  TEST_ENVIRONMENTS,
  getTestConfig,
  getTestData,
  getCurrentEnvironment,
  isLocalEnvironment,
  isStagingEnvironment,
  isProductionEnvironment,
  validateEnvironment,
  validateConfig
};
