/**
 * 工作流路由统一导出
 * 整合所有工作流步骤的路由定义
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import step1Routes from './step1';
import step2Routes from './step2';

/**
 * 工作流路由主插件
 * 注册所有工作流相关的路由
 */
export default async function workflowRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // 注册各个步骤的路由
  await fastify.register(step1Routes, { prefix: '/workflow' });
  await fastify.register(step2Routes, { prefix: '/workflow' });
  
  // TODO: 注册其他步骤的路由
  // await fastify.register(step3Routes, { prefix: '/workflow' });
  // await fastify.register(step4Routes, { prefix: '/workflow' });
  // await fastify.register(step5Routes, { prefix: '/workflow' });
  // await fastify.register(step5bRoutes, { prefix: '/workflow' });
  // await fastify.register(step6Routes, { prefix: '/workflow' });
  
  fastify.log.info('工作流路由注册完成');
}
