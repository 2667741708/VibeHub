// VibeHub V2 — /remix/[slug] 核心 Remix 工作台
// [AI-Trace] 新建文件 / New file
// [EN] Remix Engine workstation allowing users to customize AI prompts with intensity and vibes
// [ZH] 加载指定工具并允许用户通过调节强度、选择灵感卡片来「调味」复刻提示词

'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const VIBE_CATEGORIES = [
  { id: 'ui', label: '🎨 UI美化', prompt: '赋予它极具现代感的 UI，如大理石白色背景、衬线字体和大量的留白呼吸感，风格对标 Claude 的设计哲学。' },
  { id: 'mobile', label: '📱 移动端', prompt: '将其重构为移动端优先，使用 Bottom Navigation，支持手势滑动操作，整体像一个 Native App。' },
  { id: 'game', label: '🎮 游戏化', prompt: '引入游戏化元素！加入等级、积分、徽章机制，界面采用赛博朋克深色风格，音效和动效必须要夸张吸睛。' },
  { id: 'kids', label: '🧒 儿童版', prompt: '将界面打造成儿童友好型。使用超大号肉肉的卡通字体，明亮鲜艳的前景色块，配合夸张可爱的动物吉祥物提示语音。' },
  { id: 'accessibility', label: '♿ 无障碍', prompt: '严格符合 WCAG 2.1 高级标准。全键盘操作支持，超高对比度模式，提供屏幕阅读器专属暗文，并配有色盲安全色板。' },
  { id: 'enterprise', label: '💼 企业级', prompt: '改为极简企业风格，集成数据报表仪表盘，色调改为严肃的深蓝与银灰，侧边栏折叠导航，界面信息密度极高。' }
];

const INTENSITY_LEVELS = [
  { value: 1, label: '极简复刻', desc: '原汁原味，只做最基础的迁移和运行', prompt: '仅需保证原有核心逻辑能够在新环境跑通即可，无需做任何界面的重构和多余的功能开发。' },
  { value: 2, label: '中等改造', desc: '修改 UI 并加入一些符合现代标准的特性', prompt: '在复原核心功能的基础上，请你对 UI 进行大修，并增加一些你觉得能大幅提升开发体验的常规能力。' },
  { value: 3, label: '深度魔改', desc: '彻底打破常规，赋予全新的产品灵魂', prompt: '请只保留原来的核心点子，其余所有代码、交互、产品形态你都可以彻底抛弃。大胆发挥你的想象力进行全方位的重新设计！' }
];

export default function RemixEnginePage({ params }) {
  const { slug } = use(params);
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Remix States
  const [intensity, setIntensity] = useState(2); // Default to Mid
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [customInput, setCustomInput] = useState('');
  
  // Preview States
  const [showAiModal, setShowAiModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Auth
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user);

      // Tool Data
      try {
        let data;
        const res = await fetch(`/api/tools/${slug}`);
        if (res.ok) data = await res.json();
        
        if (!data) {
          const fbRes = await fetch('/community/tools/index.json');
          if (fbRes.ok) {
            const all = await fbRes.json();
            data = all.find(t => t.id === slug || t.slug === slug);
          }
        }
        
        if (data) {
          data.iconLetter = (data.name || 'T').charAt(0).toUpperCase();
          setTool(data);
        }
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  const toggleVibe = (id) => {
    if (selectedVibes.includes(id)) {
      setSelectedVibes(selectedVibes.filter(v => v !== id));
    } else {
      setSelectedVibes([...selectedVibes, id]);
    }
  };

  const generatePrompt = () => {
    if (!tool) return '';
    
    const intent = INTENSITY_LEVELS.find(i => i.value === intensity);
    const vibes = VIBE_CATEGORIES.filter(v => selectedVibes.includes(v.id)).map(v => v.prompt);
    
    let p = `你好！我希望利用 AI 帮我复刻并 Remix 一款数字工具：「${tool.name}」。\n`;
    p += `功能概括：${tool.description}\n`;
    if (tool.repo_url || tool.repo) {
      p += `参考源码地址（如果支持分析）：${tool.repo_url || tool.repo}\n`;
    }
    
    p += `\n为了让此次复刻更有意思，我设定了如下的 Remix 规则，请你严格遵守：\n\n`;
    
    p += `【1. 魔改烈度：${intent.label}】\n${intent.prompt}\n\n`;
    
    if (vibes.length > 0) {
      p += `【2. 视觉与灵魂：灵感调味】\n`;
      vibes.forEach((txt, idx) => {
        p += ` - 思路包 ${idx+1}：${txt}\n`;
      });
      p += '\n';
    }
    
    if (customInput.trim().length > 0) {
      p += `【3. 额外咒语（我的私人定制）】\n${customInput}\n\n`;
    }
    
    p += `请你先简要概述理解到的 Remix 目标，然后开始输出第一阶段的核心代码或构架草图。`;
    
    return p;
  };

  const copyAndSaveRemix = async () => {
    const prompt = generatePrompt();
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setShowAiModal(true);
      setTimeout(() => setCopied(false), 3000);
    });

    // Save record to Supabase if logged in
    if (user && tool && tool.id) {
      setIsSaving(true);
      try {
        await supabase.from('remixes').insert({
          user_id: user.id,
          source_tool_id: tool.id,
          intensity_level: intensity,
          vibe_tags: selectedVibes,
          custom_prompt: customInput,
          full_prompt: prompt
        });
      } catch (e) {
        console.error('Save remix state failed:', e);
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (loading) return <div style={{ paddingTop: 140, textAlign: 'center', color: 'var(--text-muted)' }}>装载核心图纸中...</div>;
  if (!tool) return <div style={{ paddingTop: 140, textAlign: 'center', color: 'var(--text-muted)' }}>工具未找到</div>;

  const currentIntent = INTENSITY_LEVELS.find(i => i.value === intensity);

  return (
    <section className="section" style={{ paddingTop: 100, paddingBottom: 100 }}>
      {/* Dynamic Background subtle overlay */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: `linear-gradient(45deg, rgba(217,119,87,${intensity * 0.03}), transparent)`, pointerEvents: 'none', zIndex: -1 }}></div>

      <div className="container" style={{ maxWidth: 900 }}>
        
        <Link href={`/tool/${tool.slug}`} style={{ display: 'inline-block', marginBottom: 24, textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          ← 返回工具详情
        </Link>
        
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: 8 }}>
          <span style={{ fontWeight: 400 }}>Remix Workbench &mdash; </span>
          <span style={{ fontStyle: 'italic', fontWeight: 'bold' }}>{tool.name}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 40 }}>调整下方的刻度盘和灵感卡片，生成专属于你的 AI 开发魔咒。</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
          
          {/* Controls Settings Pane */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Intensity Slider */}
            <div className="remix-card" style={{ padding: 24, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>改写烈度 (Intensity)</h3>
                <span className="badge" style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>Level {intensity}</span>
              </div>
              <input 
                type="range" 
                min="1" max="3" step="1" 
                value={intensity} 
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                style={{ width: '100%', marginBottom: 16, accentColor: 'var(--text-primary)' }}
              />
              <p style={{ fontWeight: 600, margin: 0 }}>{currentIntent.label}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>{currentIntent.desc}</p>
            </div>

            {/* Vibes Checklist */}
            <div className="remix-card" style={{ padding: 24, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, marginBottom: 16 }}>灵感调味 (Vibes)</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {VIBE_CATEGORIES.map(v => {
                  const isActive = selectedVibes.includes(v.id);
                  return (
                    <button 
                      key={v.id}
                      onClick={() => toggleVibe(v.id)}
                      style={{
                        padding: '8px 16px', borderRadius: 20, border: '1px solid', cursor: 'pointer',
                        fontSize: '0.95rem', transition: 'all 0.2s',
                        background: isActive ? 'var(--text-primary)' : 'transparent',
                        color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        borderColor: isActive ? 'var(--text-primary)' : 'var(--border)'
                      }}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Extra Settings */}
            <div className="remix-card" style={{ padding: 24, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, marginBottom: 16 }}>自定义咒语 (Custom Spell)</h3>
              <textarea 
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                placeholder="例如：请确保用 Tailwind CSS，并在右上角加一个黑客猫的动图..."
                style={{
                  width: '100%', height: 100, padding: 12, borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg-primary)',
                  color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Preview Pane */}
          <div style={{
            position: 'sticky', top: 120, padding: 24, border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)', boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: 16, borderBottom: '1px solid var(--border-faint)', paddingBottom: 16 }}>
              ✨ Live Prompt Preview
            </h3>
            <pre style={{ 
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85rem', color: 'var(--text-secondary)',
              height: '400px', overflowY: 'auto', lineHeight: 1.6, paddingBottom: 16 
            }}>
              {generatePrompt()}
            </pre>
            
            <button 
              className="btn btn-primary" 
              onClick={copyAndSaveRemix}
              style={{ width: '100%', marginTop: 16, height: 48, fontSize: '1.05rem', opacity: isSaving ? 0.7 : 1 }}
              disabled={isSaving}
            >
              {isSaving ? '记录中...' : 'Copy Prompt 复制并启动'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 12 }}>
              {!user && '未登录状态：将不会保存该记录到云端'}
            </p>
          </div>

        </div>
      </div>

      {/* AI Platform Selection Modal */}
      {showAiModal && (
        <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) setShowAiModal(false); }}>
          <div className="modal modal-small">
            <button className="modal-close" onClick={() => setShowAiModal(false)}>×</button>
            <div className="modal-body">
              <h2 style={{ marginBottom: 8 }}>跳转到 AI 助手</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 24 }}>
                {copied ? '✅ Remix 咒语已复制进剪贴板！' : '咒语已复制！'}请选择您常用的 AI 并粘贴对话即可开始：
              </p>
              <div className="ai-grid">
                <a href="https://chatgpt.com/" target="_blank" className="ai-card" onClick={() => setShowAiModal(false)}>
                  <div className="ai-icon chatgpt" /><span>ChatGPT</span>
                </a>
                <a href="https://claude.ai/new" target="_blank" className="ai-card" onClick={() => setShowAiModal(false)}>
                  <div className="ai-icon claude" /><span>Claude</span>
                </a>
                <a href="https://doubao.com/chat/create/" target="_blank" className="ai-card" onClick={() => setShowAiModal(false)}>
                  <div className="ai-icon doubao" /><span>豆包</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
