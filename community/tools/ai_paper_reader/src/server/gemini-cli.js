/**
 * Gemini CLI 封装模块 / Gemini CLI Wrapper Module
 * ================================================
 * 版本 / Version: 3.0.0
 * 修改基准 / Based on: v2.0.0
 * 
 * 修改内容 / Changes (v2.0.0 → v3.0.0):
 *   - [更新] 模型映射升级为 Gemini 3 系列
 *     [Update] Model mapping upgraded to Gemini 3 series
 *     flash: gemini-2.5-flash-preview-05-20 → gemini-3-flash-preview
 *     pro:   gemini-2.5-pro-preview-05-06   → gemini-3.1-pro-preview
 *   - [继承] 自动检测 gemini CLI 路径
 *   - [继承] explain(), bubbleQA() 等所有函数
 */

import { spawn, execSync } from 'child_process';
import os from 'os';

// 自动检测 Gemini CLI 路径 / Auto-detect Gemini CLI path
// 确保可移植性：任何安装了 gemini CLI 的用户都能使用
// Ensures portability: works for anyone with gemini CLI installed
let GEMINI_BIN;
try {
  GEMINI_BIN = execSync('which gemini', { encoding: 'utf-8' }).trim();
  console.log(`✅ 检测到 Gemini CLI / Found Gemini CLI: ${GEMINI_BIN}`);
} catch {
  GEMINI_BIN = 'gemini'; // 回退到 PATH 查找 / Fallback to PATH lookup
  console.warn('⚠️ 未检测到 gemini 路径，将尝试使用 PATH / Gemini not found, trying PATH');
}

// 模型映射 / Model mapping (v3.0.0: 升级为 Gemini 3 系列 / Upgraded to Gemini 3 series)
const MODELS = {
  flash: 'gemini-3-flash-preview',
  pro: 'gemini-3.1-pro-preview'
};

/**
 * 调用 Gemini CLI / Call Gemini CLI
 * @param {string} prompt - 提示文本
 * @param {object} options - { timeout, model: 'flash'|'pro' }
 * @returns {Promise<string>}
 */
export async function callGemini(prompt, options = {}) {
  const { timeout = 120000, model = 'flash' } = options;
  const tmpDir = os.tmpdir();
  const modelName = MODELS[model] || MODELS.flash;

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let settled = false;

    // [v3.0.1] 最小化启动参数，禁用 MCP 服务器和扩展以加速响应
    // [v3.0.1] Minimal startup: disable MCP servers & extensions for faster response
    // 原来每次调用都会加载所有 MCP 服务器（如 xiaohongshu），耗时 10-15 秒
    // Previously each call loaded all MCP servers (e.g. xiaohongshu), taking 10-15s
    const args = [
      '--prompt', ' ',
      '--model', modelName,
      '--output-format', 'text',
      '--sandbox', 'false',
      '--extensions', ''
    ];

    const child = spawn(GEMINI_BIN, args, {
      cwd: tmpDir,
      env: {
        ...process.env,
        PAGER: 'cat',
        GEMINI_NO_UPDATES: '1'      // 禁用更新检查 / Disable update check
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    child.stdin.write(prompt);
    child.stdin.end();

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      const result = stdout.trim();
      if (result) {
        resolve(result);
      } else if (code !== 0) {
        reject(new Error(`Gemini CLI 退出码 ${code}: ${stderr.trim().substring(0, 200)}`));
      } else {
        resolve('(结果为空，请重试 / Empty result, please retry)');
      }
    });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      reject(new Error(`Gemini CLI 启动失败 / Failed to start: ${err.message}`));
    });

    setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGTERM');
      reject(new Error('Gemini CLI 调用超时 / Gemini CLI call timed out'));
    }, timeout);
  });
}

/**
 * 翻译文本 / Translate text (默认 flash)
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
  return callGemini(prompt, { model });
}

/**
 * 解释文本/术语 / Explain text or terminology (默认 flash)
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
  return callGemini(prompt, { model });
}

/**
 * 生成论文摘要 / Generate paper summary (默认 pro)
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
  return callGemini(prompt, { timeout: 180000, model });
}

/**
 * 基于论文上下文问答 / QA
 */
export async function qa(question, context, model = 'flash') {
  const prompt = `你是一位学术论文阅读助手。基于以下论文内容回答用户的问题。
如果论文内容中没有相关信息，请如实告知。回答要专业、准确。

论文内容：
${context.substring(0, 12000)}

用户问题：${question}`;
  return callGemini(prompt, { timeout: 120000, model });
}

/**
 * 气泡内上下文对话 / In-bubble contextual QA
 * @param {string} question - 用户追问
 * @param {string} originalText - 气泡锚定的原文
 * @param {Array} history - 对话历史 [{role, content}]
 * @param {string} model
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

  return callGemini(prompt, { timeout: 120000, model });
}

/**
 * 生成导出文档 / Generate export document
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
5. 使用 Mermaid 语法生成论文的思维导图（用 \`\`\`mermaid 代码块）
6. 个人总结与反思要点

确保文档可以直接发布或分享。`;

  return callGemini(prompt, { timeout: 240000, model });
}
