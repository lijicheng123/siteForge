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
    let inventoryFile: string | null = null;
    let extraVarsFile: string | null = null;
    
    try {
      // 生成临时inventory文件
      inventoryFile = await this.generateInventory(servers);
      
      // 构建Ansible命令
      const playbookPath = path.join(this.playbooksPath, `${playbookName}.yml`);
      let command = `${this.ansiblePath} -i ${inventoryFile} ${playbookPath}`;
      
      // 添加额外变量
      if (extraVars) {
        // 使用临时文件传递变量，避免命令行转义问题
        extraVarsFile = await this.createTempVarsFile(extraVars);
        command += ` --extra-vars @${extraVarsFile}`;
      }
      
      // 添加其他选项
      command += ' --become --become-method=sudo';
      // 只在调试模式下显示详细输出，正常情况下保持简洁
      // command += ' -v'; // 详细输出 - 已禁用以减少日志噪音
      
      console.log(`执行Ansible命令: ${command}`);
      
      // 执行命令
      const result = await this.executeCommand(command);
      
      // 解析结果
      const parsedResult = this.parsePlaybookOutput(result.stdout, result.stderr);
      
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      
      // 清理临时文件
      await this.cleanupTempFile(inventoryFile);
      if (extraVarsFile) {
        await this.cleanupTempFile(extraVarsFile);
      }
      
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
      
      // 清理临时文件（即使发生异常）
      try {
        if (inventoryFile) await this.cleanupTempFile(inventoryFile);
        if (extraVarsFile) await this.cleanupTempFile(extraVarsFile);
      } catch {
        // 忽略清理错误
      }
      
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
   * TODO: 这个方法是不是可以删除了？
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
   * 获取服务器信息（超简单版本）
   */
  async getServerInfo(server: ServerConfig): Promise<any> {
    try {
      const inventoryFile = await this.generateInventory([server]);
      
      // 使用最简单的命令，避免复杂语法
      const command = `ansible all -i ${inventoryFile} -m shell --become -a 'cat /etc/redhat-release 2>/dev/null || cat /etc/os-release | head -1; hostname; uname -m; cat /proc/cpuinfo | grep processor | wc -l; free -m | grep Mem; df -h /; python3 --version 2>/dev/null || python --version 2>/dev/null || echo No Python; docker --version 2>/dev/null || echo No Docker; docker compose version 2>/dev/null || docker-compose --version 2>/dev/null || echo No Docker Compose; wp --version 2>/dev/null || echo No WP-CLI'`;
      
      const result = await this.executeCommand(command);
      await this.cleanupTempFile(inventoryFile);
      
      if (result.success) {
        return this.parseSimpleInfo(result.stdout);
      }
      
      return null;
    } catch (error) {
      console.error('获取服务器信息失败:', error);
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
        ansible_ssh_common_args: '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PasswordAuthentication=yes -o PubkeyAuthentication=no'
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
        timeout: 1800000, // 15分钟超时 - 适应完整的WordPress部署流程
        maxBuffer: 1024 * 1024 * 50 // 50MB缓冲区 - 增加以处理详细输出
      });


      
      const duration = (Date.now() - startTime) / 1000;
      // 只显示关键信息，避免日志截断
      console.log(`执行系统命令完成 (${duration}s) - stdout长度: ${stdout.length}, stderr长度: ${stderr.length}`);
      if (stderr && stderr.length > 0) {
        console.log('执行系统命令stderr===>', stderr.length > 1000 ? stderr.substring(stderr.length - 1000) : stderr);
      }

      return {
        success: true,
        stdout,
        stderr,
        exitCode: 0,
        duration
      };
    } catch (error: any) {
      const duration = (Date.now() - startTime) / 1000;
      console.log(`执行系统命令失败 (${duration}s):`);
      console.log('错误码:', error.code);
      console.log('错误消息:', error.message);
      if (error.stdout) {
        console.log('最后的stdout (最多1000字符):', error.stdout.length > 1000 ? 
          error.stdout.substring(error.stdout.length - 1000) : error.stdout);
      }
      if (error.stderr) {
        console.log('完整stderr:', error.stderr);
      }
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
   * 解析Playbook输出 - 修复版本
   */
  private parsePlaybookOutput(stdout: string, stderr: string): any {
    const lines = stdout.split('\n');
    const tasks: AnsibleTaskResult[] = [];
    let totalTasks = 0;
    let successTasks = 0;
    let failedTasks = 0;
    let skippedTasks = 0;

    let currentTask = '';
    let currentTaskStatus = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 识别任务开始
      if (line.includes('TASK [')) {
        totalTasks++;
        currentTask = line.match(/TASK \[(.*?)\]/)?.[1] || 'Unknown Task';
      }
      
      // 识别任务结果状态
      else if (line.includes(': [server_0]: FAILED!')) {
        failedTasks++;
        currentTaskStatus = 'failed';
        
        // 尝试提取错误信息
        let errorMsg = '';
        const nextLine = lines[i + 1];
        if (nextLine && nextLine.includes('"msg":')) {
          const msgMatch = nextLine.match(/"msg":\s*"([^"]+)"/);
          if (msgMatch) {
            errorMsg = msgMatch[1];
          }
        }
        
        const taskResult: AnsibleTaskResult = {
          taskName: currentTask,
          status: 'failed',
          message: errorMsg || '任务执行失败',
          changed: false,
          stdout: line,
          stderr: errorMsg,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 1
        };
        
        tasks.push(taskResult);
      }
      
      else if (line.includes(': [server_0]: ok:') || line.includes(': [server_0]')) {
        if (currentTask && !tasks.find(t => t.taskName === currentTask)) {
          successTasks++;
          const taskResult: AnsibleTaskResult = {
            taskName: currentTask,
            status: 'success',
            message: '任务执行成功',
            changed: line.includes('changed'),
            stdout: line,
            stderr: '',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: 1
          };
          
          tasks.push(taskResult);
        }
      }
      
      else if (line.includes('skipped')) {
        skippedTasks++;
        if (currentTask && !tasks.find(t => t.taskName === currentTask)) {
          const taskResult: AnsibleTaskResult = {
            taskName: currentTask,
            status: 'skipped',
            message: '任务被跳过',
            changed: false,
            stdout: line,
            stderr: '',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: 1
          };
          
          tasks.push(taskResult);
        }
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
   * 解析简单信息（超简单解析）
   */
  private parseSimpleInfo(stdout: string): any {
    const lines = stdout.split('\n').map(l => l.trim()).filter(l => l && !l.includes('SUCCESS') && !l.includes('CHANGED'));
    
    
    const result = {
      os: 'unknown',
      osVersion: '',
      hostname: 'unknown',
      architecture: 'unknown',
      pythonVersions: [] as string[],
      cpu: { count: 0, cores: 0, model: 'unknown' },
      memory: { total: 0, free: 0 },
      disk: { total: 0, used: 0, available: 0, percentage: 0 },
      docker: { installed: false, version: '', composeInstalled: false, composeVersion: '', running: false },
      wpCli: { installed: false, version: '' }
    };

    if (lines.length >= 4) {
      // 第1行: OS信息
      const osLine = lines[0];
      if (osLine.includes('Rocky') || osLine.includes('CentOS')) {
        result.os = osLine.includes('Rocky') ? 'Rocky Linux' : 'CentOS';
        result.osVersion = osLine.match(/[\d\.]+/)?.[0] || '';
      } else {
        result.os = osLine;
      }

      // 第2行: 主机名
      result.hostname = lines[1];

      // 第3行: 架构
      result.architecture = lines[2];

      // 第4行: CPU核心数
      result.cpu.count = parseInt(lines[3]) || 0;
      result.cpu.cores = result.cpu.count;

      // 查找内存信息 (格式: Mem: 1699 292 327...)
      for (let i = 4; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('Mem:')) {
          const memParts = line.split(/\s+/);
          if (memParts.length >= 4) {
            result.memory.total = Math.round(parseInt(memParts[1]) / 1024 * 100) / 100; // MB转GB
            result.memory.free = Math.round(parseInt(memParts[3]) / 1024 * 100) / 100;
          }
          break;
        }
      }

      // 查找磁盘信息 (查找包含/dev/的行，格式: /dev/vda3 40G 3.6G 37G 9% /)
      for (let i = 4; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('/dev/') && line.includes('G')) {
          const diskParts = line.split(/\s+/);
          if (diskParts.length >= 5) {
            result.disk.total = this.parseSize(diskParts[1]);
            result.disk.used = this.parseSize(diskParts[2]);
            result.disk.available = this.parseSize(diskParts[3]);
            result.disk.percentage = parseInt(diskParts[4].replace('%', '')) || 0;
          }
          break;
        }
      }

      // 查找软件版本信息
      for (let i = 4; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('Python') && !line.includes('No Python')) {
          result.pythonVersions.push(line);
        }
        
        if (line.includes('Docker version') && !line.includes('No Docker')) {
          result.docker.installed = true;
          result.docker.version = line;
        }
        
        if ((line.includes('Docker Compose version') || line.includes('docker-compose version')) && !line.includes('No Docker Compose')) {
          result.docker.composeInstalled = true;
          result.docker.composeVersion = line;
        }
        
        if (line.includes('WP-CLI') && !line.includes('No WP-CLI')) {
          result.wpCli.installed = true;
          result.wpCli.version = line;
        }
      }
    }

    return result;
  }

  /**
   * 解析磁盘大小（将K、M、G、T转换为GB）
   */
  private parseSize(sizeStr: string): number {
    if (!sizeStr) return 0;
    
    const size = parseFloat(sizeStr);
    const unit = sizeStr.slice(-1).toUpperCase();
    
    switch (unit) {
      case 'K': return Math.round(size / 1024 / 1024 * 100) / 100;
      case 'M': return Math.round(size / 1024 * 100) / 100;
      case 'G': return Math.round(size * 100) / 100;
      case 'T': return Math.round(size * 1024 * 100) / 100;
      default: return Math.round(size / 1024 / 1024 / 1024 * 100) / 100;
    }
  }

  /**
   * 创建临时变量文件
   */
  private async createTempVarsFile(extraVars: Record<string, any>): Promise<string> {
    const tempFileName = `vars_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
    const tempFilePath = path.join('/tmp', tempFileName);
    
    const jsonContent = JSON.stringify(extraVars, null, 2);
    await fs.writeFile(tempFilePath, jsonContent, 'utf8');
    
    return tempFilePath;
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
