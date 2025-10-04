// tests/test-pattern-analyzer.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试单个 Pattern 分析
async function testAnalyzePattern(patternId) {
  console.log(`\n========== 测试 Pattern ID: ${patternId} ==========`);
  
  try {
    const response = await axios.post(`${BASE_URL}/site-builder/analyze-pattern`, {
      id: patternId
    });
    
    console.log('✅ 请求成功');
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    console.log('\n布局描述:');
    console.log(response.data.data.layoutDescription);
    console.log(`\n耗时: ${response.data.duration}ms`);
    
    return response.data;
  } catch (error) {
    console.error('❌ 请求失败');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误:', error.message);
    }
    throw error;
  }
}

// 主函数
async function main() {
  console.log('Pattern Analyzer API 测试');
  console.log('========================\n');
  
  // 从命令行参数获取 Pattern ID，默认使用 19198
  const patternId = process.argv[2] ? parseInt(process.argv[2]) : 19198;
  
  try {
    await testAnalyzePattern(patternId);
    console.log('\n✅ 所有测试通过!');
  } catch (error) {
    console.error('\n❌ 测试失败');
    process.exit(1);
  }
}

// 运行测试
main();

