// src/services/llm-gateway.ts
import axios from 'axios';

// 渠道类型
export type Channel = 'official' | 'huandu';

// 模型提供商类型
export type Provider = 'gemini' | 'claude' | 'openai';

// LLM 请求参数
export interface LLMRequest {
  model: string;
  prompt: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  channel?: Channel; // 默认为 huandu
  jsonMode?: boolean; // 启用原生 JSON 模式
}

// LLM 响应
export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

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
  const payload: any = {
    contents: [{
      parts: [{
        text: request.prompt
      }]
    }],
    generationConfig: {
      temperature: request.temperature || 0.7,
      topP: request.top_p || 1.0,
      maxOutputTokens: request.max_tokens || getDefaultMaxTokens('gemini')
    }
  };

  // 启用原生 JSON 模式
  if (request.jsonMode) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      }
    });

    const content = (response.data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
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
  const payload: any = {
    contents: [{
      parts: [{
        text: request.prompt
      }]
    }],
    generationConfig: {
      temperature: request.temperature || 0.7,
      topP: request.top_p || 1.0,
      maxOutputTokens: request.max_tokens || getDefaultMaxTokens('gemini')
    }
  };

  // 启用原生 JSON 模式
  if (request.jsonMode) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const content = (response.data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    const usage = response.data.usageMetadata ? {
      prompt_tokens: response.data.usageMetadata.promptTokenCount || 0,
      completion_tokens: response.data.usageMetadata.candidatesTokenCount || 0,
      total_tokens: response.data.usageMetadata.totalTokenCount || 0
    } : undefined;

    return { content, usage };
  } catch (error: any) {
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

    const content = (response.data.content?.[0]?.text || '').trim();
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

    const content = (response.data.content?.[0]?.text || '').trim();
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

    const content = (response.data.choices?.[0]?.message?.content || '').trim();
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

    const content = (response.data.choices?.[0]?.message?.content || '').trim();
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
