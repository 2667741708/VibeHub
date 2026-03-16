import subprocess
import time

proc = subprocess.Popen(["python3", "/home/whm/Project/FocusDemo/run_focusdemo.py", "web", "--port", "5050"])
time.sleep(3)

try:
    result = subprocess.run([
        "curl", "-i", "-X", "OPTIONS", "http://localhost:5050/api/status",
        "-H", "Origin: http://localhost:3000",
        "-H", "Access-Control-Request-Method: GET",
        "-H", "Access-Control-Request-Headers: Content-Type"
    ], capture_output=True, text=True)
    print("CURL OUTPUT:")
    print(result.stdout)
finally:
    proc.terminate()
