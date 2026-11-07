/* ============================================================
   面对面对话页
   - 上下分屏：上半 A 正常显示，下半 B 180° 翻转（对面的人可读）
   - 自动对话 Mock：A 说 → 翻译 → B 答 → 翻译 → 循环
   - 控制：开始 / 暂停 / 播放（TTS）/ 切换语言
   ============================================================ */

import { store } from '../store.js';
import { icon } from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { flagSvg } from '../components/flags.js';
import { DIALOGUE_SCRIPT } from '../data/dialogue-mock.js';
import { LANGUAGES } from '../data/languages.js';
import { escapeHtml } from '../utils/dom.js';

export default function DialoguePage() {
  let running = false;
  let turnIdx = 0;
  let timer = null;
  let messages = []; // { speaker, text, translated, side }

  const page = document.createElement('div');
  page.className = 'page dialogue-page';

  page.innerHTML = `
    <div class="dlg-top">
      <button class="dlg-back" aria-label="返回">${icon('chevronLeft', 20)}</button>
      <span class="dlg-title">面对面对话</span>
      <button class="dlg-swap" aria-label="切换语言">${icon('swap', 18)}</button>
    </div>

    <!-- 上半：A 侧（正常） -->
    <div class="dlg-half dlg-side-a">
      <div class="dlg-lang-tag">
        ${flagSvg(LANGUAGES[DIALOGUE_SCRIPT.langA].flag)}
        <span>${LANGUAGES[DIALOGUE_SCRIPT.langA].native}</span>
      </div>
      <div class="dlg-bubble-area dlg-bubble-a"></div>
    </div>

    <!-- 分隔线 -->
    <div class="dlg-divider"><span class="dlg-divider-icon">${icon('chevronRight', 16)}</span></div>

    <!-- 下半：B 侧（180° 翻转） -->
    <div class="dlg-half dlg-side-b">
      <div class="dlg-lang-tag">
        ${flagSvg(LANGUAGES[DIALOGUE_SCRIPT.langB].flag)}
        <span>${LANGUAGES[DIALOGUE_SCRIPT.langB].native}</span>
      </div>
      <div class="dlg-bubble-area dlg-bubble-b"></div>
    </div>

    <!-- 控制条 -->
    <div class="dlg-controls">
      <button class="dlg-ctrl-btn" data-act="play" aria-label="播放">
        ${icon('volume', 20)}<span>播放</span>
      </button>
      <button class="dlg-ctrl-main" data-act="toggle" aria-label="开始">
        <span class="dlg-ctrl-main-ico">${icon('play', 26)}</span>
        <span class="dlg-ctrl-main-label">开始</span>
      </button>
      <button class="dlg-ctrl-btn" data-act="switch" aria-label="切换语言">
        ${icon('swap', 20)}<span>切换</span>
      </button>
    </div>
  `;

  const bubbleA = page.querySelector('.dlg-bubble-a');
  const bubbleB = page.querySelector('.dlg-bubble-b');
  const toggleBtn = page.querySelector('[data-act="toggle"]');
  const mainIco = toggleBtn.querySelector('.dlg-ctrl-main-ico');
  const mainLabel = toggleBtn.querySelector('.dlg-ctrl-main-label');

  /* ---------- 返回 ---------- */
  page.querySelector('.dlg-back').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.hash = '#/';
  });

  /* ---------- 切换语言（仅交换 A/B 语言显示，剧本方向不变） ---------- */
  page.querySelector('[data-act="switch"]').addEventListener('click', () => {
    store.swap();
    showToast('已切换语言方向');
  });

  /* ---------- 播放 TTS ---------- */
  page.querySelector('[data-act="play"]').addEventListener('click', () => {
    if (!messages.length) {
      showToast('暂无内容可播放');
      return;
    }
    if (!('speechSynthesis' in window)) {
      showToast('当前设备不支持语音朗读');
      return;
    }
    window.speechSynthesis.cancel();
    const last = messages[messages.length - 1];
    const u = new SpeechSynthesisUtterance(last.text);
    u.lang = last.speaker === 'A' ? DIALOGUE_SCRIPT.langA : DIALOGUE_SCRIPT.langB;
    window.speechSynthesis.speak(u);
    showToast('正在朗读最后一句');
  });

  /* ---------- 开始 / 暂停 ---------- */
  toggleBtn.addEventListener('click', () => {
    if (running) pause();
    else start();
  });

  function start() {
    running = true;
    mainIco.innerHTML = icon('pause', 26);
    mainLabel.textContent = '暂停';
    nextTurn();
  }

  function pause() {
    running = false;
    clearTimeout(timer);
    mainIco.innerHTML = icon('play', 26);
    mainLabel.textContent = '继续';
  }

  /* ---------- 逐轮产出 ---------- */
  function nextTurn() {
    if (!running) return;
    if (turnIdx >= DIALOGUE_SCRIPT.turns.length) {
      // 剧本播完 → 重置重播
      turnIdx = 0;
      messages = [];
      bubbleA.innerHTML = '';
      bubbleB.innerHTML = '';
    }
    const turn = DIALOGUE_SCRIPT.turns[turnIdx];
    messages.push(turn);
    appendBubble(turn);
    turnIdx++;
    timer = setTimeout(nextTurn, 1600);
  }

  function appendBubble(turn) {
    const isA = turn.speaker === 'A';
    const area = isA ? bubbleA : bubbleB;
    const bubble = document.createElement('div');
    bubble.className = 'dlg-bubble ' + (isA ? 'bubble-a' : 'bubble-b');
    bubble.innerHTML = `
      <span class="dlg-bubble-text">${escapeHtml(turn.text)}</span>
      <span class="dlg-bubble-trans">${escapeHtml(turn.translated)}</span>
    `;
    area.appendChild(bubble);
    area.scrollTop = area.scrollHeight;
    // 滚动到底（A 侧向下，B 侧翻转后视觉方向相反但 DOM 滚动方向一致）
  }

  /* ---------- 卸载 ---------- */
  page._onUnload = () => {
    clearTimeout(timer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  return page;
}
