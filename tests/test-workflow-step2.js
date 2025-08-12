/**
 * 工作流步骤2测试脚本
 * 测试品牌视觉设计接口
 */

const { testEndpoint, TestResults } = require('./test-utils');

async function testWorkflowStep2() {
  console.log('🎨 开始测试工作流步骤2: 品牌视觉设计...\n');
  
  const results = new TestResults();

  // 测试用例1: 正常输入 - B2B工业公司
  const normalInput = {
    industry: "工业LED照明",
    preference: "简洁明了的设计，突出专业性和可靠性，使用蓝色和灰色为主色调",
    brandPersonality: "professional",
    targetMarket: "B2B"
  };

  const normalResult = await testEndpoint('/api/workflow/2-design-system', {
    method: 'POST',
    body: normalInput,
    description: '正常输入测试 - B2B工业公司',
    validateResponse: (data) => {
      return data.success === true && 
             data.data && 
             data.data.palette && 
             data.data.typography &&
             data.data.spacing &&
             data.data.borderRadius &&
             data.data.shadow;
    }
  });
  results.addResult(normalResult);

  // 测试用例2: 最小必需字段
  const minimalInput = {
    industry: "软件服务",
    preference: "现代简约风格，注重用户体验"
  };

  const minimalResult = await testEndpoint('/api/workflow/2-design-system', {
    method: 'POST',
    body: minimalInput,
    description: '最小必需字段测试 - 软件服务',
    validateResponse: (data) => {
      return data.success === true && data.data;
    }
  });
  results.addResult(minimalResult);

  // 测试用例3: 创意行业
  const creativeInput = {
    industry: "创意设计",
    preference: "充满活力和创意的设计，使用丰富的色彩和独特的字体",
    brandPersonality: "creative",
    targetMarket: "B2C"
  };

  const creativeResult = await testEndpoint('/api/workflow/2-design-system', {
    method: 'POST',
    body: creativeInput,
    description: '创意行业测试 - 创意设计公司',
    validateResponse: (data) => {
      return data.success === true && data.data;
    }
  });
  results.addResult(creativeResult);

  // 测试用例4: 奢侈品行业
  const luxuryInput = {
    industry: "奢侈品零售",
    preference: "高端奢华的设计，使用金色和黑色，体现品质感",
    brandPersonality: "luxury",
    targetMarket: "B2C"
  };

  const luxuryResult = await testEndpoint('/api/workflow/2-design-system', {
    method: 'POST',
    body: luxuryInput,
    description: '奢侈品行业测试 - 奢侈品零售',
    validateResponse: (data) => {
      return data.success === true && data.data;
    }
  });
  results.addResult(luxuryResult);

  // 测试用例5: 缺少必需字段（错误处理测试）
  const missingFieldResult = await testEndpoint('/api/workflow/2-design-system', {
    method: 'POST',
    body: {},
    description: '缺少必需字段测试',
    expectedStatus: 400,
    validateResponse: (data) => {
      return data.success === false;
    }
  });
  results.addResult(missingFieldResult);

  // 测试用例6: 无效的枚举值（错误处理测试）
  const invalidEnumInput = {
    industry: "测试行业",
    preference: "测试偏好",
    brandPersonality: "invalid_personality",
    targetMarket: "invalid_market"
  };

  const invalidEnumResult = await testEndpoint('/api/workflow/2-design-system', {
    method: 'POST',
    body: invalidEnumInput,
    description: '无效枚举值测试',
    expectedStatus: 400,
    validateResponse: (data) => {
      return data.success === false;
    }
  });
  results.addResult(invalidEnumResult);

  // 打印测试结果汇总
  results.printSummary();
}

// 运行测试
if (require.main === module) {
  testWorkflowStep2().catch(console.error);
}

module.exports = { testWorkflowStep2 };
