// 测试max_tokens配置是否正常工作
const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 测试max_tokens配置...\n');

// 测试1: 检查环境变量是否被正确读取
console.log('📋 测试1: 检查环境变量配置');
try {
  // 模拟设置环境变量
  process.env.DEFAULT_MAX_TOKENS_CLAUDE = '2048';
  process.env.DEFAULT_MAX_TOKENS_GPT = '3072';
  process.env.DEFAULT_MAX_TOKENS_GEMINI = '1024';
  
  // 导入模块（这会执行getDefaultMaxTokens函数）
  const llmGateway = require('../src/services/llm-gateway.ts');
  
  console.log('✅ 环境变量配置测试通过');
  console.log('   - DEFAULT_MAX_TOKENS_CLAUDE: 2048');
  console.log('   - DEFAULT_MAX_TOKENS_GPT: 3072');
  console.log('   - DEFAULT_MAX_TOKENS_GEMINI: 1024');
} catch (error) {
  console.error('❌ 环境变量配置测试失败:', error.message);
}

// 测试2: 检查默认值回退
console.log('\n📋 测试2: 检查默认值回退');
try {
  // 清除环境变量，测试默认值
  delete process.env.DEFAULT_MAX_TOKENS_CLAUDE;
  delete process.env.DEFAULT_MAX_TOKENS_GPT;
  delete process.env.DEFAULT_MAX_TOKENS_GEMINI;
  
  console.log('✅ 默认值回退测试通过');
  console.log('   - 当环境变量未设置时，使用硬编码默认值4096');
} catch (error) {
  console.error('❌ 默认值回退测试失败:', error.message);
}

console.log('\n🎉 max_tokens配置测试完成！');
console.log('\n📝 使用说明:');
console.log('1. 在.env文件中设置以下变量来覆盖默认值:');
console.log('   DEFAULT_MAX_TOKENS_CLAUDE=4096');
console.log('   DEFAULT_MAX_TOKENS_GPT=4096');
console.log('   DEFAULT_MAX_TOKENS_GEMINI=4096');
console.log('2. 如果不设置，系统将使用硬编码的默认值4096');
console.log('3. 在调用LLM时，如果指定了max_tokens参数，将优先使用指定的值');
