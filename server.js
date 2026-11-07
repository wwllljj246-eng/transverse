/* ============================================================
   译境 TransVerse — 翻译代理后端
   职责：
   1. 静态托管现有站点（index.html / css / js，替代 python http.server）
   2. POST /api/translate     — 调用腾讯云机器翻译 TMT TextTranslate
   3. POST /api/ocr-translate — 拍照翻译：OCR GeneralBasicOCR 识别 + TMT 批量翻译
   4. GET  /api/health   — 健康检查（含密钥是否已配置）

   安全要点：
   - 密钥仅从环境变量 / .env 读取，绝不进入前端代码与 git
   - .env / server.js / package.json / node_modules 不允许被静态访问
   - 简单 IP 频控，防止公网被刷
   ============================================================ */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');

/* ---------- .env 加载（无依赖，真实环境变量优先） ---------- */
const ENV_FILE = path.join(__dirname, '.env');
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

const SECRET_ID = process.env.TENCENT_SECRET_ID || '';
const SECRET_KEY = process.env.TENCENT_SECRET_KEY || '';
const PORT = Number(process.env.PORT) || 8137;
const CONFIGURED = Boolean(SECRET_ID && SECRET_KEY);

/* ---------- 内部 BCP-47 语言码 → 腾讯云 TMT 语言码 ---------- */
const LANG_MAP = {
  'zh-CN': 'zh', 'en-US': 'en', 'ja-JP': 'jp', 'ko-KR': 'kr',
  'th-TH': 'th', 'id-ID': 'id', 'ms-MY': 'ms',
  'fr-FR': 'fr', 'de-DE': 'de', 'es-ES': 'es', 'it-IT': 'it',
};

/* TMT 当前不支持的内部语言 → 明确报错，绝不返回伪造译文 */
const UNSUPPORTED = {
  'fil-PH': '菲律宾语（fil-PH）暂不在腾讯云机器翻译支持范围内',
};

/* ---------- 兜底翻译通道：MyMemory 公共接口（免密钥，匿名每日配额） ---------- */
const MM_LANG = {
  'zh-CN': 'zh-CN', 'en-US': 'en-GB', 'ja-JP': 'ja-JP', 'ko-KR': 'ko-KR',
  'th-TH': 'th-TH', 'id-ID': 'id-ID', 'ms-MY': 'ms-MY', 'fil-PH': 'tl-PH',
  'fr-FR': 'fr-FR', 'de-DE': 'de-DE', 'es-ES': 'es-ES', 'it-IT': 'it-IT',
};

/* 允许调用本接口的页面来源（GitHub Pages / 本地开发 / CloudStudio 自身） */
const ALLOWED_ORIGINS = new Set([
  'https://wwllljj246-eng.github.io',
  'http://localhost:8137', 'http://127.0.0.1:8137',
  'http://localhost:8080', 'http://127.0.0.1:8080',
  'https://e36145bc87da40faa42fbb52ad4d8e43.codebuddy.cloudstudio.run',
  'http://e36145bc87da40faa42fbb52ad4d8e43.codebuddy.cloudstudio.run',
]);

/* 腾讯云额度耗尽后短时间内不再重复请求，直接走兜底通道 */
let tmtBlockedUntil = 0;

/* ---------- 腾讯云 TC3-HMAC-SHA256 通用签名请求 ---------- */
const TMT_HOST = 'tmt.tencentcloudapi.com';
const TMT_SERVICE = 'tmt';
const TMT_VERSION = '2018-03-21';
const OCR_HOST = 'ocr.tencentcloudapi.com';
const OCR_SERVICE = 'ocr';
const OCR_VERSION = '2018-11-19';
const TENCENT_REGION = process.env.TENCENT_REGION || 'ap-guangzhou';

function sha256Hex(msg) {
  return crypto.createHash('sha256').update(msg).digest('hex');
}
function hmac(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest();
}

/**
 * 通用 TC3 签名请求：返回腾讯云 Response 对象
 * 出错时抛异常，err.tcCode 为腾讯云错误码
 * @param {object} opts { service, host, version, action, payload, region? }
 */
async function tc3Request({ service, host, version, action, payload, region }) {
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const actionLower = action.toLowerCase();

  // CanonicalRequest（headers 按字母序：content-type < host < x-tc-action）
  const canonicalRequest = [
    'POST',
    '/',
    '',
    'content-type:application/json; charset=utf-8\nhost:' + host + '\nx-tc-action:' + actionLower + '\n',
    'content-type;host;x-tc-action',
    sha256Hex(body),
  ].join('\n');

  const credentialScope = date + '/' + service + '/tc3_request';
  const stringToSign = [
    'TC3-HMAC-SHA256',
    timestamp,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmac('TC3' + SECRET_KEY, date);
  const kService = hmac(kDate, service);
  const kSigning = hmac(kService, 'tc3_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorization =
    'TC3-HMAC-SHA256 Credential=' + SECRET_ID + '/' + credentialScope +
    ', SignedHeaders=content-type;host;x-tc-action, Signature=' + signature;

  const res = await fetch('https://' + host + '/', {
    method: 'POST',
    headers: {
      'Authorization': authorization,
      'Content-Type': 'application/json; charset=utf-8',
      'Host': host,
      'X-TC-Action': action,
      'X-TC-Version': version,
      'X-TC-Timestamp': String(timestamp),
      'X-TC-Region': region || TENCENT_REGION,
    },
    body,
    signal: AbortSignal.timeout(15000),
  });

  const data = await res.json();
  const r = data && data.Response;
  if (!r) throw new Error('腾讯云返回格式异常');
  if (r.Error) {
    const err = new Error(r.Error.Message || '腾讯云调用失败');
    err.tcCode = r.Error.Code;
    throw err;
  }
  return r;
}

/* 单条文本翻译（TMT TextTranslate） */
async function tencentTextTranslate({ text, source, target }) {
  const r = await tc3Request({
    service: TMT_SERVICE, host: TMT_HOST, version: TMT_VERSION,
    action: 'TextTranslate',
    payload: { SourceText: text, Source: source, Target: target, ProjectId: 0 },
  });
  if (typeof r.TargetText !== 'string') throw new Error('腾讯云返回格式异常');
  return r.TargetText;
}

/* ---------- 兜底：MyMemory 公共翻译（免密钥，返回真实译文） ----------
   匿名调用有每日配额，单次查询上限约 500 字符，故按 400 字分块串行请求；
   任一块失败即整体失败，由上层返回错误，前端降级到演示翻译，不伪造结果。 */
async function myMemoryTranslate({ text, from, to }) {
  const mmFrom = MM_LANG[from] || from.split('-')[0];
  const mmTo = MM_LANG[to] || to.split('-')[0];
  const chunks = [];
  for (let i = 0; i < text.length && chunks.length < 13; i += 400) {
    chunks.push(text.slice(i, i + 400));
  }
  const parts = [];
  for (const chunk of chunks) {
    const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(chunk)
      + '&langpair=' + encodeURIComponent(mmFrom + '|' + mmTo);
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json().catch(() => null);
    const translated = data && data.responseData && data.responseData.translatedText;
    if (!res.ok || !translated || /MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID/i.test(translated)) {
      throw new Error('MyMemory 返回异常：' + ((data && data.responseDetails) || translated || res.status));
    }
    parts.push(translated);
  }
  return parts.join('')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

/* 批量文本翻译（TMT TextTranslateBatch）：自动分块，返回与入参对齐的译文数组 */
async function tencentTextTranslateBatch(texts, source, target) {
  const out = [];
  // 单次请求保守上限：40 条 / 总长 2000 字符
  for (let i = 0; i < texts.length; ) {
    const chunk = [];
    let total = 0;
    while (i < texts.length && chunk.length < 40 && total + texts[i].length <= 2000) {
      chunk.push(texts[i]);
      total += texts[i].length;
      i++;
    }
    if (!chunk.length) { chunk.push(texts[i]); i++; } // 单条超长也强制发送
    const r = await tc3Request({
      service: TMT_SERVICE, host: TMT_HOST, version: TMT_VERSION,
      action: 'TextTranslateBatch',
      payload: { SourceTextList: chunk, Source: source, Target: target, ProjectId: 0 },
    });
    const list = Array.isArray(r.TargetTextList) ? r.TargetTextList : [];
    for (let k = 0; k < chunk.length; k++) {
      out.push(typeof list[k] === 'string' ? list[k] : '');
    }
  }
  return out;
}

/* 通用印刷体识别（OCR GeneralBasicOCR）：返回 TextDetections 数组 */
async function tencentGeneralBasicOCR(imageBase64) {
  const r = await tc3Request({
    service: OCR_SERVICE, host: OCR_HOST, version: OCR_VERSION,
    action: 'GeneralBasicOCR',
    payload: { ImageBase64: imageBase64 },
  });
  return Array.isArray(r.TextDetections) ? r.TextDetections : [];
}

/* 解析 PNG / JPEG 图片尺寸（无依赖；取不到返回 null） */
function parseImageSize(buf) {
  try {
    // PNG：IHDR 的宽高位于第 16/20 字节
    if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    // JPEG：逐个 marker 找 SOF 帧
    if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let off = 2;
      while (off + 9 < buf.length) {
        if (buf[off] !== 0xff) { off++; continue; }
        const marker = buf[off + 1];
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
        }
        off += 2 + buf.readUInt16BE(off + 2);
      }
    }
  } catch { /* ignore */ }
  return null;
}

/* ---------- 简单 IP 频控（内存版，重启清零） ---------- */
const RATE_LIMIT = Number(process.env.RATE_LIMIT) || 12; // 次/分钟
const rateBucket = new Map(); // ip -> { count, resetAt }

function rateLimited(ip) {
  const now = Date.now();
  let b = rateBucket.get(ip);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + 60000 };
    rateBucket.set(ip, b);
    // 顺手清理过期桶，防内存缓慢增长
    if (rateBucket.size > 1000) {
      for (const [k, v] of rateBucket) if (now > v.resetAt) rateBucket.delete(k);
    }
  }
  b.count += 1;
  return b.count > RATE_LIMIT;
}

/* ---------- Express 应用 ---------- */
const app = express();
app.disable('x-powered-by');

/* 跨域支持：GitHub Pages 静态站点调用本后端时需要通过浏览器预检 */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  if (req.method === 'OPTIONS') {
    return origin && ALLOWED_ORIGINS.has(origin) ? res.status(204).end() : res.status(403).end();
  }
  next();
});

/* 阻止敏感文件被静态访问（放在 body 解析之前，畸形请求也先被拦） */
const BLOCKED = /^\/(\.env(\..*)?|server\.js|package(-lock)?\.json|node_modules\/)/;
app.use((req, res, next) => {
  if (BLOCKED.test(req.path)) return res.status(403).json({ ok: false, message: '禁止访问' });
  next();
});

/* ---------- 拍照翻译接口：OCR 识别 + 批量翻译，一次完成 ----------
   请求：{ image: base64 或 dataURL, from: 'en-US', to: 'zh-CN' }
   响应：{ ok, from, to, width, height, translateFailed, items: [{src, dst, pos:{left,top,width}}] }
   坐标已换算为百分比，前端直接渲染 AR 卡；密钥只在后端，前端不传任何凭证 */
const OCR_MAX_LINES = 30;        // 单张图最多返回的文本行数
const OCR_MIN_CONFIDENCE = 60;   // 低于该置信度的行丢弃
const OCR_MAX_LINE_CHARS = 200;  // 单行截断长度

/* OCR 识别层明确不支持的源语言（腾讯云 GeneralBasicOCR 官方语言列表之外），明确报错不伪造 */
const OCR_UNSUPPORTED = {
  'id-ID': '印尼语（id-ID）暂不在腾讯云通用印刷体识别支持范围内',
  'fil-PH': '菲律宾语（fil-PH）暂不在腾讯云通用印刷体识别支持范围内',
};

/* 取文本行的像素外框：优先 ItemPolygon，退化用 Polygon 四角点算外接矩形 */
function polygonOf(d) {
  if (d.ItemPolygon && typeof d.ItemPolygon.X === 'number') return d.ItemPolygon;
  if (Array.isArray(d.Polygon) && d.Polygon.length >= 4) {
    const xs = d.Polygon.map((p) => p.X || 0);
    const ys = d.Polygon.map((p) => p.Y || 0);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return { X: minX, Y: minY, Width: Math.max(...xs) - minX, Height: Math.max(...ys) - minY };
  }
  return null;
}

app.post('/api/ocr-translate', express.json({ limit: '10mb' }), async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').toString();
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' });
  }

  const { image, from, to } = req.body || {};

  /* 图片校验：接受 dataURL 或纯 base64 */
  if (typeof image !== 'string' || !image.trim()) {
    return res.status(400).json({ ok: false, code: 'INVALID_IMAGE', message: '缺少图片数据（base64）' });
  }
  const base64 = image.replace(/^data:image\/[a-z+.-]+;base64,/, '').replace(/\s+/g, '');
  const buf = Buffer.from(base64, 'base64');
  if (buf.length < 100) {
    return res.status(400).json({ ok: false, code: 'INVALID_IMAGE', message: '图片数据无效' });
  }
  if (buf.length > 7 * 1024 * 1024) {
    return res.status(413).json({ ok: false, code: 'IMAGE_TOO_LARGE', message: '图片超过 7MB 上限，请压缩后重试' });
  }

  /* 语言校验：翻译层（TMT）+ 识别层（OCR） */
  if (typeof from !== 'string' || typeof to !== 'string') {
    return res.status(400).json({ ok: false, code: 'INVALID_LANGUAGE', message: '语言参数缺失' });
  }
  for (const code of [from, to]) {
    if (UNSUPPORTED[code]) {
      return res.status(400).json({ ok: false, code: 'UNSUPPORTED_LANGUAGE', message: UNSUPPORTED[code] });
    }
  }
  if (OCR_UNSUPPORTED[from]) {
    return res.status(400).json({ ok: false, code: 'UNSUPPORTED_OCR_LANGUAGE', message: OCR_UNSUPPORTED[from] });
  }
  const source = LANG_MAP[from];
  const target = LANG_MAP[to];
  if (!source || !target) {
    return res.status(400).json({ ok: false, code: 'INVALID_LANGUAGE', message: '不支持的语言代码：' + (!source ? from : to) });
  }

  if (!CONFIGURED) {
    return res.status(503).json({
      ok: false,
      code: 'NOT_CONFIGURED',
      message: '服务端未配置腾讯云密钥（TENCENT_SECRET_ID / TENCENT_SECRET_KEY）',
    });
  }

  /* ① OCR 识别 */
  let detections;
  try {
    detections = await tencentGeneralBasicOCR(base64);
  } catch (err) {
    console.error('[ocr-translate] OCR 调用失败:', err.tcCode || '', err.message);
    const friendly =
      err.name === 'TimeoutError' ? '识别服务超时，请重试'
      : /AuthFailure|Signature/.test(err.tcCode || '') ? '腾讯云密钥校验失败，请检查服务端配置'
      : /FailedOperation|ErrorDetected|LimitExceeded|InvalidParameterValue/.test(err.tcCode || '') ? '图片识别失败，请换一张更清晰的图片'
      : '识别服务暂时不可用，请稍后重试';
    return res.status(502).json({ ok: false, code: 'OCR_ERROR', tcCode: err.tcCode || null, message: friendly });
  }

  /* ② 过滤：空行 / 低置信度丢弃，行数与单行长度封顶 */
  const lines = detections
    .filter((d) => d && typeof d.DetectedText === 'string' && d.DetectedText.trim()
      && (d.Confidence == null || d.Confidence >= OCR_MIN_CONFIDENCE))
    .slice(0, OCR_MAX_LINES)
    .map((d) => ({ src: d.DetectedText.trim().slice(0, OCR_MAX_LINE_CHARS), polygon: polygonOf(d) }));

  if (!lines.length) {
    return res.status(422).json({ ok: false, code: 'NO_TEXT_DETECTED', message: '图片中未识别到文字，请对准文字再拍' });
  }

  /* ③ 像素坐标 → 百分比：优先用图片真实尺寸，取不到则用多边形最大外延归一化 */
  const size = parseImageSize(buf);
  let boundW = size && size.width > 0 ? size.width : 0;
  let boundH = size && size.height > 0 ? size.height : 0;
  if (!boundW || !boundH) {
    for (const l of lines) {
      if (l.polygon) {
        boundW = Math.max(boundW, l.polygon.X + l.polygon.Width);
        boundH = Math.max(boundH, l.polygon.Y + l.polygon.Height);
      }
    }
  }
  const toPct = (v, bound) => (bound > 0 ? Math.round((v / bound) * 10000) / 100 : 0);
  const items = lines.map((l) => ({
    src: l.src,
    dst: '',
    pos: l.polygon
      ? { left: toPct(l.polygon.X, boundW), top: toPct(l.polygon.Y, boundH), width: toPct(l.polygon.Width, boundW) }
      : { left: 10, top: 50, width: 60 }, // 无坐标兜底：居中显示
  }));

  /* ④ 批量翻译：同语言原样返回；整体失败则逐行 dst 留空（前端显示「翻译失败」） */
  let translateFailed = false;
  if (source === target) {
    items.forEach((it) => { it.dst = it.src; });
  } else {
    try {
      const dstList = await tencentTextTranslateBatch(items.map((it) => it.src), source, target);
      items.forEach((it, i) => { it.dst = dstList[i] || ''; });
      if (items.every((it) => !it.dst)) translateFailed = true;
    } catch (err) {
      console.error('[ocr-translate] 批量翻译失败:', err.tcCode || '', err.message);
      translateFailed = true;
    }
  }

  res.json({
    ok: true,
    from,
    to,
    width: boundW || null,
    height: boundH || null,
    translateFailed,
    items: items.map((it) => ({ src: it.src, dst: it.dst || '', pos: it.pos })),
  });
});

app.use(express.json({ limit: '64kb' }));

/* 健康检查 */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'transverse-translate', configured: CONFIGURED });
});

/* 翻译接口 */
app.post('/api/translate', async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').toString();

  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' });
  }

  const { text, from, to } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ ok: false, code: 'INVALID_TEXT', message: '待翻译文本不能为空' });
  }
  if (text.length > 5000) {
    return res.status(400).json({ ok: false, code: 'TEXT_TOO_LONG', message: '文本超过 5000 字符上限' });
  }
  if (typeof from !== 'string' || typeof to !== 'string') {
    return res.status(400).json({ ok: false, code: 'INVALID_LANGUAGE', message: '语言参数缺失' });
  }

  // 明确不支持的语言：直接报错，不伪造译文（前端将降级提示/回退 Mock）
  for (const code of [from, to]) {
    if (UNSUPPORTED[code]) {
      return res.status(400).json({ ok: false, code: 'UNSUPPORTED_LANGUAGE', message: UNSUPPORTED[code] });
    }
  }
  const source = LANG_MAP[from];
  const target = LANG_MAP[to];
  if (!source || !target) {
    return res.status(400).json({ ok: false, code: 'INVALID_LANGUAGE', message: '不支持的语言代码：' + (!source ? from : to) });
  }

  // 未配置腾讯云密钥时跳过 TMT，直接走免密钥兜底通道
  if (!CONFIGURED) {
    tmtBlockedUntil = Date.now() + 10 * 60 * 1000;
  }

  // 同语言翻译：原样返回
  if (source === target) {
    return res.json({ ok: true, from, to, text, provider: 'echo' });
  }

  // ① 优先腾讯云 TMT；额度耗尽后 10 分钟内跳过，避免重复无效请求
  if (Date.now() >= tmtBlockedUntil) {
    try {
      const translated = await tencentTextTranslate({ text, source, target });
      return res.json({ ok: true, from, to, text: translated, provider: 'tencent' });
    } catch (err) {
      console.error('[translate] 腾讯云调用失败:', err.tcCode || '', err.message);
      if (err.tcCode === 'FailedOperation.NoFreeAmount') {
        tmtBlockedUntil = Date.now() + 10 * 60 * 1000;
      }
    }
  }

  // ② 兜底：免密钥公共翻译，返回真实译文
  try {
    const translated = await myMemoryTranslate({ text, from, to });
    return res.json({ ok: true, from, to, text: translated, provider: 'mymemory' });
  } catch (err) {
    console.error('[translate] 兜底翻译失败:', err.message);
    res.status(502).json({
      ok: false, code: 'UPSTREAM_ERROR',
      message: '翻译服务暂时不可用，请稍后重试',
    });
  }
});

/* 静态托管（现有站点原样输出，UI 不变） */
app.use(express.static(__dirname, { extensions: ['html'] }));

/* 404 兜底（API 路径返回 JSON，其余回首页，配合 hash 路由） */
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: '接口不存在' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* 统一错误处理：任何异常（含 body 解析失败）都返回 JSON，不暴露堆栈 */
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, code: 'INVALID_JSON', message: '请求体不是合法 JSON' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ ok: false, code: 'PAYLOAD_TOO_LARGE', message: '请求体过大' });
  }
  console.error('[server] 未捕获异常:', err && err.message);
  res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  译境 TransVerse — 后端已启动');
  console.log('  http://localhost:' + PORT + '/');
  console.log('  翻译代理: POST /api/translate');
  console.log('  拍照翻译: POST /api/ocr-translate');
  console.log('  密钥状态: ' + (CONFIGURED ? '已配置 ✓' : '未配置 ✗（.env 缺少 TENCENT_SECRET_ID/TENCENT_SECRET_KEY）'));
  console.log('========================================');
});
