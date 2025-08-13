/**
 * 工作流步骤5测试脚本
 * 测试区块布局设计接口
 */

const { testEndpoint, TestResults } = require('./test-utils');

async function testWorkflowStep5() {
  console.log('🎯 开始测试工作流步骤5: 区块布局设计...\n');
  
  const results = new TestResults();

  // 测试用例1: 正常输入 - 完整的蓝图V2和区块库
  const normalInput = {
    blueprintV2: {
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
              sectionName: "英雄区域",
              instruction: "展示公司核心价值主张和主要产品，包含醒目的CTA按钮",
              priority: 1,
              estimatedWords: 200
            },
            {
              sectionName: "产品展示",
              instruction: "展示3-4个核心产品，每个产品包含图片、名称、简短描述和链接",
              priority: 2,
              estimatedWords: 300
            }
          ]
        }
      ]
    },
    blockLibrary: {
      core_blocks: [
        "core/cover",
        "core/heading",
        "core/paragraph",
        "core/columns",
        "core/column",
        "core/button",
        "core/image"
      ],
      custom_blocks: [
        {
          name: "product-card",
          description: "产品展示卡片，包含图片、标题、描述和按钮",
          props: {
            image: "string",
            title: "string",
            description: "string",
            buttonText: "string",
            buttonUrl: "string"
          }
        }
      ]
    }
  };

  const normalResult = await testEndpoint('/api/workflow/5-design-layout', {
    method: 'POST',
    body: normalInput,
    description: '正常输入测试 - 完整蓝图V2和区块库',
    validateResponse: (data) => {
      return data.success === true && 
             data.data && 
             data.data.pages &&
             data.data.pages.every(page => 
               page.outline && 
               Array.isArray(page.outline) &&
               page.outline.every(section => 
                 section.component && 
                 section.level !== undefined &&
                 section.config
               )
             );
    }
  });
  results.addResult(normalResult);

  // 测试用例2: 最小必需字段
  const minimalInput = {
    blueprintV2: {
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
          name: "首页",
          path: "/",
          purpose: "测试目的",
          seo: { title: "测试", description: "测试", primaryKeywords: ["测试"], longTailKeywords: [] },
          outline: [
            {
              sectionName: "测试区域",
              instruction: "测试指令",
              priority: 1,
              estimatedWords: 100
            }
          ]
        }
      ]
    },
    blockLibrary: {
      core_blocks: ["core/heading", "core/paragraph"],
      custom_blocks: []
    }
  };

  const minimalResult = await testEndpoint('/api/workflow/5-design-layout', {
    method: 'POST',
    body: minimalInput,
    description: '最小必需字段测试',
    validateResponse: (data) => {
      return data.success === true && data.data;
    }
  });
  results.addResult(minimalResult);

  // 测试用例3: 复杂页面结构
  const complexInput = {
    blueprintV2: {
      structuredData: {
        companyInfo: { name: "复杂公司", description: "复杂描述", industry: "复杂行业" },
        products: [
          { name: "产品1", category: "类别1" },
          { name: "产品2", category: "类别2" },
          { name: "产品3", category: "类别3" }
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
              sectionName: "区域1",
              instruction: "复杂指令1",
              priority: 1,
              estimatedWords: 100
            },
            {
              sectionName: "区域2",
              instruction: "复杂指令2",
              priority: 2,
              estimatedWords: 150
            },
            {
              sectionName: "区域3",
              instruction: "复杂指令3",
              priority: 3,
              estimatedWords: 200
            }
          ]
        }
      ]
    },
    blockLibrary: {
      core_blocks: [
        "core/cover", "core/heading", "core/paragraph", "core/columns", 
        "core/column", "core/button", "core/image", "core/gallery"
      ],
      custom_blocks: [
        {
          name: "hero-section",
          description: "英雄区域组件",
          props: { title: "string", subtitle: "string", backgroundImage: "string" }
        },
        {
          name: "feature-grid",
          description: "特性网格组件",
          props: { features: "array", columns: "number" }
        }
      ]
    }
  };

  const complexResult = await testEndpoint('/api/workflow/5-design-layout', {
    method: 'POST',
    body: complexInput,
    description: '复杂页面结构测试',
    validateResponse: (data) => {
      return data.success === true && 
             data.data.pages[0].outline.length === 3 &&
             data.data.pages[0].outline.every(section => section.component);
    }
  });
  results.addResult(complexResult);

  // 测试用例4: 缺少必需字段（错误处理测试）
  const missingFieldResult = await testEndpoint('/api/workflow/5-design-layout', {
    method: 'POST',
    body: {},
    description: '缺少必需字段测试',
    expectedStatus: 400,
    validateResponse: (data) => {
      return data.success === false;
    }
  });
  results.addResult(missingFieldResult);

  // 测试用例5: 空区块库（错误处理测试）
  const emptyBlockLibraryInput = {
    blueprintV2: {
      structuredData: { companyInfo: { name: "测试", description: "测试", industry: "测试" }, products: [], sellingPoints: { primary: "测试", secondary: "测试", tertiary: "测试" }, targetAudience: { region: "测试", industry: "测试", concerns: [], preference: "测试" }, assets: { images: {} }, seo: { primaryKeywords: [], longTailKeywords: [] } },
      designSystem: { palette: { primary: "#000" }, typography: { font_family_heading: "Arial" }, spacing: { xs: "4px" } },
      globalElements: { header: { logo: "/logo.png", menuItems: [] }, footer: { links: [] } },
      pages: [{ name: "测试", path: "/", purpose: "测试", seo: { title: "测试", description: "测试", primaryKeywords: ["测试"], longTailKeywords: [] }, outline: [{ sectionName: "测试", instruction: "测试", priority: 1, estimatedWords: 100 }] }]
    },
    blockLibrary: {
      core_blocks: [],
      custom_blocks: []
    }
  };

  const emptyBlockLibraryResult = await testEndpoint('/api/workflow/5-design-layout', {
    method: 'POST',
    body: emptyBlockLibraryInput,
    description: '空区块库测试',
    expectedStatus: 400,
    validateResponse: (data) => {
      return data.success === false;
    }
  });
  results.addResult(emptyBlockLibraryResult);

  // 打印测试结果汇总
  results.printSummary();
}

// 运行测试
if (require.main === module) {
  testWorkflowStep5().catch(console.error);
}

module.exports = { testWorkflowStep5 };
