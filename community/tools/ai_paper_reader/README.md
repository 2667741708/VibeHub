# AI Paper Reader

> 上传一篇英文论文 PDF，选中文字即弹出翻译和术语解释气泡，还能一键生成摘要、与 AI 深度问答，最后导出完整的中文阅读笔记。

---

## 这个工具能帮你做什么？

读英文论文最头疼的就是：查单词打断思路、看不懂术语、读完记不住重点。

**AI Paper Reader** 让你像看中文书一样读英文论文。上传 PDF 后，选中任意一段英文，翻译气泡自动弹出；遇到不懂的术语，一点就给你学术级解释。所有翻译和解释都会自动固定成彩色批注，方便回顾。

更厉害的是，它还能一键生成全文摘要，你可以在侧栏跟 AI 针对论文内容深度问答。最后一键导出，就能得到一份带思维导图的 Markdown 阅读笔记。整个过程全部在本地运行，数据不上传，隐私有保障。

## 创作故事

### 灵感来源

我是一名做深度学习研究的博士生，每天都要读 3-5 篇英文论文。之前一直用浏览器翻译插件，但体验很割裂——翻译结果一闪而过，不能保存，也不能针对某段话追问。我就想：能不能做个工具，让翻译结果直接"粘"在论文上，而且还能跟 AI 对话？

### AI 创作过程

- **使用的 AI 平台**：Google Gemini (通过 Antigravity 编辑器中的 Gemini CLI)
- **关键 Prompt**：
  > "帮我创建一个学术论文阅读器 Web 应用，核心功能是：上传 PDF 后，选中文本弹出翻译气泡，支持术语解释，翻译结果可以固定为持久批注，每个批注内可以继续跟 AI 对话。后端用 Node.js + Express，AI 用 Gemini CLI 调用。"
- **迭代过程**：经历了 3 个大版本迭代——V1 实现了基础的 PDF 渲染和翻译；V2 加入了持久批注、气泡对话、侧栏摘要/问答/历史三大面板和导出功能；V3 升级了 UI 设计（从 Emoji 换成 SVG 图标）、加入了 CLI/API 双引擎切换架构，以及自动高亮和关联跳转功能。

## 技术实现

### 架构概览

这是一个全栈 Web 应用，前端使用 Vite + 原生 JavaScript 模块化架构，后端是 Express.js 服务。核心设计是"双引擎"架构：默认使用本地 Gemini CLI（零配置、免 API Key），也可一键切换到 REST API 模式（更快响应）。PDF 渲染基于 PDF.js，文本提取用 Python PyMuPDF，AI 交互通过自定义 Prompt 工程实现学术翻译、术语解释、论文摘要等专业能力。

### 文件说明

| 文件 | 作用 |
|------|------|
| `src/index.html` | 主页面，包含工具栏、PDF 查看器、侧栏和各种气泡的完整 HTML 结构 |
| `src/main.js` | 应用入口，初始化各模块、绑定工具栏事件和快捷键 |
| `src/pdf-viewer.js` | PDF 渲染引擎，基于 PDF.js，支持文本层、翻页、缩放 |
| `src/bubble-translator.js` | 核心交互模块：选中文本检测、翻译/解释气泡、自动高亮和持久批注 |
| `src/annotation-bubble.js` | 持久化批注系统：气泡渲染、折叠/展开、气泡内上下文对话 |
| `src/sidebar.js` | 侧栏三面板：AI 摘要、全局问答、阅读历史 |
| `src/api.js` | 前端 API 通信层，封装所有后端接口调用 |
| `src/export-manager.js` | 导出管理器：汇总批注和摘要，生成 Markdown 总结文档 |
| `src/markdown-renderer.js` | Markdown 渲染工具，支持 Mermaid 图表、代码高亮、表格 |
| `src/server/index.js` | Express 后端主服务，双引擎路由、PDF 上传解析 |
| `src/server/gemini-cli.js` | Gemini CLI 封装：自动检测路径、模型映射、Prompt 工程 |
| `src/server/gemini-api.js` | Gemini REST API 直连模块：API Key 管理、自动降级 |
| `src/start.sh` | 一键启动脚本：环境检查 + 依赖安装 + 前后端并行启动 |
| `src/vite.config.js` | Vite 构建配置：开发服务器端口和 API 代理设置 |

### 核心逻辑

**1. 选中即翻译（`bubble-translator.js`）**

监听 `mouseup` 事件检测文本选择，弹出工具条。点击"翻译"或"解释"后，调用后端 API 获取结果，然后通过 `highlightRange()` 自动高亮选中文本（支持跨 DOM 节点），同时创建持久化批注气泡。高亮文本和批注之间建立了双向关联——点击高亮可跳转到气泡，点击气泡可定位到高亮。

**2. 双引擎架构（`server/index.js`）**

后端维护一个 `currentEngine` 变量，所有 AI 端点通过 `getEngine()` 动态路由到 CLI 或 API 引擎。CLI 引擎直接 `spawn` 本地 gemini 进程，API 引擎通过 HTTPS 调用 Google REST API。两个引擎暴露完全相同的函数接口（`translate`, `explain`, `summarize`, `qa`, `bubbleQA`, `generateExportDoc`），实现无缝切换。

## 如何使用

### 环境要求

- **Node.js** >= 18
- **Gemini CLI**（推荐，需要 Google Ultra 会员）或 **Gemini API Key**
- **Python 3** + **PyMuPDF**（`pip install PyMuPDF`）

### 运行方式

```bash
# 克隆项目
git clone <仓库地址>
cd ai-paper-reader

# 一键启动
chmod +x start.sh
./start.sh

# 或手动启动
cd server && npm install && node index.js &
cd .. && npm install && npx vite
```

然后在浏览器打开 `http://localhost:5173`，上传一篇 PDF 论文即可开始使用。

### 快速体验

> 如果你不想手动操作，直接把下面的内容复制给任意 AI 助手，它就会帮你运行：
>
> "帮我在本地搭建 AI Paper Reader 论文阅读器。它需要 Node.js >= 18 和 Gemini CLI。项目地址在 VibeHub 社区的 ai_paper_reader 工具里，帮我拉取代码、安装依赖、启动服务。"

---

*发布于 VibeHub 社区 · 2026-03-14*
