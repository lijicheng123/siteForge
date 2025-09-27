/**
 * 区块相关Schema定义
 * 包含古腾堡区块、内容大纲等页面内容结构
 */

import { objectSchema, arraySchema, nameSchema, pagePathSchema } from './base';
import { seoDetailedSchema } from './seo';

// 基础区块Schema - 支持一层嵌套，包含prompt字段
export const blockSchema = {
  "title": "Final WordPress Block Structure (3-Level Depth)",
  "description": "为WordPress区块编辑器定义的、最多嵌套3层的最终版JSON Schema。此版本不包含$ref等引用关键字，并增强了对blockName格式的验证。",
  "type": "object",
  "properties": {
    "sectionName": {
      "type": "string",
      "description": "区块所属的section名称。",
    },
      "blockName": {
        "type": "string",
        "description": "区块的唯一名称, 必须遵循 'namespace/block-name' 格式。",
        "pattern": "^[a-z0-9\\-]+/[a-z0-9\\-]+$"
      },
      "attributes": {
        "type": "object",
        "description": "区块属性的键值对集合，结构由具体区块决定。",
        "additionalProperties": true
      },
      "innerBlocks": {
        "type": "array",
        "description": "第2层嵌套 (Nesting Level 2)",
        "items": {
          "description": "第2层区块对象 (Level 2 Block Object)",
          "type": "object",
          "properties": {
            "blockName": {
              "type": "string",
              "description": "区块的唯一名称, 必须遵循 'namespace/block-name' 格式。",
              "pattern": "^[a-z0-9\\-]+/[a-z0-9\\-]+$"
            },
            "attributes": {
              "type": "object",
              "additionalProperties": true
            },
            "innerBlocks": {
              "type": "array",
              "description": "第3层嵌套 (Nesting Level 3)",
              "items": {
                "description": "第3层区块对象 (Level 3 Block Object)",
                "type": "object",
                "properties": {
                  "blockName": {
                    "type": "string",
                    "description": "区块的唯一名称, 必须遵循 'namespace/block-name' 格式。",
                    "pattern": "^[a-z0-9\\-]+/[a-z0-9\\-]+$"
                  },
                  "attributes": {
                    "type": "object",
                    "additionalProperties": true
                  }
                },
                "required": [
                  "blockName",
                  "attributes"
                ]
              }
            }
          },
          "required": [
            "blockName",
            "attributes"
          ]
        }
      }
    },
  "required": [
      "blockName",
      "attributes"
    ]
}

//内容规划大纲协议（规划内容）
export const outlineSectionSchema = objectSchema({
  sectionName: nameSchema,
  instruction: { type: 'string', minLength: 10, maxLength: 500 },
  estimatedWords: { type: 'number', minimum: 50, maximum: 2000 }
}, ['sectionName', 'instruction']);

// 布局规划大纲协议（根据内容规划布局及文案）
export const outlineBlockSchema = objectSchema({
  sectionName: nameSchema,
  blockName: { type: 'string', minLength: 1, maxLength: 100 },
  attributes: { type: 'object', additionalProperties: true },
  innerBlocks: { type: 'array', items: blockSchema },
}, ['sectionName', 'blockName', 'attributes']);


// 页面相关Schema已移动到 pages.ts 文件中

