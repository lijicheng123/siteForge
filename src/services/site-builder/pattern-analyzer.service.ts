// src/services/site-builder/pattern-analyzer.service.ts
import * as fs from 'fs';
import * as path from 'path';
import { MODEL_IDS } from "../model-catalog";
import LLMGateway from "../llm-gateway";

/**
 * 分析单个 Pattern 图片的布局
 * @param patternId - Pattern ID
 * @returns 布局描述信息
 */
export async function analyzePatternLayout(patternId: number): Promise<{
  id: number;
  layoutDescription: string;
}> {
  const workspaceRoot = process.cwd();
  const imagePath = path.join(workspaceRoot, 'images', `ptn-${patternId}.jpeg`);
  
  // 检查图片是否存在
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image not found for pattern ID ${patternId}: ${imagePath}`);
  }
  
  // 读取图片并转换为 base64
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');
  
  // 构建分析 Prompt
  const prompt = `请仔细分析这张网页布局截图，并详细描述其布局结构。

请按照以下格式输出：

1. **整体布局类型**：（例如：单栏、双栏、三栏、网格、Bento Grid 等）

2. **主要区块**：
   - 顶部区域：（描述顶部的内容和布局）
   - 中间区域：（描述中间的内容和布局）
   - 底部区域：（描述底部的内容和布局）

3. **关键元素**：
   - 标题样式和位置
   - 图片/媒体的布局方式
   - 文本内容的排列
   - 按钮/CTA 的位置
   - 图标的使用
   - 其他特殊元素

4. **布局特点**：
   - 对齐方式（左对齐、居中、右对齐）
   - 间距特点
   - 视觉层次
   - 响应式特征

5. **颜色和风格**：
   - 主色调
   - 背景色
   - 整体风格（现代、简约、复古等）

请用专业的网页设计术语描述，确保描述详细且准确。`;

  // 调用 Gemini Vision API
  const response = await LLMGateway.callText({
    model: MODEL_IDS.GEMINI_2_5_PRO,
    prompt: prompt,
    temperature: 0.3, // 较低温度以确保描述的准确性
    jsonMode: false,
    images: [{
      data: imageBase64,
      mimeType: 'image/jpeg'
    }]
  });
  
  return {
    id: patternId,
    layoutDescription: response.trim()
  };
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

