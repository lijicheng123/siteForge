/**
 * Ansible客户端服务
 * 封装Ansible命令执行和结果处理
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';

const execAsync = promisify(exec);

// Ansible执行结果接口
export interface AnsibleExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  parsedResult?: any;
}

// Ansible任务结果接口
export interface AnsibleTaskResult {
  taskName: string;
  status: 'success' | 'failed' | 'skipped' | 'changed';
  message: string;
  changed: boolean;
  stdout: string;
  stderr: string;
  startTime: string;
  endTime: string;
  duration: number;
}

// Ansible Playbook结果接口
export interface AnsiblePlaybookResult {
  playbookName: string;
  status: 'success' | 'failed' | 'running';
  totalTasks: number;
  successTasks: number;
  failedTasks: number;
  skippedTasks: number;
  tasks: AnsibleTaskResult[];
  startTime: string;
  endTime?: string;
  duration: number;
  summary: string;
}

// 服务器配置接口
export interface ServerConfig {
  ip: string;
  username: string;
  password: string;
  port?: number;
  os?: string;
}

/**
 * Ansible客户端类
 */
export class AnsibleClient {
  private ansiblePath: string;
  private playbooksPath: string;
  private inventoryPath: string;

  constructor() {
    this.ansiblePath = process.env.ANSIBLE_PATH || 'ansible-playbook';
    this.playbooksPath = path.join(process.cwd(), 'ansible', 'playbooks');
    this.inventoryPath = path.join(process.cwd(), 'ansible', 'inventory');
  }

  /**
   * 执行Ansible Playbook
   */
  async runPlaybook(
    playbookName: string, 
    servers: ServerConfig[], 
    extraVars?: Record<string, any>
  ): Promise<AnsiblePlaybookResult> {
    const startTime = new Date();
    
    try {
      // 生成临时inventory文件
      const inventoryFile = await this.generateInventory(servers);
      
      // 构建Ansible命令
      const playbookPath = path.join(this.playbooksPath, `${playbookName}.yml`);
      let command = `${this.ansiblePath} -i ${inventoryFile} ${playbookPath}`;
      
      // 添加额外变量
      if (extraVars) {
        const varsString = Object.entries(extraVars)
          .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
          .join(' ');
        command += ` --extra-vars "${varsString}"`;
      }
      
      // 添加其他选项
      command += ' --become --become-method=sudo';
      command += ' -v'; // 详细输出
      
      console.log(`执行Ansible命令: ${command}`);
      
      // 执行命令
      const result = await this.executeCommand(command);
      
      // 解析结果
      const parsedResult = this.parsePlaybookOutput(result.stdout, result.stderr);
      
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      
      // 清理临时文件
      await this.cleanupTempFile(inventoryFile);
      
      return {
        playbookName,
        status: result.success ? 'success' : 'failed',
        totalTasks: parsedResult.totalTasks,
        successTasks: parsedResult.successTasks,
        failedTasks: parsedResult.failedTasks,
        skippedTasks: parsedResult.skippedTasks,
        tasks: parsedResult.tasks,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        summary: result.success ? 'Playbook执行成功' : `Playbook执行失败: ${result.stderr}`
      };
      
    } catch (error) {
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      
      return {
        playbookName,
        status: 'failed',
        totalTasks: 0,
        successTasks: 0,
        failedTasks: 1,
        skippedTasks: 0,
        tasks: [],
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        summary: `Playbook执行异常: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 检查Ansible是否可用
   */
  async checkAnsibleAvailable(): Promise<boolean> {
    try {
      const result = await this.executeCommand('ansible --version');
      return result.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * 测试服务器连接
   */
  async testConnection(server: ServerConfig): Promise<boolean> {
    try {
      const inventoryFile = await this.generateInventory([server]);
      const command = `ansible all -i ${inventoryFile} -m ping --become`;

      console.log('测试服务器连接command===>', command);
      
      const result = await this.executeCommand(command);

      console.log('测试服务器连接result===>', result);
      await this.cleanupTempFile(inventoryFile);
      
      return result.success && result.stdout.includes('SUCCESS');
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取服务器信息（完整版）
   */
  async gatherFacts(server: ServerConfig): Promise<any> {
    try {
      const inventoryFile = await this.generateInventory([server]);
      
      // 只收集必要的系统信息，大大减少数据量和执行时间
      const gatherSubset = [
        'hardware',     // CPU、内存、磁盘信息
        'network',      // 网络接口信息
        'virtual',      // 虚拟化信息
        'distribution', // 操作系统信息
        'date_time'     // 时间信息
      ].join(',');
      
      const command = `ansible all -i ${inventoryFile} -m setup --become -a "gather_subset=${gatherSubset}"`;
      
      const result = await this.executeCommand(command);
      await this.cleanupTempFile(inventoryFile);
      
      if (result.success) {
        // 解析setup模块的输出
        return this.parseSetupOutput(result.stdout);
      }
      
      return null;
    } catch (error) {
      console.error('收集系统信息失败:', error);
      return null;
    }
  }

  /**
   * 快速获取基本服务器信息（轻量版）
   */
  async getBasicServerInfo(server: ServerConfig): Promise<any> {
    try {
      const inventoryFile = await this.generateInventory([server]);
      
      // 只收集最基本的信息：分发版本和硬件概要
      const command = `ansible all -i ${inventoryFile} -m setup --become -a "gather_subset=min"`;
      
      const result = await this.executeCommand(command);
      await this.cleanupTempFile(inventoryFile);
      
      if (result.success) {
        const facts = this.parseSetupOutput(result.stdout);
        if (facts) {
          // 提取关键信息
          return {
            os: facts.ansible_distribution + ' ' + facts.ansible_distribution_version,
            hostname: facts.ansible_hostname,
            architecture: facts.ansible_architecture,
            python_version: facts.ansible_python_version,
            memory_mb: facts.ansible_memtotal_mb,
            processor_count: facts.ansible_processor_count,
            uptime: facts.ansible_uptime_seconds
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('获取基本服务器信息失败:', error);
      return null;
    }
  }

  /**
   * 生成临时inventory文件
   */
  private async generateInventory(servers: ServerConfig[]): Promise<string> {
    const inventory = {
      all: {
        hosts: {} as Record<string, any>
      }
    };

    servers.forEach((server, index) => {
      const hostName = `server_${index}`;
      inventory.all.hosts[hostName] = {
        ansible_host: server.ip,
        ansible_user: server.username,
        ansible_password: server.password,
        ansible_port: server.port || 22,
        ansible_ssh_common_args: '-o StrictHostKeyChecking=no'
      };
    });

    const inventoryContent = yaml.stringify(inventory);
    const tempFile = path.join('/tmp', `inventory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.yml`);
    
    await fs.writeFile(tempFile, inventoryContent);
    return tempFile;
  }

  /**
   * 执行系统命令
   */
  private async executeCommand(command: string): Promise<AnsibleExecutionResult> {
    const startTime = Date.now();
    
    console.log('执行系统命令command===>', command);
    try {

      const { stdout, stderr } = await execAsync(command, {
        timeout: 300000, // 5分钟超时
        maxBuffer: 1024 * 1024 * 10 // 10MB缓冲区
      });


      
      const duration = (Date.now() - startTime) / 1000;
      console.log('执行系统命令stdout===>', stdout, duration);
      console.log('执行系统命令stderr===>', stderr, duration);

      return {
        success: true,
        stdout,
        stderr,
        exitCode: 0,
        duration
      };
    } catch (error: any) {
      const duration = (Date.now() - startTime) / 1000;
      console.log('执行系统命令error===>', error, duration);
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
        duration
      };
    }
  }

  /**
   * 解析Playbook输出
   */
  private parsePlaybookOutput(stdout: string, stderr: string): any {
    // 这里应该解析Ansible的输出格式
    // 由于Ansible输出格式复杂，这里提供基础实现
    const lines = stdout.split('\n');
    const tasks: AnsibleTaskResult[] = [];
    let totalTasks = 0;
    let successTasks = 0;
    let failedTasks = 0;
    let skippedTasks = 0;

    // 简单的解析逻辑，实际应该更复杂
    for (const line of lines) {
      if (line.includes('TASK [')) {
        totalTasks++;
        const taskName = line.match(/TASK \[(.*?)\]/)?.[1] || 'Unknown Task';
        
        // 模拟任务结果
        const taskResult: AnsibleTaskResult = {
          taskName,
          status: 'success',
          message: '任务执行成功',
          changed: true,
          stdout: line,
          stderr: '',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 1
        };
        
        tasks.push(taskResult);
        successTasks++;
      }
    }

    return {
      totalTasks,
      successTasks,
      failedTasks,
      skippedTasks,
      tasks
    };
  }

  /**
   * 解析setup模块输出
   */
  private parseSetupOutput(stdout: string): any {
    try {
      // 先去除ansible输出的前缀（server_0 | SUCCESS => ）
      const lines = stdout.split('\n');
      let jsonStart = -1;
      let jsonEnd = -1;
      let braceCount = 0;
      
      // 查找JSON开始位置
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('SUCCESS =>') || lines[i].trim().startsWith('{')) {
          if (lines[i].trim().endsWith('{') || lines[i].includes('{')) {
            jsonStart = i;
            if (lines[i].includes('{')) {
              braceCount = (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
            }
            break;
          }
        }
      }
      
      if (jsonStart === -1) return null;
      
      // 查找JSON结束位置
      for (let i = jsonStart + 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          braceCount += (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
          if (braceCount === 0) {
            jsonEnd = i;
            break;
          }
        }
      }
      
      if (jsonEnd === -1) return null;
      
      // 提取并解析JSON
      let jsonStr = '';
      for (let i = jsonStart; i <= jsonEnd; i++) {
        let line = lines[i];
        if (i === jsonStart && line.includes('SUCCESS =>')) {
          line = line.substring(line.indexOf('{'));
        }
        jsonStr += line + '\n';
      }
      
      const parsed = JSON.parse(jsonStr.trim());
      return parsed.ansible_facts || parsed;
      
    } catch (error) {
      console.error('解析setup输出失败:', error);
      // 备用解析方法：直接查找JSON块
      try {
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed.ansible_facts || parsed;
        }
      } catch (backupError) {
        console.error('备用解析也失败:', backupError);
      }
      return null;
    }
  }

  /**
   * 清理临时文件
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // 忽略清理错误
    }
  }
}
