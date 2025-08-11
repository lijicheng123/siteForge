/**
 * 路由统一导出文件
 * 整合所有路由模块，提供统一的路由注册入口
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import workflowRoutes from './workflow';
import healthCheckRoutes from './health-check';

/**
 * 主路由注册插件
 * 注册所有应用路由
 */
export default async function routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // 注册工作流路由
  await fastify.register(workflowRoutes, { prefix: '/api' });
  
  // 注册健康检查路由
  await fastify.register(healthCheckRoutes, { prefix: '/api' });
  
  // TODO: 注册其他模块的路由
  // await fastify.register(authRoutes, { prefix: '/api/auth' });
  // await fastify.register(userRoutes, { prefix: '/api/users' });
  // await fastify.register(adminRoutes, { prefix: '/api/admin' });
  
  fastify.log.info('所有路由注册完成');
}
