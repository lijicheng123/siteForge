/**
 * 步骤2: 品牌视觉设计
 * 根据行业和用户偏好，创建全局设计规范
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { designSystemSchema, responseSchema } from '../../schemas';
import promptFactory from '../../services/prompt-factory';
import llmProvider from '../../services/llm-provider';
import { MODEL_IDS } from '../../services/model-catalog';

// 请求Schema
const step2RequestSchema = {
  type: 'object',
  properties: {
    industry: { 
      type: 'string', 
      minLength: 1,
      maxLength: 100,
      description: '公司所属行业，例如：工业LED照明'
    },
    preference: { 
      type: 'string', 
      minLength: 10,
      maxLength: 500,
      description: '目标客户的设计偏好，例如：简洁明了的设计'
    },
    brandPersonality: {
      type: 'string',
      enum: ['professional', 'creative', 'friendly', 'luxury', 'minimalist', 'bold'],
      description: '品牌个性特征'
    },
    targetMarket: {
      type: 'string',
      enum: ['B2B', 'B2C', 'Enterprise', 'SMB'],
      description: '目标市场类型'
    }
  },
  required: ['industry', 'preference'],
  additionalProperties: false
};

// 响应Schema
const step2ResponseSchema = responseSchema(designSystemSchema);

// 完整的路由Schema
const step2Schema: FastifySchema = {
  body: step2RequestSchema,
  response: step2ResponseSchema
};

/**
 * 步骤2路由注册
 */
export default async function step2Routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/2-design-system', { 
    schema: step2Schema,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    try {
      const { industry, preference, brandPersonality, targetMarket } = request.body as {
        industry: string;
        preference: string;
        brandPersonality?: string;
        targetMarket?: string;
      };
      
      // 核心业务逻辑
      // 1. 构建AI Prompt，指示AI扮演品牌视觉设计师
      const context = { industry, preference };
      const prompt = promptFactory.getStep2DesignerPrompt(context);
      
      // 2. 根据行业和偏好生成调色板、字体、间距等设计规范
      // 3. 调用AI模型，强制返回符合designSystemSchema结构的JSON
      const responseJsonString = await llmProvider.invoke({ 
        model: MODEL_IDS.GEMINI_2_5_PRO, 
        prompt, 
        temperature: 0.6 
      });
      
      // 4. 验证AI返回的数据结构
      const designSystem = JSON.parse(llmProvider.cleanAiJsonResponse(responseJsonString));
      
      // 5. 返回设计系统配置
      return reply.send({
        success: true,
        data: designSystem,
        message: '设计系统生成成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error('步骤2执行失败');
      console.error('步骤2执行失败:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '设计系统生成失败，请稍后重试',
        timestamp: new Date().toISOString()
      });
    }
  });
}
