# WordPress自动化部署 - Ansible配置

本目录包含用于自动化部署WordPress的Ansible配置文件和Playbooks。

## 目录结构

```
ansible/
├── ansible.cfg              # Ansible配置文件
├── requirements.yml         # Collections依赖声明
├── inventory/               # 主机清单目录
│   └── hosts.yml           # 主机配置文件
├── group_vars/             # 组变量目录
│   ├── all.yml             # 全局变量
│   └── wordpress_servers.yml # WordPress服务器组变量
└── playbooks/              # Playbook目录
    ├── server-check.yml    # 服务器检查
    ├── docker-install.yml  # Docker安装
    ├── wordpress-deploy.yml # WordPress部署
    └── wordpress-manage.yml # WordPress管理
```

## 支持的操作系统

- **Rocky Linux 8/9** (专用优化)

本项目专为 Rocky Linux 优化，不支持其他操作系统。

## 前置要求

### 控制节点（运行Ansible的机器）
- Python 3.6+
- Ansible 2.9+
- 网络连接到目标服务器

### 目标服务器
- SSH访问权限
- sudo权限
- Python 3.x
- 最低配置：2核CPU，2GB内存，40GB磁盘

## 快速开始

### 0. 安装依赖

首先安装所需的 Ansible Collections：

```bash
cd ansible
ansible-galaxy collection install -r requirements.yml
```

### 1. 配置主机清单

编辑 `inventory/hosts.yml` 文件，添加目标服务器信息：

```yaml
all:
  children:
    wordpress_servers:
      hosts:
        wp_server_1:
          ansible_host: 192.168.1.100
          ansible_user: root
          ansible_password: "your_password"
          ansible_port: 22
          server_os: rocky
```

### 2. 配置变量

根据需要修改 `group_vars/all.yml` 和 `group_vars/wordpress_servers.yml` 中的配置。

### 3. 执行部署

#### 检查服务器状态
```bash
ansible-playbook -i inventory/hosts.yml playbooks/server-check.yml
```

#### 安装Docker环境
```bash
ansible-playbook -i inventory/hosts.yml playbooks/docker-install.yml
```

#### 部署WordPress
```bash
ansible-playbook -i inventory/hosts.yml playbooks/wordpress-deploy.yml \
  --extra-vars "wordpress_config={
    'site_name': 'My WordPress Site',
    'admin_username': 'admin',
    'admin_password': 'secure_password',
    'admin_email': 'admin@example.com',
    'db_name': 'wordpress',
    'db_user': 'wpuser',
    'db_password': 'db_password'
  }"
```

#### 完整部署流程
```bash
# 1. 检查服务器
ansible-playbook -i inventory/hosts.yml playbooks/server-check.yml

# 2. 安装Docker
ansible-playbook -i inventory/hosts.yml playbooks/docker-install.yml

# 3. 部署WordPress
ansible-playbook -i inventory/hosts.yml playbooks/wordpress-deploy.yml \
  --extra-vars "wordpress_config={...}"
```

## WordPress管理操作

### 启动服务
```bash
ansible-playbook -i inventory/hosts.yml playbooks/wordpress-manage.yml \
  --extra-vars "action=start"
```

### 停止服务
```bash
ansible-playbook -i inventory/hosts.yml playbooks/wordpress-manage.yml \
  --extra-vars "action=stop"
```

### 重启服务
```bash
ansible-playbook -i inventory/hosts.yml playbooks/wordpress-manage.yml \
  --extra-vars "action=restart"
```

### 查看状态
```bash
ansible-playbook -i inventory/hosts.yml playbooks/wordpress-manage.yml \
  --extra-vars "action=status"
```

### 更新WordPress
```bash
ansible-playbook -i inventory/hosts.yml playbooks/wordpress-manage.yml \
  --extra-vars "action=update"
```

### 备份WordPress
```bash
ansible-playbook -i inventory/hosts.yml playbooks/wordpress-manage.yml \
  --extra-vars "action=backup"
```

### 性能优化
```bash
ansible-playbook -i inventory/hosts.yml playbooks/wordpress-manage.yml \
  --extra-vars "action=optimize"
```

### 安全检查
```bash
ansible-playbook -i inventory/hosts.yml playbooks/wordpress-manage.yml \
  --extra-vars "action=security"
```

## 配置说明

### 全局变量 (group_vars/all.yml)

- `project_dir`: WordPress项目目录，默认 `/opt/wordpress`
- `backup_dir`: 备份目录，默认 `/opt/backups`
- `wordpress.version`: WordPress版本，默认 `latest`
- `mysql.version`: MySQL版本，默认 `10.6`
- `caddy.version`: Caddy版本，默认 `2-alpine`

### WordPress配置变量

通过 `--extra-vars` 传递WordPress配置：

```yaml
wordpress_config:
  site_name: "网站名称"
  admin_username: "管理员用户名"
  admin_password: "管理员密码"
  admin_email: "管理员邮箱"
  db_name: "数据库名"
  db_user: "数据库用户"
  db_password: "数据库密码"
```

## 安全建议

1. **使用SSH密钥认证**：避免在配置文件中明文存储密码
2. **启用防火墙**：限制不必要的端口访问
3. **定期更新**：保持系统和WordPress组件最新
4. **备份策略**：设置自动备份任务
5. **监控日志**：定期检查系统和应用日志

## 故障排除

### 常见问题

1. **SSH连接失败**
   - 检查服务器IP和端口
   - 确认SSH服务运行状态
   - 验证用户名和密码

2. **权限不足**
   - 确保用户有sudo权限
   - 检查文件和目录权限

3. **Docker安装失败**
   - 检查网络连接
   - 确认操作系统版本支持
   - 查看安装日志

4. **WordPress无法访问**
   - 检查防火墙设置
   - 确认端口未被占用
   - 查看容器运行状态

### 日志位置

- Ansible执行日志: `/tmp/ansible.log`
- WordPress日志: `{project_dir}/logs/`
- 备份日志: `{project_dir}/logs/backup.log`

### 调试命令

```bash
# 检查容器状态
docker compose ps

# 查看容器日志
docker compose logs

# 进入容器调试
docker compose exec wordpress bash
docker compose exec mysql bash

# 使用 WP-CLI
docker compose exec wordpress wp --allow-root --info

# 检查网络连接
docker network ls
docker network inspect wordpress_network
```

## 自定义扩展

### 添加新的Playbook

1. 在 `playbooks/` 目录创建新的YAML文件
2. 定义任务和变量
3. 在主Playbook中引用或单独执行

### 创建自定义角色

1. 在 `roles/` 目录创建角色目录结构
2. 定义任务、变量、模板等
3. 在Playbook中使用角色

### 环境特定配置

1. 在 `group_vars/` 或 `host_vars/` 中创建环境特定变量文件
2. 使用不同的inventory文件管理不同环境
3. 通过 `--extra-vars` 覆盖默认配置

## 支持与贡献

如有问题或建议，请提交Issue或Pull Request。

## 许可证

本项目采用MIT许可证。
