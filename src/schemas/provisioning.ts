/**
 * 部署相关Schema定义
 * 包含服务器配置、部署状态、Ansible结果等Schema
 */

import { objectSchema, arraySchema, nameSchema, descriptionSchema, responseSchema } from './base';

// IP地址验证Schema
export const ipAddressSchema = {
  type: 'string',
  pattern: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
  description: 'IPv4地址格式'
};

// 端口号Schema
export const portSchema = {
  type: 'number',
  minimum: 1,
  maximum: 65535,
  default: 22
};

// 操作系统类型Schema
export const osTypeSchema = {
  type: 'string',
  enum: ['centos', 'rocky', 'ubuntu', 'debian', 'unknown'],
  description: '支持的操作系统类型'
};

// 服务器配置Schema
export const serverConfigSchema = objectSchema({
  ip: ipAddressSchema,
  username: {
    type: 'string',
    minLength: 1,
    maxLength: 50,
    pattern: '^[a-zA-Z0-9_-]+$'
  },
  password: {
    type: 'string',
    minLength: 1,
    maxLength: 200
  },
  port: portSchema,
  os: osTypeSchema
}, ['ip', 'username', 'password']);

// 服务器状态Schema
export const serverStatusSchema = objectSchema({
  isOnline: { type: 'boolean' },
  os: osTypeSchema,
  osVersion: { type: 'string' },
  memory: {
    type: 'object',
    properties: {
      total: { type: 'number', description: '总内存(GB)' },
      available: { type: 'number', description: '可用内存(GB)' },
      used: { type: 'number', description: '已用内存(GB)' }
    },
    required: ['total', 'available', 'used']
  },
  disk: {
    type: 'object',
    properties: {
      total: { type: 'number', description: '总磁盘空间(GB)' },
      available: { type: 'number', description: '可用磁盘空间(GB)' },
      used: { type: 'number', description: '已用磁盘空间(GB)' }
    },
    required: ['total', 'available', 'used']
  },
  dockerInstalled: { type: 'boolean' },
  dockerVersion: { type: 'string' },
  dockerComposeInstalled: { type: 'boolean' },
  dockerComposeVersion: { type: 'string' },
  wordpressRunning: { type: 'boolean' },
  wordpressUrl: { type: 'string', format: 'uri' },
  lastChecked: { type: 'string', format: 'date-time' }
}, ['isOnline', 'os', 'memory', 'disk', 'dockerInstalled', 'dockerComposeInstalled', 'wordpressRunning', 'lastChecked']);

// Ansible任务状态Schema
export const ansibleTaskStatusSchema = {
  type: 'string',
  enum: ['pending', 'running', 'success', 'failed', 'skipped'],
  description: 'Ansible任务执行状态'
};

// Ansible任务结果Schema
export const ansibleTaskResultSchema = objectSchema({
  taskName: nameSchema,
  status: ansibleTaskStatusSchema,
  message: descriptionSchema,
  changed: { type: 'boolean' },
  startTime: { type: 'string', format: 'date-time' },
  endTime: { type: 'string', format: 'date-time' },
  duration: { type: 'number', description: '执行时长(秒)' },
  stdout: { type: 'string' },
  stderr: { type: 'string' }
}, ['taskName', 'status', 'changed', 'startTime']);

// Ansible Playbook执行结果Schema
export const ansiblePlaybookResultSchema = objectSchema({
  playbookName: nameSchema,
  status: ansibleTaskStatusSchema,
  totalTasks: { type: 'number', minimum: 0 },
  successTasks: { type: 'number', minimum: 0 },
  failedTasks: { type: 'number', minimum: 0 },
  skippedTasks: { type: 'number', minimum: 0 },
  tasks: arraySchema(ansibleTaskResultSchema),
  startTime: { type: 'string', format: 'date-time' },
  endTime: { type: 'string', format: 'date-time' },
  duration: { type: 'number', description: '总执行时长(秒)' },
  summary: descriptionSchema
}, ['playbookName', 'status', 'totalTasks', 'successTasks', 'failedTasks', 'skippedTasks', 'tasks', 'startTime']);

// 部署阶段Schema
export const deploymentStageSchema = {
  type: 'string',
  enum: ['validation', 'docker-setup', 'wordpress-deploy', 'initialization', 'completed', 'failed'],
  description: '部署流程阶段'
};

// 部署状态Schema
export const deploymentStatusSchema = objectSchema({
  deploymentId: {
    type: 'string',
    pattern: '^[a-zA-Z0-9-_]+$',
    minLength: 8,
    maxLength: 50
  },
  stage: deploymentStageSchema,
  progress: {
    type: 'number',
    minimum: 0,
    maximum: 100,
    description: '部署进度百分比'
  },
  server: serverConfigSchema,
  serverStatus: serverStatusSchema,
  playbookResults: arraySchema(ansiblePlaybookResultSchema),
  wordpressConfig: {
    type: 'object',
    properties: {
      siteUrl: { type: 'string', format: 'uri' },
      adminUrl: { type: 'string', format: 'uri' },
      adminUsername: { type: 'string' },
      adminPassword: { type: 'string' },
      dbName: { type: 'string' },
      dbUser: { type: 'string' },
      dbPassword: { type: 'string' }
    }
  },
  startTime: { type: 'string', format: 'date-time' },
  endTime: { type: 'string', format: 'date-time' },
  duration: { type: 'number', description: '部署总时长(秒)' },
  error: descriptionSchema
}, ['deploymentId', 'stage', 'progress', 'server', 'startTime']);

// WordPress配置Schema
export const wordpressConfigSchema = objectSchema({
  siteName: {
    type: 'string',
    minLength: 1,
    maxLength: 100,
    default: 'My WordPress Site'
  },
  adminUsername: {
    type: 'string',
    minLength: 3,
    maxLength: 50,
    pattern: '^[a-zA-Z0-9_-]+$',
    default: 'admin'
  },
  adminPassword: {
    type: 'string',
    minLength: 8,
    maxLength: 100
  },
  adminEmail: {
    type: 'string',
    format: 'email'
  },
  dbName: {
    type: 'string',
    minLength: 1,
    maxLength: 50,
    pattern: '^[a-zA-Z0-9_]+$',
    default: 'wordpress'
  },
  dbUser: {
    type: 'string',
    minLength: 1,
    maxLength: 50,
    pattern: '^[a-zA-Z0-9_]+$',
    default: 'wpuser'
  },
  dbPassword: {
    type: 'string',
    minLength: 8,
    maxLength: 100
  },
  tablePrefix: {
    type: 'string',
    pattern: '^[a-zA-Z0-9_]+$',
    default: 'wp_'
  }
}, ['siteName', 'adminUsername', 'adminPassword', 'adminEmail', 'dbName', 'dbUser', 'dbPassword']);

// === 请求Schema定义 ===

// 服务器检查请求Schema
export const serverCheckRequestSchema = objectSchema({
  server: serverConfigSchema
}, ['server']);

// Docker安装请求Schema
export const dockerInstallRequestSchema = objectSchema({
  server: serverConfigSchema
}, ['server']);

// WordPress部署请求Schema
export const wordpressDeployRequestSchema = objectSchema({
  server: serverConfigSchema,
  wordpressConfig: wordpressConfigSchema
}, ['server', 'wordpressConfig']);

// 完整部署请求Schema
export const fullDeploymentRequestSchema = objectSchema({
  server: serverConfigSchema,
  wordpressConfig: wordpressConfigSchema
}, ['server', 'wordpressConfig']);

// === 响应Schema定义 ===

// 服务器检查响应Schema
export const serverCheckResponseSchema = responseSchema(serverStatusSchema);

// Docker安装响应Schema
export const dockerInstallResponseSchema = responseSchema(ansiblePlaybookResultSchema);

// WordPress部署响应Schema
export const wordpressDeployResponseSchema = responseSchema(deploymentStatusSchema);

// 完整部署响应Schema
export const fullDeploymentResponseSchema = responseSchema(deploymentStatusSchema);

// 部署状态查询响应Schema
export const deploymentStatusResponseSchema = responseSchema(deploymentStatusSchema);
