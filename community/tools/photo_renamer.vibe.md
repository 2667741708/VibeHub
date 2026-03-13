# 📸 照片批量整理器

> **创造者的话（Vibe）**：
> "我手机里有几千张照片导到电脑上，文件名全是 IMG_20260101_123456.jpg 这种乱码。我想把它们按 '年-月' 自动分到不同文件夹里，并且重命名成 '2026年1月_001.jpg' 这种人能看懂的名字。"

---

## 📦 给你的 AI 助手看的说明
> [AI-Guidance: 请读取下方所有代码块，在本地建立环境并运行。
>  用户如果想修改，请直接根据他的自然语言要求改写代码后输出完整的新 .vibe.md]
> - **环境要求**: Python 3.8+, 标准库即可
> - **运行方式**: `python photo_renamer.py /path/to/photos`

## 💻 `photo_renamer.py`
```python
import os
import re
import shutil
import sys
from datetime import datetime

def extract_date(filename):
    """从文件名中提取日期信息"""
    patterns = [
        r'(\d{4})(\d{2})(\d{2})',          # 20260101
        r'(\d{4})-(\d{2})-(\d{2})',        # 2026-01-01
        r'(\d{4})_(\d{2})_(\d{2})',        # 2026_01_01
    ]
    for p in patterns:
        m = re.search(p, filename)
        if m:
            y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
            if 2000 <= y <= 2099 and 1 <= mo <= 12 and 1 <= d <= 31:
                return y, mo
    # 退回到文件修改时间
    return None

def organize(folder):
    if not os.path.isdir(folder):
        print(f"❌ 文件夹不存在: {folder}")
        return

    exts = {'.jpg', '.jpeg', '.png', '.heic', '.gif', '.mp4', '.mov'}
    files = [f for f in os.listdir(folder)
             if os.path.splitext(f)[1].lower() in exts]

    print(f"📸 找到 {len(files)} 个媒体文件")
    counters = {}

    for f in sorted(files):
        date = extract_date(f)
        if not date:
            mtime = os.path.getmtime(os.path.join(folder, f))
            dt = datetime.fromtimestamp(mtime)
            date = (dt.year, dt.month)

        y, mo = date
        subfolder = f"{y}年{mo:02d}月"
        dest_dir = os.path.join(folder, subfolder)
        os.makedirs(dest_dir, exist_ok=True)

        key = (y, mo)
        counters[key] = counters.get(key, 0) + 1
        ext = os.path.splitext(f)[1]
        new_name = f"{y}年{mo}月_{counters[key]:03d}{ext}"

        src = os.path.join(folder, f)
        dst = os.path.join(dest_dir, new_name)
        shutil.move(src, dst)
        print(f"  ✅ {f} → {subfolder}/{new_name}")

    print(f"\n🎉 整理完成！共处理 {len(files)} 个文件")

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "."
    organize(path)
```

---
*由 VibeHub 社区分享 · 直接 Fork: 28 · 间接 Fork: 67 · 2026-03-12*
