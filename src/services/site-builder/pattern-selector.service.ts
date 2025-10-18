// src/services/site-builder/pattern-selector.service.ts
import * as fs from 'fs';
import * as path from 'path';
import { MODEL_IDS } from "../model-catalog";
import LLMGateway from "../llm-gateway";
import patternSelectorPromptFactory from "./pattern-selector-prompt-factory";
import { PatternSelectorResponseSchema, PatternSelectorRequest, PatternSelectorResponse } from "../../schemas/site-builder/pattern-selector";

/**
 * 从 enriched-patterns.json 加载所有丰富化的 Pattern 数据
 */
function loadEnrichedPatterns(): any {
  const workspaceRoot = process.cwd();
  const enrichedPatternsPath = path.join(workspaceRoot, 'enriched-patterns.json');
  
  if (!fs.existsSync(enrichedPatternsPath)) {
    throw new Error(`enriched-patterns.json not found at: ${enrichedPatternsPath}`);
  }
  
  const content = fs.readFileSync(enrichedPatternsPath, 'utf-8');
  const patterns = JSON.parse(content);
  
  return patterns;
}

/**
 * 执行 Pattern 选择器
 * 根据用户需求从 enriched-patterns.json 中选择最合适的 Pattern 组合
 * 
 * @param request - 用户需求信息
 * @returns 选中的 Pattern ID 列表（带理由）和总结
 */
export async function executePatternSelector(request: PatternSelectorRequest): Promise<PatternSelectorResponse> {
  // 1. 加载所有 enriched patterns
  const patternLibrary = loadEnrichedPatterns();

  const { globalElements, pages, patterns } = request;
  // TODO: patterns 后面将本服务的patterns库合并进去
  // const allPatterns = [...patterns, ...patternLibrary];
  
  // 2. 构建 prompt
  const prompt = patternSelectorPromptFactory.getPatternSelectorPrompt({ globalElements, pages }, patterns);
  // 3. 调用 LLM
  const response = await LLMGateway.callText({
    model: MODEL_IDS.GPT_5_MINI,
    prompt,
    temperature: 0.7,
    jsonMode: true,
    jsonSchema: PatternSelectorResponseSchema
  });
  
  // 4. 解析并返回结果
  const result = JSON.parse(response) as PatternSelectorResponse;
   // TODO:以后要把返回的值进行验证一下
  // 5. 验证返回的 Pattern ID 是否都存在于 enriched-patterns.json 中
  // const patternKeys = Object.keys(patternLibrary);
  // const validPatternIds = patternKeys.map(key => {
  //   const match = key.match(/^ptn-(\d+)$/);
  //   return match ? parseInt(match[1], 10) : null;
  // }).filter(id => id !== null);
  
  // const invalidPatterns = result.patterns.filter(p => !validPatternIds.includes(p.id));
  
  // if (invalidPatterns.length > 0) {
  //   console.warn(`Warning: AI returned invalid pattern IDs: ${invalidPatterns.map(p => p.id).join(', ')}`);
  //   // 过滤掉无效的 Pattern ID
  //   result.patterns = result.patterns.filter(p => validPatternIds.includes(p.id));
  // }
  
  return result;
}

