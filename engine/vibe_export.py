#!/usr/bin/env python3
"""
vibe_export.py — 极简 Vibe 导出引擎
====================================
把你的代码 + 你的一句话意图，合并成一篇人人都能看懂的 .vibe.md 纯文本图纸。
任何人拿到这篇图纸，直接丢给 AI 就能跑、就能改。

用法:
  python vibe_export.py "我写了一个番茄钟工具" app.py
  python vibe_export.py "批量重命名照片" rename.py utils.py --name 照片整理助手
"""
import sys, os, argparse, datetime

def export(name, prompt, files):
    lines = []
    lines.append(f"# 🛠️ {name}\n")
    lines.append(f"> **创造者的话（Vibe）**：")
    lines.append(f'> "{prompt}"\n')
    lines.append(f"---\n")

    # 环境提示（极简）
    lines.append("## 📦 给你的 AI 助手看的说明")
    lines.append("> [AI-Guidance: 请读取下方所有代码块，在本地建立环境并运行。")
    lines.append(">  用户如果想修改，请直接根据他的自然语言要求改写代码后输出完整的新 .vibe.md]\n")

    # 逐个文件嵌入
    for fpath in files:
        if not os.path.isfile(fpath):
            print(f"⚠️  跳过不存在的文件: {fpath}", file=sys.stderr)
            continue

        fname = os.path.basename(fpath)
        ext = os.path.splitext(fname)[1].lstrip('.')
        lang = {'py':'python','js':'javascript','ts':'typescript','sh':'bash',
                'html':'html','css':'css','json':'json','md':'markdown'}.get(ext, ext)

        with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
            code = f.read()

        lines.append(f"## 💻 `{fname}`")
        lines.append(f"```{lang}")
        lines.append(code.rstrip())
        lines.append("```\n")

    # 尾部元数据（一行，足矣）
    ts = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    lines.append(f"---")
    lines.append(f"*由 VibeHub Engine 生成 · {ts}*")

    return '\n'.join(lines)

def main():
    p = argparse.ArgumentParser(description='极简 Vibe 导出引擎')
    p.add_argument('prompt', help='用一句话描述你这个工具做什么')
    p.add_argument('files', nargs='+', help='要打包进图纸的源码文件')
    p.add_argument('--name', '-n', default=None, help='工具名称（默认取第一个文件名）')
    p.add_argument('--output', '-o', default=None, help='输出文件名（默认: <name>.vibe.md）')
    args = p.parse_args()

    name = args.name or os.path.splitext(os.path.basename(args.files[0]))[0]
    md = export(name, args.prompt, args.files)

    out = args.output or f"{name}.vibe.md"
    with open(out, 'w', encoding='utf-8') as f:
        f.write(md)
    print(f"✅ 图纸已生成: {out}")

if __name__ == '__main__':
    main()
