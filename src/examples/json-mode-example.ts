// src/examples/json-mode-example.ts
// 原生 JSON 模式使用示例

import { callLLM, LLMRequest } from '../services/llm-gateway';
import promptFactory from '../services/prompt-factory';

// 示例1：使用原生 JSON 模式的基本调用
async function exampleBasicJsonMode() {
  console.log('\n=== 示例1：基本 JSON 模式调用 ===');
  
  const request: LLMRequest = {
    model: 'gemini-2.0-flash-exp',
    prompt: '请生成一个包含姓名、年龄和技能的程序员信息 JSON 对象',
    jsonMode: true, // 启用原生 JSON 模式
    temperature: 0.7
  };

  try {
    const response = await callLLM(request);
    console.log('原生 JSON 模式响应:');
    console.log(response.content);
    
    // 验证返回的是否为有效 JSON
    const parsed = JSON.parse(response.content);
    console.log('解析成功，JSON 有效:', parsed);
  } catch (error) {
    console.error('调用失败:', error);
  }
}

// 示例2：对比传统 Prompt 方式和原生 JSON 模式
async function exampleCompareModels() {
  console.log('\n=== 示例2：对比传统方式和原生 JSON 模式 ===');
  
  const rawInput = "我们是一家专注于工业LED照明的制造商，公司名称是亮点科技，主要产品包括工厂照明灯和仓库照明系统。";
  
  // 传统方式 - 通过详细的 Prompt 指令
  console.log('\n--- 传统方式 ---');
  const traditionalPrompt = promptFactory.getStep1AnalyzerPrompt(rawInput, false);
  const traditionalRequest: LLMRequest = {
    model: 'gemini-2.0-flash-exp',
    prompt: traditionalPrompt,
    jsonMode: false, // 不启用原生 JSON 模式
    temperature: 0.7
  };

  try {
    const traditionalResponse = await callLLM(traditionalRequest);
    console.log('传统方式响应长度:', traditionalResponse.content.length);
    console.log('传统方式响应预览:', traditionalResponse.content.substring(0, 200) + '...');
  } catch (error) {
    console.error('传统方式调用失败:', error);
  }

  // 原生 JSON 模式
  console.log('\n--- 原生 JSON 模式 ---');
  const jsonModePrompt = promptFactory.getStep1AnalyzerPrompt(rawInput, true);
  const jsonModeRequest: LLMRequest = {
    model: 'gemini-2.0-flash-exp',
    prompt: jsonModePrompt,
    jsonMode: true, // 启用原生 JSON 模式
    temperature: 0.7
  };

  try {
    const jsonModeResponse = await callLLM(jsonModeRequest);
    console.log('JSON 模式响应长度:', jsonModeResponse.content.length);
    console.log('JSON 模式响应预览:', jsonModeResponse.content.substring(0, 200) + '...');
    
    // 验证 JSON 有效性
    try {
      const parsed = JSON.parse(jsonModeResponse.content);
      console.log('✓ JSON 解析成功');
    } catch (parseError) {
      console.log('✗ JSON 解析失败:', parseError);
    }
  } catch (error) {
    console.error('JSON 模式调用失败:', error);
  }
}

// 示例3：不同模型提供商的 JSON 模式测试
async function exampleDifferentProviders() {
  console.log('\n=== 示例3：不同提供商的 JSON 模式 ===');
  
  const prompt = '生成一个包含城市名称、人口和主要产业的 JSON 对象';
  const models = [
    'gemini-2.0-flash-exp',     // Gemini
    'claude-3-5-sonnet-20241022', // Claude
    'gpt-4o-mini'               // OpenAI
  ];

  for (const model of models) {
    console.log(`\n--- 测试模型: ${model} ---`);
    
    const request: LLMRequest = {
      model,
      prompt,
      jsonMode: true,
      temperature: 0.7,
      max_tokens: 500
    };

    try {
      const response = await callLLM(request);
      console.log(`${model} 响应:`, response.content);
      
      // 验证 JSON
      const parsed = JSON.parse(response.content);
      console.log(`✓ ${model} JSON 解析成功`);
    } catch (error) {
      console.error(`✗ ${model} 调用失败:`, error);
    }
  }
}

// 主函数
async function main() {
  console.log('🚀 原生 JSON 模式功能演示');
  
  try {
    await exampleBasicJsonMode();
    await exampleCompareModels();
    await exampleDifferentProviders();
  } catch (error) {
    console.error('演示过程中发生错误:', error);
  }
  
  console.log('\n✅ 演示完成');
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

export {
  exampleBasicJsonMode,
  exampleCompareModels,
  exampleDifferentProviders
};
