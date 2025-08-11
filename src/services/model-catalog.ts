// src/services/model-catalog.ts

export type SupportedModel = {
  id: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google';
  displayName: string;
  pricing: {
    inputPerMTokensUSD: number;
    outputPerMTokensUSD: number;
  };
};

export const SUPPORTED_MODELS: SupportedModel[] = [
  {
    id: 'claude-opus-4-1-20250805',
    provider: 'Anthropic',
    displayName: 'Anthropic / claude-opus-4-1-20250805',
    pricing: { inputPerMTokensUSD: 16.5, outputPerMTokensUSD: 82.5 },
  },
  {
    id: 'claude-sonnet-4-20250514',
    provider: 'Anthropic',
    displayName: 'Anthropic / claude-sonnet-4-20250514',
    pricing: { inputPerMTokensUSD: 3.3, outputPerMTokensUSD: 16.5 },
  },
  {
    id: 'gpt-5',
    provider: 'OpenAI',
    displayName: 'OpenAI / gpt-5',
    pricing: { inputPerMTokensUSD: 1.25, outputPerMTokensUSD: 10 },
  },
  {
    id: 'gpt-5-mini',
    provider: 'OpenAI',
    displayName: 'OpenAI / gpt-5-mini',
    pricing: { inputPerMTokensUSD: 0.25, outputPerMTokensUSD: 2 },
  },
  {
    id: 'gemini-2.5-pro',
    provider: 'Google',
    displayName: 'Google / gemini-2.5-pro',
    pricing: { inputPerMTokensUSD: 1.25, outputPerMTokensUSD: 10 },
  },
];

// 便于调用方引用的常量，避免硬编码字符串
export const MODEL_IDS = Object.freeze({
  CLAUDE_OPUS_4_1_20250805: 'claude-opus-4-1-20250805',
  CLAUDE_SONNET_4_20250514: 'claude-sonnet-4-20250514',
  GPT_5: 'gpt-5',
  GPT_5_MINI: 'gpt-5-mini',
  GEMINI_2_5_PRO: 'gemini-2.5-pro',
} as const);

export type ModelId = typeof MODEL_IDS[keyof typeof MODEL_IDS];

export function getProviderByModelId(modelId: string): SupportedModel['provider'] | undefined {
  if (modelId.startsWith('gpt')) return 'OpenAI';
  if (modelId.startsWith('claude')) return 'Anthropic';
  if (modelId.startsWith('gemini')) return 'Google';
  return SUPPORTED_MODELS.find(m => m.id === modelId)?.provider;
}

export function isModelSupported(modelId: string): boolean {
  return SUPPORTED_MODELS.some(m => m.id === modelId);
}


