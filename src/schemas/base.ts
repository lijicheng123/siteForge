/**
 * 基础类型Schema定义
 * 提供通用的验证规则和基础类型
 */

// 颜色值验证 - 支持6位和8位十六进制
export const colorSchema = {
  type: 'string',
  pattern: '^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$',
  description: '十六进制颜色值，支持6位或8位格式'
};



// 通用名称Schema
export const nameSchema = {
  type: 'string',
  minLength: 1,
  maxLength: 100,
  pattern: '^[a-zA-Z0-9\\u4e00-\\u9fa5\\s_-]+$'
};

// 通用描述Schema
export const descriptionSchema = {
  type: 'string',
  minLength: 1,
  maxLength: 1000
};

// 通用页面路径 Schema
export const pagePathSchema = {
  type: 'string',
  pattern: '^/[a-z0-9/-]*$',
  minLength: 1,
  maxLength: 100
};

// 通用数组Schema
export const arraySchema = <T>(itemSchema: T) => ({
  type: 'array',
  items: itemSchema,
  minItems: 0
});

// 通用对象Schema
export const objectSchema = <T>(properties: T, required?: string[]) => ({
  type: 'object',
  properties,
  required: required || [],
  additionalProperties: false
});

// 通用响应Schema
export const responseSchema = <T>(dataSchema: T) => ({
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: dataSchema,
      message: { type: 'string' },
      timestamp: { type: 'string', format: 'date-time' }
    },
    required: ['success', 'data', 'timestamp']
  },
  400: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      error: { type: 'string' },
      message: { type: 'string' },
      timestamp: { type: 'string', format: 'date-time' }
    },
    required: ['success', 'error', 'message', 'timestamp']
  },
  500: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      error: { type: 'string' },
      message: { type: 'string' },
      timestamp: { type: 'string', format: 'date-time' }
    },
    required: ['success', 'error', 'message', 'timestamp']
  }
});
