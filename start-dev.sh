#!/bin/bash

# 开发环境启动脚本
echo "🚀 启动 SiteForge AI 开发服务器..."

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "❌ 错误: 未找到 .env 文件"
    echo "请按照 ENVIRONMENT-SETUP.md 的说明创建并配置 .env 文件"
    echo ""
    echo "快速创建 .env 文件:"
    echo "cp .env.example .env  # 如果存在 .env.example"
    echo "或者手动创建 .env 文件并添加必要的环境变量"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi

echo "✅ 构建成功"

# 启动开发服务器
echo "🌐 启动开发服务器..."
echo "服务器将在 http://localhost:3000 启动"
echo "健康检查: http://localhost:3000/health"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm run dev
