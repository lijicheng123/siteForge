# Pattern Analyzer API 文档

## 概述

Pattern Analyzer API 提供了基于 Gemini Vision 的图片布局分析功能，可以自动识别和描述 WordPress Pattern 的布局结构。

## 功能特性

- ✅ 支持单个 Pattern 图片分析
- ✅ 使用 Gemini 2.5 Pro Vision 模型
- ✅ 详细的布局描述（布局类型、区块、元素、风格等）
- ✅ 提供测试脚本和批量处理脚本

## API 接口

### 分析单个 Pattern

**端点:** `POST /site-builder/analyze-pattern`

**请求体:**
```json
{
  "id": 19198
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": 19198,
    "layoutDescription": "1. **整体布局类型**：三栏布局\n\n2. **主要区块**：\n   - 顶部区域：标题和副标题\n   - 中间区域：三列内容区域，包含图标和文本\n   - 底部区域：底部信息\n\n3. **关键元素**：\n   - 标题样式：居中、大字号\n   - 图标：每列顶部都有图标\n   ...\n"
  },
  "message": "Pattern 19198 布局分析成功",
  "duration": 3456,
  "timestamp": "2025-10-03T10:30:00.000Z"
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "IMAGE_NOT_FOUND",
  "message": "Image not found for pattern ID 12345: /path/to/images/ptn-12345.jpeg",
  "timestamp": "2025-10-03T10:30:00.000Z"
}
```

## 使用方法

### 1. 启动服务

```bash
# 开发模式
npm run dev

# 或生产模式
npm run build
npm start
```

### 2. 测试单个 Pattern

使用提供的测试脚本：

```bash
# 测试默认 Pattern (ID: 19198)
node tests/test-pattern-analyzer.js

# 测试指定 Pattern ID
node tests/test-pattern-analyzer.js 19114
```

### 3. 批量分析所有 Patterns

使用批量处理脚本：

```bash
# 处理前 10 个 patterns（测试用）
node scripts/batch-analyze-patterns.js --limit 10

# 处理所有 patterns（串行，安全但较慢）
node scripts/batch-analyze-patterns.js

# 并发处理（更快，但注意 API 限流）
node scripts/batch-analyze-patterns.js --concurrency 3 --delay 2000

# 从指定位置开始处理
node scripts/batch-analyze-patterns.js --start 100 --limit 50

# 查看所有选项
node scripts/batch-analyze-patterns.js --help
```

### 批量处理脚本参数

| 参数 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--concurrency` | `-c` | 并发数 | 1（串行） |
| `--start` | `-s` | 起始索引 | 0 |
| `--limit` | `-l` | 处理数量限制 | null（全部） |
| `--delay` | `-d` | 请求间延迟（毫秒） | 1000 |
| `--help` | `-h` | 显示帮助信息 | - |

### 4. 使用 cURL 或 Postman

```bash
curl -X POST http://localhost:3000/site-builder/analyze-pattern \
  -H "Content-Type: application/json" \
  -d '{"id": 19198}'
```

## 批量处理结果

批量处理完成后，结果会保存在 `pattern-analysis-results.json` 文件中：

```json
{
  "metadata": {
    "totalProcessed": 866,
    "successCount": 850,
    "failedCount": 16,
    "totalDuration": 2592000,
    "averageDuration": 2993,
    "timestamp": "2025-10-03T12:00:00.000Z"
  },
  "results": [
    {
      "success": true,
      "id": 19198,
      "data": {
        "id": 19198,
        "layoutDescription": "..."
      },
      "duration": 3456
    },
    ...
  ]
}
```

## 技术实现

### 1. LLM Gateway 扩展

增加了对 Gemini Vision API 的支持，可以接收图片输入：

```typescript
interface ImageContent {
  data: string; // base64 编码的图片数据
  mimeType: string; // 例如 'image/jpeg'
}

interface LLMRequest {
  // ... 其他参数
  images?: ImageContent[]; // 支持多张图片
}
```

### 2. Pattern Analyzer Service

- 读取 `images/ptn-{id}.jpeg` 图片文件
- 转换为 base64 编码
- 调用 Gemini Vision API 进行分析
- 返回详细的布局描述

### 3. Prompt 设计

系统使用精心设计的 Prompt，让 Gemini 从以下维度分析布局：

1. **整体布局类型** - 识别布局模式
2. **主要区块** - 分析顶部、中间、底部区域
3. **关键元素** - 识别标题、图片、按钮、图标等
4. **布局特点** - 对齐方式、间距、视觉层次
5. **颜色和风格** - 主色调、背景色、整体风格

## 性能考虑

### API 调用限制

- Gemini API 有调用频率限制
- 建议使用串行处理（concurrency=1）避免超限
- 处理大量图片时建议设置延迟（delay >= 1000ms）

### 处理时间估算

- 单张图片分析：约 2-5 秒
- 866 张图片（串行）：约 40-70 分钟
- 866 张图片（3 并发）：约 15-25 分钟

### 成本估算

基于 Gemini 2.5 Pro 定价：
- 输入：约 $3.50 / 1M tokens
- 输出：约 $10.50 / 1M tokens
- 单张图片：约 $0.003-0.01
- **866 张总计：约 $2.5-8.5**

## 故障排除

### 1. 图片未找到

**错误信息:** `Image not found for pattern ID xxx`

**解决方法:**
- 确认 `images` 目录存在
- 确认图片文件命名正确：`ptn-{id}.jpeg`
- 检查 `source-patterns.json` 中的 ID 是否与图片文件匹配

### 2. API 超时

**错误信息:** `timeout of 60000ms exceeded`

**解决方法:**
- 降低并发数
- 增加请求间延迟
- 检查网络连接
- 检查 Gemini API 配额

### 3. API 限流

**错误信息:** `429 Too Many Requests`

**解决方法:**
- 使用串行处理（concurrency=1）
- 增加延迟时间（delay >= 2000ms）
- 分批处理，避免一次性处理过多

## 环境变量

确保已配置以下环境变量：

```bash
# Gemini API（官方渠道）
GEMINI_API_KEY=your_gemini_api_key
# 或
GOOGLE_API_KEY=your_google_api_key

# 或使用寰渡网关
DEV_GEMMINI_API_KEY=your_huandu_gemini_key
```

## 相关文件

- **服务:** `src/services/site-builder/pattern-analyzer.service.ts`
- **路由:** `src/routes/site-builder/pattern-analyzer.ts`
- **Schema:** `src/schemas/site-builder/pattern-analyzer.ts`
- **LLM Gateway:** `src/services/llm-gateway.ts`
- **测试脚本:** `tests/test-pattern-analyzer.js`
- **批量脚本:** `scripts/batch-analyze-patterns.js`

## 后续优化建议

1. **结果缓存** - 避免重复分析同一图片
2. **进度持久化** - 支持断点续传
3. **结果数据库** - 存储到数据库便于查询
4. **异步任务队列** - 使用 Bull/BeeQueue 管理长时间任务
5. **结果可视化** - 提供 Web UI 展示分析结果
6. **质量评分** - 基于布局描述进行质量评分

## 许可证

MIT

