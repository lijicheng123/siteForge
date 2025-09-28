/**
 * 页面相关Schema定义
 * 包含页面结构、内容大纲等页面相关配置
 */

import { objectSchema, arraySchema, nameSchema, pagePathSchema } from './base';
import { seoDetailedSchema } from './seo';
import { outlineSectionSchema, outlineBlockSchema } from './blocks';

// 基础页面Schema - 只包含基本信息
export const basicPageSchema = objectSchema({
  name: nameSchema,
  path: pagePathSchema,
  purpose: { type: 'string', minLength: 10, maxLength: 200 }
}, ['name', 'path', 'purpose']);

// 内容完备页面Schema - 包含SEO和内容大纲
export const instructionCompletePageSchema = objectSchema({
  name: nameSchema,
  path: pagePathSchema,
  purpose: { type: 'string', minLength: 10, maxLength: 200 },
  seo: seoDetailedSchema,
  outline: arraySchema(outlineSectionSchema)
}, ['name', 'path', 'purpose', 'seo', 'outline']);

// 第五步的出参、第六步的入参：布局完备页面Schema - 包含区块布局
export const layoutCompletePageSchema = objectSchema({
  name: nameSchema,
  path: pagePathSchema,
  purpose: { type: 'string', minLength: 10, maxLength: 200 },
  seo: seoDetailedSchema,
  outline: arraySchema(outlineBlockSchema)
}, ['name', 'path', 'purpose', 'seo', 'outline']);
