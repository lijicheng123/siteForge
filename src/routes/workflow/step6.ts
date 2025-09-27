/**
 * 步骤6: 确定性代码生成
 * 将最终的、内容完备的蓝图精确翻译成古腾堡HTML
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { responseSchema } from '../../schemas/base';
import { step6RequestSchema } from '../../schemas/workflow-requests';
import { executeStep6 } from '../../services/workflow-steps.service';

// 响应数据Schema - 直接返回HTML字符串
const step6ResponseDataSchema = {
  type: 'string',
  description: '完整的、可被WordPress编辑器解析的古腾堡HTML'
};

// 响应Schema - 使用通用的responseSchema函数
const step6ResponseSchema = responseSchema(step6ResponseDataSchema);

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
      // 2. 使用插件化的区块渲染器架构生成古腾堡HTML
      // 3. 支持WordPress核心区块和自定义区块的渲染
      // 4. 根据每个 block 的 `blockName`, `attributes` 和 `innerBlocks`，精确地生成对应的古腾堡HTML注释语法
      // 5. 返回包含完整HTML字符串的JSON对象
      // 构建蓝图数据
      const blueprint = {
        structuredData,
        designSystem,
        globalElements,
        pages
      };
      
      // 调用服务函数执行核心业务逻辑
      const fullHTML = executeStep6(blueprint);

      console.log('fullHTML---->', fullHTML);
      return reply
        .header('Content-Type', 'text/html; charset=utf-8')
        .send(fullHTML);
      // return reply.send({
      //   success: true,
      //   data: {
      //     html: fullHTML,
      //     pages: blueprint.pages
      //   },
      //   message: 'HTML代码生成成功',
      //   timestamp: new Date().toISOString()
      // });

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
