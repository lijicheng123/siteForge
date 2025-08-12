/**
 * 完整工作流接口测试脚本
 * 测试整个工作流程的串联执行
 */

const { testEndpoint, TestResults } = require('./test-utils');

async function testCompleteWorkflow() {
  console.log('🔄 开始测试完整工作流接口...\n');
  
  const results = new TestResults();

  // 测试用例1: 基本工作流 - 工业公司
  const basicInput = {
    rawInput: "我们是一家专注于工业LED照明解决方案的公司，主要产品包括高亮度LED灯具、智能控制系统和节能照明方案。我们的目标客户是制造业企业，他们关注节能效果、产品可靠性和售后服务。我们拥有多年的行业经验，服务过数百家大型制造企业。",
    options: {
      brandPersonality: "professional",
      targetMarket: "B2B"
    }
  };

  const basicResult = await testEndpoint('/api/workflow/complete-workflow', {
    method: 'POST',
    body: basicInput,
    description: '基本工作流测试 - 工业LED照明公司',
    validateResponse: (data) => {
      return data.success === true && 
             data.data.workflowId &&
             data.data.status === 'completed' &&
             data.data.steps &&
             data.data.steps.step1 &&
             data.data.steps.step2 &&
             data.data.steps.step3 &&
             data.data.steps.step4 &&
             data.data.steps.step5 &&
             data.data.steps.step6 &&
             data.data.finalResult &&
             data.data.finalResult.html &&
             data.data.metadata &&
             data.data.metadata.totalTime > 0;
    }
  });
  results.addResult(basicResult);

  // 测试用例2: 创意公司工作流
  const creativeInput = {
    rawInput: "我们是一家创意设计工作室，专注于品牌设计、UI/UX设计和数字营销。我们的团队充满创意和激情，擅长为年轻品牌打造独特的视觉形象。我们服务过很多初创公司和创意企业，他们喜欢前卫、有趣和富有想象力的设计风格。",
    options: {
      brandPersonality: "creative",
      targetMarket: "B2C",
      customBlocks: [
        {
          name: "portfolio-showcase",
          description: "作品集展示组件，支持网格布局和过滤功能",
          props: {
            projects: "array",
            layout: "string",
            filters: "array"
          }
        }
      ]
    }
  };

  const creativeResult = await testEndpoint('/api/workflow/complete-workflow', {
    method: 'POST',
    body: creativeInput,
    description: '创意公司工作流测试 - 设计工作室',
    validateResponse: (data) => {
      return data.success === true && 
             data.data.status === 'completed' &&
             data.data.steps.step1.status === 'success' &&
             data.data.steps.step2.status === 'success' &&
             data.data.steps.step3.status === 'success' &&
             data.data.steps.step4.status === 'success' &&
             data.data.steps.step5.status === 'success' &&
             data.data.steps.step6.status === 'success';
    }
  });
  results.addResult(creativeResult);

  // 测试用例3: 最小输入测试
  const minimalInput = {
    rawInput: "我们是一家软件公司，提供企业级解决方案。"
  };

  const minimalResult = await testEndpoint('/api/workflow/complete-workflow', {
    method: 'POST',
    body: minimalInput,
    description: '最小输入测试 - 软件公司',
    validateResponse: (data) => {
      return data.success === true && 
             data.data.status === 'completed' &&
             data.data.finalResult.html.includes('<!DOCTYPE html>');
    }
  });
  results.addResult(minimalResult);

  // 测试用例4: 长输入测试
  const longInput = {
    rawInput: "我们是一家专注于工业LED照明解决方案的公司，主要产品包括高亮度LED灯具、智能控制系统和节能照明方案。我们的目标客户是制造业企业，他们关注节能效果、产品可靠性和售后服务。我们拥有多年的行业经验，服务过数百家大型制造企业，产品通过了ISO9001、CE、RoHS等国际认证。我们的核心优势在于技术创新、质量控制和客户服务，致力于为客户提供最优质的照明解决方案。我们提供从产品设计、生产制造到安装调试的全流程服务，确保每个项目都能达到客户的期望。我们的团队由经验丰富的工程师和技术专家组成，他们深入了解工业照明的各种应用场景和特殊需求。",
    options: {
      brandPersonality: "professional",
      targetMarket: "Enterprise"
    }
  };

  const longResult = await testEndpoint('/api/workflow/complete-workflow', {
    method: 'POST',
    body: longInput,
    description: '长输入测试 - 详细描述',
    validateResponse: (data) => {
      return data.success === true && 
             data.data.status === 'completed' &&
             data.data.steps.step1.data.companyInfo.industry === '工业LED照明';
    }
  });
  results.addResult(longResult);

  // 测试用例5: 缺少必需字段（错误处理测试）
  const missingFieldResult = await testEndpoint('/api/workflow/complete-workflow', {
    method: 'POST',
    body: {},
    description: '缺少必需字段测试',
    expectedStatus: 400,
    validateResponse: (data) => {
      return data.success === false;
    }
  });
  results.addResult(missingFieldResult);

  // 测试用例6: 空字符串输入（错误处理测试）
  const emptyInput = {
    rawInput: ""
  };

  const emptyResult = await testEndpoint('/api/workflow/complete-workflow', {
    method: 'POST',
    body: emptyInput,
    description: '空字符串输入测试',
    expectedStatus: 400,
    validateResponse: (data) => {
      return data.success === false;
    }
  });
  results.addResult(emptyResult);

  // 测试用例7: 验证数据流转
  const flowTestInput = {
    rawInput: "我们是一家科技公司，专注于人工智能和大数据解决方案。",
    options: {
      brandPersonality: "professional",
      targetMarket: "Enterprise"
    }
  };

  const flowTestResult = await testEndpoint('/api/workflow/complete-workflow', {
    method: 'POST',
    body: flowTestInput,
    description: '数据流转验证测试',
    validateResponse: (data) => {
      if (!data.success || data.data.status !== 'completed') return false;
      
      // 验证步骤1到步骤2的数据流转
      const step1Industry = data.data.steps.step1.data.companyInfo.industry;
      const step2Industry = data.data.steps.step2.data;
      
      // 验证步骤1到步骤3的数据流转
      const step1CompanyName = data.data.steps.step1.data.companyInfo.name;
      const step3CompanyName = data.data.steps.step3.data;
      
      // 验证最终HTML包含公司名称
      const finalHtml = data.data.finalResult.html;
      
      return step1Industry && step2Industry && step1CompanyName && step3CompanyName && finalHtml.includes('科技公司');
    }
  });
  results.addResult(flowTestResult);

  // 打印测试结果汇总
  results.printSummary();
}

// 运行测试
if (require.main === module) {
  testCompleteWorkflow().catch(console.error);
}

module.exports = { testCompleteWorkflow };
