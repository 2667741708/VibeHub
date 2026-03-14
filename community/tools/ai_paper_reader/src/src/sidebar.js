/**
 * 侧栏模块 / Sidebar Module
 * ===========================
 * 版本 / Version: 2.0.0
 * 修改基准 / Based on: v1.0.0
 * 
 * 修改内容 / Changes (v1.0.0 → v2.0.0):
 *   - [新增] 「历史」标签页，显示所有注释和对话
 *   - [新增] 与 annotationStore 集成，实时更新
 *   - [改进] 摘要面板支持 Markdown 渲染
 */

import { generateSummary, askQuestion } from './api.js';
import { annotationStore } from './annotation-bubble.js';
import { renderMarkdown } from './markdown-renderer.js';

let currentSummary = '';

export function initSidebar() {
  // 标签页切换 / Tab switching
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.querySelector(`[data-panel="${tab.dataset.tab}"]`);
      if (panel) panel.classList.add('active');
    });
  });

  // QA 发送
  const qaInput = document.getElementById('qaInput');
  const qaSend = document.getElementById('qaSend');
  qaSend.addEventListener('click', () => sendQA());
  qaInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendQA();
  });

  // 监听注释变化，更新历史面板
  annotationStore.onChange(renderHistory);
}

export async function handleSummary(paperText) {
  const panel = document.getElementById('summaryContent');
  panel.innerHTML = '<div class="summary-loading"><div class="loading-spinner"></div><p>AI 正在生成结构化摘要（Pro 模型）...</p></div>';

  try {
    const data = await generateSummary(paperText);
    currentSummary = data.summary;
    panel.innerHTML = `<div class="summary-rendered">${renderMarkdown(data.summary)}</div>`;
  } catch (error) {
    panel.innerHTML = `<div class="summary-error">❌ 摘要生成失败: ${error.message}</div>`;
  }
}

export function getSummary() {
  return currentSummary;
}

async function sendQA() {
  const input = document.getElementById('qaInput');
  const messages = document.getElementById('qaMessages');
  const question = input.value.trim();
  if (!question) return;

  input.value = '';

  // 显示用户消息
  messages.innerHTML += `<div class="qa-msg qa-user"><strong>你：</strong>${escapeHtml(question)}</div>`;
  messages.innerHTML += `<div class="qa-msg qa-loading" id="qaLoading">🤖 思考中...</div>`;
  messages.scrollTop = messages.scrollHeight;

  try {
    const data = await askQuestion(question);
    const loading = document.getElementById('qaLoading');
    if (loading) loading.remove();
    messages.innerHTML += `<div class="qa-msg qa-ai"><strong>AI：</strong>${renderMarkdown(data.answer)}</div>`;
    messages.scrollTop = messages.scrollHeight;
  } catch (error) {
    const loading = document.getElementById('qaLoading');
    if (loading) loading.remove();
    messages.innerHTML += `<div class="qa-msg qa-error">❌ ${error.message}</div>`;
  }
}

function renderHistory(annotations) {
  const container = document.getElementById('historyContent');
  if (!annotations || annotations.length === 0) {
    container.innerHTML = '<p class="placeholder-text">选中文本进行翻译或解释后，记录将显示在这里</p>';
    return;
  }

  const typeLabels = {
    translate: '🤖 翻译',
    explain: '📖 解释',
    ask: '❓ 提问',
    highlight: '🎨 高亮'
  };

  container.innerHTML = annotations.map(a => {
    const time = new Date(a.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const convCount = a.conversations.length;

    return `
      <div class="history-item" data-annotation-id="${a.id}">
        <div class="history-header">
          <span class="history-type">${typeLabels[a.type] || '📌'}</span>
          <span class="history-time">${time}</span>
          ${convCount > 0 ? `<span class="history-conv-count">💬${convCount}</span>` : ''}
        </div>
        <div class="history-original">"${escapeHtml(a.originalText.substring(0, 80))}${a.originalText.length > 80 ? '...' : ''}"</div>
        ${a.result ? `<div class="history-result">${escapeHtml(a.result.substring(0, 120))}${a.result.length > 120 ? '...' : ''}</div>` : ''}
        ${convCount > 0 ? `<div class="history-conversations">
          ${a.conversations.slice(-2).map(c => `
            <div class="history-conv-item">
              <span class="conv-q">Q: ${escapeHtml(c.question.substring(0, 50))}</span>
            </div>
          `).join('')}
        </div>` : ''}
      </div>
    `;
  }).join('');

  // 点击历史项滚动到对应气泡
  container.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.annotationId;
      const bubble = document.getElementById(`pinned-${id}`);
      if (bubble) bubble.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

// renderMarkdown 已从 markdown-renderer.js 导入
// renderMarkdown is imported from markdown-renderer.js

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
