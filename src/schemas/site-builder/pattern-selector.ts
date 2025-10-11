// src/schemas/site-builder/pattern-selector.ts

import { objectSchema, arraySchema } from '../base';
import { globalElementsSchema } from '../website';
import { instructionCompletePageSchema } from '../pages';

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
      description: '选择该 Pattern 的理由，需要说明它适合哪些 section 以及如何满足页面目标'
    }
  },
  required: ['id', 'reasoning']
};

// Pattern 选择器请求 Schema
export const PatternSelectorRequestSchema = objectSchema({
  globalElements: globalElementsSchema,
  pages: arraySchema(instructionCompletePageSchema)
}, ['globalElements', 'pages']);

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
      description: '整体选择的总结说明，包括如何通过这些 patterns 覆盖页面的各个 sections' 
    }
  },
  required: ['patterns', 'summary']
} as const;

// TypeScript 类型定义
export type PatternSelectorRequest = {
  globalElements: {
    header: {
      logo?: string;
      menuItems: Array<{
        name: string;
        path: string;
        icon?: string;
        children?: Array<{ name: string; path: string; }>;
      }>;
      ctaButton?: {
        text: string;
        url: string;
        style?: 'primary' | 'secondary' | 'outline';
      };
    };
    footer: {
      sections: Array<{
        title: string;
        links: Array<{
          name: string;
          url: string;
        }>;
      }>;
      copyright: string;
    };
  };
  pages: Array<{
    name: string;
    path: string;
    purpose: string;
    seo: {
      title: string;
      description: string;
      primaryKeywords: string[];
      longTailKeywords: string[];
    };
    outline: Array<{
      sectionName: string;
      instruction: string;
      estimatedWords?: number;
    }>;
  }>;
};

export type SelectedPattern = {
  id: number;
  reasoning: string;
};

export type PatternSelectorResponse = {
  patterns: SelectedPattern[];
  summary: string;
};

