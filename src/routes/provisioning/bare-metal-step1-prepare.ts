/**
 * 裸金属部署 - Step 1: 服务器环境准备
 * 
 * 功能:
 * 1. 安装 LEMP 栈 (Linux + Nginx + MariaDB + PHP 8.3)
 * 2. 配置防火墙和安全设置
 * 3. 创建数据库和用户
 * 4. 生成所有后续步骤需要的密码和密钥
 * 
 * ⚠️ 安全警告:
 * 此 API 返回敏感信息（deploymentContext），仅供可信客户端调用！
 * 不要将响应直接暴露给浏览器或不受信任的客户端。
 */

import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { 
  bareMetalPrepareServerRequestSchema, 
  bareMetalPrepareServerResponseSchema 
} from '../../schemas/provisioning';
import { AnsibleClient } from '../../services/ansible/ansible-client';
import * as crypto from 'crypto';

// 请求体类型定义
interface PrepareServerRequest {
  ip: string;
  sshUser: string;
  sshPassword: string;
  domain: string;
}

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

/**
 * 生成安全的随机密码
 */
function generateSecurePassword(length: number = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  
  return password;
}

/**
 * 生成 WordPress Salt Keys
 * 优先使用官方 API，失败则使用本地生成
 */
async function generateWordPressSaltKeys(): Promise<string> {
  try {
    // 尝试调用 WordPress 官方 API
    const response = await fetch('https://api.wordpress.org/secret-key/1.1/salt/', {
      signal: AbortSignal.timeout(5000) // 5秒超时
    });
    
    if (response.ok) {
      const saltKeys = await response.text();
      // 验证返回的内容是否包含必要的 define 语句
      if (saltKeys.includes('AUTH_KEY') && saltKeys.includes('SECURE_AUTH_KEY')) {
        return saltKeys.trim();
      }
    }
  } catch (error) {
    console.warn('WordPress API 调用失败，使用本地生成:', error instanceof Error ? error.message : String(error));
  }
  
  // 降级方案：本地生成
  const keyNames = [
    'AUTH_KEY',
    'SECURE_AUTH_KEY',
    'LOGGED_IN_KEY',
    'NONCE_KEY',
    'AUTH_SALT',
    'SECURE_AUTH_SALT',
    'LOGGED_IN_SALT',
    'NONCE_SALT'
  ];
  
  const saltLines = keyNames.map(keyName => {
    const keyValue = crypto.randomBytes(64).toString('base64');
    return `define('${keyName}', '${keyValue}');`;
  });
  
  return saltLines.join('\n');
}

/**
 * 生成数据库名称（避免冲突）
 */
function generateDbName(domain: string): string {
  const cleanDomain = domain.replace(/[^a-z0-9]/gi, '').substring(0, 10);
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  return `wp_${cleanDomain}_${randomSuffix}`;
}

/**
 * 生成数据库用户名
 */
function generateDbUser(domain: string): string {
  const cleanDomain = domain.replace(/[^a-z0-9]/gi, '').substring(0, 10);
  const randomSuffix = crypto.randomBytes(2).toString('hex');
  return `wpuser_${cleanDomain}_${randomSuffix}`;
}

/**
 * 路由注册函数
 * 裸金属部署 - Step 1: 准备服务器环境（安装 LEMP 栈）
 */
export default async function bareMetalStep1Routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post<{ Body: PrepareServerRequest }>(
    '/bare-metal/prepare-server',
    {
      schema: {
        body: bareMetalPrepareServerRequestSchema,
        response: bareMetalPrepareServerResponseSchema
      },
      config: {
        rateLimit: {
          max: 3,
          timeWindow: '10 minutes'
        }
      }
    },
    async (request: FastifyRequest<{ Body: PrepareServerRequest }>, reply: FastifyReply) => {
      const startTime = Date.now();
      
      try {
        const { ip, sshUser, sshPassword, domain } = request.body;
        
        fastify.log.info(`[Step 1] 开始准备服务器环境: ${ip} (域名: ${domain})`);
        
        // ====================================================================
        // 第一步：生成所有秘密信息
        // ====================================================================
        fastify.log.info('[Step 1] 生成密码和密钥...');
        
        const mysqlRootPassword = generateSecurePassword(20);
        const dbName = generateDbName(domain);
        const dbUser = generateDbUser(domain);
        const dbPassword = generateSecurePassword(16);
        const wpAdminUser = 'admin';
        const wpAdminPassword = generateSecurePassword(16);
        const wpAdminEmail = `admin@${domain}`;
        const wpSaltKeys = await generateWordPressSaltKeys();
        
        fastify.log.info(`[Step 1] 数据库配置: ${dbName} / ${dbUser}`);
        
        // ====================================================================
        // 第二步：构建 Ansible extra-vars
        // ====================================================================
        const extraVars = {
          target_host: ip,
          ssh_user: sshUser,
          site_domain: domain,
          mysql_root_password: mysqlRootPassword,
          db_name: dbName,
          db_user: dbUser,
          db_password: dbPassword
        };
        
        // ====================================================================
        // 第三步：执行 Ansible Playbook
        // ====================================================================
        fastify.log.info('[Step 1] 执行 Ansible Playbook: playbook_step1_prepare_server');
        
        const ansibleClient = new AnsibleClient();
        const playbookResult = await ansibleClient.runPlaybook(
          'playbook_step1_prepare_server',
          [{
            ip: ip,
            username: sshUser,
            password: sshPassword,
            port: 22
          }],
          extraVars
        );
        
        // ====================================================================
        // 第四步：检查执行结果
        // ====================================================================
        const isSuccess = playbookResult.status === 'success' && playbookResult.failedTasks === 0;
        
        if (!isSuccess) {
          fastify.log.error(`[Step 1] Playbook 执行失败: ${playbookResult.summary}`);
          reply.status(500);
          return {
            success: false,
            error: 'PLAYBOOK_EXECUTION_FAILED',
            message: `服务器环境准备失败: ${playbookResult.summary}`,
            timestamp: new Date().toISOString()
          };
        }
        
        // ====================================================================
        // 第五步：构建部署上下文（传递给下一步）
        // ====================================================================
        const deploymentContext: DeploymentContext = {
          targetHost: ip,
          sshUser: sshUser,
          siteDomain: domain,
          dbName: dbName,
          dbUser: dbUser,
          dbPassword: dbPassword,
          wpAdminUser: wpAdminUser,
          wpAdminPassword: wpAdminPassword,
          wpAdminEmail: wpAdminEmail,
          wpSaltKeys: wpSaltKeys
        };
        
        const duration = (Date.now() - startTime) / 1000;
        
        fastify.log.info(`[Step 1] 服务器环境准备完成 (耗时: ${duration.toFixed(2)}s)`);
        fastify.log.warn('[Step 1] ⚠️  响应包含敏感信息，请确保安全传输！');
        
        // ====================================================================
        // 返回成功响应
        // ====================================================================
        return {
          success: true,
          data: {
            message: '服务器环境准备就绪。LEMP 栈已安装，数据库已配置。',
            deploymentContext: deploymentContext,
            playbookResult: playbookResult
          },
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        
        fastify.log.error(`[Step 1] 执行异常 (耗时: ${duration.toFixed(2)}s):`, error as any);
        
        reply.status(500);
        return {
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: `服务器环境准备失败: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date().toISOString()
        };
      }
    }
  );
}

