/**
 * 工作流步骤服务
 * 包含步骤1-6的核心业务逻辑，供完整工作流和单独步骤调用
 */

import promptFactory from './prompt-factory';
import LLMGateway from './llm-gateway';
import { 
  structuredDataSchema,
  designSystemSchema,
  websiteArchitectureSchema,
  instructionCompleteBlueprintSchema
} from '../schemas/workflow-responses';
import { blockSchema } from '../schemas/blocks';
import { MODEL_IDS } from './model-catalog';
import { generateFullGutenbergHtml } from './html-generator';
import {
  Step1Request,
  Step2Request,
  Step3Request,
  Step4Request,
  Step5Request,
  Step6Request
} from '../schemas/workflow-requests';
import { arraySchema } from '../schemas/base';

/**
 * 步骤1: 需求解析与结构化
 * 得到结构化数据
 */
export async function executeStep1(params: Step1Request) {
  const { rawInput } = params;
  const prompt = promptFactory.getStep1AnalyzerPrompt(rawInput, true); // 启用 JSON 模式
  
  console.log('=== 步骤1: 需求解析与结构化 ===');
  console.log('Prompt:', prompt);
  
  const response = await LLMGateway.callText({ 
    model: MODEL_IDS.GEMINI_2_5_PRO, 
    prompt, 
    temperature: 0.2,
    jsonMode: true, // 启用原生 JSON 模式
    jsonSchema: structuredDataSchema
  });
  
  return JSON.parse(response);
}

/**
 * 步骤2: 品牌视觉设计
 * 得到样式&主题设计这些东西
 */
export async function executeStep2(params: Step2Request) {
  const { industry, preference, brandPersonality, targetMarket } = params;
  const context = { industry, preference };
  const prompt = promptFactory.getStep2DesignerPrompt(context, true); // 启用 JSON 模式
  
  console.log('=== 步骤2: 品牌视觉设计 ===');
  console.log('Prompt:', prompt);
  
  const response = await LLMGateway.callText({ 
    model: MODEL_IDS.GEMINI_2_5_PRO, 
    prompt, 
    temperature: 0.6,
    jsonMode: true, // 启用原生 JSON 模式
    jsonSchema: designSystemSchema
  });
  
  return JSON.parse(response);
}

/**
 * 步骤3: 网站信息架构
 * 得到网站地图和全局导航元素：全局元素（Header、Footer）和pages
 */
export async function executeStep3(params: Step3Request) {
  const { companyName, products, industry, targetMarket } = params;
  const context = { companyName, products };
  const prompt = promptFactory.getStep3ArchitectPrompt(context, true); // 启用 JSON 模式
  
  console.log('=== 步骤3: 网站信息架构 ===');
  console.log('Prompt:', prompt);
  
  const response = await LLMGateway.callText({ 
    model: MODEL_IDS.GEMINI_2_5_PRO, 
    prompt, 
    temperature: 0.3,
    jsonMode: true, // 启用原生 JSON 模式
    jsonSchema: websiteArchitectureSchema
  });
  
  return JSON.parse(response);
}

/**
 * 步骤4: 页面内容策划
 * 得到所有页面的内容大纲和SEO信息
 */
export async function executeStep4(params: Step4Request): Promise<any> {
  const prompt = promptFactory.getStep4PlannerPrompt(params, true); // 启用 JSON 模式
  
  console.log('=== 步骤4: 页面内容策划 ===');
  console.log('Prompt:', prompt);
  
  const response = await LLMGateway.callText({ 
    model: MODEL_IDS.GEMINI_2_5_PRO, 
    prompt, 
    temperature: 0.7,
    jsonMode: true, // 启用原生 JSON 模式
    jsonSchema: instructionCompleteBlueprintSchema
  });
  
  return JSON.parse(response);
}

/**
 * 步骤5: 区块布局设计
 */
export async function executeStep5(params: Step5Request) {
  const { blueprint, blockLibrary } = params;
  // 为每个页面的outline生成区块布局
  const enhancedPages = await Promise.all(blueprint.pages.map(async (page: any) => {
    if (page.outline && Array.isArray(page.outline)) {
      const layoutPrompt = promptFactory.getStep5LayoutPrompt(page.outline, blockLibrary, true); // 启用 JSON 模式
      
      console.log(`=== 步骤5: 区块布局设计 (页面: ${page.name}) ===`);
      console.log('Prompt:', layoutPrompt);
      
      const response = await LLMGateway.callText({ 
        model: MODEL_IDS.GEMINI_2_5_PRO, 
        prompt: layoutPrompt, 
        temperature: 0.1,
        jsonMode: true, // 启用原生 JSON 模式
        jsonSchema: arraySchema(blockSchema) // 让AI生成指定格式的JSON
      });
      
      const blockLayout = JSON.parse(response);
      
      return {
        ...page,
        outline: blockLayout
      };
    }
    return page;
  }));

  const step5Result = {
    ...blueprint,
    pages: enhancedPages
  }

  console.log('=== 步骤5: 区块布局设计 ===step5Result:', step5Result?.pages);
  
  return step5Result;
}

/**
 * 步骤6: 确定性代码生成
 */
export function executeStep6(params: Step6Request) {
  console.log('=== 步骤6: 确定性代码生成 ===');
  
  return generateFullGutenbergHtml({
    structuredData: params.structuredData,
    pages: params.pages.map((p: any) => ({
      name: p.name,
      path: p.path,
      purpose: p.purpose,
      seo: p.seo,
      outline: Array.isArray(p.outline) ? p.outline : []
    }))
  });
}
