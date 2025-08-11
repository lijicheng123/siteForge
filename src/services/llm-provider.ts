// src/services/llm-provider.ts
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources';

interface LLMParams {
  model: string;
  prompt: string;
  temperature: number;
  top_p?: number;
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

const cleanAiJsonResponse = (response: string): string => {
    // This regex handles JSON within markdown code blocks, with optional language specifier
    const match = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    return match ? match[1].trim() : response.trim();
};

export default {
  invoke: async ({ model, prompt, temperature, top_p = 1.0 }: LLMParams): Promise<string> => {
    try {
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
