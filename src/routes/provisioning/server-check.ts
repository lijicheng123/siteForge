/**
 * 服务器检查路由
 * 检查服务器状态、系统信息、资源使用情况等
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { 
  serverCheckRequestSchema, 
  serverCheckResponseSchema 
} from '../../schemas/provisioning';
import { DeploymentOrchestrator } from '../../services/deployment-orchestrator';
import { PlaybookManager } from '../../services/ansible/playbook-manager';

// 完整的路由Schema
const serverCheckSchema: FastifySchema = {
  body: serverCheckRequestSchema,
  response: serverCheckResponseSchema
};

/**
 * 服务器检查路由注册
 */
export default async function serverCheckRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/check-server', { 
    schema: serverCheckSchema,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    try {
      const { server } = request.body as { server: any };

      const ansibleEnvironment = await new PlaybookManager().checkAnsibleEnvironment();
      console.log('ansibleEnvironment===>', ansibleEnvironment);
      if (!ansibleEnvironment) {
        return reply.send({
          success: false,
          error: 'ANSIBLE_ENVIRONMENT_CHECK_FAILED',
          message: 'Ansible环境都还没有安装哦',
          timestamp: new Date().toISOString()
        });
      }
      
      fastify.log.info(`开始检查服务器: ${server.ip}`);
      
      // 调用服务层执行服务器检查
      const orchestrator = new DeploymentOrchestrator();
      const checkResult = await orchestrator.checkServerOnly(server);
      
      const serverStatus = checkResult.serverStatus;
      
      return reply.send({
        success: checkResult.success,
        data: serverStatus,
        message: checkResult.message,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error(`服务器检查失败: ${error instanceof Error ? error.message : String(error)}`);
      reply.status(500);
      return reply.send({
        success: false,
        error: 'SERVER_CHECK_FAILED',
        message: '服务器检查失败，请检查服务器连接信息',
        timestamp: new Date().toISOString()
      });
    }
  });
}
