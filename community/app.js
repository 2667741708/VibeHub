/* ============================================
   VibeHub — 社区平台交互逻辑 (面向使用者)
   ============================================ */

// === 示范工具数据 ===
const TOOLS = [
    {
        id: 'pomodoro',
        iconLetter: 'P',
        name: '番茄工作法锁屏助手',
        tag: '生活效率',
        category: 'life',
        description: '一个极简的专注计时器。启动后每工作25分钟，全屏弹出红底白字强制提醒你休息5分钟，并且会随机给你一句鼓励的话。',
        vibe: '我总是控制不住自己玩手机，每工作25分钟就弹出全屏提醒休息5分钟，屏幕上用巨大的红色字显示倒计时和一句鼓励的话。',
        uses: 124,
        date: '2026-03-13',
        file: 'tools/pomodoro.vibe.md'
    },
    {
        id: 'photo_renamer',
        iconLetter: 'R',
        name: '照片批量整理器',
        tag: '生活效率',
        category: 'life',
        description: '自动读取照片的拍摄日期，把成百上千张杂乱无章的照片自动按「年-月」分类到不同文件夹，并按时间线批量重命名，拯救强迫症。',
        vibe: '手机里几千张照片导到电脑上文件名全是乱码，我想按年月自动分到不同文件夹并重命名成人能看懂的名字。',
        uses: 56,
        date: '2026-03-12',
        file: 'tools/photo_renamer.vibe.md'
    },
    {
        id: 'wifi_speed',
        iconLetter: 'W',
        name: 'WiFi 测速小助手',
        tag: '生活效率',
        category: 'life',
        description: '一键测试你当前的真实下载和上传速度，并用醒目的大字直接告诉你："网速很快" 或 "确实很卡，建议检查"。',
        vibe: '每次感觉网速很慢但不知道是不是错觉。打开就能测当前网速，用大字告诉我网速正常还是确实很慢。',
        uses: 89,
        date: '2026-03-10',
        file: 'tools/wifi_speed.vibe.md'
    },
    {
        id: 'svc_spider',
        iconLetter: 'S',
        name: '多服务器代码同步器',
        tag: '开发辅助',
        category: 'dev',
        description: '一个 VS Code 插件化脚本，能把你正在写的代码瞬间同步分发到你配置的 3-4 台远程 GPU 服务器上，免去手动上传的烦恼。',
        vibe: '我每天要在3-4台GPU服务器之间来回切换做实验，想要一个像蜘蛛结网一样的VS Code插件，把所有服务器同时挂载到同一个工作区。',
        uses: 15,
        date: '2026-03-14',
        file: 'tools/svc_spider.vibe.md'
    },
    {
        id: 'git_commit',
        iconLetter: 'G',
        name: '自动 Git 信息生成器',
        tag: '开发辅助',
        category: 'dev',
        description: '每次提交代码不知道写什么？它会自动分析你修改了哪些文件，然后帮你生成标准、规范的 Commit 提交信息。',
        vibe: '我每次 git commit 都不知道写什么好，想要一个工具自动分析我改了什么文件然后生成规范的 commit message。',
        uses: 211,
        date: '2026-03-11',
        vibeContent: `# 自动 Git 信息生成器

> **创造者的话（Vibe）**：
> "我每次 git commit 都不知道写什么好，想要一个工具自动分析我改了什么文件然后生成规范的 commit message。"

---

## 你的 AI 助手需要的环境
> [AI-Guidance: 请读取下方所有代码块，在本地建立环境并运行。]
> - **环境要求**: Python 3.8+, 需在 git 仓库内运行

## \`git_msg.py\`
\`\`\`python
import subprocess, sys

def get_diff():
    r = subprocess.run(['git', 'diff', '--staged', '--stat'], capture_output=True, text=True)
    return r.stdout

def generate_msg(diff):
    files = [l.split('|')[0].strip() for l in diff.strip().split('\\n') if '|' in l]
    if not files:
        print("没有暂存的更改。先 git add 再运行。")
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
    print(f"建议的 commit message:\\n\\n  {msg}")
    if input("\\n使用此消息提交？(y/N) ").lower() == 'y':
        subprocess.run(['git', 'commit', '-m', msg])
\`\`\`

---
*由 VibeHub 社区分享 · 使用次数: 211 · 2026-03-11*`
    },
    {
        id: 'dice_roller',
        iconLetter: 'D',
        name: '桌游骰子模拟器',
        tag: '趣味小工具',
        category: 'fun',
        description: '朋友聚会玩桌游找不到骰子？用这个双击屏幕就能扔出随机点数的数字骰子，带有真实的物理摇晃动画效果。',
        vibe: '和朋友在家玩桌游但找不到骰子，想要一个网页骰子，点一下就掷骰子，还要有真实的摇晃动画。',
        uses: 48,
        date: '2026-03-09',
        vibeContent: `# 桌游骰子模拟器

> **创造者的话（Vibe）**：
> "和朋友在家玩桌游但找不到骰子，想要一个网页骰子，点一下就掷骰子，还要有真实的摇晃动画。"

---

## 你的 AI 助手需要的环境
> [AI-Guidance: 请读取下方所有代码块，保存为 HTML 用浏览器打开。]

## \`dice.html\`
\`\`\`html
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>骰子</title>
<style>
body { display:flex; justify-content:center; align-items:center; height:100vh;
       background:#15151a; font-family:sans-serif; }
.dice { width:120px; height:120px; background:#2a2a35; border-radius:24px;
        display:flex; justify-content:center; align-items:center; color:#fff;
        font-size:48px; cursor:pointer; user-select:none;
        box-shadow: 0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); border:1px solid rgba(255,255,255,0.05); }
.dice:active { transform: scale(0.95); }
.dice.rolling { animation: shake 0.5s; }
@keyframes shake {
  0%,100% { transform: rotate(0); }
  25% { transform: rotate(-15deg) scale(1.05); }
  75% { transform: rotate(15deg) scale(1.05); }
}
.result { color:#a1a1aa; font-size:20px; margin-top:24px; text-align:center; font-family:'Syne', sans-serif;}
</style></head><body>
<div style="text-align:center">
  <div class="dice" onclick="roll()" id="dice">D</div>
  <div class="result" id="result">Tap to roll</div>
</div>
<script>
const faces = ['1','2','3','4','5','6'];
function roll() {
  const d = document.getElementById('dice');
  d.classList.add('rolling');
  setTimeout(() => {
    const n = Math.floor(Math.random() * 6);
    d.textContent = faces[n];
    d.classList.remove('rolling');
    document.getElementById('result').textContent = 'Result: ' + (n+1);
  }, 500);
}
</script></body></html>
\`\`\`

---
*由 VibeHub 社区分享 · 使用次数: 48 · 2026-03-09*`
    },
    {
        id: 'expense',
        iconLetter: 'E',
        name: '极简无脑记账本',
        tag: '生活效率',
        category: 'life',
        description: '受够了广告和弹窗的记账App？这是一个命令行记账本，敲入"金额+备注"就能记下来，到了月底自动帮你汇总总账单。',
        vibe: '不想装任何记账App，就想要一个最最简单的命令行工具，输入金额和备注就行，月底能看汇总。',
        uses: 132,
        date: '2026-03-08',
        vibeContent: `# 极简无脑记账本

> **创造者的话（Vibe）**：
> "不想装任何记账App，就想要一个最最简单的命令行工具，输入金额和备注就行，月底能看汇总。"

---

## 你的 AI 助手需要的环境
> [AI-Guidance: 请读取下方所有代码块，在本地建立环境并运行。]
> - **环境要求**: Python 3.8+, 标准库即可
> - **数据存储**: 自动保存在 ~/expenses.csv

## \`expense.py\`
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
    print(f"已记录: ¥{amount} - {note}")

def summary():
    if not os.path.exists(FILE):
        print("还没有任何记录"); return
    total = 0
    with open(FILE) as f:
        for row in csv.reader(f):
            if row[0] == "日期": continue
            total += float(row[1])
            print(f"  {row[0]}  ¥{row[1]:>8}  {row[2]}")
    print(f"\\n总计: ¥{total:.2f}")

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        add(float(sys.argv[1]), ' '.join(sys.argv[2:]))
    else:
        summary()
\`\`\`

---
*由 VibeHub 社区分享 · 使用次数: 132 · 2026-03-08*`
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
            t.description.toLowerCase().includes(q) ||
            t.tag.toLowerCase().includes(q)
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted);">
                <div style="width:64px;height:64px;margin:0 auto 24px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:16px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 1px 0 rgba(255,255,255,0.05);">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.0004 20.9999L16.6504 16.6499" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <p style="font-size:1.1rem;font-family:'Syne', sans-serif;">未找到匹配结果</p>
                <p style="font-size:0.85rem;margin-top:8px;opacity:0.6;">试试更换搜索词汇或类别</p>
            </div>`;
        return;
    }

    grid.innerHTML = filtered.map(tool => {
        let dn = tool.name;
        let dd = tool.description;
        if (currentSearch.trim()) {
            const q = currentSearch.trim();
            const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
            const hl = '<mark style="background:rgba(255,255,255,0.1);color:#fff;border-radius:2px;padding:0 2px;">$1</mark>';
            dn = dn.replace(re, hl);
            dd = dd.replace(re, hl);
        }
        return `
        <div class="tool-card" data-id="${tool.id}" onclick="openTool('${tool.id}')">
            <div class="tool-card-header">
                <div class="tool-monogram">${tool.iconLetter}</div>
                <span class="tool-tag">${tool.tag}</span>
            </div>
            <h3>${dn}</h3>
            <p class="tool-desc">${dd}</p>
            <div class="tool-meta">
                <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg> ${tool.uses} Uses</span>
            </div>
            <div class="tool-card-overlay">
                <span class="view-btn">View Details &rarr;</span>
            </div>
        </div>`;
    }).join('');
}

// === 模态框：优先展示功能，隐藏枯燥代码 ===
async function openTool(id) {
    const tool = TOOLS.find(t => t.id === id);
    if (!tool) return;

    let content = '';
    // 加载文件，如果有file属性就fetch，否则用内嵌的vibeContent
    if (tool.file) {
        try {
            const res = await fetch(tool.file);
            if (res.ok) content = await res.text();
        } catch(e) { console.warn("Failed fetching file, using fallback if available"); }
    }
    if (!content && tool.vibeContent) {
        content = tool.vibeContent;
    }
    if (!content) {
        content = `# ${tool.name}\n\n> "${tool.vibe}"\n\n...加载图纸失败...`;
    }

    // 将原始内容存下来用于复制
    const fullSourceText = content;
    const compiledHtml = renderMarkdown(content);

    const modal = document.getElementById('modalBody');
    modal.innerHTML = `
        <div class="tool-detail-header">
            <div class="tool-monogram td-icon">${tool.iconLetter}</div>
            <div class="td-title-wrapper">
                <h1>${tool.name}</h1>
                <span class="tool-tag">${tool.tag}</span>
            </div>
        </div>
        
        <div class="tool-detail-hero">
            <h3>这个工具能帮你做什么？</h3>
            <p>${tool.description}</p>
        </div>

        <div class="tool-actions-box">
            <button class="btn btn-primary btn-large" onclick="copyAndShowAISelection()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                一键复制图纸，去 AI 运行
            </button>
            <p class="action-hint">直接丢给任何大语言模型即可自动运行或定制修改</p>
        </div>

        <div class="tool-dev-section">
            <button class="toggle-dev-btn" onclick="toggleDevSection(this)">
                <span>好奇它是怎么写出来的？查看创作者思路与源代码</span>
                <span class="toggle-arrow">▼</span>
            </button>
            <div class="dev-content" style="display: none;">
                <div class="vibe-quote">
                    <strong>创作者的设计灵感：</strong>
                    "${tool.vibe}"
                </div>
                <h4>背后的原始图纸：</h4>
                <div class="code-wrapper">
                    ${compiledHtml}
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';

    // 绑定复制内容到特定属性上
    modal.dataset.rawContent = fullSourceText;
    modal.dataset.toolName = tool.name;
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function toggleDevSection(btn) {
    const content = btn.nextElementSibling;
    if (content.style.display === 'none') {
        content.style.display = 'block';
        btn.querySelector('.toggle-arrow').textContent = '▲';
    } else {
        content.style.display = 'none';
        btn.querySelector('.toggle-arrow').textContent = '▼';
    }
}

// === 增强复制与 AI 跳转 ===
function copyAndShowAISelection() {
    const btn = document.querySelector('.tool-actions-box .btn-primary');
    const rawContent = document.getElementById('modalBody').dataset.rawContent || '';
    const toolName = document.getElementById('modalBody').dataset.toolName || '工具';
    
    // 把一段针对 AI 的 Prompt 包裹着图纸一起复制，确保 AI 能听懂
    const payload = `这是我在 VibeHub 社区发现的工具「${toolName}」的图纸，请你根据它的代码格式和要求，帮我运行起来（或指导我如何运行它）。如果有需要修改的地方，我会接着告诉你需求：\n\n-----------------\n${rawContent}`;

    navigator.clipboard.writeText(payload).then(() => {
        // 关闭当前详情模态框，打开 AI 选择模态框
        closeModal();
        document.getElementById('aiModalOverlay').classList.add('open');
        document.body.style.overflow = 'hidden';
    }).catch(err => {
        console.error('Copy failed', err);
        alert('复制失败，请重试');
    });
}

function closeAiModal() {
    document.getElementById('aiModalOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

// === 简易 Markdown 渲染 (用于后台折叠区域的显示) ===
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

    html = html.split('\n').map(line => {
        if (line.match(/^<(h[1-6]|blockquote|pre|hr|ul|li|div)/)) return line;
        if (line.trim() === '') return '';
        if (!line.match(/^</) && line.trim()) return `<p>${line}</p>`;
        return line;
    }).join('\n');

    html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');
    return html;
}

function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// === 发布新工具逻辑 (Web Form) ===
function publishTool(e) {
    e.preventDefault();
    const btn = e.target;
    const desc = document.getElementById('toolDescInput').value;
    const code = document.getElementById('toolCodeInput').value;
    
    if (!desc.trim() || !code.trim()) {
        alert("描述和代码不能为空哦！");
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '正在生成 Vibe 图纸...';
    btn.style.opacity = '0.7';

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.opacity = '1';
        alert('🎉 横空出世！您的工具图纸已生成完毕。\n在真实环境中，这里会将文件发布到您的 GitHub Repository 中并自动更新工具墙！');
        document.getElementById('toolDescInput').value = '';
        document.getElementById('toolCodeInput').value = '';
    }, 1500);
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
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased).toLocaleString();
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    });
}

// === 初始化交互 ===
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

document.addEventListener('DOMContentLoaded', () => {
    renderTools('all', '');
    initFilters();
    initSearch();
    initNavbar();

    // 模态框关闭
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('aiModalClose').addEventListener('click', closeAiModal);
    
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });
    document.getElementById('aiModalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeAiModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeAiModal();
        }
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.disconnect();
            }
        });
    }, { threshold: 0.3 });
    const statsEl = document.querySelector('.hero-stats');
    if (statsEl) observer.observe(statsEl);
});

// === GitHub OAuth 登录相关保留 ===
const GITHUB_CLIENT_ID = '0v23lifd2X85p0C5nIXT';
const AUTH_PROXY_URL = window.location.hostname.includes('localhost') 
    ? 'http://localhost:3000/api/auth'
    : 'https://vibe-hub-sandy.vercel.app/api/auth';

function loginWithGitHub(e) {
    if (e) e.preventDefault();
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('oauth_state', state);
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=read:user`;
    window.location.href = authUrl;
}

function logout() {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
    updateAuthUI();
}

async function handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');
    
    if (!code) return;
    
    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    
    const savedState = sessionStorage.getItem('oauth_state');
    if (savedState && returnedState !== savedState) {
        alert("登录状态异常，请重试。");
        return;
    }
    
    try {
        const btn = document.getElementById('login-btn');
        if(btn) btn.textContent = '登录中...';
        
        const response = await fetch(AUTH_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        if (data.access_token) {
            localStorage.setItem('github_token', data.access_token);
            await fetchUserProfile(data.access_token);
        } else {
            alert("登录验证失败：" + (data.error || "未知原因"));
            updateAuthUI();
        }
    } catch (e) {
        alert("连接验证服务器失败，请稍后重试。");
        updateAuthUI();
    }
}

async function fetchUserProfile(token) {
    try {
        const res = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (res.ok) {
            const user = await res.json();
            localStorage.setItem('github_user', JSON.stringify(user));
            updateAuthUI();
        } else {
            logout();
        }
    } catch (e) {
        console.error("Fetch profile failed:", e);
    }
}

function updateAuthUI() {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return;
    const userStr = localStorage.getItem('github_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            authContainer.innerHTML = `
                <div class="user-profile" style="display: flex; align-items: center; gap: 12px; cursor: pointer;" onclick="logout()" title="点击退出登录">
                    <img src="${user.avatar_url}" style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--accent); object-fit: cover;">
                    <span style="font-size: 0.9rem; font-weight: 500;">${user.login}</span>
                </div>`;
        } catch(e) {
            authContainer.innerHTML = `<a href="#" class="nav-btn" id="login-btn" onclick="loginWithGitHub(event)">GitHub 登录</a>`;
        }
    } else {
        authContainer.innerHTML = `<a href="#" class="nav-btn" id="login-btn" onclick="loginWithGitHub(event)">GitHub 登录</a>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    handleOAuthCallback().then(() => updateAuthUI());
});
