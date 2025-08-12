/**
 * 步骤4: 页面内容策划
 * 为网站的每个页面规划详细的SEO信息和内容大纲
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { websiteBlueprintV1Schema, websiteBlueprintV2Schema, responseSchema } from '../../schemas';
import promptFactory from '../../services/prompt-factory';
import llmProvider from '../../services/llm-provider';
import { MODEL_IDS } from '../../services/model-catalog';

// 请求Schema - 直接复用输入蓝图V1
const step4RequestSchema = websiteBlueprintV1Schema as any;

// 响应Schema - 输出蓝图V2
const step4ResponseSchema = responseSchema(websiteBlueprintV2Schema);

// 完整的路由Schema
const step4Schema: FastifySchema = {
  body: step4RequestSchema,
  response: step4ResponseSchema
};

/**
 * 步骤4路由注册
 */
export default async function step4Routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/4-plan-content', { 
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
      // 5. 将生成的数据整合回蓝图，形成WebsiteBlueprint_V2
      // 6. 返回更新后的蓝图
      
      // 构建完整的蓝图V1
      const blueprintV1 = {
        structuredData,
        designSystem,
        globalElements,
        pages
      };
      
      // 调用AI模型生成页面内容策划
      const prompt = promptFactory.getStep4PlannerPrompt(blueprintV1);
      const responseJsonString = await llmProvider.invoke({ 
        model: MODEL_IDS.GEMINI_2_5_PRO, 
        prompt, 
        temperature: 0.7 
      });
      
      // 解析AI返回的数据
      const updatedPages = JSON.parse(llmProvider.cleanAiJsonResponse(responseJsonString));
      
      // 构建蓝图V2
      const blueprintV2 = {
        ...blueprintV1,
        pages: updatedPages
      };
      
      return reply.send({
        success: true,
        data: blueprintV2,
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
