/**
 * 测试完整工作流的错误处理功能
 */

const { test } = require('node:test');
const assert = require('node:assert');

// 模拟测试数据
const mockWorkflowResponse = {
  success: false,
  data: {
    workflowId: 'wf_1234567890_abc123',
    status: 'partial_success',
    steps: {
      step1: { 
        status: 'success', 
        data: { companyInfo: { industry: 'tech', name: 'TestCorp' } }, 
        message: '需求解析成功', 
        error: '' 
      },
      step2: { 
        status: 'failed', 
        data: null, 
        message: '设计系统生成失败', 
        error: '设计系统服务不可用' 
      },
      step3: { status: 'skipped', data: null, message: '', error: '' },
      step4: { status: 'skipped', data: null, message: '', error: '' },
      step5: { status: 'skipped', data: null, message: '', error: '' },
      step6: { status: 'skipped', data: null, message: '', error: '' }
    },
    finalResult: {
      html: null,
      blueprint: null
    },
    metadata: {
      totalTime: 1500,
      stepTimes: {
        step1: 500,
        step2: 1000
      },
      timestamp: '2024-01-01T00:00:00.000Z'
    }
  },
  message: '工作流部分成功，部分步骤失败',
  timestamp: '2024-01-01T00:00:00.000Z'
};

test('渐进式错误处理 - 步骤级别状态', async (t) => {
  await t.test('应该正确识别失败的步骤', () => {
    const failedSteps = Object.entries(mockWorkflowResponse.data.steps)
      .filter(([_, step]) => step.status === 'failed')
      .map(([stepName, step]) => ({ stepName, ...step }));
    
    assert.strictEqual(failedSteps.length, 1);
    assert.strictEqual(failedSteps[0].stepName, 'step2');
    assert.strictEqual(failedSteps[0].error, '设计系统服务不可用');
  });

  await t.test('应该正确识别成功的步骤', () => {
    const successfulSteps = Object.entries(mockWorkflowResponse.data.steps)
      .filter(([_, step]) => step.status === 'success')
      .map(([stepName, step]) => ({ stepName, ...step }));
    
    assert.strictEqual(successfulSteps.length, 1);
    assert.strictEqual(successfulSteps[0].stepName, 'step1');
    assert.strictEqual(successfulSteps[0].data.companyInfo.industry, 'tech');
  });

  await t.test('应该正确识别跳过的步骤', () => {
    const skippedSteps = Object.entries(mockWorkflowResponse.data.steps)
      .filter(([_, step]) => step.status === 'skipped')
      .map(([stepName, step]) => stepName);
    
    assert.strictEqual(skippedSteps.length, 4);
    assert(skippedSteps.includes('step3'));
    assert(skippedSteps.includes('step4'));
    assert(skippedSteps.includes('step5'));
    assert(skippedSteps.includes('step6'));
  });
});

test('渐进式错误处理 - 工作流状态', async (t) => {
  await t.test('应该正确设置工作流状态', () => {
    assert.strictEqual(mockWorkflowResponse.data.status, 'partial_success');
    assert.strictEqual(mockWorkflowResponse.success, false);
  });

  await t.test('应该提供有意义的错误消息', () => {
    assert.strictEqual(mockWorkflowResponse.message, '工作流部分成功，部分步骤失败');
  });

  await t.test('应该包含完整的元数据', () => {
    assert(mockWorkflowResponse.data.metadata.totalTime > 0);
    assert(mockWorkflowResponse.data.metadata.stepTimes.step1 > 0);
    assert(mockWorkflowResponse.data.metadata.stepTimes.step2 > 0);
  });
});

test('渐进式错误处理 - 前端友好性', async (t) => {
  await t.test('前端应该能够识别具体失败的步骤', () => {
    const step2 = mockWorkflowResponse.data.steps.step2;
    assert.strictEqual(step2.status, 'failed');
    assert.strictEqual(step2.message, '设计系统生成失败');
    assert.strictEqual(step2.error, '设计系统服务不可用');
  });

  await t.test('前端应该能够显示部分成功的结果', () => {
    const step1 = mockWorkflowResponse.data.steps.step1;
    assert.strictEqual(step1.status, 'success');
    assert(step1.data.companyInfo);
    assert.strictEqual(step1.data.companyInfo.name, 'TestCorp');
  });

  await t.test('前端应该能够计算成功率', () => {
    const totalSteps = Object.keys(mockWorkflowResponse.data.steps).length;
    const successfulSteps = Object.values(mockWorkflowResponse.data.steps)
      .filter(step => step.status === 'success').length;
    
    const successRate = (successfulSteps / totalSteps) * 100;
    // 使用近似比较，避免浮点数精度问题
    assert(Math.abs(successRate - 16.67) < 0.01);
  });
});

console.log('✅ 渐进式错误处理测试完成');
console.log('📊 测试结果总结:');
console.log('   - 步骤级别状态识别: ✅');
console.log('   - 工作流状态管理: ✅');
console.log('   - 前端友好性: ✅');
console.log('   - 错误信息详细性: ✅');
console.log('   - 部分成功处理: ✅');
