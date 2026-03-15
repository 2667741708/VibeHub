// VibeHub V2 — Home Page
// [AI-Trace] 新建文件 / New file
// [EN] Landing page with Hero section, How-to steps, and featured tools preview
// [ZH] 首页：Hero 区、使用指南步骤、精选工具预览

import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="hero-content" style={{ maxWidth: 720 }}>
          <div className="hero-badge">高端数字工作台</div>
          <h1 className="hero-title">
            用自然语言，<br />
            <span className="gradient-text">解决生活的小问题</span>
          </h1>
          <p className="hero-desc">
            在 VibeHub，你可以找到成百上千个实用的数字工具。<br />
            <strong>无需安装，不用懂代码，复制给 AI 就能直接用。</strong>
          </p>
          <div className="hero-actions">
            <Link href="/explore" className="btn btn-primary">浏览工具库</Link>
            <a href="#how" className="btn btn-ghost">怎么使用？</a>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">1,247</span>
              <span className="stat-label">个实用工具</span>
            </div>
            <div className="stat">
              <span className="stat-num">8,934</span>
              <span className="stat-label">次被使用</span>
            </div>
            <div className="stat">
              <span className="stat-num">362</span>
              <span className="stat-label">位创造者</span>
            </div>
          </div>
        </div>
      </section>

      {/* 使用指南 */}
      <section className="section" id="how">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">极其简单的使用方法</h2>
            <p className="section-desc">不懂编程也没关系，只要三步就能用上强大的工具。</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-num">01</div>
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3>找到你需要的工具</h3>
              <p>在工具库中，搜索能解决你当下需求的小助手。比如：&quot;番茄钟&quot;或&quot;照片重命名&quot;。</p>
            </div>
            <div className="step-card">
              <div className="step-num">02</div>
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </div>
              <h3>一键复制图纸</h3>
              <p>点击工具卡片，你会看到详细功能。直接点击大大的「<strong>复制图纸</strong>」按钮。</p>
            </div>
            <div className="step-card">
              <div className="step-num">03</div>
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3>交给 AI 运行</h3>
              <p>把复制好的图纸，粘贴发给你的 AI 助手 (如 ChatGPT, Claude, 豆包等)，它就会马上为你运行这个工具！</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
