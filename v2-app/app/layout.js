// VibeHub V2 — Root Layout
// [AI-Trace] 基于 v2-app/app/layout.js 修改 (修复 import 顺序)
// [EN] Root layout with Navbar, Footer, and AuthListener client component
// [ZH] 根布局：Navbar + Footer + AuthListener 客户端组件
//
// 修改内容 / Changes (vs 上一版本):
// - 将 import AuthListenerClient 移到文件顶部 (符合 ESM 规范)
// - 添加 AuthListenerClient 到 body 中

import './globals.css';
import AuthListenerClient from '@/components/AuthListener';

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
            <span className="nav-btn">GitHub 登录</span>
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
        <AuthListenerClient />
        {children}
        <Footer />
      </body>
    </html>
  );
}
