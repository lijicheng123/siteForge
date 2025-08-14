# 调试指南

这个项目提供了多种调试方式，帮助你快速定位和解决问题。

## 方法 1: VS Code 调试器（推荐）

### 设置断点
1. 在代码中点击行号左侧设置断点
2. 按 `F5` 或点击调试按钮启动调试
3. 选择 "Debug App" 配置

### 调试配置说明
- **Debug App**: 调试主应用程序
- **Debug Tests**: 调试所有测试
- **Debug Current Test**: 调试当前打开的测试文件
- **Attach to Process**: 附加到正在运行的进程

## 方法 2: 命令行调试

### 调试应用程序
```bash
npm run debug
```
这会在端口 9229 启动调试模式，然后：
1. 在浏览器中打开 `chrome://inspect`
2. 点击 "Open dedicated DevTools for Node"
3. 或者使用 VS Code 的 "Attach to Process" 配置

### 调试测试
```bash
npm run debug:test
```

## 方法 3: 日志调试

项目使用 Fastify 的内置日志系统：

```typescript
// 在代码中添加日志
app.log.info('调试信息');
app.log.error('错误信息');
app.log.debug('详细调试信息');
```

## 方法 4: 环境变量调试

创建 `.env` 文件并设置：
```bash
NODE_ENV=development
DEBUG=*
LOG_LEVEL=debug
```

## 调试技巧

### 1. 设置断点
- 在关键代码行设置断点
- 使用条件断点（右键断点 → Edit Breakpoint）
- 使用日志断点（右键断点 → Add Logpoint）

### 2. 查看变量
- 在调试面板查看变量值
- 使用 Watch 表达式监控特定值
- 在 Debug Console 中执行表达式

### 3. 单步调试
- F10: 单步跳过
- F11: 单步进入
- Shift+F11: 单步跳出
- F5: 继续执行

### 4. 调试特定功能
- 使用 `console.log()` 快速输出
- 在浏览器开发者工具中查看网络请求
- 使用 Postman 或类似工具测试 API 端点

## 常见问题

### TypeScript 源码映射问题
如果断点不准确，检查 `tsconfig.json` 中的 `sourceMap` 设置。

### 端口冲突
如果 9229 端口被占用，修改 `package.json` 中的端口号。

### 环境变量
确保 `.env` 文件存在并包含必要的配置。

## 性能调试

使用 Node.js 内置的性能分析：
```bash
node --prof src/app.ts
node --prof-process isolate-*.log > processed.txt
```

## 内存调试

```bash
node --inspect --expose-gc src/app.ts
```

在 Chrome DevTools 中查看内存使用情况。
