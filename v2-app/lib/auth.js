// VibeHub V2 — Auth Utilities
// [AI-Trace] 新建文件 / New file
// [EN] Authentication helpers using Supabase Auth for GitHub OAuth
// [ZH] 使用 Supabase Auth 的 GitHub OAuth 认证辅助函数

import { supabase } from './supabase';

/**
 * 使用 GitHub 登录
 * Supabase 会自动跳转到 GitHub 授权页面
 */
export async function signInWithGitHub() {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return;
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : undefined,
    },
  });

  if (error) {
    console.error('GitHub login error:', error.message);
  }

  return { data, error };
}

/**
 * 登出
 */
export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Sign out error:', error.message);
}

/**
 * 获取当前会话用户
 */
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * 监听认证状态变化
 */
export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange(callback);
}
