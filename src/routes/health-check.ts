/**
 * 健康检查路由（与工作流并列）
 * 要点：
 * - 直接复用业务封装：llmProvider.invoke
 * - 通过相同调用路径验证网络、鉴权、封装是否正常
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import LLMGateway from '../services/llm-gateway';
import { SUPPORTED_MODELS, MODEL_IDS } from '../services/model-catalog';

// 统一的最小健康检查 Prompt（要求返回极小 JSON，便于 gpt JSON 模式，也兼容 claude 纯文本）
const HEALTH_PROMPT = '只返回如下严格 JSON，不要多余文本：{"ok":true}';

// 从环境变量选择实际测试的模型，确保和真实业务尽量一致；支持默认安全模型
const OPENAI_TEST_MODEL = process.env.HEALTHCHECK_OPENAI_MODEL || MODEL_IDS.GPT_5_MINI;
const ANTHROPIC_TEST_MODEL = process.env.HEALTHCHECK_ANTHROPIC_MODEL || MODEL_IDS.CLAUDE_SONNET_4_20250514;
const GOOGLE_TEST_MODEL = process.env.HEALTHCHECK_GOOGLE_MODEL || MODEL_IDS.GEMINI_2_5_PRO;

async function testViaWrapper(model: string) {
  const startedAt = Date.now();
  try {
    const content = await LLMGateway.callText({ model, prompt: HEALTH_PROMPT, temperature: 0.1 });
    const responseTime = Date.now() - startedAt;
    const ok = typeof content === 'string' && content.trim().length > 0;
    return {
      status: ok ? 'available' as const : 'error' as const,
      responseTime,
      error: ok ? undefined : 'Empty response',
      quotaStatus: 'unknown' as const,
    };
  } catch (e: any) {
    const responseTime = Date.now() - startedAt;
    const message = e?.message || 'Unknown error';
    // 无法可靠区分配额，仅透传 unknown
    return {
      status: 'error' as const,
      responseTime,
      error: message,
      quotaStatus: 'unknown' as const,
    };
  }
}

export default async function healthCheckRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  // 详细模型健康检查（复用同一封装调用路径）
  fastify.get('/health/models', {
    config: {
      rateLimit: { max: 30, timeWindow: '1 minute' }
    }
  }, async (_request, reply) => {
    const [openai, anthropic, google] = await Promise.all([
      testViaWrapper(OPENAI_TEST_MODEL),
      testViaWrapper(ANTHROPIC_TEST_MODEL),
      testViaWrapper(GOOGLE_TEST_MODEL)
    ]);

    const models = {
      openai: { ...openai, lastChecked: new Date().toISOString() },
      anthropic: { ...anthropic, lastChecked: new Date().toISOString() },
      google: { ...google, lastChecked: new Date().toISOString() },
    } as const;

    const availableCount = Object.values(models).filter(m => m.status === 'available').length;
    const overallStatus = availableCount === 3 ? 'healthy' : availableCount >= 1 ? 'degraded' : 'unhealthy';

    const recommendations: string[] = [];
    if (availableCount === 0) recommendations.push('所有模型都不可用，请检查 API Key、网络和封装是否变化');
    if (availableCount === 1) recommendations.push('仅有一个模型可用，建议配置并验证备用模型');

    return reply.send({
      success: true,
      timestamp: new Date().toISOString(),
      overallStatus,
      models,
      recommendations,
    });
  });

  // 列出支持的模型及价格
  fastify.get('/health/supported-models', async (_request, reply) => {
    return reply.send({
      models: SUPPORTED_MODELS,
      count: SUPPORTED_MODELS.length,
      timestamp: new Date().toISOString(),
    });
  });

  // 快速状态检查（仅统计可用数量）
  fastify.get('/health/status', async (_request, reply) => {
    const [openai, anthropic, google] = await Promise.all([
      testViaWrapper(OPENAI_TEST_MODEL),
      testViaWrapper(ANTHROPIC_TEST_MODEL),
      testViaWrapper(GOOGLE_TEST_MODEL)
    ]);

    const availableCount = [openai, anthropic, google].filter(m => m.status === 'available').length;
    return reply.send({
      status: availableCount > 0 ? 'ok' : 'error',
      availableModels: availableCount,
      timestamp: new Date().toISOString(),
    });
  });
}
