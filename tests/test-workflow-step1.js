/**
 * 工作流步骤1测试脚本
 * 测试需求解析与结构化接口
 */

const { testEndpoint, TestResults, colorize } = require('./test-utils');

async function testWorkflowStep1() {
  console.log(colorize('bright', '🔍 开始测试工作流步骤1: 需求解析与结构化...'));
  console.log(colorize('blue', '   测试目标: 验证需求解析接口的数据处理能力和错误处理'));
  console.log('');
  
  const results = new TestResults();

  // 测试用例1: 正常输入
  console.log(colorize('cyan', '📋 测试用例1: 正常输入测试'));
  const normalInput = {
    rawInput: "我们是一家专注于工业LED照明解决方案的公司，主要产品包括高亮度LED灯具、智能控制系统和节能照明方案。我们的目标客户是制造业企业，他们关注节能效果、产品可靠性和售后服务。"
  };

  const normalResult = await testEndpoint('/api/workflow/1-structure-data', {
    method: 'POST',
    body: normalInput,
    description: '正常输入测试 - 工业LED照明公司',
    validateResponse: (data) => {
      console.log(`      ${colorize('blue', '🔍')} 验证响应数据结构...`);
      
      // 检查基本结构
      if (!data.success) {
        console.log(`      ${colorize('red', '❌')} success 字段为 false`);
        return false;
      }
      
      if (!data.data) {
        console.log(`      ${colorize('red', '❌')} 缺少 data 字段`);
        return false;
      }
      
      // 检查必需字段
      const requiredFields = ['companyInfo', 'products', 'sellingPoints', 'targetAudience', 'assets', 'seo'];
      for (const field of requiredFields) {
        if (data.data[field] === undefined) {
          console.log(`      ${colorize('red', '❌')} 缺少必需字段: ${field}`);
          return false;
        }
      }
      
      console.log(`      ${colorize('green', '✅')} 所有必需字段都存在`);
      return true;
    }
  });
  results.addResult(normalResult);

  // 测试用例2: 简短输入（边界测试）
  console.log(colorize('cyan', '\n📋 测试用例2: 简短输入边界测试'));
  const shortInput = {
    rawInput: "我们是一家软件公司，提供企业级解决方案。"
  };

  const shortResult = await testEndpoint('/api/workflow/1-structure-data', {
    method: 'POST',
    body: shortInput,
    description: '简短输入测试 - 软件公司',
    validateResponse: (data) => {
      console.log(`      ${colorize('blue', '🔍')} 验证简短输入处理...`);
      
      if (!data.success) {
        console.log(`      ${colorize('red', '❌')} success 字段为 false`);
        return false;
      }
      
      if (!data.data) {
        console.log(`      ${colorize('red', '❌')} 缺少 data 字段`);
        return false;
      }
      
      console.log(`      ${colorize('green', '✅')} 简短输入处理成功`);
      return true;
    }
  });
  results.addResult(shortResult);

  // 测试用例3: 长输入（边界测试）
  console.log(colorize('cyan', '\n📋 测试用例3: 长输入边界测试'));
  const longInput = {
    rawInput: "我们是一家专注于工业LED照明解决方案的公司，主要产品包括高亮度LED灯具、智能控制系统和节能照明方案。我们的目标客户是制造业企业，他们关注节能效果、产品可靠性和售后服务。我们拥有多年的行业经验，服务过数百家大型制造企业，产品通过了ISO9001、CE、RoHS等国际认证。我们的核心优势在于技术创新、质量控制和客户服务，致力于为客户提供最优质的照明解决方案。"
  };

  const longResult = await testEndpoint('/api/workflow/1-structure-data', {
    method: 'POST',
    body: longInput,
    description: '长输入测试 - 详细描述',
    validateResponse: (data) => {
      console.log(`      ${colorize('blue', '🔍')} 验证长输入处理...`);
      
      if (!data.success) {
        console.log(`      ${colorize('red', '❌')} success 字段为 false`);
        return false;
      }
      
      if (!data.data) {
        console.log(`      ${colorize('red', '❌')} 缺少 data 字段`);
        return false;
      }
      
      console.log(`      ${colorize('green', '✅')} 长输入处理成功`);
      return true;
    }
  });
  results.addResult(longResult);

  // 测试用例4: 缺少必需字段（错误处理测试）
  console.log(colorize('cyan', '\n📋 测试用例4: 缺少必需字段错误处理测试'));
  const missingFieldResult = await testEndpoint('/api/workflow/1-structure-data', {
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

  // 测试用例5: 空字符串输入（错误处理测试）
  console.log(colorize('cyan', '\n📋 测试用例5: 空字符串输入错误处理测试'));
  const emptyInput = {
    rawInput: ""
  };

  const emptyResult = await testEndpoint('/api/workflow/1-structure-data', {
    method: 'POST',
    body: emptyInput,
    description: '空字符串输入测试',
    expectedStatus: 400,
    validateResponse: (data) => {
      console.log(`      ${colorize('blue', '🔍')} 验证空输入错误处理...`);
      
      if (data.success !== false) {
        console.log(`      ${colorize('red', '❌')} 期望 success 为 false，实际为 ${data.success}`);
        return false;
      }
      
      if (!data.error || !data.message) {
        console.log(`      ${colorize('red', '❌')} 缺少错误信息字段`);
        return false;
      }
      
      console.log(`      ${colorize('green', '✅')} 空输入错误处理正确`);
      return true;
    }
  });
  results.addResult(emptyResult);

  // 打印测试结果汇总
  results.printSummary();
  
  // 返回详细结果供其他测试使用
  return results;
}

// 运行测试
if (require.main === module) {
  console.log(colorize('bright', '🚀 启动工作流步骤1测试...\n'));
  testWorkflowStep1().catch(error => {
    console.error(colorize('red', '💥 测试执行失败:'), error);
    process.exit(1);
  });
}

module.exports = { testWorkflowStep1 };
