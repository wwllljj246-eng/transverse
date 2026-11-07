/* ============================================================
   文本翻译页
   - 顶部语言条（复用 LangCard，含交换动画）
   - AI 表达（4 种语气，第一阶段语气不影响真实译文）
   - 输入区：语音输入 / 粘贴 / 清空 / 字符计数
   - 翻译：优先调用后端真实 API（腾讯云 TMT）
     失败 / 超时 / 不可用时自动降级 Mock，并提示"当前使用演示翻译"
   ============================================================ */

import { store } from '../store.js';
import { LangCard } from '../components/langcard.js';
import { icon } from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { mockTranslate, realTranslate, TONES } from '../data/translation-mock.js';
import { favorites } from '../data/favorites.js';
import { escapeHtml } from '../utils/dom.js';

const MAX_CHARS = 5000;

export default function TranslatePage() {
  /* ---------- 页面本地状态 ---------- */
  let input = '';
  let tone = 'natural';
  let loading = false;
  let result = null;       // { from, to, tone, sourceText, text, id, faved }
  let speaking = false;
  let listening = false;
  let recognition = null;
  let voiceBase = '';
  let loadTimer = null;
  let translateReqId = 0;   // 请求序号：新请求发起后，旧请求的返回直接丢弃

  const page = document.createElement('div');
  page.className = 'page translate-page';

  page.innerHTML = `
    <div class="page-head page-pad">
      <h2 class="page-title">文本翻译</h2>
      <p class="page-sub">输入或粘贴文字，AI 为你精准互译</p>
    </div>

    <div class="lang-card-slot"></div>

    <div class="page-pad">
      <!-- AI 表达 -->
      <div class="tone-head">
        <span class="tone-badge">${icon('sparkles', 15)} AI 表达</span>
        <span class="tone-hint">选择语气，获得不同表达</span>
      </div>
      <div class="tone-row" role="tablist" aria-label="AI 表达"></div>

      <!-- 输入卡片 -->
      <div class="input-card">
        <textarea class="input-area" rows="5" maxlength="${MAX_CHARS}"
          placeholder="输入要翻译的文字…"></textarea>
        <div class="input-footer">
          <span class="char-count"><span class="char-num">0</span> / ${MAX_CHARS}</span>
          <div class="input-tools">
            <button class="tool-btn" data-tool="voice" aria-label="语音输入">
              <span class="tool-ico">${icon('mic', 18)}</span><span>语音</span>
            </button>
            <button class="tool-btn" data-tool="paste" aria-label="粘贴">
              <span class="tool-ico">${icon('clipboard', 18)}</span><span>粘贴</span>
            </button>
            <button class="tool-btn" data-tool="clear" aria-label="清空">
              <span class="tool-ico">${icon('close', 18)}</span><span>清空</span>
            </button>
          </div>
        </div>
      </div>

      <button class="translate-btn">
        ${icon('translate', 18)}<span>翻 译</span>
      </button>

      <!-- 结果区 -->
      <div class="result-slot"></div>
    </div>
  `;

  const langSlot = page.querySelector('.lang-card-slot');
  langSlot.appendChild(LangCard());

  const toneRow = page.querySelector('.tone-row');
  const textarea = page.querySelector('.input-area');
  const charNum = page.querySelector('.char-num');
  const translateBtn = page.querySelector('.translate-btn');
  const resultSlot = page.querySelector('.result-slot');

  /* ---------- AI 语气 ---------- */
  function renderTones() {
    toneRow.innerHTML = TONES.map(
      (t) => `
      <button class="tone-chip ${t.id === tone ? 'is-active' : ''}" data-tone="${t.id}" role="tab"
        aria-selected="${t.id === tone}">
        <span>${t.emoji}</span><span>${t.name}</span>
      </button>`
    ).join('');
  }

  toneRow.addEventListener('click', (e) => {
    const chip = e.target.closest('.tone-chip');
    if (!chip || chip.dataset.tone === tone) return;
    tone = chip.dataset.tone;
    renderTones();
    // 已有译文时，切换语气直接重新翻译
    if (result && !loading) runTranslate();
  });

  /* ---------- 输入区 ---------- */
  textarea.addEventListener('input', () => {
    input = textarea.value;
    charNum.textContent = input.length;
  });

  // Ctrl/Cmd + Enter 快捷翻译
  textarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runTranslate();
    }
  });

  page.querySelector('.input-tools').addEventListener('click', async (e) => {
    const btn = e.target.closest('.tool-btn');
    if (!btn) return;
    const tool = btn.dataset.tool;

    if (tool === 'clear') {
      input = '';
      result = null;
      textarea.value = '';
      charNum.textContent = '0';
      renderResult();
      textarea.focus();
      return;
    }

    if (tool === 'paste') {
      try {
        const text = await navigator.clipboard.readText();
        if (!text) {
          showToast('剪贴板没有内容');
          return;
        }
        appendInput(text);
        showToast('已粘贴');
      } catch {
        showToast('无法读取剪贴板，请长按输入框粘贴');
      }
      return;
    }

    if (tool === 'voice') {
      toggleVoice();
    }
  });

  function appendInput(text) {
    const next = (input + (input && !/\s$/.test(input) ? ' ' : '') + text).slice(0, MAX_CHARS);
    input = next;
    textarea.value = input;
    charNum.textContent = input.length;
  }

  /* ---------- 语音输入（Web Speech API，不支持时提示） ---------- */
  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showToast('当前浏览器不支持语音输入');
      return;
    }
    if (listening) {
      recognition?.stop();
      return;
    }
    recognition = new SR();
    recognition.lang = store.get().source.code;
    recognition.interimResults = true;
    recognition.continuous = true;
    voiceBase = input;

    recognition.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        interim += e.results[i][0].transcript;
      }
      textarea.value = (voiceBase + interim).slice(0, MAX_CHARS);
      input = textarea.value;
      charNum.textContent = input.length;
    };
    recognition.onerror = () => {
      listening = false;
      updateVoiceBtn();
      showToast('语音识别失败，请重试');
    };
    recognition.onend = () => {
      listening = false;
      updateVoiceBtn();
    };
    try {
      recognition.start();
      listening = true;
      updateVoiceBtn();
      showToast('正在聆听…再次点击结束');
    } catch {
      showToast('无法启动语音识别');
    }
  }

  function updateVoiceBtn() {
    page.querySelector('[data-tool="voice"]').classList.toggle('is-listening', listening);
  }

  /* ---------- 翻译流程 ---------- */
  translateBtn.addEventListener('click', () => runTranslate());

  function runTranslate(forcedText) {
    const text = String(forcedText ?? input).trim();
    if (!text) {
      showToast('请输入要翻译的文字');
      textarea.focus();
      return;
    }
    stopSpeaking();
    const { source, target } = store.get();
    loading = true;
    result = null;
    renderResult();

    clearTimeout(loadTimer);
    const reqId = ++translateReqId;

    // 优先走后端真实翻译（腾讯云 TMT）；失败/超时/不可用 → 降级 Mock
    realTranslate(text, source.code, target.code).then(({ ok, text: translated, message }) => {
      if (reqId !== translateReqId) return; // 已被更新的请求取代，丢弃

      let finalText = translated;
      let demo = false;
      if (!ok) {
        demo = true;
        finalText = mockTranslate(text, source.code, target.code, tone);
        showToast('翻译服务不可用，当前使用演示翻译');
      }

      const item = {
        from: source.code,
        to: target.code,
        tone,
        sourceText: text,
        text: finalText,
      };
      result = { ...item, id: favorites.idFor(item), faved: favorites.has(item), demo };
      loading = false;
      renderResult();
      if (demo && message) console.warn('[translate] 真实翻译降级原因:', message);
    });
  }

  /* ---------- 结果卡 ---------- */
  function renderResult() {
    if (loading) {
      resultSlot.innerHTML = `
        <div class="result-card loading-card">
          <span class="ai-spinner"></span>
          <div>
            <p class="loading-title">AI 翻译中…</p>
            <p class="loading-sub">正在理解语义并生成最佳表达</p>
          </div>
        </div>`;
      return;
    }

    if (!result) {
      resultSlot.innerHTML = `
        <div class="result-empty">
          ${icon('translate', 22)}
          <span>译文将显示在这里</span>
        </div>`;
      return;
    }

    const targetName = store.get().target.native;
    const toneName = TONES.find((t) => t.id === result.tone)?.name || '';

    resultSlot.innerHTML = `
      <div class="result-card">
        <div class="result-top">
          <span class="result-lang">${targetName}</span>
          <span class="result-tone">${icon('sparkles', 12)} ${toneName}</span>
        </div>
        ${result.demo ? `
        <p class="result-demo" style="margin:6px 0 0;font-size:12px;color:#e6a23c;">
          当前使用演示翻译（真实翻译服务暂不可用，结果仅供参考）
        </p>` : ''}
        <p class="result-text">${escapeHtml(result.text)}</p>
        <p class="result-source">${escapeHtml(result.sourceText)}</p>
        <div class="result-actions">
          <button class="action-btn ${speaking ? 'is-speaking' : ''}" data-act="speak">
            ${icon('volume', 19)}<span>发音</span>
          </button>
          <button class="action-btn" data-act="copy">${icon('copy', 18)}<span>复制</span></button>
          <button class="action-btn ${result.faved ? 'is-faved' : ''}" data-act="fav">
            ${icon(result.faved ? 'starFill' : 'star', 19)}<span>${result.faved ? '已收藏' : '收藏'}</span>
          </button>
          <button class="action-btn" data-act="share">${icon('share', 18)}<span>分享</span></button>
        </div>
      </div>`;
  }

  resultSlot.addEventListener('click', async (e) => {
    const btn = e.target.closest('.action-btn');
    if (!btn || !result) return;
    const act = btn.dataset.act;

    if (act === 'speak') {
      toggleSpeak(result.text, result.to);
      return;
    }
    if (act === 'copy') {
      await copyText(result.text);
      showToast('已复制到剪贴板');
      return;
    }
    if (act === 'fav') {
      const item = {
        from: result.from, to: result.to, tone: result.tone,
        sourceText: result.sourceText, text: result.text,
      };
      result.faved = favorites.toggle(item);
      renderResult();
      showToast(result.faved ? '已加入收藏' : '已取消收藏');
      return;
    }
    if (act === 'share') {
      const shareData = { title: '译境 TransVerse', text: `${result.sourceText}\n${result.text}` };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch {
          /* 用户取消分享 */
        }
      } else {
        await copyText(result.text);
        showToast('已复制，快去分享给好友吧');
      }
    }
  });

  /* ---------- 发音（Web Speech API） ---------- */
  function toggleSpeak(text, lang) {
    if (!('speechSynthesis' in window)) {
      showToast('当前设备不支持语音朗读');
      return;
    }
    if (speaking) {
      stopSpeaking();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 1;
    u.onend = u.onerror = () => {
      speaking = false;
      renderResult();
    };
    window.speechSynthesis.speak(u);
    speaking = true;
    renderResult();
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speaking = false;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      ta.remove();
    }
  }

  /* ---------- 语言变化联动 ---------- */
  const unsubscribe = store.subscribe((s, action) => {
    // 在翻译页点击交换：把译文变成新输入，并自动反向翻译
    if (action === 'swap' && result && !loading) {
      input = result.text;
      textarea.value = input;
      charNum.textContent = input.length;
      // Mock 短语库支持反向命中，译文作为新原文会译回旧原文
      runTranslate(result.text);
    }
  });

  /* ---------- 初始化 ---------- */
  renderTones();
  renderResult();
  setTimeout(() => textarea.focus(), 300);

  /* ---------- 卸载清理（防监听器/语音泄漏） ---------- */
  page._onUnload = () => {
    unsubscribe();
    clearTimeout(loadTimer);
    try { recognition?.abort?.(); } catch { /* ignore */ }
    stopSpeaking();
  };

  return page;
}
