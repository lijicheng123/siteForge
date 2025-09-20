/**
 * 状态监控路由
 * 查询部署状态和服务器运行状态
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { 
  deploymentStatusResponseSchema 
} from '../../schemas/provisioning';
import { DeploymentOrchestrator } from '../../services/deployment-orchestrator';

// 部署状态查询Schema
const deploymentStatusSchema: FastifySchema = {
  params: {
    type: 'object',
    properties: {
      deploymentId: {
        type: 'string',
        pattern: '^[a-zA-Z0-9-_]+$',
        minLength: 8,
        maxLength: 50
      }
    },
    required: ['deploymentId']
  },
  response: deploymentStatusResponseSchema
};

/**
 * 状态监控路由注册
 */
export default async function statusMonitorRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // 查询部署状态
  fastify.get('/status/:deploymentId', { 
    schema: deploymentStatusSchema,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    try {
      const { deploymentId } = request.params as { deploymentId: string };
      
      fastify.log.info(`查询部署状态: ${deploymentId}`);
      
      // 调用服务层查询部署状态
      const orchestrator = new DeploymentOrchestrator();
      const deploymentStatus = orchestrator.getDeploymentStatus(deploymentId);
      
      if (!deploymentStatus) {
        reply.status(404);
        return reply.send({
          success: false,
          error: 'DEPLOYMENT_NOT_FOUND',
          message: '未找到指定的部署记录',
          timestamp: new Date().toISOString()
        });
      }
      
      return reply.send({
        success: true,
        data: deploymentStatus,
        message: '部署状态查询成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error(`部署状态查询失败: ${error instanceof Error ? error.message : String(error)}`);
      reply.status(500);
      return reply.send({
        success: false,
        error: 'STATUS_QUERY_FAILED',
        message: '部署状态查询失败',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 获取所有部署列表
  fastify.get('/deployments', {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    try {
      fastify.log.info('查询所有部署列表');
      
      // 调用服务层查询所有部署
      const orchestrator = new DeploymentOrchestrator();
      const deployments = orchestrator.getAllDeployments();
      
      return reply.send({
        success: true,
        data: deployments,
        message: '部署列表查询成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error(`部署列表查询失败: ${error instanceof Error ? error.message : String(error)}`);
      reply.status(500);
      return reply.send({
        success: false,
        error: 'DEPLOYMENTS_QUERY_FAILED',
        message: '部署列表查询失败',
        timestamp: new Date().toISOString()
      });
    }
  });
}
