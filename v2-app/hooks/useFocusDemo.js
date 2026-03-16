// VibeHub V2 — hooks/useFocusDemo.js
// [AI-Trace] 新建文件 / New file
// [EN] Custom hook to manage connection and recording state with local FocusDemo daemon
// [ZH] 自定义 Hook: 管理与本地 FocusDemo 守护进程的连接和录制状态

import { useState, useEffect, useCallback } from 'react';

const FOCUSDEMO_API = 'http://localhost:5050/api';

export function useFocusDemo() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [config, setConfig] = useState({});
  const [error, setError] = useState(null);

  // 1. 探活检测 (Ping daemon)
  const checkConnection = useCallback(async () => {
    try {
      const res = await fetch(`${FOCUSDEMO_API}/status`, { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIsConnected(true);
        setIsRecording(data.is_recording);
        setElapsed(data.elapsed_formatted || '00:00:00');
        setConfig(data.config || {});
        setError(null);
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      setIsConnected(false);
      setIsRecording(false);
    }
  }, []);

  // initial check
  useEffect(() => {
    checkConnection();
    // 轮询检查连接状态 (fallback 如果不使用 SSE)
    const timer = setInterval(checkConnection, 3000);
    return () => clearInterval(timer);
  }, [checkConnection]);


  // 2. 发起录制 (Start Recording)
  const startRecording = async (options = {}) => {
    try {
      setError(null);
      
      // 先更新配置 (如果需要)
      if (Object.keys(options).length > 0) {
        await fetch(`${FOCUSDEMO_API}/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options)
        });
      }

      // 启动
      const res = await fetch(`${FOCUSDEMO_API}/record/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `vibehub_${Date.now()}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '无法启动录制');
      }
      setIsRecording(true);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // 3. 停止录制 (Stop Recording)
  const stopRecording = async () => {
    try {
      setError(null);
      const res = await fetch(`${FOCUSDEMO_API}/record/stop`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '无法停止录制');
      }
      setIsRecording(false);
      setElapsed('00:00:00');
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    isConnected,
    isRecording,
    elapsed,
    config,
    error,
    checkConnection,
    startRecording,
    stopRecording
  };
}
