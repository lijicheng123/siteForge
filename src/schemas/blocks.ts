/**
 * 区块相关Schema定义
 * 包含古腾堡区块、内容大纲等页面内容结构
 */

import { objectSchema, arraySchema, nameSchema, pagePathSchema } from './base';
import { seoDetailedSchema } from './seo';

// 内容大纲Schema
export const outlineSectionSchema = objectSchema({
  sectionName: nameSchema,
  instruction: { type: 'string', minLength: 10, maxLength: 500 },
  priority: { type: 'number', minimum: 1, maximum: 10, default: 5 },
  estimatedWords: { type: 'number', minimum: 50, maximum: 2000 }
}, ['sectionName', 'instruction']);

// 基础区块Schema - 支持一层嵌套，包含prompt字段
export const blockSchema = {
  type: 'object',
  properties: {
    component: { type: 'string', minLength: 1, maxLength: 100 },
    level: { type: 'number', minimum: 0, maximum: 10, default: 0 },
    config: { type: 'object', additionalProperties: true },
    props: { type: 'object', additionalProperties: true },
    children: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          component: { type: 'string', minLength: 1, maxLength: 100 },
          level: { type: 'number', minimum: 0, maximum: 10, default: 0 },
          config: { type: 'object', additionalProperties: true },
          props: { type: 'object', additionalProperties: true },
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
          style: {
            type: 'object',
            properties: {
              className: { type: 'string', minLength: 1, maxLength: 200 },
              customCSS: { type: 'string', minLength: 1, maxLength: 1000 }
            }
          }
        },
        required: ['component'],
        additionalProperties: false
      },
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
    style: {
      type: 'object',
      properties: {
        className: { type: 'string', minLength: 1, maxLength: 200 },
        customCSS: { type: 'string', minLength: 1, maxLength: 1000 }
      }
    }
  },
  required: ['component'],
  additionalProperties: false
};

// 最终区块Schema - 移除prompt，只保留确定内容，支持一层嵌套
export const blockFinalSchema = {
  type: 'object',
  properties: {
    component: { type: 'string', minLength: 1, maxLength: 100 },
    level: { type: 'number', minimum: 0, maximum: 10, default: 0 },
    config: { type: 'object', additionalProperties: true },
    props: { type: 'object', additionalProperties: true },
    children: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          component: { type: 'string', minLength: 1, maxLength: 100 },
          level: { type: 'number', minimum: 0, maximum: 10, default: 0 },
          config: { type: 'object', additionalProperties: true },
          props: { type: 'object', additionalProperties: true },
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
          style: {
            type: 'object',
            properties: {
              className: { type: 'string', minLength: 1, maxLength: 200 },
              customCSS: { type: 'string', minLength: 1, maxLength: 1000 }
            }
          }
        },
        required: ['component'],
        additionalProperties: false
      },
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
    style: {
      type: 'object',
      properties: {
        className: { type: 'string', minLength: 1, maxLength: 200 },
        customCSS: { type: 'string', minLength: 1, maxLength: 1000 }
      }
    }
  },
  required: ['component'],
  additionalProperties: false
};

// 基础页面Schema - 只包含基本信息
export const basicPageSchema = objectSchema({
  name: nameSchema,
  path: pagePathSchema,
  purpose: { type: 'string', minLength: 10, maxLength: 200 }
}, ['name', 'path', 'purpose']);

// 内容完备页面Schema - 包含SEO和内容大纲
export const contentCompletePageSchema = objectSchema({
  name: nameSchema,
  path: pagePathSchema,
  purpose: { type: 'string', minLength: 10, maxLength: 200 },
  seo: seoDetailedSchema,
  outline: arraySchema(outlineSectionSchema)
}, ['name', 'path', 'purpose', 'seo', 'outline']);

// 布局完备页面Schema - 包含区块布局
export const layoutCompletePageSchema = objectSchema({
  name: nameSchema,
  path: pagePathSchema,
  purpose: { type: 'string', minLength: 10, maxLength: 200 },
  seo: seoDetailedSchema,
  outline: arraySchema(blockSchema)
}, ['name', 'path', 'purpose', 'seo', 'outline']);

// 最终页面Schema - 包含最终区块布局
export const finalPageSchema = objectSchema({
  name: nameSchema,
  path: pagePathSchema,
  purpose: { type: 'string', minLength: 10, maxLength: 200 },
  seo: seoDetailedSchema,
  outline: arraySchema(blockFinalSchema)
}, ['name', 'path', 'purpose', 'seo', 'outline']);


