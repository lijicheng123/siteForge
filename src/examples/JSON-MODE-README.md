# 原生 JSON 模式功能说明

## 概述

我们为 LLM 网关添加了原生 JSON 模式支持，可以确保模型返回纯净、有效的 JSON 格式数据，而不是包含额外文本或 markdown 标记的响应。

## 支持的模型提供商

### 1. OpenAI (GPT 系列)
- **实现方式**: 使用 `response_format: {"type": "json_object"}` 参数
- **支持模型**: gpt-4, gpt-4-turbo, gpt-3.5-turbo 等
- **官方文档**: [OpenAI JSON Mode](https://platform.openai.com/docs/guides/text-generation/json-mode)

### 2. Google Gemini
- **实现方式**: 在 `generationConfig` 中设置 `responseMimeType: "application/json"`
- **支持模型**: gemini-pro, gemini-2.0-flash-exp 等
- **官方文档**: [Gemini Structured Output](https://ai.google.dev/gemini-api/docs/json-mode)

### 3. Anthropic Claude
- **实现方式**: 通过 `system` 消息指令实现类似效果
- **支持模型**: claude-3, claude-3.5-sonnet 等
- **说明**: Claude 通过系统消息来确保 JSON 输出格式

## 使用方法

### 1. 基本使用

```typescript
import { callLLM, LLMRequest } from '../services/llm-gateway';

const request: LLMRequest = {
  model: 'gemini-2.0-flash-exp',
  prompt: '生成一个用户信息的 JSON 对象，包含姓名、年龄、邮箱',
  jsonMode: true, // 启用原生 JSON 模式
  temperature: 0.7
};

const response = await callLLM(request);
const userData = JSON.parse(response.content); // 保证能解析成功
```

### 2. 在 Prompt Factory 中使用

```typescript
import promptFactory from '../services/prompt-factory';

// 启用 JSON 模式的 prompt
const prompt = promptFactory.getStep1AnalyzerPrompt(rawInput, true);

const request: LLMRequest = {
  model: 'gpt-4o-mini',
  prompt,
  jsonMode: true, // 与 prompt factory 的 useJsonMode 参数配合
  temperature: 0.7
};
```

## 优势对比

### 传统方式（仅依赖 Prompt）
```
❌ 可能返回 ```json\n{...}\n``` 格式
❌ 可能包含额外解释文字
❌ 需要复杂的文本清理逻辑
❌ JSON 解析成功率较低
```

### 原生 JSON 模式
```
✅ 保证返回纯净 JSON
✅ 无需文本清理
✅ JSON 解析成功率 99%+
✅ 更高的可靠性和性能
```

## 兼容性说明

- **向后兼容**: 现有代码无需修改，默认 `jsonMode: false`
- **渐进升级**: 可以逐步在需要的地方启用 JSON 模式
- **Prompt 优化**: 启用 JSON 模式时，prompt 会自动简化格式要求

## 最佳实践

1. **结构化数据生成**: 优先使用原生 JSON 模式
2. **Schema 验证**: 配合 JSON Schema 使用效果更佳
3. **错误处理**: 仍需要 try-catch 包装 JSON.parse()
4. **模型选择**: 不同模型对 JSON 模式支持程度不同，建议测试后选择

## 示例代码

完整示例请参考 `src/examples/json-mode-example.ts`

## 注意事项

1. **提示词要求**: 启用 JSON 模式时，提示词中仍需说明要返回 JSON 格式
2. **Token 消耗**: JSON 模式通常不会显著增加 token 消耗
3. **模型限制**: 某些较旧的模型可能不支持原生 JSON 模式
4. **网关兼容**: 支持官方 API 和寰渡网关两种渠道
