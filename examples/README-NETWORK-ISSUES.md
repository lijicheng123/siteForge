# 网络下载问题快速参考

## 🚨 如果部署时遇到下载超时

### WordPress 核心文件下载失败
**错误**：`cURL error 28: Operation timed out`  
**原因**：从 `downloads.wordpress.org` 下载慢  
**解决**：✅ 已改为 Gitee 镜像，无需操作

### 插件下载失败
**错误**：`wp plugin install` 超时  
**原因**：从 `downloads.wordpress.org` 下载慢  
**解决**：
1. ✅ 已添加自动重试（2次）
2. ⚠️ 如仍失败，不会中断部署
3. 📝 部署完成后会显示插件安装状态
4. 🔧 可在 WordPress 后台手动安装

### 手动安装插件

#### 方法 1: WordPress 后台（推荐）
1. 登录: `http://你的域名/wp-admin`
2. 插件 → 安装插件
3. 搜索并安装：
   - Redis Object Cache
   - WP Super Cache
   - Autoptimize
   - EWWW Image Optimizer

#### 方法 2: WP-CLI
```bash
# SSH 登录服务器
ssh root@服务器IP

# 安装插件
cd /var/www/你的域名
wp plugin install redis-cache --activate --allow-root
wp plugin install wp-super-cache --activate --allow-root
wp plugin install autoptimize --activate --allow-root
wp plugin install ewww-image-optimizer --activate --allow-root
```

## 📚 详细文档

- **完整方案**: `../NETWORK-OPTIMIZATION.md`
- **修复记录**: `../BUGFIX-NETWORK.md`
- **变更日志**: `../CHANGES.md`

## ✅ 已修复的问题

- ✅ WP-CLI 下载超时 → Gitee 镜像
- ✅ WordPress 核心下载超时 → Gitee 镜像
- ⚠️ 插件下载超时 → 重试+降级（失败不影响部署）

## 🔗 Gitee 镜像地址

- WP-CLI: `https://gitee.com/fuckgitee2speed/wp-bare-metal-mirrors/raw/main/wp-cli.phar`
- WordPress 6.8.3 中文版: `https://gitee.com/fuckgitee2speed/wp-bare-metal-mirrors/raw/main/wordpress-6.8.3-zh_CN.tar.gz`

---

**最后更新**: 2025-10-09

