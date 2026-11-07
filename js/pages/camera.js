/* ============================================================
   拍照翻译页 — 沉浸式相机界面
   - 顶部：返回 + 语言选择 + 相册导入
   - 相机预览：Mock 取景框 + 取景框扫描线动画
   - 拍照按钮：触发"识别"动画 → AR 半透明卡片覆盖在文字附近
   - 闪光灯：仅切换状态指示（无真实硬件）
   - AR 卡片：半透明气泡显示译文；点击单卡可单独翻译/收藏
   ============================================================ */

import { store } from '../store.js';
import { icon } from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { flagSvg } from '../components/flags.js';
import { getCameraScene } from '../data/camera-mock.js';
import { saves } from '../data/saves.js';

export default function CameraPage() {
  let flashOn = false;
  let scanning = false;       // 取景框扫描态
  let recognizing = false;   // 拍照后识别中
  let recognized = false;    // 已识别，AR 卡片已显示

  const page = document.createElement('div');
  page.className = 'page camera-page';

  page.innerHTML = `
    <div class="cam-top">
      <button class="cam-icon-btn nav-back" aria-label="返回">${icon('chevronLeft', 20)}</button>
      <button class="cam-lang-pill" data-side="source" aria-label="源语言">
        ${flagSvg(store.get().source.flag)}<span>${store.get().source.native}</span>
      </button>
      <button class="cam-swap-mini" aria-label="交换语言">${icon('swap', 18)}</button>
      <button class="cam-lang-pill" data-side="target" aria-label="目标语言">
        ${flagSvg(store.get().target.flag)}<span>${store.get().target.native}</span>
      </button>
      <button class="cam-icon-btn" data-act="album" aria-label="从相册导入">${icon('image', 20)}</button>
    </div>

    <div class="cam-viewfinder">
      <!-- 取景框：背景渐变模拟相机预览 -->
      <div class="cam-preview"></div>
      <div class="cam-scanline" aria-hidden="true"></div>
      <div class="cam-reticle" aria-hidden="true">
        <span class="reticle-corner tl"></span>
        <span class="reticle-corner tr"></span>
        <span class="reticle-corner bl"></span>
        <span class="reticle-corner br"></span>
      </div>
      <div class="cam-status">点击下方按钮拍照识别</div>
      <div class="ar-layer"></div>
    </div>

    <div class="cam-bottom">
      <button class="cam-side-btn" data-act="flash" aria-label="闪光灯">
        <span class="cam-side-ico">${icon(flashOn ? 'flashOn' : 'flashOff', 22)}</span>
        <span class="cam-side-label">${flashOn ? '开' : '关'}</span>
      </button>
      <button class="shutter" aria-label="拍照">
        <span class="shutter-core"></span>
      </button>
      <button class="cam-side-btn" data-act="save" aria-label="保存识别结果">
        <span class="cam-side-ico">${icon('star', 22)}</span>
        <span class="cam-side-label">保存</span>
      </button>
    </div>
  `;

  const arLayer = page.querySelector('.ar-layer');
  const statusEl = page.querySelector('.cam-status');
  const scanline = page.querySelector('.cam-scanline');
  const shutter = page.querySelector('.shutter');
  const flashBtn = page.querySelector('[data-act="flash"]');
  const saveBtn = page.querySelector('[data-act="save"]');
  const albumBtn = page.querySelector('[data-act="album"]');

  /* ---------- 返回 ---------- */
  page.querySelector('.nav-back').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.hash = '#/';
  });

  /* ---------- 语言选择 / 交换 ---------- */
  page.querySelectorAll('.cam-lang-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      location.hash = `#/lang-select?side=${pill.dataset.side}`;
    });
  });
  page.querySelector('.cam-swap-mini').addEventListener('click', () => {
    store.swap();
    showToast('已交换语言');
  });
  // 状态变化时更新语言显示
  const unsub = store.subscribe((s) => {
    page.querySelectorAll('.cam-lang-pill').forEach((pill) => {
      const side = pill.dataset.side;
      const lang = s[side];
      pill.innerHTML = `${flagSvg(lang.flag)}<span>${lang.native}</span>`;
    });
  });

  /* ---------- 闪光灯 ---------- */
  flashBtn.addEventListener('click', () => {
    flashOn = !flashOn;
    flashBtn.querySelector('.cam-side-ico').innerHTML = icon(flashOn ? 'flashOn' : 'flashOff', 22);
    flashBtn.querySelector('.cam-side-label').textContent = flashOn ? '开' : '关';
    showToast(flashOn ? '闪光灯已开' : '闪光灯已关');
  });

  /* ---------- 相册导入 ---------- */
  albumBtn.addEventListener('click', () => {
    showToast('已选择相册示例图片');
    reset();
    recognize();
  });

  /* ---------- 拍照识别 ---------- */
  shutter.addEventListener('click', () => {
    if (recognizing || scanning) return;
    if (recognized) {
      // 已识别状态再次点击 → 清除重置
      reset();
      return;
    }
    recognize();
  });

  function reset() {
    recognized = false;
    recognizing = false;
    scanning = false;
    arLayer.innerHTML = '';
    arLayer.classList.remove('is-show');
    statusEl.textContent = '点击下方按钮拍照识别';
    scanline.classList.remove('scanning');
  }

  function recognize() {
    recognizing = true;
    scanning = true;
    scanline.classList.add('scanning');
    statusEl.textContent = '正在识别画面文字…';

    // 模拟识别延迟
    setTimeout(() => {
      scanning = false;
      scanline.classList.remove('scanning');
      renderAR();
      recognizing = false;
      recognized = true;
      statusEl.textContent = `已识别 ${getCameraScene().items.length} 处文字，点击保存入库`;
    }, 1400);
  }

  function renderAR() {
    const scene = getCameraScene();
    arLayer.innerHTML = scene.items.map((item, idx) => `
      <div class="ar-card" style="left:${item.pos.left}%;top:${item.pos.top}%;width:${item.pos.width}%"
           data-idx="${idx}" role="button" tabindex="0">
        <span class="ar-src">${item.src}</span>
        <span class="ar-dst">${item.dst}</span>
      </div>
    `).join('');
    arLayer.classList.add('is-show');

    // AR 卡片渐次出现
    arLayer.querySelectorAll('.ar-card').forEach((card, i) => {
      card.style.animationDelay = `${i * 90}ms`;
    });
  }

  /* ---------- 保存识别结果 ---------- */
  saveBtn.addEventListener('click', () => {
    if (!recognized) {
      showToast('请先拍照识别');
      return;
    }
    const scene = getCameraScene();
    const snap = store.get();
    const record = saves.add({
      type: 'photo',
      title: scene.title,
      payload: {
        source: snap.source.code,
        target: snap.target.code,
        items: scene.items.map((it) => ({ src: it.src, dst: it.dst })),
      },
    });
    showToast('已保存到记录');
    console.debug('[saves] photo saved:', record.id);
  });

  /* ---------- 卸载 ---------- */
  page._onUnload = () => unsub();

  return page;
}
