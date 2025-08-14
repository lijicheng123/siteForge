/**
 * 工作流步骤Schema统一定义
 * 包含所有步骤的请求和响应Schema
 */

// Step1: 需求解析与结构化
export const step1RequestSchema = {
  type: 'object',
  properties: {
    rawInput: { 
      type: 'string', 
      minLength: 10,
      maxLength: 5000,
      description: '用户的原始纯文本需求描述'
    }
  },
  required: ['rawInput'],
  additionalProperties: false
};

// Step2: 品牌视觉设计
export const step2RequestSchema = {
  type: 'object',
  properties: {
    industry: { 
      type: 'string', 
      minLength: 1,
      maxLength: 100,
      description: '公司所属行业，例如：工业LED照明'
    },
    preference: { 
      type: 'string', 
      minLength: 10,
      maxLength: 500,
      description: '目标客户的设计偏好，例如：简洁明了的设计'
    },
    brandPersonality: {
      type: 'string',
      enum: ['professional', 'creative', 'friendly', 'luxury', 'minimalist', 'bold'],
      description: '品牌个性特征'
    },
    targetMarket: {
      type: 'string',
      enum: ['B2B', 'B2C', 'Enterprise', 'SMB'],
      description: '目标市场类型',
      default: 'B2B'
    }
  },
  required: ['industry', 'preference'],
  additionalProperties: false
};

// Step3: 网站信息架构
export const step3RequestSchema = {
  type: 'object',
  properties: {
    companyName: { 
      type: 'string', 
      minLength: 1,
      maxLength: 100,
      description: '公司名称'
    },
    products: { 
      type: 'array', 
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          category: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', minLength: 10, maxLength: 500 }
        },
        required: ['name', 'category']
      }
    },
    industry: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: '公司所属行业'
    },
    targetMarket: {
      type: 'string',
      enum: ['B2B', 'B2C', 'Enterprise', 'SMB'],
      description: '目标市场类型'
    }
  },
  required: ['companyName', 'products'],
  additionalProperties: false
};

// Step4: 页面内容策划 - 输入基础蓝图，输出内容完备蓝图
export const step4RequestSchema = {
  type: 'object',
  properties: {
    structuredData: {
      type: 'object',
      description: '结构化数据'
    },
    designSystem: {
      type: 'object',
      description: '设计系统'
    },
    globalElements: {
      type: 'object',
      description: '全局元素'
    },
    pages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          path: { type: 'string' },
          purpose: { type: 'string' }
        },
        required: ['name', 'path', 'purpose']
      }
    }
  },
  required: ['structuredData', 'designSystem', 'globalElements', 'pages'],
  additionalProperties: false
};

// Step4响应Schema - 内容完备蓝图
export const step4ResponseSchema = {
  type: 'object',
  properties: {
    structuredData: {
      type: 'object',
      description: '结构化数据'
    },
    designSystem: {
      type: 'object',
      description: '设计系统'
    },
    globalElements: {
      type: 'object',
      description: '全局元素'
    },
    pages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          path: { type: 'string' },
          purpose: { type: 'string' },
          seo: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              primaryKeywords: { type: 'array', items: { type: 'string' } },
              longTailKeywords: { type: 'array', items: { type: 'string' } }
            },
            required: ['title', 'description', 'primaryKeywords', 'longTailKeywords']
          },
          outline: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                sectionName: { type: 'string' },
                instruction: { type: 'string' },
                priority: { type: 'number' },
                estimatedWords: { type: 'number' }
              },
              required: ['sectionName', 'instruction']
            }
          }
        },
        required: ['name', 'path', 'purpose', 'seo', 'outline']
      }
    }
  },
  required: ['structuredData', 'designSystem', 'globalElements', 'pages'],
  additionalProperties: false
};

// Step5: 区块布局设计 - 输入内容完备蓝图，输出布局完备蓝图
export const step5RequestSchema = {
  type: 'object',
  properties: {
    blueprint: {
      type: 'object',
      description: '内容完备蓝图'
    },
    blockLibrary: {
      type: 'object',
      properties: {
        core_blocks: {
          type: 'array',
          items: { type: 'string' },
          description: '核心区块列表'
        },
        custom_blocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              props: { type: 'object' }
            },
            required: ['name', 'description']
          },
          description: '自定义区块定义'
        }
      },
      required: ['core_blocks', 'custom_blocks'],
      additionalProperties: false
    }
  },
  required: ['blueprint', 'blockLibrary'],
  additionalProperties: false
};

// Step5响应Schema - 布局完备蓝图
export const step5ResponseSchema = {
  type: 'object',
  properties: {
    structuredData: {
      type: 'object',
      description: '结构化数据'
    },
    designSystem: {
      type: 'object',
      description: '设计系统'
    },
    globalElements: {
      type: 'object',
      description: '全局元素'
    },
    pages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          path: { type: 'string' },
          purpose: { type: 'string' },
          seo: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              primaryKeywords: { type: 'array', items: { type: 'string' } },
              longTailKeywords: { type: 'array', items: { type: 'string' } }
            },
            required: ['title', 'description', 'primaryKeywords', 'longTailKeywords']
          },
          outline: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                component: { type: 'string' },
                level: { type: 'number' },
                config: { type: 'object' },
                props: { type: 'object' },
                children: { type: 'array' },
                content: { type: 'object' },
                link: { type: 'object' },
                style: { type: 'object' }
              },
              required: ['component']
            }
          }
        },
        required: ['name', 'path', 'purpose', 'seo', 'outline']
      }
    }
  },
  required: ['structuredData', 'designSystem', 'globalElements', 'pages'],
  additionalProperties: false
};

// Step6: 确定性代码生成 - 输入布局完备蓝图，输出最终蓝图
export const step6RequestSchema = {
  type: 'object',
  properties: {
    structuredData: {
      type: 'object',
      description: '结构化数据'
    },
    designSystem: {
      type: 'object',
      description: '设计系统'
    },
    globalElements: {
      type: 'object',
      description: '全局元素'
    },
    pages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          path: { type: 'string' },
          purpose: { type: 'string' },
          seo: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              primaryKeywords: { type: 'array', items: { type: 'string' } },
              longTailKeywords: { type: 'array', items: { type: 'string' } }
            },
            required: ['title', 'description', 'primaryKeywords', 'longTailKeywords']
          },
          outline: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                component: { type: 'string' },
                level: { type: 'number' },
                config: { type: 'object' },
                props: { type: 'object' },
                children: { type: 'array' },
                content: { type: 'object' },
                link: { type: 'object' },
                style: { type: 'object' }
              },
              required: ['component']
            }
          }
        },
        required: ['name', 'path', 'purpose', 'seo', 'outline']
      }
    }
  },
  required: ['structuredData', 'designSystem', 'globalElements', 'pages'],
  additionalProperties: false
};

// Step6响应Schema - 最终蓝图
export const step6ResponseSchema = {
  type: 'object',
  properties: {
    structuredData: {
      type: 'object',
      description: '结构化数据'
    },
    designSystem: {
      type: 'object',
      description: '设计系统'
    },
    globalElements: {
      type: 'object',
      description: '全局元素'
    },
    pages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          path: { type: 'string' },
          purpose: { type: 'string' },
          seo: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              primaryKeywords: { type: 'array', items: { type: 'string' } },
              longTailKeywords: { type: 'array', items: { type: 'string' } }
            },
            required: ['title', 'description', 'primaryKeywords', 'longTailKeywords']
          },
          outline: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                component: { type: 'string' },
                level: { type: 'number' },
                config: { type: 'object' },
                props: { type: 'object' },
                children: { type: 'array' },
                content: { type: 'object' },
                link: { type: 'object' },
                style: { type: 'object' }
              },
              required: ['component']
            }
          }
        },
        required: ['name', 'path', 'purpose', 'seo', 'outline']
      }
    }
  },
  required: ['structuredData', 'designSystem', 'globalElements', 'pages'],
  additionalProperties: false
};

// 完整工作流请求Schema
export const completeWorkflowRequestSchema = {
  type: 'object',
  properties: {
    rawInput: { 
      type: 'string', 
      minLength: 10,
      maxLength: 5000,
      description: '用户的原始纯文本需求描述'
    },
    options: {
      type: 'object',
      properties: {
        brandPersonality: {
          type: 'string',
          enum: ['professional', 'creative', 'friendly', 'luxury', 'minimalist', 'bold'],
          description: '品牌个性特征'
        },
        targetMarket: {
          type: 'string',
          enum: ['B2B', 'B2C', 'Enterprise', 'SMB'],
          description: '目标市场类型'
        },
        customBlocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              props: { type: 'object' }
            },
            required: ['name', 'description']
          },
          description: '自定义区块定义'
        }
      },
      additionalProperties: false
    }
  },
  required: ['rawInput'],
  additionalProperties: false
};

// TypeScript类型定义
export type Step1Request = { rawInput: string };

export type Step2Request = {
  industry: string;
  preference: string;
  brandPersonality?: string;
  targetMarket?: string;
};

export type Step3Request = {
  companyName: string;
  products: Array<{ name: string; category: string; description?: string }>;
  industry?: string;
  targetMarket?: string;
};

export type Step4Request = {
  structuredData: any;
  designSystem: any;
  globalElements: any;
  pages: Array<{
    name: string;
    path: string;
    purpose: string;
  }>;
};

export type Step4Response = {
  structuredData: any;
  designSystem: any;
  globalElements: any;
  pages: Array<{
    name: string;
    path: string;
    purpose: string;
    seo: {
      title: string;
      description: string;
      primaryKeywords: string[];
      longTailKeywords: string[];
    };
    outline: Array<{
      sectionName: string;
      instruction: string;
      priority?: number;
      estimatedWords?: number;
    }>;
  }>;
};

export type Step5Request = {
  blueprint: any;
  blockLibrary: {
    core_blocks: string[];
    custom_blocks: Array<{ name: string; description: string; props: any }>;
  };
};

export type Step5Response = {
  structuredData: any;
  designSystem: any;
  globalElements: any;
  pages: Array<{
    name: string;
    path: string;
    purpose: string;
    seo: {
      title: string;
      description: string;
      primaryKeywords: string[];
      longTailKeywords: string[];
    };
    outline: Array<{
      component: string;
      level?: number;
      config?: any;
      props?: any;
      children?: any[];
      content?: any;
      link?: any;
      style?: any;
    }>;
  }>;
};

export type Step6Request = {
  structuredData: any;
  designSystem: any;
  globalElements: any;
  pages: Array<{
    name: string;
    path: string;
    purpose: string;
    seo: {
      title: string;
      description: string;
      primaryKeywords: string[];
      longTailKeywords: string[];
    };
    outline: Array<{
      component: string;
      level?: number;
      config?: any;
      props?: any;
      children?: any[];
      content?: any;
      link?: any;
      style?: any;
    }>;
  }>;
};

export type Step6Response = {
  structuredData: any;
  designSystem: any;
  globalElements: any;
  pages: Array<{
    name: string;
    path: string;
    purpose: string;
    seo: {
      title: string;
      description: string;
      primaryKeywords: string[];
      longTailKeywords: string[];
    };
    outline: Array<{
      component: string;
      level?: number;
      config?: any;
      props?: any;
      children?: any[];
      content?: any;
      link?: any;
      style?: any;
    }>;
  }>;
};

export type CompleteWorkflowRequest = {
  rawInput: string;
  options?: {
    brandPersonality?: string;
    targetMarket?: string;
    customBlocks?: Array<{ name: string; description: string; props: any }>;
  };
};
