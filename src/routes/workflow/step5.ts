/**
 * 步骤5: 区块布局设计
 * 将自然语言的内容大纲翻译成精确的结构化区块布局指令
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { layoutCompleteBlueprintSchema, responseSchema, step5RequestSchema } from '../../schemas';
import { executeStep5 } from '../../services/workflow-steps.service';

// 响应Schema
const step5ResponseSchema = responseSchema(layoutCompleteBlueprintSchema);

// 完整的路由Schema
const step5Schema: FastifySchema = {
  body: step5RequestSchema,
  response: step5ResponseSchema
};

type blockType = {
  name: string;
  description: string;
  attributes: object;
}
interface BlockLibraryType {
  core_blocks: Array<blockType>;
  custom_blocks: Array<blockType>;
}

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
      const { blueprint, blockLibrary } = request.body as {
        blueprint: any;
        blockLibrary: BlockLibraryType;
      };
      
      // 核心业务逻辑
      // 1. 遍历蓝图中每个页面的outline数组
      // 2. 对每个section的instruction，构建AI Prompt
      // 3. 指示AI扮演古腾堡技术架构师
      // 4. Prompt中必须包含可用区块库的定义
      // 5. 要求AI将instruction翻译成符合Block Schema的JSON结构
      // 6. AI的输出会包含需要生成文案的{ "prompt": "..." }标记
      // 7. 将每个页面的outline更新为AI返回的结构化Block数组
      // 8. 形成布局完备的蓝图并返回
      // 调用服务函数执行核心业务逻辑
      const layoutCompleteBlueprint = await executeStep5({ blueprint, blockLibrary });
      
      return reply.send({
        success: true,
        data: layoutCompleteBlueprint,
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
