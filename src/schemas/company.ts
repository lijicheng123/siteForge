/**
 * 公司相关Schema定义
 * 包含公司信息、产品、目标受众等业务实体
 */

import { objectSchema, arraySchema, nameSchema, descriptionSchema } from './base';

// 公司基本信息
export const companyInfoSchema = objectSchema({
  name: nameSchema,
  description: descriptionSchema,
  industry: { type: 'string', minLength: 1, maxLength: 100 }
}, ['name', 'description', 'industry']);

// 产品信息
export const productSchema = objectSchema({
  name: nameSchema,
  slug: { type: 'string', pattern: '^[a-z0-9-]+$', minLength: 1, maxLength: 100 },
  category: { type: 'string', minLength: 1, maxLength: 100 },
  short_description: { type: 'string', minLength: 10, maxLength: 200 },
  keywords: arraySchema({ type: 'string', minLength: 1, maxLength: 50 })
}, ['name', 'slug', 'category', 'short_description', 'keywords']);

// 卖点信息
export const sellingPointsSchema = objectSchema({
  primary: { type: 'string', minLength: 10, maxLength: 200 },
  secondary: { type: 'string', minLength: 10, maxLength: 200 },
  tertiary: { type: 'string', minLength: 10, maxLength: 200 }
}, ['primary', 'secondary', 'tertiary']);

// 目标受众
export const targetAudienceSchema = objectSchema({
  region: { type: 'string', minLength: 1, maxLength: 100 },
  industry: { type: 'string', minLength: 1, maxLength: 100 },
  concerns: arraySchema({ type: 'string', minLength: 5, maxLength: 200 }),
  preference: { type: 'string', minLength: 10, maxLength: 200 }
}, ['region', 'industry', 'concerns', 'preference']);

// 资产信息
export const assetsSchema = objectSchema({
  images: objectSchema({
    logo: { type: 'string', format: 'uri' },
    hero: { type: 'string', format: 'uri' },
    product: { type: 'string', format: 'uri' }
  }, [])  // 移除logo的必需性
}, ['images']);

// SEO信息
export const seoSchema = objectSchema({
  mainKeywords: arraySchema({ type: 'string', minLength: 1, maxLength: 50 }),
  longTailKeywords: arraySchema({ type: 'string', minLength: 3, maxLength: 100 })
}, ['mainKeywords', 'longTailKeywords']);

// 结构化数据 - 整合所有公司相关信息
export const structuredDataSchema = objectSchema({
  companyInfo: companyInfoSchema,
  products: arraySchema(productSchema),
  sellingPoints: sellingPointsSchema,
  targetAudience: targetAudienceSchema,
  assets: assetsSchema,
  seo: seoSchema
}, ['companyInfo', 'products', 'sellingPoints', 'targetAudience', 'assets', 'seo']);
