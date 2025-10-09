# WordPress裸金属部署指南

> 🚀 生产级WordPress自动化部署方案 - LEMP栈 + HTTPS + 安全加固

---

## 📋 概述

这是一套完整的WordPress自动化部署方案，专门针对**Rocky Linux**系统设计，采用**LEMP栈**（Linux + Nginx + MariaDB + PHP 8.3）架构。

### ✨ 核心特性

- ✅ **三步部署**：环境准备 → WordPress部署 → HTTPS配置
- ✅ **10-18分钟上线**：从裸机到生产环境，全自动化
- ✅ **无状态设计**：所有状态通过API传递，无需数据库
- ✅ **生产级安全**：Fail2Ban、防火墙、HTTPS、安全头部
- ✅ **性能优化**：PHP 8.3、Nginx优化、MariaDB调优
- ✅ **零停机SSL**：Webroot模式申请证书，无需停止服务

### 🏗️ 技术栈

| 组件 | 版本 | 说明 |
|------|------|------|
| **操作系统** | Rocky Linux 8/9 | RHEL兼容，企业级稳定性 |
| **Web服务器** | Nginx（最新） | 高性能反向代理 |
| **数据库** | MariaDB 10.6+ | MySQL的开源替代 |
| **PHP** | 8.3 | 最新稳定版，性能提升~20% |
| **SSL证书** | Let's Encrypt | 免费、自动续期 |
| **防火墙** | firewalld | 仅开放 22/80/443 |
| **安全防护** | Fail2Ban | SSH暴力破解防护 |
| **部署工具** | Ansible | 幂等性、可重复执行 |

---

## 🚀 快速开始

### 前置条件

**控制机（运行siteForge的机器）：**
- Node.js 18+
- Ansible 2.9+
- sshpass（用于密码认证）

**目标服务器（部署WordPress的机器）：**
- ✅ 全新的Rocky Linux 8或9
- ✅ 至少2GB内存、20GB磁盘
- ✅ root或sudo权限账号
- ✅ 可通过SSH访问（密码认证）

**域名配置：**
- ✅ 域名A记录已解析到服务器IP
- ⏱️ DNS解析生效通常需要5-30分钟

### 1️⃣ 安装Ansible依赖

在控制机上执行：

```bash
cd ansible
ansible-galaxy install -r requirements.yml --force
```

这将安装所有必需的Ansible Roles（geerlingguy系列）。

### 2️⃣ 配置域名解析

将您的域名A记录指向服务器IP：

```
example.com  →  A  →  192.168.1.100
```

验证DNS解析：
```bash
host example.com
dig example.com +short
```

### 3️⃣ 启动siteForge服务

```bash
npm install
npm run build
npm start  # 或 npm run dev
```

服务将运行在 `http://localhost:3000`

### 4️⃣ 执行部署

#### 方法A: 使用测试脚本（推荐）

```bash
cd examples
chmod +x bare-metal-deployment-example.sh

# 编辑脚本，修改配置变量
vim bare-metal-deployment-example.sh

# 执行部署
./bare-metal-deployment-example.sh
```

#### 方法B: 使用cURL命令

请参考下文"API详细说明"章节。

#### 方法C: 使用Postman

1. 导入集合文件：`examples/bare-metal-postman-collection.json`
2. 修改环境变量（服务器IP、SSH密码等）
3. 依次执行 Step 1 → Step 2 → Step 3

---

## 📡 API详细说明

### Step 1: 准备服务器环境

**接口**: `POST /provisioning/bare-metal/prepare-server`

**功能**:
- 安装LEMP栈（Nginx + MariaDB + PHP 8.3）
- 配置防火墙（开放22/80/443）
- 安装Fail2Ban（SSH保护）
- 创建数据库和用户
- 生成所有密码和密钥

**请求示例**:

```bash
curl -X POST http://localhost:3000/provisioning/bare-metal/prepare-server \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.1.100",
    "sshUser": "root",
    "sshPassword": "your-ssh-password",
    "domain": "example.com"
  }' | tee step1-response.json | jq '.'
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "message": "服务器环境准备就绪。LEMP栈已安装，数据库已配置。",
    "deploymentContext": {
      "targetHost": "192.168.1.100",
      "sshUser": "root",
      "siteDomain": "example.com",
      "dbName": "wp_example_a1b2c3",
      "dbUser": "wpuser_example_ab12",
      "dbPassword": "xY9zK3mN7pQ2sT5vW8",
      "wpAdminUser": "admin",
      "wpAdminPassword": "L4nM6qR8tU2wX5yZ9",
      "wpAdminEmail": "admin@example.com",
      "wpSaltKeys": "define('AUTH_KEY', '...');\n..."
    }
  }
}
```

⚠️ **重要**: `deploymentContext` 包含所有敏感信息，必须安全传输和存储！

**执行内容**:
1. ✅ 验证系统是否为Rocky Linux
2. ✅ 更新系统包缓存
3. ✅ 安装EPEL仓库
4. ✅ 配置防火墙（开放22/80/443）
5. ✅ 安装Fail2Ban（SSH保护）
6. ✅ 配置NTP时间同步
7. ✅ 安装Nginx
8. ✅ 安装PHP 8.3和扩展
9. ✅ 安装MariaDB并设置root密码
10. ✅ 创建WordPress数据库和用户
11. ✅ 安装Composer和WP-CLI
12. ✅ 验证所有服务正常运行

**耗时**: 5-10分钟

---

### Step 2: 部署WordPress

**接口**: `POST /provisioning/bare-metal/deploy-wordpress`

**功能**:
- 配置Nginx虚拟主机（HTTP）
- 下载并安装WordPress
- 生成wp-config.php
- 设置文件权限和SELinux上下文
- 执行WordPress安装

**请求示例**:

```bash
# 提取deploymentContext
cat step1-response.json | jq '.data.deploymentContext' > context.json

curl -X POST http://localhost:3000/provisioning/bare-metal/deploy-wordpress \
  -H "Content-Type: application/json" \
  -d "{
    \"deploymentContext\": $(cat context.json),
    \"sshPassword\": \"your-ssh-password\"
  }" | tee step2-response.json | jq '.'
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "message": "WordPress部署成功。网站已可通过HTTP访问。",
    "siteUrl": "http://example.com",
    "adminUrl": "http://example.com/wp-admin",
    "deploymentContext": { /* 继续传递 */ }
  }
}
```

⚠️ **注意**: 此时网站使用HTTP，不安全。请继续执行Step 3。

**执行内容**:
1. ✅ 验证LEMP环境就绪
2. ✅ 创建WordPress目录
3. ✅ 部署Nginx虚拟主机配置（HTTP）
4. ✅ 使用WP-CLI下载WordPress
5. ✅ 生成wp-config.php
6. ✅ 注入Salt Keys
7. ✅ 执行WordPress安装
8. ✅ 设置永久链接和基础配置
9. ✅ 设置文件权限（755/644）
10. ✅ 配置SELinux上下文
11. ✅ 测试HTTP访问

**Nginx配置特性**:
- 支持WordPress永久链接
- 静态文件缓存（30天）
- 安全规则（禁止访问敏感文件）
- Gzip压缩
- 上传大小限制64MB

**耗时**: 3-5分钟

---

### Step 3: 配置HTTPS

**接口**: `POST /provisioning/bare-metal/secure-ssl`

**功能**:
- 申请Let's Encrypt SSL证书
- 配置Nginx HTTPS虚拟主机
- 设置HTTP到HTTPS重定向
- 更新WordPress站点URL为HTTPS
- 配置证书自动续期

**请求示例**:

```bash
curl -X POST http://localhost:3000/provisioning/bare-metal/secure-ssl \
  -H "Content-Type: application/json" \
  -d "{
    \"deploymentContext\": $(cat context.json),
    \"sshPassword\": \"your-ssh-password\",
    \"adminEmail\": \"contact@example.com\"
  }" | jq '.'
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "message": "HTTPS配置成功！网站已上线，所有流量将通过HTTPS加密传输。",
    "secureSiteUrl": "https://example.com",
    "secureAdminUrl": "https://example.com/wp-admin",
    "certificatePath": "/etc/letsencrypt/live/example.com/"
  }
}
```

🎉 **完成**: 网站现已通过HTTPS安全访问！

**执行内容**:
1. ✅ 验证域名DNS解析
2. ✅ 检查HTTP访问正常
3. ✅ 创建ACME Challenge目录
4. ✅ 使用Certbot申请证书（Webroot模式）
5. ✅ 部署HTTPS Nginx配置
6. ✅ 配置HTTP到HTTPS重定向
7. ✅ 更新WordPress站点URL为HTTPS
8. ✅ 强制SSL后台登录
9. ✅ 设置证书自动续期（每天凌晨3:30）
10. ✅ 测试HTTPS访问

**Nginx HTTPS配置特性**:
- TLS 1.2/1.3支持
- A+级别SSL配置
- HSTS头部（预加载，1年）
- OCSP Stapling
- 安全头部（XSS、Content-Type、Frame等）

**耗时**: 2-3分钟

---

## ⏱️ 部署时间预估

| 步骤 | 耗时 | 说明 |
|------|------|------|
| Step 1 | 5-10分钟 | 安装软件包、配置服务 |
| Step 2 | 3-5分钟 | 下载和配置WordPress |
| Step 3 | 2-3分钟 | 申请SSL证书 |
| **总计** | **10-18分钟** | 首次部署（后续更快） |

---

## ✅ 验证部署成功

### 1. 检查网站访问

```bash
# 测试HTTP访问（Step 2后）
curl -I http://example.com

# 测试HTTPS访问（Step 3后）
curl -I https://example.com
```

### 2. 登录WordPress后台

1. 访问: `https://example.com/wp-admin`
2. 用户名: `admin`（Step 1返回的wpAdminUser）
3. 密码: 在Step 1响应的`deploymentContext.wpAdminPassword`中

### 3. 检查SSL评级

访问: [SSL Labs](https://www.ssllabs.com/ssltest/)

输入你的域名，预期评级: **A或A+**

### 4. 验证服务运行

```bash
# SSH登录服务器
ssh root@your-server-ip

# 检查服务状态
systemctl status nginx
systemctl status php-fpm
systemctl status mariadb

# 检查防火墙
firewall-cmd --list-all

# 检查证书
certbot certificates
```

---

## 🛡️ 安全特性

### 系统级安全

- ✅ **Fail2Ban防护**：5次SSH失败尝试封禁1小时
- ✅ **防火墙配置**：仅开放22/80/443端口
- ✅ **SELinux支持**：Rocky Linux默认启用
- ✅ **时间同步**：NTP配置，防止证书验证失败

### WordPress安全

- ✅ **Salt Keys**：高强度随机生成（64字符）
- ✅ **文件权限**：严格控制（640/644/755）
- ✅ **敏感文件保护**：禁止访问wp-config.php、readme.html
- ✅ **Uploads保护**：禁止uploads目录执行PHP
- ✅ **XMLRPC禁用**：防暴力破解
- ✅ **强制HTTPS登录**：后台和Cookie加密传输

### SSL/TLS安全

- ✅ **TLS 1.2/1.3**：禁用TLS 1.0/1.1
- ✅ **现代加密套件**：ECDHE、CHACHA20
- ✅ **HSTS预加载**：1年有效期
- ✅ **OCSP Stapling**：加速SSL握手
- ✅ **证书自动续期**：每天凌晨3:30检查

### 密码策略

所有密码自动生成，高强度随机：
- 数据库密码：18字符（大小写字母+数字）
- WordPress管理员密码：18字符（大小写字母+数字）
- MySQL root密码：24字符（大小写字母+数字+符号）

---

## ⚡ 性能优化

### Nginx优化

```nginx
# HTTP/2支持
listen 443 ssl http2;

# Gzip压缩（压缩级别6）
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;

# 静态文件长缓存（30天）
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2)$ {
    expires 30d;
}

# FastCGI缓冲区优化
fastcgi_buffers 256 16k;
fastcgi_buffer_size 128k;

# worker进程自动匹配CPU核心数
worker_processes auto;
```

### PHP 8.3优化

```ini
# OPcache启用
opcache.enable=1
opcache.memory_consumption=128

# PHP-FPM动态进程管理
pm = dynamic
pm.max_children = 50
pm.start_servers = 5

# 内存和执行时间
memory_limit = 256M
max_execution_time = 300
upload_max_filesize = 64M
```

### MariaDB优化

```ini
# InnoDB缓冲池
innodb_buffer_pool_size = 256M

# UTF8MB4字符集（支持Emoji）
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 查询缓存
query_cache_size = 64M
```

### 性能调优建议

根据服务器配置调整参数：

| 内存 | PHP memory_limit | InnoDB buffer_pool | max_children |
|------|------------------|-------------------|--------------|
| 2GB | 256M | 256M | 50 |
| 4GB | 512M | 512M | 100 |
| 8GB+ | 1024M | 1G | 200 |

---

## 🔍 故障排查

### Step 1失败

**症状**: Playbook执行失败，返回错误信息。

**可能原因**:
1. SSH连接失败（密码错误、网络不通）
2. 服务器不是Rocky Linux
3. 磁盘空间不足
4. 软件包仓库无法访问

**解决方案**:

```bash
# 1. 手动测试SSH连接
ssh root@192.168.1.100

# 2. 检查操作系统
cat /etc/redhat-release
# 应该显示：Rocky Linux release 8.x 或 9.x

# 3. 检查磁盘空间
df -h
# 确保根分区有至少15GB可用空间

# 4. 测试软件源
dnf check-update

# 5. 检查网络
ping -c 3 8.8.8.8
```

---

### Step 2失败

**症状**: WordPress下载或安装失败。

**可能原因**:
1. 数据库连接失败（Step 1未成功）
2. WP-CLI无法访问wordpress.org
3. 文件权限问题
4. Nginx配置错误

**解决方案**:

```bash
# 1. 测试数据库连接
mysql -u wpuser_xxx -p'xxx' wp_xxx_xxx -e "SELECT 1;"

# 2. 测试WP-CLI
wp --info --allow-root

# 3. 检查Nginx配置
nginx -t

# 4. 查看Nginx错误日志
tail -f /var/log/nginx/example.com/error.log

# 5. 查看PHP-FPM日志
tail -f /var/log/php-fpm/www-error.log

# 6. 检查WordPress目录权限
ls -la /var/www/example.com/
# 所有者应该是nginx:nginx
```

---

### Step 3失败（SSL证书申请失败）

**症状**: Let's Encrypt证书申请失败。

**可能原因**:
1. 域名DNS未正确解析 ⭐ 最常见
2. 防火墙未开放80端口
3. Let's Encrypt速率限制（单域名每周最多5次失败）
4. 服务器时间不准确

**解决方案**:

```bash
# 1. 检查域名解析（最重要）
host example.com
dig example.com +short

# 确保解析到正确的IP
# 如果未解析或解析错误，等待DNS生效后重试

# 2. 从外部测试HTTP访问
curl -I http://example.com

# 3. 检查防火墙
firewall-cmd --list-all
# 应该看到 http 和 https 服务

# 4. 检查Nginx是否监听80端口
netstat -tlnp | grep :80

# 5. 检查服务器时间
timedatectl status
# 确保时区正确，时间同步启用

# 6. 手动测试证书申请（干运行）
certbot certonly --webroot \
  -w /var/www/example.com \
  -d example.com \
  --dry-run

# 7. 查看Certbot日志
tail -f /var/log/letsencrypt/letsencrypt.log
```

**Let's Encrypt速率限制**:
- 单域名每周最多5次失败尝试
- 如果触发限制，等待7天后重试
- 或者先使用`--dry-run`测试配置

**常见错误信息**:

| 错误 | 原因 | 解决 |
|------|------|------|
| `Connection refused` | Nginx未运行或未监听80 | `systemctl start nginx` |
| `Domain not found` | DNS未解析 | 等待DNS生效，检查A记录 |
| `Timeout` | 防火墙阻止 | 检查`firewall-cmd --list-all` |
| `Rate limit` | 失败次数过多 | 等待7天或使用`--dry-run`测试 |

---

### 通用调试命令

```bash
# 查看所有服务状态
systemctl status nginx php-fpm mariadb

# 重启服务
systemctl restart nginx
systemctl restart php-fpm

# 查看日志（实时）
tail -f /var/log/nginx/example.com/error.log
tail -f /var/log/php-fpm/www-error.log
tail -f /var/log/mariadb/mariadb.log

# 测试Nginx配置
nginx -t

# 重新加载Nginx（不中断服务）
systemctl reload nginx

# 手动续期SSL证书
certbot renew --force-renewal

# 查看SSL证书信息
openssl x509 -in /etc/letsencrypt/live/example.com/fullchain.pem -text -noout

# 检查WordPress数据库
wp db check --allow-root --path=/var/www/example.com
```

---

## 📝 最佳实践

### 1. 部署前准备

- ✅ 确保域名已解析到服务器IP（至少提前10分钟）
- ✅ 准备一个全新的Rocky Linux服务器（避免冲突）
- ✅ 记录SSH密码（将在三步中重复使用）
- ✅ 准备一个有效的邮箱地址（用于SSL证书通知）
- ✅ 确保控制机已安装Ansible依赖

### 2. 安全存储deploymentContext

`deploymentContext`包含所有敏感信息：
- ❌ 不要存储在浏览器LocalStorage
- ❌ 不要记录到日志文件
- ❌ 不要通过未加密渠道传输
- ✅ 使用加密存储（如数据库加密字段）
- ✅ 或只在内存中传递（适用于单次部署）
- ✅ 使用后立即清除（如果不需要保留）

### 3. 生产环境建议

**安全加固：**
- ✅ 使用SSH密钥认证（替代密码）
- ✅ 修改SSH默认端口（22 → 其他端口）
- ✅ 启用服务器备份（快照或rsync）
- ✅ 配置监控告警（Uptime监控）
- ✅ 定期更新系统包（`dnf update`）
- ✅ 安装WordPress安全插件（如Wordfence）

**性能优化：**
- ✅ 配置CDN（如Cloudflare）
- ✅ 安装缓存插件（如WP Super Cache）
- ✅ 优化图片（安装图片优化插件）
- ✅ 启用OPcache（已默认启用）

**备份策略：**
- ✅ 每日数据库备份
- ✅ 每周文件系统备份
- ✅ 异地备份存储
- ✅ 定期测试恢复流程

### 4. 网站上线后

**必做事项：**
1. 更改默认管理员用户名（WordPress后台 → 用户）
2. 安装必要的插件（安全、SEO、缓存）
3. 选择并激活主题
4. 配置网站标题和副标题
5. 设置固定链接结构
6. 配置评论设置
7. 创建隐私政策和服务条款页面
8. 提交网站地图到搜索引擎

**推荐插件：**
- Wordfence Security（安全防护）
- Yoast SEO（搜索引擎优化）
- WP Super Cache（缓存加速）
- Akismet（反垃圾评论）
- UpdraftPlus（备份）

---

## 🆚 对比Docker方案

| 特性 | Docker方案 | 裸金属方案（推荐） |
|------|-----------|-------------------|
| **性能** | 容器化开销~5% | 原生性能，无开销 |
| **资源占用** | 高（Docker Engine + 容器） | 低（仅必要服务） |
| **启动速度** | 慢（镜像拉取 + 容器启动） | 快（服务直接启动） |
| **可维护性** | 需要维护Docker和容器 | 直接管理系统服务 |
| **适用场景** | 开发/测试、多站点隔离 | 生产环境、高性能需求 |
| **PHP版本** | 8.1 | 8.3（最新） |
| **SSL配置** | 需要Caddy或额外配置 | 原生Nginx + Certbot |
| **部署时间** | 15-25分钟 | 10-18分钟 |

**推荐**: 生产环境优先使用裸金属方案。

---

## 📁 文件结构

### Ansible Playbooks

```
ansible/
├── playbooks/
│   ├── playbook_step1_prepare_server.yml    # Step 1: 环境准备（426行）
│   ├── playbook_step2_deploy_wordpress.yml   # Step 2: WordPress部署（429行）
│   └── playbook_step3_secure_ssl.yml         # Step 3: HTTPS配置（321行）
├── templates/
│   ├── wordpress.conf.j2                     # Nginx HTTP配置模板
│   └── wordpress-ssl.conf.j2                 # Nginx HTTPS配置模板
└── requirements.yml                          # Ansible Galaxy依赖
```

### 示例文件

```
examples/
├── bare-metal-deployment-example.sh          # 完整部署示例脚本
├── bare-metal-postman-collection.json        # Postman集合
├── fix-https-on-server.sh                    # HTTPS修复脚本
└── test-step3-only.sh                        # 单独测试Step 3
```

---

## 🔧 高级配置

### 自定义PHP配置

编辑 `ansible/group_vars/all.yml`:

```yaml
php_version: "8.3"
php_memory_limit: "512M"          # 根据服务器内存调整
php_max_execution_time: "600"     # 大文件上传需要更长时间
php_upload_max_filesize: "128M"   # 上传文件大小限制
```

### 自定义MariaDB配置

```yaml
mysql_root_password: "自定义密码"
mysql_innodb_buffer_pool_size: "512M"  # 根据服务器内存调整
mysql_max_connections: "200"
```

### 自定义Nginx配置

编辑 `ansible/templates/wordpress-ssl.conf.j2`:

```nginx
# 添加自定义头部
add_header X-Custom-Header "Your Value";

# 修改缓存策略
location ~* \.(jpg|jpeg|png|gif)$ {
    expires 90d;  # 从30天改为90天
}

# 添加速率限制
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
location = /wp-login.php {
    limit_req zone=login burst=2 nodelay;
    include fastcgi_params;
    fastcgi_pass unix:/run/php-fpm/www.sock;
}
```

### 多域名部署

可以在同一台服务器上部署多个WordPress站点，只需：

1. 为每个域名执行完整的三步部署
2. Nginx会为每个域名创建独立的虚拟主机
3. 每个站点有独立的数据库和文件目录

---

## 📊 监控与维护

### 日志位置

| 服务 | 日志路径 |
|------|---------|
| Nginx访问日志 | `/var/log/nginx/{domain}/access.log` |
| Nginx错误日志 | `/var/log/nginx/{domain}/error.log` |
| PHP-FPM日志 | `/var/log/php-fpm/www-error.log` |
| MariaDB日志 | `/var/log/mariadb/mariadb.log` |
| Certbot日志 | `/var/log/letsencrypt/letsencrypt.log` |
| Fail2Ban日志 | `/var/log/fail2ban.log` |

### 常用维护命令

```bash
# 查看网站访问统计
tail -n 1000 /var/log/nginx/example.com/access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# 查看最近的PHP错误
tail -n 100 /var/log/php-fpm/www-error.log

# 检查数据库大小
mysql -u root -p -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables GROUP BY table_schema;"

# 清理WordPress缓存
wp cache flush --allow-root --path=/var/www/example.com

# 更新WordPress核心
wp core update --allow-root --path=/var/www/example.com

# 更新所有插件
wp plugin update --all --allow-root --path=/var/www/example.com

# 数据库优化
wp db optimize --allow-root --path=/var/www/example.com
```

### 定期维护任务

**每日：**
- 检查网站是否正常访问
- 查看错误日志
- 检查磁盘空间使用

**每周：**
- 更新WordPress插件和主题
- 检查备份是否正常
- 查看访问统计

**每月：**
- 更新系统包（`dnf update`）
- 检查SSL证书有效期
- 清理日志文件
- 数据库优化

---

## 🎓 技术细节

### deploymentContext字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `targetHost` | string | 服务器IP | "192.168.1.100" |
| `sshUser` | string | SSH用户名 | "root" |
| `siteDomain` | string | 网站域名 | "example.com" |
| `dbName` | string | 数据库名 | "wp_example_a1b2c3" |
| `dbUser` | string | 数据库用户 | "wpuser_example_ab12" |
| `dbPassword` | string | 数据库密码 | "xY9zK3mN7pQ2sT5vW8" |
| `wpAdminUser` | string | WP管理员用户名 | "admin" |
| `wpAdminPassword` | string | WP管理员密码 | "L4nM6qR8tU2wX5yZ9" |
| `wpAdminEmail` | string | WP管理员邮箱 | "admin@example.com" |
| `wpSaltKeys` | string | WP安全密钥 | "define('AUTH_KEY', '...');" |

### Ansible Playbook幂等性

所有Playbook都是幂等的，这意味着：
- ✅ 可以安全地重复执行
- ✅ 只会更改需要更改的内容
- ✅ 不会破坏已有配置

**示例：**
```bash
# 第一次执行：安装所有内容
ansible-playbook playbook_step1_prepare_server.yml

# 第二次执行：只会检查状态，不会重复安装
ansible-playbook playbook_step1_prepare_server.yml
```

### 证书自动续期机制

Let's Encrypt证书有效期90天，自动续期通过cron实现：

```bash
# 查看续期cron job
crontab -l | grep certbot

# 手动测试续期（干运行）
certbot renew --dry-run

# 强制续期（通常不需要）
certbot renew --force-renewal

# 续期后自动重载Nginx
# 在 /etc/letsencrypt/renewal/example.com.conf 中配置：
# post_hook = systemctl reload nginx
```

---

## 🆘 紧急问题处理

### 网站突然无法访问

```bash
# 1. 检查服务状态
systemctl status nginx php-fpm mariadb

# 2. 如果服务停止，启动它
systemctl start nginx

# 3. 检查端口监听
netstat -tlnp | grep -E ':(80|443)'

# 4. 检查防火墙
firewall-cmd --list-all

# 5. 查看最近的错误日志
tail -n 100 /var/log/nginx/example.com/error.log
```

### SSL证书过期

```bash
# 1. 检查证书有效期
certbot certificates

# 2. 手动续期
certbot renew --force-renewal

# 3. 重载Nginx
systemctl reload nginx

# 4. 验证HTTPS访问
curl -I https://example.com
```

### 数据库连接失败

```bash
# 1. 检查MariaDB状态
systemctl status mariadb

# 2. 尝试连接数据库
mysql -u wpuser_xxx -p'xxx' wp_xxx_xxx -e "SELECT 1;"

# 3. 如果无法连接，检查密码
# 查看wp-config.php中的数据库配置
grep "DB_PASSWORD" /var/www/example.com/wp-config.php

# 4. 重启MariaDB
systemctl restart mariadb
```

### 磁盘空间不足

```bash
# 1. 检查磁盘使用
df -h

# 2. 找出大文件
du -sh /var/* | sort -rh | head -10

# 3. 清理日志（谨慎操作）
> /var/log/nginx/example.com/access.log
> /var/log/php-fpm/www-error.log

# 4. 清理WordPress上传的旧文件
# （手动在后台删除不需要的媒体文件）
```

---

## 📞 技术支持

### 获取帮助

1. **查看文档**：先查看本文档和README.md
2. **查看日志**：检查相关服务的日志文件
3. **提交Issue**：在GitHub上提交详细的问题描述

### 提交Issue时请包含

- ✅ 操作系统版本（`cat /etc/redhat-release`）
- ✅ 失败的步骤（Step 1/2/3）
- ✅ 完整的错误信息
- ✅ 相关日志内容
- ✅ 已尝试的解决方案

---

## 📄 许可证

本项目使用的Ansible Roles均为开源软件：
- geerlingguy/* roles: MIT License
- 本项目代码: ISC License

---

## 🎉 总结

恭喜！你已经掌握了SiteForge的裸金属部署方案。

**核心优势：**
- ✅ 10-18分钟完成完整部署
- ✅ 生产级安全和性能配置
- ✅ 全自动化，无需人工干预
- ✅ 幂等性设计，可重复执行

**下一步：**
1. 准备一台Rocky Linux服务器
2. 配置域名DNS解析
3. 调用API开始部署
4. 访问你的WordPress网站！

**需要帮助？** 查看故障排查章节或提交GitHub Issue。

---

**SiteForge Deployment** - 让WordPress部署变得简单高效 🚀

