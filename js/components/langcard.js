/* ============================================================
   语言选择卡片组件 — 源语言 ⇄ 目标语言
   点击左右区域 → 语言选择页；点击中间按钮 → 交换（带动画）
   ============================================================ */

import { store } from '../store.js';
import { flagSvg } from './flags.js';
import { icon } from './icons.js';

export function LangCard() {
  const card = document.createElement('section');
  card.className = 'lang-card';
  card.setAttribute('aria-label', '语言选择');

  const render = (s) => {
    card.innerHTML = `
      <button class="lang-slot" data-side="source" aria-label="选择源语言，当前 ${s.source.native}">
        ${flagSvg(s.source.flag)}
        <span class="lang-name">${s.source.native}</span>
        <span class="lang-tag">源语言</span>
      </button>

      <button class="swap-btn" aria-label="交换语言">${icon('swap', 22)}</button>

      <button class="lang-slot" data-side="target" aria-label="选择目标语言，当前 ${s.target.native}">
        ${flagSvg(s.target.flag)}
        <span class="lang-name">${s.target.native}</span>
        <span class="lang-tag">目标语言</span>
      </button>
    `;
  };

  render(store.get());

  // 点击两侧 → 进入语言选择页（占位）
  card.addEventListener('click', (e) => {
    if (e.target.closest('.swap-btn')) return; // 交换按钮单独处理
    const slot = e.target.closest('.lang-slot');
    if (slot) {
      location.hash = `#/lang-select?side=${slot.dataset.side}`;
    }
  });

  // 点击中间 → 交换语言 + 动画（事件委托，DOM 重建后依然有效）
  let animating = false;
  card.addEventListener('click', (e) => {
    if (!e.target.closest('.swap-btn') || animating) return;
    animating = true;
    card.querySelector('.swap-btn')?.classList.add('rotated');
    card.querySelectorAll('.lang-slot').forEach((el) => el.classList.add('swapping'));

    // 动画中点更新内容（subscribe 会重建内部 DOM），再补一段淡入动画
    setTimeout(() => {
      store.swap();
      card.querySelectorAll('.lang-slot').forEach((el) => el.classList.add('swapping-in'));
    }, 180);
    setTimeout(() => {
      card.querySelector('.swap-btn')?.classList.remove('rotated');
      card.querySelectorAll('.lang-slot').forEach((el) =>
        el.classList.remove('swapping', 'swapping-in'));
      animating = false;
    }, 480);
  });

  // 订阅状态变化（语言选择页写回后即时更新）
  const unsubscribe = store.subscribe(render);
  card._onUnload = unsubscribe;

  return card;
}
