# ⚡ VibeHub — 人人皆可编程的工具社区

> 用自然语言创造工具，用一篇图纸改变世界。

## 这是什么？

VibeHub 是一个让**普通人**也能用 AI 编写、分享、Fork 数字工具的开源社区。

核心理念极简到极致：**一个工具 = 一篇纯文本图纸（`.vibe.md`）**。

图纸里包含你用自然语言写的"创造者的话"（意图）+ 完整的可运行源码。
任何人拿到这篇图纸，直接丢给自己的 AI 就能跑、就能改。

## 快速开始

### 创建你的第一个工具图纸

```bash
python engine/vibe_export.py "我写了一个番茄钟" app.py
```

就这一行。它会生成一篇 `.vibe.md` 纯文本文件。

### 启动社区网站

```bash
cd community
python -m http.server 8080
# 打开浏览器访问 http://localhost:8080
```

## 项目结构

```
VibeHub/
├── engine/                     # 极简导出引擎（约60行 Python）
│   └── vibe_export.py
├── community/                  # 社区网站前端
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── tools/                  # 示范工具图纸
│       ├── pomodoro.vibe.md    # 🍅 番茄钟
│       ├── photo_renamer.vibe.md  # 📸 照片整理器
│       └── wifi_speed.vibe.md  # 📶 WiFi 测速
└── README.md
```

## .vibe.md 格式说明

```markdown
# 🛠️ 工具名称

> **创造者的话（Vibe）**：
> "用一句话说出你要解决什么问题"

---

## 📦 给你的 AI 助手看的说明
> [AI-Guidance: ...]
> - 环境要求: ...

## 💻 `main.py`
\```python
# 你的完整源码
\```

---
*由 VibeHub 社区分享*
```

## 愿景

让这个社区成长为一个可以解决所有人生活中遇到的小问题的工具库。
不需要任何编程知识，一眼就会，复制粘贴就能用。

© 2026 VibeHub · 开源 · 人人皆可编程
