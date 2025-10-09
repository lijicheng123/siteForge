# 本地 WordPress 文件说明

## 📦 文件位置

`wordpress-6.8.3-zh_CN.tar.gz` 应该放在项目根目录：

```
siteForge/
├── wordpress-6.8.3-zh_CN.tar.gz  ← 必须存在
├── ansible/
│   └── playbooks/
│       └── playbook_step2_deploy_wordpress.yml
├── package.json
└── README.md
```

## 🎯 为什么使用本地文件？

### 之前尝试的方案及问题
1. ❌ **从 wordpress.org 下载**
   - 问题：超时（600秒后失败）
   - 原因：国内访问不稳定，34MB 文件下载缓慢

2. ❌ **从 Gitee 镜像下载**
   - 问题：403 Forbidden
   - 原因：Gitee 可能对大文件的 raw 访问有限制

3. ✅ **从本地仓库 copy**（当前方案）
   - 优点：100% 可靠，快速，不依赖外部服务
   - 缺点：需要在仓库中存放大文件（34MB）

## 📥 如何获取 WordPress 文件？

### 方法 1：从官方下载（推荐）
```bash
# 进入项目根目录
cd /Users/lijicheng/code/wordpress/siteForge

# 下载 WordPress 中文版
curl -o wordpress-6.8.3-zh_CN.tar.gz \
  https://downloads.wordpress.org/release/zh_CN/wordpress-6.8.3.tar.gz

# 验证文件大小（约 34MB）
ls -lh wordpress-6.8.3-zh_CN.tar.gz
```

### 方法 2：从其他镜像下载
```bash
# 清华大学镜像（如果可用）
curl -o wordpress-6.8.3-zh_CN.tar.gz \
  https://mirrors.tuna.tsinghua.edu.cn/wordpress/wordpress-6.8.3-zh_CN.tar.gz

# 或者从阿里云镜像（如果可用）
```

### 方法 3：如果已有 WordPress 安装
```bash
# 从已有的 WordPress 站点打包
cd /path/to/existing/wordpress
tar -czf ~/wordpress-6.8.3-zh_CN.tar.gz wordpress/

# 移动到项目目录
mv ~/wordpress-6.8.3-zh_CN.tar.gz /Users/lijicheng/code/wordpress/siteForge/
```

## 🔍 验证文件是否正确

```bash
# 1. 检查文件是否存在
ls -lh wordpress-6.8.3-zh_CN.tar.gz

# 2. 检查文件大小（应该约为 34MB）
# -rw-r--r--  1 user  staff   34M  Oct  9 16:00 wordpress-6.8.3-zh_CN.tar.gz

# 3. 检查文件完整性（可选）
tar -tzf wordpress-6.8.3-zh_CN.tar.gz | head -10
# 应该看到类似：
# wordpress/
# wordpress/index.php
# wordpress/wp-activate.php
# ...
```

## 🚀 部署流程

### Ansible 如何使用这个文件

```yaml
# playbook_step2_deploy_wordpress.yml
- name: "从本地仓库上传 WordPress 核心文件"
  ansible.builtin.copy:
    src: "../../wordpress-6.8.3-zh_CN.tar.gz"  # 相对于 playbook 的路径
    dest: "/tmp/wordpress.tar.gz"              # 上传到服务器

- name: "解压"
  ansible.builtin.unarchive:
    src: "/tmp/wordpress.tar.gz"
    dest: "/tmp/"
    remote_src: yes

- name: "移动到目标目录"
  ansible.builtin.command: >
    rsync -a /tmp/wordpress/ {{ wordpress_install_dir }}/
```

**路径解析**：
- Playbook 位置: `ansible/playbooks/playbook_step2_deploy_wordpress.yml`
- 相对路径 `../../`: 返回到 `siteForge/` 根目录
- 最终路径: `siteForge/wordpress-6.8.3-zh_CN.tar.gz`

## ⚠️ Git 大文件注意事项

### 选项 1：直接提交（简单但增加仓库体积）
```bash
# 将文件加入 Git
git add wordpress-6.8.3-zh_CN.tar.gz
git commit -m "Add WordPress 6.8.3 Chinese version"
git push
```

**优点**：
- ✅ 简单直接
- ✅ 团队成员 clone 后立即可用

**缺点**：
- ❌ 仓库体积增加 34MB
- ❌ 每次 clone 都会下载这个文件

### 选项 2：使用 .gitignore（推荐用于开发）
```bash
# 将文件加入 .gitignore
echo "wordpress-*.tar.gz" >> .gitignore

# 在 README 中说明如何获取
```

**优点**：
- ✅ 保持仓库体积小
- ✅ 灵活：可以使用不同版本

**缺点**：
- ❌ 需要手动下载文件
- ❌ 首次使用需要额外步骤

### 选项 3：使用 Git LFS（推荐用于生产）
```bash
# 安装 Git LFS
brew install git-lfs  # macOS
# 或
apt-get install git-lfs  # Linux

# 初始化 Git LFS
git lfs install

# 跟踪 .tar.gz 文件
git lfs track "*.tar.gz"
git add .gitattributes

# 正常提交
git add wordpress-6.8.3-zh_CN.tar.gz
git commit -m "Add WordPress with Git LFS"
git push
```

**优点**：
- ✅ 仓库体积小（只存储指针）
- ✅ Git 命令正常使用
- ✅ 大文件独立存储

**缺点**：
- ❌ 需要 Git LFS 支持
- ❌ 某些 Git 托管服务可能有限制

## 🔄 更新到新版本

当 WordPress 发布新版本时：

```bash
# 1. 下载新版本
curl -o wordpress-6.9.0-zh_CN.tar.gz \
  https://downloads.wordpress.org/release/zh_CN/wordpress-6.9.0.tar.gz

# 2. 更新 playbook 中的文件名
# 修改 playbook_step2_deploy_wordpress.yml:
# src: "../../wordpress-6.9.0-zh_CN.tar.gz"

# 3. 删除旧版本（可选）
rm wordpress-6.8.3-zh_CN.tar.gz
```

## 📊 当前配置总结

| 项目 | 值 |
|------|-----|
| WordPress 版本 | 6.8.3 |
| 语言 | 中文（zh_CN） |
| 文件名 | `wordpress-6.8.3-zh_CN.tar.gz` |
| 文件大小 | ~34MB |
| 存放位置 | 项目根目录 |
| 传输方式 | Ansible copy 模块 |
| 部署时间 | ~10-30秒（取决于网络） |

## ✅ 检查清单

部署前请确认：

- [ ] `wordpress-6.8.3-zh_CN.tar.gz` 存在于项目根目录
- [ ] 文件大小约为 34MB
- [ ] 文件可以正常解压（`tar -tzf` 测试）
- [ ] playbook 中的路径正确（`../../wordpress-6.8.3-zh_CN.tar.gz`）
- [ ] 有足够的磁盘空间（本地 + 服务器都需要 >100MB）

## 🆘 常见问题

### Q: 部署时提示找不到文件？
```
FAILED! => {"changed": false, "msg": "Could not find or access '../../wordpress-6.8.3-zh_CN.tar.gz'"}
```

**解决**：
1. 检查文件是否在项目根目录
2. 检查文件名是否完全匹配
3. 检查文件权限（应该是 644 或 755）

### Q: 文件太大，Git push 失败？
```
error: GH001: Large files detected.
```

**解决**：
1. 使用 Git LFS（推荐）
2. 或将文件加入 `.gitignore`，手动管理
3. 或使用云存储（OSS/S3）+ 下载脚本

### Q: 可以用其他版本的 WordPress 吗？

**可以**！只需：
1. 下载对应版本的 tar.gz
2. 更新 playbook 中的文件名
3. 确保文件名与 playbook 中一致

---

**最后更新**: 2025-10-09  
**适用版本**: WordPress 6.8.3  
**状态**: ✅ 生产可用

