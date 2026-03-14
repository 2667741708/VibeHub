/**
 * Gemini REST API 直连模块 / Gemini REST API Direct Module
 * =========================================================
 * 版本 / Version: 3.2.1
 * 修改基准 / Based on: v3.1.0
 * 
 * 修改内容 / Changes (v3.1.0 → v3.2.1):
 *   - [修复] 模型名改为稳定版 (gemini-2.5-flash / gemini-2.5-pro)
 *     [Fix] Model names changed to stable versions (avoid preview quota issues)
 *   - [新增] 自动 fallback: pro 失败时降级到 flash
 *     [New] Auto-fallback: pro failure falls back to flash
 *
 * API 文档 / Docs: https://ai.google.dev/api/rest
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// 模型映射 / Model mapping
// [v3.2.1] 使用稳定版模型名，preview 版配额太低
// [v3.2.1] Use stable model names; preview models have very low quotas
const MODELS = {
  flash: 'gemini-2.5-flash',
  pro: 'gemini-2.5-pro'
};

let API_KEY = '';

/**
 * 设置 API Key / Set API Key
 */
export function setApiKey(key) {
  API_KEY = key;
  console.log(`🔑 API Key 已${key ? '设置' : '清除'} / API Key ${key ? 'set' : 'cleared'}`);
}

/**
 * 获取当前 API Key 状态 / Get current API Key status
 */
export function hasApiKey() {
  return !!API_KEY;
}

/**
 * 调用 Gemini REST API / Call Gemini REST API
 * @param {string} prompt - 提示文本
 * @param {object} options - { model: 'flash'|'pro', temperature, maxTokens }
 * @returns {Promise<string>}
 */
async function callGeminiAPI(prompt, options = {}) {
  const { model = 'flash', temperature = 0.3, maxTokens = 4096 } = options;
  const modelName = MODELS[model] || MODELS.flash;

  if (!API_KEY) {
    throw new Error('API Key 未设置 / API Key not set');
  }

  const url = `${API_BASE}/models/${modelName}:generateContent?key=${API_KEY}`;

  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData?.error?.message || `HTTP ${response.status}`;

    // [v3.2.1] 如果是 pro 模型配额错误，自动降级到 flash 重试
    // Auto-fallback: if pro model hits quota, retry with flash
    if (model === 'pro' && (response.status === 429 || errMsg.includes('quota') || errMsg.includes('Quota'))) {
      console.warn(`⚠️ Pro 模型配额不足，降级到 Flash / Pro quota exceeded, falling back to Flash`);
      return callGeminiAPI(prompt, { ...options, model: 'flash' });
    }

    throw new Error(`Gemini API 错误: ${errMsg}`);
  }

  const data = await response.json();

  // 提取文本响应 / Extract text response
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API 返回空响应 / Empty response from Gemini API');
  }

  return text.trim();
}

/**
 * 翻译 / Translate
 */
export async function translate(text, targetLang = '中文', model = 'flash') {
  const prompt = `你是一位专业的学术翻译专家。请将以下英文学术文本翻译为${targetLang}。
要求：
1. 翻译要准确、流畅、专业
2. 专有名词保留英文原文并在括号中标注
3. 数学符号和公式保持不变
4. 只输出翻译结果，不要添加任何解释

待翻译文本：
${text}`;
  return callGeminiAPI(prompt, { model });
}

/**
 * 解释 / Explain
 */
export async function explain(text, model = 'flash') {
  const prompt = `你是一位学术导师。请对以下学术文本或术语进行简明扼要的中文解释。
要求：
1. 如果是术语，解释其定义、作用和在论文中的常见应用场景
2. 如果是段落，解析其核心含义和逻辑关系
3. 用通俗易懂但不失专业性的语言
4. 保留关键英文术语

待解释内容：
${text}`;
  return callGeminiAPI(prompt, { model });
}

/**
 * 摘要 / Summarize
 */
export async function summarize(text, model = 'pro') {
  const prompt = `你是一位资深的学术论文审稿人。请对以下论文内容生成结构化的中文摘要。

请按照以下格式输出：

## 📚 研究背景与核心问题
[该论文试图解决什么问题？]

## 💡 核心创新点与贡献
[提出了什么新颖的方法？与现有工作的区别？]

## 🔍 方法论简析
[技术路线的核心步骤]

## 📊 实验结论与表现
[数据集、指标和结果]

## 🔑 关键词
[5-8 个核心关键词]

论文内容：
${text.substring(0, 15000)}`;
  return callGeminiAPI(prompt, { model, maxTokens: 8192 });
}

/**
 * 问答 / QA
 */
export async function qa(question, context, model = 'flash') {
  const prompt = `你是一位学术论文阅读助手。基于以下论文内容回答用户的问题。
如果论文内容中没有相关信息，请如实告知。回答要专业、准确。

论文内容：
${context.substring(0, 12000)}

用户问题：${question}`;
  return callGeminiAPI(prompt, { model });
}

/**
 * 气泡QA / Bubble QA
 */
export async function bubbleQA(question, originalText, history = [], model = 'flash') {
  let historyText = '';
  if (history.length > 0) {
    historyText = '\n之前的对话：\n' + history.map(h =>
      `${h.role === 'user' ? '用户' : '助手'}：${h.content}`
    ).join('\n') + '\n';
  }

  const prompt = `你是一位学术论文阅读助手。用户正在阅读以下论文段落，请基于这段内容回答问题。

论文原文段落：
${originalText}
${historyText}
用户新问题：${question}`;

  return callGeminiAPI(prompt, { model });
}

/**
 * 导出文档 / Export
 */
export async function generateExportDoc(annotations, summary, paperMeta, model = 'pro') {
  const annotationText = annotations.map((a, i) => {
    let text = `### 段落 ${i + 1}\n**原文**: ${a.originalText}\n**翻译/解释**: ${a.result}\n`;
    if (a.conversations && a.conversations.length > 0) {
      text += '**讨论**:\n' + a.conversations.map(c =>
        `- Q: ${c.question}\n  A: ${c.answer}`
      ).join('\n') + '\n';
    }
    return text;
  }).join('\n---\n');

  const prompt = `你是一位学术写作专家。请基于以下论文阅读笔记，生成一篇**完整的结构化总结文档**。

论文信息：${JSON.stringify(paperMeta || {})}

AI 摘要：
${summary || '(暂无)'}

阅读笔记和讨论：
${annotationText}

请输出以下格式的 Markdown 文档：
1. 论文基本信息（标题、作者等）
2. 结构化摘要
3. 重点段落翻译与解读
4. QA 讨论精华
5. 使用 Mermaid 语法生成论文的思维导图
6. 个人总结与反思要点`;

  return callGeminiAPI(prompt, { model, maxTokens: 8192 });
}
