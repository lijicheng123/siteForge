// src/services/llm-gateway.ts
import axios from 'axios';

// 渠道类型
export type Channel = 'official' | 'huandu';

// 模型提供商类型
export type Provider = 'gemini' | 'claude' | 'openai';

// 图片内容类型
export interface ImageContent {
  data: string; // base64 编码的图片数据
  mimeType: string; // 例如 'image/jpeg', 'image/png'
}

// LLM 请求参数
export interface LLMRequest {
  model: string;
  prompt: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  channel?: Channel; // 默认为 huandu
  jsonMode?: boolean; // 启用原生 JSON 模式
  // 提供可选的 JSON Schema（仅 Gemini 官方/兼容通道支持）。
  // 对应官方文档的 response_json_schema 字段：
  // https://ai.google.dev/gemini-api/docs/structured-output?hl=zh-cn#javascript
  jsonSchema?: unknown;
  // 图片内容（仅 Gemini 支持）
  images?: ImageContent[];
}

// LLM 响应
export interface LLMResponse {
  content: string;
  thought?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 尝试将带有 ```json 包裹或前后夹杂说明文字的文本，清洗为纯 JSON 字符串
const sanitizeJsonLikeContent = (rawText: string): string => {
  if (!rawText) return rawText;

  let text = rawText.trim();

  // 去除 Markdown 代码块围栏 ```json ... ``` 或 ``` ... ```
  if (text.startsWith('```')) {
    // 移除起始 ```json 或 ```
    text = text.replace(/^```[a-zA-Z]*\s*/i, '');
    // 移除末尾 ```
    text = text.replace(/\s*```\s*$/i, '');
  }

  // 直接尝试解析
  try {
    JSON.parse(text);
    return text;
  } catch {}

  // 尝试截取第一个对象或数组的主体
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1).trim();
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {}
  }

  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = text.slice(firstBracket, lastBracket + 1).trim();
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {}
  }

  // 未能清洗出有效 JSON，返回原始文本
  return rawText;
};

// 网关配置
interface GatewayConfig {
  huandu: {
    baseUrl: string;
    apiKeys: {
      gemini: string;
      claude: string;
      openai: string;
    };
    endpoints: {
      gemini: string;
      claude: string;
      openai: string;
    };
  };
  official: {
    gemini: {
      apiKey: string;
      baseUrl: string;
    };
    claude: {
      apiKey: string;
      baseUrl: string;
    };
    openai: {
      apiKey: string;
      baseUrl: string;
    };
  };
}

// 获取配置
const getConfig = (): GatewayConfig => {
  return {
    huandu: {
      baseUrl: 'https://hk.huandutech.com',
      apiKeys: {
        gemini: process.env.DEV_GEMMINI_API_KEY || '',
        claude: process.env.DEV_CLUADE_API_KEY || '',
        openai: process.env.DEV_OPENAI_API_KEY || ''
      },
      endpoints: {
        gemini: '/v1beta/models/gemini-2.5-pro:generateContent',
        claude: '/v1/messages',
        openai: '/v1/chat/completions'
      }
    },
    official: {
      gemini: {
        apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
        baseUrl: 'https://generativelanguage.googleapis.com'
      },
      claude: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        baseUrl: 'https://api.anthropic.com'
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        baseUrl: 'https://api.openai.com'
      }
    }
  };
};

// 获取默认的max_tokens配置
const getDefaultMaxTokens = (provider: Provider): number => {
  switch (provider) {
    case 'claude':
      return parseInt(process.env.DEFAULT_MAX_TOKENS_CLAUDE || '4096', 10);
    case 'openai':
      return parseInt(process.env.DEFAULT_MAX_TOKENS_GPT || '4096', 10);
    case 'gemini':
      return parseInt(process.env.DEFAULT_MAX_TOKENS_GEMINI || '4096', 10);
    default:
      return 4096; // 兜底默认值
  }
};

// 检测模型提供商
const getProvider = (model: string): Provider => {
  if (model.startsWith('gemini')) return 'gemini';
  if (model.startsWith('claude')) return 'claude';
  if (model.startsWith('gpt')) return 'openai';
  
  throw new Error(`Unsupported model: ${model}`);
};

// Gemini 官方接口调用
const callGeminiOfficial = async (request: LLMRequest): Promise<LLMResponse> => {
  const config = getConfig();
  const { apiKey, baseUrl } = config.official.gemini;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY environment variable is not set');
  }

  const url = `${baseUrl}/v1beta/models/${request.model}:generateContent`;
  
  // 构建 parts 数组
  const parts: any[] = [{
    text: request.prompt
  }];
  
  // 如果有图片，添加到 parts
  if (request.images && request.images.length > 0) {
    request.images.forEach(image => {
      parts.push({
        inline_data: {
          mime_type: image.mimeType,
          data: image.data
        }
      });
    });
  }
  
  const payload: any = {
    contents: [{
      parts: parts
    }],
    generationConfig: {
      temperature: request.temperature || 0.7,
      topP: request.top_p || 1.0,
      maxOutputTokens: request.max_tokens || getDefaultMaxTokens('gemini')
    }
  };

  // 启用原生 JSON 模式
  if (request.jsonMode) {
    // Gemini 使用下划线参数名
    payload.generationConfig.response_mime_type = "application/json";
    if (request.jsonSchema) {
      payload.generationConfig.response_json_schema = request.jsonSchema;
    }
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      }
    });

    const contentRaw = (response.data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    const content = request.jsonMode ? sanitizeJsonLikeContent(contentRaw) : contentRaw;
    // 调试：记录返回的 content-type 与内容片段
    try {
      const ct = (response.headers && (response.headers['content-type'] || response.headers['Content-Type'])) || 'unknown';
      console.log('[LLM Gateway][Gemini official] content-type:', ct);
      console.log('[LLM Gateway][Gemini official] jsonMode:', !!request.jsonMode, 'preview:', content.substring(0, 200));
    } catch {}
    const usage = response.data.usageMetadata ? {
      prompt_tokens: response.data.usageMetadata.promptTokenCount || 0,
      completion_tokens: response.data.usageMetadata.candidatesTokenCount || 0,
      total_tokens: response.data.usageMetadata.totalTokenCount || 0
    } : undefined;

    return { content, usage };
  } catch (error: any) {
    throw new Error(`Gemini official API error: ${error.response?.data?.error?.message || error.message}`);
  }
};

// Gemini 寰渡网关调用
const callGeminiHuandu = async (request: LLMRequest): Promise<LLMResponse> => {
  const config = getConfig();
  const { baseUrl, apiKeys, endpoints } = config.huandu;
  const apiKey = apiKeys.gemini;
  
  if (!apiKey) {
    throw new Error('DEV_GEMMINI_API_KEY environment variable is not set');
  }

  const url = `${baseUrl}${endpoints.gemini}`;
  
  // 构建 parts 数组
  const parts: any[] = [{
    text: request.prompt
  }];
  
  // 如果有图片，添加到 parts
  if (request.images && request.images.length > 0) {
    request.images.forEach(image => {
      parts.push({
        inline_data: {
          mime_type: image.mimeType,
          data: image.data
        }
      });
    });
  }
  
  const payload: any = {
    contents: [{
      parts: parts
    }],
    generationConfig: {
      temperature: request.temperature || 0.7,
      topP: request.top_p || 1.0,
      maxOutputTokens: request.max_tokens || getDefaultMaxTokens('gemini')
    }
  };

  // 启用原生 JSON 模式
  if (request.jsonMode) {
    // 根据官方 REST Demo，使用 camelCase
    payload.generationConfig.responseMimeType = "application/json";
    if (request.jsonSchema) {
      payload.generationConfig.responseSchema = request.jsonSchema;
    }
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    // parts[0] 是系统思考，parts[1] 是响应
    const thought = (response.data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    const contentRaw = (response.data.candidates?.[0]?.content?.parts?.[1]?.text || '').trim();
    const content = request.jsonMode ? sanitizeJsonLikeContent(contentRaw) : contentRaw;

    const usage = response.data.usageMetadata ? {
      prompt_tokens: response.data.usageMetadata.promptTokenCount || 0,
      completion_tokens: response.data.usageMetadata.candidatesTokenCount || 0,
      total_tokens: response.data.usageMetadata.totalTokenCount || 0
    } : undefined;

    return { content, usage, thought };
  } catch (error: any) {
    console.error('Gemini huandu gateway error:', error);
    throw new Error(`Gemini huandu gateway error: ${error.response?.data?.error?.message || error.message}`);
  }
};

// Claude 官方接口调用
const callClaudeOfficial = async (request: LLMRequest): Promise<LLMResponse> => {
  const config = getConfig();
  const { apiKey, baseUrl } = config.official.claude;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const url = `${baseUrl}/v1/messages`;
  const payload: any = {
    model: request.model,
    max_tokens: request.max_tokens || getDefaultMaxTokens('claude'),
    temperature: request.temperature || 0.7,
    top_p: request.top_p || 1.0,
    messages: []
  };

  // 启用原生 JSON 模式 - Claude 通过系统消息实现
  if (request.jsonMode) {
    payload.system = "You are a helpful assistant that always responds with valid JSON. Your response should be pure JSON without any markdown formatting or additional text.";
    payload.messages.push({
      role: 'user',
      content: request.prompt
    });
  } else {
    payload.messages.push({
      role: 'user',
      content: request.prompt
    });
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'anthropic-version': '2023-06-01'
      }
    });

    const contentRaw = (response.data.content?.[0]?.text || '').trim();
    const content = request.jsonMode ? sanitizeJsonLikeContent(contentRaw) : contentRaw;
    try {
      const ct = (response.headers && (response.headers['content-type'] || response.headers['Content-Type'])) || 'unknown';
      console.log('[LLM Gateway][Claude official] content-type:', ct);
      console.log('[LLM Gateway][Claude official] jsonMode:', !!request.jsonMode, 'preview:', content.substring(0, 200));
    } catch {}
    const usage = response.data.usage ? {
      prompt_tokens: response.data.usage.input_tokens || 0,
      completion_tokens: response.data.usage.output_tokens || 0,
      total_tokens: (response.data.usage.input_tokens || 0) + (response.data.usage.output_tokens || 0)
    } : undefined;

    return { content, usage };
  } catch (error: any) {
    throw new Error(`Claude official API error: ${error.response?.data?.error?.message || error.message}`);
  }
};

// Claude 寰渡网关调用
const callClaudeHuandu = async (request: LLMRequest): Promise<LLMResponse> => {
  const config = getConfig();
  const { baseUrl, apiKeys, endpoints } = config.huandu;
  const apiKey = apiKeys.claude;
  
  if (!apiKey) {
    throw new Error('DEV_CLUADE_API_KEY environment variable is not set');
  }

  const url = `${baseUrl}${endpoints.claude}`;
  const payload: any = {
    model: request.model,
    max_tokens: request.max_tokens || getDefaultMaxTokens('claude'),
    temperature: request.temperature || 0.7,
    top_p: request.top_p || 1.0,
    messages: []
  };

  // 启用原生 JSON 模式 - Claude 通过系统消息实现
  if (request.jsonMode) {
    payload.system = "You are a helpful assistant that always responds with valid JSON. Your response should be pure JSON without any markdown formatting or additional text.";
    payload.messages.push({
      role: 'user',
      content: request.prompt
    });
  } else {
    payload.messages.push({
      role: 'user',
      content: request.prompt
    });
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const contentRaw = (response.data.content?.[0]?.text || '').trim();
    const content = request.jsonMode ? sanitizeJsonLikeContent(contentRaw) : contentRaw;
    try {
      const ct = (response.headers && (response.headers['content-type'] || response.headers['Content-Type'])) || 'unknown';
      console.log('[LLM Gateway][Claude huandu] content-type:', ct);
      console.log('[LLM Gateway][Claude huandu] jsonMode:', !!request.jsonMode, 'preview:', content.substring(0, 200));
    } catch {}
    const usage = response.data.usage ? {
      prompt_tokens: response.data.usage.input_tokens || 0,
      completion_tokens: response.data.usage.output_tokens || 0,
      total_tokens: (response.data.usage.input_tokens || 0) + (response.data.usage.output_tokens || 0)
    } : undefined;

    return { content, usage };
  } catch (error: any) {
    throw new Error(`Claude huandu gateway error: ${error.response?.data?.error?.message || error.message}`);
  }
};

// OpenAI 官方接口调用
const callOpenAIOfficial = async (request: LLMRequest): Promise<LLMResponse> => {
  const config = getConfig();
  const { apiKey, baseUrl } = config.official.openai;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const url = `${baseUrl}/v1/chat/completions`;
  const payload: any = {
    model: request.model,
    messages: [{
      role: 'user',
      content: request.prompt
    }],
    temperature: request.temperature || 0.7,
    top_p: request.top_p || 1.0,
    max_tokens: request.max_tokens || getDefaultMaxTokens('openai')
  };

  // 启用原生 JSON 模式
  if (request.jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const contentRaw = (response.data.choices?.[0]?.message?.content || '').trim();
    const content = request.jsonMode ? sanitizeJsonLikeContent(contentRaw) : contentRaw;
    try {
      const ct = (response.headers && (response.headers['content-type'] || response.headers['Content-Type'])) || 'unknown';
      console.log('[LLM Gateway][OpenAI official] content-type:', ct);
      console.log('[LLM Gateway][OpenAI official] jsonMode:', !!request.jsonMode, 'preview:', content.substring(0, 200));
    } catch {}
    const usage = response.data.usage ? {
      prompt_tokens: response.data.usage.prompt_tokens || 0,
      completion_tokens: response.data.usage.completion_tokens || 0,
      total_tokens: response.data.usage.total_tokens || 0
    } : undefined;

    return { content, usage };
  } catch (error: any) {
    throw new Error(`OpenAI official API error: ${error.response?.data?.error?.message || error.message}`);
  }
};

// OpenAI 寰渡网关调用
const callOpenAIHuandu = async (request: LLMRequest): Promise<LLMResponse> => {
  const config = getConfig();
  const { baseUrl, apiKeys, endpoints } = config.huandu;
  const apiKey = apiKeys.openai;
  
  if (!apiKey) {
    throw new Error('DEV_OPENAI_API_KEY environment variable is not set');
  }

  const url = `${baseUrl}${endpoints.openai}`;
  const payload: any = {
    model: request.model,
    messages: [{
      role: 'user',
      content: request.prompt
    }],
    temperature: request.temperature || 0.7,
    top_p: request.top_p || 1.0,
    max_tokens: request.max_tokens || getDefaultMaxTokens('openai')
  };

  // 启用原生 JSON 模式
  if (request.jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const contentRaw = (response.data.choices?.[0]?.message?.content || '').trim();
    const content = request.jsonMode ? sanitizeJsonLikeContent(contentRaw) : contentRaw;
    try {
      const ct = (response.headers && (response.headers['content-type'] || response.headers['Content-Type'])) || 'unknown';
      console.log('[LLM Gateway][OpenAI huandu] content-type:', ct);
      console.log('[LLM Gateway][OpenAI huandu] jsonMode:', !!request.jsonMode, 'preview:', content.substring(0, 200));
    } catch {}
    const usage = response.data.usage ? {
      prompt_tokens: response.data.usage.prompt_tokens || 0,
      completion_tokens: response.data.usage.completion_tokens || 0,
      total_tokens: response.data.usage.total_tokens || 0
    } : undefined;

    return { content, usage };
  } catch (error: any) {
    throw new Error(`OpenAI huandu gateway error: ${error.response?.data?.error?.message || error.message}`);
  }
};

// 主要的网关调用函数
export const callLLM = async (request: LLMRequest): Promise<LLMResponse> => {
  const channel = request.channel || 'huandu'; // 默认使用寰渡网关
  const provider = getProvider(request.model);

  console.log(`[LLM Gateway] 调用模型: ${request.model}, 渠道: ${channel}, 提供商: ${provider}`);

  try {
    let response: LLMResponse;

    // 根据提供商和渠道选择调用方式
    switch (provider) {
      case 'gemini':
        response = channel === 'official' 
          ? await callGeminiOfficial(request)
          : await callGeminiHuandu(request);
        break;
      
      case 'claude':
        response = channel === 'official'
          ? await callClaudeOfficial(request)
          : await callClaudeHuandu(request);
        break;
      
      case 'openai':
        response = channel === 'official'
          ? await callOpenAIOfficial(request)
          : await callOpenAIHuandu(request);
        break;
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
    return response;
  } catch (error: any) {
    console.error(`[LLM Gateway] 调用失败:`, error.message);
    throw error;
  }
};

// 便捷的调用方法，只返回内容文本
export const callLLMText = async (request: LLMRequest): Promise<string> => {
  const response = await callLLM(request);
  if (!response.content) {
    console.error('没有content，callLLMText thought=>', response.thought)
    throw new Error('没有content，callLLMText thought')
  }

  if (request.jsonMode === true) { 
    try {
      JSON.parse(response.content)
    } catch (error) {
        console.error('callLLMText response.content 不是有效的 JSON,response=>', response)
        return response.content
      }
  }

  return response.content;
};

// 导出网关服务
export const LLMGateway = {
  call: callLLM,
  callText: callLLMText,
  getProvider,
  getConfig
};

export default LLMGateway;
