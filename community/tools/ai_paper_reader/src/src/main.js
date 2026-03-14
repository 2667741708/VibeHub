/**
 * 主应用入口 / Main Application Entry
 * =====================================
 * 版本 / Version: 3.1.0
 * 修改基准 / Based on: v2.0.0
 * 
 * 修改内容 / Changes (v2.0.0 → v3.1.0):
 *   - [新增] 引擎切换器 CLI/API
 *     [New] Engine toggle CLI/API
 *   - [新增] API Key 输入与持久化 (localStorage)
 *     [New] API Key input with localStorage persistence
 *   - [继承] 模型选择器、导出按钮绑定
 */

import { initPDFViewer, getPDFText } from './pdf-viewer.js';
import { initBubbleTranslator } from './bubble-translator.js';
import { initSidebar, handleSummary } from './sidebar.js';
import { handleExport } from './export-manager.js';
import { uploadPDF, setModel, setEngine, modelConfig } from './api.js';
import { annotationStore } from './annotation-bubble.js';

// ==================== 初始化 / Initialization ====================

document.addEventListener('DOMContentLoaded', () => {
  initPDFViewer();
  initBubbleTranslator();
  initSidebar();
  bindToolbarEvents();
  bindEngineToggle();
  bindKeyboardShortcuts();
  restoreEngineState();

  console.log('🔬 AI Paper Reader V3.1 已初始化 / Initialized');
});

// ==================== 工具栏事件 / Toolbar Events ====================

function bindToolbarEvents() {
  // 文件上传
  const fileInput = document.getElementById('fileInput');
  document.getElementById('uploadBtn').addEventListener('click', () => fileInput.click());
  document.getElementById('welcomeUpload')?.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await handleFileUpload(file);
  });

  // 摘要
  document.getElementById('summaryBtn').addEventListener('click', async () => {
    const text = getPDFText();
    if (!text) return showToast('请先上传 PDF 文件');
    showSidebar();
    // 切换到摘要标签
    document.querySelector('[data-tab="summary"]').click();
    await handleSummary(text);
  });

  // 导出
  document.getElementById('exportBtn').addEventListener('click', handleExport);

  // 侧栏切换
  document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);

  // 翻页
  document.getElementById('prevPage').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('pdf-prev-page'));
  });
  document.getElementById('nextPage').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('pdf-next-page'));
  });

  // 缩放
  document.getElementById('zoomIn').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('pdf-zoom', { detail: 0.1 }));
  });
  document.getElementById('zoomOut').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('pdf-zoom', { detail: -0.1 }));
  });

  // 模型选择器
  document.getElementById('modelSelect').addEventListener('change', (e) => {
    const model = e.target.value;
    setModel('translate', model);
    setModel('explain', model);
    setModel('qa', model);
    showToast(`已切换到 ${model === 'pro' ? 'Pro (精准)' : 'Flash (快速)'} 模型`);
  });
}

// ==================== 引擎切换 / Engine Toggle ====================

function bindEngineToggle() {
  const toggle = document.getElementById('engineToggle');
  const apiKeyWrap = document.getElementById('apiKeyWrap');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const apiKeySet = document.getElementById('apiKeySet');

  // CLI / API 按钮切换
  toggle.addEventListener('click', async (e) => {
    const btn = e.target.closest('.engine-btn');
    if (!btn) return;

    const engine = btn.dataset.engine;
    toggle.querySelectorAll('.engine-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (engine === 'api') {
      apiKeyWrap.classList.remove('hidden');
      // 尝试从 localStorage 恢复 API Key
      const saved = localStorage.getItem('gemini-api-key');
      if (saved) {
        apiKeyInput.value = saved;
        await switchToAPI(saved);
      }
    } else {
      apiKeyWrap.classList.add('hidden');
      const result = await setEngine('cli');
      if (result.success) showToast('已切换到 Gemini CLI 引擎');
    }
  });

  // API Key 确认按钮
  apiKeySet.addEventListener('click', () => submitApiKey(apiKeyInput));
  apiKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitApiKey(apiKeyInput);
  });
}

async function submitApiKey(input) {
  const key = input.value.trim();
  if (!key) return showToast('请输入 API Key');
  await switchToAPI(key);
}

async function switchToAPI(key) {
  try {
    const result = await setEngine('api', key);
    if (result.success) {
      localStorage.setItem('gemini-api-key', key);
      showToast('⚡ 已切换到 REST API 引擎 (更快)');
    } else {
      showToast(result.error || '引擎切换失败');
    }
  } catch (err) {
    showToast('引擎切换失败: ' + err.message);
  }
}

/** 恢复上次引擎设置 / Restore engine state from localStorage */
function restoreEngineState() {
  const savedKey = localStorage.getItem('gemini-api-key');
  const savedEngine = localStorage.getItem('gemini-engine') || 'cli';

  if (savedEngine === 'api' && savedKey) {
    // 自动切换到 API 模式
    const toggle = document.getElementById('engineToggle');
    toggle.querySelectorAll('.engine-btn').forEach(b => b.classList.remove('active'));
    toggle.querySelector('[data-engine="api"]').classList.add('active');
    document.getElementById('apiKeyWrap').classList.remove('hidden');
    document.getElementById('apiKeyInput').value = savedKey;
    switchToAPI(savedKey);
  }
}

// ==================== 文件上传 / File Upload ====================

async function handleFileUpload(file) {
  if (file.type !== 'application/pdf') {
    showToast('请上传 PDF 文件');
    return;
  }

  showLoading(`正在上传和解析: ${file.name}`);

  try {
    const data = await uploadPDF(file);
    hideLoading();

    // 更新文档标题
    document.getElementById('docTitle').textContent = file.name;

    // 隐藏欢迎页
    const welcome = document.getElementById('welcomeScreen');
    if (welcome) welcome.style.display = 'none';

    // 在 PDF 查看器中加载
    window.dispatchEvent(new CustomEvent('pdf-load-file', { detail: file }));

    showToast(`✅ 已加载: ${file.name} (${data.totalPages} 页)`);

    // 清空之前的注释
    annotationStore.clear();

  } catch (error) {
    hideLoading();
    showToast(`❌ 上传失败: ${error.message}`);
  }
}

// ==================== 键盘快捷键 / Keyboard Shortcuts ====================

function bindKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+O: 上传
    if (e.ctrlKey && e.key === 'o') {
      e.preventDefault();
      document.getElementById('fileInput').click();
    }
    // Ctrl+B: 侧栏
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
    }
    // 左右箭头翻页
    if (e.key === 'ArrowLeft' && !e.target.closest('input, textarea')) {
      window.dispatchEvent(new CustomEvent('pdf-prev-page'));
    }
    if (e.key === 'ArrowRight' && !e.target.closest('input, textarea')) {
      window.dispatchEvent(new CustomEvent('pdf-next-page'));
    }
  });
}

// ==================== 辅助函数 / Utilities ====================

function showSidebar() {
  document.getElementById('sidebar').classList.remove('hidden');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('hidden');
}

function showLoading(text) {
  const overlay = document.getElementById('loadingOverlay');
  document.getElementById('loadingText').textContent = text;
  overlay.classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}
