/**
 * 步骤1: 需求解析与结构化
 * 接收用户原始输入，输出结构化的公司数据
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { structuredDataSchema, responseSchema } from '../../schemas';

// 请求Schema
const step1RequestSchema = {
  type: 'object',
  properties: {
    rawInput: { 
      type: 'string', 
      minLength: 10,
      maxLength: 5000,
      description: '用户的原始纯文本需求描述'
    }
  },
  required: ['rawInput'],
  additionalProperties: false
};

// 响应Schema
const step1ResponseSchema = responseSchema(structuredDataSchema);

// 完整的路由Schema
const step1Schema: FastifySchema = {
  body: step1RequestSchema,
  response: step1ResponseSchema
};

/**
 * 步骤1路由注册
 */
export default async function step1Routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/1-structure-data', { 
    schema: step1Schema,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    try {
      const { rawInput } = request.body as { rawInput: string };
      
      // TODO: 核心业务逻辑
      // 1. 构建AI Prompt，包含角色、背景、目标和详细任务
      // 2. 调用AI模型（例如GPT-4），强制返回符合structuredDataSchema结构的JSON
      // 3. 验证AI返回的数据结构
      // 4. 返回结构化的公司数据
      
      // 临时返回示例数据（实际应该调用AI服务）
      const mockStructuredData = {
        companyInfo: {
          name: "示例公司",
          description: "基于用户输入生成的示例描述",
          industry: "示例行业"
        },
        products: [],
        sellingPoints: {
          primary: "示例主要卖点",
          secondary: "示例次要卖点", 
          tertiary: "示例第三卖点"
        },
        targetAudience: {
          region: "示例地区",
          industry: "示例目标行业",
          concerns: ["示例关注点1", "示例关注点2"],
          preference: "示例偏好"
        },
        assets: {
          images: {}
        },
        seo: {
          mainKeywords: ["示例关键词1", "示例关键词2"],
          longTailKeywords: ["示例长尾关键词1", "示例长尾关键词2"]
        }
      };

      return reply.send({
        success: true,
        data: mockStructuredData,
        message: '需求解析成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error('步骤1执行失败');
      console.error('步骤1执行失败:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '需求解析失败，请稍后重试',
        timestamp: new Date().toISOString()
      });
    }
  });
}
