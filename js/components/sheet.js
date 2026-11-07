/* ============================================================
   通用底部弹层 — 语言选择 / 隐私政策 / 意见反馈共用
   样式复用 css/profile.css 的 .detail-mask / .detail-sheet
   ============================================================ */

import { icon } from './icons.js';
import { escapeHtml } from '../utils/dom.js';

/**
 * 打开底部弹层
 * @param {{title?:string, body?:string}} opt
 * @returns {{body:HTMLElement, close:Function}}
 */
export function openSheet({ title = '', body = '' }) {
  const mask = document.createElement('div');
  mask.className = 'detail-mask';

  const sheet = document.createElement('div');
  sheet.className = 'detail-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.innerHTML = `
    <div class="detail-sheet-inner">
      <div class="detail-grip"></div>
      <div class="detail-header">
        <span class="sheet-title">${escapeHtml(title)}</span>
        <button class="detail-close" aria-label="关闭">${icon('close', 18)}</button>
      </div>
      <div class="sheet-body">${body}</div>
    </div>`;

  document.body.appendChild(mask);
  document.body.appendChild(sheet);

  // 先读一次布局属性，强制把「初始态」落地，再同步加 is-show/is-open 触发过渡。
  // 不用 requestAnimationFrame：在没有渲染帧的环境（后台标签页、无头浏览器、
  // 部分 WebView）rAF 不会回调，弹层会一直停在屏外无法使用。
  void sheet.offsetHeight;
  mask.classList.add('is-show');
  sheet.classList.add('is-open');

  const close = () => {
    mask.classList.remove('is-show');
    sheet.classList.remove('is-open');
    setTimeout(() => { mask.remove(); sheet.remove(); }, 280);
  };

  sheet.querySelector('.detail-close').addEventListener('click', close);
  mask.addEventListener('click', close);

  return { sheet, body: sheet.querySelector('.sheet-body'), close };
}
