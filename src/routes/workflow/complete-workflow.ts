/**
 * 完整工作流接口
 * 将6个步骤串联起来，自动处理数据流转
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { responseSchema } from '../../schemas';

// 请求Schema - 只需要用户的原始输入
const completeWorkflowRequestSchema = {
  type: 'object',
  properties: {
    rawInput: { 
      type: 'string', 
      minLength: 10,
      maxLength: 5000,
      description: '用户的原始纯文本需求描述'
    },
    options: {
      type: 'object',
      properties: {
        brandPersonality: {
          type: 'string',
          enum: ['professional', 'creative', 'friendly', 'luxury', 'minimalist', 'bold'],
          description: '品牌个性特征'
        },
        targetMarket: {
          type: 'string',
          enum: ['B2B', 'B2C', 'Enterprise', 'SMB'],
          description: '目标市场类型'
        },
        customBlocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              props: { type: 'object' }
            },
            required: ['name', 'description']
          },
          description: '自定义区块定义'
        }
      },
      additionalProperties: false
    }
  },
  required: ['rawInput'],
  additionalProperties: false
};

// 响应Schema - 包含所有步骤的结果
const completeWorkflowResponseSchema = responseSchema({
  type: 'object',
  properties: {
    workflowId: { type: 'string', description: '工作流唯一标识' },
    status: { type: 'string', enum: ['completed', 'failed'], description: '工作流状态' },
    steps: {
      type: 'object',
      properties: {
        step1: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        },
        step2: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        },
        step3: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        },
        step4: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        },
        step5: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        },
        step6: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    },
    finalResult: {
      type: 'object',
      properties: {
        html: { type: 'string', description: '最终生成的古腾堡HTML' },
        blueprint: { type: 'object', description: '完整的网站蓝图' }
      }
    },
    metadata: {
      type: 'object',
      properties: {
        totalTime: { type: 'number', description: '总耗时(毫秒)' },
        stepTimes: { type: 'object', description: '每个步骤的耗时' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  }
});

// 完整的路由Schema
const completeWorkflowSchema: FastifySchema = {
  body: completeWorkflowRequestSchema,
  response: completeWorkflowResponseSchema
};

/**
 * 完整工作流路由注册
 */
export default async function completeWorkflowRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/complete-workflow', { 
    schema: completeWorkflowSchema,
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '5 minutes'
      }
    }
  }, async (request, reply) => {
    const startTime = Date.now();
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const { rawInput, options = {} } = request.body as {
        rawInput: string;
        options?: {
          brandPersonality?: string;
          targetMarket?: string;
          customBlocks?: Array<{ name: string; description: string; props: any }>;
        };
      };

      console.log(`开始执行完整工作流: ${workflowId}`);

      // 步骤1: 需求解析与结构化
      const step1Start = Date.now();
      const step1Result = await fastify.inject({
        method: 'POST',
        url: '/api/workflow/1-structure-data',
        payload: { rawInput }
      });
      const step1Data = JSON.parse(step1Result.payload);
      const step1Time = Date.now() - step1Start;

      if (!step1Data.success) {
        return reply.status(500).send({
          success: false,
          error: 'STEP1_FAILED',
          message: '步骤1执行失败',
          timestamp: new Date().toISOString()
        });
      }

      // 步骤2: 品牌视觉设计
      const step2Start = Date.now();
      const step2Input = {
        industry: step1Data.data.companyInfo.industry,
        preference: `基于${step1Data.data.companyInfo.industry}行业特点，${step1Data.data.targetAudience.preference}风格`,
        brandPersonality: options.brandPersonality,
        targetMarket: options.targetMarket
      };
      const step2Result = await fastify.inject({
        method: 'POST',
        url: '/api/workflow/2-design-system',
        payload: step2Input
      });
      const step2Data = JSON.parse(step2Result.payload);
      const step2Time = Date.now() - step2Start;

      if (!step2Data.success) {
        return reply.status(500).send({
          success: false,
          error: 'STEP2_FAILED',
          message: '步骤2执行失败',
          timestamp: new Date().toISOString()
        });
      }

      // 步骤3: 网站信息架构
      const step3Start = Date.now();
      const step3Input = {
        companyName: step1Data.data.companyInfo.name,
        products: step1Data.data.products,
        industry: step1Data.data.companyInfo.industry,
        targetMarket: options.targetMarket
      };
      const step3Result = await fastify.inject({
        method: 'POST',
        url: '/api/workflow/3-website-architecture',
        payload: step3Input
      });
      const step3Data = JSON.parse(step3Result.payload);
      const step3Time = Date.now() - step3Start;

      if (!step3Data.success) {
        return reply.status(500).send({
          success: false,
          error: 'STEP3_FAILED',
          message: '步骤3执行失败',
          timestamp: new Date().toISOString()
        });
      }

      // 步骤4: 页面内容策划
      const step4Start = Date.now();
      const step4Input = {
        structuredData: step1Data.data,
        designSystem: step2Data.data,
        globalElements: step3Data.data.globalElements,
        pages: step3Data.data.pages
      };
      const step4Result = await fastify.inject({
        method: 'POST',
        url: '/api/workflow/4-plan-content',
        payload: step4Input
      });
      const step4Data = JSON.parse(step4Result.payload);
      const step4Time = Date.now() - step4Start;

      if (!step4Data.success) {
        return reply.status(500).send({
          success: false,
          error: 'STEP4_FAILED',
          message: '步骤4执行失败',
          timestamp: new Date().toISOString()
        });
      }

      // 步骤5: 区块布局设计
      const step5Start = Date.now();
      const step5Input = {
        blueprintV2: step4Data.data,
        blockLibrary: {
          core_blocks: [
            "core/cover", "core/heading", "core/paragraph", "core/columns", 
            "core/column", "core/button", "core/image", "core/gallery"
          ],
          custom_blocks: options.customBlocks || []
        }
      };
      const step5Result = await fastify.inject({
        method: 'POST',
        url: '/api/workflow/5-design-layout',
        payload: step5Input
      });
      const step5Data = JSON.parse(step5Result.payload);
      const step5Time = Date.now() - step5Start;

      if (!step5Data.success) {
        return reply.status(500).send({
          success: false,
          error: 'STEP5_FAILED',
          message: '步骤5执行失败',
          timestamp: new Date().toISOString()
        });
      }

      // 步骤6: 确定性代码生成
      const step6Start = Date.now();
      const step6Input = {
        structuredData: step1Data.data,
        designSystem: step2Data.data,
        globalElements: step3Data.data.globalElements,
        pages: step5Data.data.pages
      };
      const step6Result = await fastify.inject({
        method: 'POST',
        url: '/api/workflow/6-generate-html',
        payload: step6Input
      });
      const step6Data = JSON.parse(step6Result.payload);
      const step6Time = Date.now() - step6Start;

      if (!step6Data.success) {
        return reply.status(500).send({
          success: false,
          error: 'STEP6_FAILED',
          message: '步骤6执行失败',
          timestamp: new Date().toISOString()
        });
      }

      const totalTime = Date.now() - startTime;

      // 返回完整结果
      return reply.send({
        success: true,
        data: {
          workflowId,
          status: 'completed',
          steps: {
            step1: { status: 'success', data: step1Data.data, message: '需求解析成功' },
            step2: { status: 'success', data: step2Data.data, message: '设计系统生成成功' },
            step3: { status: 'success', data: step3Data.data, message: '网站架构设计成功' },
            step4: { status: 'success', data: step4Data.data, message: '页面内容策划成功' },
            step5: { status: 'success', data: step5Data.data, message: '区块布局设计成功' },
            step6: { status: 'success', data: step6Data.data, message: 'HTML代码生成成功' }
          },
          finalResult: {
            html: step6Data.data.html,
            blueprint: step6Data.data
          },
          metadata: {
            totalTime,
            stepTimes: {
              step1: step1Time,
              step2: step2Time,
              step3: step3Time,
              step4: step4Time,
              step5: step5Time,
              step6: step6Time
            },
            timestamp: new Date().toISOString()
          }
        },
        message: '完整工作流执行成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`工作流执行失败: ${workflowId}`, error);
      return reply.status(500).send({
        success: false,
        error: 'WORKFLOW_FAILED',
        message: '工作流执行失败，请稍后重试',
        timestamp: new Date().toISOString()
      });
    }
  });
}
