# 网络下载优化方案

## 📋 问题概述

部署 WordPress 时需要从国外服务器下载多个资源，可能因网络问题导致超时或失败。本文档详细列出所有需要下载的资源及其解决方案。

---

## 🎯 需要下载的资源清单

### 1. WP-CLI 工具
- **原始地址**: `https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar`
- **问题**: GitHub raw 文件访问慢或超时
- **解决方案**: ✅ 已改为 Gitee 镜像
- **新地址**: `https://gitee.com/fuckgitee2speed/wp-bare-metal-mirrors/raw/main/wp-cli.phar`
- **影响文件**: `ansible/playbooks/playbook_step1_prepare_server.yml`

### 2. WordPress 核心文件
- **原始下载方式**: `wp core download` 从 `downloads.wordpress.org` 下载
- **问题**: 
  - 下载超时（600秒后仍未完成）
  - 中文版 `wordpress-6.8.3-zh_CN.tar.gz` 约 34MB，连接不稳定
- **解决方案**: ✅ 已改为直接从 Gitee 下载 tar.gz 并解压
- **新地址**: `https://gitee.com/fuckgitee2speed/wp-bare-metal-mirrors/raw/main/wordpress-6.8.3-zh_CN.tar.gz`
- **影响文件**: `ansible/playbooks/playbook_step2_deploy_wordpress.yml`
- **实现方式**:
  ```yaml
  - get_url 下载 tar.gz 到 /tmp/
  - unarchive 解压到 /tmp/wordpress/
  - rsync 移动到目标目录
  - 清理临时文件
  ```

### 3. WordPress 插件（性能优化必备）

#### 3.1 Redis Object Cache
- **原始下载**: `wp plugin install redis-cache` 从 `downloads.wordpress.org`
- **问题**: 可能超时
- **解决方案**: ⚠️ 添加重试机制 + 非致命错误
- **配置**:
  - 重试次数: 2 次
  - 超时时间: 300 秒
  - 失败处理: `failed_when: false`（继续部署）

#### 3.2 WP Super Cache
- **原始下载**: `wp plugin install wp-super-cache`
- **问题**: 可能超时
- **解决方案**: ⚠️ 添加重试机制 + 非致命错误
- **配置**: 同上

#### 3.3 Autoptimize
- **原始下载**: `wp plugin install autoptimize`
- **问题**: 可能超时
- **解决方案**: ⚠️ 添加重试机制 + 非致命错误
- **配置**: 同上

#### 3.4 EWWW Image Optimizer
- **原始下载**: `wp plugin install ewww-image-optimizer`
- **问题**: 可能超时
- **解决方案**: ⚠️ 添加重试机制 + 非致命错误
- **配置**: 同上

---

## 🔧 实施的优化措施

### 1. 核心资源：Gitee 镜像（完全解决）

**优点**：
- ✅ 彻底解决网络问题
- ✅ 下载速度快且稳定
- ✅ 不依赖国外服务器

**已应用资源**：
- WP-CLI: `playbook_step1_prepare_server.yml`
- WordPress 核心: `playbook_step2_deploy_wordpress.yml`

### 2. 插件：重试机制 + 降级策略（缓解问题）

**为什么不用镜像？**
- WordPress 插件数量庞大，无法全部镜像
- 插件更新频繁，维护成本高
- 部分插件非必需，失败不影响核心功能

**优化措施**：
```yaml
# 1. 清除代理（避免干扰）
export http_proxy="" https_proxy=""

# 2. 设置超时
timeout: 300

# 3. 重试机制
retries: 2
delay: 5
until: success or already_installed

# 4. 失败不中断
failed_when: false
```

**降级方案**：
- 插件安装失败不会中断整个部署流程
- 部署完成后可在 WordPress 后台手动安装
- 部署摘要会显示每个插件的安装状态

---

## 📊 插件安装状态检查

部署完成后，会在摘要中显示插件安装状态：

```
插件安装状态（如失败可在后台手动安装）：
  Redis Cache: ✓ 已安装 / ✗ 安装失败
  WP Super Cache: ✓ 已安装 / ✗ 安装失败
  Autoptimize: ✓ 已安装 / ✗ 安装失败
  EWWW Image Optimizer: ✓ 已安装 / ✗ 安装失败
```

---

## 🛠️ 手动安装插件（如自动安装失败）

### 方法 1: WordPress 后台安装（推荐）

1. 登录 WordPress 后台: `http://你的域名/wp-admin`
2. 进入 **插件 → 安装插件**
3. 搜索插件名称并安装

### 方法 2: WP-CLI 手动安装

SSH 登录服务器后执行：

```bash
# 进入 WordPress 目录
cd /var/www/你的域名

# 安装插件
wp plugin install redis-cache --activate --allow-root
wp plugin install wp-super-cache --activate --allow-root
wp plugin install autoptimize --activate --allow-root
wp plugin install ewww-image-optimizer --activate --allow-root
```

### 方法 3: 从 Gitee 或本地上传

**如果需要，可以提前上传插件 zip 到 Gitee：**

```bash
# 1. 本地下载插件
https://downloads.wordpress.org/plugin/redis-cache.latest-stable.zip

# 2. 上传到 Gitee

# 3. 修改 playbook 使用 Gitee 地址
- name: "下载插件"
  ansible.builtin.get_url:
    url: "https://gitee.com/你的仓库/redis-cache.zip"
    dest: "/tmp/redis-cache.zip"

- name: "安装插件"
  ansible.builtin.command: >
    wp plugin install /tmp/redis-cache.zip --activate --allow-root
```

---

## 🎯 举一反三：其他可能的下载问题

### 1. PHP Composer 包（如果使用）
- **问题**: Packagist.org 访问慢
- **解决方案**: 使用阿里云镜像
  ```bash
  composer config -g repo.packagist composer https://mirrors.aliyun.com/composer/
  ```

### 2. NPM 包（如果使用）
- **问题**: npmjs.com 访问慢
- **解决方案**: 使用淘宝镜像
  ```bash
  npm config set registry https://registry.npmmirror.com
  ```

### 3. Docker 镜像（如果使用）
- **问题**: Docker Hub 访问慢或被墙
- **解决方案**: 使用国内镜像加速
  ```json
  {
    "registry-mirrors": [
      "https://docker.mirrors.ustc.edu.cn",
      "https://registry.docker-cn.com"
    ]
  }
  ```

### 4. Ansible Galaxy Roles
- **问题**: Galaxy 下载慢
- **解决方案**: 使用清华镜像或提前下载
  ```yaml
  # requirements.yml 指定 Git 源
  - src: https://gitee.com/mirror/ansible-role-nginx
    name: geerlingguy.nginx
  ```

### 5. WordPress 主题
- **问题**: 从 wordpress.org 下载慢
- **解决方案**: 
  - 提前下载主题 zip 上传到 Gitee
  - 或使用商业主题（通常提供 CDN）

### 6. Let's Encrypt 证书（Step 3 可能涉及）
- **问题**: ACME 验证可能超时
- **解决方案**: 
  - 增加 Certbot 超时时间
  - 使用 DNS 验证代替 HTTP 验证
  - 预先准备证书

---

## 🔍 问题排查流程

### 步骤 1: 检查网络连通性
```bash
# 测试 GitHub 连接
curl -I https://raw.githubusercontent.com

# 测试 WordPress.org 连接
curl -I https://downloads.wordpress.org

# 测试 Gitee 连接（应该很快）
curl -I https://gitee.com
```

### 步骤 2: 查看 Ansible 执行日志
```bash
# 查看完整的 Ansible 输出
ansible-playbook ... -vvv

# 重点关注 download 和 install 任务的输出
```

### 步骤 3: 手动验证下载
```bash
# SSH 登录服务器
ssh root@服务器IP

# 手动尝试下载
curl -o /tmp/test.tar.gz \
  https://downloads.wordpress.org/release/zh_CN/wordpress-6.8.3.tar.gz

# 检查下载速度和完整性
```

### 步骤 4: 查看失败的插件
```bash
# 进入 WordPress 目录
cd /var/www/你的域名

# 检查插件状态
wp plugin list --allow-root

# 手动重试安装
wp plugin install 插件名 --activate --allow-root
```

---

## 📝 未来改进建议

### 短期改进（推荐）
1. **建立完整的 Gitee 镜像仓库**
   - 包含常用插件的 zip 文件
   - 定期同步更新

2. **添加插件预检查**
   - 部署前测试插件下载速度
   - 自动选择最快的源

3. **提供离线安装包**
   - 打包所有必需资源
   - 适用于完全离线环境

### 长期改进
1. **搭建私有 WordPress 镜像站**
   - 同步 WordPress.org 的插件和主题
   - 提供稳定的内网访问

2. **使用 CDN 加速**
   - 在 CDN 上缓存常用资源
   - 加速全球访问

3. **容器化部署**
   - 将 WordPress + 插件打包为 Docker 镜像
   - 避免每次都下载

---

## ✅ 总结

### 已解决的问题
- ✅ WP-CLI 下载超时 → Gitee 镜像
- ✅ WordPress 核心文件下载超时 → Gitee 镜像
- ⚠️ 插件下载超时 → 重试机制 + 降级策略

### 未完全解决的问题
- ⚠️ 插件仍可能因网络问题失败（但不会中断部署）

### 推荐做法
1. **优先使用镜像**：核心资源全部镜像化
2. **非关键资源降级**：插件失败不影响核心功能
3. **提供手动兜底**：部署摘要显示状态 + 手动安装指南
4. **持续优化**：根据实际情况建立更完整的镜像

---

**最后更新**: 2025-10-09  
**状态**: ✅ 核心问题已解决，插件问题已缓解

