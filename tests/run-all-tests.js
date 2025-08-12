/**
 * 主测试运行器
 * 运行所有接口的测试脚本
 */

const { testHealthCheckEndpoints } = require('./test-health-check');
const { testWorkflowStep1 } = require('./test-workflow-step1');
const { testWorkflowStep2 } = require('./test-workflow-step2');
const { testWorkflowStep3 } = require('./test-workflow-step3');
const { testWorkflowStep4 } = require('./test-workflow-step4');
const { testWorkflowStep5 } = require('./test-workflow-step5');
const { testWorkflowStep6 } = require('./test-workflow-step6');
const { testCompleteWorkflow } = require('./test-complete-workflow');
const { colorize } = require('./test-utils');

async function runAllTests() {
  console.log(colorize('bright', '🚀 开始运行所有接口测试...'));
  console.log(colorize('blue', '   测试范围: 健康检查、工作流步骤1-6、完整工作流'));
  console.log('');
  console.log('='.repeat(80));
  
  const startTime = Date.now();
  const allResults = [];
  
  try {
    // 1. 健康检查接口测试
    console.log(colorize('cyan', '\n🏥 健康检查接口测试'));
    console.log('-'.repeat(50));
    const healthResults = await testHealthCheckEndpoints();
    if (healthResults) allResults.push({ name: '健康检查', results: healthResults });
    
    // 2. 工作流步骤1测试
    console.log(colorize('cyan', '\n🔍 工作流步骤1测试'));
    console.log('-'.repeat(50));
    const step1Results = await testWorkflowStep1();
    if (step1Results) allResults.push({ name: '工作流步骤1', results: step1Results });
    
    // 3. 工作流步骤2测试
    console.log(colorize('cyan', '\n🎨 工作流步骤2测试'));
    console.log('-'.repeat(50));
    const step2Results = await testWorkflowStep2();
    if (step2Results) allResults.push({ name: '工作流步骤2', results: step2Results });
    
    // 4. 工作流步骤3测试
    console.log(colorize('cyan', '\n🏗️ 工作流步骤3测试'));
    console.log('-'.repeat(50));
    const step3Results = await testWorkflowStep3();
    if (step3Results) allResults.push({ name: '工作流步骤3', results: step3Results });
    
    // 5. 工作流步骤4测试
    console.log(colorize('cyan', '\n📝 工作流步骤4测试'));
    console.log('-'.repeat(50));
    const step4Results = await testWorkflowStep4();
    if (step4Results) allResults.push({ name: '工作流步骤4', results: step4Results });
    
    // 6. 工作流步骤5测试
    console.log(colorize('cyan', '\n🎯 工作流步骤5测试'));
    console.log('-'.repeat(50));
    const step5Results = await testWorkflowStep5();
    if (step5Results) allResults.push({ name: '工作流步骤5', results: step5Results });
    
    // 7. 工作流步骤6测试
    console.log(colorize('cyan', '\n⚡ 工作流步骤6测试'));
    console.log('-'.repeat(50));
    const step6Results = await testWorkflowStep6();
    if (step6Results) allResults.push({ name: '工作流步骤6', results: step6Results });
    
    // 8. 完整工作流测试
    console.log(colorize('cyan', '\n🔄 完整工作流测试'));
    console.log('-'.repeat(50));
    const completeResults = await testCompleteWorkflow();
    if (completeResults) allResults.push({ name: '完整工作流', results: completeResults });
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    // 打印总体测试结果汇总
    printOverallSummary(allResults, totalTime);
    
  } catch (error) {
    console.error(colorize('red', '\n💥 测试运行过程中发生错误:'), error);
    process.exit(1);
  }
}

function printOverallSummary(allResults, totalTime) {
  console.log('\n' + '='.repeat(80));
  console.log(colorize('bright', '🎉 所有测试完成！总体结果汇总'));
  console.log('='.repeat(80));
  
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  
  // 统计每个测试模块的结果
  allResults.forEach(({ name, results }) => {
    if (results && typeof results === 'object') {
      const moduleTotal = results.total || 0;
      const modulePassed = results.passed || 0;
      const moduleFailed = results.failed || 0;
      
      totalTests += moduleTotal;
      totalPassed += modulePassed;
      totalFailed += moduleFailed;
      
      const successRate = moduleTotal > 0 ? ((modulePassed / moduleTotal) * 100).toFixed(1) : '0.0';
      const statusIcon = moduleFailed === 0 ? '✅' : '⚠️';
      
      console.log(`${statusIcon} ${colorize('cyan', name.padEnd(15))}: ${colorize('yellow', moduleTotal)} 测试, ${colorize('green', modulePassed)} 通过, ${colorize('red', moduleFailed)} 失败 (${colorize('yellow', successRate)}%)`);
    }
  });
  
  console.log('-'.repeat(80));
  
  // 总体统计
  const overallSuccessRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
  const overallStatus = totalFailed === 0 ? '🎉' : '⚠️';
  
  console.log(`${overallStatus} ${colorize('bright', '总体结果')}: ${colorize('yellow', totalTests)} 测试, ${colorize('green', totalPassed)} 通过, ${colorize('red', totalFailed)} 失败`);
  console.log(`   成功率: ${colorize('yellow', overallSuccessRate)}%`);
  console.log(`   总耗时: ${colorize('yellow', totalTime.toFixed(2))}秒`);
  
  // 如果有失败的测试，显示详细信息
  if (totalFailed > 0) {
    console.log('\n' + colorize('red', '❌ 失败测试详情:'));
    allResults.forEach(({ name, results }) => {
      if (results && results.failed > 0) {
        console.log(`\n   ${colorize('red', name)}:`);
        const detailedResults = results.getDetailedResults ? results.getDetailedResults() : [];
        detailedResults.forEach((result, index) => {
          if (!result.success) {
            console.log(`     测试 ${index + 1}: ${result.error}`);
            if (result.details) {
              console.log(`       详情: ${result.details}`);
            }
          }
        });
      }
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  // 根据测试结果设置退出码
  if (totalFailed > 0) {
    console.log(colorize('red', '⚠️  部分测试失败，请检查上述错误信息'));
    process.exit(1);
  } else {
    console.log(colorize('green', '🎉 所有测试通过！系统运行正常'));
    process.exit(0);
  }
}

// 运行所有测试
if (require.main === module) {
  runAllTests().catch(error => {
    console.error(colorize('red', '💥 测试运行器执行失败:'), error);
    process.exit(1);
  });
}

module.exports = { runAllTests };
