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

async function runAllTests() {
  console.log('🚀 开始运行所有接口测试...\n');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  try {
    // 1. 健康检查接口测试
    console.log('\n🏥 健康检查接口测试');
    console.log('-'.repeat(40));
    await testHealthCheckEndpoints();
    
    // 2. 工作流步骤1测试
    console.log('\n🔍 工作流步骤1测试');
    console.log('-'.repeat(40));
    await testWorkflowStep1();
    
    // 3. 工作流步骤2测试
    console.log('\n🎨 工作流步骤2测试');
    console.log('-'.repeat(40));
    await testWorkflowStep2();
    
    // 4. 工作流步骤3测试
    console.log('\n🏗️ 工作流步骤3测试');
    console.log('-'.repeat(40));
    await testWorkflowStep3();
    
    // 5. 工作流步骤4测试
    console.log('\n📝 工作流步骤4测试');
    console.log('-'.repeat(40));
    await testWorkflowStep4();
    
    // 6. 工作流步骤5测试
    console.log('\n🎯 工作流步骤5测试');
    console.log('-'.repeat(40));
    await testWorkflowStep5();
    
      // 7. 工作流步骤6测试
  console.log('\n⚡ 工作流步骤6测试');
  console.log('-'.repeat(40));
  await testWorkflowStep6();
  
  // 8. 完整工作流测试
  console.log('\n🔄 完整工作流测试');
  console.log('-'.repeat(40));
  await testCompleteWorkflow();
  
  const endTime = Date.now();
  const totalTime = (endTime - startTime) / 1000;
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎉 所有测试完成！总耗时: ${totalTime.toFixed(2)}秒`);
  console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 测试运行过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行所有测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
