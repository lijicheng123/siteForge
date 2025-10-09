/**
 * Ansible客户端服务
 * 封装Ansible命令执行和结果处理
 */

import { exec, spawn } from 'child_process';
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
      // 启用详细输出以便查看进度（临时调试）
      command += ' -v'; // 详细输出 - 帮助诊断长时间等待问题
      
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
      
      // 提取真正的错误信息（不包括警告）
      let errorSummary = result.stderr;
      if (!result.success && result.stdout) {
        // 从 stdout 中提取 fatal 错误信息
        const fatalLines: string[] = [];
        const lines = result.stdout.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('fatal:') || line.includes('FAILED!')) {
            // 找到 fatal 行，提取任务名和错误
            let taskName = '';
            // 往前找任务名
            for (let j = i - 1; j >= 0 && j >= i - 5; j--) {
              if (lines[j].includes('TASK [')) {
                taskName = lines[j].trim();
                break;
              }
            }
            if (taskName) fatalLines.push(taskName);
            fatalLines.push(line.trim());
            
            // 提取 JSON 错误信息
            const jsonMatch = line.match(/\{[^}]*"msg":\s*"([^"]+)"[^}]*\}/);
            if (jsonMatch && jsonMatch[1]) {
              fatalLines.push(`错误详情: ${jsonMatch[1]}`);
            }
            
            const failuresMatch = line.match(/"failures":\s*\[([^\]]+)\]/);
            if (failuresMatch && failuresMatch[1]) {
              fatalLines.push(`失败信息: ${failuresMatch[1]}`);
            }
          }
        }
        
        if (fatalLines.length > 0) {
          errorSummary = fatalLines.join('\n');
        }
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
        summary: result.success ? 'Playbook执行成功' : `Playbook执行失败: ${errorSummary}`
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
   * 执行系统命令（使用 spawn 实现实时输出）
   */
  private async executeCommand(command: string): Promise<AnsibleExecutionResult> {
    const startTime = Date.now();
    
    console.log('执行系统命令command===>', command);
    
    return new Promise((resolve, reject) => {
      // 使用 spawn 而不是 exec，以获得实时输出
      const args = command.split(' ');
      const cmd = args.shift()!;
      const child = spawn(cmd, args, {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let lastOutputTime = Date.now();
      
      // 实时输出 stdout
      child.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        // 实时打印到控制台
        process.stdout.write(output);
        lastOutputTime = Date.now();
      });
      
      // 实时输出 stderr
      child.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        // stderr 也实时打印（通常是 Ansible 的进度信息）
        process.stderr.write(output);
        lastOutputTime = Date.now();
      });
      
      // 超时检查（15分钟）
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('命令执行超时（15分钟）'));
      }, 1800000);
      
      // 进程退出
      child.on('close', (code) => {
        clearTimeout(timeout);
        const duration = (Date.now() - startTime) / 1000;
        
        console.log(`\n执行系统命令完成 (${duration}s) - 退出码: ${code}, stdout长度: ${stdout.length}, stderr长度: ${stderr.length}`);
        
        try {

          // 检查关键错误：主机匹配失败
          if (stderr.includes('Could not match supplied host pattern')) {
            console.error('❌ Ansible 致命错误：未找到匹配的主机！');
            resolve({
              success: false,
              stdout,
              stderr: 'Ansible 未能匹配到目标主机。请检查 inventory 配置。',
              exitCode: code || 1,
              duration
            });
            return;
          }

          // 检查是否有跳过所有主机的情况
          if (stdout.includes('skipping: no hosts matched')) {
            console.error('❌ Ansible 致命错误：没有主机被执行！');
            resolve({
              success: false,
              stdout,
              stderr: 'Ansible playbook 没有在任何主机上执行。',
              exitCode: code || 1,
              duration
            });
            return;
          }

          // 根据退出码判断成功/失败
          resolve({
            success: code === 0,
            stdout,
            stderr,
            exitCode: code || 0,
            duration
          });
        } catch (error: any) {
          console.error('解析命令结果时出错:', error);
          resolve({
            success: false,
            stdout,
            stderr: error.message,
            exitCode: code || 1,
            duration
          });
        }
      });
      
      // 进程错误
      child.on('error', (error) => {
        clearTimeout(timeout);
        const duration = (Date.now() - startTime) / 1000;
        console.error(`执行系统命令失败 (${duration}s):`, error);
        resolve({
          success: false,
          stdout,
          stderr: error.message,
          exitCode: 1,
          duration
        });
      });
    });
  }

  /**
   * 解析Playbook输出 - 使用 PLAY RECAP 作为可靠来源
   */
  private parsePlaybookOutput(stdout: string, stderr: string): any {
    const lines = stdout.split('\n');
    const tasks: AnsibleTaskResult[] = [];
    let totalTasks = 0;
    let successTasks = 0;
    let failedTasks = 0;
    let skippedTasks = 0;
    let changedTasks = 0;

    // =========================================================================
    // 首先从 PLAY RECAP 获取准确的统计数据（最可靠）
    // 格式: server_0  : ok=85   changed=7    unreachable=0    failed=0    skipped=56
    // =========================================================================
    const playRecapLine = lines.find(line => 
      line.includes('server_0') && 
      line.includes('ok=') && 
      line.includes('failed=')
    );
    
    if (playRecapLine) {
      const okMatch = playRecapLine.match(/ok=(\d+)/);
      const changedMatch = playRecapLine.match(/changed=(\d+)/);
      const failedMatch = playRecapLine.match(/failed=(\d+)/);
      const skippedMatch = playRecapLine.match(/skipped=(\d+)/);
      
      if (okMatch) successTasks = parseInt(okMatch[1]);
      if (changedMatch) changedTasks = parseInt(changedMatch[1]);
      if (failedMatch) failedTasks = parseInt(failedMatch[1]);
      if (skippedMatch) skippedTasks = parseInt(skippedMatch[1]);
      
      // 总任务数 = 成功 + 失败 + 跳过
      totalTasks = successTasks + failedTasks;
    }

    // =========================================================================
    // 然后解析详细的任务信息（用于调试和日志）
    // =========================================================================
    let currentTask = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 识别任务开始
      if (line.includes('TASK [')) {
        currentTask = line.match(/TASK \[(.*?)\]/)?.[1] || 'Unknown Task';
      }
      
      // 识别失败的任务（用于详细错误信息）
      else if (line.includes('fatal:') || line.includes('FAILED!')) {
        // 尝试提取错误信息
        let errorMsg = '';
        const jsonMatch = line.match(/\{[^}]*"msg":\s*"([^"]+)"[^}]*\}/);
        if (jsonMatch && jsonMatch[1]) {
          errorMsg = jsonMatch[1];
        }
        
        const taskResult: AnsibleTaskResult = {
          taskName: currentTask || 'Unknown Task',
          status: 'failed',
          message: errorMsg || '任务执行失败',
          changed: false,
          stdout: line,
          stderr: errorMsg,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 1
        };
        
        // 避免重复添加
        if (!tasks.find(t => t.taskName === taskResult.taskName && t.status === 'failed')) {
          tasks.push(taskResult);
        }
      }
    }

    return {
      totalTasks,
      successTasks,
      failedTasks,
      skippedTasks,
      changedTasks,
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
