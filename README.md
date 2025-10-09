# SiteForge - AI驱动的WordPress网站生成与部署平台

> 🚀 通过AI工作流自动生成网站设计，并一键部署到生产环境

## 🌟 核心特性

- **🤖 AI驱动的网站生成**：集成 OpenAI GPT、Anthropic Claude、Google Gemini，6步工作流自动生成完整网站
- **🎨 Pattern智能分析**：875个WordPress设计模板，AI视觉分析自动匹配最佳设计
- **⚡ 一键部署**：裸金属服务器3步部署WordPress（LEMP栈），10-18分钟完成上线
- **🔒 生产级安全**：HTTPS自动配置、Let's Encrypt证书、Fail2Ban防护
- **🌐 多模型支持**：灵活切换不同AI模型，优化成本与性能
- **📦 完全自动化**：从需求分析到网站上线，全程无人值守

---

## 📋 系统要求

### 开发环境
- Node.js 18+
- npm 或 yarn
- TypeScript 5.0+

### API密钥（至少一个）
- OpenAI API Key（GPT-4、GPT-5）
- Anthropic API Key（Claude Sonnet、Opus）
- Google Gemini API Key（Gemini 2.5 Pro）

### 部署环境（可选）
- Ansible 2.9+
- sshpass（用于SSH密码认证）
- 目标服务器：Rocky Linux 8/9，2GB+ 内存

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd siteForge
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
# 复制环境配置模板
cp env.template .env

# 编辑 .env 文件，添加你的API密钥
nano .env
```

**必需的环境变量：**

```env
# 服务器配置
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# AI模型API密钥（至少配置一个）
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**获取API密钥：**
- [Anthropic Console](https://console.anthropic.com/) - Claude API
- [OpenAI Platform](https://platform.openai.com/) - GPT API
- [Google AI Studio](https://aistudio.google.com/) - Gemini API

### 4. 构建项目

```bash
npm run build
```

### 5. 启动服务

```bash
# 开发模式（推荐）
npm run dev

# 或使用启动脚本
./start-dev.sh

# 生产模式
npm start
```

### 6. 验证服务

```bash
curl http://localhost:3000/health
```

应该返回：
```json
{"status":"ok","timestamp":"2025-10-09T00:00:00.000Z"}
```

---

## 🎯 核心功能

### 1. AI网站生成工作流

**6步自动化流程：**

| 步骤 | 功能 | 使用模型 |
|------|------|---------|
| **Step 1** | 需求分析 | Claude Sonnet |
| **Step 2** | 设计系统 | Claude Sonnet |
| **Step 3** | 网站架构 | GPT-5 Mini |
| **Step 4** | 内容规划 | Claude Opus |
| **Step 5** | 布局设计 | Claude Opus |
| **Step 6** | HTML生成 | 模板引擎 |

**API使用：**

```bash
# 运行完整工作流
curl -X POST http://localhost:3000/api/workflow/run-full \
  -H "Content-Type: application/json" \
  -d '{
    "rawInput": "我需要一个科技公司的官网，主要展示AI产品和服务"
  }'
```

**响应格式：**

```json
{
  "success": true,
  "data": {
    "workflowId": "wf_1234567890_abc123",
    "status": "completed",
    "steps": {
      "step1": { "status": "success", "data": {...} },
      "step2": { "status": "success", "data": {...} },
      "step6": { "status": "success", "data": {...} }
    },
    "finalResult": {
      "html": "<html>...</html>",
      "blueprint": {...}
    }
  }
}
```

**渐进式错误处理：**
- 每个步骤独立状态跟踪（success/failed/skipped）
- 部分成功时返回已完成步骤的结果
- 详细错误信息便于调试

---

### 2. Pattern智能分析与匹配

**功能概述：**
- 875个WordPress设计模板（source-patterns.json）
- AI视觉分析自动丰富化Pattern数据（Gemini Vision）
- 多维度匹配：类别、风格、行业、布局

**Pattern数据丰富化：**

```bash
# 启动服务（终端1）
npm run dev

# 运行批量处理（终端2，推荐使用screen）
screen -S enrich
npm run enrich -- --delay 1500

# 断开screen但保持运行
# 按 Ctrl+A，然后按 D

# 重新连接查看进度
screen -r enrich
```

**参数说明：**

| 参数 | 说明 | 示例 |
|------|------|------|
| `--delay 1500` | 每个请求间延迟1.5秒 | 避免API限流（推荐） |
| `--limit 10` | 只处理10个 | 测试用 |
| `--start 100` | 从第100个开始 | 分批处理 |
| `--fresh` | 删除旧数据重新开始 | 完全重跑 |

**成本估算：**
- 处理875个Pattern
- 使用Gemini 2.5 Pro
- 约54元人民币，耗时4.5-5.5小时

**断点续传机制：**
- 自动加载已处理的数据
- 单个失败不影响整体
- 每10个保存一次进度
- 支持随时中断和恢复

---

### 3. WordPress自动化部署

**部署方式：**
- ✅ **裸金属部署**（推荐）：直接在Rocky Linux上部署LEMP栈，性能最佳
- ⚠️ Docker部署（已弃用）：使用Docker Compose部署，适用于开发环境

**快速部署（3步）：**

```bash
# Step 1: 准备服务器环境（5-10分钟）
curl -X POST http://localhost:3000/provisioning/bare-metal/prepare-server \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.1.100",
    "sshUser": "root",
    "sshPassword": "your-password",
    "domain": "example.com"
  }'

# Step 2: 部署WordPress（3-5分钟）
curl -X POST http://localhost:3000/provisioning/bare-metal/deploy-wordpress \
  -H "Content-Type: application/json" \
  -d '{
    "deploymentContext": { /* Step 1返回的完整context */ },
    "sshPassword": "your-password"
  }'

# Step 3: 配置HTTPS（2-3分钟）
curl -X POST http://localhost:3000/provisioning/bare-metal/secure-ssl \
  -H "Content-Type: application/json" \
  -d '{
    "deploymentContext": { /* Step 2返回的完整context */ },
    "sshPassword": "your-password",
    "adminEmail": "admin@example.com"
  }'
```

**技术栈：**
- 操作系统：Rocky Linux 8/9
- Web服务器：Nginx（最新版）
- 数据库：MariaDB 10.6+
- PHP：8.3（最新稳定版）
- SSL证书：Let's Encrypt（自动续期）

📖 **完整部署文档**：请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📡 API端点概览

### 健康检查
- `GET /health` - 服务状态检查
- `GET /api/health/models` - AI模型可用性检查

### AI工作流
- `POST /api/workflow/run-full` - 运行完整6步工作流
- `POST /api/workflow/step/analyze` - 测试单步分析

### Site Builder
- `POST /api/site-builder/analyze-pattern` - 分析Pattern图片
- `POST /api/site-builder/select-patterns` - 智能选择Pattern
- `POST /api/site-builder/convert-pattern` - 转换Pattern为HTML

### WordPress部署
- `POST /provisioning/bare-metal/prepare-server` - 准备服务器环境
- `POST /provisioning/bare-metal/deploy-wordpress` - 部署WordPress
- `POST /provisioning/bare-metal/secure-ssl` - 配置HTTPS
- `GET /provisioning/status/{deploymentId}` - 查询部署状态

---

## 📁 项目结构

```
siteForge/
├── src/
│   ├── routes/              # API路由
│   │   ├── workflow/        # AI工作流路由
│   │   ├── site-builder/    # Pattern分析路由
│   │   └── provisioning/    # 部署路由
│   ├── services/            # 业务逻辑
│   │   ├── llm-gateway.ts   # AI模型网关
│   │   ├── workflow-steps.service.ts
│   │   ├── site-builder/    # Pattern处理服务
│   │   └── ansible/         # Ansible集成
│   ├── schemas/             # 数据模型定义
│   ├── middleware/          # 中间件
│   └── app.ts               # 应用入口
├── ansible/
│   ├── playbooks/           # Ansible Playbook
│   │   ├── playbook_step1_prepare_server.yml
│   │   ├── playbook_step2_deploy_wordpress.yml
│   │   └── playbook_step3_secure_ssl.yml
│   ├── templates/           # Nginx配置模板
│   └── requirements.yml     # Ansible依赖
├── scripts/
│   └── enrich-patterns.js   # Pattern丰富化脚本
├── examples/                # 示例脚本
├── source-patterns.json     # 原始Pattern数据
├── enriched-patterns.json   # 丰富化后的Pattern数据
├── .env                     # 环境变量配置
├── README.md                # 本文档
└── DEPLOYMENT.md            # 部署指南
```

---

## 🛠️ 开发指南

### 添加新的AI模型提供商

1. 在 `src/services/llm-gateway.ts` 中实现新的提供商接口
2. 更新 `src/services/model-catalog.ts` 中的模型目录
3. 在 `.env` 中添加新的API密钥配置

### 添加新的工作流步骤

1. 在 `src/services/prompt-factory.ts` 中添加提示模板
2. 在 `src/services/workflow-steps.service.ts` 中实现步骤逻辑
3. 在 `src/routes/workflow/` 中添加API端点
4. 更新 `src/schemas/workflow-responses.ts` 中的响应类型

### 测试Pattern分析

```bash
# 运行测试脚本
node tests/test-pattern-analyzer.js

# 测试单个Pattern
curl -X POST http://localhost:3000/api/site-builder/analyze-pattern \
  -H "Content-Type: application/json" \
  -d '{
    "patternId": "ptn-19198",
    "imageUrl": "https://..."
  }'
```

---

## 🚨 故障排除

### 构建失败

```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 服务启动失败

**检查清单：**
1. ✅ `.env` 文件是否存在？
2. ✅ API密钥是否正确配置？
3. ✅ 端口3000是否被占用？
4. ✅ Node.js版本是否>=18？

**端口占用处理：**
```bash
# 查找占用3000端口的进程
lsof -ti:3000

# 杀掉进程
lsof -ti:3000 | xargs kill -9
```

### API调用错误

**常见错误：**

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| `401 Unauthorized` | API密钥无效 | 检查 `.env` 中的密钥是否正确 |
| `429 Too Many Requests` | API限流 | 增加请求延迟（`--delay`） |
| `timeout` | 网络慢或API响应慢 | 检查网络连接，增加超时时间 |
| `ECONNREFUSED` | 服务未启动 | 确保 `npm run dev` 正在运行 |

### Pattern丰富化问题

**问题：screen会话丢失**
```bash
# 查看所有screen会话
screen -ls

# 重新连接
screen -r enrich

# 如果显示Attached，强制连接
screen -d -r enrich
```

**问题：处理中断后如何继续**
```bash
# 直接重新运行，会自动跳过已处理的
npm run enrich -- --delay 1500

# 如果想从头开始
npm run enrich -- --fresh
```

### 部署失败

请参考 [DEPLOYMENT.md](./DEPLOYMENT.md) 中的故障排查章节。

---

## 📊 性能与成本

### AI模型成本对比

| 模型 | 成本/百万tokens | 速度 | 推荐场景 |
|------|----------------|------|---------|
| GPT-4 Turbo | $10 | 中 | 复杂分析 |
| GPT-5 Mini | $0.40 | 快 | 快速生成 |
| Claude Sonnet | $3 | 快 | 结构化输出 |
| Claude Opus | $15 | 慢 | 高质量内容 |
| Gemini 2.5 Pro | ¥0.2 | 快 | 视觉分析（最优） |

### Pattern丰富化成本

- 处理875个Pattern
- 使用Gemini 2.5 Pro
- **总成本：约54元**（相比人工标注节省95%）
- **总时间：4.5-5.5小时**

### WordPress部署性能

| 步骤 | 耗时 | 说明 |
|------|------|------|
| Step 1 | 5-10分钟 | 安装LEMP栈 |
| Step 2 | 3-5分钟 | 部署WordPress |
| Step 3 | 2-3分钟 | 配置HTTPS |
| **总计** | **10-18分钟** | 完整上线 |

---

## 🔒 安全建议

### API密钥安全

- ✅ 永远不要将 `.env` 文件提交到Git
- ✅ 不要在代码中硬编码API密钥
- ✅ 生产环境使用环境变量或密钥管理服务
- ✅ 定期轮换API密钥

### 部署安全

- ✅ 使用强密码（数据库、WordPress管理员）
- ✅ 配置防火墙（仅开放必要端口）
- ✅ 启用Fail2Ban（防SSH暴力破解）
- ✅ 使用HTTPS（Let's Encrypt自动配置）
- ✅ 定期更新系统和WordPress

### 数据安全

- ✅ `deploymentContext` 包含敏感信息，使用加密存储
- ✅ 不要记录敏感信息到日志
- ✅ 定期备份数据库和文件

---

## 📚 扩展阅读

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整部署指南
- [examples/](./examples/) - 示例脚本和Postman集合
- [ansible/playbooks/](./ansible/playbooks/) - Ansible Playbook源码

---

## 🤝 贡献

欢迎提交Issue和Pull Request！

**开发流程：**
1. Fork本项目
2. 创建特性分支（`git checkout -b feature/AmazingFeature`）
3. 提交更改（`git commit -m 'Add some AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 提交Pull Request

---

## 📝 许可证

ISC License

---

## 📞 支持

遇到问题？

1. 查看本文档的**故障排除**章节
2. 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 的故障排查章节
3. 提交 [GitHub Issue](https://github.com/your-repo/issues)

---

**注意**: 这是一个AI驱动的项目，请确保你有足够的API配额来支持你的使用需求。建议先进行小规模测试，再进行大规模部署。

---

**SiteForge** - 让AI帮你构建和部署网站 🚀
