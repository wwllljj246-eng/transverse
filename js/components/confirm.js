/* ============================================================
   二次确认弹窗 — 全局通用（此前在 profile.js / transcript.js 各写一份）
   样式复用 css/profile.css 的 .confirm-*
   ============================================================ */

import { escapeHtml } from '../utils/dom.js';

/**
 * 弹出确认框
 * @param {{title:string, message:string, okText?:string, cancelText?:string,
 *          danger?:boolean, onConfirm:Function}} opt
 * @returns {() => void} 关闭函数
 */
export function showConfirm({ title, message, okText = '确认清空', cancelText = '取消', onConfirm }) {
  const mask = document.createElement('div');
  mask.className = 'confirm-mask';
  mask.innerHTML = `
    <div class="confirm-dialog" role="dialog" aria-modal="true">
      <h3 class="confirm-title">${escapeHtml(title)}</h3>
      <p class="confirm-msg">${escapeHtml(message)}</p>
      <div class="confirm-actions">
        <button class="confirm-btn confirm-cancel">${escapeHtml(cancelText)}</button>
        <button class="confirm-btn confirm-ok">${escapeHtml(okText)}</button>
      </div>
    </div>`;
  document.body.appendChild(mask);

  // 先读一次布局属性，强制把「初始态」落地，再同步加 is-show 触发过渡。
  // 不用 requestAnimationFrame：在没有渲染帧的环境（后台标签页、无头浏览器、
  // 部分 WebView）rAF 不会回调，弹窗会一直停在 opacity:0 无法使用。
  void mask.offsetHeight;
  mask.classList.add('is-show');

  const close = () => {
    mask.classList.remove('is-show');
    setTimeout(() => mask.remove(), 200);
  };

  mask.querySelector('.confirm-cancel').addEventListener('click', close);
  mask.querySelector('.confirm-ok').addEventListener('click', () => {
    onConfirm();
    close();
  });
  mask.addEventListener('click', (e) => { if (e.target === mask) close(); });

  return close;
}
