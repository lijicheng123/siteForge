/**
 * Docker安装路由
 * 在目标服务器上安装Docker和Docker Compose
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { 
  dockerInstallRequestSchema, 
  dockerInstallResponseSchema 
} from '../../schemas/provisioning';
import { DeploymentOrchestrator } from '../../services/deployment-orchestrator';

// 完整的路由Schema
const dockerInstallSchema: FastifySchema = {
  body: dockerInstallRequestSchema,
  response: dockerInstallResponseSchema
};

/**
 * Docker安装路由注册
 */
export default async function dockerSetupRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/install-docker', { 
    schema: dockerInstallSchema,
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '5 minutes'
      }
    }
  }, async (request, reply) => {
    try {
      const { server } = request.body as { server: any };
      
      fastify.log.info(`开始在服务器 ${server.ip} 上安装Docker`);
      
      // 调用服务层执行Docker安装
      const orchestrator = new DeploymentOrchestrator();
      const installResult = await orchestrator.installDockerOnly(server);
      
      return reply.send({
        success: true,
        data: installResult,
        message: 'Docker安装完成',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error(`Docker安装失败: ${error instanceof Error ? error.message : String(error)}`);
      reply.status(500);
      return reply.send({
        success: false,
        error: 'DOCKER_INSTALL_FAILED',
        message: 'Docker安装失败，请检查服务器状态',
        timestamp: new Date().toISOString()
      });
    }
  });
}
