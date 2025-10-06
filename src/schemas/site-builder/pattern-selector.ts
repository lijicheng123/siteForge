// src/schemas/site-builder/pattern-selector.ts

// Pattern 选择器请求 Schema
export const PatternSelectorRequestSchema = {
  type: 'object',
  properties: {
    requirements: { 
      type: 'string', 
      description: '用户需求描述' 
    },
    goal: { 
      type: 'string', 
      description: '页面目标' 
    },
    keywords: { 
      type: 'string', 
      description: '核心关键词' 
    },
    tone: { 
      type: 'string', 
      description: '风格色调' 
    }
  },
  required: ['requirements', 'goal', 'keywords', 'tone']
} as const;

// 单个选中的 Pattern Schema（包含 ID 和理由）
const selectedPatternSchema = {
  type: 'object',
  properties: {
    id: { 
      type: 'number',
      description: 'Pattern ID'
    },
    reasoning: { 
      type: 'string',
      description: '选择该 Pattern 的理由'
    }
  },
  required: ['id', 'reasoning']
};

// Pattern 选择器响应 Schema
export const PatternSelectorResponseSchema = {
  type: 'object',
  properties: {
    patterns: { 
      type: 'array', 
      items: selectedPatternSchema,
      description: '选中的 Pattern 数组，每个包含 ID 和选择理由'
    },
    summary: { 
      type: 'string', 
      description: '整体选择的总结说明' 
    }
  },
  required: ['patterns', 'summary']
} as const;

// TypeScript 类型定义
export type PatternSelectorRequest = {
  requirements: string;
  goal: string;
  keywords: string;
  tone: string;
};

export type SelectedPattern = {
  id: number;
  reasoning: string;
};

export type PatternSelectorResponse = {
  patterns: SelectedPattern[];
  summary: string;
};

