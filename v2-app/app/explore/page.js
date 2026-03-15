// VibeHub V2 — /explore 工具发现页 (Client Component)
// [AI-Trace] 新建文件 / New file
// [EN] Tools exploration page with search, filter, and card grid. Fetches from API.
// [ZH] 工具发现页：搜索、筛选和卡片网格。从 API 拉取数据（优先 Supabase，降级到静态 JSON）

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CATEGORY_LABELS = {
  'life': '生活效率',
  'dev': '开发辅助',
  'fun': '趣味小工具',
  'workflow': '效率与协作',
};

export default function ExplorePage() {
  const [tools, setTools] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTools() {
      try {
        // 优先从 API 加载 (Supabase)，降级到静态 JSON
        let data;
        try {
          const res = await fetch('/api/tools');
          if (res.ok) {
            data = await res.json();
          }
        } catch (e) {
          console.warn('API unavailable, falling back to static JSON');
        }

        if (!data) {
          // 降级：直接加载静态 index.json (兼容 V1)
          const res = await fetch('/community/tools/index.json');
          if (res.ok) data = await res.json();
        }

        if (data && Array.isArray(data)) {
          data.forEach(t => {
            t.iconLetter = (t.name || t.id || 'T').charAt(0).toUpperCase();
            t.tag = CATEGORY_LABELS[t.category] || t.category;
            t.slug = t.slug || t.id;
          });
          setTools(data);
        }
      } catch (e) {
        console.error('Failed to load tools:', e);
      } finally {
        setLoading(false);
      }
    }
    loadTools();
  }, []);

  // 筛选 + 搜索
  let filtered = filter === 'all' ? [...tools] : tools.filter(t => t.category === filter);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (t.tags || []).some(tag => tag.toLowerCase().includes(q))
    );
  }

  return (
    <section className="section" style={{ paddingTop: 120 }}>
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            热门工具库
          </h2>
          <p className="section-desc">每一个工具都解决了一个真实的痛点。马上挑选一个试试吧。</p>
        </div>

        {/* 搜索 */}
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="搜索工具... 例如：照片、番茄钟、JSON"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* 筛选 */}
        <div className="filter-bar">
          {['all', 'life', 'dev', 'workflow', 'fun'].map(cat => (
            <button
              key={cat}
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat === 'all' ? '全部' : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        {/* 工具网格 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p>加载中...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem' }}>未找到匹配结果</p>
            <p style={{ fontSize: '0.9rem', marginTop: 8, opacity: 0.6 }}>试试更换搜索词汇或类别</p>
          </div>
        ) : (
          <div className="tools-grid">
            {filtered.map(tool => (
              <Link href={`/tool/${tool.slug}`} key={tool.id} style={{ textDecoration: 'none' }}>
                <div className="tool-card">
                  <div className="tool-card-header">
                    <div className="tool-monogram">{tool.iconLetter}</div>
                    <span className="tool-tag">{tool.tag}</span>
                  </div>
                  <h3>{tool.name}</h3>
                  <p className="tool-desc">{tool.description}</p>
                  <div className="tool-meta" style={{ marginBottom: 24 }}>
                    <span>By {tool.author?.name || 'VibeHub Community'}</span>
                  </div>
                  <div className="tool-meta">
                    <span>{tool.language || ''}</span>
                    <span>{tool.created || ''}</span>
                  </div>
                  <div className="tool-card-overlay">
                    <span className="view-btn">View Details →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
