/**
 * 持久化注释气泡模块 / Persistent Annotation Bubble Module
 * =========================================================
 * 版本 / Version: 3.2.0
 * 修改基准 / Based on: v2.0.0
 * 
 * 修改内容 / Changes (v2.0.0 → v3.2.0):
 *   - [移除] Emoji 图标改为纯文本标签
 *     [Remove] Emoji icons replaced with plain text labels
 *   - [继承] 持久气泡、折叠、对话等所有功能
 */

import { bubbleQA } from './api.js';
import { renderMarkdown } from './markdown-renderer.js';

class AnnotationStore {
  constructor() {
    this.annotations = [];
    this.listeners = [];
    this.idCounter = 0;
  }

  /** 注册变化监听器 */
  onChange(callback) {
    this.listeners.push(callback);
  }

  /** 通知所有监听器 */
  notify() {
    this.listeners.forEach(fn => fn(this.annotations));
  }

  /** 创建注释 */
  createAnnotation({ originalText, type, result, range }) {
    const annotation = {
      id: ++this.idCounter,
      originalText,
      type,        // 'translate' | 'explain' | 'ask' | 'highlight'
      result,
      conversations: [],
      timestamp: Date.now(),
      collapsed: false
    };

    this.annotations.push(annotation);
    this.renderPinnedBubble(annotation, range);
    this.notify();
    return annotation;
  }

  /** 在 PDF 视图中渲染固定气泡 */
  renderPinnedBubble(annotation, range) {
    const bubble = document.createElement('div');
    bubble.className = `pinned-bubble pinned-${annotation.type}`;
    bubble.dataset.annotationId = annotation.id;
    bubble.id = `pinned-${annotation.id}`;

    const typeLabels = {
      translate: '翻译',
      explain: '解释',
      ask: '提问',
      highlight: '高亮'
    };

    bubble.innerHTML = `
      <div class="pinned-header" data-toggle="${annotation.id}">
        <span class="pinned-type">${typeLabels[annotation.type] || '📌 批注'}</span>
        <span class="pinned-preview">${annotation.originalText.substring(0, 40)}...</span>
        <button class="pinned-toggle">▼</button>
        <button class="pinned-remove" data-remove="${annotation.id}">✕</button>
      </div>
      <div class="pinned-body" id="pinned-body-${annotation.id}">
        <div class="pinned-original">${escapeHtml(annotation.originalText)}</div>
        ${annotation.result ? `<div class="pinned-result md-content">${renderMarkdown(annotation.result)}</div>` : ''}
        <div class="pinned-chat" id="pinned-chat-${annotation.id}">
          ${annotation.conversations.map(c => `
            <div class="chat-msg chat-user">Q: ${escapeHtml(c.question)}</div>
            <div class="chat-msg chat-ai md-content">${renderMarkdown(c.answer)}</div>
          `).join('')}
        </div>
        <div class="pinned-input-area">
          <input type="text" class="pinned-input" placeholder="在此追问..." data-input="${annotation.id}" />
          <button class="pinned-send" data-send="${annotation.id}">发送</button>
        </div>
      </div>
    `;

    // 事件绑定 / Event bindings
    bubble.querySelector(`[data-toggle="${annotation.id}"]`).addEventListener('click', (e) => {
      if (e.target.closest('.pinned-remove')) return;
      this.toggleBubble(annotation.id);
    });

    bubble.querySelector(`[data-remove="${annotation.id}"]`).addEventListener('click', () => {
      this.removeAnnotation(annotation.id);
    });

    const input = bubble.querySelector(`[data-input="${annotation.id}"]`);
    const sendBtn = bubble.querySelector(`[data-send="${annotation.id}"]`);

    sendBtn.addEventListener('click', () => this.sendBubbleChat(annotation.id));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendBubbleChat(annotation.id);
    });

    // 插入到 PDF 内容区域 / Insert into PDF content area
    const pdfPages = document.getElementById('pdfPages');
    if (pdfPages) {
      pdfPages.appendChild(bubble);
    }

    // 如果是 ask 类型，自动聚焦到输入框
    if (annotation.type === 'ask') {
      setTimeout(() => input.focus(), 100);
    }
  }

  /** 折叠/展开气泡 */
  toggleBubble(id) {
    const annotation = this.annotations.find(a => a.id === id);
    if (!annotation) return;
    annotation.collapsed = !annotation.collapsed;

    const body = document.getElementById(`pinned-body-${id}`);
    const toggle = document.querySelector(`#pinned-${id} .pinned-toggle`);
    if (body) {
      body.classList.toggle('collapsed', annotation.collapsed);
      if (toggle) toggle.textContent = annotation.collapsed ? '▶' : '▼';
    }
  }

  /** 删除注释 */
  removeAnnotation(id) {
    this.annotations = this.annotations.filter(a => a.id !== id);
    const el = document.getElementById(`pinned-${id}`);
    if (el) el.remove();
    this.notify();
  }

  /** 气泡内发送对话 */
  async sendBubbleChat(id) {
    const annotation = this.annotations.find(a => a.id === id);
    if (!annotation) return;

    const input = document.querySelector(`[data-input="${id}"]`);
    const question = input.value.trim();
    if (!question) return;

    input.value = '';
    const chatArea = document.getElementById(`pinned-chat-${id}`);

    // 显示用户消息
    chatArea.innerHTML += `<div class="chat-msg chat-user">Q: ${escapeHtml(question)}</div>`;
    chatArea.innerHTML += `<div class="chat-msg chat-loading" id="chat-loading-${id}">思考中...</div>`;
    chatArea.scrollTop = chatArea.scrollHeight;

    try {
      const data = await bubbleQA(question, annotation.originalText, annotation.conversations);
      const answer = data.answer;

      annotation.conversations.push({ question, answer });

      // 替换 loading
      const loading = document.getElementById(`chat-loading-${id}`);
      if (loading) loading.remove();
      chatArea.innerHTML += `<div class="chat-msg chat-ai md-content">${renderMarkdown(answer)}</div>`;
      chatArea.scrollTop = chatArea.scrollHeight;

      this.notify();
    } catch (error) {
      const loading = document.getElementById(`chat-loading-${id}`);
      if (loading) loading.remove();
      chatArea.innerHTML += `<div class="chat-msg chat-error">❌ ${escapeHtml(error.message)}</div>`;
    }
  }

  /** 获取所有注释（供导出用） */
  getAllAnnotations() {
    return this.annotations.map(a => ({
      id: a.id,
      type: a.type,
      originalText: a.originalText,
      result: a.result,
      conversations: a.conversations,
      timestamp: a.timestamp
    }));
  }

  /** 清空所有 */
  clear() {
    this.annotations.forEach(a => {
      const el = document.getElementById(`pinned-${a.id}`);
      if (el) el.remove();
    });
    this.annotations = [];
    this.notify();
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 导出单例 / Export singleton
export const annotationStore = new AnnotationStore();
