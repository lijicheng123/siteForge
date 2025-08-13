/**
 * 工作流步骤6测试脚本
 * 测试确定性代码生成接口
 */

const { testEndpoint, TestResults } = require('./test-utils');

async function testWorkflowStep6() {
  console.log('⚡ 开始测试工作流步骤6: 确定性代码生成...\n');
  
  const results = new TestResults();

  // 测试用例1: 正常输入 - 完整的蓝图V4
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
      assets: { images: {} },
      seo: {
        primaryKeywords: ["LED照明", "工业照明"],
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
      spacing: { xs: "4px", sm: "8px", md: "16px" }
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
        purpose: "展示公司核心价值主张和主要产品",
        seo: {
          title: "明辉LED照明 - 工业LED照明专业服务",
          description: "专注于工业LED照明解决方案",
                  primaryKeywords: ["工业LED照明"],
        longTailKeywords: ["LED灯具", "节能照明"]
        },
        outline: [
          {
            component: "core/cover",
            level: 0,
            config: {
              align: "full",
              overlayColor: "primary",
              minHeight: 600
            },
            props: {
              backgroundType: "image",
              hasParallax: true
            },
            content: {
              prompt: "为明辉LED照明的英雄区域创建吸引人的标题和描述，突出工业LED照明领域的专业性和核心价值"
            },
            children: [
              {
                component: "core/heading",
                level: 1,
                config: {
                  level: 1,
                  textAlign: "center",
                  fontSize: "large"
                },
                props: {
                  content: "明辉LED照明 - 工业照明专家",
                  className: "hero-title"
                },
                content: {
                  prompt: "创建明辉LED照明的主标题，体现工业LED照明专业服务"
                }
              },
              {
                component: "core/paragraph",
                level: 1,
                config: {
                  textAlign: "center",
                  fontSize: "medium"
                },
                props: {
                  content: "专注于工业LED照明解决方案，为制造业企业提供节能、可靠、智能的照明产品",
                  className: "hero-description"
                },
                content: {
                  prompt: "创建明辉LED照明的描述文案，突出节能、可靠、智能等核心优势"
                }
              }
            ]
          }
        ]
      }
    ]
  };

  const normalResult = await testEndpoint('/api/workflow/6-generate-html', {
    method: 'POST',
    body: normalInput,
    description: '正常输入测试 - 完整蓝图V4',
    validateResponse: (data) => {
      return data.success === true && 
             data.data && 
             data.data.html && 
             typeof data.data.html === 'string' &&
             data.data.html.includes('<!DOCTYPE html>') &&
             data.data.html.includes('<!-- wp:cover') &&
             data.data.html.includes('<!-- wp:heading') &&
             data.data.html.includes('<!-- wp:paragraph');
    }
  });
  results.addResult(normalResult);

  // 测试用例2: 最小必需字段
  const minimalInput = {
    structuredData: {
      companyInfo: { name: "测试公司", description: "测试描述", industry: "测试行业" },
      products: [],
      sellingPoints: { primary: "测试", secondary: "测试", tertiary: "测试" },
      targetAudience: { region: "测试", industry: "测试", concerns: [], preference: "测试" },
      assets: { images: {} },
      seo: { primaryKeywords: [], longTailKeywords: [] }
    },
    designSystem: { palette: { primary: "#000" }, typography: { font_family_heading: "Arial" }, spacing: { xs: "4px" } },
    globalElements: { header: { logo: "/logo.png", menuItems: [] }, footer: { links: [] } },
    pages: [
      {
        name: "测试页面",
        path: "/test",
        purpose: "测试目的",
        seo: { title: "测试", description: "测试", primaryKeywords: ["测试"], longTailKeywords: [] },
        outline: [
          {
            component: "core/heading",
            level: 0,
            config: { level: 1, textAlign: "center" },
            props: { content: "测试标题" },
            content: { prompt: "测试提示" }
          }
        ]
      }
    ]
  };

  const minimalResult = await testEndpoint('/api/workflow/6-generate-html', {
    method: 'POST',
    body: minimalInput,
    description: '最小必需字段测试',
    validateResponse: (data) => {
      return data.success === true && 
             data.data.html && 
             data.data.html.includes('<!-- wp:heading');
    }
  });
  results.addResult(minimalResult);

  // 测试用例3: 复杂页面结构
  const complexInput = {
    structuredData: {
      companyInfo: { name: "复杂公司", description: "复杂描述", industry: "复杂行业" },
      products: [
        { name: "产品1", category: "类别1" },
        { name: "产品2", category: "类别2" }
      ],
      sellingPoints: { primary: "复杂", secondary: "复杂", tertiary: "复杂" },
      targetAudience: { region: "复杂", industry: "复杂", concerns: [], preference: "复杂" },
      assets: { images: {} },
      seo: { primaryKeywords: [], longTailKeywords: [] }
    },
    designSystem: { palette: { primary: "#000" }, typography: { font_family_heading: "Arial" }, spacing: { xs: "4px" } },
    globalElements: { header: { logo: "/logo.png", menuItems: [] }, footer: { links: [] } },
    pages: [
      {
        name: "复杂页面",
        path: "/complex",
        purpose: "复杂目的",
        seo: { title: "复杂", description: "复杂", primaryKeywords: ["复杂"], longTailKeywords: [] },
        outline: [
          {
            component: "core/cover",
            level: 0,
            config: { align: "full", minHeight: 500 },
            props: { backgroundType: "image" },
            content: { prompt: "测试提示1" },
            children: [
              {
                component: "core/heading",
                level: 1,
                config: { level: 1, textAlign: "center" },
                props: { content: "复杂标题" },
                content: { prompt: "测试提示2" }
              }
            ]
          },
          {
            component: "core/columns",
            level: 0,
            config: { columns: 2 },
            props: {},
            content: { prompt: "测试提示3" },
            children: [
              {
                component: "core/column",
                level: 1,
                config: { width: "50%" },
                props: {},
                content: { prompt: "测试提示4" },
                children: [
                  {
                    component: "core/paragraph",
                    level: 2,
                    config: { textAlign: "left" },
                    props: { content: "左侧内容" },
                    content: { prompt: "测试提示5" }
                  }
                ]
              },
              {
                component: "core/column",
                level: 1,
                config: { width: "50%" },
                props: {},
                content: { prompt: "测试提示6" },
                children: [
                  {
                    component: "core/paragraph",
                    level: 2,
                    config: { textAlign: "left" },
                    props: { content: "右侧内容" },
                    content: { prompt: "测试提示7" }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const complexResult = await testEndpoint('/api/workflow/6-generate-html', {
    method: 'POST',
    body: complexInput,
    description: '复杂页面结构测试',
    validateResponse: (data) => {
      return data.success === true && 
             data.data.html && 
             data.data.html.includes('<!-- wp:cover') &&
             data.data.html.includes('<!-- wp:columns') &&
             data.data.html.includes('<!-- wp:column');
    }
  });
  results.addResult(complexResult);

  // 测试用例4: 缺少必需字段（错误处理测试）
  const missingFieldResult = await testEndpoint('/api/workflow/6-generate-html', {
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
    structuredData: { companyInfo: { name: "测试", description: "测试", industry: "测试" }, products: [], sellingPoints: { primary: "测试", secondary: "测试", tertiary: "测试" }, targetAudience: { region: "测试", industry: "测试", concerns: [], preference: "测试" }, assets: { images: {} }, seo: { mainKeywords: [], longTailKeywords: [] } },
    designSystem: { palette: { primary: "#000" }, typography: { font_family_heading: "Arial" }, spacing: { xs: "4px" } },
    globalElements: { header: { logo: "/logo.png", menuItems: [] }, footer: { links: [] } },
    pages: []
  };

  const emptyPagesResult = await testEndpoint('/api/workflow/6-generate-html', {
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
  testWorkflowStep6().catch(console.error);
}

module.exports = { testWorkflowStep6 };
