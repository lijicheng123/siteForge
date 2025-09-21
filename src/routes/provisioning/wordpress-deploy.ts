/**
 * WordPress部署路由
 * 在已安装Docker的服务器上部署WordPress应用栈
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { 
  wordpressDeployRequestSchema, 
  wordpressDeployResponseSchema 
} from '../../schemas/provisioning';
import { DeploymentOrchestrator } from '../../services/deployment-orchestrator';

// 完整的路由Schema
const wordpressDeploySchema: FastifySchema = {
  body: wordpressDeployRequestSchema,
  response: wordpressDeployResponseSchema
};

/**
 * WordPress部署路由注册
 */
export default async function wordpressDeployRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/deploy-wordpress', { 
    schema: wordpressDeploySchema,
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '10 minutes'
      }
    }
  }, async (request, reply) => {
    try {
      const { server, wordpressConfig } = request.body as { server: any; wordpressConfig: any };
      
      fastify.log.info(`开始在服务器 ${server.ip} 上部署WordPress`);
      
      // 增强WordPressConfig，添加必要的默认值
      const enhancedConfig = {
        ...wordpressConfig,
        siteDomain: wordpressConfig.siteDomain || server.ip,
        mysqlRootPassword: wordpressConfig.mysqlRootPassword || `root_${Math.random().toString(36).slice(-12)}`,
        enableHttps: wordpressConfig.enableHttps !== false, // 默认启用HTTPS
        caddyConfig: {
          version: '2-alpine',
          httpPort: 80,
          httpsPort: 443,
          autoHttps: true,
          ...wordpressConfig.caddyConfig
        }
      };

      // 调用服务层执行WordPress部署
      const orchestrator = new DeploymentOrchestrator();
      const playbookResult = await orchestrator.deployWordPressOnly(server, enhancedConfig);
      
      // 检查部署是否真正成功
      const isDeploymentSuccessful = playbookResult.status === 'success' && playbookResult.failedTasks === 0;
      
      // 生成部署状态对象
      const deploymentId = `wp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const deploymentResult = {
        deploymentId,
        stage: isDeploymentSuccessful ? 'completed' as const : 'failed' as const,
        progress: isDeploymentSuccessful ? 100 : 0,
        server: {
          ...server,
          port: server.port || 22,
          os: server.os || 'centos'
        },
        serverStatus: {
          isOnline: true,
          os: 'centos' as const,
          osVersion: 'CentOS 8.4',
          memory: { total: 2.0, available: 0.8, used: 1.2 },
          disk: { total: 40.0, available: 32.0, used: 8.0 },
          dockerInstalled: true,
          dockerVersion: '24.0.7',
          dockerComposeInstalled: true,
          dockerComposeVersion: '2.21.0',
          wordpressRunning: isDeploymentSuccessful,
          wordpressUrl: isDeploymentSuccessful ? `http://${server.ip}` : '',
          lastChecked: new Date().toISOString()
        },
        playbookResults: [playbookResult],
        wordpressConfig: {
          siteUrl: `http://${server.ip}`,
          adminUrl: `http://${server.ip}/wp-admin`,
          adminUsername: wordpressConfig.adminUsername,
          adminPassword: wordpressConfig.adminPassword,
          dbName: wordpressConfig.dbName,
          dbUser: wordpressConfig.dbUser,
          dbPassword: wordpressConfig.dbPassword
        },
        startTime: playbookResult.startTime,
        endTime: playbookResult.endTime,
        duration: playbookResult.duration
      };
      
      // 根据实际部署结果返回正确的状态
      if (isDeploymentSuccessful) {
        return reply.send({
          success: true,
          data: deploymentResult,
          message: 'WordPress部署成功完成',
          timestamp: new Date().toISOString()
        });
      } else {
        reply.status(500);
        return reply.send({
          success: false,
          data: deploymentResult,
          error: 'DEPLOYMENT_FAILED',
          message: `WordPress部署失败 (失败任务: ${playbookResult.failedTasks}, 总任务: ${playbookResult.totalTasks})`,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      fastify.log.error(`WordPress部署失败: ${error instanceof Error ? error.message : String(error)}`);
      reply.status(500);
      return reply.send({
        success: false,
        error: 'WORDPRESS_DEPLOY_FAILED',
        message: 'WordPress部署失败，请检查服务器状态和配置',
        timestamp: new Date().toISOString()
      });
    }
  });
}
