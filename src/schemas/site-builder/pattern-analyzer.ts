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
  }
} as const;

// 响应 Data Schema - 丰富化的 Pattern 数据
export const PatternAnalyzerResponseSchema = {
  type: 'object',
  required: ['id', 'name', 'description', 'categories', 'style_tags', 'industry_tags', 'layout', 'keywords', 'image_url'],
  properties: {
    id: {
      type: 'number',
      description: 'Pattern ID'
    },
    name: {
      type: 'string',
      description: 'Pattern 名称'
    },
    description: {
      type: 'string',
      description: '基于视觉分析生成的描述'
    },
    categories: {
      type: 'array',
      items: { type: 'string' },
      description: 'Pattern 分类'
    },
    style_tags: {
      type: 'array',
      items: { type: 'string' },
      description: '风格标签'
    },
    industry_tags: {
      type: 'array',
      items: { type: 'string' },
      description: '行业标签'
    },
    layout: {
      type: 'object',
      additionalProperties: { type: 'string' },
      description: '布局信息'
    },
    keywords: {
      type: 'array',
      items: { type: 'string' },
      description: '关键词'
    },
    image_url: {
      type: 'string',
      description: '图片 URL'
    }
  }
} as const;

// TypeScript 类型推断
export type PatternAnalyzerRequestBody = {
  id: number;
};

export type PatternAnalyzerResponse = {
  id: number;
  name: string;
  description: string;
  categories: string[];
  style_tags: string[];
  industry_tags: string[];
  layout: Record<string, string>;
  keywords: string[];
  image_url: string;
};

