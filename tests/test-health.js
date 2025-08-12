/**
 * 健康检查测试脚本
 * 基于 llm-provider 服务
 */

const BASE_URL = 'http://localhost:3000';

async function testHealthCheck() {
  console.log('🧪 测试健康检查接口...\n');

  try {
    // 测试快速状态检查
    console.log('1️⃣ 快速状态检查:');
    const statusResponse = await fetch(`${BASE_URL}/api/health/status`);
    const statusData = await statusResponse.json();
    console.log('   结果:', JSON.stringify(statusData, null, 2));
    console.log('');

    // 测试详细健康检查
    console.log('2️⃣ 详细健康检查:');
    const healthResponse = await fetch(`${BASE_URL}/api/health/models`);
    const healthData = await healthResponse.json();
    console.log('   整体状态:', healthData.overallStatus);
    console.log('   可用模型:', Object.values(healthData.models).filter(m => m.status === 'available').length + '/3');
    
    if (healthData.recommendations?.length > 0) {
      console.log('   建议:', healthData.recommendations[0]);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('💡 请确保服务器正在运行: npm run dev');
  }
}

testHealthCheck();
