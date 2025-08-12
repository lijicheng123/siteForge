/**
 * 工作流步骤3测试脚本
 * 测试网站信息架构接口
 */

const { testEndpoint, TestResults } = require('./test-utils');

async function testWorkflowStep3() {
  console.log('🏗️ 开始测试工作流步骤3: 网站信息架构...\n');
  
  const results = new TestResults();

  // 测试用例1: 正常输入 - 工业公司
  const normalInput = {
    companyName: "明辉LED照明",
    products: [
      {
        name: "高亮度LED灯具",
        category: "工业照明",
        description: "适用于工厂、仓库等大空间照明需求"
      },
      {
        name: "智能控制系统",
        category: "控制系统",
        description: "支持远程控制和自动化调节"
      }
    ],
    industry: "工业LED照明",
    targetMarket: "B2B"
  };

  const normalResult = await testEndpoint('/api/workflow/3-website-architecture', {
    method: 'POST',
    body: normalInput,
    description: '正常输入测试 - 工业LED照明公司',
    validateResponse: (data) => {
      return data.success === true && 
             data.data && 
             data.data.globalElements &&
             data.data.pages &&
             Array.isArray(data.data.pages);
    }
  });
  results.addResult(normalResult);

  // 测试用例2: 最小必需字段
  const minimalInput = {
    companyName: "测试公司",
    products: [
      {
        name: "测试产品",
        category: "测试类别"
      }
    ]
  };

  const minimalResult = await testEndpoint('/api/workflow/3-website-architecture', {
    method: 'POST',
    body: minimalInput,
    description: '最小必需字段测试',
    validateResponse: (data) => {
      return data.success === true && data.data;
    }
  });
  results.addResult(minimalResult);

  // 测试用例3: 多产品公司
  const multiProductInput = {
    companyName: "创新科技集团",
    products: [
      {
        name: "企业管理系统",
        category: "软件服务",
        description: "全面的企业管理解决方案"
      },
      {
        name: "数据分析平台",
        category: "数据分析",
        description: "智能数据分析和可视化"
      },
      {
        name: "云存储服务",
        category: "云服务",
        description: "安全可靠的云端存储"
      },
      {
        name: "移动应用开发",
        category: "移动开发",
        description: "跨平台移动应用开发"
      }
    ],
    industry: "信息技术",
    targetMarket: "Enterprise"
  };

  const multiProductResult = await testEndpoint('/api/workflow/3-website-architecture', {
    method: 'POST',
    body: multiProductInput,
    description: '多产品公司测试 - 科技集团',
    validateResponse: (data) => {
      return data.success === true && data.data;
    }
  });
  results.addResult(multiProductResult);

  // 测试用例4: B2C零售公司
  const b2cInput = {
    companyName: "时尚生活馆",
    products: [
      {
        name: "时尚服装",
        category: "服装",
        description: "潮流时尚的男女服装"
      },
      {
        name: "配饰系列",
        category: "配饰",
        description: "包包、鞋子、首饰等配饰"
      }
    ],
    industry: "时尚零售",
    targetMarket: "B2C"
  };

  const b2cResult = await testEndpoint('/api/workflow/3-website-architecture', {
    method: 'POST',
    body: b2cInput,
    description: 'B2C零售公司测试 - 时尚生活馆',
    validateResponse: (data) => {
      return data.success === true && data.data;
    }
  });
  results.addResult(b2cResult);

  // 测试用例5: 缺少必需字段（错误处理测试）
  const missingFieldResult = await testEndpoint('/api/workflow/3-website-architecture', {
    method: 'POST',
    body: {},
    description: '缺少必需字段测试',
    expectedStatus: 400,
    validateResponse: (data) => {
      return data.success === false;
    }
  });
  results.addResult(missingFieldResult);

  // 测试用例6: 空产品数组（错误处理测试）
  const emptyProductsInput = {
    companyName: "测试公司",
    products: []
  };

  const emptyProductsResult = await testEndpoint('/api/workflow/3-website-architecture', {
    method: 'POST',
    body: emptyProductsInput,
    description: '空产品数组测试',
    expectedStatus: 400,
    validateResponse: (data) => {
      return data.success === false;
    }
  });
  results.addResult(emptyProductsResult);

  // 测试用例7: 产品缺少必需字段（错误处理测试）
  const invalidProductInput = {
    companyName: "测试公司",
    products: [
      {
        name: "测试产品"
        // 缺少 category 字段
      }
    ]
  };

  const invalidProductResult = await testEndpoint('/api/workflow/3-website-architecture', {
    method: 'POST',
    body: invalidProductInput,
    description: '产品缺少必需字段测试',
    expectedStatus: 400,
    validateResponse: (data) => {
      return data.success === false;
    }
  });
  results.addResult(invalidProductResult);

  // 打印测试结果汇总
  results.printSummary();
}

// 运行测试
if (require.main === module) {
  testWorkflowStep3().catch(console.error);
}

module.exports = { testWorkflowStep3 };
