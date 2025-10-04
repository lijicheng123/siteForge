# SiteForge AI - AI驱动的网站生成器API

> 🚀 通过AI工作流自动生成完整网站的智能API服务

## 🌟 项目特色

- **🤖 AI驱动**: 集成OpenAI GPT、Anthropic Claude、Google Gemini，智能分析用户需求
- **🔄 6步工作流**: 从需求分析到HTML生成的完整自动化流程
- **🎨 WordPress兼容**: 输出Gutenberg兼容的HTML代码
- **🖼️ Pattern Enrichment**: AI 视觉分析自动丰富化 Pattern 数据
- **⚡ 高性能**: 基于Fastify框架，响应迅速
- **🔧 模块化设计**: 清晰的代码结构，易于维护和扩展
- **🌐 多LLM支持**: 支持多种AI模型，灵活切换

## 🏗️ 技术架构

- **后端框架**: Fastify (Node.js)
- **开发语言**: TypeScript
- **AI集成**: OpenAI GPT-5, Anthropic Claude, Google Gemini
- **项目结构**: 模块化设计，分离路由、服务、类型定义

## 📋 系统要求

- Node.js 18+ 
- npm 或 yarn
- 有效的OpenAI和/或Anthropic API密钥

## 🚀 快速开始

### Pattern Enrichment（推荐）

使用 AI 视觉分析丰富化 Pattern 数据：

```bash
# 1. 启动服务
npm run dev

# 2. 运行批量处理
screen -S enrich
npm run enrich -- --delay 1500
# Ctrl+A, D 断开
```

📖 **详细文档**：[PATTERN-ENRICHMENT.md](./PATTERN-ENRICHMENT.md)
- 完整使用指南
- 参数说明和最佳实践
- 成本估算（~54元）
- 常见问题解决

---

### 网站生成工作流

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd siteforge-ai
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

**重要**: 在运行项目之前，必须配置环境变量！

```bash
# 复制环境配置模板
cp env.template .env

# 编辑 .env 文件，添加你的API密钥
nano .env
```

必需的环境变量：
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
# 兼容旧命名（可选）
GOOGLE_API_KEY=
```

### 4. 构建项目

```bash
npm run build
```

### 5. 启动服务

#### 开发模式
```bash
npm run dev
```

#### 使用启动脚本（推荐）
```bash
./start-dev.sh
```

#### 生产模式
```bash
npm start
```

### 6. 验证服务

访问健康检查端点：
```bash
curl http://localhost:3000/health
```

应该返回：
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

## 🔧 API 端点

### 健康检查
- **GET** `/health` - 服务状态检查

### 工作流API
- **POST** `/api/workflow/run-full` - 运行完整AI工作流
- **POST** `/api/workflow/step/analyze` - 测试单步分析功能

### 完整工作流示例

```bash
curl -X POST http://localhost:3000/api/workflow/run-full \
  -H "Content-Type: application/json" \
  -d '{
    "rawInput": "我需要一个科技公司的官网，主要展示AI产品和服务"
  }'
```

## 🤖 AI工作流详解

### 步骤1: 需求分析 (Analysis)
- 分析用户输入的公司信息、行业、目标受众等
- 使用Claude Sonnet进行结构化分析

### 步骤2: 设计系统 (Design System)
- 基于行业和目标受众偏好设计视觉系统
- 定义色彩、字体、布局风格

### 步骤3: 网站架构 (Architecture)
- 规划网站结构、页面组织、导航逻辑
- 使用GPT-5 Mini进行架构设计

### 步骤4: 内容规划 (Content Planning)
- 为每个页面规划具体内容和功能模块
- 使用Claude Opus进行内容策略

### 步骤5: 布局设计 (Layout Design)
- 设计每个页面的具体布局和组件结构
- 使用Claude Opus进行布局优化

### 步骤6: HTML生成 (HTML Generation)
- 将设计转换为WordPress Gutenberg兼容的HTML
- 自动生成完整的网站代码

## 📁 项目结构

```
siteforge-ai/
├── src/
│   ├── routes/           # API路由定义
│   ├── services/         # 业务逻辑服务
│   ├── types/           # TypeScript类型定义
│   └── app.ts           # 应用入口
├── dist/                # 构建输出目录
├── .env                 # 环境变量配置
├── .gitignore          # Git忽略规则
├── package.json         # 项目配置
├── tsconfig.json        # TypeScript配置
├── start-dev.sh         # 开发启动脚本
└── README.md            # 项目文档
```

## 🔑 API密钥配置

### 获取OpenAI API密钥
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册或登录账户
3. 在API Keys页面创建新的API密钥

### 获取Anthropic API密钥
1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 注册或登录账户
3. 在API Keys页面创建新的API密钥

## 🛠️ 开发指南

### 添加新的工作流步骤

1. 在 `src/services/prompt-factory.ts` 中添加提示模板
2. 在 `src/services/workflow.service.ts` 中实现步骤逻辑
3. 在 `src/routes/workflow.routes.ts` 中添加API端点

### 添加新的LLM提供商

1. 在 `src/services/llm-provider.ts` 中实现新的提供商接口
2. 更新类型定义
3. 在服务中使用新的提供商

## 🚨 故障排除

### 常见问题

**构建失败**
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install
npm run build
```

**服务启动失败**
- 检查 `.env` 文件是否存在
- 确认API密钥是否正确配置
- 检查端口3000是否被占用

**API调用错误**
- 确认API密钥是否有效
- 检查网络连接
- 查看控制台日志

### 日志查看

开发模式下，所有日志都会在控制台显示。生产环境建议配置日志文件。

## 📝 许可证

ISC License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 支持

如有问题，请：
1. 查看本文档
2. 检查故障排除部分
3. 提交GitHub Issue

---

**注意**: 这是一个AI驱动的项目，请确保你有足够的API配额来支持你的使用需求。
