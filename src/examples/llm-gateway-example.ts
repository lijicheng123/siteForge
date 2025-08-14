// src/examples/llm-gateway-example.ts
/**
 * LLM 网关服务使用示例
 * 展示如何使用新的网关服务调用不同的模型和渠道
 */

import LLMGateway, { LLMRequest } from '../services/llm-gateway';

// 示例1: 使用默认配置（寰渡网关）
async function example1_DefaultUsage() {
  console.log('\n=== 示例1: 默认使用寰渡网关 ===');
  
  try {
    const response = await LLMGateway.callText({
      model: 'gemini-2.5-pro',
      prompt: '请用中文回答：什么是人工智能？请控制在100字以内。',
      temperature: 0.7
    });
    
    console.log('✅ Gemini 响应:', response);
  } catch (error: any) {
    console.error('❌ 错误:', error.message);
  }
}

// 示例2: 指定使用官方接口
async function example2_OfficialAPI() {
  console.log('\n=== 示例2: 使用官方接口 ===');
  
  try {
    const response = await LLMGateway.callText({
      model: 'claude-sonnet-4-20250514',
      prompt: '请用英文回答：What is artificial intelligence? Keep it under 50 words.',
      temperature: 0.5,
      channel: 'official' // 指定使用官方接口
    });
    
    console.log('✅ Claude 官方 API 响应:', response);
  } catch (error: any) {
    console.error('❌ 错误:', error.message);
  }
}

// 示例3: 批量测试不同模型
async function example3_BatchTest() {
  console.log('\n=== 示例3: 批量测试不同模型 ===');
  
  const models = [
    'gemini-2.5-pro',
    'claude-sonnet-4-20250514',
    'gpt-5-mini'
  ];
  
  const prompt = '请返回JSON格式: {"provider": "模型提供商", "response": "简短回应"}';
  
  for (const model of models) {
    try {
      console.log(`\n🧪 测试模型: ${model}`);
      const startTime = Date.now();
      
      const response = await LLMGateway.callText({
        model,
        prompt,
        temperature: 0.3
      });
      
      const endTime = Date.now();
      console.log(`⏱️  响应时间: ${endTime - startTime}ms`);
      console.log('📝 响应内容:', response.substring(0, 200));
      
    } catch (error: any) {
      console.error(`❌ ${model} 失败:`, error.message);
    }
  }
}

// 示例4: 获取完整响应（包含 token 使用信息）
async function example4_FullResponse() {
  console.log('\n=== 示例4: 获取完整响应信息 ===');
  
  try {
    const response = await LLMGateway.call({
      model: 'gpt-5-mini',
      prompt: '请简要解释区块链技术',
      temperature: 0.6,
      max_tokens: 200
    });
    
    console.log('✅ 完整响应:');
    console.log('📝 内容:', response.content);
    
    if (response.usage) {
      console.log('📊 Token 使用情况:');
      console.log(`   输入 tokens: ${response.usage.prompt_tokens}`);
      console.log(`   输出 tokens: ${response.usage.completion_tokens}`);
      console.log(`   总计 tokens: ${response.usage.total_tokens}`);
    }
    
  } catch (error: any) {
    console.error('❌ 错误:', error.message);
  }
}

// 示例5: 错误处理
async function example5_ErrorHandling() {
  console.log('\n=== 示例5: 错误处理 ===');
  
  try {
    // 故意使用一个不存在的模型
    await LLMGateway.callText({
      model: 'non-existent-model',
      prompt: 'This will fail'
    });
  } catch (error: any) {
    console.log('✅ 错误被正确捕获:', error.message);
  }
}

// 主函数
async function runExamples() {
  console.log('🚀 LLM 网关服务使用示例');
  console.log('请确保已配置相应的 API Keys');
  
  await example1_DefaultUsage();
  await example2_OfficialAPI();
  await example3_BatchTest();
  await example4_FullResponse();
  await example5_ErrorHandling();
  
  console.log('\n🎉 示例运行完成!');
}

// 如果直接运行此文件
if (require.main === module) {
  runExamples().catch(console.error);
}

export {
  example1_DefaultUsage,
  example2_OfficialAPI,
  example3_BatchTest,
  example4_FullResponse,
  example5_ErrorHandling,
  runExamples
};
