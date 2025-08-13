/**
 * 步骤6: 确定性代码生成
 * 将最终的、内容完备的蓝图精确翻译成古腾堡HTML
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { contentAndLayoutCompleteBlueprintSchema, responseSchema } from '../../schemas';
import { generateFullGutenbergHtml } from '../../services/html-generator';

// 请求Schema 使用内容和布局都完备的蓝图Schema定义
const step6RequestSchema = contentAndLayoutCompleteBlueprintSchema;

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
      
      // 核心业务逻辑 (此步骤不调用AI)
      // 1. 获取请求体中的内容和布局都完备的蓝图数据
      // 2. 实现一个确定性的JS/TS函数 `generateGutenbergHTML`
      // 3. 该函数需要递归遍历蓝图中的所有 Block 对象
      // 4. 根据每个 block 的 `component`, `config`, `props`, `content` 和 `children`，精确地生成对应的古腾堡HTML注释语法
      // 5. 返回包含完整HTML字符串的JSON对象
      
      // 生成完整的HTML
      const fullHTML = generateFullGutenbergHtml({
        structuredData,
        pages: pages.map(p => ({
          name: p.name,
          path: p.path,
          purpose: p.purpose,
          seo: p.seo,
          outline: Array.isArray(p.outline) ? p.outline : []
        }))
      });
      
      return reply.send({
        success: true,
        data: {
          html: fullHTML
        },
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
