#!/usr/bin/env python3
"""
build_index.py — VibeHub 工具索引生成器
========================================
扫描 community/tools/ 下所有工具目录的 manifest.json，
生成 community/tools/index.json 供前端动态加载。

用法:
  python engine/build_index.py
"""
import json, os, sys

TOOLS_DIR = os.path.join(os.path.dirname(__file__), '..', 'community', 'tools')

def build():
    tools = []
    tools_dir = os.path.abspath(TOOLS_DIR)

    if not os.path.isdir(tools_dir):
        print(f"Error: {tools_dir} not found", file=sys.stderr)
        sys.exit(1)

    for entry in sorted(os.listdir(tools_dir)):
        manifest_path = os.path.join(tools_dir, entry, 'manifest.json')
        if os.path.isfile(manifest_path):
            try:
                with open(manifest_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                # 确保 id 与目录名一致
                data['id'] = entry
                # 添加路径信息供前端使用
                data['path'] = f'tools/{entry}'
                tools.append(data)
                print(f"  ✓ {entry}: {data.get('name', 'unnamed')}")
            except Exception as e:
                print(f"  ✗ {entry}: {e}", file=sys.stderr)

    # 按 created 日期倒序排列
    tools.sort(key=lambda t: t.get('created', ''), reverse=True)

    output_path = os.path.join(tools_dir, 'index.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(tools, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 已生成 index.json，共 {len(tools)} 个工具")
    return tools

if __name__ == '__main__':
    build()
