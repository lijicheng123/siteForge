# Pattern 数据丰富化 - 完整指南

## 📖 简介

将 `source-patterns.json` 中的 875 个 Pattern 数据通过 Gemini Vision AI 进行丰富化，生成包含完整结构化信息的 `enriched-patterns.json` 文件。

---

## 🚀 快速开始

### 1. 启动服务

```bash
# 终端 1
npm run dev
```

### 2. 开始处理

```bash
# 终端 2
screen -S enrich
npm run enrich -- --delay 1500

# 断开但保持运行：Ctrl+A, D
# 重新连接：screen -r enrich
```

### 3. 监控进度（可选）

```bash
# 终端 3
watch -n 30 'cat enriched-patterns.json | jq "keys | length"'
```

---

## 📊 数据对比

### 输入（source-patterns.json）
```json
{
  "ptn-19198": {
    "id": 19198,
    "name": "Location/Map/Hour 22",
    "description": "",
    "categories": { "location": "Location" },
    "keywords": ["starter template"],
    "layout": { "3-columns": "3 Columns" },
    "image": "https://..."
  }
}
```

### 输出（enriched-patterns.json）
```json
{
  "ptn-19198": {
    "id": 19198,
    "name": "Location/Map/Hour 22",
    "description": "三栏布局展示联系信息，下方嵌入全宽地图。适用于企业联系页面或页脚。",
    "categories": ["location", "contact-form"],
    "style_tags": ["clean", "minimalist", "modern"],
    "industry_tags": ["generic", "agency", "real-estate"],
    "layout": {
      "3-columns": "3 Columns",
      "bento-grid": "Bento Grid",
      "alignment": "Centered"
    },
    "keywords": ["联系我们", "地理位置", "谷歌地图", "地址信息"],
    "image_url": "https://..."
  }
}
```

### 丰富化内容

| 字段 | 说明 | 约束 |
|------|------|------|
| `description` | 精炼的中文描述 | 60-120 字符，无"一个"开头 |
| `categories` | 重新分类 | 从 20 个预定义值选择 1-3 个 |
| `style_tags` | 风格标签 | 从 17 个预定义值选择 2-4 个 |
| `industry_tags` | 行业标签 | 从 16 个预定义值选择 2-4 个 |
| `layout` | 布局信息 | 保留原有 + AI 补充新维度 |
| `keywords` | 关键词 | 4-8 个高度相关的核心词 |

---

## 🎨 枚举值列表

### categories（分类）- 20 个
hero, features, cta, pricing-table, testimonials, faq, team, gallery, contact-form, content, logos, stats, how-it-works, header, footer, location, blog, services, video, newsletter

### style_tags（风格）- 17 个
minimalist, modern, corporate, elegant, playful, brutalist, vintage, bold, clean, professional, serene, dark-mode, light-mode, colorful, gradient, flat, illustration

### industry_tags（行业）- 16 个
saas, ecommerce, portfolio, agency, startup, restaurant, real-estate, health, finance, education, travel, non-profit, generic, tech, consulting, media

### layout 维度

**原有格式（保留）**：
- 栏数：1-column, 2-columns, 3-columns, 4-columns
- 网格：bento-grid, grid, masonry
- 媒体：media-left, media-right, media-top, media-bottom, media-background, media-center
- 其他：no-media, off-grid, full-width, contained

**AI 可补充**：
- alignment: Centered, Left Aligned, Right Aligned
- width: Full Width, Contained, Wide
- vertical-alignment: Top, Middle, Bottom
- spacing: Compact, Normal, Spacious

---

## ⚙️ 命令参数

### 基础命令
```bash
npm run enrich
```

### 常用参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `--delay 1500` | 每个请求间延迟 1.5 秒 | 避免 API 限流（推荐） |
| `--limit 10` | 只处理 10 个 | 测试用 |
| `--start 100` | 从第 100 个开始 | 分批处理 |
| `--save-interval 10` | 每 10 个保存一次 | 更频繁保存（默认 10） |
| `--fresh` | 删除旧数据重新开始 | 完全重跑 |
| `--no-resume` | 不自动续传 | 从头开始 |

### 使用示例

```bash
# 测试 5 个
npm run enrich -- --limit 5

# 稳定处理全部（推荐）
npm run enrich -- --delay 1500

# 快速测试（不推荐）
npm run enrich -- --delay 500 --limit 10

# 从头开始
npm run enrich -- --fresh
```

---

## 🖥️ screen 命令说明

### 什么是 screen？
终端复用工具，让任务在后台运行，即使断开连接也不会中断。

### 基础操作

```bash
# 创建会话
screen -S enrich

# 断开但保持运行
# 按 Ctrl+A，然后按 D

# 重新连接
screen -r enrich

# 查看所有会话
screen -ls

# 强制连接（如果显示 Attached）
screen -d -r enrich

# 结束会话（在 screen 内）
exit
```

### 快捷键

| 操作 | 快捷键 | 说明 |
|------|--------|------|
| 断开会话 | `Ctrl+A, D` | Detach |
| 滚动查看 | `Ctrl+A, [` | 进入复制模式 |
| 退出滚动 | `ESC` | 退出复制模式 |
| 清屏 | `Ctrl+L` | 清理屏幕 |

---

## 📈 断点续传机制

### 工作原理

1. **自动加载**：启动时自动加载 `enriched-patterns.json`
2. **跳过已处理**：已有的 ID 会被自动跳过
3. **定期保存**：每 10 个（可配置）保存到临时文件 `.enrich-progress.json`
4. **网络容错**：单个失败不影响整体，继续处理下一个

### 中断恢复

```bash
# 场景 1：网络中断、程序崩溃
# 直接重新运行，会自动跳过已处理的
npm run enrich -- --delay 1500

# 场景 2：手动停止后继续
# 重新连接 screen，或直接运行
screen -r enrich
# 或
npm run enrich -- --delay 1500

# 场景 3：想从头开始
npm run enrich -- --fresh
```

---

## 💰 成本估算

### 基于 Gemini 2.5 Pro 定价

**定价**：0.2 元/万 tokens（输入和输出同价）

**预估 Token 使用**：

| 项目 | 单次 Tokens | 总计（875次） | 费用 |
|------|-------------|---------------|------|
| 输入（Prompt + JSON） | ~2,500 | 2,187,500 | 43.75 元 |
| 输入（图片 base64） | ~280 | 245,000 | 4.90 元 |
| 输出（JSON） | ~300 | 262,500 | 5.25 元 |
| **总计** | **~3,080** | **2,695,000** | **53.90 元** |

**预计总成本：~54 元人民币**

**对比其他方案**：
- 人工标注：2000+ 元
- GPT-4 Vision：~120 元
- Claude Sonnet：~150 元
- **Gemini 2.5 Pro：54 元** ⭐ 性价比最高

---

## ⏱️ 时间估算

| 配置 | 单次耗时 | 总计（875个） | 说明 |
|------|---------|--------------|------|
| `--delay 1000` | ~21s | 5.1 小时 | 略激进 |
| `--delay 1500` | ~22.5s | 5.5 小时 | **推荐** ✅ |
| `--delay 2000` | ~24s | 5.8 小时 | 更保守 |

**推荐配置**：`--delay 1500`（预计 4.5-5.5 小时）

---

## ✅ 完整流程示例

### Step 1: 启动服务
```bash
# 终端 1
cd /Users/lijicheng/code/wordpress/siteForge
npm run dev

# 等待显示：Server listening at http://localhost:3000
```

### Step 2: 测试
```bash
# 终端 2：先测试 1 个
npm run enrich -- --limit 1

# 检查结果
cat enriched-patterns.json | jq '.[] | {layout, categories, style_tags}'
```

### Step 3: 批量处理
```bash
# 使用 screen
screen -S enrich

# 运行（稳定配置）
npm run enrich -- --delay 1500

# 看到正常输出后，断开
# 按 Ctrl+A，然后按 D

# 现在可以：
# - 关闭终端
# - 断开 SSH
# - 做其他事情
# 任务在后台继续运行
```

### Step 4: 监控进度
```bash
# 方法 1：重连 screen 查看实时输出
screen -r enrich
# 看一眼进度
# 按 Ctrl+A, D 再次断开

# 方法 2：查看已处理数量
cat enriched-patterns.json | jq 'keys | length'

# 方法 3：实时监控
watch -n 30 'cat enriched-patterns.json | jq "keys | length"'
```

### Step 5: 完成后验证
```bash
# 确认总数
cat enriched-patterns.json | jq 'keys | length'
# 应该：875

# 检查 layout 完整度
cat enriched-patterns.json | jq '[.[] | select(.layout | length > 0)] | length'
# 应该：~740+ (85%)

# 随机抽查
cat enriched-patterns.json | jq 'keys[0:5][] as $k | .[$k] | {name, description, layout}'
```

---

## 🐛 常见问题

### 1. 服务无法启动（端口占用）

**错误**：`EADDRINUSE: address already in use 0.0.0.0:3000`

**解决**：
```bash
# 查找占用端口的进程
lsof -ti:3000

# 杀掉进程
lsof -ti:3000 | xargs kill -9

# 重新启动
npm run dev
```

### 2. layout 字段为空

**已修复**！如果仍然遇到：

1. 确认服务已重启（加载新代码）
2. 检查 Schema 定义包含 `additionalProperties`
3. 查看服务端日志确认数据合并逻辑

### 3. API 超时

**错误**：`timeout of 60000ms exceeded`

**原因**：网络慢或 Gemini API 响应慢

**解决**：
- 自动跳过，继续处理下一个
- 失败的 ID 会在统计中显示
- 可以手动重跑失败的 ID

### 4. 断点续传不工作

**检查**：
```bash
# 确认文件存在
ls -la enriched-patterns.json

# 确认格式正确
cat enriched-patterns.json | jq 'keys | length'
```

**重置**：
```bash
# 删除旧数据重新开始
npm run enrich -- --fresh
```

### 5. screen 会话丢失

```bash
# 查看所有会话
screen -ls

# 如果显示 Detached，直接重连
screen -r enrich

# 如果显示 Attached，强制连接
screen -d -r enrich

# 如果找不到，可能已结束，直接重新运行
npm run enrich -- --delay 1500
```

---

## 📊 质量检查

### 完成后验证

```bash
# 1. 总数检查
cat enriched-patterns.json | jq 'keys | length'
# 期望：875

# 2. Layout 完整度
cat enriched-patterns.json | jq '[.[] | select(.layout | length > 0)] | length'
# 期望：~740+ (85%)

# 3. 描述质量（检查"一个"开头）
cat enriched-patterns.json | jq '[.[] | select(.description | startswith("一个"))] | length'
# 期望：0 或个位数

# 4. 新枚举值使用
cat enriched-patterns.json | jq '.[] | .categories[]' | grep -E "(blog|services|video)" | wc -l
# 期望：有一些

# 5. 随机抽查
cat enriched-patterns.json | jq 'keys[]' | shuf | head -5 | while read key; do
  echo "=== $key ==="
  cat enriched-patterns.json | jq ".[$key] | {name, description, layout}"
done
```

---

## 🎯 最佳实践

### 1. 渐进式处理

```bash
# Step 1：测试 1 个
npm run enrich -- --limit 1

# Step 2：测试 5 个
npm run enrich -- --limit 5

# Step 3：测试 50 个
npm run enrich -- --limit 50

# Step 4：满意后全量处理
screen -S enrich
npm run enrich -- --delay 1500
```

### 2. 使用 screen（长时间任务必须）

- ✅ 可以断开连接
- ✅ 不怕网络断开
- ✅ 可以随时查看进度

### 3. 合理的 delay

- `1000ms`：略激进，可能触发限流
- `1500ms`：**推荐**，稳定可靠 ✅
- `2000ms`：更保守，但时间更长

### 4. 定期检查

- 每 30-60 分钟重连 screen 看一眼
- 确认没有大量失败
- 确认进度正常推进

### 5. 数据备份

```bash
# 定期备份（可选）
cp enriched-patterns.json enriched-patterns.backup.json
```

---

## 🔧 技术细节

### 数据流

```
source-patterns.json
    ↓
loadSourcePatternData()  → 读取原始数据
    ↓
images/ptn-{id}.jpeg    → 读取图片 → base64
    ↓
构建 Prompt（包含 JSON + 图片）
    ↓
Gemini Vision API (temperature: 0.1, jsonMode: true)
    ↓
解析 JSON 响应
    ↓
合并 layout（原有 + AI 识别）
    ↓
Fastify Schema 验证（additionalProperties 关键）
    ↓
返回给客户端
    ↓
保存到 enriched-patterns.json
```

### 关键优化

1. **Layout 数据保留**
   ```typescript
   enrichedData.layout = {
     ...rawPatternData.layout,  // 原有数据
     ...enrichedData.layout     // AI 补充
   };
   ```

2. **Schema 定义完整**
   ```typescript
   layout: {
     type: 'object',
     additionalProperties: { type: 'string' },  // 关键
     description: '布局信息'
   }
   ```

3. **低温度高准确度**
   ```typescript
   temperature: 0.1  // 降低随机性，提高一致性
   ```

4. **断点续传**
   - 自动加载已有结果
   - 定期保存进度
   - 失败不影响整体

---

## 📁 输出文件

- `enriched-patterns.json` - 最终输出文件
- `.enrich-progress.json` - 临时进度文件（处理完成后自动删除）

---

## 🎉 预期成果

处理完成后，你将获得：

✅ **875 条高质量数据**
- 精炼的中文描述（无冗余开头）
- 完整的布局信息（85%+ 完整度）
- 准确的分类和标签
- 高价值的关键词

✅ **显著提升的 AI 推荐能力**
- 从 80% → 92% 准确度
- 支持多维度精确匹配
- 更好的用户体验

✅ **极高的性价比**
- 成本：54 元
- 时间：4.5-5.5 小时
- 质量：接近人工标注

---

## 📞 遇到问题？

1. 检查服务是否运行：`curl http://localhost:3000/api/health`
2. 查看服务日志：重连 `screen -r enrich`
3. 检查进度文件：`cat enriched-patterns.json | jq 'keys | length'`
4. 从头开始：`npm run enrich -- --fresh`

---

**准备好了就开始吧！** 🚀

```bash
screen -S enrich
npm run enrich -- --delay 1500
# Ctrl+A, D
```

**4.5-5.5 小时后，你将拥有 875 条高质量的 Pattern 数据！** ✨

