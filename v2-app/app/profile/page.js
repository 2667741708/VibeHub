// VibeHub V2 — /profile 个人中心页面
// [AI-Trace] 新建文件 / New file
// [EN] User profile page showing starred tools and remix history
// [ZH] 用户主页：展示用户的「收藏工具」和「Remix 历史」

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [activeTab, setActiveTab] = useState('stars'); // 'stars' or 'remixes'
  
  const [stars, setStars] = useState([]);
  const [remixes, setRemixes] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    async function initUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // 首次登录可能需要写入 profiles
          await supabase.from('profiles').upsert({
            id: session.user.id,
            username: session.user.user_metadata?.preferred_username || session.user.user_metadata?.name || 'User',
            avatar_url: session.user.user_metadata?.avatar_url,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' }).catch(console.error);
        }
      } catch (e) {
        console.error('Fetch user error:', e);
      } finally {
        setLoadingUser(false);
      }
    }
    initUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    async function loadData() {
      setLoadingData(true);
      try {
        // 加载全部工具作为基准数据字典
        const { data: allTools } = await supabase.from('tools').select('*');
        const toolsMap = (allTools || []).reduce((acc, t) => {
          t.iconLetter = (t.name || 'T').charAt(0).toUpperCase();
          acc[t.id] = t;
          return acc;
        }, {});

        // 1. 加载收藏
        const { data: starData } = await supabase.from('stars').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (starData) {
          const matchedStars = starData.map(s => toolsMap[s.tool_id]).filter(Boolean);
          setStars(matchedStars);
        }

        // 2. 加载 Remix 记录
        const { data: remixData } = await supabase.from('remixes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (remixData) {
          const enrichedRemixes = remixData.map(r => ({
            ...r,
            sourceTool: toolsMap[r.source_tool_id]
          }));
          setRemixes(enrichedRemixes);
        }
      } catch (err) {
        console.error('Load data failed:', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [user]);

  if (loadingUser) {
    return (
      <section className="section" style={{ paddingTop: 140, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>鉴权中...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="section" style={{ paddingTop: 140, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>未登录</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>请通过右上角 GitHub 按钮登录后查看个人主页。</p>
      </section>
    );
  }

  const avatar = user.user_metadata?.avatar_url || 'https://github.com/github.png';
  const name = user.user_metadata?.preferred_username || user.user_metadata?.name || 'VibeHub Maker';
  const joinedAt = user.created_at ? new Date(user.created_at).toLocaleDateString() : '';

  return (
    <section className="section" style={{ paddingTop: 120, minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: 900 }}>
        
        {/* Profile Card */}
        <div style={{
          display: 'flex', gap: 24, alignItems: 'center', padding: '32px',
          background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', marginBottom: 40
        }}>
          <img src={avatar} alt={name} style={{ width: 80, height: 80, borderRadius: '50%', border: '1px solid var(--border)' }} />
          <div>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', margin: 0 }}>{name}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>加入时间：{joinedAt}</p>
            {user.user_metadata?.preferred_username && (
              <a href={`https://github.com/${user.user_metadata.preferred_username}`} target="_blank" style={{
                color: 'var(--text-primary)', textDecoration: 'underline', fontSize: '0.9rem', display: 'inline-block', marginTop: 12
              }}>
                查看 GitHub 主页
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-faint)', marginBottom: 32 }}>
          <button 
            onClick={() => setActiveTab('stars')}
            style={{
              padding: '12px 24px', fontSize: '1.05rem', cursor: 'pointer', background: 'transparent',
              border: 'none', borderBottom: activeTab === 'stars' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'stars' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'stars' ? 500 : 400
            }}
          >
            ⭐ 收藏工具 ({stars.length})
          </button>
          <button 
            onClick={() => setActiveTab('remixes')}
            style={{
              padding: '12px 24px', fontSize: '1.05rem', cursor: 'pointer', background: 'transparent',
              border: 'none', borderBottom: activeTab === 'remixes' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'remixes' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'remixes' ? 500 : 400
            }}
          >
            🧪 我的 Remix ({remixes.length})
          </button>
        </div>

        {/* Tab Content */}
        {loadingData ? (
          <p style={{ color: 'var(--text-muted)' }}>读取数据中...</p>
        ) : activeTab === 'stars' ? (
          stars.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>你还没有收藏任何工具。</p>
          ) : (
            <div className="tools-grid">
              {stars.map(tool => (
                <Link href={`/tool/${tool.slug}`} key={tool.id} style={{ textDecoration: 'none' }}>
                  <div className="tool-card">
                    <div className="tool-card-header">
                      <div className="tool-monogram">{tool.iconLetter}</div>
                      <span className="tool-tag">{tool.category}</span>
                    </div>
                    <h3>{tool.name}</h3>
                    <p className="tool-desc">{tool.description}</p>
                    <div className="tool-card-overlay"><span className="view-btn">View Details →</span></div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          remixes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>你还没有进行过任何 Remix 创作。</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {remixes.map(r => (
                <div key={r.id} style={{ padding: 24, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                      Remix 对齐: {r.sourceTool?.name || '未知工具'}
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <span className="badge" style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
                      烈度: Level {r.intensity_level}
                    </span>
                    {(r.vibe_tags || []).map(tag => (
                      <span key={tag} className="badge" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{tag}</span>
                    ))}
                  </div>
                  {r.custom_prompt && (
                    <div style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                      " {r.custom_prompt} "
                    </div>
                  )}
                  <details>
                    <summary style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)' }}>点击查看生成的完整 Prompt</summary>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', fontSize: '0.8rem', color: 'var(--text-secondary)',
                      background: 'var(--bg-primary)', padding: 12, borderRadius: 6, marginTop: 12, border: '1px solid var(--border-faint)'
                    }}>
                      {r.full_prompt}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </section>
  );
}
