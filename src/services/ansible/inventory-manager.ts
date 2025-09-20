/**
 * Inventory管理器
 * 管理Ansible inventory文件和主机配置
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { ServerConfig } from './ansible-client';

/**
 * 主机组配置接口
 */
export interface HostGroup {
  name: string;
  hosts: Record<string, HostConfig>;
  vars?: Record<string, any>;
}

/**
 * 主机配置接口
 */
export interface HostConfig {
  ansible_host: string;
  ansible_user: string;
  ansible_password?: string;
  ansible_ssh_private_key_file?: string;
  ansible_port?: number;
  ansible_ssh_common_args?: string;
  [key: string]: any;
}

/**
 * Inventory配置接口
 */
export interface InventoryConfig {
  all: {
    hosts?: Record<string, HostConfig>;
    children?: Record<string, HostGroup>;
    vars?: Record<string, any>;
  };
}

/**
 * Inventory管理器类
 */
export class InventoryManager {
  private inventoryDir: string;
  private defaultInventoryFile: string;

  constructor() {
    this.inventoryDir = path.join(process.cwd(), 'ansible', 'inventory');
    this.defaultInventoryFile = path.join(this.inventoryDir, 'hosts.yml');
  }

  /**
   * 创建临时inventory文件
   */
  async createTempInventory(servers: ServerConfig[], groupName = 'wordpress_servers'): Promise<string> {
    const inventory: InventoryConfig = {
      all: {
        children: {
          [groupName]: {
            name: groupName,
            hosts: {},
            vars: {
              ansible_ssh_common_args: '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null',
              ansible_become: true,
              ansible_become_method: 'sudo'
            }
          }
        }
      }
    };

    // 添加服务器到主机组
    servers.forEach((server, index) => {
      const hostName = `server_${index + 1}`;
      inventory.all.children![groupName].hosts[hostName] = {
        ansible_host: server.ip,
        ansible_user: server.username,
        ansible_password: server.password,
        ansible_port: server.port || 22,
        ansible_ssh_common_args: '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null',
        server_os: server.os || 'centos'
      };
    });

    // 生成临时文件
    const tempFileName = `temp_inventory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.yml`;
    const tempFilePath = path.join('/tmp', tempFileName);
    
    const yamlContent = yaml.stringify(inventory, {
      indent: 2,
      lineWidth: 0
    });

    await fs.writeFile(tempFilePath, yamlContent, 'utf8');
    return tempFilePath;
  }

  /**
   * 创建持久化inventory文件
   */
  async createPersistentInventory(
    servers: ServerConfig[], 
    fileName: string,
    groupName = 'wordpress_servers'
  ): Promise<string> {
    // 确保inventory目录存在
    await this.ensureInventoryDir();

    const inventory: InventoryConfig = {
      all: {
        vars: {
          ansible_ssh_common_args: '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null',
          ansible_become: true,
          ansible_become_method: 'sudo',
          ansible_python_interpreter: '/usr/bin/python3'
        },
        children: {
          [groupName]: {
            name: groupName,
            hosts: {},
            vars: {
              wordpress_version: 'latest',
              mysql_version: '10.6',
              nginx_version: 'latest'
            }
          }
        }
      }
    };

    // 添加服务器配置
    servers.forEach((server, index) => {
      const hostName = this.generateHostName(server.ip, index);
      inventory.all.children![groupName].hosts[hostName] = {
        ansible_host: server.ip,
        ansible_user: server.username,
        ansible_password: server.password,
        ansible_port: server.port || 22,
        server_os: server.os || 'centos',
        server_role: 'wordpress'
      };
    });

    const filePath = path.join(this.inventoryDir, fileName);
    const yamlContent = yaml.stringify(inventory, {
      indent: 2,
      lineWidth: 0
    });

    await fs.writeFile(filePath, yamlContent, 'utf8');
    return filePath;
  }

  /**
   * 读取inventory文件
   */
  async readInventory(fileName?: string): Promise<InventoryConfig | null> {
    try {
      const filePath = fileName 
        ? path.join(this.inventoryDir, fileName)
        : this.defaultInventoryFile;
      
      const content = await fs.readFile(filePath, 'utf8');
      return yaml.parse(content) as InventoryConfig;
    } catch (error) {
      console.error('读取inventory文件失败:', error);
      return null;
    }
  }

  /**
   * 更新inventory文件中的主机配置
   */
  async updateHostConfig(
    hostName: string, 
    config: Partial<HostConfig>, 
    fileName?: string
  ): Promise<boolean> {
    try {
      const inventory = await this.readInventory(fileName);
      if (!inventory) {
        return false;
      }

      // 查找并更新主机配置
      let hostFound = false;
      
      // 检查根级hosts
      if (inventory.all.hosts && inventory.all.hosts[hostName]) {
        Object.assign(inventory.all.hosts[hostName], config);
        hostFound = true;
      }

      // 检查子组中的hosts
      if (inventory.all.children) {
        for (const group of Object.values(inventory.all.children)) {
          if (group.hosts && group.hosts[hostName]) {
            Object.assign(group.hosts[hostName], config);
            hostFound = true;
            break;
          }
        }
      }

      if (!hostFound) {
        return false;
      }

      // 保存更新后的inventory
      const filePath = fileName 
        ? path.join(this.inventoryDir, fileName)
        : this.defaultInventoryFile;
      
      const yamlContent = yaml.stringify(inventory, {
        indent: 2,
        lineWidth: 0
      });

      await fs.writeFile(filePath, yamlContent, 'utf8');
      return true;
    } catch (error) {
      console.error('更新主机配置失败:', error);
      return false;
    }
  }

  /**
   * 添加主机到inventory
   */
  async addHost(
    hostName: string, 
    config: HostConfig, 
    groupName = 'wordpress_servers',
    fileName?: string
  ): Promise<boolean> {
    try {
      let inventory = await this.readInventory(fileName);
      
      // 如果inventory不存在，创建新的
      if (!inventory) {
        inventory = {
          all: {
            children: {}
          }
        };
      }

      // 确保子组存在
      if (!inventory.all.children) {
        inventory.all.children = {};
      }

      if (!inventory.all.children[groupName]) {
        inventory.all.children[groupName] = {
          name: groupName,
          hosts: {}
        };
      }

      // 添加主机
      inventory.all.children[groupName].hosts[hostName] = config;

      // 保存inventory
      const filePath = fileName 
        ? path.join(this.inventoryDir, fileName)
        : this.defaultInventoryFile;
      
      const yamlContent = yaml.stringify(inventory, {
        indent: 2,
        lineWidth: 0
      });

      await fs.writeFile(filePath, yamlContent, 'utf8');
      return true;
    } catch (error) {
      console.error('添加主机失败:', error);
      return false;
    }
  }

  /**
   * 从inventory中移除主机
   */
  async removeHost(hostName: string, fileName?: string): Promise<boolean> {
    try {
      const inventory = await this.readInventory(fileName);
      if (!inventory) {
        return false;
      }

      let hostRemoved = false;

      // 从根级hosts中移除
      if (inventory.all.hosts && inventory.all.hosts[hostName]) {
        delete inventory.all.hosts[hostName];
        hostRemoved = true;
      }

      // 从子组中移除
      if (inventory.all.children) {
        for (const group of Object.values(inventory.all.children)) {
          if (group.hosts && group.hosts[hostName]) {
            delete group.hosts[hostName];
            hostRemoved = true;
          }
        }
      }

      if (!hostRemoved) {
        return false;
      }

      // 保存更新后的inventory
      const filePath = fileName 
        ? path.join(this.inventoryDir, fileName)
        : this.defaultInventoryFile;
      
      const yamlContent = yaml.stringify(inventory, {
        indent: 2,
        lineWidth: 0
      });

      await fs.writeFile(filePath, yamlContent, 'utf8');
      return true;
    } catch (error) {
      console.error('移除主机失败:', error);
      return false;
    }
  }

  /**
   * 列出inventory中的所有主机
   */
  async listHosts(fileName?: string): Promise<string[]> {
    try {
      const inventory = await this.readInventory(fileName);
      if (!inventory) {
        return [];
      }

      const hosts: string[] = [];

      // 收集根级hosts
      if (inventory.all.hosts) {
        hosts.push(...Object.keys(inventory.all.hosts));
      }

      // 收集子组中的hosts
      if (inventory.all.children) {
        for (const group of Object.values(inventory.all.children)) {
          if (group.hosts) {
            hosts.push(...Object.keys(group.hosts));
          }
        }
      }

      return [...new Set(hosts)]; // 去重
    } catch (error) {
      console.error('列出主机失败:', error);
      return [];
    }
  }

  /**
   * 清理临时inventory文件
   */
  async cleanupTempInventory(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // 忽略清理错误
    }
  }

  /**
   * 确保inventory目录存在
   */
  private async ensureInventoryDir(): Promise<void> {
    try {
      await fs.access(this.inventoryDir);
    } catch (error) {
      await fs.mkdir(this.inventoryDir, { recursive: true });
    }
  }

  /**
   * 生成主机名
   */
  private generateHostName(ip: string, index: number): string {
    const ipSuffix = ip.split('.').slice(-2).join('_');
    return `wp_server_${ipSuffix}_${index + 1}`;
  }
}
