/* ============================================
   VibeHub — 社区平台交互逻辑 (面向使用者)
   ============================================
   
   [AI-Trace] 修改基准: community/app.js (commit 60e7d90)
   修改内容 / Modifications:
   - [EN] Removed hardcoded TOOLS array (was ~230 lines of inline data)
   - [ZH] 删除了硬编码的 TOOLS 数组（约 230 行内联数据）
   - [EN] Added dynamic tool loading from tools/index.json via fetch API
   - [ZH] 添加了通过 fetch API 从 tools/index.json 动态加载工具数据
   - [EN] Tool detail modal now fetches README.md from each tool's directory
   - [ZH] 工具详情模态框现在从每个工具目录中加载 README.md
   - [EN] Updated publish section to show AI Publishing Protocol copy button
   - [ZH] 更新了发布区域，展示 AI 发布协议的一键复制按钮
*/

// === 动态工具数据（从 index.json 加载） ===
let TOOLS = [];

// === 分类映射 ===
const CATEGORY_LABELS = {
    'life': '生活效率',
    'dev': '开发辅助',
    'fun': '趣味小工具'
};

// === 加载工具索引 ===
async function loadToolsIndex() {
    try {
        const res = await fetch('tools/index.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        TOOLS = await res.json();
        // 为 UI 兼容性添加衍生字段
        TOOLS.forEach(t => {
            t.iconLetter = (t.name || t.id || 'T').charAt(0).toUpperCase();
            t.tag = CATEGORY_LABELS[t.category] || t.category;
        });
        console.log(`Loaded ${TOOLS.length} tools from index.json`);
        renderTools('all', '');
    } catch (e) {
        console.error('Failed to load tools index:', e);
        const grid = document.getElementById('toolsGrid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted);">
                    <p style="font-size:1.1rem;">工具列表加载失败</p>
                    <p style="font-size:0.85rem;margin-top:8px;opacity:0.6;">请检查网络连接后刷新页面</p>
                </div>`;
        }
    }
}

// === 当前筛选/搜索状态 ===
let currentFilter = 'all';
let currentSearch = '';

// === 渲染工具卡片（支持筛选+搜索） ===
function renderTools(filter, search) {
    if (filter !== undefined) currentFilter = filter;
    if (search !== undefined) currentSearch = search;
    const grid = document.getElementById('toolsGrid');
    if (!grid) return;
    let filtered = currentFilter === 'all' ? [...TOOLS] : TOOLS.filter(t => t.category === currentFilter);

    if (currentSearch.trim()) {
        const q = currentSearch.trim().toLowerCase();
        filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            (t.tags || []).some(tag => tag.toLowerCase().includes(q))
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted);">
                <div style="width:48px;height:48px;margin:0 auto 24px;background:var(--bg-secondary);border:1px solid var(--border-light);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.0004 20.9999L16.6504 16.6499" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <p style="font-size:1.1rem;font-family:var(--font-body);font-weight:500;color:var(--text-primary);">未找到匹配结果</p>
                <p style="font-size:0.9rem;margin-top:8px;font-weight:400;">试试更换搜索词汇或类别</p>
            </div>`;
        return;
    }

    grid.innerHTML = filtered.map(tool => {
        let dn = tool.name;
        let dd = tool.description;
        if (currentSearch.trim()) {
            const q = currentSearch.trim();
            const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
            const hl = '<mark style="background:var(--accent-glow);color:var(--text-primary);border-radius:2px;padding:0 2px;">$1</mark>';
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
            <div class="tool-meta" style="margin-bottom: 24px;">
                <span>By ${tool.author?.name || 'VibeHub Community'}</span>
            </div>
            <div class="tool-meta">
                <span>${tool.language || ''}</span>
                <span>${tool.created || ''}</span>
            </div>
            <div class="tool-card-overlay">
                <span class="view-btn">View Details &rarr;</span>
            </div>
        </div>`;
    }).join('');
}

// === 模态框：从工具目录加载 README.md ===
async function openTool(id) {
    const tool = TOOLS.find(t => t.id === id);
    if (!tool) return;

    let readme = '';
    // 从工具目录加载 README.md
    try {
        const res = await fetch(`tools/${tool.id}/README.md`);
        if (res.ok) readme = await res.text();
    } catch (e) {
        console.warn("Failed to load README.md for", tool.id);
    }

    if (!readme) {
        readme = `# ${tool.name}\n\n${tool.description}\n\n---\n\n*暂无详细文档*`;
    }

    const fullSourceText = readme;
    const compiledHtml = renderMarkdown(readme);

    const modal = document.getElementById('modalBody');
    
    // Build Author HTML
    let authorHtml = '';
    if (tool.author) {
        if (tool.author.link) {
            authorHtml = `by <a href="${tool.author.link}" target="_blank" style="color:var(--text-primary); text-decoration:underline;">${tool.author.name}</a>`;
        } else {
            authorHtml = `by <span style="color:var(--text-primary);">${tool.author.name}</span>`;
        }
    }

    // Build Repo Link HTML
    let repoLinkHtml = '';
    if (tool.repo) {
        repoLinkHtml = `
            <a href="${tool.repo}" target="_blank" class="btn btn-ghost btn-large" style="text-decoration: none;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                获取源码
            </a>
        `;
    }

    modal.innerHTML = `
        <div class="tool-detail-header">
            <div class="tool-monogram td-icon">${tool.iconLetter}</div>
            <div class="td-title-wrapper">
                <h1>${tool.name}</h1>
                <div style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 8px;">
                    ${authorHtml}
                </div>
                <span class="tool-tag">${tool.tag}</span>
            </div>
        </div>
        
        <div class="tool-detail-hero">
            <h3>这个工具能帮你做什么？</h3>
            <p>${tool.description}</p>
        </div>

        <div class="tool-actions-box" style="display: flex; gap: 16px; justify-content: center; align-items: center; flex-direction: column;">
            <p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: -4px;">获取图纸并直接发送给大语言模型：</p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                <button class="btn btn-primary" onclick="copyAndShowAISelection('web')" title="适用于具备网页预览面板的 AI (如 Claude Artifacts)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7m4 0h5v5m-5-5l6 6"></path></svg>
                    复刻为 Web 前端工具
                </button>
                <button class="btn btn-primary" style="background:var(--bg-hover); border-color:var(--border);" onclick="copyAndShowAISelection('local')" title="适合本地部署、终端或封装为 App">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    本地部署与深度封装
                </button>
                ${repoLinkHtml}
            </div>
            <p class="action-hint">纯文字架构与源码指引，完美避开超长代码输入限制</p>
        </div>

        <div class="tool-dev-section">
            <button class="toggle-dev-btn" onclick="toggleDevSection(this)">
                <span>查看完整文档与源代码</span>
                <span class="toggle-arrow">▼</span>
            </button>
            <div class="dev-content" style="display: none;">
                <div class="code-wrapper">
                    ${compiledHtml}
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';

    modal.dataset.rawContent = fullSourceText;
    modal.dataset.toolName = tool.name;
    modal.dataset.toolDesc = tool.description;
    modal.dataset.toolRepo = tool.repo || '';
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
function copyAndShowAISelection(mode) {
    const rawContent = document.getElementById('modalBody').dataset.rawContent || '';
    const toolName = document.getElementById('modalBody').dataset.toolName || '工具';
    const toolDesc = document.getElementById('modalBody').dataset.toolDesc || '';
    const toolRepo = document.getElementById('modalBody').dataset.toolRepo || '';
    
    let envTarget = '';
    let actionTarget = '';

    if (mode === 'web') {
        envTarget = '具备 Artifacts 或代码预览能力的网页环境（例如 Claude 或 Vercel V0）';
        actionTarget = '通过纯 Web 技术栈将其复刻为一个可交互验证的前端应用';
    } else {
        envTarget = '我的本地环境（或者我想要封装为独立的桌面/手机 App）';
        actionTarget = '指导我如何在本地部署环境并将其跑起来，或者给出将其打包封装为独立 App 的完整指南';
    }

    let payload = `你好，我在 VibeHub 社区发现了一个非常棒的数字工具：「${toolName}」。\n`;
    payload += `我的运行与配置目标是：${envTarget}。\n`;
    payload += `请你仔细阅读下方提供的【工具说明】和【核心图纸】，然后一步步协助我完成构建，即${actionTarget}。\n\n`;
    
    payload += `--- 【工具简要说明】 ---\n${toolDesc}\n\n`;
    
    if (toolRepo) {
        payload += `--- 【源码仓库地址】 ---\n如果你支持联网或读取链接代码，请直接分析以下代码仓库中的详细源码环境（这样我就不需要手动粘贴巨长无比的代码给你了）：\n${toolRepo}\n\n`;
    }
    
    payload += `--- 【核心设计与思路图纸 (Blueprint)】 ---\n(以下为该工具的框架、提示词与核心说明，请参考其思想进行代码编写或环境搭建)\n\n${rawContent}\n\n-----------------\n`;
    payload += `请先向我简要汇报你对该工具的理解和接下来的执行路线图。如果你准备好了就可以随时发代码，如果有任何不明确或需要修改定制的地方，我会继续指引你。`;

    navigator.clipboard.writeText(payload).then(() => {
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

// === 复制 AI 发布协议 ===
async function copyPublishGuide() {
    try {
        // 发布协议文件在仓库根目录
        const res = await fetch('/PUBLISH_GUIDE.md');
        if (!res.ok) throw new Error('Failed to fetch');
        const guide = await res.text();
        await navigator.clipboard.writeText(guide);
        const btn = document.querySelector('.copy-guide-btn');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '✓ 已复制！现在粘贴给你的 AI 助手';
            btn.style.opacity = '0.8';
            setTimeout(() => { btn.innerHTML = original; btn.style.opacity = '1'; }, 3000);
        }
    } catch (e) {
        console.error('Copy guide failed:', e);
        alert('复制失败，请手动访问 PUBLISH_GUIDE.md');
    }
}

// === 简易 Markdown 渲染 ===
function renderMarkdown(md) {
    let html = md
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^\> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^---$/gm, '<hr>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^\- (.+)$/gm, '<li>$1</li>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => '<ul>' + match + '</ul>');
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    });

    html = html.split('\n').map(line => {
        if (line.match(/^<(h[1-6]|blockquote|pre|hr|ul|li|div|table)/)) return line;
        if (line.trim() === '') return '';
        return line;
    }).join('\n');

    html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');
    return html;
}

function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// === 数字滚动动画 ===
function animateCounters() {
    document.querySelectorAll('.stat-num').forEach(el => {
        const target = parseInt(el.dataset.target);
        const duration = 2000;
        let start = null;
        function tick(now) {
            if (!start) start = now;
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
            renderTools(btn.dataset.filter);
        });
    });
}

function initSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    let timer;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            renderTools(undefined, input.value);
        }, 200);
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            input.value = '';
            renderTools(undefined, '');
        }
    });
}

function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadToolsIndex(); // 动态加载工具列表
    initFilters();
    initSearch();
    initNavbar();

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

// === GitHub OAuth 登录 ===
const GITHUB_CLIENT_ID = 'Ov23lifd2X85p0C5nIXT';
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
        if (btn) btn.textContent = '登录中...';
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
                <div class="user-profile" style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 4px 12px 4px 4px; border-radius: var(--radius-pill); border: 1px solid var(--border-light); transition: var(--transition);" onmouseover="this.style.background='var(--bg-card)'" onmouseout="this.style.background='transparent'" onclick="logout()" title="点击退出登录">
                    <img src="${user.avatar_url}" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--border-faint); object-fit: cover;">
                    <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-primary); font-family: var(--font-body);">${user.login}</span>
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
