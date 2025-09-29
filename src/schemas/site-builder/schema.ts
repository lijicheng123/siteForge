export const PageBuilderRequestSchema = {
    type: 'object',
    properties: {
        requirements: { type: 'string' },
        goal: { type: 'string' },
        keywords: { type: 'string' },
        tone: { type: 'string' },
        blocks: { 
            type: 'array', 
            items: { type: 'object', properties: {
                sectionName: { type: 'string' },
                blockName: { type: 'string' },
                title: { type: 'string' },
                attributes: { type: 'object' }
            }, required: ['blockName', 'attributes'] }
         },
    },
    required: ['requirements', 'goal', 'keywords', 'tone', 'blocks']
};

export const PageBuilderResponseSchema = {
    type: 'object',
    properties: {
        blocks: { 
            type: 'array', 
            items: { 
                type: 'object',
                 properties: {
                    sectionName: { type: 'string' },
                    blockName: { type: 'string' },
                    title: { type: 'string' },
                    attributes: { type: 'object' }
                }, required: ['sectionName', 'blockName', 'title', 'attributes'] 
            }
        },
    },
    required: ['blocks'],
};