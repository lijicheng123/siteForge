/**
 * 步骤5b: 批量文案生成
 * 根据任务列表批量生成网站文案内容
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { 
  contentGenerationRequestSchema, 
  contentGenerationResponseSchema 
} from '../../schemas/workflow-responses';
import promptFactory from '../../services/prompt-factory';
import LLMGateway from '../../services/llm-gateway';
import { MODEL_IDS } from '../../services/model-catalog';

// 完整的路由Schema
const step5bSchema: FastifySchema = {
  body: contentGenerationRequestSchema,
  response: contentGenerationResponseSchema
};

/**
 * 步骤5.5路由注册
 */
export default async function step5bRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/5b-generate-content', { 
    schema: step5bSchema,
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    try {
      const { context, tasks } = request.body as {
        context: {
          companyInfo: { name: string; industry: string; description?: string };
          targetAudience: { region: string; industry: string; concerns?: string[] };
          designSystem?: any;
        };
        tasks: Record<string, string>;
      };
      
      // 核心业务逻辑
      // 1. 构建专业的AI Prompt，指示AI扮演B2B文案专家
      const prompt = promptFactory.getStep5_5CopywriterPrompt(context, tasks);
      
      // 2. 调用AI模型（使用Gemini），强制返回符合格式的JSON
      const responseJsonString = await LLMGateway.callText({ 
        model: MODEL_IDS.GEMINI_2_5_PRO, 
        prompt, 
        temperature: 0.7  // 适中的创造性，保持文案的专业性
      });
      
      // 3. 验证AI返回的数据结构
      const generatedContent = JSON.parse(responseJsonString);
      
      // 4. 验证返回的数据格式是否符合预期
      if (typeof generatedContent !== 'object' || generatedContent === null) {
        throw new Error('AI返回的数据格式无效');
      }
      
      // 5. 验证每个任务都有对应的文案
      for (const taskId of Object.keys(tasks)) {
        if (!(taskId in generatedContent) || typeof generatedContent[taskId] !== 'string') {
          throw new Error(`任务 ${taskId} 的文案生成失败或格式错误`);
        }
      }
      
      // 6. 返回AI生成的文案JSON
      return reply.send({
        success: true,
        data: generatedContent,
        message: '批量文案生成成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error('步骤5.5执行失败');
      console.error('步骤5.5执行失败:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '批量文案生成失败，请稍后重试',
        timestamp: new Date().toISOString()
      });
    }
  });
}
