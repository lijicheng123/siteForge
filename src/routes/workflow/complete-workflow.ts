/**
 * 完整工作流接口
 * 将6个步骤串联起来，自动处理数据流转
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { responseSchema } from '../../schemas';
import promptFactory from '../../services/prompt-factory';
import llmProvider from '../../services/llm-provider';
import { MODEL_IDS } from '../../services/model-catalog';
import { generateFullGutenbergHtml } from '../../services/html-generator';

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
      const step1Prompt = promptFactory.getStep1AnalyzerPrompt(rawInput);
      const step1Response = await llmProvider.invoke({ 
        model: MODEL_IDS.GEMINI_2_5_PRO, 
        prompt: step1Prompt, 
        temperature: 0.2 
      });
      const step1Data = JSON.parse(llmProvider.cleanAiJsonResponse(step1Response));
      const step1Time = Date.now() - step1Start;

      // 步骤2: 品牌视觉设计
      const step2Start = Date.now();
      const step2Prompt = promptFactory.getStep2DesignerPrompt({
        industry: step1Data.companyInfo.industry,
        preference: `基于${step1Data.companyInfo.industry}行业特点，${step1Data.targetAudience.preference}风格`
      });
      const step2Response = await llmProvider.invoke({ 
        model: MODEL_IDS.GEMINI_2_5_PRO, 
        prompt: step2Prompt, 
        temperature: 0.6 
      });
      const step2Data = JSON.parse(llmProvider.cleanAiJsonResponse(step2Response));
      const step2Time = Date.now() - step2Start;

      // 步骤3: 网站信息架构
      const step3Start = Date.now();
      const step3Prompt = promptFactory.getStep3ArchitectPrompt({
        companyName: step1Data.companyInfo.name,
        products: step1Data.products
      });
      const step3Response = await llmProvider.invoke({ 
        model: MODEL_IDS.GEMINI_2_5_PRO, 
        prompt: step3Prompt, 
        temperature: 0.3 
      });
      const step3Data = JSON.parse(llmProvider.cleanAiJsonResponse(step3Response));
      const step3Time = Date.now() - step3Start;

      // 步骤4: 页面内容策划
      const step4Start = Date.now();
      const blueprintV1 = {
        structuredData: step1Data,
        designSystem: step2Data,
        globalElements: step3Data.globalElements,
        pages: step3Data.pages
      };
      const step4Prompt = promptFactory.getStep4PlannerPrompt(blueprintV1);
      const step4Response = await llmProvider.invoke({ 
        model: MODEL_IDS.GEMINI_2_5_PRO, 
        prompt: step4Prompt, 
        temperature: 0.7 
      });
      const step4Data = JSON.parse(llmProvider.cleanAiJsonResponse(step4Response));
      const step4Time = Date.now() - step4Start;

      // 步骤5: 区块布局设计
      const step5Start = Date.now();
      const blockLibrary = {
        core_blocks: [
          "core/cover", "core/heading", "core/paragraph", "core/columns", 
          "core/column", "core/button", "core/image", "core/gallery"
        ],
        custom_blocks: options.customBlocks || []
      };
      
      // 为每个页面的outline生成区块布局
      const enhancedPages = await Promise.all(step4Data.pages.map(async (page: any) => {
        if (page.outline && Array.isArray(page.outline)) {
          const step5Prompt = promptFactory.getStep5LayoutPrompt(page.outline, blockLibrary);
          const step5Response = await llmProvider.invoke({ 
            model: MODEL_IDS.GEMINI_2_5_PRO, 
            prompt: step5Prompt, 
            temperature: 0.1 
          });
          const blockLayout = JSON.parse(llmProvider.cleanAiJsonResponse(step5Response));
          
          return {
            ...page,
            outline: blockLayout
          };
        }
        return page;
      }));
      
      const blueprintV3 = {
        ...blueprintV1,
        pages: enhancedPages
      };
      const step5Time = Date.now() - step5Start;

      // 步骤6: 确定性代码生成
      const step6Start = Date.now();
      const finalHTML = generateFullGutenbergHtml({
        structuredData: step1Data,
        pages: blueprintV3.pages.map(p => ({
          name: p.name,
          path: p.path,
          purpose: p.purpose,
          seo: p.seo,
          outline: Array.isArray(p.outline) ? p.outline : []
        }))
      });
      const step6Time = Date.now() - step6Start;

      const totalTime = Date.now() - startTime;

      // 返回完整结果
      return reply.send({
        success: true,
        data: {
          workflowId,
          status: 'completed',
          steps: {
            step1: { status: 'success', data: step1Data, message: '需求解析成功' },
            step2: { status: 'success', data: step2Data, message: '设计系统生成成功' },
            step3: { status: 'success', data: step3Data, message: '网站架构设计成功' },
            step4: { status: 'success', data: step4Data, message: '页面内容策划成功' },
            step5: { status: 'success', data: blueprintV3, message: '区块布局设计成功' },
            step6: { status: 'success', data: { html: finalHTML }, message: 'HTML代码生成成功' }
          },
          finalResult: {
            html: finalHTML,
            blueprint: blueprintV3
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
