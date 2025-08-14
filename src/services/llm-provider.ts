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

};

export default {
  invoke: async ({ model, prompt, temperature, top_p = 1.0, thinkingBudget }: LLMParams): Promise<string> => {
    try {
      if (!isModelSupported(model)) {
        throw new Error(`Unsupported model: ${model}. Please use a model id from model-catalog.`);
      }
      switch (true) {
        case model.startsWith('gpt'):
          const openai = getOpenAI();
          const gptResponse = await openai.chat.completions.create({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: temperature,
            top_p: top_p,
            response_format: { type: "json_object" },
          });
          return gptResponse.choices[0].message.content || '';

        case model.startsWith('claude'):
          const anthropic = getAnthropic();
          const messages: MessageParam[] = [{ role: 'user', content: prompt }];
          const claudeResponse = await anthropic.messages.create({
            model: model,
            max_tokens: 4096,
            temperature: temperature,
            top_p: top_p,
            messages: messages,
          });
          return claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';

        case model.startsWith('gemini'):
          // 官方 @google/genai SDK 调用
          {
            const ai = getGoogleGenAI();
            const response: any = await ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                temperature,
                topP: top_p,
                ...(typeof thinkingBudget === 'number' ? { thinkingConfig: { thinkingBudget } } : {}),
              },
            });
            // SDK 统一提供 .text() 方法
            return typeof response.text === 'function' ? response.text() : (response.text || '');
          }

        default:
          throw new Error(`Unsupported model: ${model}`);
      }
    } catch (error) {
      console.error(`LLM invocation error for model ${model}:`, error);
      throw new Error(`LLM invocation failed for model ${model}.`);
    }
  },
  cleanAiJsonResponse,
};
