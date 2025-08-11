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
    page: 'pageSchema',
    menuItem: 'menuItemSchema',
    globalElements: 'globalElementsSchema'
  },
  blocks: {
    block: 'blockSchema',
    blockFinal: 'blockSchemaFinal',
    outlineSection: 'outlineSectionV1Schema'
  }
};

// Schema版本管理
export const schemaVersions = {
  v1: 'websiteBlueprintV1Schema',
  v2: 'websiteBlueprintV2Schema', 
  v3: 'websiteBlueprintV3Schema',
  v4: 'websiteBlueprintV4FinalSchema'
};
