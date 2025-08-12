/**
 * 工作流步骤4测试脚本
 * 测试页面内容策划接口
 */

const { testEndpoint, TestResults } = require('./test-utils');

async function testWorkflowStep4() {
  console.log('📝 开始测试工作流步骤4: 页面内容策划...\n');
  
  const results = new TestResults();

  // 测试用例1: 正常输入 - 完整的蓝图V1
  const normalInput = {
    structuredData: {
      companyInfo: {
        name: "明辉LED照明",
        description: "专注于工业LED照明解决方案的专业公司",
        industry: "工业LED照明"
      },
      products: [
        {
          name: "高亮度LED灯具",
          category: "工业照明",
          description: "适用于工厂、仓库等大空间照明需求"
        }
      ],
      sellingPoints: {
        primary: "节能环保",
        secondary: "高可靠性",
        tertiary: "智能控制"
      },
      targetAudience: {
        region: "全国",
        industry: "制造业",
        concerns: ["节能效果", "产品可靠性"],
        preference: "专业可靠"
      },
      assets: {
        images: {}
      },
      seo: {
        mainKeywords: ["LED照明", "工业照明"],
        longTailKeywords: ["工厂LED照明", "仓库LED灯具"]
      }
    },
    designSystem: {
      palette: {
        primary: "#2563eb",
        secondary: "#64748b",
        accent: "#f59e0b"
      },
      typography: {
        font_family_heading: "Inter",
        font_family_body: "Inter"
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px"
      }
    },
    globalElements: {
      header: {
        logo: "/images/logo.png",
        menuItems: [
          { name: "首页", path: "/", icon: "home" },
          { name: "产品", path: "/products", icon: "products" }
        ]
      },
      footer: {
        links: [
          { name: "关于我们", path: "/about" },
          { name: "联系我们", path: "/contact" }
        ]
      }
    },
    pages: [
      {
        name: "首页",
        path: "/",
        purpose: "展示公司核心价值主张和主要产品"
      },
      {
        name: "产品页",
        path: "/products",
        purpose: "详细介绍产品特性和优势"
      }
    ]
  };

  const normalResult = await testEndpoint('/api/workflow/4-plan-content', {
    method: 'POST',
    body: normalInput,
    description: '正常输入测试 - 完整蓝图V1',
    validateResponse: (data) => {
      return data.success === true && 
             data.data && 
             data.data.pages &&
             data.data.pages.every(page => 
               page.seo && page.outline && Array.isArray(page.outline)
             );
    }
  });
  results.addResult(normalResult);

  // 测试用例2: 最小必需字段
  const minimalInput = {
    structuredData: {
      companyInfo: {
        name: "测试公司",
        description: "测试描述",
        industry: "测试行业"
      },
      products: [],
      sellingPoints: {
        primary: "测试卖点",
        secondary: "测试卖点2",
        tertiary: "测试卖点3"
      },
      targetAudience: {
        region: "测试地区",
        industry: "测试行业",
        concerns: ["测试关注点"],
        preference: "测试偏好"
      },
      assets: { images: {} },
      seo: {
        mainKeywords: ["测试关键词"],
        longTailKeywords: ["测试长尾关键词"]
      }
    },
    designSystem: {
      palette: { primary: "#000000" },
      typography: { font_family_heading: "Arial" },
      spacing: { xs: "4px" }
    },
    globalElements: {
      header: { logo: "/logo.png", menuItems: [] },
      footer: { links: [] }
    },
    pages: [
      {
        name: "首页",
        path: "/",
        purpose: "测试目的"
      }
    ]
  };

  const minimalResult = await testEndpoint('/api/workflow/4-plan-content', {
    method: 'POST',
    body: minimalInput,
    description: '最小必需字段测试',
    validateResponse: (data) => {
      return data.success === true && data.data;
    }
  });
  results.addResult(minimalResult);

  // 测试用例3: 多页面网站
  const multiPageInput = {
    structuredData: {
      companyInfo: {
        name: "多页面公司",
        description: "提供多种服务的公司",
        industry: "综合服务"
      },
      products: [
        { name: "服务1", category: "类别1" },
        { name: "服务2", category: "类别2" }
      ],
      sellingPoints: {
        primary: "综合服务",
        secondary: "专业团队",
        tertiary: "优质体验"
      },
      targetAudience: {
        region: "全国",
        industry: "综合",
        concerns: ["服务质量", "价格"],
        preference: "专业可靠"
      },
      assets: { images: {} },
      seo: {
        mainKeywords: ["综合服务", "专业团队"],
        longTailKeywords: ["企业综合服务", "专业团队服务"]
      }
    },
    designSystem: {
      palette: { primary: "#000000" },
      typography: { font_family_heading: "Arial" },
      spacing: { xs: "4px" }
    },
    globalElements: {
      header: { logo: "/logo.png", menuItems: [] },
      footer: { links: [] }
    },
    pages: [
      { name: "首页", path: "/", purpose: "展示公司概况" },
      { name: "服务", path: "/services", purpose: "详细介绍服务内容" },
      { name: "关于我们", path: "/about", purpose: "公司历史和团队介绍" },
      { name: "联系我们", path: "/contact", purpose: "联系方式和地址信息" }
    ]
  };

  const multiPageResult = await testEndpoint('/api/workflow/4-plan-content', {
    method: 'POST',
    body: multiPageInput,
    description: '多页面网站测试',
    validateResponse: (data) => {
      return data.success === true && 
             data.data.pages.length === 4 &&
             data.data.pages.every(page => page.seo && page.outline);
    }
  });
  results.addResult(multiPageResult);

  // 测试用例4: 缺少必需字段（错误处理测试）
  const missingFieldResult = await testEndpoint('/api/workflow/4-plan-content', {
    method: 'POST',
    body: {},
    description: '缺少必需字段测试',
    expectedStatus: 400,
    validateResponse: (data) => {
      return data.success === false;
    }
  });
  results.addResult(missingFieldResult);

  // 测试用例5: 空页面数组（错误处理测试）
  const emptyPagesInput = {
    structuredData: {
      companyInfo: { name: "测试", description: "测试", industry: "测试" },
      products: [],
      sellingPoints: { primary: "测试", secondary: "测试", tertiary: "测试" },
      targetAudience: { region: "测试", industry: "测试", concerns: [], preference: "测试" },
      assets: { images: {} },
      seo: { mainKeywords: [], longTailKeywords: [] }
    },
    designSystem: { palette: { primary: "#000" }, typography: { font_family_heading: "Arial" }, spacing: { xs: "4px" } },
    globalElements: { header: { logo: "/logo.png", menuItems: [] }, footer: { links: [] } },
    pages: []
  };

  const emptyPagesResult = await testEndpoint('/api/workflow/4-plan-content', {
    method: 'POST',
    body: emptyPagesInput,
    description: '空页面数组测试',
    expectedStatus: 400,
    validateResponse: (data) => {
      return data.success === false;
    }
  });
  results.addResult(emptyPagesResult);

  // 打印测试结果汇总
  results.printSummary();
}

// 运行测试
if (require.main === module) {
  testWorkflowStep4().catch(console.error);
}

module.exports = { testWorkflowStep4 };
