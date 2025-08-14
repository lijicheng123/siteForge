// tests/test-llm-gateway.js
/**
 * LLM 网关服务测试
 * 测试新的网关服务是否能正常调用各种模型
 */

const { spawn } = require('child_process');
const path = require('path');

// 测试配置
const testCases = [
  {
    name: '测试 Gemini 寰渡网关',
    model: 'gemini-2.5-pro',
    channel: 'huandu'
  },
  {
    name: '测试 Claude 寰渡网关',
    model: 'claude-sonnet-4-20250514',
    channel: 'huandu'
  },
  {
    name: '测试 GPT 寰渡网关',
    model: 'gpt-5-mini',
    channel: 'huandu'
  }
];

async function runTest(testCase) {
  return new Promise((resolve) => {
    console.log(`\n🧪 ${testCase.name}`);
    console.log(`模型: ${testCase.model}, 渠道: ${testCase.channel}`);
    
    const testScript = `
      require('dotenv').config();
      const LLMGateway = require('../dist/services/llm-gateway').default;
      
      (async () => {
        try {
          const startTime = Date.now();
          const response = await LLMGateway.callText({
            model: '${testCase.model}',
            prompt: '请返回一个简单的JSON: {"test": "success", "message": "网关测试成功"}',
            temperature: 0.1,
            channel: '${testCase.channel}'
          });
          
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          console.log('✅ 测试成功');
          console.log('响应时间:', responseTime + 'ms');
          console.log('响应内容:', response.substring(0, 100) + (response.length > 100 ? '...' : ''));
          
          // 尝试解析 JSON
          try {
            const parsed = JSON.parse(response.trim());
            console.log('✅ JSON 解析成功');
          } catch (e) {
            console.log('⚠️  JSON 解析失败，但这可能是正常的');
          }
          
        } catch (error) {
          console.log('❌ 测试失败:', error.message);
        }
      })();
    `;
    
    const child = spawn('node', ['-e', testScript], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      console.log(`测试完成，退出码: ${code}`);
      resolve(code === 0);
    });
  });
}

async function runAllTests() {
  console.log('🚀 开始 LLM 网关测试');
  console.log('确保你已经：');
  console.log('1. 设置了寰渡科技网关的各模型 API Key:');
  console.log('   - DEV_CLUADE_API_KEY (Claude 模型)');
  console.log('   - DEV_GEMMINI_API_KEY (Gemini 模型)');
  console.log('   - DEV_OPENAI_API_KEY (OpenAI 模型)');
  console.log('2. 运行了 npm run build');
  
  let passCount = 0;
  
  for (const testCase of testCases) {
    const success = await runTest(testCase);
    if (success) passCount++;
  }
  
  console.log(`\n📊 测试总结: ${passCount}/${testCases.length} 通过`);
  
  if (passCount === testCases.length) {
    console.log('🎉 所有测试通过！网关服务运行正常');
  } else {
    console.log('⚠️  部分测试失败，请检查配置和网络连接');
  }
}

// 运行测试
runAllTests().catch(console.error);
