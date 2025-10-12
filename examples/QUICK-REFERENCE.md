# WordPress 多站点部署快速参考

## 🎯 核心链路图

```
┌─────────────────────────────────────────────────────────┐
│  Bash 脚本层 (examples/*.sh)                            │
├─────────────────────────────────────────────────────────┤
│  bare-metal-deployment-example.sh  ──→ 初次部署         │
│  add-new-site.sh                   ──→ 添加新站点 ⭐    │
│  remove-site.sh                    ──→ 卸载站点 ⭐      │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼ HTTP POST
┌─────────────────────────────────────────────────────────┐
│  API 层 (Node.js/Fastify)                               │
├─────────────────────────────────────────────────────────┤
│  /api/provisioning/bare-metal/prepare-server            │
│  /api/provisioning/bare-metal/deploy-wordpress          │
│  /api/provisioning/bare-metal/secure-ssl                │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼ Ansible Runner
┌─────────────────────────────────────────────────────────┐
│  Ansible Playbook 层                                    │
├─────────────────────────────────────────────────────────┤
│  playbook_step1_prepare_server.yml   ──→ LEMP 环境     │
│  playbook_step2_deploy_wordpress.yml ──→ WordPress      │
│  playbook_step3_secure_ssl.yml       ──→ SSL 证书      │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼ SSH
┌─────────────────────────────────────────────────────────┐
│  目标服务器 (Rocky Linux 9)                             │
├─────────────────────────────────────────────────────────┤
│  Nginx + PHP 8.3 + MariaDB + Redis                     │
│  /var/www/lijicheng.cn/  ──→ 第一个站点                │
│  /var/www/haoyu.ai/      ──→ 第二个站点                │
└─────────────────────────────────────────────────────────┘
```

---

## 📌 三大场景速查

### 场景 1️⃣：首次部署（建立 LEMP 环境）

**命令**：
```bash
cd examples/
./bare-metal-deployment-example.sh
```

**执行流程**：
```
Step 1: 准备服务器 (5-10分钟)
  └─ 安装 Nginx, PHP 8.3, MariaDB, Redis
  └─ 配置防火墙、Fail2Ban、BBR
  └─ 系统优化

Step 2: 部署 WordPress (3-5分钟)
  └─ 创建数据库
  └─ 安装 WordPress
  └─ 配置 Nginx 虚拟主机
  └─ 安装性能优化插件

Step 3: 配置 HTTPS (2-3分钟)
  └─ 申请 Let's Encrypt SSL 证书
  └─ 配置 Nginx HTTPS
  └─ 更新 WordPress URL
```

**何时使用**：
- ✅ 全新的服务器
- ✅ 第一次部署 WordPress

**能否重复运行**：
- ❌ **不建议**！会覆盖现有配置

---

### 场景 2️⃣：添加新站点（多站点部署）⭐

**命令**：
```bash
cd examples/
./add-new-site.sh haoyu.ai admin@haoyu.ai
```

**执行流程**：
```
跳过 Step 1 (LEMP 环境已存在)
  
执行 Step 2: 部署新 WordPress (3-5分钟)
  └─ 创建新数据库（独立）
  └─ 创建 WordPress 目录（独立）
  └─ 配置 Nginx 虚拟主机（独立）
  └─ 安装 WordPress

执行 Step 3: 配置 SSL (2-3分钟)
  └─ 申请新域名的 SSL 证书（独立）
  └─ 更新 Nginx 配置
```

**何时使用**：
- ✅ 服务器已有站点运行
- ✅ 想添加第二个、第三个站点
- ✅ LEMP 环境已就绪

**能否重复运行**：
- ⚠️ 针对同一域名不要重复运行
- ✅ 针对不同域名可以多次运行

**对现有站点的影响**：
- ✅ **无影响**！完全独立部署

---

### 场景 3️⃣：卸载站点

**命令**：
```bash
cd examples/
./remove-site.sh haoyu.ai
```

**删除内容**：
```
✓ WordPress 文件
✓ 数据库和数据库用户
✓ Nginx 虚拟主机配置
✓ SSL 证书
✓ 日志文件
```

**何时使用**：
- ✅ 不再需要某个站点
- ✅ 释放服务器资源
- ✅ 清理测试站点

**能否恢复**：
- ❌ **不可逆操作**！
- ✅ 但脚本会提示备份数据库

**对其他站点的影响**：
- ✅ **无影响**！只删除指定站点

---

## 🏗️ 多站点架构一览

### 文件系统布局
```
/var/www/
├── lijicheng.cn/              # 站点 1
│   ├── wp-content/
│   ├── wp-config.php          # 独立配置
│   └── ...
└── haoyu.ai/                  # 站点 2
    ├── wp-content/
    ├── wp-config.php          # 独立配置
    └── ...

/etc/nginx/conf.d/
├── lijicheng.cn.conf          # 站点 1 虚拟主机
└── haoyu.ai.conf              # 站点 2 虚拟主机

/etc/letsencrypt/live/
├── lijicheng.cn/              # 站点 1 SSL 证书
└── haoyu.ai/                  # 站点 2 SSL 证书
```

### 数据库布局
```sql
-- 完全独立的数据库
CREATE DATABASE wp_lijicheng_cn;  -- 站点 1
CREATE DATABASE wp_haoyu_ai;      -- 站点 2

-- 独立的数据库用户
CREATE USER 'wp_lijicheng_cn'@'localhost';
CREATE USER 'wp_haoyu_ai'@'localhost';
```

### 共享资源
```
✓ Nginx 进程
✓ PHP-FPM 进程池
✓ MariaDB 服务
✓ Redis 服务（通过 key 前缀隔离）
✓ 系统资源（CPU、内存、磁盘）
```

---

## 💡 关键问题速查

### Q1: 重新运行脚本会有影响吗？

| 脚本 | 能否重复运行 | 风险等级 | 说明 |
|------|-------------|---------|------|
| `bare-metal-deployment-example.sh` | ❌ 不建议 | 🔴 高 | 会覆盖 wp-config.php，导致 Salt Keys 改变 |
| `add-new-site.sh` (相同域名) | ❌ 不建议 | 🔴 高 | 会覆盖现有站点配置 |
| `add-new-site.sh` (不同域名) | ✅ 可以 | 🟢 低 | 互不影响 |
| `remove-site.sh` | ⚠️ 谨慎 | 🔴 高 | 不可逆操作 |

**结论**：
- ✅ 添加新站点：安全，随时可以
- ❌ 重新部署现有站点：危险，避免操作
- ⚠️ 卸载站点：不可逆，务必备份

---

### Q2: 2核2G 能跑几个站点？

| 并发量 | 推荐站点数 | 说明 |
|--------|-----------|------|
| 10 人 | 2-3 个 | ✅ 完全够用，性能充裕 |
| 50 人 | 1-2 个 | ⚠️ 需要优化配置 |
| 100 人 | 1 个 | ⚠️ 建议升级服务器 |

**您的情况**：10 人并发
- ✅ **可以部署 2-3 个站点**
- ✅ 性能完全不是问题
- ✅ 无需担心资源不足

---

### Q3: 站点之间会互相影响吗？

| 资源 | 是否独立 | 互相影响概率 |
|------|---------|-------------|
| WordPress 文件 | ✅ 完全独立 | 0% |
| 数据库 | ✅ 完全独立 | 0% |
| Nginx 配置 | ✅ 完全独立 | 0% |
| SSL 证书 | ✅ 完全独立 | 0% |
| PHP-FPM 进程池 | ⚠️ 共享 | 5% (低) |
| MySQL 服务 | ⚠️ 共享 | 5% (低) |
| Redis 缓存 | ⚠️ 共享但隔离 | 1% (极低) |

**结论**：基本不会互相影响（已做好隔离）

---

### Q4: 如何验证部署成功？

**快速验证**：
```bash
# 1. 访问站点前台
curl -I https://haoyu.ai
# 应该返回 200 OK

# 2. 访问站点后台
curl -I https://haoyu.ai/wp-admin
# 应该返回 302 (重定向到登录页)

# 3. 检查 SSL 证书
echo | openssl s_client -connect haoyu.ai:443 -servername haoyu.ai 2>/dev/null | grep 'Verify return code'
# 应该返回 Verify return code: 0 (ok)
```

**详细验证**：
```bash
# SSH 登录服务器
ssh root@120.77.170.69

# 运行性能检查脚本
bash /tmp/performance-check.sh
```

---

### Q5: 如何备份和恢复？

**备份**：
```bash
# 数据库备份
mysqldump -u wp_haoyu_ai -p wp_haoyu_ai > backup_haoyu_ai.sql

# 文件备份
tar -czf haoyu_ai_files.tar.gz /var/www/haoyu.ai

# 下载到本地
scp root@120.77.170.69:~/backup_*.{sql,tar.gz} ./
```

**恢复**：
```bash
# 上传文件到服务器
scp backup_*.{sql,tar.gz} root@120.77.170.69:~/

# SSH 登录服务器
ssh root@120.77.170.69

# 恢复文件
tar -xzf haoyu_ai_files.tar.gz -C /

# 恢复数据库
mysql -u wp_haoyu_ai -p wp_haoyu_ai < backup_haoyu_ai.sql
```

---

## 🔧 常用命令速查

### 服务管理
```bash
# 重启 Nginx
systemctl restart nginx

# 重启 PHP-FPM
systemctl restart php-fpm

# 重启 MariaDB
systemctl restart mariadb

# 重启 Redis
systemctl restart redis

# 查看所有服务状态
systemctl status nginx php-fpm mariadb redis
```

### 日志查看
```bash
# Nginx 错误日志
tail -f /var/log/nginx/error.log

# Nginx 访问日志（指定站点）
tail -f /var/log/nginx/haoyu.ai/access.log

# PHP-FPM 错误日志
tail -f /var/log/php-fpm/www-error.log

# MariaDB 错误日志
tail -f /var/log/mariadb/mariadb.log
```

### WordPress 管理（WP-CLI）
```bash
# 进入站点目录
cd /var/www/haoyu.ai

# 查看 WordPress 版本
wp core version --allow-root

# 更新 WordPress
wp core update --allow-root

# 列出插件
wp plugin list --allow-root

# 更新插件
wp plugin update --all --allow-root

# 清空缓存
wp cache flush --allow-root

# 重新生成缩略图
wp media regenerate --allow-root
```

### 性能监控
```bash
# 实时资源监控
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看 MySQL 进程
mysql -u root -p -e "SHOW PROCESSLIST;"

# 查看 PHP-FPM 进程
ps aux | grep php-fpm | wc -l

# 查看 Nginx 连接数
ss -s
```

---

## 📞 获取帮助

**详细文档**：
- 多站点部署：`MULTI-SITE-GUIDE.md`
- 性能优化：`../PERFORMANCE-OPTIMIZATION.md`
- 完整 README：`README.md`

**示例脚本**：
- 初次部署：`bare-metal-deployment-example.sh`
- 添加站点：`add-new-site.sh`
- 卸载站点：`remove-site.sh`

**Ansible Playbook**：
- Step 1：`../ansible/playbooks/playbook_step1_prepare_server.yml`
- Step 2：`../ansible/playbooks/playbook_step2_deploy_wordpress.yml`
- Step 3：`../ansible/playbooks/playbook_step3_secure_ssl.yml`

---

**版本**: v2.0 | **更新日期**: 2025-01-11

**适用于**: Rocky Linux 9, 2核2G+ 服务器, 多站点部署场景

