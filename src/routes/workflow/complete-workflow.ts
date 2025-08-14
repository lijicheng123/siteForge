/**
 * 完整工作流接口
 * 将6个步骤串联起来，自动处理数据流转
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { responseSchema, completeWorkflowRequestSchema } from '../../schemas';
import { 
  executeStep1, 
  executeStep2, 
  executeStep3, 
  executeStep4, 
  executeStep5, 
  executeStep6 
} from '../../services/workflow-steps.service';

// 响应Schema - 包含所有步骤的结果
const completeWorkflowResponseSchema = responseSchema({
  type: 'object',
  properties: {
    workflowId: { type: 'string', description: '工作流唯一标识' },
    status: { type: 'string', enum: ['completed', 'partial_success', 'failed'], description: '工作流状态' },
    steps: {
      type: 'object',
      properties: {
        step1: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'failed', 'skipped'] },
            data: { type: 'object' },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        step2: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'failed', 'skipped'] },
            data: { type: 'object' },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        step3: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'failed', 'skipped'] },
            data: { type: 'object' },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        step4: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'failed', 'skipped'] },
            data: { type: 'object' },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        step5: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'failed', 'skipped'] },
            data: { type: 'object' },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        step6: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'failed', 'skipped'] },
            data: { type: 'object' },
            message: { type: 'string' },
            error: { type: 'string' }
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
    
    // 初始化步骤状态
    const stepsStatus: {
      [key: string]: {
        status: 'pending' | 'success' | 'failed' | 'skipped';
        data: any;
        message: string;
        error: string;
      };
    } = {
      step1: { status: 'pending', data: null, message: '', error: '' },
      step2: { status: 'pending', data: null, message: '', error: '' },
      step3: { status: 'pending', data: null, message: '', error: '' },
      step4: { status: 'pending', data: null, message: '', error: '' },
      step5: { status: 'pending', data: null, message: '', error: '' },
      step6: { status: 'pending', data: null, message: '', error: '' }
    };
    
    const stepTimes: { [key: string]: number } = {};
    let workflowStatus: 'completed' | 'partial_success' | 'failed' = 'completed';
    let finalHTML: string | null = null;
    let finalBlueprint: any = null;

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
      try {
        const step1Input = { rawInput };
        console.log(`[${workflowId}] Step1 入参:`, JSON.stringify(step1Input, null, 2));
        
        const step1Data = await executeStep1(step1Input);
        console.log(`[${workflowId}] Step1 出参:`, JSON.stringify(step1Data, null, 2));
        
        // 验证 Step1 返回数据
        if (!step1Data || typeof step1Data !== 'object' || Object.keys(step1Data).length === 0) {
          throw new Error('Step1 返回数据无效或为空');
        }
        
        // 验证必需字段
        if (!step1Data.companyInfo || !step1Data.companyInfo.industry || !step1Data.companyInfo.name) {
          throw new Error('Step1 返回数据缺少必需的 companyInfo.industry 或 companyInfo.name 字段');
        }
        
        if (!step1Data.products || !Array.isArray(step1Data.products) || step1Data.products.length === 0) {
          throw new Error('Step1 返回数据缺少必需的 products 数组');
        }
        
        if (!step1Data.targetAudience || !step1Data.targetAudience.preference) {
          throw new Error('Step1 返回数据缺少必需的 targetAudience.preference 字段');
        }
        
        stepsStatus.step1 = { status: 'success', data: step1Data, message: '需求解析成功', error: '' };
        stepTimes.step1 = Date.now() - step1Start;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        stepsStatus.step1 = { status: 'failed', data: null, message: '需求解析失败', error: errorMsg };
        stepTimes.step1 = Date.now() - step1Start;
        workflowStatus = 'partial_success';
        console.error(`[${workflowId}] Step1 执行失败:`, error);
        // 如果第一步失败，后续步骤无法继续，直接返回
        return buildResponse(reply, workflowId, workflowStatus, stepsStatus, stepTimes, startTime);
      }

      // 步骤2: 品牌视觉设计
      const step2Start = Date.now();
      try {
        // 类型安全检查
        if (!stepsStatus.step1.data) {
          throw new Error('Step1 数据不可用');
        }
        
        const step2Input = {
          industry: stepsStatus.step1.data.companyInfo.industry,
          preference: `基于${stepsStatus.step1.data.companyInfo.industry}行业特点，${stepsStatus.step1.data.targetAudience.preference}风格`,
          brandPersonality: options.brandPersonality,
          targetMarket: options.targetMarket
        };
        console.log(`[${workflowId}] Step2 入参:`, JSON.stringify(step2Input, null, 2));
        
        const step2Data = await executeStep2(step2Input);
        console.log(`[${workflowId}] Step2 出参:`, JSON.stringify(step2Data, null, 2));
        
        // 验证 Step2 返回数据
        if (!step2Data || typeof step2Data !== 'object' || Object.keys(step2Data).length === 0) {
          throw new Error('Step2 返回数据无效或为空');
        }
        
        // 验证设计系统必需字段
        if (!step2Data.palette || !step2Data.typography) {
          throw new Error('Step2 返回数据缺少必需的设计系统字段 (palette 或 typography)');
        }
        
        stepsStatus.step2 = { status: 'success', data: step2Data, message: '设计系统生成成功', error: '' };
        stepTimes.step2 = Date.now() - step2Start;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        stepsStatus.step2 = { status: 'failed', data: null, message: '设计系统生成失败', error: errorMsg };
        stepTimes.step2 = Date.now() - step2Start;
        workflowStatus = 'partial_success';
        console.error(`[${workflowId}] Step2 执行失败:`, error);
        // 如果第二步失败，后续步骤无法继续，直接返回
        return buildResponse(reply, workflowId, workflowStatus, stepsStatus, stepTimes, startTime);
      }

      // 步骤3: 网站信息架构
      const step3Start = Date.now();
      try {
        // 类型安全检查
        if (!stepsStatus.step1.data) {
          throw new Error('Step1 数据不可用');
        }
        
        const step3Input = {
          companyName: stepsStatus.step1.data.companyInfo.name,
          products: stepsStatus.step1.data.products,
          industry: stepsStatus.step1.data.companyInfo.industry,
          targetMarket: options.targetMarket
        };
        console.log(`[${workflowId}] Step3 入参:`, JSON.stringify(step3Input, null, 2));
        
        const step3Data = await executeStep3(step3Input);
        console.log(`[${workflowId}] Step3 出参:`, JSON.stringify(step3Data, null, 2));
        
        // 验证 Step3 返回数据
        if (!step3Data || typeof step3Data !== 'object' || Object.keys(step3Data).length === 0) {
          throw new Error('Step3 返回数据无效或为空');
        }
        
        // 验证网站架构必需字段
        if (!step3Data.globalElements || !step3Data.pages || !Array.isArray(step3Data.pages) || step3Data.pages.length === 0) {
          throw new Error('Step3 返回数据缺少必需的网站架构字段 (globalElements 或 pages)');
        }
        
        stepsStatus.step3 = { status: 'success', data: step3Data, message: '网站架构设计成功', error: '' };
        stepTimes.step3 = Date.now() - step3Start;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        stepsStatus.step3 = { status: 'failed', data: null, message: '网站架构设计失败', error: errorMsg };
        stepTimes.step3 = Date.now() - step3Start;
        workflowStatus = 'partial_success';
        console.error(`[${workflowId}] Step3 执行失败:`, error);
        // 如果第三步失败，后续步骤无法继续，直接返回
        return buildResponse(reply, workflowId, workflowStatus, stepsStatus, stepTimes, startTime);
      }

      // 步骤4: 页面内容策划
      const step4Start = Date.now();
      try {
        // 类型安全检查
        if (!stepsStatus.step1.data || !stepsStatus.step2.data || !stepsStatus.step3.data) {
          throw new Error('前置步骤数据不可用');
        }
        
        const blueprintV1 = {
          structuredData: stepsStatus.step1.data,
          designSystem: stepsStatus.step2.data,
          globalElements: stepsStatus.step3.data.globalElements,
          pages: stepsStatus.step3.data.pages
        };
        console.log(`[${workflowId}] Step4 入参:`, JSON.stringify(blueprintV1, null, 2));
        
        const step4Data = await executeStep4(blueprintV1);
        console.log(`[${workflowId}] Step4 出参:`, JSON.stringify(step4Data, null, 2));
        
        // 验证 Step4 返回数据
        if (!step4Data || typeof step4Data !== 'object' || Object.keys(step4Data).length === 0) {
          throw new Error('Step4 返回数据无效或为空');
        }
        
        // 验证内容完备蓝图必需字段
        if (!step4Data.pages || !Array.isArray(step4Data.pages) || step4Data.pages.length === 0) {
          throw new Error('Step4 返回数据缺少必需的 pages 数组');
        }
        
        // 验证每个页面都有必需的字段
        for (const page of step4Data.pages) {
          if (!page.name || !page.path || !page.purpose || !page.seo || !page.outline) {
            throw new Error(`Step4 返回的页面数据缺少必需字段: ${page.name || 'unknown'}`);
          }
          if (!Array.isArray(page.outline)) {
            throw new Error(`Step4 返回的页面 ${page.name} 的 outline 不是数组`);
          }
        }
        
        stepsStatus.step4 = { status: 'success', data: step4Data, message: '页面内容策划成功', error: '' };
        stepTimes.step4 = Date.now() - step4Start;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        stepsStatus.step4 = { status: 'failed', data: null, message: '页面内容策划失败', error: errorMsg };
        stepTimes.step4 = Date.now() - step4Start;
        workflowStatus = 'partial_success';
        console.error(`[${workflowId}] Step4 执行失败:`, error);
        // 如果第四步失败，后续步骤无法继续，直接返回
        return buildResponse(reply, workflowId, workflowStatus, stepsStatus, stepTimes, startTime);
      }

      // 步骤5: 区块布局设计
      const step5Start = Date.now();
      try {
        // 类型安全检查
        if (!stepsStatus.step4.data) {
          throw new Error('Step4 数据不可用');
        }
        
        const blockLibrary = {
          core_blocks: [
            "core/cover", "core/heading", "core/paragraph", "core/columns", 
            "core/column", "core/button", "core/image", "core/gallery"
          ],
          custom_blocks: options.customBlocks || []
        };
        
        const step5Input = { blueprint: stepsStatus.step4.data, blockLibrary };
        console.log(`[${workflowId}] Step5 入参:`, JSON.stringify(step5Input, null, 2));
        
        const blueprintV3 = await executeStep5(step5Input);
        console.log(`[${workflowId}] Step5 出参:`, JSON.stringify(blueprintV3, null, 2));
        
        // 验证 Step5 返回数据
        if (!blueprintV3 || typeof blueprintV3 !== 'object' || Object.keys(blueprintV3).length === 0) {
          throw new Error('Step5 返回数据无效或为空');
        }
        
        // 验证布局完备蓝图必需字段
        if (!blueprintV3.pages || !Array.isArray(blueprintV3.pages) || blueprintV3.pages.length === 0) {
          throw new Error('Step5 返回数据缺少必需的 pages 数组');
        }
        
        // 验证每个页面都有必需的字段
        for (const page of blueprintV3.pages) {
          if (!page.name || !page.path || !page.purpose || !page.seo || !page.outline) {
            throw new Error(`Step5 返回的页面数据缺少必需字段: ${page.name || 'unknown'}`);
          }
          if (!Array.isArray(page.outline)) {
            throw new Error(`Step5 返回的页面 ${page.name} 的 outline 不是数组`);
          }
        }
        
        stepsStatus.step5 = { status: 'success', data: blueprintV3, message: '区块布局设计成功', error: '' };
        stepTimes.step5 = Date.now() - step5Start;
        finalBlueprint = blueprintV3;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        stepsStatus.step5 = { status: 'failed', data: null, message: '区块布局设计失败', error: errorMsg };
        stepTimes.step5 = Date.now() - step5Start;
        workflowStatus = 'partial_success';
        console.error(`[${workflowId}] Step5 执行失败:`, error);
        // 如果第五步失败，后续步骤无法继续，直接返回
        return buildResponse(reply, workflowId, workflowStatus, stepsStatus, stepTimes, startTime);
      }

      // 步骤6: 确定性代码生成
      const step6Start = Date.now();
      try {
        // 类型安全检查
        if (!finalBlueprint) {
          throw new Error('Step5 数据不可用');
        }
        
        console.log(`[${workflowId}] Step6 入参:`, JSON.stringify(finalBlueprint, null, 2));
        
        const html = executeStep6(finalBlueprint);
        console.log(`[${workflowId}] Step6 出参:`, JSON.stringify({ html: html.substring(0, 200) + '...' }, null, 2));
        
        stepsStatus.step6 = { status: 'success', data: { html }, message: 'HTML代码生成成功', error: '' };
        stepTimes.step6 = Date.now() - step6Start;
        finalHTML = html;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        stepsStatus.step6 = { status: 'failed', data: null, message: 'HTML代码生成失败', error: errorMsg };
        stepTimes.step6 = Date.now() - step6Start;
        workflowStatus = 'partial_success';
        console.error(`[${workflowId}] Step6 执行失败:`, error);
      }

      // 所有步骤完成，返回结果
      return buildResponse(reply, workflowId, workflowStatus, stepsStatus, stepTimes, startTime, finalHTML || undefined, finalBlueprint || undefined);

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

/**
 * 构建响应数据
 */
function buildResponse(reply: any, workflowId: string, status: string, steps: any, stepTimes: any, startTime: number, html?: string, blueprint?: any) {
  const totalTime = Date.now() - startTime;
  
  return reply.send({
    success: status === 'completed',
    data: {
      workflowId,
      status,
      steps,
      finalResult: {
        html: html || null,
        blueprint: blueprint || null
      },
      metadata: {
        totalTime,
        stepTimes,
        timestamp: new Date().toISOString()
      }
    },
    message: status === 'completed' ? '完整工作流执行成功' : '工作流部分成功，部分步骤失败',
    timestamp: new Date().toISOString()
  });
}
