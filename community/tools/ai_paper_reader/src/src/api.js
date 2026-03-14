/**
 * API 通信模块 / API Communication Module
 * ========================================
 * 版本 / Version: 3.1.0
 * 修改基准 / Based on: v2.0.0
 * 
 * 修改内容 / Changes (v2.0.0 → v3.1.0):
 *   - [新增] setEngine() 后端引擎切换 (CLI/API)
 *     [New] setEngine() for backend engine switching
 *   - [继承] 所有 model 参数支持
 */

const API_BASE = '/api';

/** 当前选择的模型 / Current selected models */
export const modelConfig = {
  translate: 'flash',
  explain: 'flash',
  summarize: 'pro',
  qa: 'flash'
};

/** 设置模型 / Set model for action */
export function setModel(action, model) {
  if (modelConfig.hasOwnProperty(action)) {
    modelConfig[action] = model;
  }
}

/**
 * 设置后端引擎 / Switch backend engine
 * @param {'cli'|'api'} engine
 * @param {string} apiKey - API Key (仅 api 模式需要)
 */
export async function setEngine(engine, apiKey = '') {
  const res = await fetch(`${API_BASE}/engine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ engine, apiKey })
  });
  return res.json();
}

/**
 * 安全请求 / Safe request with friendly error messages
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch {
    throw new Error('后端服务未连接，请确保后端已启动 (node server/index.js)');
  }

  let data;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`后端返回了无效的响应 (HTTP ${response.status})`);
  }

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data;
}

/** 上传 PDF */
export async function uploadPDF(file) {
  const formData = new FormData();
  formData.append('pdf', file);
  let response;
  try {
    response = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
  } catch {
    throw new Error('后端服务未连接');
  }
  let data;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('PDF 上传响应解析失败');
  }
  if (!response.ok) throw new Error(data.error);
  return data;
}

/** 翻译文本 */
export async function translateText(text, targetLang = '中文') {
  return request('/translate', {
    method: 'POST',
    body: JSON.stringify({ text, targetLang, model: modelConfig.translate })
  });
}

/** 解释术语/文本 */
export async function explainText(text) {
  return request('/explain', {
    method: 'POST',
    body: JSON.stringify({ text, model: modelConfig.explain })
  });
}

/** 生成摘要 */
export async function generateSummary(text) {
  return request('/summarize', {
    method: 'POST',
    body: JSON.stringify({ text, model: modelConfig.summarize })
  });
}

/** 问答 */
export async function askQuestion(question, context = '') {
  return request('/qa', {
    method: 'POST',
    body: JSON.stringify({ question, context, model: modelConfig.qa })
  });
}

/** 气泡内对话 */
export async function bubbleQA(question, originalText, history = []) {
  return request('/bubble-qa', {
    method: 'POST',
    body: JSON.stringify({ question, originalText, history, model: modelConfig.qa })
  });
}

/** 导出总结文档 */
export async function exportDocument(annotations, summary) {
  return request('/export', {
    method: 'POST',
    body: JSON.stringify({ annotations, summary, model: 'pro' })
  });
}

/** 健康检查 */
export async function healthCheck() {
  return request('/health', { method: 'GET' });
}
