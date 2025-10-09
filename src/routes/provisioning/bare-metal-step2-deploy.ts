/**
 * 裸金属部署 - Step 2: 部署 WordPress
 * 
 * 功能:
 * 1. 配置 Nginx 虚拟主机
 * 2. 使用 WP-CLI 下载和安装 WordPress
 * 3. 配置 WordPress（wp-config.php、盐值等）
 * 4. 设置文件权限和 SELinux
 * 
 * 前置条件:
 * - Step 1 必须已成功执行
 * - 必须传入完整的 deploymentContext
 */

import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { 
  bareMetalDeployWordPressRequestSchema, 
  bareMetalDeployWordPressResponseSchema 
} from '../../schemas/provisioning';
import { AnsibleClient } from '../../services/ansible/ansible-client';

// 部署上下文类型定义
interface DeploymentContext {
  targetHost: string;
  sshUser: string;
  siteDomain: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  wpAdminUser: string;
  wpAdminPassword: string;
  wpAdminEmail: string;
  wpSaltKeys: string;
}

// 请求体类型定义
interface DeployWordPressRequest {
  deploymentContext: DeploymentContext;
  sshPassword: string;
}

/**
 * 路由注册函数
 * 裸金属部署 - Step 2: 部署 WordPress 站点
 */
export default async function bareMetalStep2Routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post<{ Body: DeployWordPressRequest }>(
    '/bare-metal/deploy-wordpress',
    {
      schema: {
        body: bareMetalDeployWordPressRequestSchema,
        response: bareMetalDeployWordPressResponseSchema
      },
      config: {
        rateLimit: {
          max: 3,
          timeWindow: '10 minutes'
        }
      }
    },
    async (request: FastifyRequest<{ Body: DeployWordPressRequest }>, reply: FastifyReply) => {
      const startTime = Date.now();
      
      try {
        const { deploymentContext, sshPassword } = request.body;
        
        fastify.log.info(`[Step 2] 开始部署 WordPress: ${deploymentContext.siteDomain} (服务器: ${deploymentContext.targetHost})`);
        
        // ====================================================================
        // 验证部署上下文的完整性
        // ====================================================================
        const requiredFields: (keyof DeploymentContext)[] = [
          'targetHost', 'sshUser', 'siteDomain', 'dbName', 'dbUser', 
          'dbPassword', 'wpAdminUser', 'wpAdminPassword', 'wpAdminEmail', 'wpSaltKeys'
        ];
        
        for (const field of requiredFields) {
          if (!deploymentContext[field]) {
            reply.status(400);
            return {
              success: false,
              error: 'INVALID_DEPLOYMENT_CONTEXT',
              message: `部署上下文缺少必需字段: ${field}`,
              timestamp: new Date().toISOString()
            };
          }
        }
        
        // ====================================================================
        // 构建 Ansible extra-vars
        // ====================================================================
        const extraVars = {
          target_host: deploymentContext.targetHost,
          ssh_user: deploymentContext.sshUser,
          site_domain: deploymentContext.siteDomain,
          db_name: deploymentContext.dbName,
          db_user: deploymentContext.dbUser,
          db_password: deploymentContext.dbPassword,
          wp_admin_user: deploymentContext.wpAdminUser,
          wp_admin_password: deploymentContext.wpAdminPassword,
          wp_admin_email: deploymentContext.wpAdminEmail,
          wp_salt_keys: deploymentContext.wpSaltKeys
        };
        
        fastify.log.info('[Step 2] 执行 Ansible Playbook: playbook_step2_deploy_wordpress');
        
        // ====================================================================
        // 执行 Ansible Playbook
        // ====================================================================
        const ansibleClient = new AnsibleClient();
        const playbookResult = await ansibleClient.runPlaybook(
          'playbook_step2_deploy_wordpress',
          [{
            ip: deploymentContext.targetHost,
            username: deploymentContext.sshUser,
            password: sshPassword,
            port: 22
          }],
          extraVars
        );
        
        // ====================================================================
        // 检查执行结果
        // ====================================================================
        const isSuccess = playbookResult.status === 'success' && playbookResult.failedTasks === 0;
        
        if (!isSuccess) {
          fastify.log.error(`[Step 2] Playbook 执行失败: ${playbookResult.summary}`);
          reply.status(500);
          return {
            success: false,
            error: 'PLAYBOOK_EXECUTION_FAILED',
            message: `WordPress 部署失败: ${playbookResult.summary}`,
            timestamp: new Date().toISOString()
          };
        }
        
        // ====================================================================
        // 构建响应数据
        // ====================================================================
        const siteUrl = `http://${deploymentContext.siteDomain}`;
        const adminUrl = `http://${deploymentContext.siteDomain}/wp-admin`;
        
        const duration = (Date.now() - startTime) / 1000;
        
        fastify.log.info(`[Step 2] WordPress 部署完成 (耗时: ${duration.toFixed(2)}s)`);
        fastify.log.info(`[Step 2] 网站地址: ${siteUrl}`);
        fastify.log.warn('[Step 2] ⚠️  当前使用 HTTP 协议，请继续执行 Step 3 配置 HTTPS');
        
        // ====================================================================
        // 返回成功响应
        // ====================================================================
        return {
          success: true,
          data: {
            message: 'WordPress 部署成功。网站已可通过 HTTP 访问。',
            siteUrl: siteUrl,
            adminUrl: adminUrl,
            deploymentContext: deploymentContext,  // 继续传递，供 Step 3 使用
            playbookResult: playbookResult
          },
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        
        fastify.log.error(`[Step 2] 执行异常 (耗时: ${duration.toFixed(2)}s):`, error as any);
        
        reply.status(500);
        return {
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: `WordPress 部署失败: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date().toISOString()
        };
      }
    }
  );
}

