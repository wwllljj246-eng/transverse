/* ============================================================
   翻译数据层
   - realTranslate：调用后端 POST /api/translate（腾讯云 TMT / MyMemory 双通道）
   - mockTranslate + 短语库：开发 / 后端不可用时的降级备用，完整保留
   注意：密钥只存在于后端（server.js / .env），前端永不接触

   API 基址：
   - 同源部署（CloudStudio / 本地）：直接用 /api/translate
   - GitHub Pages（纯静态，无后端）：指向下方 REMOTE_API_BASE
   - 也可在页面里设置 window.TRANSVERSE_API_BASE 覆盖（自行部署后端时用）
   ============================================================ */

const REMOTE_API_BASE = 'https://098ea8074006440498475abc65f7bc11.codebuddy.cloudstudio.run';

function translateEndpoint(path) {
  const custom = typeof window !== 'undefined' ? window.TRANSVERSE_API_BASE : '';
  const host = typeof location !== 'undefined' ? location.hostname : '';
  const base = custom || (host.endsWith('github.io') ? REMOTE_API_BASE : '');
  return base ? base.replace(/\/$/, '') + path : path;
}

/** AI 表达模式 */
export const TONES = [
  { id: 'natural',  emoji: '😊', name: '日常自然' },
  { id: 'formal',   emoji: '💼', name: '商务正式' },
  { id: 'casual',   emoji: '🗣️', name: '地道口语' },
  { id: 'friendly', emoji: '❤️', name: '友好表达' },
];

/**
 * 短语库
 * out 为字符串 → 所有语气共用；为对象 → 按语气取不同译文
 */
const PHRASES = [
  // 英 → 中
  { from: 'en-US', to: 'zh-CN', text: 'Hello, nice to meet you.', out: '你好，很高兴认识你。' },
  { from: 'en-US', to: 'zh-CN', text: 'hello', out: '你好。' },
  { from: 'en-US', to: 'zh-CN', text: 'thank you', out: '谢谢你。' },
  { from: 'en-US', to: 'zh-CN', text: 'thanks', out: '谢谢。' },
  { from: 'en-US', to: 'zh-CN', text: 'goodbye', out: '再见。' },
  { from: 'en-US', to: 'zh-CN', text: 'good morning', out: '早上好。' },
  { from: 'en-US', to: 'zh-CN', text: 'how much is it?', out: '这个多少钱？' },
  { from: 'en-US', to: 'zh-CN', text: 'where is the restroom?', out: '洗手间在哪里？' },

  // 中 → 英（AI 表达示例，双向命中：英→中时任一语气变体反查回原文）
  {
    from: 'zh-CN', to: 'en-US', text: '你能帮我吗？',
    out: {
      natural:  'Can you help me?',
      formal:   'Could you please assist me?',
      casual:   'Could you give me a hand?',
      friendly: 'Hey, could you help me out?',
    },
  },
  { from: 'zh-CN', to: 'en-US', text: '你好，很高兴认识你。', out: 'Hello, nice to meet you.' },
  { from: 'zh-CN', to: 'en-US', text: '你好', out: 'Hello.' },
  { from: 'zh-CN', to: 'en-US', text: '谢谢你。', out: 'Thank you.' },
  { from: 'zh-CN', to: 'en-US', text: '谢谢', out: 'Thanks.' },
  { from: 'zh-CN', to: 'en-US', text: '再见。', out: 'Goodbye.' },

  // 其他高频互译
  { from: 'zh-CN', to: 'ja-JP', text: '你好', out: 'こんにちは。' },
  { from: 'zh-CN', to: 'ko-KR', text: '你好', out: '안녕하세요.' },
  { from: 'en-US', to: 'ja-JP', text: 'hello', out: 'こんにちは。' },
  { from: 'en-US', to: 'ko-KR', text: 'hello', out: '안녕하세요.' },
  { from: 'en-US', to: 'fr-FR', text: 'hello', out: 'Bonjour.' },
  { from: 'en-US', to: 'de-DE', text: 'hello', out: 'Hallo.' },
  { from: 'en-US', to: 'es-ES', text: 'hello', out: 'Hola.' },
  { from: 'en-US', to: 'it-IT', text: 'hello', out: 'Ciao.' },
];

/** 未命中短语库时，按目标语 + 语气给出的 Mock 句子 */
const FALLBACK = {
  zh: {
    natural:  '好的，我明白你的意思了。',
    formal:   '好的，我已了解您的需求，将尽快为您处理。',
    casual:   '行，我懂你意思，这就安排。',
    friendly: '太好啦，我完全明白，交给我吧！',
  },
  en: {
    natural:  "Sure, I understand what you mean.",
    formal:   'I would greatly appreciate your kind assistance with this matter.',
    casual:   'Yeah, I get what you mean.',
    friendly: "Thanks a lot, you're the best!",
  },
};

/** 归一化：小写 + 标点空白统一，便于宽松匹配 */
function normalize(s) {
  return String(s).trim().toLowerCase().replace(/[.,!?，。！？、；;：:]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** 从短语库查找（支持反向命中） */
function findPhrase(input, from, to) {
  const key = normalize(input);
  if (!key) return null;
  for (const p of PHRASES) {
    if (p.from === from && p.to === to && normalize(p.text) === key) return p.out;
    if (p.from === to && p.to === from) {
      // 语气对象：任一表达命中即可反查原文
      const variants = typeof p.out === 'string' ? [p.out] : Object.values(p.out);
      if (variants.some((v) => normalize(v) === key)) return p.text;
    }
  }
  return null;
}

/**
 * Mock 翻译
 * @param {string} input 原文
 * @param {string} from  源语言 code
 * @param {string} to    目标语言 code
 * @param {string} tone  AI 表达模式 id
 * @returns {string} 译文
 */
export function mockTranslate(input, from, to, tone = 'natural') {
  if (!input || !input.trim()) return '';

  const hit = findPhrase(input, from, to);
  if (hit) {
    return typeof hit === 'string' ? hit : hit[tone] || hit.natural;
  }

  const family = to.startsWith('zh') ? 'zh' : 'en';
  return FALLBACK[family][tone] || FALLBACK[family].natural;
}

/* ============================================================
   真实翻译 API（腾讯云 TMT 代理，由 server.js 转发）
   前端只发送 { text, from, to }，不含任何密钥信息
   ============================================================ */

/**
 * 调用后端 POST /api/translate
 * @param {string} input     原文
 * @param {string} from      源语言 code（如 en-US）
 * @param {string} to        目标语言 code（如 zh-CN）
 * @param {number} timeoutMs 超时毫秒数
 * @returns {Promise<{ok: boolean, text?: string, message?: string}>}
 *          ok:true  → text 为真实译文；ok:false → message 为失败原因
 */
export async function realTranslate(input, from, to, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(translateEndpoint('/api/translate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input, from, to }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && data.ok && typeof data.text === 'string' && data.text) {
      return { ok: true, text: data.text };
    }
    return { ok: false, message: (data && data.message) || '翻译服务返回异常' };
  } catch (err) {
    const aborted = err && (err.name === 'AbortError' || controller.signal.aborted);
    return { ok: false, message: aborted ? '翻译请求超时' : '无法连接翻译服务' };
  } finally {
    clearTimeout(timer);
  }
}
