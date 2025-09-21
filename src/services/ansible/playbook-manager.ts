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
  // 新增字段用于HTTPS部署
  siteDomain?: string;
  mysqlRootPassword?: string;
  enableHttps?: boolean;
  caddyConfig?: {
    version?: string;
    httpPort?: number;
    httpsPort?: number;
    autoHttps?: boolean;
  };
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
   * 部署WordPress (现代化v2.0版本)
   */
  async deployWordPress(server: ServerConfig, config: WordPressConfig): Promise<AnsiblePlaybookResult> {
    // 生成安全的默认密码
    const generateSecurePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    // 现代化变量结构 (v2.0)
    const extraVars = {
      // 核心配置
      project_name: config.siteName?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'wordpress-site',
      site_domain: config.siteDomain || server.ip,
      
      // WordPress应用配置
      wordpress_config: {
        version: '6-fpm-alpine',
        site_name: config.siteName || 'My WordPress Site',
        admin_username: config.adminUsername || 'admin',
        admin_password: config.adminPassword,
        admin_email: config.adminEmail || `admin@${config.siteDomain || server.ip}`,
        db_name: config.dbName || 'wordpress',
        db_user: config.dbUser || 'wpuser',
        db_password: config.dbPassword,
        table_prefix: config.tablePrefix || 'wp_',
        memory_limit: '512M',
        upload_max_size: '64M',
        debug: false
      },

      // 数据库配置
      mysql_config: {
        version: '10.11',
        innodb_buffer_pool_size: '512M',
        max_connections: '200',
        slow_query_log: true
      },
      mysql_root_password: config.mysqlRootPassword || generateSecurePassword(),

      // Web服务器配置 (Caddy)
      caddy_config: {
        version: config.caddyConfig?.version || '2-alpine',
        http_port: config.caddyConfig?.httpPort || 80,
        https_port: config.caddyConfig?.httpsPort || 443,
        client_max_body_size: '64M',
        auto_https: config.caddyConfig?.autoHttps !== false
      },

      // 缓存配置
      redis_config: {
        version: '7-alpine',
        enabled: true,
        max_memory: '256mb'
      },

      // SSL配置 (Caddy自动管理)
      ssl_config: {
        enabled: config.enableHttps !== false,
        provider: config.siteDomain && !this.isIpAddress(config.siteDomain) ? 'caddy_auto' : 'caddy_auto',
        email: config.adminEmail || `admin@${config.siteDomain || server.ip}`,
        auto_https: config.caddyConfig?.autoHttps !== false
      },

      // PHP配置
      php_config: {
        memory_limit: '512M',
        upload_max_filesize: '64M',
        max_execution_time: '300',
        opcache_memory: '256'
      },

      // 缓存配置
      cache_config: {
        enabled: true,
        api_enabled: true,
        valid_time: '10m'
      },

      // 备份配置
      backup_config: {
        enabled: true,
        retention_days: '7',
        database_enabled: true,
        files_enabled: true,
        compress: true,
        schedule_hour: '2'
      },

      // 监控配置 (可选)
      monitoring_config: {
        enabled: false,  // 默认禁用，可根据需求启用
        prometheus_port: '9090',
        grafana_port: '3000',
        grafana_password: generateSecurePassword().substring(0, 12)
      },

      // 部署配置
      deployment_config: {
        project_dir: '/opt/wordpress'
      }
    };

    return await this.ansibleClient.runPlaybook('wordpress-deploy', [server], extraVars);
  }

  /**
   * 检查是否为IP地址
   */
  private isIpAddress(domain: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(domain) || ipv6Regex.test(domain);
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
