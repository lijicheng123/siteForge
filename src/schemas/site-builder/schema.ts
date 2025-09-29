
// 完整区块定义（用于请求中的可用区块）
const fullBlockSchema = {
    type: 'object',
    properties: {
      name: { 
        type: 'string',
        description: '区块名'
      },
      title: { 
        type: 'string',
        description: '区块标题'
      },
      description: {
         type: 'string',
         description: '区块描述'
      },
      attributes: {
        type: 'object',
        description: '区块属性'
      }
    },
    required: ['name', 'title', 'description', 'attributes']
};

// 简化区块定义（用于响应中的选中区块）
const selectedBlockSchema = {
    type: 'object',
    properties: {
      name: { 
        type: 'string',
        description: '区块名'
      },
      title: { 
        type: 'string',
        description: '区块标题'
      }
    },
    required: ['name', 'title']
};
  
export const PageBuilderRequestSchema = {
    type: 'object',
    properties: {
        requirements: { type: 'string', description: '用户需求描述' },
        goal: { type: 'string', description: '页面目标' },
        keywords: { type: 'string', description: '核心关键词' },
        tone: { type: 'string', description: '风格色调' },
        blocks: { 
            type: 'array', 
            items: fullBlockSchema,
            description: '可用区块数组',
        },
    },
    required: ['requirements', 'goal', 'keywords', 'tone', 'blocks']
};

export const PageBuilderResponseSchema = {
    type: 'object',
    properties: {
        blocks: { 
            type: 'array', 
            items: selectedBlockSchema,
            description: '选中的合适区块数组（仅包含name和title）',
        },
        reasoning: { type: 'string', description: '选择这些区块的理由' },
    },
    required: ['blocks', 'reasoning'],
};