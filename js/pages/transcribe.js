/* ============================================================
   实时转写页 — 逐字生成 + AI 智能整理
   - 顶部：返回 / 标题 / 状态指示
   - 转写区：逐字显示，段落自动换行；底部声波
   - 控制按钮：开始/暂停/保存/AI 整理
   - AI 智能整理面板（点击"生成"后展开）：
       * 会议重点（编号列表）
       * 待办事项（可勾选 checkbox）
   - AI 整理结果可保存入库
   ============================================================ */

import { store } from '../store.js';
import { icon } from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { TRANSCRIBE_SCRIPT, AI_SUMMARY } from '../data/speech-mock.js';
import { saves } from '../data/saves.js';
import { formatDuration } from '../utils/dom.js';

export default function TranscribePage() {
  let running = false;
  let segIdx = 0;
  let charIdx = 0;
  let accumulated = '';       // 已完整段落 + 当前段落已显字符
  let charTimer = null;
  let summaryOpen = false;    // AI 整理面板是否展开
  let todosState = AI_SUMMARY.todos.map((t) => ({ ...t }));

  const page = document.createElement('div');
  page.className = 'page transcribe-page';

  page.innerHTML = `
    <div class="nav-bar">
      <button class="nav-back" aria-label="返回">${icon('chevronLeft', 20)}</button>
      <span class="nav-title">实时转写</span>
      <span class="nav-spacer"></span>
    </div>

    <div class="tr-status">
      <span class="tr-dot"></span>
      <span class="tr-status-text">已就绪</span>
      <span class="tr-timer">00:00</span>
    </div>

    <div class="tr-stage">
      <div class="tr-soundwave" aria-hidden="true">
        ${Array.from({ length: 16 }).map((_, i) => `<span style="animation-delay:${i * 70}ms"></span>`).join('')}
      </div>
      <div class="tr-text-area">
        <p class="tr-text" aria-live="polite">
          <span class="tr-placeholder">点击开始，AI 将实时把语音转换为文字…</span>
        </p>
      </div>
    </div>

    <div class="tr-controls">
      <button class="tr-ctrl" data-act="summary" aria-label="AI 智能整理">
        ${icon('sparkles', 20)}<span>AI 整理</span>
      </button>
      <button class="tr-play" data-act="play" aria-label="开始">
        <span class="play-ico">${icon('play', 28)}</span>
      </button>
      <button class="tr-ctrl" data-act="save" aria-label="保存">
        ${icon('save', 20)}<span>保存</span>
      </button>
    </div>

    <section class="ai-summary-panel" aria-label="AI 智能整理">
      <div class="ai-summary-head">
        <span class="ai-summary-badge">${icon('sparkles', 15)} AI 智能整理</span>
        <button class="ai-summary-toggle" aria-label="收起">${icon('chevronRight', 18)}</button>
      </div>
      <div class="ai-summary-body">
        <h4 class="ai-summary-sub">会议重点</h4>
        <ol class="ai-summary-highlights"></ol>
        <h4 class="ai-summary-sub">待办事项</h4>
        <ul class="ai-summary-todos"></ul>
        <button class="ai-summary-save" data-act="save-summary">
          ${icon('save', 16)} 保存 AI 整理结果
        </button>
      </div>
    </section>
  `;

  /* ---------- 缓存 ---------- */
  const dot = page.querySelector('.tr-dot');
  const statusText = page.querySelector('.tr-status-text');
  const timerEl = page.querySelector('.tr-timer');
  const soundwave = page.querySelector('.tr-soundwave');
  const textEl = page.querySelector('.tr-text');
  const placeholder = page.querySelector('.tr-placeholder');
  const playBtn = page.querySelector('[data-act="play"]');
  const summaryPanel = page.querySelector('.ai-summary-panel');
  const summaryToggle = page.querySelector('.ai-summary-toggle');
  const highlightsEl = page.querySelector('.ai-summary-highlights');
  const todosEl = page.querySelector('.ai-summary-todos');

  /* ---------- 返回 ---------- */
  page.querySelector('.nav-back').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.hash = '#/';
  });

  /* ---------- 播放控制 ---------- */
  playBtn.addEventListener('click', () => {
    if (running) pause();
    else start();
  });

  let startTime = 0;
  let timerHandle = null;

  function start() {
    // 如果已结束 → 重新开始
    if (segIdx >= TRANSCRIBE_SCRIPT.segments.length && !running) {
      segIdx = 0; charIdx = 0; accumulated = '';
      textEl.innerHTML = '';
    }
    running = true;
    dot.classList.add('is-live');
    statusText.textContent = '正在转写';
    soundwave.classList.add('is-playing');
    playBtn.querySelector('.play-ico').innerHTML = icon('pause', 28);
    if (placeholder) placeholder.remove();
    if (!startTime) {
      startTime = Date.now();
      timerHandle = setInterval(updateTimer, 500);
    }
    typeNext();
  }

  function pause() {
    running = false;
    dot.classList.remove('is-live');
    statusText.textContent = '已暂停';
    soundwave.classList.remove('is-playing');
    playBtn.querySelector('.play-ico').innerHTML = icon('play', 28);
    clearTimeout(charTimer);
    clearInterval(timerHandle);
    timerHandle = null;
  }

  function updateTimer() {
    timerEl.textContent = formatDuration(Date.now() - startTime);
  }

  function typeNext() {
    if (!running) return;
    if (segIdx >= TRANSCRIBE_SCRIPT.segments.length) {
      // 全部转写完成
      running = false;
      dot.classList.remove('is-live');
      statusText.textContent = '转写完成';
      soundwave.classList.remove('is-playing');
      playBtn.querySelector('.play-ico').innerHTML = icon('play', 28);
      clearInterval(timerHandle);
      timerHandle = null;
      showToast('转写完成，可生成 AI 整理');
      return;
    }
    const seg = TRANSCRIBE_SCRIPT.segments[segIdx];
    if (charIdx === 0) {
      // 进入新段，加段前缀
      accumulated += (segIdx > 0 ? '<br><br>' : '');
      textEl.innerHTML = accumulated;
    }
    if (charIdx < seg.length) {
      accumulated += seg[charIdx];
      textEl.innerHTML = accumulated;
      charIdx++;
      charTimer = setTimeout(typeNext, TRANSCRIBE_SCRIPT.segLen);
    } else {
      // 本段结束
      segIdx++;
      charIdx = 0;
      charTimer = setTimeout(typeNext, 360);
    }
  }

  /* ---------- AI 整理 ---------- */
  page.querySelector('[data-act="summary"]').addEventListener('click', () => {
    if (!summaryOpen) {
      openSummary();
    } else {
      closeSummary();
    }
  });
  summaryToggle.addEventListener('click', closeSummary);

  function openSummary() {
    summaryOpen = true;
    summaryPanel.classList.add('is-open');
    summaryToggle.innerHTML = icon('chevronLeft', 18);
    renderSummary();
  }
  function closeSummary() {
    summaryOpen = false;
    summaryPanel.classList.remove('is-open');
    summaryToggle.innerHTML = icon('chevronRight', 18);
  }

  function renderSummary() {
    highlightsEl.innerHTML = AI_SUMMARY.highlights.map(
      (h) => `<li class="ai-highlight"><span class="hl-no">${h.no}</span><span>${h.text}</span></li>`
    ).join('');
    todosEl.innerHTML = todosState.map((t, i) => `
      <li class="ai-todo ${t.done ? 'is-done' : ''}" data-idx="${i}">
        <button class="todo-check" aria-label="${t.done ? '取消完成' : '标记完成'}">
          ${t.done ? icon('check', 14) : ''}
        </button>
        <span class="todo-text">${t.text}</span>
      </li>
    `).join('');
    todosEl.querySelectorAll('.todo-check').forEach((btn) => {
      btn.addEventListener('click', () => {
        const li = btn.closest('.ai-todo');
        const idx = +li.dataset.idx;
        todosState[idx].done = !todosState[idx].done;
        renderSummary();
      });
    });
  }

  /* ---------- 保存 ---------- */
  page.querySelector('[data-act="save"]').addEventListener('click', () => {
    if (!accumulated) {
      showToast('暂无内容可保存');
      return;
    }
    const snap = store.get();
    const record = saves.add({
      type: 'transcribe',
      title: '实时转写记录',
      payload: {
        source: snap.source.code,
        target: snap.source.code,
        text: textEl.textContent,
        segments: TRANSCRIBE_SCRIPT.segments.length,
      },
    });
    showToast('已保存到记录');
    console.debug('[saves] transcribe saved:', record.id);
  });

  page.querySelector('[data-act="save-summary"]').addEventListener('click', () => {
    const record = saves.add({
      type: 'summary',
      title: 'AI 智能整理',
      payload: {
        highlights: AI_SUMMARY.highlights,
        todos: todosState,
      },
    });
    showToast('AI 整理已保存');
    console.debug('[saves] summary saved:', record.id);
  });

  /* ---------- 卸载 ---------- */
  page._onUnload = () => {
    clearTimeout(charTimer);
    clearInterval(timerHandle);
  };

  return page;
}
