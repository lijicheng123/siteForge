# 健康检查接口

直接使用现有 `llm-provider` 服务，检测三大语言模型可用性。

## 接口

- `GET /api/health/status` - 快速状态检查
- `GET /api/health/models` - 详细健康检查

## 使用

```bash
# 启动服务
npm run dev

# 测试
node test-health.js

# 手动测试
curl http://localhost:3000/api/health/models
```

## 状态说明

- **healthy**: 所有模型可用
- **degraded**: 部分模型可用  
- **unhealthy**: 无可用模型
