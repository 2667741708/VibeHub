// VibeHub V2 — /tool/[slug] 工具详情页 (Client Component)
// [AI-Trace] 新建文件 / New file
// [EN] Tool detail page with blueprint, dual-mode AI copy, and source code link
// [ZH] 工具详情页：图纸蓝图、双轨 AI 复制（Web/本地）、源码链接

'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ToolDetailPage({ params }) {
  const { slug } = use(params);
  const [tool, setTool] = useState(null);
  const [readme, setReadme] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSource, setShowSource] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState(null);
  const [isStarred, setIsStarred] = useState(false);
  const [starLoading, setStarLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // 尝试从 API 加载
        let data;
        try {
          const res = await fetch(`/api/tools/${slug}`);
          if (res.ok) data = await res.json();
        } catch (e) {}

        if (!data) {
          // 降级：从静态 index.json 查找
          const res = await fetch('/community/tools/index.json');
          if (res.ok) {
            const all = await res.json();
            data = all.find(t => t.id === slug || t.slug === slug);
          }
        }

        if (data) {
          data.iconLetter = (data.name || 'T').charAt(0).toUpperCase();
          setTool(data);

          // 检查当前用户与收藏状态
          let currentUser = null;
          try {
            const { data: { session } } = await supabase.auth.getSession();
            currentUser = session?.user;
            if (currentUser) {
              setUser(currentUser);
              if (data.id) {
                const { data: starData } = await supabase
                  .from('stars')
                  .select('id')
                  .eq('user_id', currentUser.id)
                  .eq('tool_id', data.id)
                  .single();
                if (starData) setIsStarred(true);
              }
            }
          } catch (e) {
            console.warn('Auth check error:', e);
          }

          // 加载 README
          try {
            const readmeRes = await fetch(`/community/tools/${data.slug || slug}/README.md`);
            if (readmeRes.ok) setReadme(await readmeRes.text());
          } catch (e) {}
        }
      } catch (e) {
        console.error('Failed to load tool:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  function copyBlueprint(mode) {
    if (!tool) return;
    const toolName = tool.name;
    const toolDesc = tool.description || '';
    const toolRepo = tool.repo_url || tool.repo || '';

    let envTarget, actionTarget;
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
      payload += `--- 【源码仓库地址】 ---\n如果你支持联网或读取链接代码，请直接分析以下代码仓库中的详细源码环境：\n${toolRepo}\n\n`;
    }
    payload += `--- 【核心设计与思路图纸 (Blueprint)】 ---\n${readme || toolDesc}\n\n-----------------\n`;
    payload += `请先向我简要汇报你对该工具的理解和接下来的执行路线图。`;

    navigator.clipboard.writeText(payload).then(() => {
      setCopied(true);
      setShowAiModal(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

  async function toggleStar() {
    if (!user) {
      alert('请先通过右上角登录 GitHub 才能使用收藏功能');
      return;
    }
    if (!tool || !tool.id) return;

    setStarLoading(true);
    try {
      if (isStarred) {
        await supabase
          .from('stars')
          .delete()
          .eq('user_id', user.id)
          .eq('tool_id', tool.id);
        setIsStarred(false);
      } else {
        await supabase
          .from('stars')
          .insert({ user_id: user.id, tool_id: tool.id });
        setIsStarred(true);
      }
    } catch (e) {
      console.error(e);
      alert('操作失败');
    } finally {
      setStarLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="section" style={{ paddingTop: 140, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
      </section>
    );
  }

  if (!tool) {
    return (
      <section className="section" style={{ paddingTop: 140, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>工具未找到</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>slug: {slug}</p>
      </section>
    );
  }

  const authorLink = tool.author_link || tool.author?.link;
  const authorName = tool.author_name || tool.author?.name || 'VibeHub Community';
  const authorHtml = authorLink
    ? <a href={authorLink} target="_blank" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>{authorName}</a>
    : <span style={{ color: 'var(--text-primary)' }}>{authorName}</span>;

  return (
    <>
      <section className="section" style={{ paddingTop: 120 }}>
        <div className="container" style={{ maxWidth: 800 }}>
          {/* Header */}
          <div className="tool-detail-header">
            <div className="tool-monogram td-icon">{tool.iconLetter}</div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>{tool.name}</h1>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                by {authorHtml}
              </div>
              <span className="tool-tag">{tool.tag || tool.category}</span>
            </div>
          </div>

          {/* Hero Description */}
          <div className="tool-detail-hero" style={{ position: 'relative' }}>
            <h3>这个工具能帮你做什么？</h3>
            <p>{tool.description}</p>
            
            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <Link href={`/remix/${tool.slug || slug}`} className="btn btn-primary" style={{
                background: 'linear-gradient(135deg, #181715, #3a3833)', 
                color: '#fff', 
                border: 'none',
                padding: '14px 28px',
                fontSize: '1.05rem',
                borderRadius: 'var(--radius-lg)'
              }}>
                ✨ Remix 这个工具
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="tool-actions-box" style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>获取图纸并直接发送给大语言模型：</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => copyBlueprint('web')} title="适用于具备网页预览面板的 AI">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7m4 0h5v5m-5-5l6 6" /></svg>
                复刻为 Web 前端工具
              </button>
              <button className="btn btn-primary" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border)' }} onClick={() => copyBlueprint('local')} title="适合本地部署或封装为 App">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                本地部署与深度封装
              </button>
              {(tool.repo_url || tool.repo) && (
                <a href={tool.repo_url || tool.repo} target="_blank" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" /></svg>
                  获取源码
                </a>
              )}
              <button 
                className="btn btn-ghost" 
                onClick={toggleStar}
                disabled={starLoading}
                style={{ 
                  color: isStarred ? '#eab308' : 'var(--text-secondary)',
                  borderColor: isStarred ? '#fef08a' : 'var(--border)',
                  background: isStarred ? '#fefce8' : 'transparent'
                }}
              >
                {starLoading ? '...' : isStarred ? '⭐ 已收藏' : '☆ 收藏'}
              </button>
              <Link href={`/tree/${tool.slug || slug}`} className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                🌳 Vibe Tree
              </Link>
            </div>
            <p className="action-hint">纯文字架构与源码指引，完美避开超长代码输入限制</p>
          </div>

          {/* Source Code / README Toggle */}
          <div style={{ marginTop: 24 }}>
            <button
              className="toggle-dev-btn"
              onClick={() => setShowSource(!showSource)}
              style={{ width: '100%', textAlign: 'left' }}
            >
              <span>查看完整文档与源代码</span>
              <span>{showSource ? '▲' : '▼'}</span>
            </button>
            {showSource && (
              <div style={{ padding: 24, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginTop: 8, border: '1px solid var(--border-faint)' }}>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {readme || `# ${tool.name}\n\n${tool.description}\n\n---\n\n*暂无详细文档*`}
                </pre>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* AI Platform Selection Modal */}
      {showAiModal && (
        <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) setShowAiModal(false); }}>
          <div className="modal modal-small">
            <button className="modal-close" onClick={() => setShowAiModal(false)}>×</button>
            <div className="modal-body">
              <h2 style={{ marginBottom: 8 }}>跳转到 AI 助手</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 24 }}>
                {copied ? '✅ 工具图纸已复制！' : '工具图纸已复制！'}请选择您常用的 AI 并粘贴即可运行：
              </p>
              <div className="ai-grid">
                <a href="https://chatgpt.com/" target="_blank" className="ai-card" onClick={() => setShowAiModal(false)}>
                  <div className="ai-icon chatgpt" />
                  <span>ChatGPT</span>
                </a>
                <a href="https://claude.ai/new" target="_blank" className="ai-card" onClick={() => setShowAiModal(false)}>
                  <div className="ai-icon claude" />
                  <span>Claude</span>
                </a>
                <a href="https://doubao.com/chat/create/" target="_blank" className="ai-card" onClick={() => setShowAiModal(false)}>
                  <div className="ai-icon doubao" />
                  <span>豆包</span>
                </a>
                <a href="https://yiyan.baidu.com/" target="_blank" className="ai-card" onClick={() => setShowAiModal(false)}>
                  <div className="ai-icon yiyan" />
                  <span>文心一言</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
