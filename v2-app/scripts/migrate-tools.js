#!/usr/bin/env node
// VibeHub V2 — 工具数据迁移脚本: index.json → Supabase tools 表
// [AI-Trace] 新建文件 / New file
// [EN] Migrates tools from static index.json to Supabase 'tools' table via REST API
// [ZH] 将静态 index.json 中的工具数据迁移到 Supabase tools 表

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ewjxsczhpphctmvxbrqh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VvPMNMgsP04NnE8FeQj4Eg_GhjEqZyH';

async function migrate() {
  const jsonPath = path.join(__dirname, '..', '..', 'community', 'tools', 'index.json');
  const tools = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  
  console.log(`📦 准备迁移 ${tools.length} 个工具到 Supabase...`);

  for (const tool of tools) {
    const row = {
      slug: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category || 'dev',
      tags: tool.tags || [],
      language: tool.language || null,
      requirements: tool.requirements || null,
      entry_url: tool.entry || null,
      repo_url: tool.repo || null,
      author_name: tool.author?.name || null,
      author_link: tool.author?.link || null,
      created_at: tool.created ? new Date(tool.created).toISOString() : new Date().toISOString(),
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(row),
    });

    if (res.ok || res.status === 201 || res.status === 200) {
      console.log(`  ✅ ${tool.name}`);
    } else {
      const err = await res.text();
      console.log(`  ❌ ${tool.name}: ${res.status} — ${err}`);
    }
  }

  // 验证
  const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/tools?select=slug,name&order=created_at.desc`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });
  const inserted = await verifyRes.json();
  console.log(`\n🎉 Supabase tools 表现有 ${inserted.length} 条记录:`);
  inserted.forEach(t => console.log(`   • ${t.name} (${t.slug})`));
}

migrate().catch(console.error);
