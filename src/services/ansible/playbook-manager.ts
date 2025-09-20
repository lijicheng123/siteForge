/**
 * Playbook管理器
 * 管理和执行不同类型的Ansible Playbooks
 */

import { AnsibleClient, AnsiblePlaybookResult } from './ansible-client';
import type { ServerConfig } from './ansible-client';

/**
 * WordPress配置接口
 */
export interface WordPressConfig {
  siteName: string;
  adminUsername: string;
  adminPassword: string;
  adminEmail: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  tablePrefix?: string;
}

/**
 * 服务器状态接口
 */
export interface ServerStatus {
  isOnline: boolean;
  os: string;
  osVersion: string;
  memory: {
    total: number;
    available: number;
    used: number;
  };
  disk: {
    total: number;
    available: number;
    used: number;
  };
  dockerInstalled: boolean;
  dockerVersion: string;
  dockerComposeInstalled: boolean;
  dockerComposeVersion: string;
  wordpressRunning: boolean;
  wordpressUrl: string;
  lastChecked: string;
}

/**
 * Playbook管理器类
 */
export class PlaybookManager {
  private ansibleClient: AnsibleClient;

  constructor() {
    this.ansibleClient = new AnsibleClient();
  }

  /**
   * 检查服务器状态
   */
  async checkServerStatus(server: ServerConfig): Promise<ServerStatus> {
    try {
      // 直接收集服务器信息（包含连接测试）
      const serverInfo = await this.ansibleClient.getServerInfo(server);
      console.log('收集服务器信息===>', serverInfo);
      if (!serverInfo) {
        return this.createOfflineStatus();
      }

      // 构建服务器状态对象
      const serverStatus = this.buildServerStatus(serverInfo, server);
      console.log('构建服务器状态===>', serverStatus);
      return serverStatus;
      
    } catch (error) {
      console.error('服务器状态检查失败:', error);
      return this.createOfflineStatus();
    }
  }

  /**
   * 安装Docker环境
   */
  async installDocker(server: ServerConfig): Promise<AnsiblePlaybookResult> {
    const extraVars = {
      target_server: server.ip,
      docker_version: '27.1.0',           // Docker LTS长期支持版本
      docker_compose_version: '2.28.1',   // 最新稳定版本
    };

    return await this.ansibleClient.runPlaybook('docker-install', [server], extraVars);
  }

  /**
   * 部署WordPress
   */
  async deployWordPress(server: ServerConfig, config: WordPressConfig): Promise<AnsiblePlaybookResult> {
    const extraVars = {
      target_server: server.ip,
      wordpress_config: config,
      project_dir: '/opt/wordpress',
      nginx_port: 80,
      mysql_port: 3306
    };

    return await this.ansibleClient.runPlaybook('wordpress-deploy', [server], extraVars);
  }

  /**
   * 执行服务器检查Playbook
   */
  async runServerCheck(server: ServerConfig): Promise<AnsiblePlaybookResult> {
    return await this.ansibleClient.runPlaybook('server-check', [server]);
  }

  /**
   * 停止WordPress服务
   */
  async stopWordPress(server: ServerConfig): Promise<AnsiblePlaybookResult> {
    const extraVars = {
      target_server: server.ip,
      project_dir: '/opt/wordpress',
      action: 'stop'
    };

    return await this.ansibleClient.runPlaybook('wordpress-manage', [server], extraVars);
  }

  /**
   * 启动WordPress服务
   */
  async startWordPress(server: ServerConfig): Promise<AnsiblePlaybookResult> {
    const extraVars = {
      target_server: server.ip,
      project_dir: '/opt/wordpress',
      action: 'start'
    };

    return await this.ansibleClient.runPlaybook('wordpress-manage', [server], extraVars);
  }

  /**
   * 重启WordPress服务
   */
  async restartWordPress(server: ServerConfig): Promise<AnsiblePlaybookResult> {
    const extraVars = {
      target_server: server.ip,
      project_dir: '/opt/wordpress',
      action: 'restart'
    };

    return await this.ansibleClient.runPlaybook('wordpress-manage', [server], extraVars);
  }

  /**
   * 备份WordPress数据
   */
  async backupWordPress(server: ServerConfig): Promise<AnsiblePlaybookResult> {
    const backupDir = `/opt/backups/wordpress_${Date.now()}`;
    const extraVars = {
      target_server: server.ip,
      project_dir: '/opt/wordpress',
      backup_dir: backupDir
    };

    return await this.ansibleClient.runPlaybook('wordpress-backup', [server], extraVars);
  }

  /**
   * 更新WordPress
   */
  async updateWordPress(server: ServerConfig): Promise<AnsiblePlaybookResult> {
    const extraVars = {
      target_server: server.ip,
      project_dir: '/opt/wordpress'
    };

    return await this.ansibleClient.runPlaybook('wordpress-update', [server], extraVars);
  }

  /**
   * 检查Ansible环境
   */
  async checkAnsibleEnvironment(): Promise<boolean> {
    return await this.ansibleClient.checkAnsibleAvailable();
  }

  /**
   * 创建离线状态对象
   */
  private createOfflineStatus(): ServerStatus {
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

  /**
   * 构建服务器状态对象
   */
  private buildServerStatus(serverInfo: any, server: ServerConfig): ServerStatus {
    return {
      isOnline: true,
      os: `${serverInfo.os} ${serverInfo.osVersion}`.trim(),
      osVersion: serverInfo.osVersion,
      memory: {
        total: serverInfo.memory.total,
        available: serverInfo.memory.free,
        used: serverInfo.memory.total - serverInfo.memory.free
      },
      disk: {
        total: serverInfo.disk.total,
        available: serverInfo.disk.available,
        used: serverInfo.disk.used
      },
      dockerInstalled: serverInfo.docker.installed,
      dockerVersion: serverInfo.docker.version,
      dockerComposeInstalled: serverInfo.docker.composeInstalled,
      dockerComposeVersion: serverInfo.docker.composeVersion,
      wordpressRunning: false, // 后续检查
      wordpressUrl: '',
      lastChecked: new Date().toISOString()
    };
  }
}
