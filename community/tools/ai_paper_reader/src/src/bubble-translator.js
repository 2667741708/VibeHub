/**
 * 增强翻译气泡模块 / Enhanced Bubble Translator Module
 * =====================================================
 * 版本 / Version: 3.2.0
 * 修改基准 / Based on: v2.0.0
 * 
 * 修改内容 / Changes (v2.0.0 → v3.2.0):
 *   - [新增] 翻译/解释完成后自动高亮选中文本
 *     [New] Auto-highlight selected text after translate/explain
 *   - [新增] 自动固定为持久批注（无需手动点击"固定批注"）
 *     [New] Auto-pin as persistent annotation (no manual pin needed)
 *   - [新增] 高亮文本与批注气泡建立关联，点击高亮可滚动到气泡
 *     [New] Link highlights to annotation bubbles; click highlight to scroll
 *   - [移除] Emoji 改为纯文本
 *     [Remove] Emoji replaced with plain text
 */

import { translateText, explainText } from './api.js';
import { annotationStore } from './annotation-bubble.js';
import { renderMarkdown } from './markdown-renderer.js';

let selectedText = '';
let selectedRange = null;

// DOM 引用 / DOM references
const selectionToolbar = document.getElementById('selectionToolbar');
const aiBubble = document.getElementById('aiBubble');
const bubbleOriginal = document.getElementById('bubbleOriginal');
const bubbleContent = document.getElementById('bubbleContent');
const bubbleClose = document.getElementById('bubbleClose');
const bubbleCopy = document.getElementById('bubbleCopy');
const bubbleInsert = document.getElementById('bubbleInsert');
const bubbleTitle = aiBubble.querySelector('.bubble-title');
const bubbleModelBadge = document.getElementById('bubbleModelBadge');

let currentAction = 'translate';
let currentResult = '';

export function initBubbleTranslator() {
  // 监听文本选择 / Listen for text selection
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keyup', handleTextSelection);

  // 工具条按钮 / Toolbar buttons
  selectionToolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('.sel-btn');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'translate') doTranslate();
    else if (action === 'explain') doExplain();
    else if (action === 'ask') doAsk();
    else if (action === 'highlight') doHighlight();
  });

  // 气泡按钮 / Bubble buttons
  bubbleClose.addEventListener('click', closeBubble);
  bubbleCopy.addEventListener('click', copyResult);
  // "固定批注" 现在变为 "手动固定" (自动模式下不再需要)
  // "Pin" button now serves as manual override (auto-pin is default)
  bubbleInsert.addEventListener('click', pinAnnotation);

  // 点击其他区域关闭 / Click outside to close
  document.addEventListener('mousedown', (e) => {
    if (!aiBubble.contains(e.target) && !selectionToolbar.contains(e.target)) {
      hideToolbar();
    }
  });

  // ESC 关闭 / ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBubble();
  });
}

function handleTextSelection(e) {
  // 忽略来自气泡/工具条/侧栏的选择
  if (e.target.closest('.ai-bubble') || e.target.closest('.selection-toolbar') || e.target.closest('.sidebar')) return;
  if (e.target.closest('.pinned-bubble')) return;

  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text.length > 2) {
    selectedText = text;
    try { selectedRange = selection.getRangeAt(0).cloneRange(); } catch { selectedRange = null; }
    showToolbar(selection);
  } else {
    // 延迟隐藏，避免点击工具条时触发
    setTimeout(() => {
      if (!selectionToolbar.matches(':hover') && !aiBubble.matches(':hover')) {
        hideToolbar();
      }
    }, 200);
  }
}

function showToolbar(selection) {
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  selectionToolbar.style.top = `${rect.top + window.scrollY - 45}px`;
  selectionToolbar.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
  selectionToolbar.classList.remove('hidden');
}

function hideToolbar() {
  selectionToolbar.classList.add('hidden');
}

// ==================== 高亮辅助 / Highlight Helper ====================

/**
 * 获取 Range 内的所有文本节点 / Get all text nodes within a Range
 * PDF 文本层 (textLayer) 的每个字符/词都是独立的 <span>
 * 因此必须遍历所有子文本节点逐个包裹
 */
function getTextNodesInRange(range) {
  const nodes = [];
  const startContainer = range.startContainer;
  const endContainer = range.endContainer;

  // 如果起止在同一个文本节点
  if (startContainer === endContainer && startContainer.nodeType === Node.TEXT_NODE) {
    nodes.push(startContainer);
    return nodes;
  }

  // 使用 TreeWalker 遍历所有文本节点
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const nodeRange = document.createRange();
        nodeRange.selectNodeContents(node);
        // 检查此文本节点是否与选区范围相交
        const intersects = range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
                        && range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0;
        return intersects ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.trim()) {
      nodes.push(node);
    }
  }

  return nodes;
}

/**
 * 高亮选中文本（支持跨节点） / Highlight selected text (cross-node support)
 * @param {Range} range
 * @param {string} colorClass - 高亮颜色类名
 * @param {number} annotationId - 关联的批注 ID
 * @returns {HTMLElement[]|null} - 所有生成的 mark 元素
 */
function highlightRange(range, colorClass, annotationId) {
  if (!range) return null;

  try {
    const textNodes = getTextNodesInRange(range);

    if (textNodes.length === 0) {
      console.warn('没有找到可高亮的文本节点 / No text nodes found in range');
      return null;
    }

    const marks = [];

    textNodes.forEach((textNode, index) => {
      const mark = document.createElement('mark');
      mark.className = `user-highlight ${colorClass}`;
      mark.dataset.annotationId = annotationId;
      mark.title = '点击查看批注';
      mark.style.cursor = 'pointer';

      // 处理起始和结束节点的部分选择
      // Handle partial selection at start/end nodes
      if (textNodes.length === 1) {
        // 单一文本节点 — 可能只选了其中一部分
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;
        if (startOffset > 0 || endOffset < textNode.textContent.length) {
          const partialRange = document.createRange();
          partialRange.setStart(textNode, startOffset);
          partialRange.setEnd(textNode, endOffset);
          partialRange.surroundContents(mark);
        } else {
          textNode.parentNode.replaceChild(mark, textNode);
          mark.appendChild(textNode);
        }
      } else if (index === 0) {
        // 第一个节点 — 从 startOffset 到末尾
        const startOffset = (textNode === range.startContainer) ? range.startOffset : 0;
        if (startOffset > 0) {
          const partialRange = document.createRange();
          partialRange.setStart(textNode, startOffset);
          partialRange.setEnd(textNode, textNode.textContent.length);
          partialRange.surroundContents(mark);
        } else {
          textNode.parentNode.replaceChild(mark, textNode);
          mark.appendChild(textNode);
        }
      } else if (index === textNodes.length - 1) {
        // 最后一个节点 — 从开头到 endOffset
        const endOffset = (textNode === range.endContainer) ? range.endOffset : textNode.textContent.length;
        if (endOffset < textNode.textContent.length) {
          const partialRange = document.createRange();
          partialRange.setStart(textNode, 0);
          partialRange.setEnd(textNode, endOffset);
          partialRange.surroundContents(mark);
        } else {
          textNode.parentNode.replaceChild(mark, textNode);
          mark.appendChild(textNode);
        }
      } else {
        // 中间节点 — 完整包裹
        textNode.parentNode.replaceChild(mark, textNode);
        mark.appendChild(textNode);
      }

      // 点击高亮文本 → 滚动到对应批注气泡
      // Click highlighted text → scroll to corresponding pinned bubble
      mark.addEventListener('click', (e) => {
        e.stopPropagation();
        const pinnedEl = document.getElementById(`pinned-${annotationId}`);
        if (pinnedEl) {
          pinnedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // 闪烁动画 / Flash animation to draw attention
          pinnedEl.style.transition = 'box-shadow 0.3s';
          pinnedEl.style.boxShadow = '0 0 0 2px var(--accent-primary), 0 0 16px rgba(196, 163, 90, 0.3)';
          setTimeout(() => { pinnedEl.style.boxShadow = ''; }, 1500);
        }
      });

      marks.push(mark);
    });

    return marks.length > 0 ? marks : null;
  } catch (err) {
    console.warn('高亮失败 / Highlight failed:', err.message);
    return null;
  }
}

// ==================== 操作函数 / Action Functions ====================

async function doTranslate() {
  currentAction = 'translate';
  bubbleTitle.textContent = 'AI 翻译';
  updateModelBadge();
  showBubble();
  hideToolbar();

  // 保存 range 副本用于后续高亮 / Save range copy for post-highlight
  const rangeForHighlight = selectedRange ? selectedRange.cloneRange() : null;
  const textForAnnotation = selectedText;

  try {
    const data = await translateText(selectedText);
    currentResult = data.translation;
    renderBubbleResult(currentResult);

    // [v3.2] 自动高亮 + 自动固定批注
    // [v3.2] Auto-highlight + auto-pin annotation
    autoHighlightAndPin(textForAnnotation, currentResult, 'translate', rangeForHighlight);
  } catch (error) {
    renderBubbleError(`翻译失败: ${error.message}`);
  }
}

async function doExplain() {
  currentAction = 'explain';
  bubbleTitle.textContent = 'AI 解释';
  updateModelBadge();
  showBubble();
  hideToolbar();

  const rangeForHighlight = selectedRange ? selectedRange.cloneRange() : null;
  const textForAnnotation = selectedText;

  try {
    const data = await explainText(selectedText);
    currentResult = data.explanation;
    renderBubbleResult(currentResult);

    // [v3.2] 自动高亮 + 自动固定批注
    autoHighlightAndPin(textForAnnotation, currentResult, 'explain', rangeForHighlight);
  } catch (error) {
    renderBubbleError(`解释失败: ${error.message}`);
  }
}

/**
 * 自动高亮选中文本，并固定为持久批注
 * Auto-highlight selected text and create persistent annotation
 */
function autoHighlightAndPin(text, result, type, range) {
  // 确定高亮颜色 / Determine highlight color
  const colorMap = {
    translate: 'highlight-blue',      // 蓝色 = 翻译
    explain:   'highlight-yellow',    // 黄色 = 解释 
    ask:       'highlight-green',     // 绿色 = 提问
  };
  const colorClass = colorMap[type] || 'highlight-yellow';

  // 创建批注 / Create annotation
  const annotation = annotationStore.createAnnotation({
    originalText: text,
    type,
    result,
    range
  });

  // 高亮选中文本并关联批注 / Highlight and link to annotation
  if (range) {
    highlightRange(range, colorClass, annotation.id);
  }

  // 自动关闭临时气泡（持久批注已创建）
  // Auto-close temp bubble (persistent annotation is created)
  setTimeout(() => closeBubble(), 300);
}

function doAsk() {
  currentAction = 'ask';
  hideToolbar();
  closeBubble();

  // 先高亮再创建批注
  const annotation = annotationStore.createAnnotation({
    originalText: selectedText,
    type: 'ask',
    result: '',
    range: selectedRange
  });

  if (selectedRange) {
    highlightRange(selectedRange, 'highlight-green', annotation.id);
  }
}

function doHighlight() {
  hideToolbar();
  if (selectedRange) {
    const annotation = annotationStore.createAnnotation({
      originalText: selectedText,
      type: 'highlight',
      result: '',
      range: selectedRange
    });
    highlightRange(selectedRange, 'highlight-yellow', annotation.id);
  }
}

function updateModelBadge() {
  const model = document.getElementById('modelSelect').value;
  bubbleModelBadge.textContent = model === 'pro' ? 'Pro' : 'Flash';
  bubbleModelBadge.className = `bubble-model-badge badge-${model}`;
}

// ==================== 气泡显示 / Bubble Display ====================

function showBubble() {
  bubbleOriginal.textContent = selectedText.length > 200 ? selectedText.substring(0, 200) + '...' : selectedText;
  bubbleContent.innerHTML = '<div class="bubble-loading"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
  aiBubble.classList.remove('hidden');

  // 定位到选中文本附近 / Position near selection
  if (selectedRange) {
    const rect = selectedRange.getBoundingClientRect();
    const bubbleWidth = 420;
    let left = rect.left + window.scrollX + rect.width / 2 - bubbleWidth / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - bubbleWidth - 10));
    let top = rect.bottom + window.scrollY + 10;

    aiBubble.style.left = `${left}px`;
    aiBubble.style.top = `${top}px`;
    aiBubble.style.position = 'absolute';
  }
}

function closeBubble() {
  aiBubble.classList.add('hidden');
  currentResult = '';
}

function renderBubbleResult(text) {
  bubbleContent.innerHTML = `<div class="bubble-result md-content">${renderMarkdown(text)}</div>`;
}

function renderBubbleError(msg) {
  bubbleContent.innerHTML = `<div class="bubble-error">${escapeHtml(msg)}</div>`;
}

function copyResult() {
  if (currentResult) {
    navigator.clipboard.writeText(currentResult)
      .then(() => showToast('已复制到剪贴板'))
      .catch(() => showToast('复制失败'));
  }
}

function pinAnnotation() {
  if (!currentResult || !selectedText) return;
  annotationStore.createAnnotation({
    originalText: selectedText,
    type: currentAction,
    result: currentResult,
    range: selectedRange
  });
  closeBubble();
  showToast('已固定为持久批注');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
