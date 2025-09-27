/**
 * 完整工作流接口
 * 将6个步骤串联起来，自动处理数据流转
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { responseSchema } from '../../schemas/index';
import { completeWorkflowRequestSchema } from '../../schemas/workflow-request-schema-type';
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
            input: { type: 'string', description: '步骤1的输入参数' },
            output: { type: 'string', description: '步骤1的输出结果' },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        step2: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'failed', 'skipped'] },
            input: { type: 'string', description: '步骤2的输入参数' },
            output: { type: 'string', description: '步骤2的输出结果' },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        step3: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'failed', 'skipped'] },
            input: { type: 'string', description: '步骤3的输入参数' },
            output: { type: 'string', description: '步骤3的输出结果' },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        step4: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'failed', 'skipped'] },
            input: { type: 'string', description: '步骤4的输入参数' },
            output: { type: 'string', description: '步骤4的输出结果' },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        step5: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'failed', 'skipped'] },
            input: { type: 'string', description: '步骤5的输入参数' },
            output: { type: 'string', description: '步骤5的输出结果' },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        step6: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'failed', 'skipped'] },
            input: { type: 'string', description: '步骤6的输入参数' },
            output: { type: 'string', description: '步骤6的输出结果' },
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
        input: any;
        output: any;
        message: string;
        error: string;
      };
    } = {
      step1: { status: 'pending', input: null, output: null, message: '', error: '' },
      step2: { status: 'pending', input: null, output: null, message: '', error: '' },
      step3: { status: 'pending', input: null, output: null, message: '', error: '' },
      step4: { status: 'pending', input: null, output: null, message: '', error: '' },
      step5: { status: 'pending', input: null, output: null, message: '', error: '' },
      step6: { status: 'pending', input: null, output: null, message: '', error: '' }
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

      // 步骤1: 需求解析与结构化
      const step1Start = Date.now();
      try {
        const step1Input = { rawInput };
        
        const step1Data = await executeStep1(step1Input);
        
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
        
        stepsStatus.step1 = { 
          status: 'success', 
          input: JSON.stringify(step1Input), 
          output: JSON.stringify(step1Data), 
          message: '需求解析成功', 
          error: '' 
        };
        stepTimes.step1 = Date.now() - step1Start;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        stepsStatus.step1 = { 
          status: 'failed', 
          input: JSON.stringify({ rawInput }), 
          output: null, 
          message: '需求解析失败', 
          error: errorMsg 
        };
        stepTimes.step1 = Date.now() - step1Start;
        workflowStatus = 'partial_success';
        // 如果第一步失败，后续步骤无法继续，直接返回
        return buildResponse(reply, workflowId, workflowStatus, stepsStatus, stepTimes, startTime);
      }

      // 步骤2: 品牌视觉设计
      const step2Start = Date.now();
      try {
        // 类型安全检查
        if (!stepsStatus.step1.output) {
          throw new Error('Step1 数据不可用');
        }
        
        const step2Input = {
          industry: stepsStatus.step1.output.companyInfo?.industry,
          preference: `基于${stepsStatus.step1.output.companyInfo?.industry}行业特点，${stepsStatus.step1.output.targetAudience?.preference}风格`,
          brandPersonality: options.brandPersonality,
          targetMarket: options.targetMarket
        };
        
        const step2Data = await executeStep2(step2Input);
        
        // 验证 Step2 返回数据
        if (!step2Data || typeof step2Data !== 'object' || Object.keys(step2Data).length === 0) {
          throw new Error('Step2 返回数据无效或为空');
        }
        
        // 验证设计系统必需字段
        if (!step2Data.palette || !step2Data.typography) {
          throw new Error('Step2 返回数据缺少必需的设计系统字段 (palette 或 typography)');
        }
        
        stepsStatus.step2 = { 
          status: 'success', 
          input: JSON.stringify(step2Input), 
          output: JSON.stringify(step2Data), 
          message: '设计系统生成成功', 
          error: '' 
        };
        stepTimes.step2 = Date.now() - step2Start;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        stepsStatus.step2 = { 
          status: 'failed', 
          input: stepsStatus.step1.output ? JSON.stringify({
            industry: stepsStatus.step1.output.companyInfo?.industry,
            preference: `基于${stepsStatus.step1.output.companyInfo?.industry}行业特点，${stepsStatus.step1.output.targetAudience?.preference}风格`,
            brandPersonality: options.brandPersonality,
            targetMarket: options.targetMarket
          }) : null, 
          output: null, 
          message: '设计系统生成失败', 
          error: errorMsg 
        };
        stepTimes.step2 = Date.now() - step2Start;
        workflowStatus = 'partial_success';
        // 如果第二步失败，后续步骤无法继续，直接返回
        return buildResponse(reply, workflowId, workflowStatus, stepsStatus, stepTimes, startTime);
      }

      // 步骤3: 网站信息架构
      const step3Start = Date.now();
      try {
        // 类型安全检查
        if (!stepsStatus.step1.output) {
          throw new Error('Step1 数据不可用');
        }
        
        const step3Input = {
          companyName: stepsStatus.step1.output.companyInfo?.name,
          products: stepsStatus.step1.output.products,
          industry: stepsStatus.step1.output.companyInfo?.industry,
          targetMarket: options.targetMarket
        };
        
        const step3Data = await executeStep3(step3Input);
        
        // 验证 Step3 返回数据
        if (!step3Data || typeof step3Data !== 'object' || Object.keys(step3Data).length === 0) {
          throw new Error('Step3 返回数据无效或为空');
        }
        
        // 验证网站架构必需字段
        if (!step3Data.globalElements || !step3Data.pages || !Array.isArray(step3Data.pages) || step3Data.pages.length === 0) {
          throw new Error('Step3 返回数据缺少必需的网站架构字段 (globalElements 或 pages)');
        }
        
        stepsStatus.step3 = { 
          status: 'success', 
          input: JSON.stringify(step3Input), 
          output: JSON.stringify(step3Data), 
          message: '网站架构设计成功', 
          error: '' 
        };
        stepTimes.step3 = Date.now() - step3Start;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        stepsStatus.step3 = { 
          status: 'failed', 
          input: stepsStatus.step1.output ? JSON.stringify({
            companyName: stepsStatus.step1.output.companyInfo?.name,
            products: stepsStatus.step1.output.products,
            industry: stepsStatus.step1.output.companyInfo?.industry,
            targetMarket: options.targetMarket
          }) : null, 
          output: null, 
          message: '网站架构设计失败', 
          error: errorMsg 
        };
        stepTimes.step3 = Date.now() - step3Start;
        workflowStatus = 'partial_success';
        // 如果第三步失败，后续步骤无法继续，直接返回
        return buildResponse(reply, workflowId, workflowStatus, stepsStatus, stepTimes, startTime);
      }

      // 步骤4: 页面内容策划
      const step4Start = Date.now();
      try {
        // 类型安全检查
        if (!stepsStatus.step1.output || !stepsStatus.step2.output || !stepsStatus.step3.output) {
          throw new Error('前置步骤数据不可用');
        }
        
        const blueprintV1 = {
          structuredData: stepsStatus.step1.output,
          designSystem: stepsStatus.step2.output,
          globalElements: stepsStatus.step3.output.globalElements,
          pages: stepsStatus.step3.output.pages
        };
        
        const step4Data = await executeStep4(blueprintV1);
        
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
        
        stepsStatus.step4 = { 
          status: 'success', 
          input: JSON.stringify(blueprintV1), 
          output: JSON.stringify(step4Data), 
          message: '页面内容策划成功', 
          error: '' 
        };
        stepTimes.step4 = Date.now() - step4Start;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        stepsStatus.step4 = { 
          status: 'failed', 
          input: (stepsStatus.step1.output && stepsStatus.step2.output && stepsStatus.step3.output) ? JSON.stringify({
            structuredData: stepsStatus.step1.output,
            designSystem: stepsStatus.step2.output,
            globalElements: stepsStatus.step3.output.globalElements,
            pages: stepsStatus.step3.output.pages
          }) : null, 
          output: null, 
          message: '页面内容策划失败', 
          error: errorMsg 
        };
        stepTimes.step4 = Date.now() - step4Start;
        workflowStatus = 'partial_success';
        // 如果第四步失败，后续步骤无法继续，直接返回
        return buildResponse(reply, workflowId, workflowStatus, stepsStatus, stepTimes, startTime);
      }

      // 步骤5: 区块布局设计
      const step5Start = Date.now();
      try {
        // 类型安全检查
        if (!stepsStatus.step4.output) {
          throw new Error('Step4 数据不可用');
        }
        
        const blockLibrary = {
          core_blocks: [
            "core/cover", "core/heading", "core/paragraph", "core/columns", 
            "core/column", "core/button", "core/image", "core/gallery"
          ],
          custom_blocks: options.customBlocks || []
        };
        
        const step5Input = { blueprint: stepsStatus.step4.output, blockLibrary };
        
        const blueprintV3 = await executeStep5(step5Input);
        
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
        
        stepsStatus.step5 = { 
          status: 'success', 
          input: JSON.stringify(step5Input), 
          output: JSON.stringify(blueprintV3), 
          message: '区块布局设计成功', 
          error: '' 
        };
        stepTimes.step5 = Date.now() - step5Start;
        finalBlueprint = blueprintV3;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        stepsStatus.step5 = { 
          status: 'failed', 
          input: stepsStatus.step4.output ? JSON.stringify({
            blueprint: stepsStatus.step4.output,
            blockLibrary: {
              core_blocks: [
                "core/cover", "core/heading", "core/paragraph", "core/columns", 
                "core/column", "core/button", "core/image", "core/gallery"
              ],
              custom_blocks: options.customBlocks || []
            }
          }) : null, 
          output: null, 
          message: '区块布局设计失败', 
          error: errorMsg 
        };
        stepTimes.step5 = Date.now() - step5Start;
        workflowStatus = 'partial_success';
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
        
        const html = executeStep6(finalBlueprint);
        
        stepsStatus.step6 = { 
          status: 'success', 
          input: JSON.stringify(finalBlueprint), 
          output: html, 
          message: 'HTML代码生成成功', 
          error: '' 
        };
        stepTimes.step6 = Date.now() - step6Start;
        finalHTML = html;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        stepsStatus.step6 = { 
          status: 'failed', 
          input: JSON.stringify(finalBlueprint) || null, 
          output: null, 
          message: 'HTML代码生成失败', 
          error: errorMsg 
        };
        stepTimes.step6 = Date.now() - step6Start;
        workflowStatus = 'partial_success';
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