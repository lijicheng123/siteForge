// scripts/quick-test.js
// 快速测试脚本 - 分析几个示例 Pattern

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试的 Pattern IDs（从您的 source-patterns.json 中选取）
const TEST_PATTERN_IDS = [
  19198, // Location/Map/Hour 22
  19114, // Hero 65
  1004,  // 其他 pattern
];

async function analyzePattern(patternId) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`正在分析 Pattern ID: ${patternId}`);
  console.log('='.repeat(60));
  
  try {
    const startTime = Date.now();
    const response = await axios.post(`${BASE_URL}/site-builder/analyze-pattern`, {
      id: patternId
    }, {
      timeout: 60000
    });
    
    const duration = Date.now() - startTime;
    
    console.log('✅ 分析成功!');
    console.log(`⏱️  耗时: ${duration}ms`);
    console.log('\n📄 布局描述:');
    console.log('-'.repeat(60));
    console.log(response.data.data.layoutDescription);
    console.log('-'.repeat(60));
    
    return { success: true, id: patternId, duration };
  } catch (error) {
    console.error('❌ 分析失败');
    if (error.response) {
      console.error('错误:', error.response.data.message);
    } else {
      console.error('错误:', error.message);
    }
    return { success: false, id: patternId, error: error.message };
  }
}

async function main() {
  console.log('\n🚀 Pattern Analyzer - 快速测试');
  console.log('================================\n');
  console.log(`将分析 ${TEST_PATTERN_IDS.length} 个 Patterns\n`);
  
  const results = [];
  
  for (const id of TEST_PATTERN_IDS) {
    const result = await analyzePattern(id);
    results.push(result);
    
    // 每个请求之间等待 2 秒
    if (TEST_PATTERN_IDS.indexOf(id) < TEST_PATTERN_IDS.length - 1) {
      console.log('\n⏳ 等待 2 秒...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // 打印汇总
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试汇总');
  console.log('='.repeat(60));
  const successCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failedCount}`);
  
  if (successCount > 0) {
    const avgDuration = Math.round(
      results.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / successCount
    );
    console.log(`⏱️  平均耗时: ${avgDuration}ms`);
  }
  
  console.log('\n✨ 测试完成!\n');
}

main().catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});

