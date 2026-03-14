/**
 * Markdown 渲染工具模块 / Markdown Rendering Utility
 * ====================================================
 * 版本 / Version: 2.0.0 (新建)
 * 
 * 描述 / Description:
 *   使用 marked 库进行专业的 Markdown → HTML 渲染，
 *   支持标题、粗体、斜体、代码块、列表、表格、Mermaid 图表等。
 *   Uses the 'marked' library for professional Markdown→HTML rendering,
 *   supporting headers, bold, italic, code blocks, lists, tables, Mermaid, etc.
 */

import { marked } from 'marked';

// 配置 marked / Configure marked
marked.setOptions({
  breaks: true,       // 换行符转为 <br>
  gfm: true,          // GitHub Flavored Markdown
  headerIds: false,    // 不生成 header id
  mangle: false        // 不转义邮箱
});

// 自定义渲染器 / Custom renderer
const renderer = new marked.Renderer();

// 代码块：对 mermaid 语言特殊处理
renderer.code = function({ text, lang }) {
  if (lang === 'mermaid') {
    return `<div class="md-mermaid-block"><pre class="mermaid">${escapeHtml(text)}</pre></div>`;
  }
  return `<pre class="md-code-block"><code class="language-${lang || 'text'}">${escapeHtml(text)}</code></pre>`;
};

// 行内代码
renderer.codespan = function({ text }) {
  return `<code class="md-inline-code">${text}</code>`;
};

// 表格样式增强
renderer.table = function({ header, body }) {
  return `<div class="md-table-wrapper"><table class="md-table"><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
};

// 链接在新标签页打开
renderer.link = function({ href, title, text }) {
  return `<a href="${href}" target="_blank" rel="noopener" class="md-link" ${title ? `title="${title}"` : ''}>${text}</a>`;
};

marked.use({ renderer });

/**
 * 渲染 Markdown 为 HTML / Render Markdown to HTML
 * @param {string} text - Markdown 源文本
 * @returns {string} 渲染后的 HTML
 */
export function renderMarkdown(text) {
  if (!text) return '';
  try {
    return marked.parse(text);
  } catch (e) {
    console.warn('Markdown 渲染失败:', e);
    return `<pre>${escapeHtml(text)}</pre>`;
  }
}

/**
 * HTML 转义 / Escape HTML
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
