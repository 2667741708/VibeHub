/**
 * 导出管理模块 / Export Manager Module
 * ======================================
 * 版本 / Version: 2.0.0 (新建)
 * 
 * 描述 / Description:
 *   汇总所有注释、对话和摘要，调用 Gemini Pro 生成完整的结构化总结文档。
 *   输出格式为 Markdown，含原始摘要、翻译、QA 精华和 Mermaid 思维导图。
 */

import { exportDocument } from './api.js';
import { annotationStore } from './annotation-bubble.js';
import { getSummary } from './sidebar.js';

/**
 * 执行导出 / Perform export
 */
export async function handleExport() {
  const annotations = annotationStore.getAllAnnotations();
  const summary = getSummary();

  if (annotations.length === 0 && !summary) {
    showToast('⚠️ 没有可导出的内容，请先进行阅读和批注');
    return;
  }

  showLoading('📦 正在使用 Pro 模型生成总结文档...');

  try {
    const data = await exportDocument(annotations, summary);
    hideLoading();

    // 创建下载 / Create download
    const blob = new Blob([data.document], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paper-notes-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('✅ 总结文档已下载');
  } catch (error) {
    hideLoading();
    showToast(`❌ 导出失败: ${error.message}`);
  }
}

function showLoading(text) {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  loadingText.textContent = text;
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
