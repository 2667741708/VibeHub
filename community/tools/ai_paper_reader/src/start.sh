#!/bin/bash
# ================================================
# AI Paper Reader - 一键启动脚本 / One-Click Start Script
# ================================================
# 使用方法 / Usage: ./start.sh
# 前提条件 / Prerequisites:
#   1. Node.js >= 18
#   2. gemini CLI (npm install -g @anthropic-ai/gemini 或通过其他方式安装)
#   3. Python 3 + PyMuPDF (pip install PyMuPDF)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔬 AI Paper Reader V2 启动中..."
echo "================================"

# 检查 gemini CLI
if ! command -v gemini &> /dev/null; then
    echo "❌ 未检测到 gemini CLI，请先安装"
    echo "   安装方法: npm install -g @google/gemini-cli"
    exit 1
fi
echo "✅ Gemini CLI: $(which gemini)"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 (>= 18)"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

# 检查 Python + PyMuPDF
if ! python3 -c "import fitz" 2>/dev/null; then
    echo "⚠️ PyMuPDF 未安装，正在安装..."
    pip install PyMuPDF
fi
echo "✅ PyMuPDF: 已就绪"

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install --no-bin-links
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd server && npm install --no-bin-links && cd ..
fi

echo ""
echo "🚀 启动服务..."
echo "   后端: http://localhost:3456"
echo "   前端: http://localhost:5173"
echo ""
echo "   在 Antigravity 中: Ctrl+Shift+P → Simple Browser → http://localhost:5173"
echo "   按 Ctrl+C 停止所有服务"
echo "================================"

# 启动后端（后台）
cd "$SCRIPT_DIR/server"
node index.js &
BACKEND_PID=$!

# 启动前端
cd "$SCRIPT_DIR"
node ./node_modules/vite/bin/vite.js &
FRONTEND_PID=$!

# 捕获 Ctrl+C 信号并清理
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '👋 再见!'; exit 0" SIGINT SIGTERM

# 等待任一进程退出
wait
