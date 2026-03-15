// VibeHub V2 — Auth Callback Page
// [AI-Trace] 新建文件 / New file
// [EN] Handles the OAuth callback from Supabase/GitHub, then redirects to home
// [ZH] 处理 Supabase/GitHub 的 OAuth 回调，然后重定向到首页

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase 自动从 URL hash/query 中提取 token
    // 等待认证完成后跳转回首页
    const timer = setTimeout(() => {
      router.replace('/');
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <section className="hero" style={{ minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 24px'
        }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 8 }}>正在完成登录...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>请稍候，即将跳转回首页</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </section>
  );
}
