// src/schemas/site-builder/pattern-analyzer.ts

// 请求 Body Schema
export const PatternAnalyzerRequestBodySchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'number',
      description: 'Pattern ID'
    }
  },
} as const;

// 响应 Data Schema
export const PatternAnalyzerResponseSchema = {
  type: 'object',
  required: ['id', 'layoutDescription'],
  properties: {
    id: {
      type: 'number',
      description: 'Pattern ID'
    },
    layoutDescription: {
      type: 'string',
      description: '布局描述信息'
    }
  },
} as const;

// TypeScript 类型推断
export type PatternAnalyzerRequestBody = {
  id: number;
};

export type PatternAnalyzerResponse = {
  id: number;
  layoutDescription: string;
};

