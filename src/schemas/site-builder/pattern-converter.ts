// Pattern Converter API Schema

export const PatternConverterRequestBodySchema = {
    type: 'object',
    properties: {
        htmlCode: { 
            type: 'string',
            description: '待转换的HTML代码',
            minLength: 1
        },
        cssCode: { 
            type: 'string',
            description: '待转换的CSS代码'
        }
    },
    required: ['htmlCode', 'cssCode']
};

export const PatternConverterResponseSchema = {
    type: 'object',
    properties: {
        gutenbergMarkup: { 
            type: 'string',
            description: 'Gutenberg区块标记字符串'
        }
    },
    required: ['gutenbergMarkup']
};

