import time
import requests
import sys

def test_speed():
    """通过下载一个公共测试文件来估算网速"""
    # 使用一个约 10MB 的公开文件来测速
    url = "http://speedtest.tele2.net/10MB.zip"
    print("📶 正在测速，请稍候...")

    try:
        start = time.time()
        r = requests.get(url, stream=True, timeout=30)
        total = 0
        for chunk in r.iter_content(chunk_size=8192):
            total += len(chunk)
        elapsed = time.time() - start

        speed_mbps = (total * 8) / (elapsed * 1_000_000)

        print(f"\n{'='*40}")
        print(f"  📊 测速结果")
        print(f"{'='*40}")
        print(f"  下载速度: {speed_mbps:.1f} Mbps")
        print(f"  下载耗时: {elapsed:.1f} 秒")
        print(f"  数据量:   {total / 1_000_000:.1f} MB")
        print(f"{'='*40}")

        if speed_mbps >= 50:
            print("  ✅ 网速非常好！尽情冲浪吧 🏄")
        elif speed_mbps >= 10:
            print("  👍 网速正常，日常使用没问题")
        elif speed_mbps >= 2:
            print("  ⚠️  网速偏慢，视频可能会卡顿")
            print("  💡 建议：靠近路由器试试，或重启路由器")
        else:
            print("  ❌ 网速确实很慢！")
            print("  💡 建议：1.重启路由器  2.检查是否有人在下载大文件  3.联系运营商")

    except requests.exceptions.Timeout:
        print("❌ 连接超时，网络可能有问题")
        print("💡 建议：检查WiFi连接是否正常")
    except Exception as e:
        print(f"❌ 测速失败: {e}")

if __name__ == "__main__":
    test_speed()
