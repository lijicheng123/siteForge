/**
 * 步骤6: 确定性代码生成
 * 将最终的、内容完备的蓝图精确翻译成古腾堡HTML
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { websiteBlueprintV4FinalSchema, responseSchema } from '../../schemas';

// 请求Schema
const step6RequestSchema = {
  type: 'object',
  properties: {
    structuredData: { type: 'object' },
    designSystem: { type: 'object' },
    globalElements: { type: 'object' },
    pages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          path: { type: 'string' },
          purpose: { type: 'string' },
          seo: { type: 'object' },
          outline: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                component: { type: 'string' },
                level: { type: 'number' },
                config: { type: 'object' },
                props: { type: 'object' },
                children: { type: 'array' },
                content: { type: 'object' }
              },
              required: ['component']
            }
          }
        },
        required: ['name', 'path', 'purpose', 'seo', 'outline']
      }
    }
  },
  required: ['structuredData', 'designSystem', 'globalElements', 'pages'],
  additionalProperties: false
};

// 响应Schema
const step6ResponseSchema = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          html: { type: 'string', description: '完整的、可被WordPress编辑器解析的古腾堡HTML' }
        },
        required: ['html']
      },
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
};

// 完整的路由Schema
const step6Schema: FastifySchema = {
  body: step6RequestSchema,
  response: step6ResponseSchema
};

/**
 * 生成古腾堡HTML的工具函数
 */
function generateGutenbergHTML(block: any, level: number = 0): string {
  const indent = '  '.repeat(level);
  
  // 处理不同的区块类型
  switch (block.component) {
    case 'core/cover':
      return generateCoverBlock(block, level);
    case 'core/group':
      return generateGroupBlock(block, level);
    case 'core/columns':
      return generateColumnsBlock(block, level);
    case 'core/column':
      return generateColumnBlock(block, level);
    case 'core/heading':
      return generateHeadingBlock(block, level);
    case 'core/paragraph':
      return generateParagraphBlock(block, level);
    case 'core/image':
      return generateImageBlock(block, level);
    case 'core/buttons':
      return generateButtonsBlock(block, level);
    case 'core/button':
      return generateButtonBlock(block, level);
    default:
      return generateGenericBlock(block, level);
  }
}

function generateCoverBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};
  
  let html = `${indent}<!-- wp:cover ${JSON.stringify(config)} -->\n`;
  html += `${indent}<div class="wp-block-cover"`;
  
  // 添加样式属性
  if (config.align) html += ` align="${config.align}"`;
  if (config.overlayColor) html += ` style="--wp-block-cover-overlay-color: ${config.overlayColor};"`;
  if (config.minHeight) html += ` style="min-height: ${config.minHeight}px;"`;
  
  html += '>\n';
  
  // 添加背景图片
  if (props.backgroundType === 'image') {
    html += `${indent}  <img src="/images/hero-bg.jpg" alt="背景图片" />\n`;
  }
  
  // 添加内容
  if (block.children && block.children.length > 0) {
    html += `${indent}  <div class="wp-block-cover__inner-container">\n`;
    block.children.forEach((child: any) => {
      html += generateGutenbergHTML(child, level + 2);
    });
    html += `${indent}  </div>\n`;
  }
  
  html += `${indent}</div>\n`;
  html += `${indent}<!-- /wp:cover -->\n`;
  
  return html;
}

function generateGroupBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};
  
  let html = `${indent}<!-- wp:group ${JSON.stringify(config)} -->\n`;
  html += `${indent}<div class="wp-block-group ${props.className || ''}"`;
  
  // 添加样式属性
  if (config.backgroundColor) html += ` style="background-color: ${config.backgroundColor};"`;
  
  html += '>\n';
  
  // 添加子区块
  if (block.children && block.children.length > 0) {
    block.children.forEach((child: any) => {
      html += generateGutenbergHTML(child, level + 1);
    });
  }
  
  html += `${indent}</div>\n`;
  html += `${indent}<!-- /wp:group -->\n`;
  
  return html;
}

function generateColumnsBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};
  
  let html = `${indent}<!-- wp:columns ${JSON.stringify(config)} -->\n`;
  html += `${indent}<div class="wp-block-columns ${props.className || ''}">\n`;
  
  // 添加列区块
  if (block.children && block.children.length > 0) {
    block.children.forEach((child: any) => {
      html += generateGutenbergHTML(child, level + 1);
    });
  }
  
  html += `${indent}</div>\n`;
  html += `${indent}<!-- /wp:columns -->\n`;
  
  return html;
}

function generateColumnBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};
  
  let html = `${indent}<!-- wp:column ${JSON.stringify(config)} -->\n`;
  html += `${indent}<div class="wp-block-column ${props.className || ''}">\n`;
  
  // 添加子区块
  if (block.children && block.children.length > 0) {
    block.children.forEach((child: any) => {
      html += generateGutenbergHTML(child, level + 1);
    });
  }
  
  html += `${indent}</div>\n`;
  html += `${indent}<!-- /wp:column -->\n`;
  
  return html;
}

function generateHeadingBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};
  
  let html = `${indent}<!-- wp:heading ${JSON.stringify(config)} -->\n`;
  html += `${indent}<h${config.level || 2} class="${props.className || ''}">`;
  
  // 添加内容
  if (block.content && block.content.text) {
    html += block.content.text;
  } else if (props.content) {
    html += props.content;
  } else {
    html += '标题内容';
  }
  
  html += `</h${config.level || 2}>\n`;
  html += `${indent}<!-- /wp:heading -->\n`;
  
  return html;
}

function generateParagraphBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};
  
  let html = `${indent}<!-- wp:paragraph ${JSON.stringify(config)} -->\n`;
  html += `${indent}<p class="${props.className || ''}">`;
  
  // 添加内容
  if (block.content && block.content.text) {
    html += block.content.text;
  } else if (block.content && block.content.prompt) {
    html += `[AI生成文案: ${block.content.prompt}]`;
  } else {
    html += '段落内容';
  }
  
  html += '</p>\n';
  html += `${indent}<!-- /wp:paragraph -->\n`;
  
  return html;
}

function generateImageBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};
  
  let html = `${indent}<!-- wp:image ${JSON.stringify(config)} -->\n`;
  html += `${indent}<figure class="wp-block-image ${props.className || ''}">\n`;
  
  if (block.content && block.content.source) {
    html += `${indent}  <img src="${block.content.source}" alt="${props.alt || '图片'}" />\n`;
  } else {
    html += `${indent}  <img src="/images/placeholder.jpg" alt="占位图片" />\n`;
  }
  
  html += `${indent}</figure>\n`;
  html += `${indent}<!-- /wp:image -->\n`;
  
  return html;
}

function generateButtonsBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};
  
  let html = `${indent}<!-- wp:buttons ${JSON.stringify(config)} -->\n`;
  html += `${indent}<div class="wp-block-buttons ${props.className || ''}">\n`;
  
  // 添加按钮区块
  if (block.children && block.children.length > 0) {
    block.children.forEach((child: any) => {
      html += generateGutenbergHTML(child, level + 1);
    });
  }
  
  html += `${indent}</div>\n`;
  html += `${indent}<!-- /wp:buttons -->\n`;
  
  return html;
}

function generateButtonBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};
  
  let html = `${indent}<!-- wp:button ${JSON.stringify(config)} -->\n`;
  html += `${indent}<div class="wp-block-button ${props.className || ''}">\n`;
  html += `${indent}  <a class="wp-block-button__link" href="${props.url || '#'}">`;
  
  // 添加按钮文本
  if (props.text) {
    html += props.text;
  } else {
    html += '按钮文本';
  }
  
  html += '</a>\n';
  html += `${indent}</div>\n`;
  html += `${indent}<!-- /wp:button -->\n`;
  
  return html;
}

function generateGenericBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};
  
  let html = `${indent}<!-- wp:${block.component} ${JSON.stringify(config)} -->\n`;
  html += `${indent}<div class="wp-block-${block.component.replace('core/', '')} ${props.className || ''}">\n`;
  
  // 添加子区块
  if (block.children && block.children.length > 0) {
    block.children.forEach((child: any) => {
      html += generateGutenbergHTML(child, level + 1);
    });
  }
  
  html += `${indent}</div>\n`;
  html += `${indent}<!-- /wp:${block.component} -->\n`;
  
  return html;
}

/**
 * 步骤6路由注册
 */
export default async function step6Routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/6-generate-html', { 
    schema: step6Schema,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    try {
      const { structuredData, designSystem, globalElements, pages } = request.body as {
        structuredData: any;
        designSystem: any;
        globalElements: any;
        pages: Array<{
          name: string;
          path: string;
          purpose: string;
          seo: any;
          outline: any[];
        }>;
      };
      
      // TODO: 核心业务逻辑 (此步骤不调用AI)
      // 1. 获取请求体中的 WebsiteBlueprint_V4_Final 数据
      // 2. 实现一个确定性的JS/TS函数 `generateGutenbergHTML`
      // 3. 该函数需要递归遍历蓝图中的所有 Block 对象
      // 4. 根据每个 block 的 `component`, `config`, `props`, `content` 和 `children`，精确地生成对应的古腾堡HTML注释语法
      // 5. 返回包含完整HTML字符串的JSON对象
      
      // 生成完整的HTML
      let fullHTML = '';
      
      // 添加页面头部
      fullHTML += `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n`;
      fullHTML += `  <meta charset="UTF-8">\n`;
      fullHTML += `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
      fullHTML += `  <title>${structuredData.companyInfo.name}</title>\n`;
      fullHTML += `  <meta name="description" content="${structuredData.companyInfo.description}">\n`;
      fullHTML += `</head>\n<body>\n`;
      
      // 添加WordPress内容区域
      fullHTML += `<!-- wp:template-part {"slug":"header","area":"header"} /-->\n\n`;
      fullHTML += `<!-- wp:group {"tagName":"main","style":{"spacing":{"margin":{"top":"0"},"padding":{"top":"0"}}}} -->\n`;
      fullHTML += `<main class="wp-block-group" style="margin-top:0;padding-top:0">\n`;
      
      // 生成每个页面的HTML
      pages.forEach(page => {
        fullHTML += `<!-- wp:group {"className":"page-${page.path.replace(/\//g, '-')}"} -->\n`;
        fullHTML += `<div class="wp-block-group page-${page.path.replace(/\//g, '-')}">\n`;
        
        // 生成页面内容
        if (page.outline && page.outline.length > 0) {
          page.outline.forEach(block => {
            fullHTML += generateGutenbergHTML(block, 0);
          });
        }
        
        fullHTML += `</div>\n`;
        fullHTML += `<!-- /wp:group -->\n\n`;
      });
      
      fullHTML += `</main>\n`;
      fullHTML += `<!-- /wp:group -->\n\n`;
      fullHTML += `<!-- wp:template-part {"slug":"footer","area":"footer"} /-->\n`;
      fullHTML += `</body>\n</html>`;

      return reply.send({
        success: true,
        data: { html: fullHTML },
        message: 'HTML代码生成成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error('步骤6执行失败');
      console.error('步骤6执行失败:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'HTML代码生成失败，请稍后重试',
        timestamp: new Date().toISOString()
      });
    }
  });
}
