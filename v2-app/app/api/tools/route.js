// VibeHub V2 — API: GET /api/tools
// [AI-Trace] 新建文件 / New file
// [EN] Returns tool list from Supabase (falls back to static JSON)
// [ZH] 从 Supabase 返回工具列表（降级到静态 JSON）

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function GET() {
  // 尝试从 Supabase 读取
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('Supabase query failed, falling back to JSON:', e.message);
    }
  }

  // 降级：读取静态 index.json
  try {
    const jsonPath = path.join(process.cwd(), '..', 'community', 'tools', 'index.json');
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      return NextResponse.json(JSON.parse(raw));
    }
  } catch (e) {
    console.error('Failed to read static index.json:', e);
  }

  return NextResponse.json([], { status: 200 });
}
