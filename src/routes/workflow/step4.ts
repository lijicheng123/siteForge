/**
 * 步骤4: 页面内容策划
 * 为网站的每个页面规划详细的SEO信息和内容大纲
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { instructionCompleteBlueprintSchema } from '../../schemas/workflow-responses';
import { responseSchema } from '../../schemas/base';
import { step4RequestSchema } from '../../schemas/workflow-requests';
import { executeStep4 } from '../../services/workflow-steps.service';

// 响应Schema - 输出内容完备蓝图Schema
const step4ResponseSchema = responseSchema(instructionCompleteBlueprintSchema);

// 完整的路由Schema
const step4Schema: FastifySchema = {
  body: step4RequestSchema,
  response: step4ResponseSchema
};

/**
 * 步骤4路由注册
 */
export default async function step4Routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/4-design-pages-outlines', { 
    schema: step4Schema,
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
        pages: Array<{ name: string; path: string; purpose: string }>;
      };
      
      // 核心业务逻辑
      // 1. 遍历蓝图中的每个页面
      // 2. 为每个页面构建AI Prompt，指示AI扮演内容策略专家
      // 3. 生成每个页面的SEO信息和内容大纲
      // 4. 调用AI模型，获取每个页面的seo和outline数据
      // 5. 将生成的数据整合回蓝图，形成内容完备的蓝图
      // 6. 返回更新后的蓝图
      
      // 构建基础蓝图
      const blueprint = {
        structuredData,
        designSystem,
        globalElements,
        pages
      };
      
      // 调用服务函数执行核心业务逻辑
      const contentCompleteBlueprint = await executeStep4(blueprint);
      
      return reply.send({
        success: true,
        data: contentCompleteBlueprint,
        message: '页面内容策划成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error('步骤4执行失败');
      console.error('步骤4执行失败:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '页面内容策划失败，请稍后重试',
        timestamp: new Date().toISOString()
      });
    }
  });
}
