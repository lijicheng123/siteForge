# WordPress自动化部署API文档

本文档介绍新增的WordPress自动化部署功能API。

## 概述

WordPress自动化部署功能允许用户通过API接口，在远程服务器上自动安装Docker环境并部署WordPress网站。整个过程完全自动化，无需人工干预。

## 支持的操作系统

- CentOS 7/8
- Rocky Linux 8/9
- Ubuntu 18.04/20.04/22.04
- Debian 10/11

## API端点

### 1. 服务器检查

检查服务器状态、系统信息和资源使用情况。

**请求：**
```bash
POST /api/provisioning/check-server
Content-Type: application/json

{
  "server": {
    "ip": "192.168.1.100",
    "username": "root",
    "password": "your_password",
    "port": 22,
    "os": "centos"
  }
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "isOnline": true,
    "os": "centos",
    "osVersion": "CentOS 8.4",
    "memory": {
      "total": 2.0,
      "available": 1.2,
      "used": 0.8
    },
    "disk": {
      "total": 40.0,
      "available": 35.0,
      "used": 5.0
    },
    "dockerInstalled": false,
    "dockerVersion": "",
    "dockerComposeInstalled": false,
    "dockerComposeVersion": "",
    "wordpressRunning": false,
    "wordpressUrl": "",
    "lastChecked": "2025-09-20T03:52:46.990Z"
  },
  "message": "服务器检查完成",
  "timestamp": "2025-09-20T03:52:46.990Z"
}
```

### 2. 安装Docker环境

在目标服务器上安装Docker和Docker Compose。

**请求：**
```bash
POST /api/provisioning/install-docker
Content-Type: application/json

{
  "server": {
    "ip": "192.168.1.100",
    "username": "root",
    "password": "your_password",
    "port": 22,
    "os": "centos"
  }
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "playbookName": "docker-install",
    "status": "success",
    "totalTasks": 5,
    "successTasks": 5,
    "failedTasks": 0,
    "skippedTasks": 0,
    "tasks": [
      {
        "taskName": "更新系统包",
        "status": "success",
        "message": "系统包更新完成",
        "changed": true,
        "duration": 30
      }
    ],
    "duration": 110,
    "summary": "Docker和Docker Compose安装成功"
  },
  "message": "Docker安装完成",
  "timestamp": "2025-09-20T03:52:46.990Z"
}
```

### 3. 部署WordPress

在已安装Docker的服务器上部署WordPress应用栈。

**请求：**
```bash
POST /api/provisioning/deploy-wordpress
Content-Type: application/json

{
  "server": {
    "ip": "192.168.1.100",
    "username": "root",
    "password": "your_password",
    "port": 22,
    "os": "centos"
  },
  "wordpressConfig": {
    "siteName": "My WordPress Site",
    "adminUsername": "admin",
    "adminPassword": "secure_password_123",
    "adminEmail": "admin@example.com",
    "dbName": "wordpress",
    "dbUser": "wpuser",
    "dbPassword": "db_password_123",
    "tablePrefix": "wp_"
  }
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "deploymentId": "wp-1703123456789-abc123def",
    "stage": "completed",
    "progress": 100,
    "server": {
      "ip": "192.168.1.100",
      "username": "root",
      "port": 22,
      "os": "centos"
    },
    "wordpressConfig": {
      "siteUrl": "http://192.168.1.100",
      "adminUrl": "http://192.168.1.100/wp-admin",
      "adminUsername": "admin",
      "adminPassword": "secure_password_123",
      "dbName": "wordpress",
      "dbUser": "wpuser",
      "dbPassword": "db_password_123"
    },
    "duration": 215
  },
  "message": "WordPress部署完成",
  "timestamp": "2025-09-20T03:52:46.990Z"
}
```

### 4. 完整部署流程

执行从服务器检查到WordPress部署的完整自动化流程。

**请求：**
```bash
POST /api/provisioning/deploy
Content-Type: application/json

{
  "server": {
    "ip": "192.168.1.100",
    "username": "root",
    "password": "your_password",
    "port": 22,
    "os": "centos"
  },
  "wordpressConfig": {
    "siteName": "My WordPress Site",
    "adminUsername": "admin",
    "adminPassword": "secure_password_123",
    "adminEmail": "admin@example.com",
    "dbName": "wordpress",
    "dbUser": "wpuser",
    "dbPassword": "db_password_123",
    "tablePrefix": "wp_"
  }
}
```

### 5. 快速部署

使用默认配置快速部署WordPress。

**请求：**
```bash
POST /api/provisioning/quick-deploy
Content-Type: application/json

{
  "server": {
    "ip": "192.168.1.100",
    "username": "root",
    "password": "your_password",
    "port": 22
  }
}
```

### 6. 查询部署状态

查询特定部署的状态信息。

**请求：**
```bash
GET /api/provisioning/status/{deploymentId}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "deploymentId": "wp-1703123456789-abc123def",
    "stage": "completed",
    "progress": 100,
    "server": {
      "ip": "192.168.1.100"
    },
    "startTime": "2025-09-20T03:45:00.000Z",
    "endTime": "2025-09-20T03:48:35.000Z",
    "duration": 215
  },
  "message": "部署状态查询成功",
  "timestamp": "2025-09-20T03:52:46.990Z"
}
```

### 7. 获取所有部署列表

获取所有部署记录的列表。

**请求：**
```bash
GET /api/provisioning/deployments
```

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "deploymentId": "wp-1703123456789-abc123def",
      "stage": "completed",
      "progress": 100,
      "server": { "ip": "192.168.1.100" },
      "startTime": "2025-09-20T02:45:00.000Z",
      "endTime": "2025-09-20T02:48:35.000Z",
      "duration": 215
    }
  ],
  "message": "部署列表查询成功",
  "timestamp": "2025-09-20T03:52:46.990Z"
}
```

## 部署阶段说明

- **validation**: 服务器验证阶段
- **docker-setup**: Docker环境安装阶段
- **wordpress-deploy**: WordPress部署阶段
- **initialization**: WordPress初始化阶段
- **completed**: 部署完成
- **failed**: 部署失败

## 错误处理

所有API端点都会返回标准的错误响应格式：

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "错误描述信息",
  "timestamp": "2025-09-20T03:52:46.990Z"
}
```

常见错误代码：
- `SERVER_CHECK_FAILED`: 服务器检查失败
- `DOCKER_INSTALL_FAILED`: Docker安装失败
- `WORDPRESS_DEPLOY_FAILED`: WordPress部署失败
- `DEPLOYMENT_NOT_FOUND`: 部署记录未找到
- `DEPLOYMENT_START_FAILED`: 部署启动失败

## 使用示例

### 完整部署流程示例

```bash
# 1. 检查服务器状态
curl -X POST http://localhost:3000/api/provisioning/check-server \
  -H "Content-Type: application/json" \
  -d '{
    "server": {
      "ip": "192.168.1.100",
      "username": "root",
      "password": "your_password"
    }
  }'

# 2. 执行完整部署
curl -X POST http://localhost:3000/api/provisioning/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "server": {
      "ip": "192.168.1.100",
      "username": "root",
      "password": "your_password"
    },
    "wordpressConfig": {
      "siteName": "我的网站",
      "adminUsername": "admin",
      "adminPassword": "secure_password_123",
      "adminEmail": "admin@example.com",
      "dbName": "wordpress",
      "dbUser": "wpuser",
      "dbPassword": "db_password_123"
    }
  }'

# 3. 查询部署状态
curl http://localhost:3000/api/provisioning/status/wp-1703123456789-abc123def
```

## 注意事项

1. **服务器要求**：
   - 最低配置：2核CPU，2GB内存，40GB磁盘
   - 需要root权限或sudo权限
   - 需要SSH访问权限

2. **网络要求**：
   - 服务器需要能够访问互联网（下载Docker镜像）
   - 防火墙需要开放80端口（WordPress访问）

3. **安全建议**：
   - 使用强密码
   - 建议使用SSH密钥认证
   - 定期更新系统和WordPress

4. **限制**：
   - 服务器检查：10次/分钟
   - Docker安装：5次/5分钟
   - WordPress部署：3次/10分钟
   - 完整部署：2次/15分钟

## 技术架构

本功能基于以下技术栈：

- **后端框架**：Fastify + TypeScript
- **自动化工具**：Ansible
- **容器化**：Docker + Docker Compose
- **应用栈**：Nginx + MariaDB + WordPress + WP-CLI

部署流程完全自动化，包括：
1. 系统环境检查和准备
2. Docker环境安装和配置
3. WordPress应用栈部署
4. 数据库初始化和WordPress配置
5. 服务启动和健康检查
