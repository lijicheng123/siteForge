/**
 * 步骤3: 网站信息架构
 * 根据公司和产品信息，规划网站地图和全局元素
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { websiteArchitectureSchema, responseSchema } from '../../schemas';
import promptFactory from '../../services/prompt-factory';
import llmProvider from '../../services/llm-provider';
import { MODEL_IDS } from '../../services/model-catalog';

// 请求Schema
const step3RequestSchema = {
  type: 'object',
  properties: {
    companyName: { 
      type: 'string', 
      minLength: 1,
      maxLength: 100,
      description: '公司名称'
    },
    products: { 
      type: 'array', 
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          category: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', minLength: 10, maxLength: 500 }
        },
        required: ['name', 'category']
      }
    },
    industry: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: '公司所属行业'
    },
    targetMarket: {
      type: 'string',
      enum: ['B2B', 'B2C', 'Enterprise', 'SMB'],
      description: '目标市场类型'
    }
  },
  required: ['companyName', 'products'],
  additionalProperties: false
};

// 响应Schema
const step3ResponseSchema = responseSchema(websiteArchitectureSchema);

// 完整的路由Schema
const step3Schema: FastifySchema = {
  body: step3RequestSchema,
  response: step3ResponseSchema
};

/**
 * 步骤3路由注册
 */
export default async function step3Routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/3-website-architecture', { 
    schema: step3Schema,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    try {
      const { companyName, products, industry, targetMarket } = request.body as {
        companyName: string;
        products: Array<{ name: string; category: string; description?: string }>;
        industry?: string;
        targetMarket?: string;
      };
      
      // 核心业务逻辑
      // 1. 构建AI Prompt，指示AI扮演信息架构师
      const context = { companyName, products };
      const prompt = promptFactory.getStep3ArchitectPrompt(context);
      
      // 2. 根据公司名称和产品信息生成网站地图
      // 3. 设计全局导航和页脚结构
      // 4. 调用AI模型，强制返回符合websiteArchitectureSchema结构的JSON
      const responseJsonString = await llmProvider.invoke({ 
        model: MODEL_IDS.GEMINI_2_5_PRO, 
        prompt, 
        temperature: 0.3 
      });
      
      // 5. 验证AI返回的数据结构
      const websiteArchitecture = JSON.parse(llmProvider.cleanAiJsonResponse(responseJsonString));
      
      // 6. 返回网站架构信息
      return reply.send({
        success: true,
        data: websiteArchitecture,
        message: '网站架构设计成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error('步骤3执行失败');
      console.error('步骤3执行失败:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '网站架构设计失败，请稍后重试',
        timestamp: new Date().toISOString()
      });
    }
  });
}
