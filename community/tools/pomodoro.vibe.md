# 🍅 番茄工作法锁屏助手

> **创造者的话（Vibe）**：
> "我总是控制不住自己玩手机，我想要一个工具：每工作 25 分钟，就弹出全屏提醒休息 5 分钟，屏幕上用巨大的红色字显示倒计时和一句鼓励的话。"

---

## 📦 给你的 AI 助手看的说明
> [AI-Guidance: 请读取下方所有代码块，在本地建立环境并运行。
>  用户如果想修改，请直接根据他的自然语言要求改写代码后输出完整的新 .vibe.md]
> - **环境要求**: Python 3.8+, tkinter（大多数系统自带）

## 💻 `pomodoro.py`
```python
import tkinter as tk
import time
import threading

class PomodoroApp:
    def __init__(self):
        self.work_min = 25
        self.rest_min = 5
        self.messages = [
            "你已经很棒了，休息一下吧！🌟",
            "站起来走走，喝杯水 💧",
            "闭眼深呼吸三次 🧘",
            "看看窗外的风景 🌳",
        ]
        self.msg_idx = 0

    def show_rest_screen(self):
        """全屏显示休息提醒"""
        root = tk.Tk()
        root.attributes('-fullscreen', True)
        root.configure(bg='#1a1a2e')
        root.attributes('-topmost', True)

        msg = self.messages[self.msg_idx % len(self.messages)]
        self.msg_idx += 1

        tk.Label(root, text="🍅 休息时间！", font=("Arial", 72, "bold"),
                 fg="#e94560", bg="#1a1a2e").pack(expand=True)
        tk.Label(root, text=msg, font=("Arial", 36),
                 fg="#eee", bg="#1a1a2e").pack(expand=True)

        countdown = tk.Label(root, text="", font=("Arial", 48),
                             fg="#0f3460", bg="#1a1a2e")
        countdown.pack(expand=True)

        def update(seconds_left):
            if seconds_left <= 0:
                root.destroy()
                return
            m, s = divmod(seconds_left, 60)
            countdown.config(text=f"{m:02d}:{s:02d}")
            root.after(1000, update, seconds_left - 1)

        update(self.rest_min * 60)
        root.mainloop()

    def run(self):
        print("🍅 番茄钟已启动！每 25 分钟提醒你休息。按 Ctrl+C 退出。")
        try:
            while True:
                time.sleep(self.work_min * 60)
                print("⏰ 工作时间到！弹出休息提醒...")
                self.show_rest_screen()
                print("✅ 休息结束，继续加油！")
        except KeyboardInterrupt:
            print("\n👋 番茄钟已关闭，再见！")

if __name__ == "__main__":
    PomodoroApp().run()
```

---
*由 VibeHub 社区分享 · 直接 Fork: 12 · 间接 Fork: 34 · 2026-03-13*
