// src/services/llm-provider.ts
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources';
import { isModelSupported } from './model-catalog';
import { GoogleGenAI } from '@google/genai';

interface LLMParams {
  model: string;
  prompt: string;
  temperature: number;
  top_p?: number;
  // Gemini 专用：可选思考预算（仅 2.5 Flash 支持关闭或限制“思考”）
  thinkingBudget?: number;
}

// 动态获取环境变量，避免模块加载时的问题
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
};

const getAnthropic = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  return new Anthropic({ apiKey });
};

const getGoogleGenAI = () => {
  // 官方 SDK 默认从 GEMINI_API_KEY 读取；如仅设置 GOOGLE_API_KEY 则兼容性赋值
  if (!process.env.GEMINI_API_KEY && process.env.GOOGLE_API_KEY) {
    process.env.GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
  }
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY (or GOOGLE_API_KEY) environment variable is not set');
  }
  return new GoogleGenAI({});
};

// 检查是否是rate limit错误
const isRateLimitError = (error: any, model: string): boolean => {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || error.status || '';
  
  // Gemini rate limit 错误特征
  if (model.startsWith('gemini')) {
    return errorMessage.includes('rate limit') || 
           errorMessage.includes('quota exceeded') ||
           errorMessage.includes('too many requests') ||
           errorCode === 429 ||
           errorCode === 'RESOURCE_EXHAUSTED' ||
           errorCode === 'QUOTA_EXCEEDED';
  }
  
  // OpenAI rate limit 错误特征
  if (model.startsWith('gpt')) {
    return errorMessage.includes('rate limit') || 
           errorMessage.includes('too many requests') ||
           errorCode === 429 ||
           errorCode === 'rate_limit_exceeded';
  }
  
  // Claude rate limit 错误特征
  if (model.startsWith('claude')) {
    return errorMessage.includes('rate limit') || 
           errorMessage.includes('too many requests') ||
           errorCode === 429 ||
           errorCode === 'rate_limit_exceeded';
  }
  
  return false;
};

// 睡眠函数
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 获取备用模型（当主模型遇到rate limit时使用）
const getFallbackModel = (originalModel: string): string => {
  const fallbackMap: Record<string, string[]> = {
    'gemini-2.5-pro': ['gpt-4o-mini', 'claude-3-haiku'],
    'gpt-4o': ['gemini-2.5-pro', 'claude-3-haiku'],
    'claude-3-opus': ['gpt-4o', 'gemini-2.5-pro'],
    'claude-3-sonnet': ['gpt-4o-mini', 'gemini-2.5-pro'],
    'claude-3-haiku': ['gpt-4o-mini', 'gemini-2.5-pro']
  };
  
  const fallbacks = fallbackMap[originalModel] || ['gpt-4o-mini', 'gemini-2.5-pro', 'claude-3-haiku'];
  return fallbacks[0]; // 返回第一个备用模型
};

export default {
  invoke: async ({ model, prompt, temperature, top_p = 1.0, thinkingBudget }: LLMParams): Promise<string> => {
    const maxRetries = 3;
    const baseDelay = 2000; // 2秒基础延迟
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!isModelSupported(model)) {
          throw new Error(`Unsupported model: ${model}. Please use a model id from model-catalog.`);
        }
        
        console.log(`[LLM] 开始调用模型: ${model} (第${attempt}次尝试)`);
        console.log(`[LLM] 温度设置: ${temperature}, top_p: ${top_p}`);
        console.log(`[LLM] 提示词长度: ${prompt.length} 字符`);
        
        // 添加开头字符提示，让AI模型从{开始续写
        const enhancedPrompt = prompt + '\n\n请从以下字符开始你的回答：\n{';
        console.log(`[LLM] 增强后的提示词长度: ${enhancedPrompt.length} 字符`);
        
        let response: string = '';
        
        switch (true) {
          case model.startsWith('gpt'):
            console.log(`[LLM] 使用 OpenAI GPT 模型: ${model}`);
            const openai = getOpenAI();
            const gptResponse = await openai.chat.completions.create({
              model: model,
              messages: [{ role: 'user', content: enhancedPrompt }],
              temperature: temperature,
              top_p: top_p,
              response_format: { type: "json_object" },
            });
            response = gptResponse.choices[0].message.content || '';
            console.log(`[LLM] GPT 原始响应:`, response);
            console.log(`[LLM] GPT 响应长度: ${response.length} 字符`);
            break;

          case model.startsWith('claude'):
            console.log(`[LLM] 使用 Anthropic Claude 模型: ${model}`);
            const anthropic = getAnthropic();
            const messages: MessageParam[] = [{ role: 'user', content: enhancedPrompt }];
            const claudeResponse = await anthropic.messages.create({
              model: model,
              max_tokens: 4096,
              temperature: temperature,
              top_p: top_p,
              messages: messages,
            });
            response = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';
            console.log(`[LLM] Claude 原始响应:`, response);
            console.log(`[LLM] Claude 响应长度: ${response.length} 字符`);
            break;

          case model.startsWith('gemini'):
            console.log(`[LLM] 使用 Google Gemini 模型: ${model}`);
            // 官方 @google/genai SDK 调用
            {
              const ai = getGoogleGenAI();
              const geminiResponse: any = await ai.models.generateContent({
                model,
                contents: enhancedPrompt,
                config: {
                  temperature,
                  topP: top_p,
                  ...(typeof thinkingBudget === 'number' ? { thinkingConfig: { thinkingBudget } } : {}),
                },
              });
              // SDK 统一提供 .text() 方法
              console.log(`[LLM] Gemini geminiResponse:`, geminiResponse);
              response = typeof geminiResponse.text === 'function' ? geminiResponse.text() : (geminiResponse.text || '');
              console.log(`[LLM] Gemini 原始响应:`, response);
              console.log(`[LLM] Gemini 响应长度: ${response.length} 字符`);
            }
            break;

          default:
            throw new Error(`Unsupported model: ${model}`);
        }
        
        console.log(`[LLM] 模型 ${model} 调用完成`);
        return response;
        
      } catch (error: any) {
        console.error(`[LLM] 模型 ${model} 第${attempt}次调用失败:`, error);
        
        // 检查是否是rate limit错误
        const isRateLimit = isRateLimitError(error, model);
        
        if (isRateLimit && attempt < maxRetries) {
          // 计算退避延迟：指数退避 + 随机抖动
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
          console.log(`[LLM] 检测到rate limit，等待 ${Math.round(delay)}ms 后重试...`);
          
          await sleep(delay);
          continue;
        }
        
        // 如果是最后一次尝试或者不是rate limit错误，抛出错误
        if (attempt === maxRetries) {
          console.error(`[LLM] 模型 ${model} 在 ${maxRetries} 次尝试后仍然失败`);
          
          // 如果是rate limit错误，提供详细的错误信息和建议
          if (isRateLimit) {
            throw new Error(`Rate limit exceeded for model ${model}. Please wait a few minutes before retrying, or consider using a different model.`);
          }
          
          throw new Error(`LLM invocation failed for model ${model} after ${maxRetries} attempts.`);
        }
        
        // 如果不是最后一次尝试，继续重试
        throw error;
      }
    }
    
    throw new Error(`Unexpected error: should not reach here`);
  },
  
  // 导出辅助函数
  isRateLimitError,
  sleep,
  getFallbackModel,
  
  cleanAiJsonResponse: (response: string): string => {
    console.log(`[LLM] 开始清理AI响应`);
    console.log(`[LLM] 清理前响应:`, response);
    
    let cleaned = response.trim();
    
    // 第一步：移除markdown代码块标记
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '');
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '');
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.replace(/\s*```$/, '');
    }
    
    // 第二步：移除可能的语言标识
    cleaned = cleaned.replace(/^```\w*\s*/, '');
    cleaned = cleaned.replace(/\s*```$/, '');
    
    // 第三步：尝试直接解析JSON
    try {
      JSON.parse(cleaned);
      console.log(`[LLM] 清理后响应 (JSON有效):`, cleaned);
      console.log(`[LLM] 清理后响应长度: ${cleaned.length} 字符`);
      return cleaned;
    } catch (parseError) {
      console.warn(`[LLM] 直接JSON解析失败，开始智能修复...`);
    }
    
    // 第四步：智能JSON修复
    try {
      // 查找JSON对象的开始和结束位置
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonContent = cleaned.substring(jsonStart, jsonEnd + 1);
        console.log(`[LLM] 提取的JSON内容:`, jsonContent);
        
        // 尝试解析提取的内容
        JSON.parse(jsonContent);
        console.log(`[LLM] 提取的JSON内容有效`);
        console.log(`[LLM] 清理后响应长度: ${jsonContent.length} 字符`);
        return jsonContent;
      }
    } catch (extractError) {
      console.warn(`[LLM] JSON内容提取失败:`, extractError);
    }
    
    // 第五步：强制JSON格式化
    try {
      // 移除可能的非JSON字符
      let forcedJson = cleaned
        .replace(/^[^{]*/, '') // 移除开头的非{字符
        .replace(/[^}]*$/, '') // 移除结尾的非}字符
        .replace(/[^\x20-\x7E]/g, '') // 移除非ASCII可打印字符
        .trim();
      
      // 确保以{开始，以}结束
      if (!forcedJson.startsWith('{')) {
        forcedJson = '{' + forcedJson;
      }
      if (!forcedJson.endsWith('}')) {
        forcedJson = forcedJson + '}';
      }
      
      console.log(`[LLM] 强制格式化后的JSON:`, forcedJson);
      
      // 尝试解析强制格式化的JSON
      JSON.parse(forcedJson);
      console.log(`[LLM] 强制格式化成功，JSON有效`);
      console.log(`[LLM] 清理后响应长度: ${forcedJson.length} 字符`);
      return forcedJson;
      
    } catch (forceError) {
      console.error(`[LLM] 强制JSON格式化失败:`, forceError);
    }
    
    // 第六步：如果所有方法都失败，返回错误信息
    console.error(`[LLM] 所有JSON修复方法都失败了`);
    console.error(`[LLM] 原始响应:`, response);
    console.error(`[LLM] 清理后响应:`, cleaned);
    
    // 返回一个包含错误信息的JSON对象
    const errorResponse = {
      error: "JSON_PARSING_FAILED",
      message: "AI响应无法解析为有效JSON",
      originalResponse: response.substring(0, 500), // 只保留前500字符
      timestamp: new Date().toISOString()
    };
    
    console.log(`[LLM] 返回错误响应JSON:`, JSON.stringify(errorResponse, null, 2));
    return JSON.stringify(errorResponse);
  },
};
