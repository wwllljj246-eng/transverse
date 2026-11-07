/* ============================================================
   悬浮字幕页
   - 可拖动字幕窗口（真实 pointer 事件拖动）
   - 设置：字体大小 / 透明度 / 单语 / 双语 / 暂停
   - Mock 逐句产出字幕（日文 → 中文）
   ============================================================ */

import { icon } from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { SUBTITLE_SCRIPT } from '../data/dialogue-mock.js';
import { setActiveBy } from '../utils/dom.js';

export default function SubtitlePage() {
  let playing = false;
  let idx = 0;
  let timer = null;
  let fontSize = 18;
  let opacity = 0.92;
  let bilingual = true;
  let paused = false;

  // 拖动状态
  let dragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  const page = document.createElement('div');
  page.className = 'page subtitle-page';

  page.innerHTML = `
    <div class="nav-bar">
      <button class="nav-back" aria-label="返回">${icon('chevronLeft', 20)}</button>
      <span class="nav-title">悬浮字幕</span>
      <span class="nav-spacer"></span>
    </div>

    <div class="sub-stage">
      <div class="sub-window" style="left:20px;top:80px;font-size:18px;opacity:0.92">
        <div class="sub-window-bar">
          <span class="sub-window-title">悬浮字幕</span>
          <button class="sub-close" aria-label="关闭字幕">${icon('close', 14)}</button>
        </div>
        <div class="sub-window-body">
          <p class="sub-src"></p>
          <p class="sub-dst"></p>
        </div>
      </div>
    </div>

    <div class="sub-controls">
      <div class="sub-control-row">
        <label class="sub-ctrl-label">字体大小</label>
        <input class="sub-range" type="range" min="12" max="36" value="18" data-ctrl="font" />
        <span class="sub-val">18px</span>
      </div>
      <div class="sub-control-row">
        <label class="sub-ctrl-label">透明度</label>
        <input class="sub-range" type="range" min="30" max="100" value="92" data-ctrl="opacity" />
        <span class="sub-val">92%</span>
      </div>
      <div class="sub-control-row">
        <label class="sub-ctrl-label">显示模式</label>
        <div class="sub-mode-group">
          <button class="sub-mode-btn is-active" data-mode="bilingual">双语</button>
          <button class="sub-mode-btn" data-mode="single">单语</button>
        </div>
      </div>
      <div class="sub-control-row">
        <label class="sub-ctrl-label">播放控制</label>
        <button class="sub-pause-btn" data-act="pause">${icon('pause', 16)} 暂停</button>
      </div>
    </div>
  `;

  const win = page.querySelector('.sub-window');
  const bar = page.querySelector('.sub-window-bar');
  const srcEl = page.querySelector('.sub-src');
  const dstEl = page.querySelector('.sub-dst');
  const fontRange = page.querySelector('[data-ctrl="font"]');
  const opacityRange = page.querySelector('[data-ctrl="opacity"]');
  const fontVal = page.querySelectorAll('.sub-val')[0];
  const opacityVal = page.querySelectorAll('.sub-val')[1];
  const modeBtns = page.querySelectorAll('.sub-mode-btn');
  const pauseBtn = page.querySelector('[data-act="pause"]');

  /* ---------- 返回 ---------- */
  page.querySelector('.nav-back').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.hash = '#/';
  });

  /* ---------- 真实拖动（pointer 事件） ---------- */
  bar.addEventListener('pointerdown', (e) => {
    dragging = true;
    bar.setPointerCapture(e.pointerId);
    const rect = win.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    win.style.transition = 'none';
  });

  bar.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const stage = page.querySelector('.sub-stage').getBoundingClientRect();
    let x = e.clientX - dragOffsetX;
    let y = e.clientY - dragOffsetY;
    // 限制在舞台内
    const maxX = stage.width - win.offsetWidth;
    const maxY = stage.height - win.offsetHeight;
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));
    win.style.left = x + 'px';
    win.style.top = y + 'px';
  });

  bar.addEventListener('pointerup', (e) => {
    dragging = false;
    try { bar.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    win.style.transition = '';
  });

  bar.addEventListener('pointercancel', () => { dragging = false; });

  /* ---------- 关闭字幕窗（隐藏，可重新打开） ---------- */
  page.querySelector('.sub-close').addEventListener('click', () => {
    win.style.display = 'none';
    showToast('字幕已隐藏，刷新页面可恢复');
  });

  /* ---------- 字体大小 ---------- */
  fontRange.addEventListener('input', () => {
    fontSize = +fontRange.value;
    win.style.fontSize = fontSize + 'px';
    fontVal.textContent = fontSize + 'px';
  });

  /* ---------- 透明度 ---------- */
  opacityRange.addEventListener('input', () => {
    opacity = +opacityRange.value / 100;
    win.style.opacity = opacity;
    opacityVal.textContent = opacityRange.value + '%';
  });

  /* ---------- 单语 / 双语 ---------- */
  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      bilingual = mode === 'bilingual';
      setActiveBy(page, '.sub-mode-btn', 'mode', mode);
      dstEl.style.display = bilingual ? 'block' : 'none';
      showToast(bilingual ? '双语模式' : '单语模式');
    });
  });

  /* ---------- 暂停 / 继续 ---------- */
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    if (paused) {
      pauseBtn.innerHTML = icon('play', 16) + ' 继续';
      showToast('字幕已暂停');
    } else {
      pauseBtn.innerHTML = icon('pause', 16) + ' 暂停';
      showToast('字幕继续');
    }
  });

  /* ---------- Mock 逐句产出 ---------- */
  function playNext() {
    if (!playing || paused) return;
    if (idx >= SUBTITLE_SCRIPT.length) idx = 0;
    const item = SUBTITLE_SCRIPT[idx];
    srcEl.textContent = item.src;
    dstEl.textContent = item.dst;
    idx++;
    timer = setTimeout(playNext, 2200);
  }

  function start() {
    playing = true;
    playNext();
  }

  /* ---------- 启动 ---------- */
  start();

  /* ---------- 卸载 ---------- */
  page._onUnload = () => {
    clearTimeout(timer);
  };

  return page;
}
