/* ============================================================
   AI 同声传译页 — 实时翻译动画
   - 顶部状态指示（● 正在实时翻译 / 已暂停）
   - 双区显示：原文 / 译文（逐字产出）
   - 三种显示模式：双语 / 字幕 / 专注（全屏沉浸）
   - 底部：开始 / 暂停 / 保存 / 切换语言
   - 声波动画：播放期间持续律动；暂停时静止
   ============================================================ */

import { store } from '../store.js';
import { icon } from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { flagSvg } from '../components/flags.js';
import { INTERPRETER_SCRIPT } from '../data/speech-mock.js';
import { saves } from '../data/saves.js';
import { LANGUAGES } from '../data/languages.js';
import { setActiveBy } from '../utils/dom.js';

const MODES = [
  { id: 'bilingual', name: '双语', icon: 'list' },
  { id: 'subtitle',  name: '字幕', icon: 'subtitle' },
  { id: 'focus',     name: '专注', icon: 'maximize' },
];

export default function InterpreterPage() {
  let mode = 'bilingual';
  let running = false;       // 是否正在播放
  let chunkIdx = 0;          // 当前剧本段
  let srcShown = '';          // 原文累计已显示
  let dstShown = '';         // 译文累计已显示
  let charTimer = null;      // 逐字定时器
  let modeSwitchTimer = null;
  let finished = false;      // 剧本播完

  const page = document.createElement('div');
  page.className = 'page interp-page';

  page.innerHTML = `
    <div class="nav-bar">
      <button class="nav-back" aria-label="返回">${icon('chevronLeft', 20)}</button>
      <span class="nav-title">AI 同声传译</span>
      <span class="nav-spacer"></span>
    </div>

    <div class="interp-status">
      <span class="status-dot"></span>
      <span class="status-text">已就绪</span>
    </div>

    <div class="interp-modes" role="tablist">
      ${MODES.map((m) => `
        <button class="mode-chip ${m.id === mode ? 'is-active' : ''}" data-mode="${m.id}">
          ${icon(m.icon, 14)}<span>${m.name}</span>
        </button>`).join('')}
    </div>

    <div class="interp-stage">
      <!-- 声波 -->
      <div class="soundwave" aria-hidden="true">
        ${Array.from({ length: 18 }).map((_, i) => `<span style="animation-delay:${i * 60}ms"></span>`).join('')}
      </div>

      <!-- 原文 -->
      <section class="interp-block interp-source">
        <header class="interp-head">
          <span class="interp-flag" data-side="source"></span>
          <span class="interp-lang" data-lang="source"></span>
        </header>
        <p class="interp-text" data-text="source">${srcShown || '<span class="interp-placeholder">点击开始，AI 实时翻译即将开始</span>'}</p>
      </section>

      <div class="interp-divider"><span class="interp-arrow">${icon('chevronRight', 18)}</span></div>

      <!-- 译文 -->
      <section class="interp-block interp-target">
        <header class="interp-head">
          <span class="interp-flag" data-side="target"></span>
          <span class="interp-lang" data-lang="target"></span>
        </header>
        <p class="interp-text" data-text="target"></p>
      </section>
    </div>

    <div class="interp-controls">
      <button class="interp-ctrl" data-act="switch" aria-label="切换语言">
        ${icon('swap', 22)}<span>切换</span>
      </button>
      <button class="interp-play" data-act="play" aria-label="开始">
        <span class="play-ico">${icon('play', 28)}</span>
      </button>
      <button class="interp-ctrl" data-act="save" aria-label="保存">
        ${icon('save', 22)}<span>保存</span>
      </button>
    </div>
  `;

  /* ---------- 缓存元素 ---------- */
  const statusDot = page.querySelector('.status-dot');
  const statusText = page.querySelector('.status-text');
  const stage = page.querySelector('.interp-stage');
  const soundwave = page.querySelector('.soundwave');
  const sourceFlagEl = page.querySelector('.interp-flag[data-side="source"]');
  const targetFlagEl = page.querySelector('.interp-flag[data-side="target"]');
  const sourceLangEl = page.querySelector('.interp-lang[data-lang="source"]');
  const targetLangEl = page.querySelector('.interp-lang[data-lang="target"]');
  const srcTextEl = page.querySelector('[data-text="source"]');
  const dstTextEl = page.querySelector('[data-text="target"]');
  const playBtn = page.querySelector('[data-act="play"]');

  /* ---------- 返回 ---------- */
  page.querySelector('.nav-back').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.hash = '#/';
  });

  /* ---------- 模式切换 ---------- */
  page.querySelectorAll('.mode-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const next = chip.dataset.mode;
      if (next === mode) return;
      mode = next;
      setActiveBy(page, '.mode-chip', 'mode', mode);
      stage.classList.remove('mode-bilingual', 'mode-subtitle', 'mode-focus');
      stage.classList.add('mode-' + mode);
      showToast('已切换到' + MODES.find((m) => m.id === mode).name + '模式');
    });
  });
  stage.classList.add('mode-bilingual');

  /* ---------- 语言显示 ---------- */
  function updateLangUI() {
    const snap = store.get();
    sourceFlagEl.innerHTML = flagSvg(snap.source.flag);
    targetFlagEl.innerHTML = flagSvg(snap.target.flag);
    sourceLangEl.textContent = snap.source.native;
    targetLangEl.textContent = snap.target.native;
  }
  updateLangUI();

  const unsub = store.subscribe((s, action) => {
    if (action === 'swap') {
      updateLangUI();
      // 交换后自动从头播放新方向
      stopAndReset();
    }
  });

  /* ---------- 控制按钮 ---------- */
  playBtn.addEventListener('click', () => {
    if (running) pause();
    else start();
  });

  page.querySelector('[data-act="switch"]').addEventListener('click', () => {
    store.swap();
    showToast('已切换语言方向');
  });

  page.querySelector('[data-act="save"]').addEventListener('click', () => {
    if (!srcShown && !dstShown) {
      showToast('暂无内容可保存');
      return;
    }
    const snap = store.get();
    const record = saves.add({
      type: 'interpreter',
      title: '同声传译记录',
      payload: {
        source: snap.source.code,
        target: snap.target.code,
        sourceText: srcShown,
        targetText: dstShown,
        chunks: INTERPRETER_SCRIPT.chunks.length,
      },
    });
    showToast('已保存到记录');
    console.debug('[saves] interpreter saved:', record.id);
  });

  /* ---------- 播放逻辑 ---------- */
  function start() {
    if (finished) {
      // 重新开始
      chunkIdx = 0; srcShown = ''; dstShown = '';
      finished = false;
      srcTextEl.textContent = '';
      dstTextEl.textContent = '';
    }
    running = true;
    statusDot.classList.add('is-live');
    statusText.textContent = '正在实时翻译';
    soundwave.classList.add('is-playing');
    playBtn.querySelector('.play-ico').innerHTML = icon('pause', 28);
    playBtn.setAttribute('aria-label', '暂停');
    playNextChunk();
  }

  function pause() {
    running = false;
    clearTimeout(charTimer);
    statusDot.classList.remove('is-live');
    statusText.textContent = '已暂停';
    soundwave.classList.remove('is-playing');
    playBtn.querySelector('.play-ico').innerHTML = icon('play', 28);
    playBtn.setAttribute('aria-label', '继续');
  }

  function stopAndReset() {
    running = false;
    finished = false;
    chunkIdx = 0;
    srcShown = '';
    dstShown = '';
    srcTextEl.innerHTML = '<span class="interp-placeholder">点击开始，AI 实时翻译即将开始</span>';
    dstTextEl.textContent = '';
    statusDot.classList.remove('is-live');
    statusText.textContent = '已就绪';
    soundwave.classList.remove('is-playing');
    playBtn.querySelector('.play-ico').innerHTML = icon('play', 28);
    clearTimeout(charTimer);
  }

  function playNextChunk() {
    if (chunkIdx >= INTERPRETER_SCRIPT.chunks.length) {
      // 剧本播完
      running = false;
      finished = true;
      statusDot.classList.remove('is-live');
      statusText.textContent = '已结束';
      soundwave.classList.remove('is-playing');
      playBtn.querySelector('.play-ico').innerHTML = icon('play', 28);
      showToast('传译结束，可点击保存');
      return;
    }
    if (!running) return;

    const chunk = INTERPRETER_SCRIPT.chunks[chunkIdx];
    typewriter(chunk.src, srcTextEl, srcShown, chunk.segLen, (full) => {
      srcShown = full;
      // 原文出完 → 短暂后开始译文
      charTimer = setTimeout(() => {
        if (!running) return;
        typewriter(chunk.dst, dstTextEl, dstShown, chunk.segLen, (full2) => {
          dstShown = full2;
          chunkIdx++;
          charTimer = setTimeout(playNextChunk, 220);
        });
      }, 200);
    });
  }

  /** 逐字打出字符串，每字 segLen 毫秒 */
  function typewriter(text, el, base, segLen, done) {
    let i = 0;
    const start = base ? base + '' : '';
    el.textContent = start;

    function step() {
      if (!running) return;
      if (i >= text.length) {
        done(start + text);
        return;
      }
      el.textContent = start + text.slice(0, i + 1);
      i++;
      charTimer = setTimeout(step, segLen);
    }
    step();
  }

  /* ---------- 卸载 ---------- */
  page._onUnload = () => {
    unsub();
    clearTimeout(charTimer);
    clearTimeout(modeSwitchTimer);
  };

  return page;
}
