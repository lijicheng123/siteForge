/**
 * 步骤5: 区块布局设计
 * 将自然语言的内容大纲翻译成精确的结构化区块布局指令
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { websiteBlueprintV2Schema, websiteBlueprintV3Schema, blockLibrarySchema, responseSchema } from '../../schemas';
import promptFactory from '../../services/prompt-factory';
import llmProvider from '../../services/llm-provider';
import { MODEL_IDS } from '../../services/model-catalog';

// 请求Schema：复用蓝图V2和区块库定义
const step5RequestSchema = {
  type: 'object',
  properties: {
    blueprintV2: websiteBlueprintV2Schema,
    blockLibrary: blockLibrarySchema,
  },
  required: ['blueprintV2', 'blockLibrary'],
  additionalProperties: false
} as const;

// 响应Schema
const step5ResponseSchema = responseSchema(websiteBlueprintV3Schema);

// 完整的路由Schema
const step5Schema: FastifySchema = {
  body: step5RequestSchema,
  response: step5ResponseSchema
};

/**
 * 步骤5路由注册
 */
export default async function step5Routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/5-design-layout', { 
    schema: step5Schema,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    try {
      const { blueprintV2, blockLibrary } = request.body as {
        blueprintV2: any;
        blockLibrary: {
          core_blocks: string[];
          custom_blocks: Array<{ name: string; description: string; props: any }>;
        };
      };
      
      // 核心业务逻辑
      // 1. 遍历蓝图中每个页面的outline数组
      // 2. 对每个section的instruction，构建AI Prompt
      // 3. 指示AI扮演古腾堡技术架构师
      // 4. Prompt中必须包含可用区块库的定义
      // 5. 要求AI将instruction翻译成符合Block Schema的JSON结构
      // 6. AI的输出会包含需要生成文案的{ "prompt": "..." }标记
      // 7. 将每个页面的outline更新为AI返回的结构化Block数组
      // 8. 形成WebsiteBlueprint_V3并返回
      
      // 为每个页面的outline生成区块布局
      const enhancedPages = await Promise.all(blueprintV2.pages.map(async (page: any) => {
        if (page.outline && Array.isArray(page.outline)) {
          // 为每个页面的outline生成区块布局
          const layoutPrompt = promptFactory.getStep5LayoutPrompt(page.outline, blockLibrary);
          const layoutString = await llmProvider.invoke({ 
            model: MODEL_IDS.GEMINI_2_5_PRO, 
            prompt: layoutPrompt, 
            temperature: 0.1 
          });
          
          // 解析AI返回的区块布局
          const blockLayout = JSON.parse(llmProvider.cleanAiJsonResponse(layoutString));
          
          return {
            ...page,
            outline: blockLayout
          };
        }
        return page;
      }));
      
      // 构建蓝图V3
      const blueprintV3 = {
        ...blueprintV2,
        pages: enhancedPages
      };
      
      return reply.send({
        success: true,
        data: blueprintV3,
        message: '区块布局设计成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error('步骤5执行失败');
      console.error('步骤5执行失败:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '区块布局设计失败，请稍后重试',
        timestamp: new Date().toISOString()
      });
    }
  });
}
