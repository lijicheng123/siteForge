/**
 * 部署路由统一导出
 * 整合所有部署相关的路由定义
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';

// ============================================================================
// Docker 方案路由（旧方案，保留用于兼容）
// ============================================================================
import serverCheckRoutes from './server-check';
import dockerSetupRoutes from './docker-setup';
import wordpressDeployRoutes from './wordpress-deploy';
import statusMonitorRoutes from './status-monitor';
import fullDeploymentRoutes from './full-deployment';

// ============================================================================
// 裸金属（Bare Metal）方案路由（新方案，推荐使用）
// ============================================================================
import bareMetalStep1Routes from './bare-metal-step1-prepare';
import bareMetalStep2Routes from './bare-metal-step2-deploy';
import bareMetalStep3Routes from './bare-metal-step3-ssl';

/**
 * 部署路由主插件
 * 注册所有部署相关的路由
 */
export default async function provisioningRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // --------------------------------------------------------------------------
  // Docker 方案路由（旧方案）
  // --------------------------------------------------------------------------
  
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
  
  // --------------------------------------------------------------------------
  // 裸金属（Bare Metal）方案路由（新方案，推荐）
  // --------------------------------------------------------------------------
  
  // Step 1: 服务器环境准备（LEMP 栈）
  await fastify.register(bareMetalStep1Routes, { prefix: '/provisioning' });
  
  // Step 2: WordPress 部署
  await fastify.register(bareMetalStep2Routes, { prefix: '/provisioning' });
  
  // Step 3: HTTPS 配置
  await fastify.register(bareMetalStep3Routes, { prefix: '/provisioning' });
  
  fastify.log.info('部署路由注册完成 (包含 Docker 方案和裸金属方案)');
}
