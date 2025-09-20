/**
 * 部署路由统一导出
 * 整合所有部署相关的路由定义
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import serverCheckRoutes from './server-check';
import dockerSetupRoutes from './docker-setup';
import wordpressDeployRoutes from './wordpress-deploy';
import statusMonitorRoutes from './status-monitor';
import fullDeploymentRoutes from './full-deployment';

/**
 * 部署路由主插件
 * 注册所有部署相关的路由
 */
export default async function provisioningRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // 注册服务器检查路由
  await fastify.register(serverCheckRoutes, { prefix: '/provisioning' });
  
  // 注册Docker安装路由
  await fastify.register(dockerSetupRoutes, { prefix: '/provisioning' });
  
  // 注册WordPress部署路由
  await fastify.register(wordpressDeployRoutes, { prefix: '/provisioning' });
  
  // 注册状态监控路由
  await fastify.register(statusMonitorRoutes, { prefix: '/provisioning' });
  
  // 注册完整部署流程路由
  await fastify.register(fullDeploymentRoutes, { prefix: '/provisioning' });
  
  fastify.log.info('部署路由注册完成');
}
