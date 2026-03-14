/* ============================================
   VibeHub — 社区平台交互逻辑
   ============================================ */

// === 示范工具数据 ===
const TOOLS = [
    {
        id: 'pomodoro',
        emoji: '🍅',
        name: '番茄工作法锁屏助手',
        tag: '生活效率',
        category: 'life',
        vibe: '我总是控制不住自己玩手机，每工作25分钟就弹出全屏提醒休息5分钟，屏幕上用巨大的红色字显示倒计时和一句鼓励的话。',
        forksDirect: 12,
        forksIndirect: 34,
        date: '2026-03-13',
        file: 'tools/pomodoro.vibe.md'
    },
    {
        id: 'photo_renamer',
        emoji: '📸',
        name: '照片批量整理器',
        tag: '生活效率',
        category: 'life',
        vibe: '手机里几千张照片导到电脑上文件名全是乱码，我想按年月自动分到不同文件夹并重命名成人能看懂的名字。',
        forksDirect: 28,
        forksIndirect: 67,
        date: '2026-03-12',
        file: 'tools/photo_renamer.vibe.md'
    },
    {
        id: 'wifi_speed',
        emoji: '📶',
        name: 'WiFi 测速小助手',
        tag: '生活效率',
        category: 'life',
        vibe: '每次感觉网速很慢但不知道是不是错觉。打开就能测当前网速，用大字告诉我网速正常还是确实很慢。',
        forksDirect: 45,
        forksIndirect: 112,
        date: '2026-03-10',
        file: 'tools/wifi_speed.vibe.md'
    },
    {
        id: 'svc_spider',
        emoji: '🕷️',
        name: 'SVC Spider 多服务器织网插件',
        tag: '开发辅助',
        category: 'dev',
        vibe: '我每天要在3-4台GPU服务器之间来回切换做实验，想要一个像蜘蛛结网一样的VS Code插件，把所有服务器同时挂载到同一个工作区。',
        forksDirect: 7,
        forksIndirect: 18,
        date: '2026-03-14',
        file: 'tools/svc_spider.vibe.md'
    },
    {
        id: 'git_commit',
        emoji: '📝',
        name: 'Git 提交消息生成器',
        tag: '开发辅助',
        category: 'dev',
        vibe: '我每次 git commit 都不知道写什么好，想要一个工具自动分析我改了什么文件然后生成规范的 commit message。',
        forksDirect: 19,
        forksIndirect: 41,
        date: '2026-03-11',
        vibeContent: `# 📝 Git 提交消息生成器

> **创造者的话（Vibe）**：
> "我每次 git commit 都不知道写什么好，想要一个工具自动分析我改了什么文件然后生成规范的 commit message。"

---

## 📦 给你的 AI 助手看的说明
> [AI-Guidance: 请读取下方所有代码块，在本地建立环境并运行。]
> - **环境要求**: Python 3.8+, 需在 git 仓库内运行

## 💻 \`git_msg.py\`
\`\`\`python
import subprocess, sys

def get_diff():
    r = subprocess.run(['git', 'diff', '--staged', '--stat'], capture_output=True, text=True)
    return r.stdout

def generate_msg(diff):
    files = [l.split('|')[0].strip() for l in diff.strip().split('\\n') if '|' in l]
    if not files:
        print("⚠️ 没有暂存的更改。先 git add 再运行。")
        sys.exit(1)
    types = {'py': 'refactor', 'js': 'feat', 'css': 'style', 'md': 'docs'}
    ext = files[0].split('.')[-1] if '.' in files[0] else ''
    prefix = types.get(ext, 'chore')
    scope = files[0].split('/')[0] if '/' in files[0] else ''
    msg = f"{prefix}({scope}): update {', '.join(f.split('/')[-1] for f in files[:3])}"
    if len(files) > 3:
        msg += f" and {len(files)-3} more"
    return msg

if __name__ == "__main__":
    diff = get_diff()
    msg = generate_msg(diff)
    print(f"✅ 建议的 commit message:\\n\\n  {msg}")
    if input("\\n使用此消息提交？(y/N) ").lower() == 'y':
        subprocess.run(['git', 'commit', '-m', msg])
\`\`\`

---
*由 VibeHub 社区分享 · 直接 Fork: 19 · 间接 Fork: 41 · 2026-03-11*`
    },
    {
        id: 'dice_roller',
        emoji: '🎲',
        name: '桌游骰子模拟器',
        tag: '趣味小工具',
        category: 'fun',
        vibe: '和朋友在家玩桌游但找不到骰子，想要一个网页骰子，点一下就掷骰子，还要有真实的摇晃动画。',
        forksDirect: 8,
        forksIndirect: 15,
        date: '2026-03-09',
        vibeContent: `# 🎲 桌游骰子模拟器

> **创造者的话（Vibe）**：
> "和朋友在家玩桌游但找不到骰子，想要一个网页骰子，点一下就掷骰子，还要有真实的摇晃动画。"

---

## 📦 给你的 AI 助手看的说明
> [AI-Guidance: 请读取下方所有代码块，保存为 HTML 用浏览器打开。]

## 💻 \`dice.html\`
\`\`\`html
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>🎲 骰子</title>
<style>
body { display:flex; justify-content:center; align-items:center; height:100vh;
       background:#1a1a2e; font-family:sans-serif; }
.dice { width:120px; height:120px; background:#fff; border-radius:16px;
        display:flex; justify-content:center; align-items:center;
        font-size:48px; cursor:pointer; user-select:none;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        transition: transform 0.3s; }
.dice:active { transform: scale(0.9); }
.dice.rolling { animation: shake 0.5s; }
@keyframes shake {
  0%,100% { transform: rotate(0); }
  25% { transform: rotate(-15deg) scale(1.1); }
  75% { transform: rotate(15deg) scale(1.1); }
}
.result { color:#fff; font-size:24px; margin-top:20px; text-align:center; }
</style></head><body>
<div style="text-align:center">
  <div class="dice" onclick="roll()" id="dice">🎲</div>
  <div class="result" id="result">点击骰子开始</div>
</div>
<script>
const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
function roll() {
  const d = document.getElementById('dice');
  d.classList.add('rolling');
  setTimeout(() => {
    const n = Math.floor(Math.random() * 6);
    d.textContent = faces[n];
    d.classList.remove('rolling');
    document.getElementById('result').textContent = '点数：' + (n+1);
  }, 500);
}
</script></body></html>
\`\`\`

---
*由 VibeHub 社区分享 · 直接 Fork: 8 · 间接 Fork: 15 · 2026-03-09*`
    },
    {
        id: 'expense',
        emoji: '💰',
        name: '极简记账本',
        tag: '生活效率',
        category: 'life',
        vibe: '不想装任何记账App，就想要一个最最简单的命令行工具，输入金额和备注就行，月底能看汇总。',
        forksDirect: 33,
        forksIndirect: 89,
        date: '2026-03-08',
        vibeContent: `# 💰 极简记账本

> **创造者的话（Vibe）**：
> "不想装任何记账App，就想要一个最最简单的命令行工具，输入金额和备注就行，月底能看汇总。"

---

## 📦 给你的 AI 助手看的说明
> [AI-Guidance: 请读取下方所有代码块，在本地建立环境并运行。]
> - **环境要求**: Python 3.8+, 标准库即可
> - **数据存储**: 自动保存在 ~/expenses.csv

## 💻 \`expense.py\`
\`\`\`python
import csv, os, sys
from datetime import datetime

FILE = os.path.expanduser("~/expenses.csv")

def add(amount, note):
    exists = os.path.exists(FILE)
    with open(FILE, 'a', newline='') as f:
        w = csv.writer(f)
        if not exists:
            w.writerow(["日期", "金额", "备注"])
        w.writerow([datetime.now().strftime("%Y-%m-%d %H:%M"), amount, note])
    print(f"✅ 已记录: ¥{amount} - {note}")

def summary():
    if not os.path.exists(FILE):
        print("📭 还没有任何记录"); return
    total = 0
    with open(FILE) as f:
        for row in csv.reader(f):
            if row[0] == "日期": continue
            total += float(row[1])
            print(f"  {row[0]}  ¥{row[1]:>8}  {row[2]}")
    print(f"\\n💰 总计: ¥{total:.2f}")

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        add(float(sys.argv[1]), ' '.join(sys.argv[2:]))
    else:
        summary()
\`\`\`

---
*由 VibeHub 社区分享 · 直接 Fork: 33 · 间接 Fork: 89 · 2026-03-08*`
    }
];

// === 当前筛选/搜索状态 ===
let currentFilter = 'all';
let currentSearch = '';

// === 渲染工具卡片（支持筛选+搜索） ===
function renderTools(filter, search) {
    if (filter !== undefined) currentFilter = filter;
    if (search !== undefined) currentSearch = search;
    const grid = document.getElementById('toolsGrid');
    let filtered = currentFilter === 'all' ? [...TOOLS] : TOOLS.filter(t => t.category === currentFilter);

    if (currentSearch.trim()) {
        const q = currentSearch.trim().toLowerCase();
        filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.vibe.toLowerCase().includes(q) ||
            t.tag.toLowerCase().includes(q)
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted);"><div style="font-size:3rem;margin-bottom:16px;">🔍</div><p style="font-size:1.1rem;">没有找到匹配的工具</p><p style="font-size:0.9rem;margin-top:8px;">试试其他关键词？比如「服务器」「照片」「番茄钟」</p></div>';
        return;
    }

    grid.innerHTML = filtered.map(tool => {
        let dn = tool.name;
        let dv = tool.vibe;
        if (currentSearch.trim()) {
            const q = currentSearch.trim();
            const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
            const hl = '<mark style="background:rgba(124,92,252,0.35);color:#9b7cff;border-radius:2px;padding:0 1px;">$1</mark>';
            dn = dn.replace(re, hl);
            dv = dv.replace(re, hl);
        }
        return `<div class="tool-card" data-id="${tool.id}" onclick="openTool('${tool.id}')">
            <div class="tool-card-header"><span class="tool-emoji">${tool.emoji}</span><span class="tool-tag">${tool.tag}</span></div>
            <h3>${dn}</h3>
            <p class="tool-vibe">"${dv}"</p>
            <div class="tool-meta"><span>🔀 直接Fork ${tool.forksDirect}</span><span>🌳 间接Fork ${tool.forksIndirect}</span><span>📅 ${tool.date}</span></div>
        </div>`;
    }).join('');
}

// === 模态框：展示 .vibe.md 详情 ===
async function openTool(id) {
    const tool = TOOLS.find(t => t.id === id);
    if (!tool) return;

    let content = '';
    // 尝试加载文件，如果有file属性就fetch，否则用内嵌的vibeContent
    if (tool.file) {
        try {
            const res = await fetch(tool.file);
            if (res.ok) content = await res.text();
        } catch(e) { /* fallback */ }
    }
    if (!content && tool.vibeContent) {
        content = tool.vibeContent;
    }
    if (!content) {
        content = `# ${tool.emoji} ${tool.name}\n\n> "${tool.vibe}"`;
    }

    const html = renderMarkdown(content);

    const modal = document.getElementById('modalBody');
    modal.innerHTML = `
        ${html}
        <div class="modal-actions">
            <button class="btn btn-fork" onclick="forkTool('${id}')">🔀 Fork（用自然语言修改）</button>
            <button class="btn btn-copy-vibe" onclick="copyVibe('${id}')">📋 复制全文</button>
        </div>
    `;

    document.getElementById('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';

    // 保存当前内容用于复制
    modal.dataset.rawContent = content;
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

// === 简易 Markdown 渲染 ===
function renderMarkdown(md) {
    let html = md
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^---$/gm, '<hr>')
        .replace(/^\*(.+)\*$/gm, '<em>$1</em>');

    // 处理代码块
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    });

    // 处理段落
    html = html.split('\n').map(line => {
        if (line.match(/^<(h[1-6]|blockquote|pre|hr|ul|li|div)/)) return line;
        if (line.trim() === '') return '';
        if (!line.match(/^</) && line.trim()) return `<p>${line}</p>`;
        return line;
    }).join('\n');

    // 合并连续的 blockquote
    html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');

    return html;
}

function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// === Fork 功能 ===
function forkTool(id) {
    const tool = TOOLS.find(t => t.id === id);
    const modification = prompt(`🔀 自然语言 Fork\n\n你想在「${tool.name}」的基础上做什么修改？\n\n请用一句话描述（例如："把颜色改成蓝色，增加音效提醒"）`);
    if (modification) {
        const raw = document.getElementById('modalBody').dataset.rawContent || '';
        const newVibe = `# 🔀 Fork 自「${tool.name}」\n\n> **我的修改需求**：\n> "${modification}"\n\n> **原始工具的 Vibe**：\n> "${tool.vibe}"\n\n---\n\n${raw}`;
        // 复制到剪贴板
        navigator.clipboard.writeText(newVibe).then(() => {
            alert(`✅ Fork 图纸已复制到剪贴板！\n\n现在，把它粘贴给你的 AI 助手（比如 ChatGPT / Claude / 文心一言），\nAI 就会根据你的修改需求，生成一个属于你自己的全新工具！`);
        });
    }
}

function copyVibe(id) {
    const raw = document.getElementById('modalBody').dataset.rawContent || '';
    navigator.clipboard.writeText(raw).then(() => {
        alert('📋 图纸全文已复制到剪贴板！');
    });
}

function copyCode() {
    const code = document.getElementById('installCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        event.target.textContent = '已复制 ✓';
        setTimeout(() => event.target.textContent = '复制', 1500);
    });
}

// === 数字滚动动画 ===
function animateCounters() {
    const nums = document.querySelectorAll('.stat-num');
    nums.forEach(el => {
        const target = parseInt(el.dataset.target);
        const duration = 2000;
        const start = performance.now();
        function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            el.textContent = Math.round(target * eased).toLocaleString();
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    });
}

// === 筛选按钮 ===
function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('searchInput').value = '';
            renderTools(btn.dataset.filter, '');
        });
    });
}

// === 搜索功能 ===
function initSearch() {
    const input = document.getElementById('searchInput');
    let timer;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            if (input.value.trim()) {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
                renderTools('all', input.value);
            } else {
                renderTools(undefined, '');
            }
        }, 200);
    });
}

// === 导航栏滚动效果 ===
function initNavbar() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10,10,15,0.92)';
        } else {
            navbar.style.background = 'rgba(10,10,15,0.75)';
        }
    });
}

// === 初始化 ===
document.addEventListener('DOMContentLoaded', () => {
    renderTools('all', '');
    initFilters();
    initSearch();
    initNavbar();

    // 模态框关闭
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // 观测 Hero 进入视口后启动数字动画
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.disconnect();
            }
        });
    }, { threshold: 0.3 });
    observer.observe(document.querySelector('.hero-stats'));
});
