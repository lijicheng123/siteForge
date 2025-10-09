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

演示如何使用 Ansible playbook 部署 WordPress 到裸金属服务器。

---

### 3. bare-metal-postman-collection.json
**Postman API 测试集合**

用于测试部署相关的 API 接口。

---

### 4. fix-https-on-server.sh
**HTTPS 修复脚本**

修复 SSL 证书相关问题。

---

### 5. test-step3-only.sh
**Step 3 单独测试**

仅测试 SSL 配置步骤。

---

## 🚀 快速开始

### 部署 WordPress（性能优化版）

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

### 验证部署

```bash
# SSH 登录服务器
ssh root@your-server

# 运行性能验证脚本
sudo bash /tmp/performance-check.sh
```

---

## 📖 相关文档

- **性能优化详细文档**: `../PERFORMANCE-OPTIMIZATION.md`
- **部署说明**: `../DEPLOYMENT.md`
- **项目 README**: `../README.md`

---

## ⚠️ 注意事项

1. **performance-check.sh** 需要在部署完成后运行
2. 脚本需要 root 权限（使用 sudo）
3. 检查结果仅供参考，具体配置可能因环境而异
4. 如有失败项，请查看详细输出并根据实际情况调整

---

**适用环境**: Rocky Linux 9, 2核2G 服务器

