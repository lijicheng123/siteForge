# 渐进式错误处理功能说明

## 概述

完整工作流接口现在支持渐进式错误处理，让前端能够准确知道工作流在哪一步出错，以及具体的错误原因。

## 主要特性

### 1. 步骤级别状态跟踪
每个步骤都有独立的状态：
- `success`: 步骤执行成功
- `failed`: 步骤执行失败
- `skipped`: 步骤被跳过（前置步骤失败时）
- `pending`: 步骤等待执行

### 2. 详细错误信息
每个失败的步骤都包含：
- `status`: 状态标识
- `message`: 用户友好的错误描述
- `error`: 具体的错误原因
- `data`: 步骤数据（失败时为null）

### 3. 工作流状态分类
- `completed`: 所有步骤都成功
- `partial_success`: 部分步骤成功，部分失败
- `failed`: 工作流完全失败

## 响应结构

```json
{
  "success": false,
  "data": {
    "workflowId": "wf_1234567890_abc123",
    "status": "partial_success",
    "steps": {
      "step1": {
        "status": "success",
        "data": { /* 步骤1的数据 */ },
        "message": "需求解析成功",
        "error": ""
      },
      "step2": {
        "status": "failed",
        "data": null,
        "message": "设计系统生成失败",
        "error": "设计系统服务不可用"
      },
      "step3": {
        "status": "skipped",
        "data": null,
        "message": "",
        "error": ""
      }
      // ... 其他步骤
    },
    "finalResult": {
      "html": null,
      "blueprint": null
    },
    "metadata": {
      "totalTime": 1500,
      "stepTimes": {
        "step1": 500,
        "step2": 1000
      },
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "工作流部分成功，部分步骤失败",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 前端使用示例

### 1. 检查工作流状态
```javascript
if (response.data.status === 'completed') {
  console.log('工作流完全成功');
} else if (response.data.status === 'partial_success') {
  console.log('工作流部分成功');
} else {
  console.log('工作流完全失败');
}
```

### 2. 识别失败的步骤
```javascript
const failedSteps = Object.entries(response.data.steps)
  .filter(([_, step]) => step.status === 'failed')
  .map(([stepName, step]) => ({
    step: stepName,
    error: step.error,
    message: step.message
  }));

failedSteps.forEach(({ step, error, message }) => {
  console.log(`步骤 ${step} 失败: ${message} - ${error}`);
});
```

### 3. 显示部分成功的结果
```javascript
const successfulSteps = Object.entries(response.data.steps)
  .filter(([_, step]) => step.status === 'success');

successfulSteps.forEach(([stepName, step]) => {
  console.log(`步骤 ${stepName} 成功:`, step.data);
});
```

### 4. 计算成功率
```javascript
const totalSteps = Object.keys(response.data.steps).length;
const successfulSteps = Object.values(response.data.steps)
  .filter(step => step.status === 'success').length;

const successRate = (successfulSteps / totalSteps) * 100;
console.log(`成功率: ${successRate.toFixed(1)}%`);
```

### 5. 显示进度条
```javascript
const progressSteps = Object.values(response.data.steps)
  .map(step => step.status === 'success' ? 1 : 0);

const progress = progressSteps.reduce((sum, val) => sum + val, 0);
const total = progressSteps.length;

console.log(`进度: ${progress}/${total}`);
```

## 错误处理策略

### 1. 渐进式执行
- 每个步骤执行前检查前置步骤的数据
- 如果前置步骤失败，后续步骤被标记为skipped
- 返回已完成的步骤结果和失败步骤的详细信息

### 2. 数据验证
- 每个步骤执行后立即验证返回数据
- 验证失败时抛出具体错误信息
- 错误信息包含具体的验证失败原因

### 3. 类型安全
- 使用TypeScript类型检查确保数据安全
- 在访问步骤数据前进行null检查
- 提供清晰的错误类型定义

## 优势

1. **精确错误定位**: 前端可以准确知道哪一步出错
2. **部分结果利用**: 即使部分失败，也能利用已成功的结果
3. **用户体验提升**: 提供详细的进度和错误信息
4. **调试友好**: 详细的错误信息便于问题排查
5. **类型安全**: TypeScript支持确保代码质量

## 注意事项

1. 前置步骤失败时，后续步骤无法继续执行
2. 每个步骤都有独立的错误处理逻辑
3. 响应结构保持向后兼容
4. 错误信息应该对用户友好，便于理解

## 测试

运行测试文件验证功能：
```bash
node tests/test-complete-workflow-error-handling.js
```

## 总结

渐进式错误处理让工作流更加健壮和用户友好。前端可以根据返回的详细状态信息，提供更好的用户体验和错误处理。
