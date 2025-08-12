/**
 * 区块相关Schema定义
 * 包含古腾堡区块、内容大纲等页面内容结构
 */

import { objectSchema, arraySchema, nameSchema } from './base';

// 内容大纲Schema (版本1)
export const outlineSectionV1Schema = objectSchema({
  sectionName: nameSchema,
  instruction: { type: 'string', minLength: 10, maxLength: 500 },
  priority: { type: 'number', minimum: 1, maximum: 10, default: 5 },
  estimatedWords: { type: 'number', minimum: 50, maximum: 2000 }
}, ['sectionName', 'instruction']);

// 区块Schema - 支持递归结构
export const blockSchema = {
  $id: 'blockSchema',
  type: 'object',
  properties: {
    component: { type: 'string', minLength: 1, maxLength: 100 },
    level: { type: 'number', minimum: 0, maximum: 10, default: 0 },
    config: { type: 'object', additionalProperties: true },
    props: { type: 'object', additionalProperties: true },
    children: {
      type: 'array',
      items: { $ref: 'blockSchema#' },
      minItems: 0
    },
    content: {
      oneOf: [
        { 
          type: 'object', 
          properties: { 
            source: { type: 'string', format: 'uri' },
            alt: { type: 'string', minLength: 1, maxLength: 200 }
          }, 
          required: ['source'] 
        },
        { 
          type: 'object', 
          properties: { 
            text: { type: 'string', minLength: 1, maxLength: 2000 } 
          }, 
          required: ['text'] 
        },
        { 
          type: 'object', 
          properties: { 
            prompt: { type: 'string', minLength: 10, maxLength: 500 } 
          }, 
          required: ['prompt'] 
        }
      ]
    },
    link: {
      type: 'object',
      properties: {
        source: { type: 'string', format: 'uri' },
        target: { type: 'string', enum: ['_self', '_blank', '_parent', '_top'], default: '_self' },
        rel: { type: 'string', enum: ['noopener', 'noreferrer'], default: 'noopener' }
      },
      required: ['source']
    },
    style: objectSchema({
      className: { type: 'string', minLength: 1, maxLength: 200 },
      customCSS: { type: 'string', minLength: 1, maxLength: 1000 }
    })
  },
  required: ['component'],
  additionalProperties: false
};

// 页面Schema (版本2) - 包含SEO和内容大纲
export const updatedPageV1Schema = objectSchema({
  name: nameSchema,
  path: { type: 'string', pattern: '^/[a-z0-9/-]*$', minLength: 1, maxLength: 100 },
  purpose: { type: 'string', minLength: 10, maxLength: 200 },
  seo: objectSchema({
    title: { type: 'string', minLength: 10, maxLength: 70 },
    description: { type: 'string', minLength: 50, maxLength: 160 },
    primaryKeyword: { type: 'string', minLength: 1, maxLength: 50 },
    secondaryKeywords: arraySchema({ type: 'string', minLength: 1, maxLength: 50 })
  }, ['title', 'description', 'primaryKeyword', 'secondaryKeywords']),
  outline: arraySchema(outlineSectionV1Schema)
}, ['name', 'path', 'purpose', 'seo', 'outline']);

// 蓝图版本2 - 包含内容大纲
export const websiteBlueprintV2Schema = objectSchema({
  structuredData: { type: 'object' },
  designSystem: { type: 'object' },
  globalElements: { type: 'object' },
  pages: arraySchema(updatedPageV1Schema)
}, ['structuredData', 'designSystem', 'globalElements', 'pages']);

// 页面Schema (版本3) - 包含结构化区块
export const updatedPageV2Schema = objectSchema({
  name: nameSchema,
  path: { type: 'string', pattern: '^/[a-z0-9/-]*$', minLength: 1, maxLength: 100 },
  purpose: { type: 'string', minLength: 10, maxLength: 200 },
  seo: { type: 'object' },
  outline: arraySchema({ type: 'object' })
}, ['name', 'path', 'purpose', 'seo', 'outline']);

// 蓝图版本3 - 包含结构化区块
export const websiteBlueprintV3Schema = objectSchema({
  structuredData: { type: 'object' },
  designSystem: { type: 'object' },
  globalElements: { type: 'object' },
  pages: arraySchema(updatedPageV2Schema)
}, ['structuredData', 'designSystem', 'globalElements', 'pages']);

// 可用区块库 Schema（用于 Step5 请求）
export const blockLibrarySchema = objectSchema({
  core_blocks: arraySchema({ type: 'string' }),
  custom_blocks: arraySchema(objectSchema({
    name: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string', minLength: 1, maxLength: 500 },
    props: { type: 'object' }
  }, ['name', 'description', 'props']))
}, ['core_blocks', 'custom_blocks']);

// 最终区块Schema - 移除prompt，只保留确定内容
export const blockSchemaFinal = objectSchema({
  component: { type: 'string', minLength: 1, maxLength: 100 },
  level: { type: 'number', minimum: 0, maximum: 10, default: 0 },
  config: { type: 'object', additionalProperties: true },
  props: { type: 'object', additionalProperties: true },
  children: arraySchema({ $ref: 'blockSchemaFinal#' }),
  content: {
    oneOf: [
      objectSchema({
        source: { type: 'string', format: 'uri' },
        alt: { type: 'string', minLength: 1, maxLength: 200 }
      }, ['source']),
      objectSchema({
        text: { type: 'string', minLength: 1, maxLength: 2000 }
      }, ['text'])
    ]
  },
  link: objectSchema({
    source: { type: 'string', format: 'uri' },
    target: { type: 'string', enum: ['_self', '_blank', '_parent', '_top'], default: '_self' },
    rel: { type: 'string', enum: ['noopener', 'noreferrer'], default: 'noopener' }
  }, ['source']),
  style: objectSchema({
    className: { type: 'string', minLength: 1, maxLength: 200 },
    customCSS: { type: 'string', minLength: 1, maxLength: 1000 }
  })
}, ['component']);

// 最终页面Schema
export const updatedPageFinalSchema = objectSchema({
  name: nameSchema,
  path: { type: 'string', pattern: '^/[a-z0-9/-]*$', minLength: 1, maxLength: 100 },
  purpose: { type: 'string', minLength: 10, maxLength: 200 },
  seo: { type: 'object' },
  outline: arraySchema({ type: 'object' })
}, ['name', 'path', 'purpose', 'seo', 'outline']);

// 蓝图版本4 - 最终版本
export const websiteBlueprintV4FinalSchema = objectSchema({
  structuredData: { type: 'object' },
  designSystem: { type: 'object' },
  globalElements: { type: 'object' },
  pages: arraySchema(updatedPageFinalSchema)
}, ['structuredData', 'designSystem', 'globalElements', 'pages']);
