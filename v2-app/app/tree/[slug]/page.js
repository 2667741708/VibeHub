// VibeHub V2 — /tree/[slug] Vibe Tree 可视化页面
// [AI-Trace] 新建文件 / New file
// [EN] Vibe Tree page: visualizes the fork/remix evolution of a tool as an interactive tree
// [ZH] Vibe Tree 页面：以交互式树形图展示工具的 Remix 分支演化历史

'use client';

import { useState, useEffect, use, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// --- 递归构建树结构 / Build tree recursively ---
function buildTree(tools, remixes, rootId) {
  const childToolIds = remixes
    .filter(r => r.source_tool_id === rootId && r.remixed_tool_id)
    .map(r => r.remixed_tool_id);
  
  // 同时考虑 parent_id 字段
  const childByParent = tools.filter(t => t.parent_id === rootId);
  
  const allChildIds = [...new Set([
    ...childToolIds,
    ...childByParent.map(t => t.id)
  ])];

  const children = allChildIds.map(childId => {
    const childTool = tools.find(t => t.id === childId);
    if (!childTool) return null;
    return {
      ...childTool,
      children: buildTree(tools, remixes, childId)
    };
  }).filter(Boolean);

  return children;
}

// --- 单个树节点 / Tree Node Component ---
function TreeNode({ node, depth = 0, isRoot = false }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const iconLetter = (node.name || 'T').charAt(0).toUpperCase();
  
  // 基于深度生成不同的色相
  const hue = (depth * 45 + 200) % 360;
  const nodeColor = depth === 0 ? 'var(--text-primary)' : `hsl(${hue}, 40%, 45%)`;
  const lineColor = `hsl(${hue}, 30%, 75%)`;

  return (
    <div style={{ position: 'relative' }}>
      {/* 连接线 / Connector line */}
      {depth > 0 && (
        <div style={{
          position: 'absolute',
          left: -24,
          top: 0,
          width: 24,
          height: '50%',
          borderLeft: `2px solid ${lineColor}`,
          borderBottom: `2px solid ${lineColor}`,
          borderRadius: '0 0 0 8px'
        }} />
      )}
      
      {/* 节点卡片 / Node card */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: isRoot ? 'var(--bg-primary)' : 'var(--bg-secondary)',
          border: `1px solid ${isRoot ? 'var(--text-primary)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          marginBottom: 8,
          cursor: hasChildren ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          boxShadow: isRoot ? 'var(--shadow-lg)' : 'none'
        }}
        onClick={() => hasChildren && setExpanded(!expanded)}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; }}
      >
        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: nodeColor, color: '#fff', fontSize: '0.9rem', fontWeight: 700,
          flexShrink: 0
        }}>
          {iconLetter}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/tool/${node.slug}`} style={{ 
            fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none',
            fontSize: isRoot ? '1.1rem' : '0.95rem'
          }} onClick={e => e.stopPropagation()}>
            {node.name}
          </Link>
          <p style={{ 
            fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {node.description}
          </p>
        </div>

        {/* 展开/收起指示 */}
        {hasChildren && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
            {expanded ? '▼' : '▶'} {node.children.length} 个分支
          </span>
        )}

        {/* Remix 入口 */}
        <Link 
          href={`/remix/${node.slug}`} 
          className="btn btn-ghost"
          style={{ fontSize: '0.75rem', padding: '4px 10px', flexShrink: 0, textDecoration: 'none' }}
          onClick={e => e.stopPropagation()}
        >
          ✨ Remix
        </Link>
      </div>

      {/* 子节点 / Recursion into children */}
      {hasChildren && expanded && (
        <div style={{ marginLeft: 40, paddingLeft: 0, position: 'relative' }}>
          {/* 垂直连接线 */}
          <div style={{
            position: 'absolute',
            left: -16,
            top: 0,
            bottom: 24,
            borderLeft: `2px solid ${lineColor}`
          }} />
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Remix 时间线组件 / Remix Timeline ---
function RemixTimeline({ remixes, toolsMap }) {
  if (!remixes || remixes.length === 0) return null;

  return (
    <div style={{ marginTop: 48 }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 24 }}>
        📜 Remix 时间线
      </h2>
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        {/* 时间轴线 */}
        <div style={{
          position: 'absolute', left: 8, top: 0, bottom: 0, width: 2,
          background: 'var(--border)'
        }} />
        
        {remixes.map((r, idx) => {
          const sourceTool = toolsMap[r.source_tool_id];
          const INTENSITY_LABELS = { 1: '极简复刻', 2: '中等改造', 3: '深度魔改' };
          return (
            <div key={r.id} style={{ position: 'relative', marginBottom: 20, paddingLeft: 20 }}>
              {/* 时间轴圆点 */}
              <div style={{
                position: 'absolute', left: -20, top: 8, width: 12, height: 12,
                borderRadius: '50%', background: 'var(--text-primary)', border: '2px solid var(--bg-primary)'
              }} />
              
              <div style={{
                padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-faint)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>
                    {sourceTool?.name || '未知工具'} → Remix #{idx + 1}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem',
                    background: 'var(--text-primary)', color: 'var(--bg-primary)'
                  }}>
                    {INTENSITY_LABELS[r.intensity_level] || `Level ${r.intensity_level}`}
                  </span>
                  {(r.vibe_tags || []).map(tag => (
                    <span key={tag} style={{
                      padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem',
                      border: '1px solid var(--border)', color: 'var(--text-secondary)'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
                {r.custom_prompt && (
                  <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: 8 }}>
                    &ldquo;{r.custom_prompt}&rdquo;
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- 主页面 / Main Page ---
export default function VibeTreePage({ params }) {
  const { slug } = use(params);
  const [rootTool, setRootTool] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [remixes, setRemixes] = useState([]);
  const [toolsMap, setToolsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalNodes: 0, maxDepth: 0 });

  useEffect(() => {
    async function loadTree() {
      try {
        // 1. 加载所有工具
        const { data: allTools } = await supabase.from('tools').select('*');
        if (!allTools) return;
        
        const map = allTools.reduce((acc, t) => { acc[t.id] = t; return acc; }, {});
        setToolsMap(map);

        // 2. 找到根工具
        const root = allTools.find(t => t.slug === slug);
        if (!root) return;
        setRootTool(root);

        // 3. 加载所有 remix 记录
        const { data: allRemixes } = await supabase.from('remixes').select('*').order('created_at', { ascending: true });
        const remixList = allRemixes || [];

        // 4. 过滤出与该工具相关的 remix
        const relatedRemixes = remixList.filter(r => r.source_tool_id === root.id);
        setRemixes(relatedRemixes);

        // 5. 构建树
        const children = buildTree(allTools, remixList, root.id);
        const tree = { ...root, children };
        setTreeData(tree);

        // 6. 统计
        function countNodes(node) {
          let count = 1;
          (node.children || []).forEach(c => { count += countNodes(c); });
          return count;
        }
        function maxDepth(node, d = 0) {
          if (!node.children || node.children.length === 0) return d;
          return Math.max(...node.children.map(c => maxDepth(c, d + 1)));
        }
        setStats({
          totalNodes: countNodes(tree),
          maxDepth: maxDepth(tree),
          remixCount: relatedRemixes.length
        });

      } catch (e) {
        console.error('Load tree error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadTree();
  }, [slug]);

  if (loading) {
    return (
      <section className="section" style={{ paddingTop: 140, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>构建 Vibe Tree 中...</p>
      </section>
    );
  }

  if (!rootTool || !treeData) {
    return (
      <section className="section" style={{ paddingTop: 140, textAlign: 'center' }}>
        <h2>工具未找到</h2>
        <p style={{ color: 'var(--text-muted)' }}>slug: {slug}</p>
      </section>
    );
  }

  return (
    <section className="section" style={{ paddingTop: 100, paddingBottom: 100 }}>
      <div className="container" style={{ maxWidth: 880 }}>
        
        {/* Header */}
        <Link href={`/tool/${rootTool.slug}`} style={{ display: 'inline-block', marginBottom: 24, textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          ← 返回工具详情
        </Link>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', marginBottom: 8 }}>
          🌳 Vibe Tree
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          以 <strong>{rootTool.name}</strong> 为起点，追溯所有社区 Remix 分支的演化脉络。
        </p>

        {/* Stats Bar */}
        <div style={{
          display: 'flex', gap: 32, padding: '16px 24px', background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)', marginBottom: 40, flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{stats.totalNodes}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>节点总数</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{stats.maxDepth}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>最大分支深度</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{stats.remixCount || 0}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remix 记录</div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Link href={`/remix/${rootTool.slug}`} className="btn btn-primary" style={{
              textDecoration: 'none', fontSize: '0.95rem', padding: '10px 24px'
            }}>
              ✨ 成为新分支
            </Link>
          </div>
        </div>

        {/* Tree Visualization */}
        <div style={{ marginBottom: 48 }}>
          <TreeNode node={treeData} depth={0} isRoot />
        </div>

        {/* Empty state hint */}
        {treeData.children.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 24px', background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)'
          }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              这棵树还是一颗种子 🌱
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
              还没有人 Remix 过这个工具。来成为第一个分支吧！
            </p>
            <Link href={`/remix/${rootTool.slug}`} className="btn btn-primary" style={{
              textDecoration: 'none', padding: '12px 28px', fontSize: '1rem'
            }}>
              ✨ Remix 这个工具
            </Link>
          </div>
        )}

        {/* Remix Timeline */}
        <RemixTimeline remixes={remixes} toolsMap={toolsMap} />

      </div>
    </section>
  );
}
