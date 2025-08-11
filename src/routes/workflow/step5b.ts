/**
 * 步骤5.5: 批量文案生成
 * 汇总所有文案生成请求，一次性调用AI完成
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';

// 请求Schema
const step5bRequestSchema = {
  type: 'object',
  properties: {
    context: {
      type: 'object',
      properties: {
        companyInfo: { 
          type: 'object', 
          properties: { 
            name: { type: 'string' }, 
            industry: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['name', 'industry']
        },
        targetAudience: { 
          type: 'object', 
          properties: { 
            region: { type: 'string' }, 
            industry: { type: 'string' },
            concerns: { type: 'array', items: { type: 'string' } }
          },
          required: ['region', 'industry']
        },
        designSystem: {
          type: 'object',
          properties: {
            palette: { type: 'object' },
            typography: { type: 'object' }
          }
        }
      },
      required: ['companyInfo', 'targetAudience']
    },
    tasks: {
      type: 'object',
      description: "Key-Value对象，Key是唯一任务ID，Value是具体的文案生成指令",
      patternProperties: {
        '^.+$': { type: 'string' }
      },
      additionalProperties: false,
      minProperties: 1
    }
  },
  required: ['context', 'tasks'],
  additionalProperties: false
};

// 响应Schema
const step5bResponseSchema = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        description: "Key-Value对象，Key是任务ID，Value是AI生成的文案",
        patternProperties: {
          '^.+$': { type: 'string' }
        },
        additionalProperties: false,
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
const step5bSchema: FastifySchema = {
  body: step5bRequestSchema,
  response: step5bResponseSchema
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
      
      // TODO: 核心业务逻辑
      // 1. 构建一个单一的、强大的 Prompt，指示 AI 扮演 B2B 文案专家
      // 2. 将 context 和整个 tasks 对象都提供给 AI
      // 3. 要求 AI 严格按照 { "任务ID": "生成的文案" } 的格式返回一个 JSON 对象
      // 4. 验证AI返回的数据结构
      // 5. 返回 AI 生成的文案 JSON
      
      // 临时返回示例数据（实际应该调用AI服务）
      const generatedContent: Record<string, string> = {};
      
      // 模拟AI为每个任务生成文案
      for (const [taskId, instruction] of Object.entries(tasks)) {
        // 根据任务ID和指令生成相应的文案
        if (taskId.includes('hero')) {
          generatedContent[taskId] = `${context.companyInfo.name} - ${context.companyInfo.industry}领域的专业服务商。我们致力于为客户提供最优质的产品和解决方案，凭借专业的技术实力和丰富的行业经验，成为您值得信赖的合作伙伴。`;
        } else if (taskId.includes('product')) {
          generatedContent[taskId] = `我们的产品采用先进的技术工艺，严格的质量控制体系，确保每一个产品都达到行业最高标准。在${context.companyInfo.industry}领域，我们拥有丰富的产品线和定制化解决方案，能够满足不同客户的多样化需求。`;
        } else if (taskId.includes('advantage')) {
          generatedContent[taskId] = `选择${context.companyInfo.name}，您将获得：专业的技术团队支持、快速响应的客户服务、完善的售后保障体系。我们在${context.targetAudience.region}地区服务众多${context.targetAudience.industry}客户，积累了丰富的项目经验和成功案例。`;
        } else if (taskId.includes('cta')) {
          generatedContent[taskId] = `立即联系${context.companyInfo.name}，获取${context.companyInfo.industry}专业咨询和定制化解决方案。我们的专家团队将为您提供一对一服务，帮助您找到最适合的解决方案。`;
        } else {
          // 通用文案生成
          generatedContent[taskId] = `基于您的需求"${instruction}"，${context.companyInfo.name}作为${context.companyInfo.industry}领域的专业服务商，我们拥有丰富的经验和专业的技术团队。我们致力于为客户提供最优质的服务，确保每个项目都能达到客户的期望。`;
        }
      }

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
