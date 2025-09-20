/**
 * 部署编排器
 * 协调整个WordPress部署流程的执行
 */

import { PlaybookManager, WordPressConfig, ServerStatus } from './ansible/playbook-manager';
import type { ServerConfig } from './ansible/ansible-client';
import { AnsiblePlaybookResult } from './ansible/ansible-client';

/**
 * 部署阶段枚举
 */
export enum DeploymentStage {
  VALIDATION = 'validation',
  DOCKER_SETUP = 'docker-setup',
  WORDPRESS_DEPLOY = 'wordpress-deploy',
  INITIALIZATION = 'initialization',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * 部署状态接口
 */
export interface DeploymentStatus {
  deploymentId: string;
  stage: DeploymentStage;
  progress: number;
  server: ServerConfig;
  serverStatus: ServerStatus;
  playbookResults: AnsiblePlaybookResult[];
  wordpressConfig?: {
    siteUrl: string;
    adminUrl: string;
    adminUsername: string;
    adminPassword: string;
    dbName: string;
    dbUser: string;
    dbPassword: string;
  };
  startTime: string;
  endTime?: string;
  duration: number;
  error?: string;
}

/**
 * 部署结果接口
 */
export interface DeploymentResult {
  success: boolean;
  deploymentStatus: DeploymentStatus;
  message: string;
}

/**
 * 部署编排器类
 */
export class DeploymentOrchestrator {
  private playbookManager: PlaybookManager;
  private activeDeployments: Map<string, DeploymentStatus>;

  constructor() {
    this.playbookManager = new PlaybookManager();
    this.activeDeployments = new Map();
  }

  /**
   * 执行完整的WordPress部署流程
   */
  async executeFullDeployment(
    server: ServerConfig, 
    wordpressConfig: WordPressConfig
  ): Promise<DeploymentResult> {
    const deploymentId = this.generateDeploymentId();
    const startTime = new Date();

    // 初始化部署状态
    const deploymentStatus: DeploymentStatus = {
      deploymentId,
      stage: DeploymentStage.VALIDATION,
      progress: 0,
      server,
      serverStatus: await this.createInitialServerStatus(),
      playbookResults: [],
      startTime: startTime.toISOString(),
      duration: 0
    };

    this.activeDeployments.set(deploymentId, deploymentStatus);

    try {
      // 阶段1: 服务器验证
      await this.updateDeploymentStatus(deploymentId, DeploymentStage.VALIDATION, 10);
      const validationResult = await this.validateServer(server);
      
      if (!validationResult.success) {
        throw new Error(`服务器验证失败: ${validationResult.message}`);
      }

      deploymentStatus.serverStatus = validationResult.serverStatus;
      deploymentStatus.playbookResults.push(validationResult.playbookResult);

      // 阶段2: Docker环境安装
      if (!validationResult.serverStatus.dockerInstalled) {
        await this.updateDeploymentStatus(deploymentId, DeploymentStage.DOCKER_SETUP, 30);
        const dockerResult = await this.installDockerEnvironment(server);
        
        if (dockerResult.status !== 'success') {
          throw new Error(`Docker安装失败: ${dockerResult.summary}`);
        }

        deploymentStatus.playbookResults.push(dockerResult);
        
        // 重新检查服务器状态
        deploymentStatus.serverStatus = await this.playbookManager.checkServerStatus(server);
      }

      // 阶段3: WordPress部署
      await this.updateDeploymentStatus(deploymentId, DeploymentStage.WORDPRESS_DEPLOY, 60);
      const wordpressResult = await this.deployWordPressStack(server, wordpressConfig);
      
      if (wordpressResult.status !== 'success') {
        throw new Error(`WordPress部署失败: ${wordpressResult.summary}`);
      }

      deploymentStatus.playbookResults.push(wordpressResult);

      // 阶段4: 初始化和验证
      await this.updateDeploymentStatus(deploymentId, DeploymentStage.INITIALIZATION, 80);
      const initResult = await this.initializeWordPress(server, wordpressConfig);
      
      if (!initResult.success) {
        throw new Error(`WordPress初始化失败: ${initResult.message}`);
      }

      // 设置WordPress配置信息
      deploymentStatus.wordpressConfig = {
        siteUrl: `http://${server.ip}`,
        adminUrl: `http://${server.ip}/wp-admin`,
        adminUsername: wordpressConfig.adminUsername,
        adminPassword: wordpressConfig.adminPassword,
        dbName: wordpressConfig.dbName,
        dbUser: wordpressConfig.dbUser,
        dbPassword: wordpressConfig.dbPassword
      };

      // 阶段5: 完成
      await this.updateDeploymentStatus(deploymentId, DeploymentStage.COMPLETED, 100);
      
      const endTime = new Date();
      deploymentStatus.endTime = endTime.toISOString();
      deploymentStatus.duration = (endTime.getTime() - startTime.getTime()) / 1000;

      return {
        success: true,
        deploymentStatus,
        message: 'WordPress部署成功完成'
      };

    } catch (error) {
      // 部署失败处理
      const endTime = new Date();
      deploymentStatus.stage = DeploymentStage.FAILED;
      deploymentStatus.endTime = endTime.toISOString();
      deploymentStatus.duration = (endTime.getTime() - startTime.getTime()) / 1000;
      deploymentStatus.error = error instanceof Error ? error.message : String(error);

      this.activeDeployments.set(deploymentId, deploymentStatus);

      return {
        success: false,
        deploymentStatus,
        message: `部署失败: ${deploymentStatus.error}`
      };
    }
  }

  /**
   * 仅检查服务器状态
   */
  async checkServerOnly(server: ServerConfig): Promise<{ success: boolean; serverStatus: ServerStatus; message: string }> {
    try {
      const serverStatus = await this.playbookManager.checkServerStatus(server);
      
      return {
        success: serverStatus.isOnline,
        serverStatus,
        message: serverStatus.isOnline ? '服务器连接正常' : '服务器连接失败'
      };
    } catch (error) {
      return {
        success: false,
        serverStatus: await this.createInitialServerStatus(),
        message: `服务器检查失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 仅安装Docker环境
   */
  async installDockerOnly(server: ServerConfig): Promise<AnsiblePlaybookResult> {
    return await this.playbookManager.installDocker(server);
  }

  /**
   * 仅部署WordPress
   */
  async deployWordPressOnly(server: ServerConfig, config: WordPressConfig): Promise<AnsiblePlaybookResult> {
    return await this.playbookManager.deployWordPress(server, config);
  }

  /**
   * 获取部署状态
   */
  getDeploymentStatus(deploymentId: string): DeploymentStatus | null {
    return this.activeDeployments.get(deploymentId) || null;
  }

  /**
   * 获取所有活跃部署
   */
  getAllDeployments(): DeploymentStatus[] {
    return Array.from(this.activeDeployments.values());
  }

  /**
   * 取消部署
   */
  cancelDeployment(deploymentId: string): boolean {
    const deployment = this.activeDeployments.get(deploymentId);
    if (deployment && deployment.stage !== DeploymentStage.COMPLETED && deployment.stage !== DeploymentStage.FAILED) {
      deployment.stage = DeploymentStage.FAILED;
      deployment.error = '用户取消部署';
      deployment.endTime = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * 清理完成的部署记录
   */
  cleanupCompletedDeployments(): number {
    const completedIds: string[] = [];
    
    for (const [id, deployment] of this.activeDeployments.entries()) {
      if (deployment.stage === DeploymentStage.COMPLETED || deployment.stage === DeploymentStage.FAILED) {
        // 保留最近1小时的记录
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const deploymentTime = new Date(deployment.startTime).getTime();
        
        if (deploymentTime < oneHourAgo) {
          completedIds.push(id);
        }
      }
    }

    completedIds.forEach(id => this.activeDeployments.delete(id));
    return completedIds.length;
  }

  /**
   * 验证服务器
   */
  private async validateServer(server: ServerConfig): Promise<{
    success: boolean;
    serverStatus: ServerStatus;
    playbookResult: AnsiblePlaybookResult;
    message: string;
  }> {
    try {
      // 执行服务器检查playbook
      const playbookResult = await this.playbookManager.runServerCheck(server);
      
      // 获取详细的服务器状态
      const serverStatus = await this.playbookManager.checkServerStatus(server);
      
      const success = playbookResult.status === 'success' && serverStatus.isOnline;
      
      return {
        success,
        serverStatus,
        playbookResult,
        message: success ? '服务器验证通过' : '服务器验证失败'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        serverStatus: await this.createInitialServerStatus(),
        playbookResult: {
          playbookName: 'server-check',
          status: 'failed',
          totalTasks: 0,
          successTasks: 0,
          failedTasks: 1,
          skippedTasks: 0,
          tasks: [],
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 0,
          summary: `服务器验证异常: ${errorMessage}`
        },
        message: errorMessage
      };
    }
  }

  /**
   * 安装Docker环境
   */
  private async installDockerEnvironment(server: ServerConfig): Promise<AnsiblePlaybookResult> {
    return await this.playbookManager.installDocker(server);
  }

  /**
   * 部署WordPress应用栈
   */
  private async deployWordPressStack(server: ServerConfig, config: WordPressConfig): Promise<AnsiblePlaybookResult> {
    return await this.playbookManager.deployWordPress(server, config);
  }

  /**
   * 初始化WordPress
   */
  private async initializeWordPress(server: ServerConfig, config: WordPressConfig): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // 等待WordPress服务启动
      await this.waitForWordPressReady(server);
      
      // 验证WordPress是否可访问
      const isAccessible = await this.verifyWordPressAccess(server);
      
      return {
        success: isAccessible,
        message: isAccessible ? 'WordPress初始化成功' : 'WordPress无法访问'
      };
    } catch (error) {
      return {
        success: false,
        message: `WordPress初始化失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 等待WordPress就绪
   */
  private async waitForWordPressReady(server: ServerConfig, maxWaitTime = 120): Promise<void> {
    const startTime = Date.now();
    const timeout = maxWaitTime * 1000;

    while (Date.now() - startTime < timeout) {
      try {
        const isReady = await this.checkWordPressHealth(server);
        if (isReady) {
          return;
        }
      } catch (error) {
        // 继续等待
      }

      await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒
    }

    throw new Error('WordPress启动超时');
  }

  /**
   * 检查WordPress健康状态
   */
  private async checkWordPressHealth(server: ServerConfig): Promise<boolean> {
    // 这里应该实际检查WordPress的HTTP响应
    // 暂时返回true作为模拟
    return true;
  }

  /**
   * 验证WordPress访问
   */
  private async verifyWordPressAccess(server: ServerConfig): Promise<boolean> {
    // 这里应该实际访问WordPress首页和管理页面
    // 暂时返回true作为模拟
    return true;
  }

  /**
   * 更新部署状态
   */
  private async updateDeploymentStatus(
    deploymentId: string, 
    stage: DeploymentStage, 
    progress: number
  ): Promise<void> {
    const deployment = this.activeDeployments.get(deploymentId);
    if (deployment) {
      deployment.stage = stage;
      deployment.progress = progress;
      
      const currentTime = new Date();
      const startTime = new Date(deployment.startTime);
      deployment.duration = (currentTime.getTime() - startTime.getTime()) / 1000;
      
      this.activeDeployments.set(deploymentId, deployment);
    }
  }

  /**
   * 生成部署ID
   */
  private generateDeploymentId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `wp-${timestamp}-${random}`;
  }

  /**
   * 创建初始服务器状态
   */
  private async createInitialServerStatus(): Promise<ServerStatus> {
    return {
      isOnline: false,
      os: 'unknown',
      osVersion: '',
      memory: { total: 0, available: 0, used: 0 },
      disk: { total: 0, available: 0, used: 0 },
      dockerInstalled: false,
      dockerVersion: '',
      dockerComposeInstalled: false,
      dockerComposeVersion: '',
      wordpressRunning: false,
      wordpressUrl: '',
      lastChecked: new Date().toISOString()
    };
  }
}
