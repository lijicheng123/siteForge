// src/services/site-builder/pattern-analyzer.service.ts
import * as fs from 'fs';
import * as path from 'path';
import { MODEL_IDS } from "../model-catalog";
import LLMGateway from "../llm-gateway";

// 定义返回类型
export interface EnrichedPatternData {
  id: number;
  name: string;
  description: string;
  categories: string[];
  style_tags: string[];
  industry_tags: string[];
  layout: Record<string, string>;
  keywords: string[];
  image_url: string;
}

/**
 * 从 source-patterns.json 读取原始 Pattern 数据
 */
function loadSourcePatternData(patternId: number): any {
  const workspaceRoot = process.cwd();
  const sourcePatternsPath = path.join(workspaceRoot, 'source-patterns.json');
  
  if (!fs.existsSync(sourcePatternsPath)) {
    throw new Error(`source-patterns.json not found at: ${sourcePatternsPath}`);
  }
  
  const content = fs.readFileSync(sourcePatternsPath, 'utf-8');
  const patterns = JSON.parse(content);
  
  // 查找对应的 pattern
  const patternKey = `ptn-${patternId}`;
  const patternData = patterns[patternKey];
  
  if (!patternData) {
    throw new Error(`Pattern data not found in source-patterns.json for ID: ${patternId}`);
  }
  
  return patternData;
}

/**
 * 分析单个 Pattern 图片的布局
 * @param patternId - Pattern ID
 * @returns 丰富化的 Pattern 数据
 */
export async function analyzePatternLayout(patternId: number): Promise<EnrichedPatternData> {
  const workspaceRoot = process.cwd();
  const imagePath = path.join(workspaceRoot, 'images', `ptn-${patternId}.jpeg`);
  
  // 检查图片是否存在
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image not found for pattern ID ${patternId}: ${imagePath}`);
  }
  
  // 读取原始 Pattern 数据
  const rawPatternData = loadSourcePatternData(patternId);
  
  // 调试：打印原始 layout 数据
  console.log('🔍 原始 layout 数据:', JSON.stringify(rawPatternData.layout, null, 2));
  
  // 读取图片并转换为 base64
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');
  
  // 构建分析 Prompt
  const prompt = `### 角色与任务 ###
你是专业的网页设计分析专家。你需要综合分析两部分输入：1) 原始 Pattern 元数据 JSON，2) 对应的网页设计图片，然后生成准确、精炼的结构化数据。

### 输入 ###
1. **JSON 元数据**：包含 Pattern 的基础信息
2. **设计图片**：该 Pattern 的视觉设计截图（已随本文一同提供）

### 核心要求 ###
1. **视觉优先**：分析必须基于提供的图片，不依赖 JSON 中的 image URL
2. **图文结合**：结合图片视觉特征和 JSON 元数据，生成准确描述
3. **杜绝模板化**：避免使用"一个"、"这是"等无意义开头，直接描述核心特征
4. **精准匹配**：所有标签必须准确反映设计实际特征，不确定的不选

### 输出格式 ###
返回纯 JSON 对象（无任何额外文字、Markdown、注释）：

{
  "id": Number,           // 必须保持原值
  "name": String,         // 必须保持原值
  "description": String,  // 精炼描述（见约束）
  "categories": [String], // 从枚举选择
  "style_tags": [String], // 从枚举选择
  "industry_tags": [String], // 从枚举选择
  "layout": Object,       // **必须保留原有数据**，可补充新维度（见约束）
  "keywords": [String],   // 4-8个核心词
  "image_url": String     // 必须保持原值
}

### 内容生成约束 ###

**description（描述）：**
- 长度：60-120 字符（不超过 150）
- 结构：直接描述布局+特征+适用场景
- 禁止：以"一个"、"这是一个"、"该模块"等开头
- 示例（好）："经典左文右图布局，突出产品特性和价值。适合 SaaS 产品首页展示核心功能。"
- 示例（差）："一个现代简洁的布局，非常适合..."

**keywords（关键词）：**
- 数量：4-8 个
- 要求：高度相关、具体、有搜索价值
- 避免：笼统词（如"布局"、"设计"）

**categories（分类）：**
- 选择：必须从枚举精确匹配
- 数量：1-3 个最相关的
- 枚举：hero, features, cta, pricing-table, testimonials, faq, team, gallery, contact-form, content, logos, stats, how-it-works, header, footer, location, blog, services, video, newsletter

**style_tags（风格）：**
- 选择：必须从枚举精确匹配
- 数量：2-4 个
- 原则：只选有把握的，宁缺毋滥
- 枚举：minimalist, modern, corporate, elegant, playful, brutalist, vintage, bold, clean, professional, serene, dark-mode, light-mode, colorful, gradient, flat, illustration

**industry_tags（行业）：**
- 选择：必须从枚举精确匹配
- 数量：2-4 个
- 枚举：saas, ecommerce, portfolio, agency, startup, restaurant, real-estate, health, finance, education, travel, non-profit, generic, tech, consulting, media

**layout（布局）：**
- **❗重要**：必须完整复制原始 JSON 中的所有 layout 字段，一个都不能丢失
- **处理策略**：
  * 第一步：将原 JSON 的 layout 对象完整复制到输出中（即使为空）
  * 第二步：如果能从图片识别到更多布局特征，添加到 layout 对象中
  * 第三步：确保输出的 layout 至少包含原有的所有字段
- **原有的 key 类型**（必须使用这些格式）：
  * 栏数：1-column, 2-columns, 3-columns, 4-columns
  * 网格：bento-grid, grid, masonry
  * 媒体位置：media-left, media-right, media-top, media-bottom, media-background, media-center
  * 其他：no-media, off-grid, full-width, contained
- **可补充的新维度**（只在原数据没有且能从图片识别时添加）：
  * alignment (值: Centered, Left Aligned, Right Aligned)
  * width (值: Full Width, Contained, Wide)
  * vertical-alignment (值: Top, Middle, Bottom)
  * spacing (值: Compact, Normal, Spacious)
- **错误示例（禁止）**：
  * 原有 { "2-columns": "2 Columns" } → 输出 {} ❌ 丢失了原有数据
  * 原有 { "media-left": "Media Left" } → 输出 { "alignment": "Centered" } ❌ 丢失了原有数据
- **正确示例**：
  * 原有 {} → 输出 { "2-columns": "2 Columns", "media-right": "Media Right" } ✅ 从图片识别填充
  * 原有 { "3-columns": "3 Columns" } → 输出 { "3-columns": "3 Columns", "bento-grid": "Bento Grid" } ✅ 保留并补充
  * 原有 { "1-column": "1 Column", "no-media": "No Media" } → 输出 { "1-column": "1 Column", "no-media": "No Media", "alignment": "Centered" } ✅ 保留全部并补充

### 示例输出 ###

**示例 1：原 layout 有数据，必须保留**
输入 JSON:
{
  "id": 19057,
  "name": "Hero 64",
  "layout": {
    "1-column": "1 Column",
    "media-background": "Media Background",
    "media-left": "Media Left",
    "off-grid": "Off-Grid"
  }
}

输出（必须保留所有原有字段）:
{
  "id": 19057,
  "name": "Hero 64",
  "description": "全屏背景图设计，左侧文案区域包含标题和行动按钮。适合产品首页或着陆页。",
  "categories": ["hero"],
  "style_tags": ["modern", "clean"],
  "industry_tags": ["saas", "tech"],
  "layout": {
    "1-column": "1 Column",              // ✅ 保留
    "media-background": "Media Background", // ✅ 保留
    "media-left": "Media Left",            // ✅ 保留
    "off-grid": "Off-Grid",                // ✅ 保留
    "alignment": "Left Aligned"            // ✅ 补充（从图片识别）
  },
  "keywords": ["首屏", "背景图", "左对齐", "CTA"],
  "image_url": "https://..."
}

**示例 2：原 layout 为空，从图片识别填充**
输入 JSON:
{
  "id": 19114,
  "name": "Hero 65",
  "layout": {}
}

输出（从图片识别填充）:
{
  "id": 19114,
  "name": "Hero 65",
  "description": "经典双栏首屏，左侧文案+CTA按钮，右侧产品配图。适合科技类产品快速传达核心价值。",
  "categories": ["hero"],
  "style_tags": ["modern", "corporate", "clean"],
  "industry_tags": ["saas", "startup", "agency", "tech"],
  "layout": { 
    "2-columns": "2 Columns",           // ✅ 从图片识别
    "media-right": "Media Right",       // ✅ 从图片识别
    "alignment": "Left Aligned"         // ✅ 从图片识别
  },
  "keywords": ["首屏", "产品展示", "CTA按钮", "双栏布局"],
  "image_url": "https://..."
}

**❗关键规则**：layout 必须包含原始 JSON 中的所有字段，可以补充但绝不能丢失！

### 原始数据 ###
${JSON.stringify(rawPatternData, null, 2)}
`;

  // 调用 Gemini Vision API（低温度确保准确性）
  const response = await LLMGateway.callText({
    model: MODEL_IDS.GEMINI_2_5_PRO,
    prompt: prompt,
    temperature: 0.1, // 降低温度提高准确性和一致性
    jsonMode: true,
    images: [{
      data: imageBase64,
      mimeType: 'image/jpeg'
    }]
  });
  
  // 解析 JSON 响应
  const enrichedData: EnrichedPatternData = JSON.parse(response);
  
  // 调试：打印 AI 返回的 layout
  console.log('🤖 AI 返回的 layout:', JSON.stringify(enrichedData.layout, null, 2));
  
  // 🔧 防御性编程：确保保留原有 layout 数据
  // 即使 AI 忘记保留，代码层面也要确保数据完整性
  enrichedData.layout = {
    ...rawPatternData.layout,  // 先复制原有数据（确保不丢失）
    ...enrichedData.layout     // 再合并 AI 识别的新数据（可能为空）
  };
  
  // 调试：打印合并后的 layout
  console.log('✅ 合并后的 layout:', JSON.stringify(enrichedData.layout, null, 2));
  
  return enrichedData;
}

/**
 * 检查图片是否存在
 * @param patternId - Pattern ID
 * @returns 是否存在
 */
export function checkPatternImageExists(patternId: number): boolean {
  const workspaceRoot = process.cwd();
  const imagePath = path.join(workspaceRoot, 'images', `ptn-${patternId}.jpeg`);
  return fs.existsSync(imagePath);
}

