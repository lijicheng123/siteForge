/**
 * Schema统一导出文件
 * 提供所有Schema的集中访问点
 */

// 基础类型
export * from './base';

// 业务实体
export * from './company';
export * from './design';
export * from './website';
export * from './blocks';
export * from './seo';

// 蓝图Schema - 渐进式定义
import { objectSchema, arraySchema } from './base';
import { structuredDataSchema } from './company';
import { designSystemSchema } from './design';
import { globalElementsSchema } from './website';
import { 
  basicPageSchema, 
  contentCompletePageSchema, 
  layoutCompletePageSchema, 
  finalPageSchema 
} from './blocks';

// 基础蓝图Schema - 包含核心业务数据，用于Step1-3
export const baseBlueprintSchema = objectSchema({
  structuredData: structuredDataSchema,
  designSystem: designSystemSchema,
  globalElements: globalElementsSchema,
  pages: arraySchema(basicPageSchema)
}, ['structuredData', 'designSystem', 'globalElements', 'pages']);

// 内容完备蓝图Schema - 包含页面内容策划，用于Step4
export const contentCompleteBlueprintSchema = objectSchema({
  structuredData: structuredDataSchema,
  designSystem: designSystemSchema,
  globalElements: globalElementsSchema,
  pages: arraySchema(contentCompletePageSchema)
}, ['structuredData', 'designSystem', 'globalElements', 'pages']);

// 布局完备蓝图Schema - 包含区块布局，用于Step5
export const layoutCompleteBlueprintSchema = objectSchema({
  structuredData: structuredDataSchema,
  designSystem: designSystemSchema,
  globalElements: globalElementsSchema,
  pages: arraySchema(layoutCompletePageSchema)
}, ['structuredData', 'designSystem', 'globalElements', 'pages']);

// 内容和布局都完备的蓝图Schema - 用于Step6生成HTML
export const contentAndLayoutCompleteBlueprintSchema = objectSchema({
  structuredData: structuredDataSchema,
  designSystem: designSystemSchema,
  globalElements: globalElementsSchema,
  pages: arraySchema(finalPageSchema)
}, ['structuredData', 'designSystem', 'globalElements', 'pages']);

// 常用组合Schema
export const commonSchemas = {
  // 快速访问常用Schema
  company: {
    info: 'companyInfoSchema',
    product: 'productSchema',
    sellingPoints: 'sellingPointsSchema',
    targetAudience: 'targetAudienceSchema'
  },
  design: {
    palette: 'paletteSchema',
    typography: 'typographySchema',
    spacing: 'spacingSchema',
    borderRadius: 'borderRadiusSchema',
    shadow: 'shadowSchema'
  },
  website: {
    basicPage: 'basicPageSchema',
    contentCompletePage: 'contentCompletePageSchema',
    layoutCompletePage: 'layoutCompletePageSchema',
    finalPage: 'finalPageSchema',
    menuItem: 'menuItemSchema',
    globalElements: 'globalElementsSchema'
  },
  blocks: {
    block: 'blockSchema',
    blockFinal: 'blockFinalSchema',
    outlineSection: 'outlineSectionSchema'
  }
};
