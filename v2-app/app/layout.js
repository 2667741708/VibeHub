// VibeHub V2 — Root Layout
// [AI-Trace] 新建文件 / New file
// [EN] Root layout with Navbar and Footer, global CSS and fonts
// [ZH] 根布局组件，包含导航栏与页脚、全局样式与字体引入

import './globals.css';

export const metadata = {
  title: 'VibeHub — 人人皆可编程的工具社区',
  description: '发现并使用强大的 AI 工具。VibeHub 是一个让普通人也能用 AI 运行、分享数字工具的开源社区。',
};

function Navbar() {
  return (
    <nav className="navbar" id="navbar">
      <div className="nav-container">
        <a href="/" className="nav-logo">
          <span className="logo-text"><i>VibeHub</i></span>
        </a>
        <div className="nav-links">
          <a href="/explore" className="nav-link">发现工具</a>
          <a href="/#how" className="nav-link">使用指南</a>
          <a href="/publish" className="nav-link">发布工具</a>
          <div id="auth-container">
            <a href="/api/auth/login" className="nav-btn" id="login-btn">GitHub 登录</a>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <i>VibeHub</i>
            <p>让每个人都能用自然语言解决生活中的小问题。</p>
          </div>
          <div className="footer-links">
            <a href="https://github.com/2667741708/VibeHub" target="_blank">GitHub</a>
            <a href="#">关于我们</a>
            <a href="#">社区公约</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 VibeHub · 开源 · 人人皆可使用</p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
