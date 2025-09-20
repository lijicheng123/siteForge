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
      // 测试连接
      const isOnline = await this.ansibleClient.testConnection(server);

      console.log('测试连接是否成功isOnline===>', isOnline);
      if (!isOnline) {
        return this.createOfflineStatus();
      }

      // 收集系统信息（使用轻量版方法，避免数据过多）
      const facts = await this.ansibleClient.getBasicServerInfo(server);
      console.log('收集系统信息facts===>', facts);
      if (!facts) {
        return this.createOfflineStatus();
      }

      // 解析系统信息
      const serverStatus = this.parseServerFacts(facts, server);
      console.log('解析系统信息serverStatus===>', serverStatus);
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
      docker_version: '24.0.7',
      docker_compose_version: '2.21.0'
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
   * 解析服务器facts信息
   */
  private parseServerFacts(facts: any, server: ServerConfig): ServerStatus {
    // 如果是新的简化格式（来自getBasicServerInfo）
    if (facts && facts.os && !facts.ansible_distribution) {
      return {
        isOnline: true,
        os: facts.os,
        osVersion: '',
        memory: {
          total: facts.memory_mb || 0,
          available: 0,
          used: 0
        },
        disk: {
          total: 0,
          available: 0,
          used: 0
        },
        dockerInstalled: false, // 需要额外检查
        dockerVersion: '',
        dockerComposeInstalled: false,
        dockerComposeVersion: '',
        wordpressRunning: false,
        wordpressUrl: '',
        lastChecked: new Date().toISOString()
      };
    }
    
    // 原始完整格式的处理
    // 解析操作系统信息
    const os = this.parseOSInfo(facts);
    
    // 解析内存信息
    const memory = this.parseMemoryInfo(facts);
    
    // 解析磁盘信息
    const disk = this.parseDiskInfo(facts);
    
    // 检查Docker状态（这里需要额外的检查逻辑）
    const dockerInfo = this.parseDockerInfo(facts);
    
    return {
      isOnline: true,
      os: os.name,
      osVersion: os.version,
      memory,
      disk,
      dockerInstalled: dockerInfo.installed,
      dockerVersion: dockerInfo.version,
      dockerComposeInstalled: dockerInfo.composeInstalled,
      dockerComposeVersion: dockerInfo.composeVersion,
      wordpressRunning: false, // 需要额外检查
      wordpressUrl: dockerInfo.wordpressUrl || '',
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * 解析操作系统信息
   */
  private parseOSInfo(facts: any): { name: string; version: string } {
    const distribution = facts.ansible_distribution || 'unknown';
    const version = facts.ansible_distribution_version || '';
    
    // 标准化OS名称
    let osName = 'unknown';
    if (distribution.toLowerCase().includes('centos')) {
      osName = 'centos';
    } else if (distribution.toLowerCase().includes('rocky')) {
      osName = 'rocky';
    } else if (distribution.toLowerCase().includes('ubuntu')) {
      osName = 'ubuntu';
    } else if (distribution.toLowerCase().includes('debian')) {
      osName = 'debian';
    }
    
    return {
      name: osName,
      version: `${distribution} ${version}`
    };
  }

  /**
   * 解析内存信息
   */
  private parseMemoryInfo(facts: any): { total: number; available: number; used: number } {
    const totalMB = facts.ansible_memtotal_mb || 0;
    const freeMB = facts.ansible_memfree_mb || 0;
    const availableMB = facts.ansible_memory_mb?.real?.available || freeMB;
    
    const total = Math.round((totalMB / 1024) * 100) / 100; // 转换为GB并保留2位小数
    const available = Math.round((availableMB / 1024) * 100) / 100;
    const used = Math.round((total - available) * 100) / 100;
    
    return { total, available, used };
  }

  /**
   * 解析磁盘信息
   */
  private parseDiskInfo(facts: any): { total: number; available: number; used: number } {
    const mounts = facts.ansible_mounts || [];
    
    // 查找根分区
    const rootMount = mounts.find((mount: any) => mount.mount === '/') || mounts[0];
    
    if (!rootMount) {
      return { total: 0, available: 0, used: 0 };
    }
    
    const totalBytes = rootMount.size_total || 0;
    const availableBytes = rootMount.size_available || 0;
    
    const total = Math.round((totalBytes / (1024 ** 3)) * 100) / 100; // 转换为GB
    const available = Math.round((availableBytes / (1024 ** 3)) * 100) / 100;
    const used = Math.round((total - available) * 100) / 100;
    
    return { total, available, used };
  }

  /**
   * 解析Docker信息
   */
  private parseDockerInfo(facts: any): {
    installed: boolean;
    version: string;
    composeInstalled: boolean;
    composeVersion: string;
    wordpressUrl?: string;
  } {
    // 这里需要额外的逻辑来检查Docker状态
    // 可以通过自定义fact或者额外的任务来获取
    
    return {
      installed: false,
      version: '',
      composeInstalled: false,
      composeVersion: '',
      wordpressUrl: undefined
    };
  }
}
