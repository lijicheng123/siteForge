/**
 * 工作流步骤2测试脚本
 * 测试品牌视觉设计接口
 */

const { testEndpoint, TestResults, colorize } = require('./test-utils');

async function testWorkflowStep2() {
  console.log(colorize('bright', '🎨 开始测试工作流步骤2: 品牌视觉设计...'));
  console.log(colorize('blue', '   测试目标: 验证设计系统生成接口的响应格式和数据结构'));
  console.log('');
  
  const results = new TestResults();

  // 测试用例1: 正常输入 - B2B工业公司
  console.log(colorize('cyan', '📋 测试用例1: B2B工业公司设计系统测试'));
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
      console.log(`      ${colorize('blue', '🔍')} 验证设计系统数据结构...`);
      
      if (!data.success) {
        console.log(`      ${colorize('red', '❌')} success 字段为 false`);
        return false;
      }
      
      if (!data.data) {
        console.log(`      ${colorize('red', '❌')} 缺少 data 字段`);
        return false;
      }
      
      // 检查设计系统必需字段
      const requiredFields = ['palette', 'typography', 'spacing', 'borderRadius', 'shadow'];
      for (const field of requiredFields) {
        if (data.data[field] === undefined) {
          console.log(`      ${colorize('red', '❌')} 缺少设计系统字段: ${field}`);
          return false;
        }
      }
      
      console.log(`      ${colorize('green', '✅')} 设计系统数据结构完整`);
      return true;
    }
  });
  results.addResult(normalResult);

  // 测试用例2: 最小必需字段
  console.log(colorize('cyan', '\n📋 测试用例2: 最小必需字段测试'));
  const minimalInput = {
    industry: "软件服务",
    preference: "现代简约风格，注重用户体验"
  };

  const minimalResult = await testEndpoint('/api/workflow/2-design-system', {
    method: 'POST',
    body: minimalInput,
    description: '最小必需字段测试 - 软件服务',
    validateResponse: (data) => {
      console.log(`      ${colorize('blue', '🔍')} 验证最小输入处理...`);
      
      if (!data.success) {
        console.log(`      ${colorize('red', '❌')} success 字段为 false`);
        return false;
      }
      
      if (!data.data) {
        console.log(`      ${colorize('red', '❌')} 缺少 data 字段`);
        return false;
      }
      
      console.log(`      ${colorize('green', '✅')} 最小输入处理成功`);
      return true;
    }
  });
  results.addResult(minimalResult);

  // 测试用例3: 创意行业
  console.log(colorize('cyan', '\n📋 测试用例3: 创意行业测试'));
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
      console.log(`      ${colorize('blue', '🔍')} 验证创意行业处理...`);
      
      if (!data.success) {
        console.log(`      ${colorize('red', '❌')} success 字段为 false`);
        return false;
      }
      
      if (!data.data) {
        console.log(`      ${colorize('red', '❌')} 缺少 data 字段`);
        return false;
      }
      
      console.log(`      ${colorize('green', '✅')} 创意行业处理成功`);
      return true;
    }
  });
  results.addResult(creativeResult);

  // 测试用例4: 奢侈品行业
  console.log(colorize('cyan', '\n📋 测试用例4: 奢侈品行业测试'));
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
      console.log(`      ${colorize('blue', '🔍')} 验证奢侈品行业处理...`);
      
      if (!data.success) {
        console.log(`      ${colorize('red', '❌')} success 字段为 false`);
        return false;
      }
      
      if (!data.data) {
        console.log(`      ${colorize('red', '❌')} 缺少 data 字段`);
        return false;
      }
      
      console.log(`      ${colorize('green', '✅')} 奢侈品行业处理成功`);
      return true;
    }
  });
  results.addResult(luxuryResult);

  // 测试用例5: 缺少必需字段（错误处理测试）
  console.log(colorize('cyan', '\n📋 测试用例5: 缺少必需字段错误处理测试'));
  const missingFieldResult = await testEndpoint('/api/workflow/2-design-system', {
    method: 'POST',
    body: {},
    description: '缺少必需字段测试',
    expectedStatus: 400,
    validateResponse: (data) => {
      console.log(`      ${colorize('blue', '🔍')} 验证错误响应...`);
      
      if (data.success !== false) {
        console.log(`      ${colorize('red', '❌')} 期望 success 为 false，实际为 ${data.success}`);
        return false;
      }
      
      if (!data.error || !data.message) {
        console.log(`      ${colorize('red', '❌')} 缺少错误信息字段`);
        return false;
      }
      
      console.log(`      ${colorize('green', '✅')} 错误处理正确`);
      return true;
    }
  });
  results.addResult(missingFieldResult);

  // 测试用例6: 无效的行业类型（边界测试）
  console.log(colorize('cyan', '\n📋 测试用例6: 无效行业类型边界测试'));
  const invalidIndustryInput = {
    industry: "不存在的行业类型",
    preference: "现代设计风格"
  };

  const invalidIndustryResult = await testEndpoint('/api/workflow/2-design-system', {
    method: 'POST',
    body: invalidIndustryInput,
    description: '无效行业类型测试',
    validateResponse: (data) => {
      console.log(`      ${colorize('blue', '🔍')} 验证无效行业处理...`);
      
      // 这个测试可能成功也可能失败，取决于API的实现
      if (data.success) {
        console.log(`      ${colorize('green', '✅')} 无效行业被正确处理`);
        return true;
      } else {
        // 如果失败，应该返回适当的错误信息
        if (data.error && data.message) {
          console.log(`      ${colorize('green', '✅')} 无效行业被正确拒绝`);
          return true;
        } else {
          console.log(`      ${colorize('red', '❌')} 无效行业处理不当`);
          return false;
        }
      }
    }
  });
  results.addResult(invalidIndustryResult);

  // 打印测试结果汇总
  results.printSummary();
  
  // 返回详细结果供其他测试使用
  return results;
}

// 运行测试
if (require.main === module) {
  console.log(colorize('bright', '🚀 启动工作流步骤2测试...\n'));
  testWorkflowStep2().catch(error => {
    console.error(colorize('red', '💥 测试执行失败:'), error);
    process.exit(1);
  });
}

module.exports = { testWorkflowStep2 };
