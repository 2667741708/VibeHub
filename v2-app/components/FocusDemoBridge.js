// VibeHub V2 — components/FocusDemoBridge.js
// [AI-Trace] 新建文件 / New file
// [EN] UI Component to control local FocusDemo daemon from the web
// [ZH] UI 组件：从网页端直接控制本地 FocusDemo 录屏守护进程

'use client';

import { useFocusDemo } from '@/hooks/useFocusDemo';
import { useState } from 'react';

export default function FocusDemoBridge() {
  const { isConnected, isRecording, elapsed, startRecording, stopRecording, error } = useFocusDemo();
  const [loading, setLoading] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // If not connected, show a guide to download/start the local daemon
  if (!isConnected) {
    return (
      <div style={{
        padding: '20px', 
        background: 'var(--bg-secondary)', 
        borderRadius: 'var(--radius-md)', 
        border: '1px dashed var(--border)',
        marginTop: 32,
        textAlign: 'center'
      }}>
        <h4 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--text-muted)', borderRadius: '50%' }} />
          未检测到本地 FocusDemo 引擎
        </h4>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          想不离开网页直接录制带有鼠标追踪缩放、键盘按键特效的高级演示视频？<br/>
          请先在本地运行 <code>python run_focusdemo.py web --port 5050</code>。
        </p>
        <button 
          className="btn btn-ghost" 
          style={{ fontSize: '0.85rem', textDecoration: 'underline' }}
          onClick={() => setShowTips(!showTips)}
        >
          {showTips ? '收起安装指南' : '如何安装和运行？'}
        </button>

        {showTips && (
          <div style={{ textAlign: 'left', background: 'var(--bg-primary)', padding: '16px', borderRadius: 8, marginTop: 16, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>克隆 VibeHub 仓库到本地</li>
              <li>进入 <code>FocusDemo</code> 目录</li>
              <li>执行 <code>pip install -r requirements.txt</code></li>
              <li>执行 <code>python run_focusdemo.py web</code> 保持后台运行</li>
            </ol>
            <p style={{ marginTop: 12, marginBottom: 0, fontStyle: 'italic' }}>
              💡 未来将提供 Windows/Mac 一键安装包，敬请期待。
            </p>
          </div>
        )}
      </div>
    );
  }

  // Connected state: Show recording controls
  return (
    <div style={{
      padding: '24px', 
      background: 'var(--bg-secondary)', 
      borderRadius: 'var(--radius-lg)', 
      border: '1px solid var(--border-faint)',
      boxShadow: 'var(--shadow-sm)',
      marginTop: 32
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h4 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ 
              display: 'inline-block', width: 10, height: 10, 
              background: isRecording ? '#ef4444' : '#10b981', 
              borderRadius: '50%',
              boxShadow: isRecording ? '0 0 8px #ef4444' : '0 0 8px #10b981'
            }} />
            FocusDemo 引擎已就绪
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            在当前设备上检测到录制守护进程 (localhost:5050)。
          </p>
        </div>
        
        {isRecording && (
          <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#ef4444', background: '#fee2e2', padding: '4px 12px', borderRadius: 6 }}>
            {elapsed}
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', fontSize: '0.85rem', borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {!isRecording ? (
          <button 
            className="btn btn-primary"
            onClick={async () => {
              setLoading(true);
              try { await startRecording({ click_zoom_enabled: true, spotlight_enabled: true }); }
              finally { setLoading(false); }
            }}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ef4444', color: 'white', border: 'none' }}
          >
            <div style={{ width: 12, height: 12, background: 'white', borderRadius: '50%' }} />
            {loading ? '启动中...' : '开始神仙级录制'}
          </button>
        ) : (
          <button 
            className="btn btn-primary"
            onClick={async () => {
              setLoading(true);
              try { await stopRecording(); }
              finally { setLoading(false); }
            }}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none' }}
          >
            <div style={{ width: 12, height: 12, background: 'var(--bg-primary)', borderRadius: '2px' }} />
            {loading ? '停止中...' : '结束录制并处理视频'}
          </button>
        )}

        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {isRecording ? "结束录制后，视频会自动保存在你的 recordings 文件夹中。" : "点击开始后即可去任意窗口操作。按 F9 可直接在后台停止。"}
        </span>
      </div>
    </div>
  );
}
