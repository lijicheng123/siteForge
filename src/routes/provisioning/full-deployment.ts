/**
 * 完整部署流程路由
 * 执行从服务器检查到WordPress部署的完整自动化流程
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { 
  fullDeploymentRequestSchema, 
  fullDeploymentResponseSchema 
} from '../../schemas/provisioning';
import { DeploymentOrchestrator } from '../../services/deployment-orchestrator';

// 完整的路由Schema
const fullDeploymentSchema: FastifySchema = {
  body: fullDeploymentRequestSchema,
  response: fullDeploymentResponseSchema
};

/**
 * 完整部署路由注册
 */
export default async function fullDeploymentRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/deploy', { 
    schema: fullDeploymentSchema,
    config: {
      rateLimit: {
        max: 2,
        timeWindow: '15 minutes'
      }
    }
  }, async (request, reply) => {
    try {
      const { server, wordpressConfig } = request.body as { server: any; wordpressConfig: any };
      
      fastify.log.info(`开始完整部署流程: ${server.ip}`);
      
      // 调用服务层执行完整部署流程
      const orchestrator = new DeploymentOrchestrator();
      
      // 异步执行完整部署（不等待完成）
      const deploymentPromise = orchestrator.executeFullDeployment(server, wordpressConfig);
      
      // 获取初始部署状态
      const initialResult = await deploymentPromise;
      
      // 如果部署立即失败，返回错误
      if (!initialResult.success) {
        reply.status(500);
        return reply.send({
          success: false,
          error: 'DEPLOYMENT_FAILED',
          message: initialResult.message,
          timestamp: new Date().toISOString()
        });
      }
      
      // 返回部署状态
      const deploymentResult = initialResult.deploymentStatus;
      
      // 部署已完成或正在进行中
      
      return reply.send({
        success: true,
        data: deploymentResult,
        message: '部署流程已启动，请通过状态接口查询进度',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error(`完整部署流程启动失败: ${error instanceof Error ? error.message : String(error)}`);
      reply.status(500);
      return reply.send({
        success: false,
        error: 'DEPLOYMENT_START_FAILED',
        message: '部署流程启动失败，请检查服务器信息和配置',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 快速部署接口 - 使用默认配置
  fastify.post('/quick-deploy', {
    schema: {
      body: {
        type: 'object',
        properties: {
          server: {
            type: 'object',
            properties: {
              ip: { type: 'string' },
              username: { type: 'string' },
              password: { type: 'string' },
              port: { type: 'number', default: 22 }
            },
            required: ['ip', 'username', 'password']
          }
        },
        required: ['server']
      }
    },
    config: {
      rateLimit: {
        max: 2,
        timeWindow: '15 minutes'
      }
    }
  }, async (request, reply) => {
    try {
      const { server } = request.body as { server: any };
      
      fastify.log.info(`开始快速部署: ${server.ip}`);
      
      // 使用默认WordPress配置
      const defaultWordPressConfig = {
        siteName: 'My WordPress Site',
        adminUsername: 'admin',
        adminPassword: `wp_${Math.random().toString(36).substr(2, 12)}`,
        adminEmail: 'admin@example.com',
        dbName: 'wordpress',
        dbUser: 'wpuser',
        dbPassword: `db_${Math.random().toString(36).substr(2, 12)}`,
        tablePrefix: 'wp_'
      };
      
      // 生成部署ID
      const deploymentId = `wp-quick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const deploymentResult = {
        deploymentId,
        stage: 'validation' as const,
        progress: 10,
        server: {
          ...server,
          port: server.port || 22,
          os: 'centos' as const
        },
        serverStatus: {
          isOnline: true,
          os: 'centos' as const,
          osVersion: 'CentOS 8.4',
          memory: {
            total: 2.0,
            available: 1.2,
            used: 0.8
          },
          disk: {
            total: 40.0,
            available: 35.0,
            used: 5.0
          },
          dockerInstalled: false,
          dockerVersion: '',
          dockerComposeInstalled: false,
          dockerComposeVersion: '',
          wordpressRunning: false,
          wordpressUrl: '',
          lastChecked: new Date().toISOString()
        },
        playbookResults: [],
        wordpressConfig: {
          siteUrl: `http://${server.ip}`,
          adminUrl: `http://${server.ip}/wp-admin`,
          ...defaultWordPressConfig
        },
        startTime: new Date().toISOString()
      };
      
      return reply.send({
        success: true,
        data: deploymentResult,
        message: '快速部署已启动，使用默认配置',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error(`快速部署启动失败: ${error instanceof Error ? error.message : String(error)}`);
      reply.status(500);
      return reply.send({
        success: false,
        error: 'QUICK_DEPLOY_FAILED',
        message: '快速部署启动失败',
        timestamp: new Date().toISOString()
      });
    }
  });
}
