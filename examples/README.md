# 示例和工具

本目录包含 WordPress 部署的示例脚本和验证工具。

## 📋 文件说明

### 1. performance-check.sh
**性能验证脚本**（针对 2核2G 服务器优化配置）

**功能**：
- 检查 PHP-FPM 配置（max_children、OPcache、上传大小）
- 检查 MySQL/MariaDB 配置（InnoDB Buffer Pool、最大连接数）
- 检查 Redis 服务和内存配置
- 检查 Nginx FastCGI Cache 配置
- 检查系统内核参数（TCP BBR）
- 检查 WordPress 性能插件
- 检查服务状态和资源使用
- 简单性能测试

**使用方法**：
```bash
# 部署时会自动上传到服务器 /tmp/performance-check.sh
# SSH 登录服务器后运行：
sudo bash /tmp/performance-check.sh
```

**预期输出**：
- ✅ 通过项数
- ❌ 失败项数  
- ⚠️ 警告项数
- 详细的配置检查结果

---

### 2. bare-metal-deployment-example.sh
**裸金属部署完整示例**

演示如何使用 Ansible playbook 部署 WordPress 到裸金属服务器（初始部署）。

**使用方法**：
```bash
./bare-metal-deployment-example.sh
```

---

### 3. add-new-site.sh ⭐ **新增**
**在现有服务器上添加新站点**

**功能**：
- 在已部署 LEMP 环境的服务器上添加新的 WordPress 站点
- 不影响现有站点
- 自动创建独立的数据库、Nginx 配置、SSL 证书
- 适用于多站点部署场景

**使用方法**：
```bash
./add-new-site.sh <新域名> <管理员邮箱> [API地址]

# 示例
./add-new-site.sh haoyu.ai admin@haoyu.ai
```

**前提条件**：
- ✅ 服务器已通过 `bare-metal-deployment-example.sh` 完成初始化
- ✅ 新域名已正确解析到服务器 IP
- ✅ LEMP 环境正常运行

**详细说明**: 参见 `MULTI-SITE-GUIDE.md`

---

### 4. remove-site.sh ⭐ **新增**
**卸载 WordPress 站点**

**功能**：
- 完整卸载指定的 WordPress 站点
- 删除文件、数据库、Nginx 配置、SSL 证书
- 支持备份数据库（强烈推荐）
- 不影响其他站点

**使用方法**：
```bash
./remove-site.sh <要删除的域名> [SSH密码]

# 示例
./remove-site.sh haoyu.ai
```

**安全提示**：
- ⚠️ 操作不可逆！删除前会要求两次确认
- 建议先备份数据库
- 脚本会自动提示备份选项

**详细说明**: 参见 `MULTI-SITE-GUIDE.md`

---

### 5. MULTI-SITE-GUIDE.md ⭐ **新增**
**多站点部署完整指南**

详细说明如何在同一台服务器上部署和管理多个 WordPress 站点。

**内容包括**：
- 多站点架构原理
- 添加新站点的两种方案
- 卸载站点的步骤
- 常见问题解答（FAQ）
- 注意事项和最佳实践

---

### 6. bare-metal-postman-collection.json
**Postman API 测试集合**

用于测试部署相关的 API 接口。

---

### 7. fix-https-on-server.sh
**HTTPS 修复脚本**

修复 SSL 证书相关问题。

---

### 8. test-step3-only.sh
**Step 3 单独测试**

仅测试 SSL 配置步骤。

---

## 🚀 快速开始

### 场景 1：首次部署 WordPress

使用 API 方式（推荐）：
```bash
# 运行完整部署脚本
./bare-metal-deployment-example.sh
```

或使用 Ansible 方式：
```bash
# 1. 准备服务器环境
ansible-playbook -i ansible/inventory/hosts.yml \
  ansible/playbooks/playbook_step1_prepare_server.yml \
  --extra-vars @vars.json

# 2. 部署 WordPress
ansible-playbook -i ansible/inventory/hosts.yml \
  ansible/playbooks/playbook_step2_deploy_wordpress.yml \
  --extra-vars @vars.json

# 3. 配置 SSL（可选）
ansible-playbook -i ansible/inventory/hosts.yml \
  ansible/playbooks/playbook_step3_secure_ssl.yml \
  --extra-vars @vars.json
```

---

### 场景 2：在现有服务器上添加新站点 ⭐

```bash
# 添加第二个、第三个站点...
./add-new-site.sh haoyu.ai admin@haoyu.ai
```

**特点**：
- ✅ 不影响现有站点
- ✅ 复用 LEMP 环境
- ✅ 自动配置独立数据库和 SSL
- ✅ 3-5 分钟完成部署

**详细指南**: 参见 `MULTI-SITE-GUIDE.md`

---

### 场景 3：卸载某个站点

```bash
# 完整删除指定站点（支持数据库备份）
./remove-site.sh haoyu.ai
```

**注意**：操作不可逆，删除前会要求两次确认！

---

### 验证部署

```bash
# SSH 登录服务器
ssh root@your-server

# 运行性能验证脚本
sudo bash /tmp/performance-check.sh
```

---

## 📖 相关文档

- **多站点部署指南**: `MULTI-SITE-GUIDE.md` ⭐ **重要**
- **性能优化详细文档**: `../PERFORMANCE-OPTIMIZATION.md`
- **部署说明**: `../DEPLOYMENT.md`
- **项目 README**: `../README.md`

---

## ⚠️ 注意事项

### 通用注意事项
1. **performance-check.sh** 需要在部署完成后运行
2. 脚本需要 root 权限（使用 sudo）
3. 检查结果仅供参考，具体配置可能因环境而异
4. 如有失败项，请查看详细输出并根据实际情况调整

### 多站点部署注意事项 ⭐
1. **不要重复运行完整部署流程**：会覆盖现有站点的配置
2. **DNS 解析**：添加新站点前，确保域名已解析到服务器 IP
3. **资源评估**：2核2G 服务器建议部署 2-3 个低并发站点
4. **数据备份**：删除站点前务必备份数据库
5. **Let's Encrypt 限制**：单域名每周最多 5 次证书申请失败

### 安全建议
1. **妥善保管密码**：脚本输出的数据库密码和管理员密码要保存好
2. **定期备份**：建议每周备份一次数据库和文件
3. **定期更新**：保持 WordPress 核心、插件、主题的最新版本
4. **监控资源**：定期检查磁盘空间、内存使用情况

---

## 🆘 故障排查

### 问题 1：SSL 证书申请失败
**原因**：DNS 未解析或防火墙问题
**解决**：
```bash
# 检查 DNS
nslookup your-domain.com

# 检查防火墙
firewall-cmd --list-all

# 手动申请证书
certbot certonly --webroot -w /var/www/your-domain.com -d your-domain.com
```

### 问题 2：网站 502 错误
**原因**：PHP-FPM 未运行或权限问题
**解决**：
```bash
# 检查 PHP-FPM 状态
systemctl status php-fpm

# 重启 PHP-FPM
systemctl restart php-fpm

# 检查 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

### 问题 3：添加站点时 API 返回错误
**原因**：服务器资源不足或 LEMP 环境未就绪
**解决**：
```bash
# 检查服务状态
systemctl status nginx php-fpm mariadb

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

### 更多帮助
遇到问题？请查看 `MULTI-SITE-GUIDE.md` 的常见问题章节。

---

**适用环境**: Rocky Linux 9, 2核2G+ 服务器

**版本**: v2.0 (支持多站点部署)

