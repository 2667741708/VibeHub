// VibeHub V2 — AuthListener Client Component
// [AI-Trace] 新建文件 / New file
// [EN] Client component that listens for auth state changes and updates the Navbar login button
// [ZH] 客户端组件：监听认证状态变化并动态更新 Navbar 的登录按钮

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { signInWithGitHub, signOut } from '@/lib/auth';

export default function AuthListenerClient() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!supabase) return;

    // 获取当前会话
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      updateNavbar(user);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        updateNavbar(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  function updateNavbar(user) {
    const container = document.getElementById('auth-container');
    if (!container) return;

    if (user) {
      const avatar = user.user_metadata?.avatar_url || '';
      const name = user.user_metadata?.user_name || user.email || 'User';
      container.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px">
          <img src="${avatar}" alt="${name}" 
               style="width:32px;height:32px;border-radius:50%;border:1px solid var(--border)" />
          <span style="font-size:0.85rem;color:var(--text-primary);font-weight:500">${name}</span>
          <button id="logout-btn" class="nav-btn" style="font-size:0.78rem;padding:6px 14px;cursor:pointer">登出</button>
        </div>
      `;
      document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await signOut();
        window.location.reload();
      });
    } else {
      container.innerHTML = `
        <button id="login-btn" class="nav-btn" style="cursor:pointer">GitHub 登录</button>
      `;
      document.getElementById('login-btn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await signInWithGitHub();
      });
    }
  }

  return null; // 纯逻辑组件，不渲染 UI
}
