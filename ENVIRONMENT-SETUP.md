# 环境配置说明

## 必需的环境变量

在运行项目之前，你需要创建一个 `.env` 文件并配置以下环境变量：

### 1. 创建 .env 文件

在项目根目录创建 `.env` 文件：

```bash
touch .env
```

### 2. 配置环境变量

将以下内容添加到 `.env` 文件中：

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0

# API Keys (必需 - 替换为你的真实密钥)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Google Gemini API Key（推荐）
GEMINI_API_KEY=your_gemini_api_key_here
# 兼容旧命名（可选）
GOOGLE_API_KEY=

# Environment
NODE_ENV=development
```

### 3. 获取 API 密钥

#### Anthropic API Key
1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 注册或登录账户
3. 在 API Keys 页面创建新的 API 密钥
4. 复制密钥并替换 `ANTHROPIC_API_KEY` 的值

#### OpenAI API Key
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册或登录账户
3. 在 API Keys 页面创建新的 API 密钥
4. 复制密钥并替换 `OPENAI_API_KEY` 的值

### 4. 验证配置

配置完成后，你可以：

1. **构建项目**：
   ```bash
   npm run build
   ```

2. **启动开发服务器**：
   ```bash
   npm run dev
   ```

3. **测试健康检查**：
   ```bash
   curl http://localhost:3000/health
   ```

## 安全注意事项

- **永远不要** 将 `.env` 文件提交到 Git 仓库
- **永远不要** 在代码中硬编码 API 密钥
- 在生产环境中，使用环境变量或密钥管理服务
- `.env` 文件已被 `.gitignore` 忽略，不会被意外提交

## 故障排除

如果遇到 API 调用错误：

1. 确认 API 密钥是否正确设置
2. 确认 API 密钥是否有效且未过期
3. 检查网络连接是否正常
4. 查看控制台日志获取详细错误信息
