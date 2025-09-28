/**
 * 工作流响应Schema定义
 * 包含各个步骤的响应数据结构和蓝图Schema
 */

import { objectSchema, arraySchema, nameSchema, pagePathSchema, responseSchema } from './base';
import { websiteSeoSchema, seoMetaSchema } from './seo';

import { 
  companyInfoSchema,
  productSchema,
  sellingPointsSchema,
  targetAudienceSchema,
  assetsSchema
} from './company';
import { 
  paletteSchema,
  typographySchema
} from './design';
import { 
  globalElementsSchema,
} from './website';
import { 
  basicPageSchema, 
  instructionCompletePageSchema, 
  layoutCompletePageSchema, 
} from './pages';

/**
 * 响应约束Schema
 * 【出参】第一步：获取结构化数据 - 整合所有公司相关信息 - 用于Step1
 */
export const structuredDataSchema = objectSchema({
  companyInfo: companyInfoSchema,
  products: arraySchema(productSchema),
  sellingPoints: sellingPointsSchema,
  targetAudience: targetAudienceSchema,
  assets: assetsSchema,
  seo: websiteSeoSchema
}, ['companyInfo', 'products', 'sellingPoints', 'targetAudience', 'assets', 'seo']);

// 【出参】第二步：获取设计系统主题Schema - 用于Step2
export const designSystemSchema = objectSchema({
  palette: paletteSchema,
  typography: typographySchema,
}, ['palette', 'typography']);

/**
 * 【出参】第三步：获取网站架构Schema - 用于Step3
 */
export const websiteArchitectureSchema = objectSchema({
  globalElements: globalElementsSchema,
  pages: arraySchema(objectSchema({
    name: nameSchema,
    path: pagePathSchema,
    purpose: { type: 'string', minLength: 10, maxLength: 200 },
    meta: seoMetaSchema
  }, ['name', 'path', 'purpose']))
}, ['globalElements', 'pages']);

// 【出参】内容完备蓝图Schema - 包含页面内容策划，用于Step4
export const instructionCompleteBlueprintSchema = objectSchema({
  globalElements: globalElementsSchema,
  pages: arraySchema(instructionCompletePageSchema)
}, ['globalElements', 'pages']);

// 布局完备蓝图Schema - 包含区块布局，用于Step5
export const layoutCompleteBlueprintSchema = objectSchema({
  structuredData: structuredDataSchema,
  designSystem: designSystemSchema,
  globalElements: globalElementsSchema,
  pages: arraySchema(layoutCompletePageSchema)
}, ['structuredData', 'designSystem', 'globalElements', 'pages']);

/**
 * Step5b: 文案生成相关Schema
 * 用于批量生成网站文案内容
 */

// 文案生成请求Schema
export const contentGenerationRequestSchema = objectSchema({
  context: objectSchema({
    companyInfo: objectSchema({
      name: { type: 'string', minLength: 1, maxLength: 100 },
      industry: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', minLength: 1, maxLength: 1000 }
    }, ['name', 'industry']),
    targetAudience: objectSchema({
      region: { type: 'string', minLength: 1, maxLength: 100 },
      industry: { type: 'string', minLength: 1, maxLength: 100 },
      concerns: arraySchema({ type: 'string', minLength: 5, maxLength: 200 })
    }, ['region', 'industry']),
    designSystem: objectSchema({
      palette: paletteSchema,
      typography: typographySchema
    }, [])
  }, ['companyInfo', 'targetAudience']),
  tasks: {
    type: 'object',
    description: "Key-Value对象，Key是唯一任务ID，Value是具体的文案生成指令",
    patternProperties: {
      '^.+$': { type: 'string' }
    },
    additionalProperties: false,
    minProperties: 1
  }
}, ['context', 'tasks']);

// 文案生成响应Schema
export const contentGenerationResponseSchema = responseSchema({
  type: 'object',
  description: "Key-Value对象，Key是任务ID，Value是AI生成的文案",
  patternProperties: {
    '^.+$': { type: 'string' }
  },
  additionalProperties: false,
});
