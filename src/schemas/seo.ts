/**
 * SEO 相关 Schema 定义
 * 将常见的 SEO 结构集中管理，避免在多个文件中重复定义
 */

import { objectSchema, arraySchema } from './base';

// 公共的 keywords 字段定义
const keywordsSchema = {
  primaryKeywords: arraySchema({ type: 'string', minLength: 1, maxLength: 50 }),
  longTailKeywords: arraySchema({ type: 'string', minLength: 3, maxLength: 100 })
};

// 通用 SEO 元信息（用于网站页面 meta）
export const seoMetaSchema = objectSchema({
  title: { type: 'string', minLength: 10, maxLength: 70 },
  description: { type: 'string', minLength: 50, maxLength: 160 },
  keywords: arraySchema({ type: 'string', minLength: 1, maxLength: 50 })
}, ['title', 'description']);

// 详细 SEO 信息（用于内容策划阶段的页面对象）
export const seoDetailedSchema = objectSchema({
  title: { type: 'string', minLength: 10, maxLength: 70 },
  description: { type: 'string', minLength: 50, maxLength: 160 },
  ...keywordsSchema
}, ['title', 'description', 'primaryKeywords', 'longTailKeywords']);

// 整个网站的 SEO 信息（用于网站整体SEO策略）
export const websiteSeoSchema = objectSchema({
  ...keywordsSchema
}, ['primaryKeywords', 'longTailKeywords']);

// 页面级别 SEO 信息（用于具体页面的SEO）
export const pageSeoSchema = objectSchema({
  title: { type: 'string', minLength: 10, maxLength: 70 },
  description: { type: 'string', minLength: 50, maxLength: 160 },
  ...keywordsSchema
}, ['title', 'description', 'primaryKeywords', 'longTailKeywords']);


