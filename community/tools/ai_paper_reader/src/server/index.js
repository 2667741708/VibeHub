/**
 * AI Paper Reader 后端服务 / Backend Service
 * ==========================================
 * 版本 / Version: 3.1.0
 * 修改基准 / Based on: v3.0.0
 * 
 * 修改内容 / Changes (v3.0.0 → v3.1.0):
 *   - [新增] 双引擎架构: Gemini CLI / REST API 可切换
 *     [New] Dual engine: Gemini CLI / REST API switchable
 *   - [新增] POST /api/engine 设置引擎模式和 API Key
 *     [New] POST /api/engine to set engine mode and API Key
 *   - [新增] GET /api/engine 获取当前引擎状态
 *     [New] GET /api/engine to get current engine status
 *   - [继承] 所有原有 AI 端点保持不变
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import { execSync } from 'child_process';
import os from 'os';
import path from 'path';

// 双引擎导入 / Dual engine imports
import * as cliEngine from './gemini-cli.js';
import * as apiEngine from './gemini-api.js';

const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ==================== 引擎管理 / Engine Management ====================
// 当前引擎: 'cli' | 'api'
let currentEngine = 'cli';

/**
 * 获取当前活跃引擎 / Get current active engine module
 */
function getEngine() {
  return currentEngine === 'api' ? apiEngine : cliEngine;
}

// POST /api/engine — 切换引擎 / Switch engine
app.post('/api/engine', (req, res) => {
  const { engine, apiKey } = req.body;

  if (engine === 'api') {
    if (!apiKey) {
      return res.status(400).json({ error: '使用 API 模式需要提供 API Key' });
    }
    apiEngine.setApiKey(apiKey);
    currentEngine = 'api';
    console.log('🔄 引擎切换为 REST API / Switched to REST API engine');
  } else {
    currentEngine = 'cli';
    console.log('🔄 引擎切换为 Gemini CLI / Switched to Gemini CLI engine');
  }

  res.json({ success: true, engine: currentEngine });
});

// GET /api/engine — 获取引擎状态 / Get engine status
app.get('/api/engine', (req, res) => {
  res.json({
    engine: currentEngine,
    hasApiKey: apiEngine.hasApiKey()
  });
});

// ==================== 文件上传 / File Upload ====================
const upload = multer({
  dest: path.join(os.tmpdir(), 'ai-paper-reader-uploads'),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('仅支持 PDF / Only PDF supported'));
  }
});

const EXTRACT_SCRIPT = (() => {
  const candidates = [
    path.join(process.cwd(), '..', 'skills', 'extract_pdf.py'),
    path.join(process.cwd(), 'skills', 'extract_pdf.py'),
    '/media/whm/UD210/Project/.agents/skills/paper_reader/scripts/extract_pdf.py'
  ];
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return candidates[0];
})();

let currentPaperContext = '';
let currentPaperMeta = {};

// POST /api/upload
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '未上传文件' });
    const pdfPath = req.file.path;
    console.log(`📄 正在解析 / Parsing: ${req.file.originalname}`);
    const { stdout } = await import('child_process').then(cp => {
      const { execSync } = cp;
      const result = execSync(`python3 "${EXTRACT_SCRIPT}" "${pdfPath}" --format json`, {
        maxBuffer: 1024 * 1024 * 50, timeout: 60000, cwd: os.tmpdir()
      });
      return { stdout: result.toString() };
    });
    const data = JSON.parse(stdout);
    currentPaperContext = data.pages.map(p => p.text).join('\n\n');
    currentPaperMeta = data.metadata;
    console.log(`✅ 解析完成 / Done: ${data.total_pages} pages`);
    res.json({ success: true, file: req.file.originalname, totalPages: data.total_pages, metadata: data.metadata, pages: data.pages });
  } catch (error) {
    console.error('❌ PDF 解析失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==================== AI 端点 (通过当前引擎路由) ====================
// AI endpoints (routed through current engine)

app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLang, model } = req.body;
    if (!text) return res.status(400).json({ error: '缺少文本' });
    const eng = getEngine();
    const label = currentEngine === 'api' ? 'API' : 'CLI';
    console.log(`🔄 [${label}/${model || 'flash'}] 翻译中: ${text.substring(0, 50)}...`);
    const result = await eng.translate(text, targetLang, model);
    res.json({ success: true, translation: result });
  } catch (error) {
    console.error('❌ 翻译失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/explain', async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text) return res.status(400).json({ error: '缺少文本' });
    const eng = getEngine();
    const result = await eng.explain(text, model);
    res.json({ success: true, explanation: result });
  } catch (error) {
    console.error('❌ 解释失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/summarize', async (req, res) => {
  try {
    const { text, model } = req.body;
    const content = text || currentPaperContext;
    if (!content) return res.status(400).json({ error: '没有论文内容' });
    const eng = getEngine();
    const result = await eng.summarize(content, model);
    res.json({ success: true, summary: result });
  } catch (error) {
    console.error('❌ 摘要失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/qa', async (req, res) => {
  try {
    const { question, context, model } = req.body;
    if (!question) return res.status(400).json({ error: '缺少问题' });
    const paperContext = context || currentPaperContext;
    if (!paperContext) return res.status(400).json({ error: '请先上传论文' });
    const eng = getEngine();
    const result = await eng.qa(question, paperContext, model);
    res.json({ success: true, answer: result });
  } catch (error) {
    console.error('❌ QA 失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bubble-qa', async (req, res) => {
  try {
    const { question, originalText, history, model } = req.body;
    if (!question || !originalText) return res.status(400).json({ error: '缺少参数' });
    const eng = getEngine();
    const result = await eng.bubbleQA(question, originalText, history, model);
    res.json({ success: true, answer: result });
  } catch (error) {
    console.error('❌ 气泡对话失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/export', async (req, res) => {
  try {
    const { annotations, summary, model } = req.body;
    const eng = getEngine();
    const result = await eng.generateExportDoc(annotations || [], summary, currentPaperMeta, model);
    res.json({ success: true, document: result });
  } catch (error) {
    console.error('❌ 导出失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasPaper: !!currentPaperContext,
    version: '3.1.0',
    engine: currentEngine
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   🔬 AI Paper Reader V3.1 后端服务已启动        ║
║   📡 端口 / Port: ${PORT}                         ║
║   🤖 引擎 / Engine: CLI + REST API (可切换)     ║
║   🧠 模型 / Models: Gemini 3 Flash + Pro        ║
╚══════════════════════════════════════════════════╝
  `);
});
