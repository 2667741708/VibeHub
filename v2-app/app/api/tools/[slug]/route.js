// VibeHub V2 — API: GET /api/tools/[slug]
// [AI-Trace] 新建文件 / New file
// [EN] Returns single tool detail by slug from Supabase (falls back to static JSON)
// [ZH] 通过 slug 从 Supabase 返回单个工具详情（降级到静态 JSON）

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  const { slug } = await params;

  // 尝试 Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        return NextResponse.json(data);
      }
    } catch (e) {}
  }

  // 降级：静态 JSON
  try {
    const jsonPath = path.join(process.cwd(), '..', 'community', 'tools', 'index.json');
    if (fs.existsSync(jsonPath)) {
      const all = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      const tool = all.find(t => t.id === slug || t.slug === slug);
      if (tool) return NextResponse.json(tool);
    }
  } catch (e) {}

  return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
}
