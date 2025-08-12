/**
 * 工作流步骤1测试脚本
 * 测试需求解析与结构化接口
 */

const { testEndpoint, TestResults } = require('./test-utils');

async function testWorkflowStep1() {
  console.log('🔍 开始测试工作流步骤1: 需求解析与结构化...\n');
  
  const results = new TestResults();

  // 测试用例1: 正常输入
  const normalInput = {
    rawInput: "我们是一家专注于工业LED照明解决方案的公司，主要产品包括高亮度LED灯具、智能控制系统和节能照明方案。我们的目标客户是制造业企业，他们关注节能效果、产品可靠性和售后服务。"
  };

  const normalResult = await testEndpoint('/api/workflow/1-structure-data', {
    method: 'POST',
    body: normalInput,
    description: '正常输入测试 - 工业LED照明公司',
    validateResponse: (data) => {
      return data.success === true && 
             data.data && 
             data.data.companyInfo && 
             data.data.products !== undefined &&
             data.data.sellingPoints &&
             data.data.targetAudience &&
             data.data.assets &&
             data.data.seo;
    }
  });
  results.addResult(normalResult);

  // 测试用例2: 简短输入（边界测试）
  const shortInput = {
    rawInput: "我们是一家软件公司，提供企业级解决方案。"
  };

  const shortResult = await testEndpoint('/api/workflow/1-structure-data', {
    method: 'POST',
    body: shortInput,
    description: '简短输入测试 - 软件公司',
    validateResponse: (data) => {
      return data.success === true && data.data;
    }
  });
  results.addResult(shortResult);

  // 测试用例3: 长输入（边界测试）
  const longInput = {
    rawInput: "我们是一家专注于工业LED照明解决方案的公司，主要产品包括高亮度LED灯具、智能控制系统和节能照明方案。我们的目标客户是制造业企业，他们关注节能效果、产品可靠性和售后服务。我们拥有多年的行业经验，服务过数百家大型制造企业，产品通过了ISO9001、CE、RoHS等国际认证。我们的核心优势在于技术创新、质量控制和客户服务，致力于为客户提供最优质的照明解决方案。"
  };

  const longResult = await testEndpoint('/api/workflow/1-structure-data', {
    method: 'POST',
    body: longInput,
    description: '长输入测试 - 详细描述',
    validateResponse: (data) => {
      return data.success === true && data.data;
    }
  });
  results.addResult(longResult);

  // 测试用例4: 缺少必需字段（错误处理测试）
  const missingFieldResult = await testEndpoint('/api/workflow/1-structure-data', {
    method: 'POST',
    body: {},
    description: '缺少必需字段测试',
    expectedStatus: 400,
    validateResponse: (data) => {
      return data.success === false;
    }
  });
  results.addResult(missingFieldResult);

  // 测试用例5: 空字符串输入（错误处理测试）
  const emptyInput = {
    rawInput: ""
  };

  const emptyResult = await testEndpoint('/api/workflow/1-structure-data', {
    method: 'POST',
    body: emptyInput,
    description: '空字符串输入测试',
    expectedStatus: 400,
    validateResponse: (data) => {
      return data.success === false;
    }
  });
  results.addResult(emptyResult);

  // 打印测试结果汇总
  results.printSummary();
}

// 运行测试
if (require.main === module) {
  testWorkflowStep1().catch(console.error);
}

module.exports = { testWorkflowStep1 };
