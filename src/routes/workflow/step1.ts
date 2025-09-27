/**
 * 步骤1: 需求解析与结构化
 * 接收用户原始输入，输出结构化的公司数据
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { structuredDataSchema } from '../../schemas/workflow-responses';
import { responseSchema } from '../../schemas/base';
import { step1RequestSchema } from '../../schemas/workflow-requests';
import { executeStep1 } from '../../services/workflow-steps.service';

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
      
      // 核心业务逻辑
      // 1. 构建AI Prompt，包含角色、背景、目标和详细任务
      // 调用服务函数执行核心业务逻辑
      const structuredData = await executeStep1({ rawInput });
      
      // 返回结构化的公司数据
      return reply.send({
        success: true,
        data: structuredData,
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
