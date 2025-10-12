# 多站点部署指南

本指南说明如何在同一台服务器上部署和管理多个 WordPress 站点。

## 📋 目录

- [架构说明](#架构说明)
- [添加新站点](#添加新站点)
- [卸载站点](#卸载站点)
- [常见问题](#常见问题)
- [注意事项](#注意事项)

---

## 🏗️ 架构说明

### 多站点支持原理

现有的 Playbook 设计已经天然支持多站点部署，因为：

1. **独立的目录结构**
   ```
   /var/www/
   ├── lijicheng.cn/          # 第一个站点
   │   ├── wp-content/
   │   ├── wp-config.php
   │   └── ...
   └── haoyu.ai/              # 第二个站点
       ├── wp-content/
       ├── wp-config.php
       └── ...
   ```

2. **独立的 Nginx 配置**
   ```
   /etc/nginx/conf.d/
   ├── lijicheng.cn.conf      # 第一个站点的虚拟主机
   └── haoyu.ai.conf          # 第二个站点的虚拟主机
   ```

3. **独立的数据库**
   ```sql
   CREATE DATABASE wp_lijicheng_cn;  -- 第一个站点
   CREATE DATABASE wp_haoyu_ai;      -- 第二个站点
   ```

4. **独立的 SSL 证书**
   ```
   /etc/letsencrypt/live/
   ├── lijicheng.cn/          # 第一个站点的证书
   └── haoyu.ai/              # 第二个站点的证书
   ```

### 共享的资源

- **LEMP 环境**：Nginx + PHP-FPM + MariaDB + Redis
- **系统优化**：内核参数、BBR 拥塞控制等
- **安全配置**：防火墙、Fail2Ban、SSL 配置等

---

## ➕ 添加新站点

### 前提条件

1. ✅ 服务器已通过 `bare-metal-deployment-example.sh` 完成初始化
2. ✅ LEMP 环境已正常运行（Nginx、PHP、MariaDB）
3. ✅ 新域名已正确解析到服务器 IP
4. ✅ 服务器资源充足（对于 10 人并发，2核2G 完全够用）

### 方案一：使用自动化脚本（推荐）⭐

#### 1. 准备脚本

```bash
cd /path/to/siteForge/examples
chmod +x add-new-site.sh
```

#### 2. 运行脚本

```bash
./add-new-site.sh haoyu.ai admin@haoyu.ai
```

**参数说明：**
- 第一个参数：新站点域名
- 第二个参数：管理员邮箱（用于 SSL 证书通知）
- 第三个参数（可选）：API 地址，默认为 `http://localhost:3000/api`

#### 3. 脚本执行流程

```
Step 1: 部署 WordPress
  ├─ 创建新的 WordPress 目录
  ├─ 创建独立的数据库
  ├─ 配置 Nginx 虚拟主机
  └─ 安装 WordPress 核心文件

Step 2: 配置 HTTPS
  ├─ 申请 Let's Encrypt SSL 证书
  ├─ 更新 Nginx 配置启用 HTTPS
  └─ 更新 WordPress URL 为 HTTPS
```

#### 4. 完成后

- 🌐 前台地址：`https://haoyu.ai`
- 🔧 后台地址：`https://haoyu.ai/wp-admin`
- 📄 部署信息会保存到本地 JSON 文件
- 🔐 请妥善保管管理员密码和数据库密码

---

### 方案二：手动部署

如果您更喜欢完全可控的手动部署，可以按照以下步骤操作：

#### 1. SSH 登录服务器

```bash
ssh root@120.77.170.69
```

#### 2. 创建数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库和用户
CREATE DATABASE wp_haoyu_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wp_haoyu_ai'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON wp_haoyu_ai.* TO 'wp_haoyu_ai'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. 创建 WordPress 目录

```bash
mkdir -p /var/www/haoyu.ai
chown apache:apache /var/www/haoyu.ai
```

#### 4. 下载 WordPress

```bash
cd /var/www/haoyu.ai
wp core download --locale=zh_CN --allow-root
```

#### 5. 配置 WordPress

```bash
wp config create \
  --dbname=wp_haoyu_ai \
  --dbuser=wp_haoyu_ai \
  --dbpass=your_secure_password \
  --path=/var/www/haoyu.ai \
  --allow-root

wp core install \
  --url=http://haoyu.ai \
  --title="Haoyu AI" \
  --admin_user=admin \
  --admin_password=admin_password \
  --admin_email=admin@haoyu.ai \
  --path=/var/www/haoyu.ai \
  --allow-root
```

#### 6. 创建 Nginx 虚拟主机

```bash
cat > /etc/nginx/conf.d/haoyu.ai.conf << 'EOF'
server {
    listen 80;
    server_name haoyu.ai;
    root /var/www/haoyu.ai;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php-fpm/www.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOF

# 验证并重启 Nginx
nginx -t
systemctl reload nginx
```

#### 7. 申请 SSL 证书

```bash
certbot certonly --webroot \
  -w /var/www/haoyu.ai \
  -d haoyu.ai \
  --email admin@haoyu.ai \
  --agree-tos \
  --non-interactive

# 更新 Nginx 配置启用 HTTPS
# （参考 templates/wordpress-ssl.conf.j2）
```

---

## 🗑️ 卸载站点

### 使用自动化脚本（推荐）

#### 1. 准备脚本

```bash
cd /path/to/siteForge/examples
chmod +x remove-site.sh
```

#### 2. 运行脚本

```bash
./remove-site.sh haoyu.ai
```

#### 3. 脚本会删除

- ✅ WordPress 文件目录 `/var/www/haoyu.ai`
- ✅ Nginx 虚拟主机配置 `/etc/nginx/conf.d/haoyu.ai.conf`
- ✅ SSL 证书 `/etc/letsencrypt/live/haoyu.ai`
- ✅ 数据库和数据库用户
- ✅ 自动重新加载 Nginx

#### 4. 数据备份

脚本会在删除前询问是否备份数据库，强烈建议选择 `Y`（是）。

备份文件格式：`backup_haoyu.ai_20250111_143000.sql`

---

## ❓ 常见问题

### Q1: 重新运行部署脚本会影响现有站点吗？

**A:** 分情况讨论：

- ✅ **Step 1 (prepare_server.yml)**：相对安全，因为是幂等操作，但不建议重复运行
- ⚠️ **Step 2 (deploy_wordpress.yml)**：**有风险！** 会覆盖 `wp-config.php`，导致 Salt Keys 改变，用户会话失效
- ⚠️ **Step 3 (secure_ssl.yml)**：中等风险，会更新 Nginx 配置

**建议：不要在生产环境重新运行完整流程！**

如果需要修改配置，请：
1. 手动编辑配置文件
2. 或使用 Ansible tags 运行特定任务：
   ```bash
   ansible-playbook playbook.yml --tags "nginx" --skip-tags "wp-config"
   ```

### Q2: 一台 2核2G 服务器能运行几个站点？

**A:** 对于 10 人并发的情况：

- **2-3 个站点**：完全没问题 ✅
- **4-5 个站点**：需要优化配置 ⚠️
- **6+ 个站点**：建议升级服务器 ❌

**关键因素：**
- 实际并发数（不是用户数）
- 站点复杂度（插件数量、页面大小）
- 是否有缓存（Redis、FastCGI Cache）

对于您的场景（10人并发），2个站点绰绰有余。

### Q3: 两个站点会互相影响吗？

**A:** 可能会，但概率很低：

**不会互相影响：**
- ✅ 文件目录完全独立
- ✅ 数据库完全独立
- ✅ Nginx 配置独立
- ✅ SSL 证书独立

**可能互相影响：**
- ⚠️ 共享 PHP-FPM 进程池（一个站点卡死可能影响另一个）
- ⚠️ 共享数据库服务（一个站点的慢查询可能影响另一个）
- ⚠️ 共享 Redis（缓存键需要正确隔离）

**解决方案：**
- 已配置 `WP_CACHE_KEY_SALT` 确保 Redis 缓存隔离
- FastCGI Cache 按域名自动隔离
- 可以为每个站点配置独立的 PHP-FPM 进程池（高级配置）

### Q4: 如何监控多个站点的性能？

**A:** 推荐使用以下工具：

1. **服务器资源监控**
   ```bash
   # 实时监控
   htop
   
   # 查看 PHP-FPM 状态
   systemctl status php-fpm
   
   # 查看 Nginx 状态
   systemctl status nginx
   
   # 查看数据库连接数
   mysql -u root -p -e "SHOW PROCESSLIST;"
   ```

2. **站点性能测试**
   ```bash
   # 在服务器上运行
   /tmp/performance-check.sh
   
   # 或使用 curl 测试响应时间
   curl -o /dev/null -s -w "%{time_total}\n" https://haoyu.ai
   ```

3. **WordPress 监控插件**
   - Query Monitor（监控数据库查询）
   - Health Check（系统健康检查）
   - Redis Object Cache（查看缓存命中率）

### Q5: SSL 证书会自动续期吗？

**A:** 会！Certbot 已配置自动续期：

- 续期时间：每天凌晨 3:30
- 证书有效期：90 天
- 提前续期时间：30 天（证书到期前 30 天开始尝试续期）

查看续期配置：
```bash
crontab -l | grep certbot
```

手动测试续期：
```bash
certbot renew --dry-run
```

### Q6: 如何备份多个站点？

**A:** 需要分别备份每个站点的：

**1. 数据库备份**
```bash
# 第一个站点
mysqldump -u wp_lijicheng_cn -p wp_lijicheng_cn > backup_lijicheng_cn.sql

# 第二个站点
mysqldump -u wp_haoyu_ai -p wp_haoyu_ai > backup_haoyu_ai.sql
```

**2. 文件备份**
```bash
# 第一个站点
tar -czf lijicheng_cn_files.tar.gz /var/www/lijicheng.cn

# 第二个站点
tar -czf haoyu_ai_files.tar.gz /var/www/haoyu.ai
```

**3. 使用 WordPress 备份插件**
- UpdraftPlus（推荐）
- BackWPup
- Duplicator

---

## ⚠️ 注意事项

### 部署前

1. ✅ **DNS 解析**：确保新域名已正确解析到服务器 IP
   ```bash
   # 验证 DNS 解析
   nslookup haoyu.ai
   dig haoyu.ai
   ```

2. ✅ **防火墙端口**：确保 80 和 443 端口已开放
   ```bash
   # 检查防火墙规则
   firewall-cmd --list-all
   ```

3. ✅ **服务器资源**：确保有足够的磁盘空间和内存
   ```bash
   # 检查磁盘空间
   df -h
   
   # 检查内存使用
   free -h
   ```

### 部署时

1. ⚠️ **避免在高峰期操作**：部署可能导致短暂的服务中断（Nginx 重启）

2. ⚠️ **保存部署信息**：特别是数据库密码和管理员密码

3. ⚠️ **Let's Encrypt 限制**：
   - 单域名每周最多 5 次失败
   - 单 IP 每 3 小时最多 10 个证书
   - 如果失败，请检查 DNS 后再试

### 部署后

1. ✅ **验证站点访问**：
   ```bash
   curl -I https://haoyu.ai
   ```

2. ✅ **检查 SSL 评级**：
   - https://www.ssllabs.com/ssltest/analyze.html?d=haoyu.ai

3. ✅ **测试后台登录**：
   - https://haoyu.ai/wp-admin

4. ✅ **配置 WordPress**：
   - 安装必要的插件
   - 设置主题
   - 配置缓存插件

### 维护建议

1. **定期备份**（每周一次）
   - 数据库备份
   - 文件备份
   - 下载到本地保存

2. **定期更新**（每月一次）
   - WordPress 核心更新
   - 插件更新
   - 主题更新
   - 系统安全补丁

3. **监控资源使用**（每天查看）
   - 磁盘空间
   - 内存使用
   - CPU 负载
   - 数据库大小

4. **安全加固**
   - 定期修改密码
   - 启用两步验证
   - 限制登录尝试（已配置 Fail2Ban）
   - 隐藏 WordPress 版本号

---

## 📚 相关文档

- [初始部署指南](./README.md)
- [性能优化文档](../PERFORMANCE-OPTIMIZATION.md)
- [网络问题排查](./README-NETWORK-ISSUES.md)
- [Bare Metal 部署示例](./bare-metal-deployment-example.sh)

---

## 🆘 需要帮助？

如果遇到问题，请提供以下信息：

1. 错误信息（完整的错误日志）
2. 服务器配置（CPU、内存、磁盘）
3. 已部署的站点数量
4. Nginx 错误日志：`/var/log/nginx/error.log`
5. PHP-FPM 错误日志：`/var/log/php-fpm/www-error.log`
6. WordPress 调试日志：`/var/www/域名/wp-content/debug.log`

---

## 📝 版本历史

- **v1.0** (2025-01-11)
  - 初始版本
  - 支持多站点部署
  - 支持站点卸载
  - 包含自动化脚本

---

**祝您使用愉快！** 🎉

