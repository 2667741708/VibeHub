/**
 * PDF 查看器模块 / PDF Viewer Module
 * ===================================
 * 版本 / Version: 3.0.0
 * 修改基准 / Based on: v1.0.0
 * 
 * 修改内容 / Changes (v1.0.0 → v3.0.0):
 *   - [修复] DOM 元素 ID 引用从连字符格式修正为 camelCase 以匹配 HTML
 *     [Fix] DOM element ID refs from hyphen-case to camelCase to match HTML
 *   - [说明] pdf-pages → pdfPages, page-input → pageInput,
 *           total-pages → totalPages, zoom-level → zoomLevel,
 *           welcome-screen → welcomeScreen, pdf-viewer → pdfViewer
 */

import * as pdfjsLib from 'pdfjs-dist';

// 配置 PDF.js Worker / Configure PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

class PDFViewer {
  constructor() {
    this.pdfDoc = null;
    this.currentPage = 1;
    this.totalPages = 0;
    this.scale = 1.2;
    this.pageTexts = []; // 每页文本内容 / Text content per page
    this.renderedPages = new Set();
    
    // DOM 元素 / DOM Elements (ID 已修正为 camelCase 以匹配 index.html)
    // DOM Elements (IDs corrected to camelCase to match index.html)
    this.container = document.getElementById('pdfPages');
    this.pageInput = document.getElementById('pageInput');
    this.totalPagesEl = document.getElementById('totalPages');
    this.zoomLevelEl = document.getElementById('zoomLevel');
    this.welcomeScreen = document.getElementById('welcomeScreen');
    this.viewerEl = document.getElementById('pdfViewer');
  }

  /**
   * 从 File 对象加载 PDF / Load PDF from File object
   * @param {File} file - PDF 文件
   */
  async loadFromFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    this.pdfDoc = await loadingTask.promise;
    this.totalPages = this.pdfDoc.numPages;
    this.currentPage = 1;
    this.pageTexts = [];
    this.renderedPages.clear();

    // 更新 UI / Update UI
    this.totalPagesEl.textContent = this.totalPages;
    this.pageInput.value = 1;
    this.pageInput.max = this.totalPages;
    this.welcomeScreen.classList.add('hidden');
    this.viewerEl.classList.remove('hidden');

    // 渲染所有页面 / Render all pages
    this.container.innerHTML = '';
    await this.renderAllPages();
  }

  /**
   * 渲染所有页面 / Render all pages
   */
  async renderAllPages() {
    for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
      await this.renderPage(pageNum);
    }
  }

  /**
   * 渲染单页 / Render single page
   * @param {number} pageNum - 页码
   */
  async renderPage(pageNum) {
    if (this.renderedPages.has(pageNum)) return;

    const page = await this.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: this.scale });

    // 创建页面容器 / Create page container
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-page-wrapper';
    wrapper.id = `page-${pageNum}`;
    wrapper.style.width = `${viewport.width}px`;
    wrapper.style.height = `${viewport.height}px`;

    // 创建 Canvas / Create Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width * window.devicePixelRatio;
    canvas.height = viewport.height * window.devicePixelRatio;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 渲染页面到 Canvas / Render page to Canvas
    await page.render({ canvasContext: ctx, viewport }).promise;

    // 创建文本层 / Create text layer
    const textContent = await page.getTextContent();
    const textLayer = document.createElement('div');
    textLayer.className = 'text-layer';
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;

    // 保存文本 / Save text
    const pageText = textContent.items.map(item => item.str).join(' ');
    this.pageTexts[pageNum - 1] = pageText;

    // 渲染文本项 / Render text items
    textContent.items.forEach(item => {
      const span = document.createElement('span');
      span.textContent = item.str;
      
      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const fontSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
      const fontHeight = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
      
      span.style.left = `${tx[4]}px`;
      span.style.top = `${tx[5] - fontHeight}px`;
      span.style.fontSize = `${fontSize}px`;
      span.style.fontFamily = item.fontName || 'sans-serif';

      if (item.width > 0) {
        span.style.width = `${item.width * viewport.scale}px`;
      }

      textLayer.appendChild(span);
    });

    // 页码标签 / Page number label
    const pageLabel = document.createElement('div');
    pageLabel.className = 'page-number-label';
    pageLabel.textContent = `${pageNum} / ${this.totalPages}`;

    wrapper.appendChild(canvas);
    wrapper.appendChild(textLayer);
    wrapper.appendChild(pageLabel);
    this.container.appendChild(wrapper);

    this.renderedPages.add(pageNum);
  }

  /**
   * 跳转到指定页面 / Navigate to page
   * @param {number} pageNum - 目标页码
   */
  goToPage(pageNum) {
    if (pageNum < 1 || pageNum > this.totalPages) return;
    this.currentPage = pageNum;
    this.pageInput.value = pageNum;

    const pageEl = document.getElementById(`page-${pageNum}`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * 下一页 / Next page
   */
  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  /**
   * 上一页 / Previous page
   */
  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  /**
   * 缩放 / Zoom
   * @param {number} delta - 缩放增量
   */
  async zoom(delta) {
    const newScale = Math.max(0.5, Math.min(3.0, this.scale + delta));
    if (newScale === this.scale) return;
    
    this.scale = newScale;
    this.zoomLevelEl.textContent = `${Math.round(this.scale * 100)}%`;
    
    // 重新渲染所有页面 / Re-render all pages
    this.renderedPages.clear();
    this.container.innerHTML = '';
    await this.renderAllPages();
    this.goToPage(this.currentPage);
  }

  /**
   * 获取全文文本 / Get full text
   * @returns {string}
   */
  getFullText() {
    return this.pageTexts.join('\n\n');
  }

  /**
   * 获取指定页面文本 / Get text for a specific page
   * @param {number} pageNum
   * @returns {string}
   */
  getPageText(pageNum) {
    return this.pageTexts[pageNum - 1] || '';
  }
}
let globalViewer = null;

export function initPDFViewer() {
  globalViewer = new PDFViewer();
  
  // 监听自定义事件 / Listen for custom events
  window.addEventListener('pdf-load-file', async (e) => {
    await globalViewer.loadFromFile(e.detail);
  });
  
  window.addEventListener('pdf-prev-page', () => {
    if (globalViewer) globalViewer.prevPage();
  });
  
  window.addEventListener('pdf-next-page', () => {
    if (globalViewer) globalViewer.nextPage();
  });
  
  window.addEventListener('pdf-zoom', (e) => {
    if (globalViewer) globalViewer.zoom(e.detail);
  });
  
  // 输入页码跳转
  const pageInput = document.getElementById('pageInput');
  if (pageInput) {
    pageInput.addEventListener('change', (e) => {
      const pageNum = parseInt(e.target.value, 10);
      if (globalViewer) globalViewer.goToPage(pageNum);
    });
  }
}

export function getPDFText() {
  return globalViewer ? globalViewer.getFullText() : '';
}

export default PDFViewer;
