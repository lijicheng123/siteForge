/**
 * 裸金属部署 - Step 3: 配置 HTTPS (SSL/TLS)
 * 
 * 功能:
 * 1. 使用 Certbot 申请 Let's Encrypt 免费 SSL 证书
 * 2. 自动配置 Nginx HTTPS 虚拟主机
 * 3. 设置 HTTP 到 HTTPS 自动重定向
 * 4. 更新 WordPress 站点 URL 为 HTTPS
 * 5. 配置证书自动续期
 * 
 * 前置条件:
 * - Step 1 和 Step 2 必须已成功执行
 * - 域名必须已正确解析到目标服务器 IP
 * - 服务器防火墙必须开放 80 和 443 端口
 */

import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { 
  bareMetalSecureSSLRequestSchema, 
  bareMetalSecureSSLResponseSchema 
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
interface SecureSSLRequest {
  deploymentContext: DeploymentContext;
  sshPassword: string;
  adminEmail: string;
}

/**
 * 路由注册函数
 * 裸金属部署 - Step 3: 配置 HTTPS 和 SSL 证书
 */
export default async function bareMetalStep3Routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post<{ Body: SecureSSLRequest }>(
    '/bare-metal/secure-ssl',
    {
      schema: {
        body: bareMetalSecureSSLRequestSchema,
        response: bareMetalSecureSSLResponseSchema
      },
      config: {
        rateLimit: {
          max: 3,
          timeWindow: '10 minutes'
        }
      }
    },
    async (request: FastifyRequest<{ Body: SecureSSLRequest }>, reply: FastifyReply) => {
      const startTime = Date.now();
      
      try {
        const { deploymentContext, sshPassword, adminEmail } = request.body;
        
        fastify.log.info(`[Step 3] 开始配置 HTTPS: ${deploymentContext.siteDomain} (服务器: ${deploymentContext.targetHost})`);
        fastify.log.info(`[Step 3] 证书通知邮箱: ${adminEmail}`);
        
        // ====================================================================
        // 验证部署上下文的完整性
        // ====================================================================
        if (!deploymentContext.targetHost || !deploymentContext.sshUser || !deploymentContext.siteDomain) {
          reply.status(400);
          return {
            success: false,
            error: 'INVALID_DEPLOYMENT_CONTEXT',
            message: '部署上下文缺少必需字段 (targetHost, sshUser, siteDomain)',
            timestamp: new Date().toISOString()
          };
        }
        
        // ====================================================================
        // 构建 Ansible extra-vars
        // ====================================================================
        const extraVars = {
          target_host: deploymentContext.targetHost,
          ssh_user: deploymentContext.sshUser,
          site_domain: deploymentContext.siteDomain,
          admin_email: adminEmail
        };
        
        fastify.log.info('[Step 3] 执行 Ansible Playbook: playbook_step3_secure_ssl');
        fastify.log.warn('[Step 3] ⚠️  请确保域名已正确解析到服务器 IP，否则证书申请将失败');
        
        // ====================================================================
        // 执行 Ansible Playbook
        // ====================================================================
        const ansibleClient = new AnsibleClient();
        const playbookResult = await ansibleClient.runPlaybook(
          'playbook_step3_secure_ssl',
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
          fastify.log.error(`[Step 3] Playbook 执行失败: ${playbookResult.summary}`);
          
          // 提供更详细的错误提示
          let detailedMessage = 'HTTPS 配置失败。';
          if (playbookResult.summary.includes('dns') || playbookResult.summary.includes('resolve')) {
            detailedMessage += ' 可能原因: 域名 DNS 未正确解析。';
          } else if (playbookResult.summary.includes('certificate') || playbookResult.summary.includes('certbot')) {
            detailedMessage += ' 可能原因: Let\'s Encrypt 证书申请失败（检查速率限制或域名解析）。';
          }
          
          reply.status(500);
          return {
            success: false,
            error: 'PLAYBOOK_EXECUTION_FAILED',
            message: detailedMessage + ` 详情: ${playbookResult.summary}`,
            timestamp: new Date().toISOString()
          };
        }
        
        // ====================================================================
        // 构建响应数据
        // ====================================================================
        const secureSiteUrl = `https://${deploymentContext.siteDomain}`;
        const secureAdminUrl = `https://${deploymentContext.siteDomain}/wp-admin`;
        const certificatePath = `/etc/letsencrypt/live/${deploymentContext.siteDomain}/`;
        
        const duration = (Date.now() - startTime) / 1000;
        
        fastify.log.info(`[Step 3] HTTPS 配置完成 (耗时: ${duration.toFixed(2)}s)`);
        fastify.log.info(`[Step 3] 安全网站地址: ${secureSiteUrl}`);
        fastify.log.info(`[Step 3] SSL 证书路径: ${certificatePath}`);
        fastify.log.info(`[Step 3] 🎉 全部部署流程完成！网站已上线！`);
        
        // ====================================================================
        // 返回成功响应
        // ====================================================================
        return {
          success: true,
          data: {
            message: 'HTTPS 配置成功！网站已上线，所有流量将通过 HTTPS 加密传输。',
            secureSiteUrl: secureSiteUrl,
            secureAdminUrl: secureAdminUrl,
            certificatePath: certificatePath,
            playbookResult: playbookResult
          },
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        
        fastify.log.error(`[Step 3] 执行异常 (耗时: ${duration.toFixed(2)}s):`, error as any);
        
        reply.status(500);
        return {
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: `HTTPS 配置失败: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date().toISOString()
        };
      }
    }
  );
}

